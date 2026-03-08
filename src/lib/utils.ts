import { QUICK_LEAGUES } from '@/components/admin/types';

export const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

export const formatDateLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatted = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    if (dateStr === formatDate(today)) return `Today - ${formatted}`;
    if (dateStr === formatDate(yesterday)) return `Yesterday - ${formatted}`;

    return formatted;
};

export const formatTimeToAMPM = (timeStr: string): string => {
    if (!timeStr) return '';
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;

    let hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
};

export const getDateRange = (days: number): string[] => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(formatDate(date));
    }
    return dates;
};

export const getLeagueColor = (leagueName: string) => {
    const league = QUICK_LEAGUES.find(l => l.name?.toLowerCase() === leagueName?.toLowerCase());
    return league ? league.color : 'var(--color-primary)';
};
