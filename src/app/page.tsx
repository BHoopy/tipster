'use client';

import { Suspense, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import VipLocked from '@/components/VipLocked';

import { Match, VipTicket, GroupedTips, GroupedTickets } from '@/types/game';
import { formatDate, formatDateLabel, getDateRange } from '@/lib/utils';
import HomeHeader from '@/components/home/HomeHeader';
import NoTipsMessage from '@/components/home/NoTipsMessage';
import FreeTipsList from '@/components/home/FreeTipsList';
import VipTicketsList from '@/components/home/VipTicketsList';
import HistorySection from '@/components/home/HistorySection';

function HomeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState<'free' | 'premium'>(tabParam === 'premium' ? 'premium' : 'free');
    const setTab = useCallback((tab: 'free' | 'premium') => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        if (tab === 'premium') {
            params.set('tab', 'premium');
        } else {
            params.delete('tab');
        }
        router.replace(`?${params.toString()}`, { scroll: false });
    }, [router, searchParams]);
    const [historyDays, setHistoryDays] = useState(2);
    const [freeTips, setFreeTips] = useState<Match[]>([]);
    const [vipTickets, setVipTickets] = useState<VipTicket[]>([]);
    const [allFreeTips, setAllFreeTips] = useState<Match[]>([]);
    const [allVipTickets, setAllVipTickets] = useState<VipTicket[]>([]);
    const { isVip, isAdmin } = useAuth();
    const [showBottomTabs, setShowBottomTabs] = useState(false);
    const [publicDates, setPublicDates] = useState<Record<string, boolean>>({});
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
            const allFreeHistory = await getDocs(query(collection(db, 'free_tips_history')));
            setAllFreeTips([
                ...allFree.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)),
                ...allFreeHistory.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match))
            ]);

            const allVip = await getDocs(query(collection(db, 'vip_tickets')));
            const allVipHistory = await getDocs(query(collection(db, 'vip_tickets_history')));
            setAllVipTickets([
                ...allVip.docs.map(doc => ({ id: doc.id, ...doc.data() } as VipTicket)),
                ...allVipHistory.docs.map(doc => ({ id: doc.id, ...doc.data() } as VipTicket))
            ]);
        };
        fetchAllData();

        return () => {
            unsubFree();
            unsubVip();
        };
    }, []);

    useEffect(() => {
        const fetchVisibility = async () => {
            const snap = await getDoc(doc(db, 'settings', 'history_visibility'));
            if (snap.exists()) {
                setPublicDates(snap.data().dates || {});
            }
        };
        fetchVisibility();
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
                    onClick={() => setTab('free')}
                    className={activeTab === 'free' ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ width: '120px', fontSize: '0.8rem', height: '32px', padding: 0, border: activeTab === 'free' ? 'none' : '1px solid transparent' }}
                >
                    Free Tips
                </button>
                <button
                    onClick={() => setTab('premium')}
                    className={activeTab === 'premium' ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ width: '120px', fontSize: '0.8rem', height: '32px', padding: 0, border: activeTab === 'premium' ? 'none' : '1px solid transparent' }}
                >
                    Premium Tips
                </button>
            </div>

            {/* Today's Picks */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1rem'
            }}>
                <div>
                    <h2 style={{ fontSize: '1rem', lineHeight: 1, margin: 0, fontWeight: 200, letterSpacing: '0.08em', color: 'var(--color-primary)' }}>
                        🎯 Predictions
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text)', marginTop: '0.2rem', fontWeight: 600, letterSpacing: '0.02em' }}>
                        Today, {todayLabel}
                    </p>
                </div>
            </div>

            {/* Current Tips */}
            <div style={{ marginBottom: '2.5rem' }}>
                {activeTab === 'free' ? (
                    <FreeTipsList data={freeTips} />
                ) : (
                    isVip || isAdmin ? (
                        <VipTicketsList tickets={vipTickets} />
                    ) : (
                        vipTickets.length === 0 ? <NoTipsMessage /> : (
                            <VipLocked onSuccess={() => window.location.reload()} />
                        )
                    )
                )}
            </div>

            {/* History Section */}
            {activeTab === 'free' ? (
                (() => {
                    const visible = freeHistory.filter(g => publicDates[g.date] === true);
                    return visible.length > 0 && (
                        <HistorySection
                            type="free"
                            data={visible}
                            historyDays={historyDays}
                            onViewMore={() => setHistoryDays(prev => Math.min(prev + 5, 7))}
                        />
                    );
                })()
            ) : (
                (() => {
                    const visible = vipHistory.filter(g => publicDates[g.date] === true);
                    return visible.length > 0 && (
                        <HistorySection
                            type="vip"
                            data={visible}
                            historyDays={historyDays}
                            onViewMore={() => setHistoryDays(prev => Math.min(prev + 5, 7))}
                        />
                    );
                })()
            )}

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
                    onClick={() => { setTab('free'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
                    onClick={() => { setTab('premium'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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

export default function Home() {
    return (
        <Suspense fallback={<div className="container" style={{ padding: '2rem 1rem' }}>Loading...</div>}>
            <HomeContent />
        </Suspense>
    );
}
