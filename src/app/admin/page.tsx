'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
    collection, addDoc, getDocs, updateDoc, doc,
    deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useTeamAutocomplete, useTipAutocomplete } from '@/hooks/useAutocomplete';
import AutocompleteInput from '@/components/AutocompleteInput';
import {
    Plus, Save, Trash2, CheckCircle2, XCircle,
    LayoutDashboard, Ticket, Zap, Copy, Bell, ChevronDown, ChevronUp
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

const QUICK_LEAGUES = [
    { name: 'EPL', color: '#3d195b' },
    { name: 'La Liga', color: '#ee8707' },
    { name: 'Serie A', color: '#024494' },
    { name: 'Bundesliga', color: '#d20515' },
    { name: 'Ligue 1', color: '#091c3e' },
    { name: 'UCL', color: '#1c1c1c' },
    { name: 'UEL', color: '#ff6600' },
];

export default function AdminDashboard() {
    const { user, isAdmin, loading } = useAuth();
    const [view, setView] = useState<'free' | 'vip' | 'history'>('free');
    const [sendNotification, setSendNotification] = useState(true);
    const [bulkInput, setBulkInput] = useState('');
    const [showBulk, setShowBulk] = useState(false);

    // History State
    const [historyTips, setHistoryTips] = useState<Match[]>([]);
    const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);

    // Free Tips State
    const [freeTips, setFreeTips] = useState<Match[]>([]);
    const getCurrentTime = () => {
        const now = new Date();
        return now.toTimeString().slice(0, 5);
    };
    const [newFreeTip, setNewFreeTip] = useState<Match>({
        time: getCurrentTime(), league: '', teams: '', tips: '', status: 'pending'
    });

    // VIP Tickets State
    const [vipTickets, setVipTickets] = useState<VipTicket[]>([]);
    const [newVipTicket, setNewVipTicket] = useState<VipTicket>({
        bundle_name: '', odds: '', matches: [], status: 'pending'
    });

    // Autocomplete hooks
    const teamAutocomplete = useTeamAutocomplete();
    const tipAutocomplete = useTipAutocomplete();

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

        return () => { unsubHistory(); };
    }, [isAdmin, view, historyDate]);

    if (loading) return <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>Loading...</div>;
    if (!isAdmin) return <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>Access Denied. Admins Only.</div>;

    // --- Free Tips Actions ---
    const handleAddFreeTip = async () => {
        if (!newFreeTip.teams || !newFreeTip.tips) return;
        await addDoc(collection(db, 'free_tips'), { ...newFreeTip, createdAt: serverTimestamp() });
        
        // Learn from the input
        const teamParts = newFreeTip.teams.split(' vs ');
        if (teamParts.length === 2) {
            teamParts.forEach(team => teamAutocomplete.learn(team.trim()));
        } else {
            teamAutocomplete.learn(newFreeTip.teams);
        }
        tipAutocomplete.learn(newFreeTip.tips);
        
        setNewFreeTip({ time: getCurrentTime(), league: '', teams: '', tips: '', status: 'pending' });
        teamAutocomplete.clearSuggestions();
        tipAutocomplete.clearSuggestions();
        
        if (sendNotification) {
            console.log('Would send notification for new tip');
        }
    };

    const handleTeamsChange = (value: string) => {
        setNewFreeTip({ ...newFreeTip, teams: value });
        teamAutocomplete.search(value);
    };

    const handleTipsChange = (value: string) => {
        setNewFreeTip({ ...newFreeTip, tips: value });
        tipAutocomplete.search(value);
    };

    const handleQuickLeague = (leagueName: string) => {
        setNewFreeTip({ ...newFreeTip, league: leagueName });
    };

    const handleBulkUpload = async () => {
        if (!bulkInput.trim()) return;
        
        const lines = bulkInput.trim().split('\n');
        const promises = lines.map(async (line) => {
            const parts = line.split('|').map(s => s.trim());
            if (parts.length >= 4) {
                const [time, league, teams, tips] = parts;
                return addDoc(collection(db, 'free_tips'), {
                    time, league, teams, tips,
                    status: 'pending',
                    createdAt: serverTimestamp()
                });
            }
        });

        await Promise.all(promises.filter(Boolean));
        setBulkInput('');
        setShowBulk(false);
        
        if (sendNotification) {
            console.log('Would send notification for bulk upload');
        }
    };

    const handleCopyPrevious = async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const snapshot = await getDocs(query(
            collection(db, 'free_tips'),
            where('createdAt', '>=', yesterday)
        ));

        if (snapshot.empty) {
            alert('No tips from yesterday found');
            return;
        }

        const previousTips = snapshot.docs.map(doc => doc.data() as Match);
        const bulkText = previousTips.map(t => 
            `${t.time || '18:00'} | ${t.league} | ${t.teams} | ${t.tips}`
        ).join('\n');
        
        setBulkInput(bulkText);
        setShowBulk(true);
    };

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

    const deleteItem = async (col: string, id: string) => {
        if (confirm('Are you sure?')) await deleteDoc(doc(db, col, id));
    };

    // --- VIP Bundle Actions ---
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
        
        if (sendNotification) {
            console.log('Would send notification for new VIP ticket');
        }
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

    return (
        <div className="container" style={{ maxWidth: '1200px' }}>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                {/* Sidebar */}
                <div style={{ 
                    width: '250px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.75rem',
                    flexShrink: 0
                }}>
                    <div style={{ 
                        background: 'var(--gradient-primary)', 
                        padding: '1.25rem', 
                        borderRadius: 'var(--radius-lg)',
                        color: 'white',
                        marginBottom: '0.5rem'
                    }}>
                        <h3 style={{ color: 'white', fontSize: '1.125rem', marginBottom: '0.25rem' }}>Admin Panel</h3>
                        <p style={{ fontSize: '0.75rem', opacity: 0.9 }}>Manage your tips</p>
                    </div>
                    
                    <button
                        onClick={() => setView('free')}
                        className={view === 'free' ? 'btn btn-primary' : 'btn btn-outline'}
                        style={{ width: '100%', justifyContent: 'flex-start', border: view === 'free' ? 'none' : undefined }}
                    >
                        <LayoutDashboard size={20} /> Free Tips
                    </button>
                    <button
                        onClick={() => setView('vip')}
                        className={view === 'vip' ? 'btn btn-primary' : 'btn btn-outline'}
                        style={{ width: '100%', justifyContent: 'flex-start', border: view === 'vip' ? 'none' : undefined }}
                    >
                        <Ticket size={20} /> VIP Bundles
                    </button>
                    <button
                        onClick={() => setView('history')}
                        className={view === 'history' ? 'btn btn-primary' : 'btn btn-outline'}
                        style={{ width: '100%', justifyContent: 'flex-start', border: view === 'history' ? 'none' : undefined }}
                    >
                        <Ticket size={20} /> History
                    </button>
                    
                    <div style={{ 
                        borderTop: '1px solid var(--color-border)', 
                        marginTop: '0.5rem', 
                        paddingTop: '1rem' 
                    }}>
                        <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer'
                        }}>
                            <input 
                                type="checkbox" 
                                checked={sendNotification}
                                onChange={(e) => setSendNotification(e.target.checked)}
                                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                            />
                            <Bell size={16} /> Send Notification
                        </label>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    {view === 'free' ? (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h2 style={{ margin: 0 }}>Manage Free Tips</h2>
                                <button 
                                    onClick={() => setShowBulk(!showBulk)}
                                    className="btn btn-outline"
                                    style={{ fontSize: '0.8125rem' }}
                                >
                                    {showBulk ? <ChevronUp size={16} /> : <Zap size={16} />}
                                    {showBulk ? 'Hide Bulk' : 'Bulk Upload'}
                                </button>
                            </div>

                            {/* Quick Add Section */}
                            <div style={{
                                background: 'var(--glass-card)',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                marginBottom: '1rem'
                            }}>
                                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                    <Zap size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                    Quick Add - Click a League
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                                    {QUICK_LEAGUES.map(league => (
                                        <button
                                            key={league.name}
                                            onClick={() => handleQuickLeague(league.name)}
                                            style={{
                                                padding: '0.375rem 0.75rem',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                background: newFreeTip.league === league.name ? 'var(--color-primary)' : league.color,
                                                color: 'white',
                                                border: 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {league.name}
                                        </button>
                                    ))}
                                </div>

                                {/* Add Form */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                    gap: '0.75rem',
                                    alignItems: 'end'
                                }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>Time</label>
                                        <input 
                                            className="input" 
                                            type="time" 
                                            value={newFreeTip.time} 
                                            onChange={e => setNewFreeTip({ ...newFreeTip, time: e.target.value })} 
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>League</label>
                                        <input 
                                            className="input" 
                                            type="text" 
                                            value={newFreeTip.league} 
                                            onChange={e => setNewFreeTip({ ...newFreeTip, league: e.target.value })} 
                                            placeholder="EPL"
                                        />
                                    </div>
                                    <div style={{ minWidth: '180px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>Teams</label>
                                        <AutocompleteInput
                                            value={newFreeTip.teams}
                                            onChange={handleTeamsChange}
                                            onSelect={() => {}}
                                            suggestions={teamAutocomplete.suggestions}
                                            isLoading={teamAutocomplete.isLoading}
                                            placeholder="Arsenal vs Liverpool"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>Tips</label>
                                        <AutocompleteInput
                                            value={newFreeTip.tips}
                                            onChange={handleTipsChange}
                                            onSelect={() => {}}
                                            suggestions={tipAutocomplete.suggestions}
                                            isLoading={tipAutocomplete.isLoading}
                                            placeholder="Over 2.5"
                                        />
                                    </div>
                                    <button onClick={handleAddFreeTip} className="btn btn-primary">
                                        <Plus size={18} /> Add Tip
                                    </button>
                                </div>
                            </div>

                            {/* Bulk Upload Section */}
                            {showBulk && (
                                <div style={{
                                    background: 'var(--color-bg)',
                                    padding: '1.5rem',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--color-border)',
                                    marginBottom: '1.5rem',
                                    animation: 'fadeInUp 0.3s ease-out'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.9375rem' }}>Bulk Upload</h4>
                                        <button 
                                            onClick={handleCopyPrevious}
                                            className="btn btn-outline"
                                            style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                                        >
                                            <Copy size={14} /> Copy Yesterday
                                        </button>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                                        Format: <code>18:00 | EPL | Arsenal vs Liverpool | Over 2.5</code>
                                    </p>
                                    <textarea
                                        value={bulkInput}
                                        onChange={(e) => setBulkInput(e.target.value)}
                                        placeholder="18:00 | EPL | Arsenal vs Liverpool | Over 2.5&#10;20:00 | La Liga | Real Madrid vs Barcelona | BTTS"
                                        style={{
                                            width: '100%',
                                            minHeight: '120px',
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-border)',
                                            fontFamily: 'monospace',
                                            fontSize: '0.8125rem',
                                            resize: 'vertical'
                                        }}
                                    />
                                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button onClick={handleBulkUpload} className="btn btn-primary">
                                            <Zap size={16} /> Upload All ({bulkInput.trim() ? bulkInput.trim().split('\n').length : 0})
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* List */}
                            <div style={{ overflowX: 'auto' }}>
                                <table className="tips-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '80px' }}>TIME</th>
                                            <th style={{ width: '100px' }}>LEAGUE</th>
                                            <th>TEAMS</th>
                                            <th style={{ width: '120px' }}>TIPS</th>
                                            <th style={{ width: '100px' }}>STATUS</th>
                                            <th style={{ width: '80px' }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {freeTips.map(tip => (
                                            <tr key={tip.id} className="animate-fade-in-up">
                                                <td style={{ fontWeight: 500 }}>{tip.time}</td>
                                                <td>
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: 700,
                                                        color: 'var(--color-primary)',
                                                        background: 'var(--color-primary-light)',
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '4px'
                                                    }}>{tip.league}</span>
                                                </td>
                                                <td style={{ fontWeight: 600 }}>{tip.teams}</td>
                                                <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{tip.tips}</td>
                                                <td>
                                                    <select 
                                                        value={tip.status}
                                                        onChange={(e) => updateMatchStatus('free_tips', tip.id!, e.target.value as 'win' | 'lose' | 'pending')}
                                                        style={{
                                                            padding: '0.375rem 0.5rem',
                                                            borderRadius: 'var(--radius-sm)',
                                                            border: '1px solid var(--color-border)',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            background: tip.status === 'win' ? 'var(--color-success)' : tip.status === 'lose' ? 'var(--color-danger)' : 'var(--color-text-muted)',
                                                            color: 'white'
                                                        }}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="win">Win</option>
                                                        <option value="lose">Lose</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <button 
                                                        onClick={() => deleteItem('free_tips', tip.id!)} 
                                                        style={{ color: 'var(--color-danger)', padding: '0.25rem' }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : view === 'vip' ? (
                        <div>
                            <h2 style={{ marginBottom: '0.5rem' }}>Manage VIP Bundles</h2>
                            <p style={{ color: 'var(--color-success)', fontWeight: 600, marginBottom: '1.5rem' }}>Guaranteed Win or Refund</p>

                            {/* Add VIP Form */}
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
                                        <input 
                                            className="input" 
                                            type="text" 
                                            value={newVipTicket.bundle_name} 
                                            onChange={e => setNewVipTicket({ ...newVipTicket, bundle_name: e.target.value })} 
                                            placeholder="Daily VIP Ticket" 
                                        />
                                    </div>
                                    <div style={{ flex: '1', minWidth: '120px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.375rem' }}>Total Odds</label>
                                        <input 
                                            className="input" 
                                            type="text" 
                                            value={newVipTicket.odds} 
                                            onChange={e => setNewVipTicket({ ...newVipTicket, odds: e.target.value })} 
                                            placeholder="10.50" 
                                        />
                                    </div>
                                </div>

                                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>Matches in Bundle</h4>
                                {newVipTicket.matches.map((m, idx) => (
                                    <div key={idx} style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                        gap: '0.5rem',
                                        marginBottom: '0.5rem',
                                        padding: '0.75rem',
                                        background: 'var(--color-bg)',
                                        borderRadius: 'var(--radius-sm)'
                                    }}>
                                        <input className="input" type="time" value={m.time} onChange={e => handleVipMatchChange(idx, 'time', e.target.value)} />
                                        <input className="input" placeholder="League" value={m.league} onChange={e => handleVipMatchChange(idx, 'league', e.target.value)} />
                                        <input className="input" placeholder="Teams" value={m.teams} onChange={e => handleVipMatchChange(idx, 'teams', e.target.value)} />
                                        <input className="input" placeholder="Tip" value={m.tips} onChange={e => handleVipMatchChange(idx, 'tips', e.target.value)} />
                                    </div>
                                ))}

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                    <button onClick={addMatchToVipPayload} className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>
                                        <Plus size={14} /> Add Match
                                    </button>
                                    <button onClick={saveVipTicket} className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                                        <Save size={18} /> Save Bundle
                                    </button>
                                </div>
                            </div>

                            {/* VIP List */}
                            {vipTickets.map(ticket => (
                                <div key={ticket.id} className="glass-card" style={{
                                    padding: '1.5rem',
                                    marginBottom: '1rem',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1rem', margin: 0 }}>{ticket.bundle_name} ({ticket.odds} Odds)</h3>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <span className={`badge badge-${ticket.status}`}>{ticket.status}</span>
                                            <button onClick={() => deleteItem('vip_tickets', ticket.id!)} style={{ color: 'var(--color-danger)' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                        {ticket.matches.map((m, mIdx) => (
                                            <div key={mIdx} style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'space-between',
                                                padding: '0.75rem 0',
                                                borderTop: '1px solid var(--color-border)',
                                                gap: '0.5rem',
                                                flexWrap: 'wrap'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '150px' }}>
                                                    <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{m.time}</span>
                                                    <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                                                    <span style={{ fontSize: '0.8125rem', flex: 1 }}>{m.teams}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.8125rem' }}>{m.tips}</span>
                                                    <select 
                                                        value={m.status}
                                                        onChange={(e) => updateVipMatchStatus(ticket.id!, mIdx, e.target.value as 'win' | 'lose' | 'pending')}
                                                        style={{
                                                            padding: '0.375rem 0.5rem',
                                                            borderRadius: 'var(--radius-sm)',
                                                            border: '1px solid var(--color-border)',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            background: m.status === 'win' ? 'var(--color-success)' : m.status === 'lose' ? 'var(--color-danger)' : 'var(--color-text-muted)',
                                                            color: 'white',
                                                            minWidth: '80px'
                                                        }}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="win">Win</option>
                                                        <option value="lose">Lose</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : view === 'history' ? (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h2 style={{ margin: 0 }}>History</h2>
                                <input 
                                    type="date" 
                                    value={historyDate}
                                    onChange={(e) => setHistoryDate(e.target.value)}
                                    className="input"
                                    style={{ width: 'auto', padding: '0.5rem' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                                {new Date(historyDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>

                            {historyTips.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                                    No history for this date.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {historyTips.map(tip => (
                                        <div key={tip.id} className="glass-card" style={{
                                            padding: '1rem',
                                            borderRadius: 'var(--radius-lg)',
                                            border: '1px solid var(--color-border)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '0.5rem'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{tip.time}</span>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    color: 'var(--color-primary)',
                                                    background: 'var(--color-primary-light)',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px'
                                                }}>{tip.league}</span>
                                                <span style={{ fontWeight: 600 }}>{tip.teams}</span>
                                                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{tip.tips}</span>
                                            </div>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: tip.status === 'win' ? 'var(--color-success)' : 'var(--color-danger)',
                                                color: 'white'
                                            }}>
                                                {tip.status === 'win' ? '✅ Won' : '❌ Lose'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>

            <style jsx>{`
                .input {
                    width: 100%;
                    padding: 0.625rem;
                    border-radius: var(--radius-sm);
                    border: 1px solid var(--color-border);
                    font-size: 0.875rem;
                    background: white;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .input:focus {
                    border-color: var(--color-primary);
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(0, 168, 107, 0.1);
                }
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
