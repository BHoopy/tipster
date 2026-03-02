'use server';
/**
 * @fileOverview OpenRouter AI Betting Pick Processor.
 * Uses OpenRouter AI to extract structured betting data from raw text.
 * Uses AI knowledge to identify leagues for matches.
 */

import { z } from 'genkit';

const SelectionSchema = z.object({
  home_team: z.string().describe('The home team name'),
  away_team: z.string().describe('The away team name'),
  pick: z.string().describe('The betting pick (e.g., 1, X, 2, Over 1.5, BTTS Yes, etc.)'),
  odds: z.string().describe('The odds for this selection'),
  league: z.string().optional().describe('The league or tournament name'),
  time: z.string().optional().describe('The match start time'),
  match_date: z.string().optional().describe('The match date in YYYY-MM-DD format'),
  result: z.enum(['win', 'lose', 'pending']).default('pending'),
});

const BookingCodeSchema = z.object({
  platform: z.string().describe('The name of the betting platform'),
  code: z.string().describe('The alphanumeric booking code'),
  odds: z.string().optional().describe('The odds for this specific code'),
});

const PredictionOutputSchema = z.object({
  title: z.string().describe('A concise title for the ticket'),
  selections: z.array(SelectionSchema).describe('The list of matches in this ticket'),
  total_odds: z.string().optional().describe('The cumulative odds'),
  is_premium: z.boolean().describe('Whether this is a VIP ticket'),
  booking_codes: z.array(BookingCodeSchema).optional().describe('Any booking codes found'),
  content: z.string().optional().describe('Additional analysis or summary'),
});

export type PredictionOutput = z.infer<typeof PredictionOutputSchema>;

const MARKET_MAPPINGS: Record<string, string> = {
  'home win': '1', 'home': '1', '1': '1', 'home win full time': '1',
  'draw': 'X', 'x': 'X', 'draw full time': 'X',
  'away win': '2', 'away': '2', '2': '2', 'away win full time': '2',
  'double chance home draw': '1X', '1x': '1X', 'double chance 1x': '1X',
  'double chance home away': '12', '12': '12', 'double chance 12': '12',
  'double chance draw away': 'X2', 'x2': 'X2', 'double chance x2': 'X2',
  'over 0.5': 'Over 0.5', 'over 0.5 goals': 'Over 0.5',
  'over 1.5': 'Over 1.5', 'over 1.5 goals': 'Over 1.5', 'over one point five': 'Over 1.5',
  'over 2.5': 'Over 2.5', 'over 2.5 goals': 'Over 2.5', 'over two point five': 'Over 2.5',
  'over 3.5': 'Over 3.5', 'over 3.5 goals': 'Over 3.5',
  'under 2.5': 'Under 2.5', 'under 2.5 goals': 'Under 2.5',
  'under 3.5': 'Under 3.5', 'under 3.5 goals': 'Under 3.5',
  'both teams to score yes': 'BTTS Yes', 'btts yes': 'BTTS Yes', 'gg': 'GG', 'goal goal': 'GG',
  'both teams to score no': 'BTTS No', 'btts no': 'BTTS No', 'ng': 'NG', 'no goal': 'NG',
  'home and over 1.5': '1 & Over 1.5', '1 and over 1.5': '1 & Over 1.5',
  'away and over 1.5': '2 & Over 1.5', '2 and over 1.5': '2 & Over 1.5',
  'first half home': '1HT', '1ht': '1HT', 'half time home': '1HT',
  'first half draw': 'XHT', 'xht': 'XHT', 'half time draw': 'XHT',
  'first half away': '2HT', '2ht': '2HT', 'half time away': '2HT',
  'corners over 7.5': 'Corners Over 7.5', 'corners over 7': 'Corners Over 7.5',
  'corners over 9.5': 'Corners Over 9.5', 'corners over 9': 'Corners Over 9.5',
};

function normalizeMarket(pickText: string): string {
  const normalized = pickText.toLowerCase().trim();
  return MARKET_MAPPINGS[normalized] || pickText;
}

function calculateTotalOdds(selections: { odds: string }[]): string {
  let total = 1.0;
  let hasValidOdds = false;

  for (const sel of selections) {
    const val = parseFloat(sel.odds);
    if (!isNaN(val) && val > 0) {
      total *= val;
      hasValidOdds = true;
    }
  }

  return hasValidOdds ? total.toFixed(2) : '';
}

async function findLeaguesForMatches(selections: Array<{ home_team: string; away_team: string; league?: string; match_date?: string }>): Promise<string[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return selections.map(() => '');

  const matchesToSearch = selections.filter(s => !s.league && s.home_team && s.away_team);
  if (matchesToSearch.length === 0) return selections.map(s => s.league || '');

  const matchesText = matchesToSearch.map((m, i) =>
    `${i + 1}. ${m.home_team} vs ${m.away_team} (${m.match_date || 'upcoming'})`
  ).join('\n');

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://leemantips.com",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.0-flash-001",
        "messages": [
          {
            "role": "system",
            "content": `You are a football expert. For each match listed, identify the league/competition it belongs to.
            
For matches around ${new Date().toISOString().split('T')[0]} to the next few days, use your knowledge of upcoming fixtures.
Common leagues: Premier League, Championship, La Liga, Segunda Division, Serie A, Serie B, Bundesliga, 2. Bundesliga, Ligue 1, Ligue 2, Champions League, Europa League, Conference League, Primeira Liga, Segunda Liga, Eredivisie, Belgian Pro League, Swiss Super League, Austrian Bundesliga, Turkish Super Lig, Greek Super League, Championship (England), League One, League Two, FA Cup, League Cup, Copa del Rey, Coppa Italia, DFB-Pokal, Coupe de France, etc.
Also include lower leagues and cups from Uruguay, Chile, Argentina, Brazil, Paraguay, Colombia, Mexico, USA, etc.

Return ONLY a JSON array of league names (one per match in order), like:
["Premier League", "La Liga", "Serie A"]

If you're uncertain about a league, make your best guess based on the teams and date.`
          },
          {
            "role": "user",
            "content": `Identify leagues for:\n${matchesText}`
          }
        ],
        "response_format": { "type": "json_object" }
      })
    });

    if (!response.ok) return selections.map(() => '');

    const data = await response.json();
    const content = data.choices[0].message.content;
    const leagues = JSON.parse(content);

    if (Array.isArray(leagues)) return leagues;
    if (leagues.leagues) return leagues.leagues;

    return selections.map(() => '');
  } catch (error) {
    console.error('League search error:', error);
    return selections.map(() => '');
  }
}

function parseDateTime(dateStr: string, timeStr: string): { match_date: string; time: string } {
  if (!dateStr) return { match_date: '', time: '' };

  // If already in YYYY-MM-DD format, return it as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { match_date: dateStr, time: timeStr || '' };
  }

  // Parse DD/MM/YYYY or DD-MM-YYYY
  const dateMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dateMatch) {
    let day = dateMatch[1].padStart(2, '0');
    let month = dateMatch[2].padStart(2, '0');
    let year = dateMatch[3];
    if (year.length === 2) {
      year = `20${year}`;
    }
    return { match_date: `${year}-${month}-${day}`, time: timeStr || '' };
  }

  return { match_date: dateStr, time: timeStr || '' };
}

function extractSharingCode(text: string): string | null {
  const match = text.match(/(?:sharing\s*code|code)[:\s]*([A-Z0-9]{6,10})/i);
  return match ? match[1] : null;
}

async function openRouterExtract(rawText: string): Promise<PredictionOutput> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://leemantips.com",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": "google/gemini-2.0-flash-001",
      "messages": [
        {
          "role": "system",
          "content": `You are a betting expert. Extract structured JSON from betting slips text.
          
IMPORTANT INSTRUCTIONS:
1. Parse team names - identify home team and away team from the text (e.g., "Man City vs Chelsea" or "Deportivo Maldonado - CA Juventud de Las Piedras" means home=Deportivo Maldonado, away=CA Juventud de Las Piedras)
2. When teams are separated by " - " (dash), the left side is home team, right side is away team
3. Normalize market names to standard format:
   - Home win = 1, Draw = X, Away win = 2
   - Double chance = 1X, 12, X2
   - Over/Under goals = Over 1.5, Over 2.5, Under 2.5, etc.
   - Both Teams To Score = BTTS Yes, BTTS No
   - GG = Goal/Goal, NG = No Goal
   - Half time = 1HT, XHT, 2HT
   - Corners = Corners Over 7.5, Corners Over 9.5
4. Extract date and time from the text when available:
   - Format like "01/03/2026 22:33" or "02/03/2026 23:00" - ALWAYS parse as DD/MM/YYYY HH:MM
   - IMPORTANT: The current date is Sunday, March 1st, 2026. Use 2026 as the year.
   - Convert to ISO format: match_date = YYYY-MM-DD, time = HH:MM
   - If date is not provided but looks like it's in the next few days, you can leave empty string or use 2026-03-01 / 2026-03-02 as appropriate.
5. Extract individual odds for each selection if available
6. For the title, generate a concise accumulator title like "X Odds Accumulator" or "X Odds Daily Ticket" where X is the number of games. DO NOT include team names in the title.
7. Look for "Total Odds", "Accumulated", "Total @", "Odds Sum" in the text - if found, use that value
8. If no total odds found, calculate it by multiplying all individual odds
9. Extract any booking codes (sharing codes) found in the text
10. Identify the league from the text if mentioned. Common leagues: Premier League, Champions League, La Liga, Serie A, Bundesliga, Ligue 1, FA Cup, etc. If not mentioned, leave empty string.

Return only valid JSON matching this schema:
{
  "title": string (e.g., "5 Odds Accumulator", "10 Odds Daily Ticket"),
  "selections": [{"home_team": string, "away_team": string, "pick": string, "odds": string, "league": string (if mentioned, otherwise empty string), "time": string (HH:MM format), "match_date": string (YYYY-MM-DD format)}],
  "total_odds": string,
  "is_premium": boolean,
  "booking_codes": [{"platform": string, "code": string, "odds": string}],
  "content": string
}`
        },
        {
          "role": "user",
          "content": `Extract betting data from this text:\n\n${rawText}`
        }
      ],
      "response_format": { "type": "json_object" }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "OpenRouter Request Failed");
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const result = JSON.parse(content) as PredictionOutput;

  // Normalize markets in selections
  if (result.selections?.length) {
    result.selections = result.selections.map(s => ({
      ...s,
      pick: normalizeMarket(s.pick)
    }));
  }

  // Generate proper title if it contains team names or is invalid
  const selectionCount = result.selections?.length || 0;
  const hasTeamNameInTitle = result.title?.includes(' vs ') || result.title?.includes(' - ');
  if (hasTeamNameInTitle || !result.title) {
    result.title = `${selectionCount} Odds Accumulator`;
  }

  // Calculate total odds if not found or invalid
  if (!result.total_odds && result.selections?.length > 0) {
    result.total_odds = calculateTotalOdds(result.selections);
  }

  return result;
}

export async function processPrediction(rawText: string): Promise<PredictionOutput> {
  try {
    const sharingCode = extractSharingCode(rawText);
    const result = await openRouterExtract(rawText);

    if (result.selections?.length) {
      const leagues = await findLeaguesForMatches(
        result.selections.map(s => ({
          home_team: s.home_team,
          away_team: s.away_team,
          league: s.league,
          match_date: s.match_date,
        }))
      );

      result.selections = result.selections.map((s, idx) => {
        const parsed = parseDateTime(s.match_date || '', s.time || '');
        return {
          ...s,
          match_date: parsed.match_date || s.match_date || '',
          time: parsed.time || s.time || '',
          league: s.league || leagues[idx] || '',
        };
      });
    }

    if (sharingCode && !result.booking_codes?.length) {
      result.booking_codes = [{ platform: 'betway', code: sharingCode, odds: '' }];
    }

    return result;
  } catch (error: any) {
    console.error('Processing Error:', error);
    throw new Error(error.message || 'Failed to process prediction data.');
  }
}
