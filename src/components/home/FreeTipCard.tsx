import { Match } from '@/types/game';
import { formatTimeToAMPM, getLeagueColor } from '@/lib/utils';

interface FreeTipCardProps {
    match: Match;
    idx: number;
}

export default function FreeTipCard({ match, idx }: FreeTipCardProps) {
    return (
        <div className="glass-card animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <span className="badge badge-primary">{formatTimeToAMPM(match.time)}</span>
                <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    color: 'white',
                    background: getLeagueColor(match.league),
                    padding: '0.15rem 0.6rem',
                    borderRadius: '50px',
                    textTransform: 'uppercase'
                }}>{match.league}</span>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.25rem', color: 'var(--color-text)' }}>{match.teams}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', opacity: 0.7 }}>Final Prediction</div>
            </div>

            <div style={{
                background: 'var(--color-bg)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                border: '1px solid var(--color-border)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Tip</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-primary)' }}>{match.tips}</div>

                {match.status !== 'pending' && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        color: 'white',
                        textTransform: 'uppercase',
                        background: match.status === 'win' ? 'var(--color-success)' : 'var(--color-danger)',
                        borderRadius: '0 0 0 10px'
                    }}>
                        {match.status === 'win' ? 'Won' : 'Lost'}
                    </div>
                )}
            </div>
        </div>
    );
}
