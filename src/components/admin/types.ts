export type Match = {
    id?: string;
    time: string;
    league: string;
    teams: string;
    tips: string;
    status: 'pending' | 'win' | 'lose';
    createdAt?: any;
    resolvedAt?: any;
};

export type VipTicket = {
    id?: string;
    bundle_name: string;
    odds: string;
    matches: Match[];
    status: 'pending' | 'win' | 'lose';
    booking_code?: string;
    isPublished: boolean;
    createdAt?: any;
};

export const LEAGUE_COLORS = [
    '#3d195b', '#ee8707', '#024494', '#d20515', '#091c3e', 
    '#1c1c1c', '#ff6600', '#e63946', '#2a9d8f', '#e9c46a',
    '#f4a261', '#264653', '#8338ec', '#ff006e', '#3a86ff',
    '#fb5607', '#ffbe0b', '#8ac926', '#1982c4', '#6a4c93'
];

export const getLeagueColor = (leagueName: string): string => {
    const league = QUICK_LEAGUES.find(l => l.name.toLowerCase() === leagueName.toLowerCase());
    if (league) return league.color;
    
    let hash = 0;
    for (let i = 0; i < leagueName.length; i++) {
        hash = leagueName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % LEAGUE_COLORS.length;
    return LEAGUE_COLORS[index];
};

export const QUICK_LEAGUES = [
    { name: 'EPL', color: '#3d195b' },
    { name: 'La Liga', color: '#ee8707' },
    { name: 'Serie A', color: '#024494' },
    { name: 'Bundesliga', color: '#d20515' },
    { name: 'Ligue 1', color: '#091c3e' },
    { name: 'UCL', color: '#1c1c1c' },
    { name: 'UEL', color: '#ff6600' },
];
