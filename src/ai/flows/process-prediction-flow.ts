'use server';
/**
 * @fileOverview AI flow to extract multiple structured betting picks from raw text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SelectionSchema = z.object({
  match: z.string().describe('The teams playing, e.g., "Man City vs Chelsea"'),
  league: z.string().optional().describe('The league or tournament name'),
  pick: z.string().describe('The actual betting tip, e.g., "Home Win", "Over 2.5"'),
  odds: z.string().optional().describe('The odds for this specific selection'),
  time: z.string().optional().describe('The match start time if mentioned'),
});

const BookingCodeSchema = z.object({
  platform: z.string().describe('The name of the betting platform (e.g., betway, sportybet, bet9ja, msport)'),
  code: z.string().describe('The alphanumeric booking code'),
  odds: z.string().optional().describe('The odds for this specific code if mentioned'),
});

const PredictionOutputSchema = z.object({
  title: z.string().describe('A concise title for the ticket (e.g., "Weekend Multi", "5-Odds Banker")'),
  selections: z.array(SelectionSchema).describe('The list of all matches/picks in this ticket'),
  total_odds: z.string().optional().describe('The cumulative odds for the entire ticket'),
  is_premium: z.boolean().describe('Whether this appears to be a VIP or premium ticket'),
  booking_codes: z.array(BookingCodeSchema).optional().describe('Any booking codes found in the text'),
  content: z.string().optional().describe('Additional analysis or summary extracted from the text'),
});

export type PredictionOutput = z.infer<typeof PredictionOutputSchema>;

const processPredictionPrompt = ai.definePrompt({
  name: 'processPredictionPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: z.object({ rawText: z.string() }) },
  output: { schema: PredictionOutputSchema },
  prompt: `You are a sports betting expert. Your task is to extract structured betting data from raw text snippets, often representing a "bet slip" or "accumulator ticket".

  Context for formatting:
  The input might look like this:
  "Sharing Code 9FL4WS
  28/02/2026 23:15
  43932 13/06/2026 01:00
  USA - Paraguay
  prematch Home"

  Instructions:
  1. Identify ALL matches mentioned. In the example above: "USA - Paraguay" is the match, "Home" is the pick.
  2. Extract the match date/time if available.
  3. Extract "Sharing Code" or "Booking Code".
  4. Correct minor spelling errors in team names.
  5. If the text mentions "VIP", "Premium", or high odds, mark is_premium as true.
  6. Provide a concise summary title.

  Raw Text:
  {{{rawText}}}`,
});

export async function processPrediction(rawText: string): Promise<PredictionOutput> {
  const { output } = await processPredictionPrompt({ rawText });
  if (!output) throw new Error('Failed to extract prediction data');
  return output;
}
