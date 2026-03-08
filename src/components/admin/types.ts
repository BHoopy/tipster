import { serverTimestamp } from 'firebase/firestore';

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

export const QUICK_LEAGUES = [
    { name: 'EPL', color: '#3d195b' },
    { name: 'La Liga', color: '#ee8707' },
    { name: 'Serie A', color: '#024494' },
    { name: 'Bundesliga', color: '#d20515' },
    { name: 'Ligue 1', color: '#091c3e' },
    { name: 'UCL', color: '#1c1c1c' },
    { name: 'UEL', color: '#ff6600' },
];
