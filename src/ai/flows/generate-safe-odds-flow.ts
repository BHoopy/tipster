'use server';

import { z } from 'genkit';

const SelectionSchema = z.object({
    home_team: z.string(),
    away_team: z.string(),
    pick: z.string(),
    odds: z.string(),
    league: z.string(),
    time: z.string(),
    match_date: z.string(),
    reasoning: z.string().optional(),
});

const AIOutputSchema = z.object({
    title: z.string(),
    selections: z.array(SelectionSchema),
    total_odds: z.string(),
});

export type AISelection = z.infer<typeof SelectionSchema>;
export type AIOffsOutput = z.infer<typeof AIOutputSchema>;

export async function generateSafeOdds(matchesContext: string): Promise<AIOffsOutput> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('API Key missing');

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
                    "content": `You are a professional betting analyst specializing in "Safe Odds" (Low-risk accumulators).
          Your goal is to generate a high-probability betting ticket from today's top matches.
          
          Guidelines:
          1. Use ONLY the provided context of real-time matches and odds.
          2. Prioritize "Safe" markets: Home Win (for strong favorites > 1.20), Over 1.5 Goals, Double Chance (1X/X2).
          3. Odds should be realistic based on the context (e.g., Real Madrid win ~1.30, 1X ~1.06).
          4. Total accumulated odds should target 20.00+. If you don't have enough matches to reach 20 in the context, aim for the highest possible while remaining "safe".
          5. Match Date: YYYY-MM-DD. Time: HH:MM.
          6. Reasoning: Provide a specific reason based on team strength or trends.
          
          Return ONLY valid JSON matching this schema:
          {
            "title": "20+ Odds AI Safe Accumulator",
            "selections": [
              { "home_team": "...", "away_team": "...", "pick": "...", "odds": "...", "league": "...", "time": "...", "match_date": "...", "reasoning": "..." }
            ],
            "total_odds": "calculated total"
          }`
                },
                {
                    "role": "user",
                    "content": `Generate a safe odds accumulator based on this real-time match data and market trends:\n\n${matchesContext}`
                }
            ],
            "response_format": { "type": "json_object" }
        })
    });

    if (!response.ok) throw new Error("AI request failed");
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content) as AIOffsOutput;
}
