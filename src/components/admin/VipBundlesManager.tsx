'use client';

import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Match, VipTicket } from './types';

interface VipBundlesManagerProps {
    vipTickets: VipTicket[];
    getCurrentTime: () => string;
}

export default function VipBundlesManager({ vipTickets, getCurrentTime }: VipBundlesManagerProps) {
    const [newVipTicket, setNewVipTicket] = useState<VipTicket>({
        bundle_name: '', odds: '', matches: [], status: 'pending'
    });

    const addMatchToVipPayload = () => {
        setNewVipTicket({
            ...newVipTicket,
            matches: [...newVipTicket.matches, { time: getCurrentTime(), league: '', teams: '', tips: '', status: 'pending' }]
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

    const deleteTicket = async (id: string) => {
        if (confirm('Delete VIP Ticket?')) {
            await deleteDoc(doc(db, 'vip_tickets', id));
        }
    };

    return (
        <div className="animate-fade-in">
            <h2 style={{ marginBottom: '0.5rem' }}>Manage VIP Bundles</h2>
            <p style={{ color: 'var(--color-success)', fontWeight: 600, marginBottom: '1.5rem' }}>Guaranteed Win or Refund</p>

            <div style={{
                background: 'var(--glass-card)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '2', minWidth: '200px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.375rem' }}>Bundle Name</label>
                        <input className="input" type="text" value={newVipTicket.bundle_name} onChange={e => setNewVipTicket({ ...newVipTicket, bundle_name: e.target.value })} placeholder="Daily VIP" />
                    </div>
                    <div style={{ flex: '1', minWidth: '120px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.375rem' }}>Total Odds</label>
                        <input className="input" type="text" value={newVipTicket.odds} onChange={e => setNewVipTicket({ ...newVipTicket, odds: e.target.value })} placeholder="10.50" />
                    </div>
                </div>

                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>Matches in Bundle</h4>
                {newVipTicket.matches.map((m, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input className="input" type="time" value={m.time} onChange={e => handleVipMatchChange(idx, 'time', e.target.value)} />
                        <input className="input" placeholder="Teams" value={m.teams} onChange={e => handleVipMatchChange(idx, 'teams', e.target.value)} />
                        <input className="input" placeholder="Tip" value={m.tips} onChange={e => handleVipMatchChange(idx, 'tips', e.target.value)} />
                        <button onClick={() => {
                            const updated = newVipTicket.matches.filter((_, i) => i !== idx);
                            setNewVipTicket({ ...newVipTicket, matches: updated });
                        }} className="btn btn-outline" style={{ color: 'var(--color-danger)', border: 'none' }}><Trash2 size={16} /></button>
                    </div>
                ))}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button onClick={addMatchToVipPayload} className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>
                        <Plus size={14} /> Add Match
                    </button>
                    <button onClick={saveVipTicket} className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                        <Save size={18} /> Save Bundle
                    </button>
                </div>
            </div>

            {vipTickets.map(ticket => (
                <div key={ticket.id} className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', margin: 0 }}>{ticket.bundle_name} ({ticket.odds} Odds)</h3>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <span className={`badge badge-${ticket.status}`}>{ticket.status}</span>
                            <button onClick={() => deleteTicket(ticket.id!)} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                        </div>
                    </div>

                    {ticket.matches.map((m, mIdx) => (
                        <div key={mIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '150px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{m.time}</span>
                                <span style={{ fontSize: '0.8125rem' }}>{m.teams}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.8125rem' }}>{m.tips}</span>
                                <select
                                    value={m.status}
                                    onChange={(e) => updateVipMatchStatus(ticket.id!, mIdx, e.target.value as any)}
                                    className={`badge ${m.status === 'win' ? 'badge-success' : m.status === 'lose' ? 'badge-danger' : 'badge-muted'}`}
                                    style={{ border: 'none', cursor: 'pointer', color: 'white', padding: '0.3rem' }}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="win">Win</option>
                                    <option value="lose">Lose</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
