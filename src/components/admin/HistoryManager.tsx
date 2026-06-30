'use client';

import { Match, getLeagueColor, getContrastText } from './types';
import { LuEye as Eye, LuEyeOff as EyeOff } from 'react-icons/lu';

interface HistoryManagerProps {
    historyTips: Match[];
    historyDate: string;
    setHistoryDate: (date: string) => void;
    isDatePublic: boolean;
    onTogglePublic: () => void;
}

export default function HistoryManager({ historyTips, historyDate, setHistoryDate, isDatePublic, onTogglePublic }: HistoryManagerProps) {
    const formatTimeToAMPM = (timeStr: string): string => {
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

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0 }}>History</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        onClick={() => {
                            if (isDatePublic && !window.confirm('Hide this day from public view?')) return;
                            onTogglePublic();
                        }}
                        className="btn-outline"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            background: isDatePublic ? 'var(--color-primary-light)' : undefined,
                            borderColor: isDatePublic ? 'var(--color-primary)' : undefined,
                            color: isDatePublic ? 'var(--color-primary)' : undefined
                        }}
                    >
                        {isDatePublic ? <Eye size={16} /> : <EyeOff size={16} />}
                        {isDatePublic ? 'Visible to Public' : 'Hidden from Public'}
                    </button>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Select Date:</label>
                    <input
                        type="date"
                        value={historyDate}
                        onChange={(e) => setHistoryDate(e.target.value)}
                        className="input"
                        style={{ width: 'auto', padding: '0.4rem', fontSize: '0.8rem' }}
                    />
                </div>
            </div>

            <div style={{
                marginBottom: '1.25rem',
                color: 'var(--color-primary)',
                fontSize: '1rem',
                fontWeight: 800,
                textAlign: 'center',
                padding: '0.75rem',
                background: 'rgba(0,168,107,0.05)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(0,168,107,0.1)'
            }}>
                📅 {new Date(historyDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            {historyTips.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    No history for this date.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {historyTips.map((tip, idx) => (
                        <div key={tip.id || `history-${idx}`} className="glass-card" style={{
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.8rem' }}>{formatTimeToAMPM(tip.time)}</span>
                                <span style={{
                                    fontSize: '0.5rem',
                                    fontWeight: 600,
                                    color: getContrastText(getLeagueColor(tip.league || '')),
                                    background: getLeagueColor(tip.league || ''),
                                    padding: '0.1rem 0.5rem',
                                    borderRadius: '3px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em'
                                }}>{tip.league}</span>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{tip.teams}</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.85rem' }}>{tip.tips}</span>
                                    <span className={`badge ${tip.status === 'win' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                                        {tip.status === 'win' ? '✅ Won' : '❌ Lose'}
                                    </span>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
