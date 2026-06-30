import { LuBadgeCheck as BadgeCheck, LuTrophy as Trophy, LuTrendingUp as TrendingUp, LuShieldCheck as ShieldCheck } from 'react-icons/lu';

interface HomeStatsProps {
    stats: {
        freeWinRate: string;
        vipWinRate: string;
        totalWins: string;
        totalTickets: string;
    };
}

export default function HomeStats({ stats }: HomeStatsProps) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginTop: '4rem',
            marginBottom: '2rem'
        }}>
            <div className="glass-card" style={{
                padding: '1.5rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'var(--gradient-primary)'
                }} />
                <BadgeCheck color="var(--color-primary)" size={32} style={{ marginBottom: '0.75rem' }} />
                <h4 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{stats.freeWinRate}%</h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Free Tips Win Rate</p>
            </div>

            <div className="glass-card" style={{
                padding: '1.5rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'var(--gradient-gold)'
                }} />
                <Trophy color="#F59E0B" size={32} style={{ marginBottom: '0.75rem' }} />
                <h4 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{stats.vipWinRate}%</h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>VIP Win Rate</p>
            </div>

            <div className="glass-card" style={{
                padding: '1.5rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'var(--gradient-premium)'
                }} />
                <TrendingUp color="var(--color-primary)" size={32} style={{ marginBottom: '0.75rem' }} />
                <h4 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{stats.totalWins}+</h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Wins</p>
            </div>

            <div className="glass-card" style={{
                padding: '1.5rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'var(--gradient-primary)'
                }} />
                <ShieldCheck color="var(--color-primary)" size={32} style={{ marginBottom: '0.75rem' }} />
                <h4 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{stats.totalTickets}+</h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>VIP Tickets</p>
            </div>
        </div>
    );
}
