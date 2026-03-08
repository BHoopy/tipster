'use client';

import { Match } from './types';

interface HistoryManagerProps {
    historyTips: Match[];
    historyDate: string;
    setHistoryDate: (date: string) => void;
}

export default function HistoryManager({ historyTips, historyDate, setHistoryDate }: HistoryManagerProps) {
    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0 }}>History</h2>
                <input
                    type="date"
                    value={historyDate}
                    onChange={(e) => setHistoryDate(e.target.value)}
                    className="input"
                    style={{ width: 'auto', padding: '0.5rem' }}
                />
            </div>

            <div style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                {new Date(historyDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            {historyTips.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    No history for this date.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {historyTips.map((tip, idx) => (
                        <div key={tip.id || `history-${idx}`} className="glass-card" style={{
                            padding: '1rem',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{tip.time}</span>
                                <span className="badge badge-primary">{tip.league}</span>
                                <span style={{ fontWeight: 600 }}>{tip.teams}</span>
                                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{tip.tips}</span>
                            </div>
                            <span className={`badge ${tip.status === 'win' ? 'badge-success' : 'badge-danger'}`}>
                                {tip.status === 'win' ? '✅ Won' : '❌ Lose'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
