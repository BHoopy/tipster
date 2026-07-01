'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LuChartBarIncreasing as BarChart, LuDollarSign as Dollar, LuTrendingUp as TrendingUp, LuUsers as Users } from 'react-icons/lu';

export default function AnalyticsManager() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/admin/analytics', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to fetch analytics');
                }

                const data = await res.json();

                setIsSuperAdmin(data.isSuperAdmin);

                const txList = data.transactions || [];
                setTransactions(txList);

                const allUsers = data.users || [];
                const allFreeTips = data.freeTips || [];
                const allVipTickets = data.vipTickets || [];

                const total = txList.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);
                setTotalRevenue(total);
                setTotalTransactions(txList.length);

                const adminStats: any[] = [];

                if (data.isSuperAdmin) {
                    const adminUsers = allUsers.filter((u: any) => u.role === 'admin');
                    adminUsers.forEach((admin: any) => {
                        adminStats.push({
                            uid: admin.uid,
                            email: admin.email || admin.displayName || 'Unknown',
                            freeTipsPosted: allFreeTips.filter((t: any) => t.createdBy === admin.uid).length,
                            vipTicketsPosted: allVipTickets.filter((t: any) => t.createdBy === admin.uid).length,
                        });
                    });
                }

                const myFreeCount = allFreeTips.filter((t: any) => t.createdBy === data.currentUid).length;
                const myVipCount = allVipTickets.filter((t: any) => t.createdBy === data.currentUid).length;

                adminStats.push({
                    uid: data.currentUid,
                    email: data.currentEmail,
                    freeTipsPosted: myFreeCount,
                    vipTicketsPosted: myVipCount,
                    isYou: true,
                });

                setStats(adminStats);
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading analytics...</div>;
    }

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart size={20} color="var(--color-primary)" /> Sales Analytics
                </h2>
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
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Tips Posted</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                        {stats.find((s: any) => s.isYou)?.freeTipsPosted || 0}
                    </div>
                </div>
            </div>

            {/* Per-Admin Contributions */}
            <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>
                        {isSuperAdmin ? 'Contributions by Admin' : 'Your Contributions'}
                    </h3>
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
                            {stats.map((admin: any) => (
                                <tr key={admin.uid}>
                                    <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{
                                                width: '28px', height: '28px', borderRadius: '50%',
                                                background: admin.isYou ? 'var(--color-primary)' : '#075E54',
                                                color: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.7rem', fontWeight: 800
                                            }}>
                                                {admin.email.charAt(0).toUpperCase()}
                                            </div>
                                            <span>{admin.email}{admin.isYou ? ' (You)' : ''}</span>
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
                                        No activity found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Transactions - Super Admin Only */}
            {isSuperAdmin && (
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
                                {transactions.slice(0, 20).map((tx: any) => (
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
            )}
        </div>
    );
}
