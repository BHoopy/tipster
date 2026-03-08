'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import VipLocked from '@/components/VipLocked';
import NotificationSettings from '@/components/NotificationSettings';
import { Ticket, History, CheckCircle2, XCircle, Timer, ShieldCheck, Trophy, BadgeCheck, Sparkles, TrendingUp, Star } from 'lucide-react';

type Match = {
    id: string;
    time: string;
    league: string;
    teams: string;
    tips: string;
    result?: string;
    status: 'pending' | 'win' | 'lose';
};

type VipTicket = {
    id: string;
    bundle_name: string;
    odds: string;
    matches: Match[];
    status: 'pending' | 'win' | 'lose';
    createdAt: any;
};

export default function Home() {
    const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free');
    const [showHistory, setShowHistory] = useState(false);
    const [freeTips, setFreeTips] = useState<Match[]>([]);
    const [freeHistory, setFreeHistory] = useState<Match[]>([]);
    const [vipTickets, setVipTickets] = useState<VipTicket[]>([]);
    const [vipHistory, setVipHistory] = useState<VipTicket[]>([]);
    const [allFreeTips, setAllFreeTips] = useState<Match[]>([]);
    const [allVipTickets, setAllVipTickets] = useState<VipTicket[]>([]);
    const { isVip, isAdmin } = useAuth();

    useEffect(() => {
        const freeQuery = query(
            collection(db, 'free_tips'),
            where('status', '==', 'pending'),
            orderBy('time', 'asc')
        );
        const unsubFree = onSnapshot(freeQuery, (snap) => {
            setFreeTips(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
        });

        const unsubFreeHist = onSnapshot(query(
            collection(db, 'free_tips'),
            where('status', 'in', ['win', 'lose']),
            orderBy('time', 'desc'),
            limit(20)
        ), (snap) => {
            setFreeHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
        });

        const vipQuery = query(
            collection(db, 'vip_tickets'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );
        const unsubVip = onSnapshot(vipQuery, (snap) => {
            setVipTickets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VipTicket)));
        });

        const unsubVipHist = onSnapshot(query(
            collection(db, 'vip_tickets'),
            where('status', 'in', ['win', 'lose']),
            orderBy('createdAt', 'desc'),
            limit(20)
        ), (snap) => {
            setVipHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VipTicket)));
        });

        // Fetch all for stats
        const fetchAllData = async () => {
            const allFree = await getDocs(query(collection(db, 'free_tips')));
            setAllFreeTips(allFree.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
            
            const allVip = await getDocs(query(collection(db, 'vip_tickets')));
            setAllVipTickets(allVip.docs.map(doc => ({ id: doc.id, ...doc.data() } as VipTicket)));
        };
        fetchAllData();

        return () => {
            unsubFree();
            unsubFreeHist();
            unsubVip();
            unsubVipHist();
        };
    }, []);

    const stats = useMemo(() => {
        const freeWins = allFreeTips.filter(t => t.status === 'win').length;
        const freeTotal = allFreeTips.filter(t => t.status !== 'pending').length;
        const freeRate = freeTotal > 0 ? Math.round((freeWins / freeTotal) * 100) : 0;

        const vipWins = allVipTickets.filter(t => t.status === 'win').length;
        const vipTotal = allVipTickets.filter(t => t.status !== 'pending').length;
        const vipRate = vipTotal > 0 ? Math.round((vipWins / vipTotal) * 100) : 0;

        return {
            freeWinRate: freeRate,
            vipWinRate: vipRate,
            totalWins: freeWins + vipWins,
            totalTickets: vipTotal
        };
    }, [allFreeTips, allVipTickets]);

    const renderFreeTipCard = (match: Match, idx: number) => (
        <div 
            key={match.id} 
            className="glass-card animate-fade-in-up"
            style={{
                padding: '1.25rem',
                marginBottom: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'white',
                    background: 'var(--color-primary)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px'
                }}>{match.league}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{match.time}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{match.teams}</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem' }}>{match.tips}</span>
            </div>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--color-border)'
            }}>
                {match.status === 'pending' ? (
                    <span className="badge badge-pending">Pending</span>
                ) : match.status === 'win' ? (
                    <span className="badge badge-win"><CheckCircle2 size={12} style={{ marginRight: '4px' }} /> Won</span>
                ) : (
                    <span className="badge badge-lose"><XCircle size={12} style={{ marginRight: '4px' }} /> Lost</span>
                )}
            </div>
        </div>
    );

    const renderFreeTips = (data: Match[]) => {
        if (data.length === 0) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>No tips available.</div>;

        return (
            <>
                {/* Mobile Card View */}
                <div className="mobile-cards" style={{ display: 'none' }}>
                    {data.map((match, idx) => renderFreeTipCard(match, idx))}
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
                                    <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>{idx + 1}</td>
                                    <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>{match.time}</td>
                                    <td>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            color: 'white',
                                            background: 'var(--color-primary)',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px'
                                        }}>{match.league}</span>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>{match.teams}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{match.tips}</td>
                                    <td>
                                        {match.status === 'pending' ? (
                                            <span className="badge badge-pending">Pending</span>
                                        ) : match.status === 'win' ? (
                                            <span className="badge badge-win"><CheckCircle2 size={12} style={{ marginRight: '4px' }} /> Win</span>
                                        ) : (
                                            <span className="badge badge-lose"><XCircle size={12} style={{ marginRight: '4px' }} /> Lose</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <style jsx>{`
                    @media (max-width: 768px) {
                        .mobile-cards { display: block !important; }
                        .desktop-table { display: none !important; }
                    }
                    @media (min-width: 769px) {
                        .mobile-cards { display: none !important; }
                        .desktop-table { display: block !important; }
                    }
                `}</style>
            </>
        );
    };

    const renderVipTickets = (tickets: VipTicket[]) => {
        if (tickets.length === 0) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>No VIP tickets available.</div>;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {tickets.map((ticket, idx) => (
                    <div 
                        key={ticket.id} 
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
                                : 'var(--gradient-primary)',
                            padding: '1.5rem 2rem',
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white', fontWeight: 700 }}>
                                        {ticket.bundle_name || 'Premium Bundle'}
                                    </h3>
                                    <div style={{ fontSize: '0.875rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Star size={12} fill="currentColor" /> Expert selection for today
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{ticket.odds} Odds</div>
                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.8 }}>Combined</div>
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem', background: 'white' }}>
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
                                            <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>{match.time}</td>
                                            <td>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    color: 'white',
                                                    background: 'var(--color-primary)',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px'
                                                }}>{match.league}</span>
                                            </td>
                                            <td style={{ fontWeight: 700, fontSize: '0.9rem' }}>{match.teams}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.9rem' }}>{match.tips}</td>
                                            <td>
                                                {match.status === 'pending' ? (
                                                    <span className="badge badge-pending">PENDING</span>
                                                ) : match.status === 'win' ? (
                                                    <span className="badge badge-win"><CheckCircle2 size={12} /> WIN</span>
                                                ) : (
                                                    <span className="badge badge-lose"><XCircle size={12} /> CUT</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{
                            padding: '1.25rem 1.5rem',
                            background: 'var(--color-bg)',
                            borderTop: '1px solid var(--color-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                {ticket.status === 'pending' ? (
                                    <><Timer size={18} /> <span style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>Ticket Pending</span></>
                                ) : ticket.status === 'win' ? (
                                    <><Trophy size={18} color="#F59E0B" /> <span style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', color: '#065f46' }}>Winning Ticket</span></>
                                ) : (
                                    <><XCircle size={18} color="#991b1b" /> <span style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', color: '#991b1b' }}>Ticket Lost</span></>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.875rem' }}>
                                <ShieldCheck size={18} />
                                <span>Verified Selection</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="container" style={{ maxWidth: '1000px' }}>
            {/* Hero Section */}
            <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '1rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    Winning Starts Here
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Get access to the most accurate football predictions and expert-vetted VIP ticket bundles daily.
                </p>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '2rem',
                padding: '0.4rem',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(12px)',
                borderRadius: 'var(--radius-md)',
                maxWidth: 'fit-content',
                margin: '0 auto 3rem auto',
                border: '1px solid var(--glass-border)'
            }}>
                <button
                    onClick={() => { setActiveTab('free'); setShowHistory(false); }}
                    className={activeTab === 'free' ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ width: '160px', border: activeTab === 'free' ? 'none' : '1px solid transparent' }}
                >
                    Free Tips
                </button>
                <button
                    onClick={() => { setActiveTab('premium'); setShowHistory(false); }}
                    className={activeTab === 'premium' ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ width: '160px', border: activeTab === 'premium' ? 'none' : '1px solid transparent' }}
                >
                    Premium Tips
                </button>
            </div>

            {/* Content Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="glass-card" style={{
                        color: 'white',
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--gradient-primary)'
                    }}>
                        {showHistory ? <History size={20} /> : <Ticket size={20} />}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', lineHeight: 1 }}>{showHistory ? 'History' : 'Predictions'}</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                            {showHistory ? 'Previous results and win rate' : "Today's expert selections"}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="btn-outline"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', display: 'flex', gap: '0.5rem' }}
                >
                    {showHistory ? <><Ticket size={14} /> Back to Live</> : <><History size={14} /> View History</>}
                </button>
            </div>

            {/* Main Content Area */}
            <div>
                {activeTab === 'free' ? (
                    showHistory ? renderFreeTips(freeHistory) : renderFreeTips(freeTips)
                ) : (
                    isVip || isAdmin ? (
                        showHistory ? renderVipTickets(vipHistory) : renderVipTickets(vipTickets)
                    ) : (
                        <VipLocked onSuccess={() => window.location.reload()} />
                    )
                )}
            </div>

            {/* Stats Section - Dynamic */}
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

            {/* Notification Settings */}
            <div style={{ maxWidth: '400px', margin: '3rem auto 2rem' }}>
                <NotificationSettings />
            </div>
        </div>
    );
}
