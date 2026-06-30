'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
    collection, addDoc, doc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp, updateDoc
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { LuBell as Bell } from 'react-icons/lu';

// Sub-components
import AdminSidebar from '@/components/admin/AdminSidebar';
import FreeTipsManager from '@/components/admin/FreeTipsManager';
import VipBundlesManager from '@/components/admin/VipBundlesManager';
import HistoryManager from '@/components/admin/HistoryManager';
import { Match, VipTicket } from '@/components/admin/types';

export default function AdminDashboard() {
    const { isAdmin, loading } = useAuth();
    const [view, setView] = useState<'free' | 'vip' | 'history'>('free');
    const [sendNotification, setSendNotification] = useState(true);

    // Data State
    const [freeTips, setFreeTips] = useState<Match[]>([]);
    const [vipTickets, setVipTickets] = useState<VipTicket[]>([]);
    const [historyTips, setHistoryTips] = useState<Match[]>([]);
    const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);

    const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

    // Sync Data
    useEffect(() => {
        if (!isAdmin) return;

        const unsubFree = onSnapshot(query(collection(db, 'free_tips'), orderBy('time', 'asc')), (snap) => {
            setFreeTips(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
        });

        const unsubVip = onSnapshot(query(collection(db, 'vip_tickets'), orderBy('createdAt', 'desc')), (snap) => {
            setVipTickets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VipTicket)));
        });

        return () => { unsubFree(); unsubVip(); };
    }, [isAdmin]);

    // Sync History
    useEffect(() => {
        if (!isAdmin || view !== 'history') return;

        const selectedDate = new Date(historyDate);
        const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

        const unsubHistory = onSnapshot(
            query(
                collection(db, 'free_tips_history'),
                where('resolvedAt', '>=', startOfDay),
                where('resolvedAt', '<=', endOfDay),
                orderBy('resolvedAt', 'desc')
            ),
            (snap) => {
                setHistoryTips(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
            }
        );

        return () => unsubHistory();
    }, [isAdmin, view, historyDate]);

    const updateMatchStatus = async (col: string, id: string, status: 'win' | 'lose' | 'pending') => {
        if (col === 'free_tips' && (status === 'win' || status === 'lose')) {
            const tip = freeTips.find(t => t.id === id);
            if (tip) {
                await addDoc(collection(db, 'free_tips_history'), {
                    ...tip,
                    status,
                    resolvedAt: serverTimestamp()
                });
                await deleteDoc(doc(db, col, id));
            }
        } else {
            await updateDoc(doc(db, col, id), { status });
        }
    };

    if (loading) return <div className="container center-content">Loading...</div>;
    if (!isAdmin) return <div className="container center-content">you are lost</div>;

    return (
        <div className="container admin-container">
            <div className="admin-layout">
                {/* Sidebar & Global Actions */}
                <div className="admin-aside">
                    <AdminSidebar view={view} setView={setView} />

                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                            <input
                                type="checkbox"
                                checked={sendNotification}
                                onChange={(e) => setSendNotification(e.target.checked)}
                                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                            />
                            <Bell size={16} /> Send Notifications
                        </label>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="admin-main">
                    {view === 'free' && (
                        <FreeTipsManager
                            freeTips={freeTips}
                            updateMatchStatus={updateMatchStatus}
                            sendNotification={sendNotification}
                            getCurrentTime={getCurrentTime}
                        />
                    )}

                    {view === 'vip' && (
                        <VipBundlesManager
                            vipTickets={vipTickets}
                            getCurrentTime={getCurrentTime}
                        />
                    )}

                    {view === 'history' && (
                        <HistoryManager
                            historyTips={historyTips}
                            historyDate={historyDate}
                            setHistoryDate={setHistoryDate}
                        />
                    )}
                </div>
            </div>

            <style jsx>{`
                .admin-container {
                    max-width: 1240px;
                    margin: 0 auto;
                    padding: 2rem 1rem;
                }
                .admin-layout {
                    display: flex;
                    gap: 2.5rem;
                    flex-wrap: wrap;
                }
                .admin-aside {
                    width: 250px;
                    flex-shrink: 0;
                }
                .admin-main {
                    flex: 1;
                    min-width: 320px;
                }
                .center-content {
                    text-align: center;
                    padding: 5rem;
                }
                @media (max-width: 768px) {
                    .admin-aside { width: 100%; }
                    .admin-layout { gap: 1.5rem; }
                }
            `}</style>
        </div>
    );
}
