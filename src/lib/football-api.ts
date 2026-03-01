'use server';

const FOOTBALL_API_BASE = 'https://api.football-data.org/v4';

export interface FootballMatch {
  homeTeam: string;
  awayTeam: string;
  league: string;
  leagueId: number;
  date: string;
  time: string;
  utcDate: string;
}

export interface FootballApiResponse {
  matches: Array<{
    homeTeam: { name: string };
    awayTeam: { name: string };
    competition: { name: string; id: number };
    league?: { name: string; id: number };
    utcDate: string;
    status: string;
  }>;
}

function getApiKey(): string {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) {
    throw new Error('FOOTBALL_API_KEY not configured');
  }
  return key;
}

function normalizeTeamName(name: string): string {
  return name.toLowerCase().trim()
    .replace(/fc$/, '')
    .replace(/cf$/, '')
    .replace(/sc$/, '')
    .replace(/ac$/, '')
    .replace(/vs/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function teamsMatch(apiHome: string, apiAway: string, inputHome: string, inputAway: string): boolean {
  const normalizedHome = normalizeTeamName(inputHome);
  const normalizedAway = normalizeTeamName(inputAway);
  const normApiHome = normalizeTeamName(apiHome);
  const normApiAway = normalizeTeamName(apiAway);
  
  return (normApiHome.includes(normalizedHome) || normalizedHome.includes(normApiHome)) &&
         (normApiAway.includes(normalizedAway) || normalizedAway.includes(normApiAway));
}

export async function findMatchByTeams(homeTeam: string, awayTeam: string): Promise<FootballMatch | null> {
  try {
    const apiKey = getApiKey();
    
    const today = new Date();
    const fromDate = today.toISOString().split('T')[0];
    
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 3);
    const toDate = futureDate.toISOString().split('T')[0];
    
    const response = await fetch(
      `${FOOTBALL_API_BASE}/matches?dateFrom=${fromDate}&dateTo=${toDate}&status=SCHEDULED`,
      {
        headers: {
          'X-Auth-Token': apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error('Football API error:', response.status);
      return null;
    }

    const data: FootballApiResponse = await response.json();
    
    for (const match of data.matches || []) {
      if (teamsMatch(match.homeTeam.name, match.awayTeam.name, homeTeam, awayTeam)) {
        const utcDate = new Date(match.utcDate);
        const league = match.competition || match.league;
        return {
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          league: league?.name || 'Unknown',
          leagueId: league?.id || 0,
          date: utcDate.toISOString().split('T')[0],
          time: utcDate.toTimeString().slice(0, 5),
          utcDate: match.utcDate,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Football API error:', error);
    return null;
  }
}

export async function findMatchesForSelections(
  selections: Array<{ home_team: string; away_team: string; league?: string; match_date?: string; time?: string }>
): Promise<Array<{ home_team: string; away_team: string; league: string; match_date: string; time: string }>> {
  const results: Array<{ home_team: string; away_team: string; league: string; match_date: string; time: string }> = [];
  
  for (const sel of selections) {
    if (sel.league && sel.match_date && sel.time) {
      results.push({
        home_team: sel.home_team,
        away_team: sel.away_team,
        league: sel.league,
        match_date: sel.match_date,
        time: sel.time,
      });
      continue;
    }
    
    if (!sel.home_team || !sel.away_team) {
      results.push({
        home_team: sel.home_team,
        away_team: sel.away_team,
        league: sel.league || '',
        match_date: sel.match_date || '',
        time: sel.time || '',
      });
      continue;
    }
    
    const match = await findMatchByTeams(sel.home_team, sel.away_team);
    
    if (match) {
      results.push({
        home_team: match.homeTeam,
        away_team: match.awayTeam,
        league: match.league,
        match_date: match.date,
        time: match.time,
      });
    } else {
      results.push({
        home_team: sel.home_team,
        away_team: sel.away_team,
        league: sel.league || '',
        match_date: sel.match_date || '',
        time: sel.time || '',
      });
    }
  }
  
  return results;
}
