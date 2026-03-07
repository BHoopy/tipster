'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import VipLocked from '@/components/VipLocked';
import { Ticket, History, CheckCircle2, XCircle, Timer, ShieldCheck, Trophy, BadgeCheck } from 'lucide-react';
import Image from 'next/image';

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
    const { isVip, isAdmin } = useAuth();

    useEffect(() => {
        // 1. Fetch Active Free Tips
        const freeQuery = query(
            collection(db, 'free_tips'),
            where('status', '==', 'pending'),
            orderBy('time', 'asc')
        );
        const unsubFree = onSnapshot(freeQuery, (snap) => {
            setFreeTips(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
        });

        // 2. Fetch Free History (Last 20)
        const freeHistQuery = query(
            collection(db, 'free_tips'),
            where('status', '!=', 'pending'),
            orderBy('status'), // Necessary combined with status filter
            orderBy('time', 'desc'),
            limit(20)
        );
        // Actually simpler if we just query with status in ['win', 'lose']
        const unsubFreeHist = onSnapshot(query(
            collection(db, 'free_tips'),
            where('status', 'in', ['win', 'lose']),
            orderBy('time', 'desc'),
            limit(20)
        ), (snap) => {
            setFreeHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
        });

        // 3. Fetch Active VIP Tickets
        const vipQuery = query(
            collection(db, 'vip_tickets'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );
        const unsubVip = onSnapshot(vipQuery, (snap) => {
            setVipTickets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VipTicket)));
        });

        // 4. Fetch VIP History
        const vipHistQuery = query(
            collection(db, 'vip_tickets'),
            where('status', 'in', ['win', 'lose']),
            orderBy('createdAt', 'desc'),
            limit(20)
        );
        const unsubVipHist = onSnapshot(vipHistQuery, (snap) => {
            setVipHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VipTicket)));
        });

        return () => {
            unsubFree();
            unsubFreeHist();
            unsubVip();
            unsubVipHist();
        };
    }, []);

    const renderFreeTips = (data: Match[]) => {
        if (data.length === 0) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>No tips available.</div>;

        return (
            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                <table className="tips-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>SN</th>
                            <th style={{ width: '100px' }}>TIME</th>
                            <th style={{ width: '150px' }}>LEAGUE</th>
                            <th style={{ minWidth: '200px' }}>TEAMS</th>
                            <th style={{ width: '120px' }}>TIPS</th>
                            <th style={{ width: '100px' }}>RESULT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((match, idx) => (
                            <tr key={match.id}>
                                <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>{idx + 1}</td>
                                <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>{match.time}</td>
                                <td>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        color: 'var(--color-primary)',
                                        background: 'var(--color-primary-light)',
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
        );
    };

    const renderVipTickets = (tickets: VipTicket[]) => {
        if (tickets.length === 0) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>No VIP tickets available.</div>;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {tickets.map((ticket) => (
                    <div key={ticket.id} style={{
                        background: 'white',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-md)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            background: 'var(--color-primary)',
                            padding: '1.25rem 2rem',
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white' }}>{ticket.bundle_name || 'Premium Bundle'}</h3>
                                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Expert selection for today</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{ticket.odds} Odds</div>
                                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Combined</div>
                            </div>
                        </div>

                        <div style={{ padding: '0 1rem' }}>
                            <table className="tips-table" style={{ border: 'none', marginTop: 0 }}>
                                <thead>
                                    <tr>
                                        <th style={{ borderBottom: '1px solid var(--color-border)' }}>TIME</th>
                                        <th style={{ borderBottom: '1px solid var(--color-border)' }}>LEAGUE</th>
                                        <th style={{ borderBottom: '1px solid var(--color-border)' }}>TEAMS</th>
                                        <th style={{ borderBottom: '1px solid var(--color-border)' }}>TIPS</th>
                                        <th style={{ borderBottom: '1px solid var(--color-border)' }}>RESULT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ticket.matches.map((match, mIdx) => (
                                        <tr key={mIdx}>
                                            <td style={{ fontSize: '0.85rem' }}>{match.time}</td>
                                            <td>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    color: 'var(--color-primary)',
                                                    background: 'var(--color-primary-light)',
                                                    padding: '0.15rem 0.4rem',
                                                    borderRadius: '4px'
                                                }}>{match.league}</span>
                                            </td>
                                            <td style={{ fontWeight: 700 }}>{match.teams}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{match.tips}</td>
                                            <td>
                                                {match.status === 'pending' ? (
                                                    <span className="badge badge-pending">PENDING</span>
                                                ) : match.status === 'win' ? (
                                                    <span className="badge badge-win">WIN</span>
                                                ) : (
                                                    <span className="badge badge-lose">CUT</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{
                            padding: '1.5rem',
                            background: 'var(--color-bg)',
                            borderTop: '1px solid var(--color-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                {ticket.status === 'pending' ? <Timer size={18} /> : ticket.status === 'win' ? <Trophy size={18} color="gold" /> : <XCircle size={18} color="red" />}
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>
                                    TICKET STATUS: {ticket.status}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 700 }}>
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
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Winning Starts Here</h1>
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
                background: 'rgba(0,168,107,0.05)',
                borderRadius: 'var(--radius-md)',
                maxWidth: 'fit-content',
                margin: '0 auto 3rem auto'
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
                marginBottom: '1.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        background: 'var(--color-primary)',
                        color: 'white',
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {showHistory ? <History size={20} /> : <Ticket size={20} />}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', lineHeight: 1 }}>{showHistory ? 'History' : 'Predictions'}</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                            {showHistory ? 'Previous results and win rate' : 'Today\'s expert selections'}
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

            {/* Stats Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginTop: '4rem',
                marginBottom: '2rem'
            }}>
                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center'
                }}>
                    <BadgeCheck color="var(--color-primary)" size={32} style={{ marginBottom: '0.75rem' }} />
                    <h4 style={{ fontSize: '1.5rem' }}>92%</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Win Rate</p>
                </div>
                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center'
                }}>
                    <Trophy color="var(--color-primary)" size={32} style={{ marginBottom: '0.75rem' }} />
                    <h4 style={{ fontSize: '1.5rem' }}>500+</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Winning Tickets</p>
                </div>
                <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center'
                }}>
                    <ShieldCheck color="var(--color-primary)" size={32} style={{ marginBottom: '0.75rem' }} />
                    <h4 style={{ fontSize: '1.5rem' }}>Verified</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Stats Checked</p>
                </div>
            </div>
        </div>
    );
}
