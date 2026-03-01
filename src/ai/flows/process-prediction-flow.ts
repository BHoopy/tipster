'use server';
/**
 * @fileOverview Hybrid Betting Pick Processor.
 * Uses a robust regex-based parser for common betslip formats and 
 * falls back to OpenRouter AI for complex text extraction.
 */

import { z } from 'genkit';

const SelectionSchema = z.object({
  match: z.string().describe('The teams playing, e.g., "Man City vs Chelsea"'),
  league: z.string().optional().describe('The league or tournament name'),
  pick: z.string().describe('The actual betting tip, e.g., "Home Win", "Over 2.5"'),
  odds: z.string().optional().describe('The odds for this specific selection'),
  time: z.string().optional().describe('The match start time if mentioned'),
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

const OPENROUTER_API_KEY = "sk-or-v1-placeholder";

/**
 * Robust Regex Parser for predictable betslip formats.
 * Handles patterns like "Team A v Team B", "Home Win", and "1X22.07" odds.
 */
function robustParseBetslip(text: string): PredictionOutput | null {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const selections: any[] = [];
  let detectedTotalOdds = "";

  // 1. Look for explicit Total Odds in text first
  const totalOddsPattern = /(?:Total\s*Odds|Accumulated|Total\s*@|Odds\s*Sum|Total)\s*[:@]?\s*(\d+\.\d+)/i;
  const totalMatch = text.match(totalOddsPattern);
  if (totalMatch) {
    detectedTotalOdds = totalMatch[1];
  }
  
  // 2. Parse matches and individual odds
  // Pattern 1: Multi-line block (Pick \n Match \n Market+Odds)
  for (let i = 0; i < lines.length - 2; i++) {
    const line1 = lines[i]; // Potential Pick (e.g. Home)
    const line2 = lines[i+1]; // Potential Match (e.g. USA v Paraguay)
    const line3 = lines[i+2]; // Potential Market + Odds (e.g. 1X22.07)

    if (line2.includes(' v ') || line2.includes(' - ')) {
      // Improved regex to separate market headers from numeric odds
      // Specifically handles the user's "1X22.07" case where "2" is part of the market name
      const marketPattern = /^(1X2|12|1X|X2|Double\s*Chance|Over\/Under|GG\/NG|Home\/Away|Draw\s*No\s*Bet|Over|Under)?\s*(\d+\.\d+)$/i;
      const oddsMatch = line3.match(marketPattern);
      
      if (oddsMatch) {
        selections.push({
          match: line2,
          pick: line1,
          odds: oddsMatch[2], // Group 2 is the actual numeric odds (e.g. 2.07)
          league: "Detected Match",
          time: "Today",
          result: 'pending'
        });
        i += 2; 
      }
    }
  }

  // Fallback Pattern: Single line with " - " or " v "
  if (selections.length === 0) {
    lines.forEach(line => {
      const matchPattern = /(.+?)(?:\s[v-]\s)(.+?)\s(?:prematch\s)?(.+)/i;
      const parts = line.match(matchPattern);
      if (parts) {
        const pickAndOdds = parts[3].trim();
        const oddsOnly = pickAndOdds.match(/(\d+\.\d+)$/);
        selections.push({
          match: `${parts[1].trim()} vs ${parts[2].trim()}`,
          pick: pickAndOdds.replace(/(\d+\.\d+)$/, '').trim(),
          odds: oddsOnly ? oddsOnly[1] : "",
          league: "Detected",
          time: "Today",
          result: 'pending'
        });
      }
    });
  }

  if (selections.length > 0) {
    // 3. Calculate total odds if not explicitly found
    if (!detectedTotalOdds) {
      let calc = 1.0;
      let hasValidOdds = false;
      selections.forEach(s => {
        const val = parseFloat(s.odds);
        if (!isNaN(val) && val > 0) {
          calc *= val;
          hasValidOdds = true;
        }
      });
      if (hasValidOdds) detectedTotalOdds = calc.toFixed(2);
    }

    return {
      title: `${selections.length} Games Accumulator`,
      selections,
      total_odds: detectedTotalOdds,
      is_premium: false,
      booking_codes: [],
      content: "Automatically parsed from text slip."
    };
  }

  return null;
}

/**
 * OpenRouter AI Extraction Fallback.
 */
async function openRouterExtract(rawText: string): Promise<PredictionOutput> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://leemantips.com",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": "google/gemini-2.0-flash-001",
      "messages": [
        {
          "role": "system",
          "content": `You are a betting expert. Extract structured JSON from betting slips. 
          
          CRITICAL INSTRUCTIONS:
          - Markets like '1X2' are often prefixes to odds (e.g., '1X22.07' means odds 2.07 for the 1X2 market). 
          - NEVER include market identifiers (like the '2' in '1X2') in the numeric odds field.
          - Look for 'Total Odds' or 'Accumulated' in the text. If missing, calculate it by multiplying individual selection odds.
          
          Return only valid JSON matching this schema: 
          { 
            "title": string, 
            "selections": [{"match": string, "pick": string, "odds": string, "league": string}], 
            "total_odds": string, 
            "is_premium": boolean, 
            "booking_codes": [{"platform": string, "code": string}],
            "content": string 
          }`
        },
        {
          "role": "user",
          "content": `Extract betting data from this text: \n\n${rawText}`
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

  // Final validation/calculation for total_odds if AI missed it
  if (!result.total_odds && result.selections?.length > 0) {
    let calc = 1.0;
    let hasValidOdds = false;
    result.selections.forEach(s => {
      const val = parseFloat(s.odds || "");
      if (!isNaN(val) && val > 0) {
        calc *= val;
        hasValidOdds = true;
      }
    });
    if (hasValidOdds) result.total_odds = calc.toFixed(2);
  }

  return result;
}

export async function processPrediction(rawText: string): Promise<PredictionOutput> {
  try {
    // 1. Try Robust Local Parser first (Instant, No API Cost)
    const localResult = robustParseBetslip(rawText);
    if (localResult) return localResult;

    // 2. Fallback to OpenRouter AI
    return await openRouterExtract(rawText);
  } catch (error: any) {
    console.error('Processing Error:', error);
    throw new Error(error.message || 'Failed to process prediction data.');
  }
}
