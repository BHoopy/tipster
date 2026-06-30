import Image from 'next/image';
import { LuStar as Star, LuTimer as Timer, LuTrophy as Trophy, LuCircleX as XCircle, LuShieldCheck as ShieldCheck, LuTrendingUp as TrendingUp, LuCopy as Copy } from 'react-icons/lu';
import { VipTicket } from '@/types/game';
import { formatTimeToAMPM, getLeagueColor, getContrastText } from '@/lib/utils';
import TeamsWithVs from '@/components/TeamsWithVs';

interface VipTicketCardProps {
    ticket: VipTicket;
}

export default function VipTicketCard({ ticket }: VipTicketCardProps) {
    return (
        <div
            className="glass-card animate-fade-in-up"
            style={{
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-glow)'
            }}
        >
            <div style={{
                background: ticket.status === 'win'
                    ? 'var(--gradient-premium)'
                    : ticket.status === 'lose'
                        ? 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)'
                        : '#140b9aff', // User's choice
                padding: '1.25rem 1.5rem',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Image
                            src="/bg-VIP.png"
                            alt="VIP"
                            width={48}
                            height={48}
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        <div style={{
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: 'rgba(255,255,255,0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                        }}>
                            {/* User removed Hot VIP text, but kept the div for spacing/structure if they want it back later or for the icon */}
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: 800 }}>
                            {ticket.bundle_name || 'Premium Bundle'}
                        </h3>
                        <div style={{ fontSize: '0.75rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                            <Star size={12} fill="currentColor" /> Expert selection
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>{ticket.odds} Odds</div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.8, marginTop: '0.25rem', fontWeight: 700 }}>Combined</div>
                </div>
            </div>

            <div style={{ padding: '1.5rem', background: 'var(--color-bg-card)' }}>
                {/* Mobile Card View */}
                <div className="vip-mobile-cards">
                    {ticket.matches.map((match, mIdx) => {
                        const leagueColor = getLeagueColor(match.league);
                        return (
                            <div key={mIdx} className="glass-card animate-fade-in-up" style={{
                                animationDelay: `${mIdx * 0.05}s`,
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
                                <div style={{
                                    minWidth: '50px',
                                    textAlign: 'center',
                                    paddingRight: '0.25rem'
                                }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--color-text)', lineHeight: 1.2 }}>
                                        {formatTimeToAMPM(match.time)}
                                    </span>
                                </div>
                                <div style={{
                                    width: '4px',
                                    height: '28px',
                                    borderRadius: '2px',
                                    backgroundColor: leagueColor,
                                    flexShrink: 0
                                }} />
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
                                    </div>
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
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}>
                                    <div style={{
                                        background: match.status === 'pending' ? 'rgba(234,179,8,0.1)' : 'rgba(0,168,107,0.08)',
                                        padding: '0.35rem 0.6rem',
                                        borderRadius: '6px',
                                        minWidth: '65px',
                                        textAlign: 'center',
                                        border: match.status === 'pending' ? '1px solid rgba(234,179,8,0.25)' : '1px solid rgba(0,168,107,0.15)'
                                    }}>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: match.status === 'pending' ? 'var(--color-warning)' : 'var(--color-primary)', letterSpacing: '-0.01em' }}>
                                            {match.tips}
                                        </div>
                                    </div>
                                    <div style={{ minWidth: '60px', textAlign: 'center' }}>
                                        {match.status === 'pending' ? (
                                            <span className="badge badge-pending" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>⌛ Pending</span>
                                        ) : match.status === 'win' ? (
                                            <span className="badge badge-win" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>✅ Won</span>
                                        ) : (
                                            <span className="badge badge-lose" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>❌ Lose</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Desktop Table View */}
                <div className="vip-desktop-table">
                    <table className="tips-table" style={{ border: 'none', marginTop: 0, boxShadow: 'none' }}>
                        <thead>
                            <tr>
                                <th style={{ borderBottom: '2px solid var(--color-border)' }}>TIME</th>
                                <th style={{ borderBottom: '2px solid var(--color-border)' }}>LEAGUE</th>
                                <th style={{ borderBottom: '2px solid var(--color-border)' }}>TEAMS</th>
                                <th style={{ borderBottom: '2px solid var(--color-border)' }}>TIPS</th>
                                <th style={{ borderBottom: '2px solid var(--color-border)' }}>RESULT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ticket.matches.map((match, mIdx) => (
                                <tr key={mIdx} style={{ animationDelay: `${mIdx * 0.1}s` }}>
                                    <td style={{ fontSize: '0.75rem', color: 'var(--color-text)', fontWeight: 400 }}>{formatTimeToAMPM(match.time)}</td>
                                    <td>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 800,
                                            color: getContrastText(getLeagueColor(match.league)),
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
                    .vip-mobile-cards { display: none; }
                    .vip-desktop-table { display: block; }
                    @media (max-width: 768px) {
                        .vip-mobile-cards { display: grid !important; grid-template-columns: 1fr; gap: 1rem; }
                        .vip-desktop-table { display: none !important; }
                    }
                `}</style>
            </div>

            <div style={{
                padding: '1rem 1.5rem',
                background: 'var(--color-bg)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    {ticket.status === 'pending' ? (
                        <><Timer size={16} /> <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Ticket Pending</span></>
                    ) : ticket.status === 'win' ? (
                        <><Trophy size={16} color="#F59E0B" /> <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-success)' }}>Winning Ticket</span></>
                    ) : (
                        <><XCircle size={16} color="#991b1b" /> <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-error)' }}>Ticket Lost</span></>
                    )}
                </div>

                {ticket.booking_code && (
                    <div
                        onClick={(e) => {
                            navigator.clipboard.writeText(ticket.booking_code!);
                            const target = e.currentTarget as HTMLElement;
                            if (target) {
                                const originalContent = target.innerHTML;
                                target.innerHTML = '<span style="font-size: 0.75rem; font-weight: 800; color: var(--color-primary)">Copied!</span>';
                                setTimeout(() => { target.innerHTML = originalContent; }, 2000);
                            }
                        }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(0,168,107,0.05)',
                            border: '1px dashed var(--color-primary)',
                            minWidth: '100px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#cb1d1dee', marginBottom: '0.1rem' }}>Sportybet Code</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--color-primary)', letterSpacing: '0.05em' }}>{ticket.booking_code}</span>
                            <Copy size={12} color="var(--color-primary)" />
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.75rem' }}>
                    <ShieldCheck size={16} />
                    <span>Verified</span>
                </div>
            </div>
        </div>
    );
}
