'use client';

import { useState } from 'react';
import { Plus, Zap, Copy, ChevronUp, Trash2 } from 'lucide-react';
import { addDoc, collection, serverTimestamp, deleteDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTeamAutocomplete, useTipAutocomplete, useLeagueAutocomplete } from '@/hooks/useAutocomplete';
import AutocompleteInput from '@/components/AutocompleteInput';
import { Match, QUICK_LEAGUES, getLeagueColor } from './types';

interface FreeTipsManagerProps {
    freeTips: Match[];
    updateMatchStatus: (col: string, id: string, status: 'win' | 'lose' | 'pending') => Promise<void>;
    sendNotification: boolean;
    getCurrentTime: () => string;
}

export default function FreeTipsManager({
    freeTips,
    updateMatchStatus,
    sendNotification,
    getCurrentTime
}: FreeTipsManagerProps) {
    const [showBulk, setShowBulk] = useState(false);
    const [bulkInput, setBulkInput] = useState('');
    const [homeTeam, setHomeTeam] = useState('');
    const [awayTeam, setAwayTeam] = useState('');
    const [newFreeTip, setNewFreeTip] = useState<Match>({
        time: getCurrentTime(), league: '', teams: '', tips: '', status: 'pending'
    });
    const [tipErrors, setTipErrors] = useState<{ homeTeam?: boolean; awayTeam?: boolean; tips?: boolean }>({});

    const teamAutocompleteHome = useTeamAutocomplete();
    const teamAutocompleteAway = useTeamAutocomplete();
    const tipAutocomplete = useTipAutocomplete();
    const leagueAutocomplete = useLeagueAutocomplete();

    const handleAddFreeTip = async () => {
        const errors: { homeTeam?: boolean; awayTeam?: boolean; tips?: boolean } = {};
        if (!homeTeam.trim()) errors.homeTeam = true;
        if (!awayTeam.trim()) errors.awayTeam = true;
        if (!newFreeTip.tips.trim()) errors.tips = true;

        if (Object.keys(errors).length > 0) {
            setTipErrors(errors);
            return;
        }

        setTipErrors({});
        const combinedTeams = `${homeTeam.trim()} vs ${awayTeam.trim()}`;

        await addDoc(collection(db, 'free_tips'), {
            ...newFreeTip,
            teams: combinedTeams,
            createdAt: serverTimestamp()
        });

        // Learn individually
        teamAutocompleteHome.learn(homeTeam.trim());
        teamAutocompleteAway.learn(awayTeam.trim());
        tipAutocomplete.learn(newFreeTip.tips);
        leagueAutocomplete.learn(newFreeTip.league);

        setHomeTeam('');
        setAwayTeam('');
        setNewFreeTip({ ...newFreeTip, time: getCurrentTime(), teams: '', tips: '', status: 'pending' });
        teamAutocompleteHome.clearSuggestions();
        teamAutocompleteAway.clearSuggestions();
        tipAutocomplete.clearSuggestions();
        leagueAutocomplete.clearSuggestions();
    };

    const handleHomeTeamChange = (value: string) => {
        setHomeTeam(value);
        teamAutocompleteHome.search(value);
    };

    const handleAwayTeamChange = (value: string) => {
        setAwayTeam(value);
        teamAutocompleteAway.search(value);
    };

    const handleBulkUpload = async () => {
        if (!bulkInput.trim()) return;
        const lines = bulkInput.trim().split('\n');
        const promises = lines.map(async (line) => {
            const parts = line.split('|').map(s => s.trim());
            if (parts.length >= 4) {
                const [time, league, teams, tips] = parts;
                leagueAutocomplete.learn(league);
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
    };

    const handleCopyPrevious = async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const snapshot = await getDocs(query(collection(db, 'free_tips'), where('createdAt', '>=', yesterday)));
        if (snapshot.empty) {
            alert('No tips from yesterday found');
            return;
        }
        const previousTips = snapshot.docs.map(doc => doc.data() as Match);
        const bulkText = previousTips.map(t => `${t.time || '18:00'} | ${t.league} | ${t.teams} | ${t.tips}`).join('\n');
        setBulkInput(bulkText);
        setShowBulk(true);
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
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0 }}>Manage Free Tips</h2>
                <button onClick={() => setShowBulk(!showBulk)} className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>
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
                            onClick={() => setNewFreeTip({ ...newFreeTip, league: league.name })}
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
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                }}>
                    {/* First Row: Time, League, Tips, Add Button */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                        gap: '0.75rem',
                        alignItems: 'end'
                    }}>
                        <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Time</label>
                            <input className="input" type="time" value={newFreeTip.time} onChange={e => setNewFreeTip({ ...newFreeTip, time: e.target.value })} style={{ height: '32px', fontSize: '0.75rem', padding: '0.25rem' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>League</label>
                            <AutocompleteInput
                                value={newFreeTip.league}
                                onChange={(val) => { setNewFreeTip({ ...newFreeTip, league: val }); leagueAutocomplete.search(val); }}
                                onSelect={() => { }}
                                suggestions={leagueAutocomplete.suggestions}
                                isLoading={leagueAutocomplete.isLoading}
                                placeholder="EPL"
                                style={{ height: '32px', fontSize: '0.75rem' }}
                            />
                        </div>
                        <div style={{ flex: 2 }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Tips *</label>
                            <AutocompleteInput
                                value={newFreeTip.tips}
                                onChange={(val) => { setNewFreeTip({ ...newFreeTip, tips: val }); tipAutocomplete.search(val); }}
                                onSelect={() => { }}
                                suggestions={tipAutocomplete.suggestions}
                                isLoading={tipAutocomplete.isLoading}
                                placeholder="Over 2.5"
                                style={{
                                    borderColor: tipErrors.tips ? '#ef4444' : undefined,
                                    height: '32px',
                                    fontSize: '0.75rem'
                                }}
                            />
                        </div>
                        <button onClick={handleAddFreeTip} className="btn btn-primary" style={{ height: '32px', padding: '0 1rem', fontSize: '0.75rem' }}>
                            <Plus size={14} /> Add Tip
                        </button>
                    </div>

                    {/* Second Row: Home VS Away (Horizontal) */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'rgba(0,168,107,0.03)',
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px dashed var(--color-primary)',
                        opacity: 0.9
                    }}>
                        {/* Home Team */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <AutocompleteInput
                                value={homeTeam}
                                onChange={handleHomeTeamChange}
                                onSelect={() => { }}
                                suggestions={teamAutocompleteHome.suggestions}
                                isLoading={teamAutocompleteHome.isLoading}
                                placeholder="Home"
                                style={{ borderColor: tipErrors.homeTeam ? '#ef4444' : undefined, height: '28px', fontSize: '0.7rem' }}
                            />
                        </div>

                        <div style={{ fontWeight: 900, color: 'var(--color-primary)', fontSize: '0.6rem', padding: '0 0.1rem', opacity: 0.7 }}>VS</div>

                        {/* Away Team */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <AutocompleteInput
                                value={awayTeam}
                                onChange={handleAwayTeamChange}
                                onSelect={() => { }}
                                suggestions={teamAutocompleteAway.suggestions}
                                isLoading={teamAutocompleteAway.isLoading}
                                placeholder="Away"
                                style={{ borderColor: tipErrors.awayTeam ? '#ef4444' : undefined, height: '28px', fontSize: '0.7rem' }}
                            />
                        </div>
                    </div>
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
                        <button onClick={handleCopyPrevious} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}>
                            <Copy size={14} /> Copy Yesterday
                        </button>
                    </div>
                    <textarea
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                        placeholder="18:00 | EPL | Arsenal vs Liverpool | Over 2.5"
                        style={{ width: '100%', minHeight: '120px', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontFamily: 'monospace', fontSize: '0.8125rem' }}
                    />
                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={handleBulkUpload} className="btn btn-primary">
                            <Zap size={16} /> Upload All
                        </button>
                    </div>
                </div>
            )
            }

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
                            <tr key={tip.id}>
                                <td style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>{formatTimeToAMPM(tip.time)}</td>
                                <td>
                                    <span style={{
                                        fontSize: '0.55rem',
                                        fontWeight: 800,
                                        color: 'white',
                                        background: getLeagueColor(tip.league),
                                        padding: '0.1rem 0.35rem',
                                        borderRadius: '3px',
                                        textTransform: 'uppercase'
                                    }}>{tip.league}</span>
                                </td>
                                <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{tip.teams}</td>
                                <td style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.85rem' }}>{tip.tips}</td>
                                <td>
                                    <select
                                        value={tip.status}
                                        onChange={(e) => updateMatchStatus('free_tips', tip.id!, e.target.value as any)}
                                        className="badge"
                                        style={{
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'white',
                                            padding: '0.2rem 0.5rem',
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            borderRadius: '20px',
                                            background: tip.status === 'win' ? '#00a86b' : tip.status === 'lose' ? '#ef4444' : '#64748b'
                                        }}
                                    >
                                        <option value="pending" style={{ background: '#64748b', color: 'white' }}>⌛ Pending</option>
                                        <option value="win" style={{ background: '#00a86b', color: 'white' }}>✅ Won</option>
                                        <option value="lose" style={{ background: '#ef4444', color: 'white' }}>❌ Lose</option>
                                    </select>
                                </td>
                                <td>
                                    <button onClick={async () => { if (confirm('Delete?')) await deleteDoc(doc(db, 'free_tips', tip.id!)) }} className="btn btn-outline" style={{ padding: '0.25rem', color: '#ef4444' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >
    );
}
