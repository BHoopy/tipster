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
  model: 'googleai/gemini-2.0-flash',
  input: { schema: z.object({ rawText: z.string() }) },
  output: { schema: PredictionOutputSchema },
  prompt: `You are a sports betting expert. Your task is to extract structured betting data from raw text snippets, often representing a "bet slip" or "accumulator ticket".

  Context for formatting:
  The input often contains multiple matches and markets. Sometimes the pick or market appears immediately BEFORE or AFTER the match name.
  
  Example Input:
  "Home
  USA v Paraguay
  1X22.07
  Home or Away
  Haiti v Scotland
  Double Chance1.18"

  Instructions:
  1. Identify ALL matches mentioned (e.g., USA vs Paraguay).
  2. Extract the "Pick" or "Market" associated with each match (e.g., "Home", "Home or Away", "Over 2.5").
  3. Extract the Odds for each selection (e.g., "2.07", "1.18").
  4. Infer the League or Tournament for each match if possible based on the team names.
  5. Correct team names and league names for professional display.
  6. If the text mentions "VIP", "Premium", or "Banker", mark is_premium as true.
  7. Generate a catchy Title for the ticket.

  Raw Text:
  {{{rawText}}}`,
});

export async function processPrediction(rawText: string): Promise<PredictionOutput> {
  try {
    const { output } = await processPredictionPrompt({ rawText });
    if (!output) throw new Error('Failed to extract prediction data');
    return output;
  } catch (error: any) {
    console.error('Genkit Error:', error);
    throw new Error(error.message || 'AI Processing failed. Check your API Key.');
  }
}
