
'use server';
/**
 * @fileOverview AI flow to extract structured betting prediction data from raw text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BookingCodeSchema = z.object({
  platform: z.string().describe('The name of the betting platform (e.g., betway, sportybet, bet9ja, msport)'),
  code: z.string().describe('The alphanumeric booking code'),
  odds: z.string().optional().describe('The odds for this specific code if mentioned'),
});

const PredictionOutputSchema = z.object({
  title: z.string().describe('A concise title for the prediction'),
  match: z.string().describe('The teams playing, e.g., "Man City vs Chelsea"'),
  league: z.string().optional().describe('The league or tournament name'),
  pick: z.string().describe('The actual betting tip, e.g., "Home Win", "Over 2.5"'),
  odds: z.string().optional().describe('The main odds for this pick'),
  time: z.string().optional().describe('The match start time if mentioned'),
  content: z.string().optional().describe('A brief analysis or extra notes extracted from the text'),
  is_premium: z.boolean().describe('Whether this appears to be a VIP or premium pick'),
  booking_codes: z.array(BookingCodeSchema).optional().describe('Any booking codes found in the text'),
});

export type PredictionOutput = z.infer<typeof PredictionOutputSchema>;

const processPredictionPrompt = ai.definePrompt({
  name: 'processPredictionPrompt',
  input: { schema: z.object({ rawText: z.string() }) },
  output: { schema: PredictionOutputSchema },
  prompt: `You are a sports betting expert. Your task is to extract structured betting data from raw text snippets.
  
  Instructions:
  1. Identify the match (teams involved).
  2. Identify the league or tournament if mentioned.
  3. Extract the primary "pick" or "tip" (e.g., "Away Win", "GG", "Draw").
  4. Extract the odds and match time if available.
  5. Identify if the text mentions this is a "VIP", "Premium", or "Paid" pick.
  6. Extract all booking codes. Platforms usually include SportyBet, Betway, Bet9ja, 1xBet, etc.
  7. Correct any minor spelling errors in team names or leagues.
  8. If multiple matches are mentioned, focus on the most prominent one or provide a summary title.
  
  Raw Text:
  {{{rawText}}}`,
});

export async function processPrediction(rawText: string): Promise<PredictionOutput> {
  const { output } = await processPredictionPrompt({ rawText });
  if (!output) throw new Error('Failed to extract prediction data');
  return output;
}
