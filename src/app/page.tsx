'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import VipLocked from '@/components/VipLocked';
import NotificationSettings from '@/components/NotificationSettings';
import { LuTicket as Ticket, LuHistory as History } from 'react-icons/lu';

import { Match, VipTicket, GroupedTips, GroupedTickets } from '@/types/game';
import { formatDate, formatDateLabel, getDateRange } from '@/lib/utils';
import HomeHeader from '@/components/home/HomeHeader';
import NoTipsMessage from '@/components/home/NoTipsMessage';
import FreeTipsList from '@/components/home/FreeTipsList';
import VipTicketsList from '@/components/home/VipTicketsList';
import HistorySection from '@/components/home/HistorySection';

export default function Home() {
    const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free');
    const [showHistory, setShowHistory] = useState(false);
    const [historyDays, setHistoryDays] = useState(2);
    const [freeTips, setFreeTips] = useState<Match[]>([]);
    const [vipTickets, setVipTickets] = useState<VipTicket[]>([]);
    const [allFreeTips, setAllFreeTips] = useState<Match[]>([]);
    const [allVipTickets, setAllVipTickets] = useState<VipTicket[]>([]);
    const { isVip, isAdmin } = useAuth();
    const [showBottomTabs, setShowBottomTabs] = useState(false);
    const tabsRef = useRef<HTMLDivElement>(null);
    const lastScrollY = useRef<number>(0);

    // Get today's date formatted
    const todayStr = formatDate(new Date());
    const todayLabel = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    useEffect(() => {
        const freeQuery = query(
            collection(db, 'free_tips'),
            where('status', '==', 'pending'),
            orderBy('time', 'asc')
        );
        const unsubFree = onSnapshot(freeQuery, (snap) => {
            setFreeTips(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
        });

        const vipQuery = query(
            collection(db, 'vip_tickets'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );
        const unsubVip = onSnapshot(vipQuery, (snap) => {
            const tickets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VipTicket));
            setVipTickets(tickets.filter(t => t.isPublished === true));
        });

        const fetchAllData = async () => {
            const allFree = await getDocs(query(collection(db, 'free_tips')));
            setAllFreeTips(allFree.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));

            const allVip = await getDocs(query(collection(db, 'vip_tickets')));
            setAllVipTickets(allVip.docs.map(doc => ({ id: doc.id, ...doc.data() } as VipTicket)));
        };
        fetchAllData();

        return () => {
            unsubFree();
            unsubVip();
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (!tabsRef.current) return;

            const tabsRect = tabsRef.current.getBoundingClientRect();
            const isTabsOutOfView = tabsRect.bottom < 0;

            setShowBottomTabs(isTabsOutOfView);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Helper: Group tips by date
    const groupTipsByDate = (tips: Match[]): GroupedTips[] => {
        const dateRanges = getDateRange(historyDays);
        const grouped: { [key: string]: Match[] } = {};
        dateRanges.forEach(date => grouped[date] = []);
        tips.forEach(tip => {
            let tipDate = todayStr;
            if (tip.createdAt) {
                if (tip.createdAt.seconds) {
                    tipDate = new Date(tip.createdAt.seconds * 1000).toISOString().split('T')[0];
                } else if (typeof tip.createdAt === 'string') {
                    tipDate = tip.createdAt.split('T')[0];
                } else if (tip.createdAt instanceof Date) {
                    tipDate = tip.createdAt.toISOString().split('T')[0];
                }
            }
            if (grouped[tipDate]) grouped[tipDate].push(tip);
        });
        return dateRanges.map(date => ({
            date,
            dateLabel: formatDateLabel(date),
            matches: grouped[date] || []
        })).filter(g => g.matches.length > 0);
    };

    // Helper: Group tickets by date
    const groupTicketsByDate = (tickets: VipTicket[]): GroupedTickets[] => {
        const dateRanges = getDateRange(historyDays);
        const grouped: { [key: string]: VipTicket[] } = {};
        dateRanges.forEach(date => grouped[date] = []);
        tickets.forEach(ticket => {
            let ticketDate = todayStr;
            if (ticket.createdAt) {
                if (ticket.createdAt.seconds) {
                    ticketDate = new Date(ticket.createdAt.seconds * 1000).toISOString().split('T')[0];
                } else if (typeof ticket.createdAt === 'string') {
                    ticketDate = ticket.createdAt.split('T')[0];
                } else if (ticket.createdAt instanceof Date) {
                    ticketDate = ticket.createdAt.toISOString().split('T')[0];
                }
            }
            if (grouped[ticketDate]) grouped[ticketDate].push(ticket);
        });
        return dateRanges.map(date => ({
            date,
            dateLabel: formatDateLabel(date),
            tickets: grouped[date] || []
        })).filter(g => g.tickets.length > 0);
    };

    const freeHistory = useMemo(() => {
        return groupTipsByDate(allFreeTips.filter(t => t.status !== 'pending'));
    }, [allFreeTips, historyDays]);

    const vipHistory = useMemo(() => {
        return groupTicketsByDate(allVipTickets.filter(t => t.status !== 'pending' && t.isPublished === true));
    }, [allVipTickets, historyDays]);

    return (
        <div className="container" style={{ maxWidth: '900px', padding: '1rem' }}>
            <HomeHeader />

            {/* Tabs */}
            <div
                ref={tabsRef}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    marginBottom: '1.5rem',
                    padding: '0.3rem',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 'var(--radius-md)',
                    maxWidth: 'fit-content',
                    margin: '0 auto 2.5rem auto',
                    border: '1px solid var(--glass-border)'
                }}>
                <button
                    onClick={() => { setActiveTab('free'); setShowHistory(false); }}
                    className={activeTab === 'free' ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ width: '120px', fontSize: '0.8rem', height: '32px', padding: 0, border: activeTab === 'free' ? 'none' : '1px solid transparent' }}
                >
                    Free Tips
                </button>
                <button
                    onClick={() => { setActiveTab('premium'); setShowHistory(false); }}
                    className={activeTab === 'premium' ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ width: '120px', fontSize: '0.8rem', height: '32px', padding: 0, border: activeTab === 'premium' ? 'none' : '1px solid transparent' }}
                >
                    Premium Tips
                </button>
            </div>

            {/* Content Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.75rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div className="glass-card" style={{
                        color: 'white',
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--gradient-primary)'
                    }}>
                        {showHistory
                            ? <History size={16} />
                            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <circle cx="12" cy="12" r="4"/>
                                <circle cx="12" cy="12" r="1" fill="currentColor"/>
                                <line x1="2" y1="12" x2="7" y2="12"/>
                                <line x1="17" y1="12" x2="22" y2="12"/>
                                <line x1="12" y1="2" x2="12" y2="7"/>
                                <line x1="12" y1="17" x2="12" y2="22"/>
                              </svg>}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1rem', lineHeight: 1, margin: 0, fontWeight: 200, letterSpacing: '0.08em', color: 'var(--color-primary)' }}>
                            {showHistory ? 'History' : 'Predictions'}
                        </h2>
                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.15rem', fontWeight: 200, letterSpacing: '0.05em' }}>
                            {showHistory ? 'Previous results and win rate' : `Today's picks - ${todayLabel}`}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="btn-outline"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.65rem', display: 'flex', gap: '0.4rem', borderRadius: '6px' }}
                >
                    {showHistory ? <><Ticket size={12} /> Back to Live</> : <><History size={12} /> View History</>}
                </button>
            </div>

            {/* Main Content Area */}
            <div>
                {activeTab === 'free' ? (
                    showHistory ? (
                        <HistorySection
                            type="free"
                            data={freeHistory}
                            historyDays={historyDays}
                            onViewMore={() => setHistoryDays(prev => Math.min(prev + 5, 7))}
                        />
                    ) : <FreeTipsList data={freeTips} />
                ) : (
                    showHistory ? (
                        <HistorySection
                            type="vip"
                            data={vipHistory}
                            historyDays={historyDays}
                            onViewMore={() => setHistoryDays(prev => Math.min(prev + 5, 7))}
                        />
                    ) : (
                        isVip || isAdmin ? (
                            <VipTicketsList tickets={vipTickets} />
                        ) : (
                            vipTickets.length === 0 ? <NoTipsMessage /> : (
                                <VipLocked onSuccess={() => window.location.reload()} />
                            )
                        )
                    )
                )}
            </div>

            {/* Notification Settings */}
            <div style={{ maxWidth: '400px', margin: '3rem auto 2rem' }}>
                <NotificationSettings />
            </div>

            {/* Mobile Bottom Tabs - Appears when scrolling up */}
            <div
                className="mobile-bottom-tabs"
                style={{
                    position: 'fixed',
                    bottom: showBottomTabs ? '0' : '-80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    padding: '0.6rem 1rem',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                    border: '1px solid var(--glass-border)',
                    borderBottom: 'none',
                    boxShadow: 'var(--shadow-lg)',
                    transition: 'bottom 0.3s ease',
                    zIndex: 99,
                    maxWidth: 'fit-content'
                }}
            >
                <button
                    onClick={() => { setActiveTab('free'); setShowHistory(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{
                        width: '120px',
                        fontSize: '0.8rem',
                        height: '36px',
                        padding: 0,
                        borderRadius: '6px',
                        border: activeTab === 'free' ? 'none' : '1px solid transparent',
                        background: activeTab === 'free' ? 'var(--color-primary)' : 'transparent',
                        color: activeTab === 'free' ? 'white' : 'var(--color-text)',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    Free Tips
                </button>
                <button
                    onClick={() => { setActiveTab('premium'); setShowHistory(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{
                        width: '120px',
                        fontSize: '0.8rem',
                        height: '36px',
                        padding: 0,
                        borderRadius: '6px',
                        border: activeTab === 'premium' ? 'none' : '1px solid transparent',
                        background: activeTab === 'premium' ? '#1e293b' : 'transparent',
                        color: activeTab === 'premium' ? 'white' : 'var(--color-text)',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    Premium Tips
                </button>
            </div>

            <style jsx>{`
                @media (min-width: 769px) {
                    .mobile-bottom-tabs { display: none !important; }
                }
            `}</style>
        </div>
    );
}
