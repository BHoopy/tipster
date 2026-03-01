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
 * Handles patterns like "Team A v Team B", "Home Win", and "2.07" odds.
 */
function robustParseBetslip(text: string): PredictionOutput | null {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const selections: any[] = [];
  
  // Pattern 1: Multi-line block (Pick \n Match \n Market+Odds)
  // Example: Home \n USA v Paraguay \n 1X22.07
  for (let i = 0; i < lines.length - 2; i++) {
    const line1 = lines[i];
    const line2 = lines[i+1];
    const line3 = lines[i+2];

    if (line2.includes(' v ') || line2.includes(' - ')) {
      // Check if line3 contains odds (usually numbers at the end)
      const oddsMatch = line3.match(/(\d+\.\d+)$/);
      if (oddsMatch) {
        selections.push({
          match: line2,
          pick: line1,
          odds: oddsMatch[1],
          league: "Detected Match",
          time: "Today",
          result: 'pending'
        });
        i += 2; // Skip processed lines
      }
    }
  }

  // Pattern 2: Single line with " - " or " v "
  // Example: "USA - Paraguay prematch Home"
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
      "HTTP-Referer": "https://leemantips.com", // Optional, for OpenRouter tracking
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": "google/gemini-2.0-flash-001",
      "messages": [
        {
          "role": "system",
          "content": "You are a betting expert. Extract structured JSON from betting slips. Return only valid JSON matching this schema: { title: string, selections: [{match: string, pick: string, odds: string, league: string}], total_odds: string, is_premium: boolean, booking_codes: [{platform: string, code: string}] }"
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
