'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LuChartBarIncreasing as BarChart, LuDollarSign as Dollar, LuTicket as Ticket, LuTrendingUp as TrendingUp, LuUsers as Users } from 'react-icons/lu';

interface Transaction {
    id: string;
    userId: string;
    email: string;
    amount: number;
    reference: string;
    status: string;
    createdAt: any;
}

interface AdminStats {
    uid: string;
    email: string;
    freeTipsPosted: number;
    vipTicketsPosted: number;
    totalSalesFromTickets: number;
    transactionCount: number;
}

export default function AnalyticsManager() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [admins, setAdmins] = useState<{ uid: string; email: string }[]>([]);
    const [stats, setStats] = useState<AdminStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalTransactions, setTotalTransactions] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [txSnap, usersSnap, freeSnap, vipSnap] = await Promise.all([
                    getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'))),
                    getDocs(collection(db, 'users')),
                    getDocs(query(collection(db, 'free_tips'))),
                    getDocs(query(collection(db, 'vip_tickets'))),
                ]);

                const txList = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
                setTransactions(txList);

                const allUsers = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as any));
                const adminUsers = allUsers.filter(u => u.role === 'admin');
                setAdmins(adminUsers.map(a => ({ uid: a.uid, email: a.email || a.displayName || 'Unknown' })));

                const allFreeTips = freeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
                const allVipTickets = vipSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

                const total = txList.reduce((sum, tx) => sum + (tx.amount || 0), 0);
                setTotalRevenue(total);
                setTotalTransactions(txList.length);

                const adminStats: AdminStats[] = adminUsers.map(admin => {
                    const freeCount = allFreeTips.filter(t => t.createdBy === admin.uid).length;
                    const vipCount = allVipTickets.filter(t => t.createdBy === admin.uid).length;
                    return {
                        uid: admin.uid,
                        email: admin.email || admin.displayName || 'Unknown',
                        freeTipsPosted: freeCount,
                        vipTicketsPosted: vipCount,
                        totalSalesFromTickets: 0,
                        transactionCount: 0
                    };
                });

                if (adminStats.length === 0) {
                    const creators = new Set<string>();
                    allFreeTips.forEach(t => { if (t.createdBy) creators.add(t.createdBy); });
                    allVipTickets.forEach(t => { if (t.createdBy) creators.add(t.createdBy); });

                    creators.forEach(uid => {
                        const user = allUsers.find(u => u.uid === uid);
                        adminStats.push({
                            uid,
                            email: user?.email || user?.displayName || uid,
                            freeTipsPosted: allFreeTips.filter(t => t.createdBy === uid).length,
                            vipTicketsPosted: allVipTickets.filter(t => t.createdBy === uid).length,
                            totalSalesFromTickets: 0,
                            transactionCount: 0
                        });
                    });
                }

                setStats(adminStats);
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading analytics...</div>;
    }

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart size={20} color="var(--color-primary)" /> Sales Analytics
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                    Overview of all VIP sales and admin contributions
                </p>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1.25rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                        <Dollar size={18} color="var(--color-primary)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>GHS {totalRevenue.toFixed(2)}</div>
                </div>
                <div style={{ padding: '1.25rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                        <TrendingUp size={18} color="var(--color-primary)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Sales</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{totalTransactions}</div>
                </div>
                <div style={{ padding: '1.25rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                        <Users size={18} color="var(--color-primary)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Admins</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.length}</div>
                </div>
            </div>

            {/* Per-Admin Stats */}
            <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>Contributions by Admin</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="tips-table" style={{ border: 'none', marginTop: 0, boxShadow: 'none' }}>
                        <thead>
                            <tr>
                                <th style={{ borderBottom: '2px solid var(--color-border)' }}>Admin</th>
                                <th style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'center' }}>Free Tips Posted</th>
                                <th style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'center' }}>VIP Tickets Posted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.map((admin, i) => (
                                <tr key={admin.uid}>
                                    <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{
                                                width: '28px', height: '28px', borderRadius: '50%',
                                                background: 'var(--color-primary)', color: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.7rem', fontWeight: 800
                                            }}>
                                                {admin.email.charAt(0).toUpperCase()}
                                            </div>
                                            <span>{admin.email}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                                        {admin.freeTipsPosted}
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                                        {admin.vipTicketsPosted}
                                    </td>
                                </tr>
                            ))}
                            {stats.length === 0 && (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                        No admin activity found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Transactions */}
            <div style={{ marginTop: '2rem', background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>Recent Transactions</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="tips-table" style={{ border: 'none', marginTop: 0, boxShadow: 'none' }}>
                        <thead>
                            <tr>
                                <th style={{ borderBottom: '2px solid var(--color-border)' }}>Email</th>
                                <th style={{ borderBottom: '2px solid var(--color-border)' }}>Amount</th>
                                <th style={{ borderBottom: '2px solid var(--color-border)' }}>Reference</th>
                                <th style={{ borderBottom: '2px solid var(--color-border)' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.slice(0, 20).map((tx) => (
                                <tr key={tx.id}>
                                    <td style={{ fontSize: '0.8rem' }}>{tx.email}</td>
                                    <td style={{ fontWeight: 700, fontSize: '0.85rem' }}>GHS {tx.amount?.toFixed(2) || '0.00'}</td>
                                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{tx.reference?.slice(0, 16)}...</td>
                                    <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        {tx.createdAt?.toDate?.()?.toLocaleDateString?.() || tx.createdAt?.toLocaleDateString?.() || '-'}
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                        No transactions yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
