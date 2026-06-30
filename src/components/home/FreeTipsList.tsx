import { Match } from '@/types/game';
import { formatTimeToAMPM, getLeagueColor } from '@/lib/utils';
import NoTipsMessage from './NoTipsMessage';
import FreeTipCard from './FreeTipCard';
import TeamsWithVs from '@/components/TeamsWithVs';

interface FreeTipsListProps {
    data: Match[];
}

export default function FreeTipsList({ data }: FreeTipsListProps) {
    if (data.length === 0) return <NoTipsMessage />;

    return (
        <>
            {/* Mobile Card View */}
            <div className="mobile-cards">
                {data.map((match, idx) => (
                    <FreeTipCard key={match.id} match={match} idx={idx} />
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="desktop-table" style={{ overflowX: 'auto' }}>
                <table className="tips-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>SN</th>
                            <th style={{ width: '100px' }}>TIME</th>
                            <th style={{ width: '120px' }}>LEAGUE</th>
                            <th style={{ minWidth: '180px' }}>TEAMS</th>
                            <th style={{ width: '120px' }}>TIPS</th>
                            <th style={{ width: '100px' }}>RESULT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((match, idx) => (
                            <tr key={match.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                                <td style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{idx + 1}</td>
                                <td style={{ fontSize: '0.8rem', color: 'black', fontWeight: 400 }}>{formatTimeToAMPM(match.time)}</td>
                                <td>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 800,
                                        color: 'white',
                                        background: getLeagueColor(match.league),
                                        padding: '0.15rem 0.4rem',
                                        borderRadius: '4px',
                                        textTransform: 'uppercase'
                                    }}>{match.league}</span>
                                </td>
                                <td style={{ fontWeight: 700, fontSize: '0.85rem' }}><TeamsWithVs teams={match.teams} /></td>
                                <td style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.85rem' }}>{match.tips}</td>
                                <td>
                                    {match.status === 'pending' ? (
                                        <span className="badge badge-pending" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>⌛ Pending</span>
                                    ) : match.status === 'win' ? (
                                        <span className="badge badge-win" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>✅ Won</span>
                                    ) : (
                                        <span className="badge badge-lose" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>❌ Lose</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                @media (max-width: 768px) {
                    .desktop-table { display: none !important; }
                    .mobile-cards { display: grid !important; grid-template-columns: 1fr; gap: 1rem; }
                }
                @media (min-width: 769px) {
                    .mobile-cards { display: none !important; }
                    .desktop-table { display: block !important; }
                }
            `}</style>
        </>
    );
}
