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
  
  // Pattern 1: Multi-line block (Pick \n Match \n Market+Odds)
  // Example: 
  // Home
  // USA v Paraguay
  // 1X22.07
  for (let i = 0; i < lines.length - 2; i++) {
    const line1 = lines[i]; // Pick (e.g. Home)
    const line2 = lines[i+1]; // Match (e.g. USA v Paraguay)
    const line3 = lines[i+2]; // Market + Odds (e.g. 1X22.07)

    if (line2.includes(' v ') || line2.includes(' - ')) {
      // Regex to detect common markets and extract only the odds at the end
      // This prevents "1X2" or "Double Chance" from inflating the odds value
      const marketPattern = /^(1X2|Double Chance|Over\/Under|GG\/NG|Home\/Away|Draw No Bet)?(\d+\.\d+)$/i;
      const oddsMatch = line3.match(marketPattern);
      
      if (oddsMatch) {
        selections.push({
          match: line2,
          pick: line1,
          odds: oddsMatch[2], // Group 2 is the actual numeric odds
          league: "Detected Match",
          time: "Today",
          result: 'pending'
        });
        i += 2; // Skip processed lines
      } else {
        // Fallback: search for any float at the very end of the line
        const simpleOdds = line3.match(/(\d+\.\d+)$/);
        if (simpleOdds) {
          selections.push({
            match: line2,
            pick: line1,
            odds: simpleOdds[1],
            league: "Detected Match",
            time: "Today",
            result: 'pending'
          });
          i += 2;
        }
      }
    }
  }

  // Pattern 2: Single line with " - " or " v "
  if (selections.length === 0) {
    lines.forEach(line => {
      const matchPattern = /(.+?)(?:\s[v-]\s)(.+?)\s(?:prematch\s)?(.+)/i;
      const parts = line.match(matchPattern);
      if (parts) {
        selections.push({
          match: `${parts[1].trim()} vs ${parts[2].trim()}`,
          pick: parts[3].trim(),
          odds: "",
          league: "Detected",
          time: "Today",
          result: 'pending'
        });
      }
    });
  }

  if (selections.length > 0) {
    return {
      title: `${selections.length} Games Accumulator`,
      selections,
      total_odds: "",
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
          - Markets like '1X2', 'Double Chance', or 'Over/Under' are often prefixed to the odds (e.g., '1X22.07' means odds 2.07 for the 1X2 market). 
          - Do NOT include the '1X2' digits in the odds field.
          - Identify the match, pick/market, and clean numeric odds.
          
          Return only valid JSON matching this schema: 
          { 
            title: string, 
            selections: [{match: string, pick: string, odds: string, league: string}], 
            total_odds: string, 
            is_premium: boolean, 
            booking_codes: [{platform: string, code: string}] 
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
  return JSON.parse(content) as PredictionOutput;
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
