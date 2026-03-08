export type Match = {
    id: string;
    time: string;
    league: string;
    teams: string;
    tips: string;
    result?: string;
    status: 'pending' | 'win' | 'lose';
    createdAt?: any;
};

export type VipTicket = {
    id: string;
    bundle_name: string;
    odds: string;
    matches: Match[];
    status: 'pending' | 'win' | 'lose';
    booking_code?: string;
    isPublished: boolean;
    createdAt: any;
};

export type GroupedTips = {
    date: string;
    dateLabel: string;
    matches: Match[];
};

export type GroupedTickets = {
    date: string;
    dateLabel: string;
    tickets: VipTicket[];
};
