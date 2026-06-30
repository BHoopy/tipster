'use client';

import { useState } from 'react';
import { LuPlus as Plus, LuSave as Save, LuTrash2 as Trash2, LuZap as Zap } from 'react-icons/lu';
import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Match, VipTicket, QUICK_LEAGUES, getLeagueColor } from './types';
import { useTeamAutocomplete, useTipAutocomplete, useLeagueAutocomplete, useBundleAutocomplete } from '@/hooks/useAutocomplete';
import AutocompleteInput from '@/components/AutocompleteInput';

interface VipBundlesManagerProps {
    vipTickets: VipTicket[];
    getCurrentTime: () => string;
    adminUid?: string;
    adminEmail?: string | null;
}

export default function VipBundlesManager({ vipTickets, getCurrentTime, adminUid, adminEmail }: VipBundlesManagerProps) {
    const [activeVipTab, setActiveVipTab] = useState<'drafts' | 'published'>('drafts');
    const [newVipTicket, setNewVipTicket] = useState<{
        bundle_name: string;
        odds: string;
        booking_code: string;
        matches: { time: string; league: string; home: string; away: string; tips: string; status: 'pending' | 'win' | 'lose' }[];
    }>({
        bundle_name: '', odds: '', booking_code: '', matches: []
    });

    const [errors, setErrors] = useState<{ bundle_name?: boolean; odds?: boolean; matches?: boolean }>({});

    const teamAutocompleteHome = useTeamAutocomplete();
    const teamAutocompleteAway = useTeamAutocomplete();
    const tipAutocomplete = useTipAutocomplete();
    const leagueAutocomplete = useLeagueAutocomplete();
    const bundleAutocomplete = useBundleAutocomplete();

    const addMatchToVipPayload = () => {
        setNewVipTicket({
            ...newVipTicket,
            matches: [...newVipTicket.matches, { time: getCurrentTime(), league: '', home: '', away: '', tips: '', status: 'pending' }]
        });
    };

    const handleVipMatchChange = (idx: number, field: string, value: string) => {
        const updated = [...newVipTicket.matches];
        (updated[idx] as any)[field] = value;
        setNewVipTicket({ ...newVipTicket, matches: updated });

        if (field === 'home') {
            teamAutocompleteHome.search(value);
        } else if (field === 'away') {
            teamAutocompleteAway.search(value);
        } else if (field === 'tips') {
            tipAutocomplete.search(value);
        } else if (field === 'league') {
            leagueAutocomplete.search(value);
        }
    };

    const saveVipTicket = async () => {
        const newErrors: { bundle_name?: boolean; odds?: boolean; matches?: boolean } = {};
        if (!newVipTicket.bundle_name.trim()) newErrors.bundle_name = true;
        const oddsNum = parseFloat(newVipTicket.odds);
        if (!newVipTicket.odds.trim() || isNaN(oddsNum) || oddsNum < 5) newErrors.odds = true;
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
            booking_code: newVipTicket.booking_code || '',
            isPublished: false,
            matches: matchesToSave,
            createdAt: serverTimestamp(),
            createdBy: adminUid || null,
            createdByEmail: adminEmail || null
        });

        // Learn all teams, tips, and bundle names
        bundleAutocomplete.learn(newVipTicket.bundle_name.trim());
        newVipTicket.matches.forEach(m => {
            teamAutocompleteHome.learn(m.home.trim());
            teamAutocompleteAway.learn(m.away.trim());
            tipAutocomplete.learn(m.tips.trim());
            leagueAutocomplete.learn(m.league.trim());
        });

        // Clear all suggestions
        teamAutocompleteHome.clearSuggestions();
        teamAutocompleteAway.clearSuggestions();
        tipAutocomplete.clearSuggestions();
        leagueAutocomplete.clearSuggestions();
        bundleAutocomplete.clearSuggestions();

        setNewVipTicket({ bundle_name: '', odds: '', booking_code: '', matches: [] });
    };

    const publishTicket = async (id: string) => {
        await updateDoc(doc(db, 'vip_tickets', id), { isPublished: true });
    };

    const publishAllDrafts = async () => {
        const drafts = vipTickets.filter(t => !t.isPublished);
        if (drafts.length === 0) return;

        const batch = writeBatch(db);
        drafts.forEach(t => {
            const ticketRef = doc(db, 'vip_tickets', t.id!);
            batch.update(ticketRef, { isPublished: true });
        });
        await batch.commit();
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

        if (newTicketStatus !== 'pending' && ticket.status === 'pending') {
            await addDoc(collection(db, 'vip_tickets_history'), {
                ...ticket,
                matches: updatedMatches,
                status: newTicketStatus,
                resolvedAt: serverTimestamp()
            });
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
                        <AutocompleteInput
                            value={newVipTicket.bundle_name}
                            onChange={(val) => {
                                setNewVipTicket({ ...newVipTicket, bundle_name: val });
                                bundleAutocomplete.search(val);
                            }}
                            onSelect={() => {}}
                            suggestions={bundleAutocomplete.suggestions}
                            isLoading={bundleAutocomplete.isLoading}
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
                        {errors.odds && <span style={{ color: '#ef4444', fontSize: '0.6rem', marginTop: '0.2rem', display: 'block' }}>Must be at least 5</span>}
                    </div>
                    <div style={{ flex: '1', minWidth: '120px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Sportybet Code</label>
                        <input
                            className="input"
                            type="text"
                            value={newVipTicket.booking_code}
                            onChange={e => setNewVipTicket({ ...newVipTicket, booking_code: e.target.value })}
                            placeholder="8F3E2B"
                            style={{
                                height: '36px',
                                fontSize: '0.85rem'
                            }}
                        />
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
                                    suggestions={teamAutocompleteHome.suggestions}
                                    isLoading={teamAutocompleteHome.isLoading}
                                    placeholder="Home"
                                    style={{ height: '30px', fontSize: '0.75rem' }}
                                />
                            </div>

                            <img src="/vs.svg" alt="VS" style={{ height: '20px', width: 'auto' }} />

                            <div style={{ flex: 1, minWidth: '100px' }}>
                                <AutocompleteInput
                                    value={m.away}
                                    onChange={(val) => handleVipMatchChange(idx, 'away', val)}
                                    onSelect={() => { }}
                                    suggestions={teamAutocompleteAway.suggestions}
                                    isLoading={teamAutocompleteAway.isLoading}
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
                        <Save size={16} /> Save as Draft
                    </button>
                </div>
            </div>

            {/* VIP Tabs & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{
                    display: 'flex',
                    background: 'var(--color-bg)',
                    padding: '0.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)'
                }}>
                    <button
                        onClick={() => setActiveVipTab('drafts')}
                        style={{
                            padding: '0.4rem 1rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: 'none',
                            background: activeVipTab === 'drafts' ? 'white' : 'transparent',
                            boxShadow: activeVipTab === 'drafts' ? 'var(--shadow-sm)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            cursor: 'pointer'
                        }}
                    >
                        Drafts ({vipTickets.filter(t => !t.isPublished).length})
                    </button>
                    <button
                        onClick={() => setActiveVipTab('published')}
                        style={{
                            padding: '0.4rem 1rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: 'none',
                            background: activeVipTab === 'published' ? 'white' : 'transparent',
                            boxShadow: activeVipTab === 'published' ? 'var(--shadow-sm)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            cursor: 'pointer'
                        }}
                    >
                        Published ({vipTickets.filter(t => t.isPublished).length})
                    </button>
                </div>

                {activeVipTab === 'drafts' && vipTickets.filter(t => !t.isPublished).length > 0 && (
                    <button
                        onClick={publishAllDrafts}
                        className="btn btn-primary"
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: '#1e293b' }}
                    >
                        <Zap size={14} /> Publish All Drafts
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {vipTickets.filter(t => activeVipTab === 'published' ? t.isPublished : !t.isPublished).map(ticket => (
                    <div key={ticket.id} className="glass-card" style={{
                        padding: '1rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        opacity: ticket.isPublished ? 1 : 0.9,
                        background: ticket.isPublished ? 'white' : 'rgba(0,0,0,0.01)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div className="glass-card" style={{
                                    padding: '0.4rem',
                                    borderRadius: '8px',
                                    background: ticket.isPublished ? 'var(--gradient-primary)' : '#64748b',
                                    color: 'white'
                                }}>
                                    <Zap size={14} />
                                </div>
                                <h3 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 800 }}>
                                    {ticket.bundle_name} <span style={{ color: 'var(--color-primary)' }}>({ticket.odds} Odds)</span>
                                    {!ticket.isPublished && <span style={{ fontSize: '0.65rem', marginLeft: '0.5rem', color: '#64748b', fontWeight: 600, background: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>DRAFT</span>}
                                </h3>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {!ticket.isPublished && (
                                    <button
                                        onClick={() => publishTicket(ticket.id!)}
                                        className="btn btn-primary"
                                        style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', height: '24px' }}
                                    >
                                        Publish
                                    </button>
                                )}
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
