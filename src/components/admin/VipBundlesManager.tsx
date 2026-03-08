'use client';

import { useState } from 'react';
import { Plus, Save, Trash2, Zap } from 'lucide-react';
import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Match, VipTicket, QUICK_LEAGUES } from './types';
import { useTeamAutocomplete, useTipAutocomplete, useLeagueAutocomplete } from '@/hooks/useAutocomplete';
import AutocompleteInput from '@/components/AutocompleteInput';

interface VipBundlesManagerProps {
    vipTickets: VipTicket[];
    getCurrentTime: () => string;
}

export default function VipBundlesManager({ vipTickets, getCurrentTime }: VipBundlesManagerProps) {
    const [newVipTicket, setNewVipTicket] = useState<{
        bundle_name: string;
        odds: string;
        matches: { time: string; league: string; home: string; away: string; tips: string; status: 'pending' | 'win' | 'lose' }[];
    }>({
        bundle_name: '', odds: '', matches: []
    });

    const [errors, setErrors] = useState<{ bundle_name?: boolean; odds?: boolean; matches?: boolean }>({});

    const teamAutocomplete = useTeamAutocomplete();
    const tipAutocomplete = useTipAutocomplete();
    const leagueAutocomplete = useLeagueAutocomplete();

    const addMatchToVipPayload = () => {
        setNewVipTicket({
            ...newVipTicket,
            matches: [...newVipTicket.matches, { time: getCurrentTime(), league: 'EPL', home: '', away: '', tips: '', status: 'pending' }]
        });
    };

    const handleVipMatchChange = (idx: number, field: string, value: string) => {
        const updated = [...newVipTicket.matches];
        (updated[idx] as any)[field] = value;
        setNewVipTicket({ ...newVipTicket, matches: updated });

        if (field === 'home' || field === 'away') {
            teamAutocomplete.search(value);
        } else if (field === 'tips') {
            tipAutocomplete.search(value);
        } else if (field === 'league') {
            leagueAutocomplete.search(value);
        }
    };

    const saveVipTicket = async () => {
        const newErrors: { bundle_name?: boolean; odds?: boolean; matches?: boolean } = {};
        if (!newVipTicket.bundle_name.trim()) newErrors.bundle_name = true;
        if (!newVipTicket.odds.trim()) newErrors.odds = true;
        if (newVipTicket.matches.length === 0) newErrors.matches = true;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        // Prepare matches by joining home/away
        const matchesToSave: Match[] = newVipTicket.matches.map(m => ({
            time: m.time,
            league: m.league,
            teams: `${m.home.trim()} vs ${m.away.trim()}`,
            tips: m.tips.trim(),
            status: m.status
        }));

        await addDoc(collection(db, 'vip_tickets'), {
            bundle_name: newVipTicket.bundle_name,
            odds: newVipTicket.odds,
            status: 'pending',
            matches: matchesToSave,
            createdAt: serverTimestamp()
        });

        // Learn all teams and tips
        newVipTicket.matches.forEach(m => {
            teamAutocomplete.learn(m.home.trim());
            teamAutocomplete.learn(m.away.trim());
            tipAutocomplete.learn(m.tips.trim());
            leagueAutocomplete.learn(m.league.trim());
        });

        // Clear all suggestions
        teamAutocomplete.clearSuggestions();
        tipAutocomplete.clearSuggestions();
        leagueAutocomplete.clearSuggestions();

        setNewVipTicket({ bundle_name: '', odds: '', matches: [] });
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

    const getLeagueColor = (leagueName: string) => {
        const league = QUICK_LEAGUES.find(l => l.name.toLowerCase() === leagueName.toLowerCase());
        return league ? league.color : 'var(--color-primary)';
    };

    const formatTimeToAMPM = (timeStr: string): string => {
        if (!timeStr) return '';
        if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
        const parts = timeStr.split(':');
        if (parts.length < 2) return timeStr;

        let hours = parseInt(parts[0]);
        const minutes = parts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
    };

    return (
        <div className="animate-fade-in">
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.25rem' }}>Manage VIP Bundles</h2>
            <p style={{ color: 'var(--color-success)', fontWeight: 700, marginBottom: '1rem', fontSize: '0.8rem' }}>Guaranteed Win or Refund</p>

            <div style={{
                background: 'var(--glass-card)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                marginBottom: '1.5rem'
            }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '2', minWidth: '180px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Bundle Name</label>
                        <input
                            className="input"
                            type="text"
                            value={newVipTicket.bundle_name}
                            onChange={e => setNewVipTicket({ ...newVipTicket, bundle_name: e.target.value })}
                            placeholder="Daily VIP"
                            style={{
                                borderColor: errors.bundle_name ? '#ef4444' : undefined,
                                height: '36px',
                                fontSize: '0.85rem'
                            }}
                        />
                        {errors.bundle_name && <span style={{ color: '#ef4444', fontSize: '0.6rem', marginTop: '0.2rem', display: 'block' }}>Required</span>}
                    </div>
                    <div style={{ flex: '1', minWidth: '100px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Total Odds</label>
                        <input
                            className="input"
                            type="text"
                            value={newVipTicket.odds}
                            onChange={e => setNewVipTicket({ ...newVipTicket, odds: e.target.value })}
                            placeholder="10.50"
                            style={{
                                borderColor: errors.odds ? '#ef4444' : undefined,
                                height: '36px',
                                fontSize: '0.85rem'
                            }}
                        />
                        {errors.odds && <span style={{ color: '#ef4444', fontSize: '0.6rem', marginTop: '0.2rem', display: 'block' }}>Required</span>}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.8rem', margin: 0, fontWeight: 800, color: 'var(--color-text-secondary)' }}>Matches in Bundle</h4>
                    {errors.matches && <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 600 }}>Add at least one match</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {newVipTicket.matches.map((m, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            gap: '0.3rem',
                            alignItems: 'center',
                            background: 'rgba(0,0,0,0.02)',
                            padding: '0.4rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            flexWrap: 'wrap'
                        }}>
                            <input className="input" type="time" value={m.time} onChange={e => handleVipMatchChange(idx, 'time', e.target.value)} style={{ width: '80px', height: '30px', padding: '0.2rem', fontSize: '0.75rem' }} />

                            <div style={{ width: '85px' }}>
                                <AutocompleteInput
                                    value={m.league}
                                    onChange={(val) => handleVipMatchChange(idx, 'league', val)}
                                    onSelect={() => { }}
                                    suggestions={leagueAutocomplete.suggestions}
                                    isLoading={leagueAutocomplete.isLoading}
                                    placeholder="EPL"
                                    style={{ height: '30px', fontSize: '0.7rem', padding: '0 0.1rem' }}
                                />
                            </div>

                            <div style={{ flex: 1, minWidth: '100px' }}>
                                <AutocompleteInput
                                    value={m.home}
                                    onChange={(val) => handleVipMatchChange(idx, 'home', val)}
                                    onSelect={() => { }}
                                    suggestions={teamAutocomplete.suggestions}
                                    isLoading={teamAutocomplete.isLoading}
                                    placeholder="Home"
                                    style={{ height: '30px', fontSize: '0.75rem' }}
                                />
                            </div>

                            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--color-primary)' }}>VS</span>

                            <div style={{ flex: 1, minWidth: '100px' }}>
                                <AutocompleteInput
                                    value={m.away}
                                    onChange={(val) => handleVipMatchChange(idx, 'away', val)}
                                    onSelect={() => { }}
                                    suggestions={teamAutocomplete.suggestions}
                                    isLoading={teamAutocomplete.isLoading}
                                    placeholder="Away"
                                    style={{ height: '30px', fontSize: '0.75rem' }}
                                />
                            </div>

                            <div style={{ flex: 1, minWidth: '100px' }}>
                                <AutocompleteInput
                                    value={m.tips}
                                    onChange={(val) => handleVipMatchChange(idx, 'tips', val)}
                                    onSelect={() => { }}
                                    suggestions={tipAutocomplete.suggestions}
                                    isLoading={tipAutocomplete.isLoading}
                                    placeholder="Tip"
                                    style={{ height: '30px', fontSize: '0.75rem' }}
                                />
                            </div>

                            <button onClick={() => {
                                const updated = newVipTicket.matches.filter((_, i) => i !== idx);
                                setNewVipTicket({ ...newVipTicket, matches: updated });
                            }} className="btn btn-outline" style={{ color: 'var(--color-danger)', border: 'none', padding: '0.2rem' }}><Trash2 size={16} /></button>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button onClick={addMatchToVipPayload} className="btn btn-outline" style={{ fontSize: '0.75rem', height: '36px' }}>
                        <Plus size={14} /> Add Match
                    </button>
                    <button onClick={saveVipTicket} className="btn btn-primary" style={{ marginLeft: 'auto', height: '36px', fontSize: '0.8rem' }}>
                        <Save size={16} /> Save Bundle
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {vipTickets.map(ticket => (
                    <div key={ticket.id} className="glass-card" style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div className="glass-card" style={{ padding: '0.4rem', borderRadius: '8px', background: 'var(--gradient-primary)', color: 'white' }}><Zap size={14} /></div>
                                <h3 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 800 }}>{ticket.bundle_name} <span style={{ color: 'var(--color-primary)' }}>({ticket.odds} Odds)</span></h3>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span className={`badge badge-${ticket.status}`} style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>{ticket.status === 'win' ? 'Won' : ticket.status}</span>
                                <button onClick={() => deleteTicket(ticket.id!)} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', padding: '0.25rem' }}><Trash2 size={16} /></button>
                            </div>
                        </div>

                        {ticket.matches.map((m, mIdx) => (
                            <div key={mIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '1px solid rgba(0,0,0,0.03)', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '150px' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'black', fontWeight: 400 }}>{formatTimeToAMPM(m.time)}</span>
                                    <span style={{
                                        fontSize: '0.5rem',
                                        fontWeight: 800,
                                        color: 'white',
                                        background: getLeagueColor(m.league),
                                        padding: '0.1rem 0.35rem',
                                        borderRadius: '3px',
                                        textTransform: 'uppercase'
                                    }}>{m.league}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{m.teams}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.8rem' }}>{m.tips}</span>
                                    <select
                                        value={m.status}
                                        onChange={(e) => updateVipMatchStatus(ticket.id!, mIdx, e.target.value as any)}
                                        className={`badge`}
                                        style={{
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'white',
                                            padding: '0.2rem 0.5rem',
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            borderRadius: '20px',
                                            background: m.status === 'win' ? '#00a86b' : m.status === 'lose' ? '#ef4444' : '#64748b'
                                        }}
                                    >
                                        <option value="pending" style={{ background: '#64748b', color: 'white' }}>⌛ Pending</option>
                                        <option value="win" style={{ background: '#00a86b', color: 'white' }}>✅ Won</option>
                                        <option value="lose" style={{ background: '#ef4444', color: 'white' }}>❌ Lose</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
