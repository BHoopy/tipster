import { Match } from '@/types/game';
import { formatTimeToAMPM, getLeagueColor } from '@/lib/utils';
import { QUICK_LEAGUES } from '@/components/admin/types';
import TeamsWithVs from '@/components/TeamsWithVs';

interface FreeTipCardProps {
    match: Match;
    idx: number;
}

export default function FreeTipCard({ match, idx }: FreeTipCardProps) {
    const leagueColor = getLeagueColor(match.league);
    
    return (
        <div className="glass-card animate-fade-in-up" style={{
            animationDelay: `${idx * 0.05}s`,
            padding: '0.6rem 0.75rem',
            marginBottom: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            minHeight: '52px'
        }}>
            {/* Time */}
            <div style={{ 
                minWidth: '50px', 
                textAlign: 'center',
                paddingRight: '0.25rem'
            }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--color-text)', lineHeight: 1.2 }}>
                    {formatTimeToAMPM(match.time)}
                </span>
            </div>

            {/* League Color Indicator */}
            <div style={{
                width: '4px',
                height: '28px',
                borderRadius: '2px',
                backgroundColor: leagueColor,
                flexShrink: 0
            }} />

            {/* Teams - Main content */}
            <div style={{ flex: 1, minWidth: 0, padding: '0 0.25rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <div style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    justifyContent: 'center'
                }}>
                    <TeamsWithVs teams={match.teams} vertical />
                    {match.status !== 'pending' && (
                        <span style={{
                            fontSize: '0.65rem',
                            color: match.status === 'win' ? 'var(--color-success)' : 'var(--color-error)',
                            fontWeight: 900
                        }}>
                            {match.status === 'win' ? '✓' : '✗'}
                        </span>
                    )}
                </div>
                {/* League Name */}
                <span style={{
                    fontSize: '0.55rem',
                    fontWeight: 500,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    textAlign: 'center'
                }}>
                    {match.league}
                </span>
            </div>

            {/* Tip - Distinct Action-like area */}
            <div style={{
                background: match.status === 'pending' ? 'rgba(234,179,8,0.1)' : 'rgba(0,168,107,0.08)',
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                minWidth: '65px',
                textAlign: 'center',
                border: match.status === 'pending' ? '1px solid rgba(234,179,8,0.25)' : '1px solid rgba(0,168,107,0.15)'
            }}>
                <div style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: match.status === 'pending' ? 'var(--color-warning)' : 'var(--color-primary)',
                    letterSpacing: '-0.01em'
                }}>
                    {match.tips}
                </div>
            </div>
        </div>
    );
}
