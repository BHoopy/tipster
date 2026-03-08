import { Match } from '@/types/game';
import { formatTimeToAMPM, getLeagueColor } from '@/lib/utils';

interface FreeTipCardProps {
    match: Match;
    idx: number;
}

export default function FreeTipCard({ match, idx }: FreeTipCardProps) {
    return (
        <div className="glass-card animate-fade-in-up" style={{
            animationDelay: `${idx * 0.05}s`,
            padding: '0.4rem 0.6rem',
            marginBottom: '0.35rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            minHeight: '42px'
        }}>
            {/* Index & Time/League Group */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '55px', borderRight: '1px solid var(--color-border)', paddingRight: '0.4rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1.1 }}>
                    {formatTimeToAMPM(match.time)}
                </span>
                <span style={{
                    fontSize: '0.5rem',
                    fontWeight: 700,
                    color: 'var(--color-text-secondary)',
                    opacity: 0.8,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {match.league}
                </span>
            </div>

            {/* Teams - Main content */}
            <div style={{ flex: 1, minWidth: 0, padding: '0 0.2rem' }}>
                <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    lineHeight: 1.2
                }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {match.teams.replace(/ vs /gi, ' • ')}
                    </span>
                    {match.status !== 'pending' && (
                        <span style={{
                            fontSize: '0.6rem',
                            color: match.status === 'win' ? '#059669' : '#dc2626',
                            fontWeight: 900
                        }}>
                            {match.status === 'win' ? '✓' : '✗'}
                        </span>
                    )}
                </div>
            </div>

            {/* Tip - Distinct Action-like area */}
            <div style={{
                background: 'rgba(0,168,107,0.06)',
                padding: '0.3rem 0.5rem',
                borderRadius: '6px',
                minWidth: '70px',
                textAlign: 'center',
                border: '1px solid rgba(0,168,107,0.1)'
            }}>
                <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    color: 'var(--color-primary)',
                    letterSpacing: '-0.01em'
                }}>
                    {match.tips}
                </div>
            </div>
        </div>
    );
}
