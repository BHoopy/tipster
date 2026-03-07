'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
    collection, addDoc, getDocs, updateDoc, doc,
    deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import {
    Plus, Save, Trash2, CheckCircle2, XCircle,
    LayoutDashboard, Ticket, History, LogOut
} from 'lucide-react';

type Match = {
    id?: string;
    time: string;
    league: string;
    teams: string;
    tips: string;
    status: 'pending' | 'win' | 'lose';
};

type VipTicket = {
    id?: string;
    bundle_name: string;
    odds: string;
    matches: Match[];
    status: 'pending' | 'win' | 'lose';
    createdAt?: any;
};

export default function AdminDashboard() {
    const { user, isAdmin, loading } = useAuth();
    const [view, setView] = useState<'free' | 'vip'>('free');

    // Free Tips State
    const [freeTips, setFreeTips] = useState<Match[]>([]);
    const [newFreeTip, setNewFreeTip] = useState<Match>({
        time: '', league: '', teams: '', tips: '', status: 'pending'
    });

    // VIP Tickets State
    const [vipTickets, setVipTickets] = useState<VipTicket[]>([]);
    const [newVipTicket, setNewVipTicket] = useState<VipTicket>({
        bundle_name: '', odds: '', matches: [], status: 'pending'
    });

    useEffect(() => {
        if (!isAdmin) return;

        const unsubFree = onSnapshot(query(collection(db, 'free_tips'), orderBy('time', 'desc')), (snap) => {
            setFreeTips(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
        });

        const unsubVip = onSnapshot(query(collection(db, 'vip_tickets'), orderBy('createdAt', 'desc')), (snap) => {
            setVipTickets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VipTicket)));
        });

        return () => { unsubFree(); unsubVip(); };
    }, [isAdmin]);

    if (loading) return <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>Loading...</div>;
    if (!isAdmin) return <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>Access Denied. Admins Only.</div>;

    // --- Free Tips Actions ---
    const handleAddFreeTip = async () => {
        if (!newFreeTip.teams || !newFreeTip.tips) return;
        await addDoc(collection(db, 'free_tips'), { ...newFreeTip, createdAt: serverTimestamp() });
        setNewFreeTip({ time: '', league: '', teams: '', tips: '', status: 'pending' });
    };

    const updateMatchStatus = async (col: string, id: string, status: 'win' | 'lose' | 'pending') => {
        await updateDoc(doc(db, col, id), { status });
    };

    const deleteItem = async (col: string, id: string) => {
        if (confirm('Are you sure?')) await deleteDoc(doc(db, col, id));
    };

    // --- VIP Bundle Actions ---
    const addMatchToVipPayload = () => {
        setNewVipTicket({
            ...newVipTicket,
            matches: [...newVipTicket.matches, { time: '', league: '', teams: '', tips: '', status: 'pending' }]
        });
    };

    const handleVipMatchChange = (idx: number, field: keyof Match, value: string) => {
        const updated = [...newVipTicket.matches];
        updated[idx] = { ...updated[idx], [field]: value };
        setNewVipTicket({ ...newVipTicket, matches: updated });
    };

    const saveVipTicket = async () => {
        if (!newVipTicket.bundle_name || newVipTicket.matches.length === 0) return;
        await addDoc(collection(db, 'vip_tickets'), { ...newVipTicket, createdAt: serverTimestamp() });
        setNewVipTicket({ bundle_name: '', odds: '', matches: [], status: 'pending' });
    };

    const updateVipMatchStatus = async (ticketId: string, matchIdx: number, status: 'win' | 'lose' | 'pending') => {
        const ticket = vipTickets.find(t => t.id === ticketId);
        if (!ticket) return;

        const updatedMatches = [...ticket.matches];
        updatedMatches[matchIdx].status = status;

        // Determine ticket status: if any lose -> lose, if all win -> win, else pending
        let newTicketStatus: 'win' | 'lose' | 'pending' = 'win';
        if (updatedMatches.some(m => m.status === 'lose')) {
            newTicketStatus = 'lose';
        } else if (updatedMatches.some(m => m.status === 'pending')) {
            newTicketStatus = 'pending';
        }

        await updateDoc(doc(db, 'vip_tickets', ticketId), {
            matches: updatedMatches,
            status: newTicketStatus
        });
    };

    return (
        <div className="container" style={{ maxWidth: '1200px' }}>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
                {/* Sidebar */}
                <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                        onClick={() => setView('free')}
                        className={view === 'free' ? 'btn btn-primary' : 'btn btn-outline'}
                        style={{ width: '100%', justifyContent: 'flex-start' }}
                    >
                        <LayoutDashboard size={20} /> Free Tips
                    </button>
                    <button
                        onClick={() => setView('vip')}
                        className={view === 'vip' ? 'btn btn-primary' : 'btn btn-outline'}
                        style={{ width: '100%', justifyContent: 'flex-start' }}
                    >
                        <Ticket size={20} /> VIP Bundles
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                    {view === 'free' ? (
                        <div>
                            <h2 style={{ marginBottom: '1.5rem' }}>Manage Free Tips</h2>

                            {/* Add Form */}
                            <div style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                marginBottom: '2rem',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                gap: '1rem',
                                alignItems: 'end'
                            }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Time</label>
                                    <input className="input" type="time" value={newFreeTip.time} onChange={e => setNewFreeTip({ ...newFreeTip, time: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>League</label>
                                    <input className="input" type="text" value={newFreeTip.league} onChange={e => setNewFreeTip({ ...newFreeTip, league: e.target.value })} placeholder="EPL" />
                                </div>
                                <div style={{ flex: 2 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Teams</label>
                                    <input className="input" type="text" value={newFreeTip.teams} onChange={e => setNewFreeTip({ ...newFreeTip, teams: e.target.value })} placeholder="Arsenal vs Liverpool" />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Tips</label>
                                    <input className="input" type="text" value={newFreeTip.tips} onChange={e => setNewFreeTip({ ...newFreeTip, tips: e.target.value })} placeholder="Over 2.5" />
                                </div>
                                <button onClick={handleAddFreeTip} className="btn btn-primary"><Plus size={18} /> Add Tip</button>
                            </div>

                            {/* List */}
                            <table className="tips-table">
                                <thead>
                                    <tr>
                                        <th>TIME</th>
                                        <th>LEAGUE</th>
                                        <th>TEAMS</th>
                                        <th>TIPS</th>
                                        <th>STATUS</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {freeTips.map(tip => (
                                        <tr key={tip.id}>
                                            <td>{tip.time}</td>
                                            <td>{tip.league}</td>
                                            <td>{tip.teams}</td>
                                            <td>{tip.tips}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                    <button onClick={() => updateMatchStatus('free_tips', tip.id!, 'win')} style={{ color: tip.status === 'win' ? 'var(--color-success)' : '#ccc' }}><CheckCircle2 size={24} /></button>
                                                    <button onClick={() => updateMatchStatus('free_tips', tip.id!, 'lose')} style={{ color: tip.status === 'lose' ? 'var(--color-danger)' : '#ccc' }}><XCircle size={24} /></button>
                                                </div>
                                            </td>
                                            <td>
                                                <button onClick={() => deleteItem('free_tips', tip.id!)} style={{ color: 'var(--color-danger)' }}><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div>
                            <h2 style={{ marginBottom: '1.5rem' }}>Manage VIP Bundles</h2>

                            {/* Add VIP Form */}
                            <div style={{
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                marginBottom: '2rem'
                            }}>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ flex: 2 }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Bundle Name</label>
                                        <input className="input" type="text" value={newVipTicket.bundle_name} onChange={e => setNewVipTicket({ ...newVipTicket, bundle_name: e.target.value })} placeholder="Daily VIP Ticket" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Total Odds</label>
                                        <input className="input" type="text" value={newVipTicket.odds} onChange={e => setNewVipTicket({ ...newVipTicket, odds: e.target.value })} placeholder="10.50" />
                                    </div>
                                </div>

                                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Matches in Bundle</h4>
                                {newVipTicket.matches.map((m, idx) => (
                                    <div key={idx} style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, 1fr)',
                                        gap: '0.5rem',
                                        marginBottom: '0.5rem',
                                        padding: '0.5rem',
                                        background: 'var(--color-bg)',
                                        borderRadius: '4px'
                                    }}>
                                        <input className="input" type="time" value={m.time} onChange={e => handleVipMatchChange(idx, 'time', e.target.value)} />
                                        <input className="input" placeholder="League" value={m.league} onChange={e => handleVipMatchChange(idx, 'league', e.target.value)} />
                                        <input className="input" placeholder="Teams" value={m.teams} onChange={e => handleVipMatchChange(idx, 'teams', e.target.value)} />
                                        <input className="input" placeholder="Tip" value={m.tips} onChange={e => handleVipMatchChange(idx, 'tips', e.target.value)} />
                                    </div>
                                ))}

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button onClick={addMatchToVipPayload} className="btn btn-outline" style={{ fontSize: '0.75rem' }}><Plus size={14} /> Add Match</button>
                                    <button onClick={saveVipTicket} className="btn btn-primary" style={{ marginLeft: 'auto' }}><Save size={18} /> Save Bundle</button>
                                </div>
                            </div>

                            {/* VIP List */}
                            {vipTickets.map(ticket => (
                                <div key={ticket.id} style={{
                                    background: 'white',
                                    padding: '1.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <h3 style={{ fontSize: '1rem' }}>{ticket.bundle_name} ({ticket.odds} Odds)</h3>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <span className={`badge badge-${ticket.status}`}>{ticket.status}</span>
                                            <button onClick={() => deleteItem('vip_tickets', ticket.id!)} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                                        </div>
                                    </div>

                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            {ticket.matches.map((m, mIdx) => (
                                                <tr key={mIdx} style={{ borderTop: '1px solid var(--color-border)' }}>
                                                    <td style={{ padding: '0.5rem', fontSize: '0.8rem' }}>{m.time} - {m.teams}</td>
                                                    <td style={{ padding: '0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>{m.tips}</td>
                                                    <td style={{ padding: '0.5rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                                            <button onClick={() => updateVipMatchStatus(ticket.id!, mIdx, 'win')} style={{ color: m.status === 'win' ? 'var(--color-success)' : '#ccc' }}><CheckCircle2 size={20} /></button>
                                                            <button onClick={() => updateVipMatchStatus(ticket.id!, mIdx, 'lose')} style={{ color: m.status === 'lose' ? 'var(--color-danger)' : '#ccc' }}><XCircle size={20} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
        .input {
          width: 100%;
          padding: 0.625rem;
          border-radius: 6px;
          border: 1px solid var(--color-border);
          font-size: 0.875rem;
          background: white;
        }
        .input:focus {
          border-color: var(--color-primary);
          outline: none;
        }
      `}</style>
        </div>
    );
}
