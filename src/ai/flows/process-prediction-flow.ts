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
  input: { schema: z.object({ rawText: z.string() }) },
  output: { schema: PredictionOutputSchema },
  config: {
    model: 'googleai/gemini-1.5-flash',
  },
  prompt: `You are a sports betting expert. Your task is to extract structured betting data from raw text snippets, often representing a "bet slip" or "accumulator ticket".

  Instructions:
  1. Identify ALL matches mentioned in the text. For each match, extract teams, league, pick, odds, and time.
  2. Extract the "Sharing Code" or "Booking Code" for various platforms (SportyBet, Betway, etc.).
  3. Correct any minor spelling errors in team names or leagues.
  4. Determine if the ticket is labeled as "VIP", "Premium", or "Fixed".
  5. Provide a summary title based on the content.
  6. If it's a bet slip reservation (like the sample below), extract the matches accurately.

  Raw Text:
  {{{rawText}}}`,
});

export async function processPrediction(rawText: string): Promise<PredictionOutput> {
  const { output } = await processPredictionPrompt({ rawText });
  if (!output) throw new Error('Failed to extract prediction data');
  return output;
}
