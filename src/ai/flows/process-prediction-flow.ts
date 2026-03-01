'use server';
/**
 * @fileOverview AI flow to extract multiple structured betting picks from raw text.
 * Uses a lookup tool to verify league information.
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

/**
 * Mock Tool to simulate a football API lookup for league and schedule.
 * In a production app, this would call API-Football or similar.
 */
const getMatchDetailsTool = ai.defineTool(
  {
    name: 'getMatchDetailsTool',
    description: 'Searches for the official league name and match time for two teams playing today.',
    inputSchema: z.object({ matchName: z.string() }),
    outputSchema: z.object({ league: z.string(), time: z.string() }),
  },
  async (input) => {
    // This is where you would integrate your Football API
    console.log(`Simulated API Search for: ${input.matchName}`);
    return {
      league: "Pro League", // Default placeholder if not found
      time: "Scheduled Today",
    };
  }
);

const processPredictionPrompt = ai.definePrompt({
  name: 'processPredictionPrompt',
  model: 'googleai/gemini-1.5-flash',
  tools: [getMatchDetailsTool],
  input: { schema: z.object({ rawText: z.string() }) },
  output: { schema: PredictionOutputSchema },
  prompt: `You are a sports betting expert. Your task is to extract structured betting data from raw text.
  
  Format instructions:
  - Input often includes a list of matches, codes, and picks.
  - USE the getMatchDetailsTool to verify or find the LEAGUE and TIME for each match found.
  - If the pick appears before the teams (e.g., "Home Win USA v Paraguay"), correctly identify the teams and the pick.
  - Return a structured array of selections.

  Raw Text:
  {{{rawText}}}`,
});

export async function processPrediction(rawText: string): Promise<PredictionOutput> {
  try {
    const { output } = await processPredictionPrompt({ rawText });
    if (!output) throw new Error('Failed to extract prediction data');
    return output;
  } catch (error: any) {
    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('AI Quota exceeded. Please wait a minute or fill the form manually.');
    }
    console.error('Genkit Error:', error);
    throw new Error(error.message || 'AI Processing failed.');
  }
}
