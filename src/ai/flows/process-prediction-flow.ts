'use server';
/**
 * @fileOverview OpenRouter AI Betting Pick Processor.
 * Uses OpenRouter AI to extract structured betting data from raw text.
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
1. Parse team names - identify home team and away team from the text (e.g., "Man City vs Chelsea" means home=Man City, away=Chelsea)
2. Normalize market names to standard format:
   - Home win = 1, Draw = X, Away win = 2
   - Double chance = 1X, 12, X2
   - Over/Under goals = Over 1.5, Over 2.5, Under 2.5, etc.
   - Both Teams To Score = BTTS Yes, BTTS No
   - GG = Goal/Goal, NG = No Goal
   - Half time = 1HT, XHT, 2HT
   - Corners = Corners Over 7.5, Corners Over 9.5
3. Extract individual odds for each selection
4. Look for "Total Odds", "Accumulated", "Total @", "Odds Sum" in the text - if found, use that value
5. If no total odds found, calculate it by multiplying all individual odds
6. Extract any booking codes found in the text with their platform

Return only valid JSON matching this schema:
{
  "title": string,
  "selections": [{"home_team": string, "away_team": string, "pick": string, "odds": string, "league": string, "time": string, "match_date": string}],
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

  // Calculate total odds if not found or invalid
  if (!result.total_odds && result.selections?.length > 0) {
    result.total_odds = calculateTotalOdds(result.selections);
  }

  return result;
}

export async function processPrediction(rawText: string): Promise<PredictionOutput> {
  try {
    return await openRouterExtract(rawText);
  } catch (error: any) {
    console.error('Processing Error:', error);
    throw new Error(error.message || 'Failed to process prediction data.');
  }
}
