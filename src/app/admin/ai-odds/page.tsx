'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateSafeOdds, AIOffsOutput } from '@/ai/flows/generate-safe-odds-flow';
import { Sparkles, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import styles from '../admin.module.css';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function AISafeOddsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<AIOffsOutput | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const matchesContext = `Today is Monday, March 2, 2026. Real-time Market Data:
      1. Real Madrid vs Getafe (La Liga, 20:00). Odds: Home Win @1.32, Draw @5.50, Away @10.00. 1X Double Chance @1.06. Over 1.5 @1.21.
      2. Gil Vicente vs Benfica (Primeira Liga, 20:15). Odds: Away Win @1.30. Over 1.5 Goals @1.25.
      3. Birmingham City vs Middlesbrough (Championship, 20:00). Odds: Over/Under 1.5 Goals favored @1.35.
      4. Udinese vs Fiorentina (Serie A, 19:45). Odds: BTTS Yes @1.85, Over 1.5 @1.40.
      5. SC Pisa vs Bologna (Serie A, 17:30). Odds: 1X2 market tight. Over 1.5 favored @1.35.
      6. Orlando City vs Inter Miami CF (MLS, 00:00). Odds: Lionel Messi expected. Over 2.5 @1.65. Over 1.5 @1.28.
      7. San Diego vs St. Louis (MLS, 02:15). Odds: Over 1.5 @1.30.
      8. Zaglebie Lubin vs Wisla Plock (Ekstraklasa, 18:00). Odds: 1X Double Chance @1.32.
      9. Hapoel Tel Aviv vs Maccabi Haifa (Ligat ha'Al, 21:30). Odds: Away Win @1.42.
      10. Amiens vs Troyes (Ligue 2, 19:45). Odds: 1X Double Chance @1.33.
      11. CD Tolima vs Atletico Nacional Medellin (01:30). Odds: Under 2.5 @1.68.
      12. Estudiantes de La Plata vs Velez Sarsfield (22:15). Odds: Over 1.5 @1.42.
      13. FK Sochi vs FK Spartak Moscow (Russian Cup, 12:00). Odds: Draw or Away @1.35.
      
      Instructions: Prioritize Home Win for Madrid, Double Chance for underdogs at home, and Over 1.5 for MLS/Championship. Target total odds of 20+. 
      `;

            const result = await generateSafeOdds(matchesContext);
            setData(result);
        } catch (err) {
            alert("Failed to generate odds. Please check your API key.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!data) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'predictions'), {
                title: data.title,
                total_odds: data.total_odds,
                selections: data.selections.map(s => ({
                    home_team: s.home_team,
                    away_team: s.away_team,
                    pick: s.pick,
                    odds: s.odds,
                    league: s.league,
                    time: s.time,
                    match_date: s.match_date,
                    result: 'pending'
                })),
                is_premium: false,
                created_at: new Date(),
                result: 'pending',
                content: "AI Generated Safe Accumulator focusing on high-probability outcomes for today's matches.",
            });
            router.push('/admin/dashboard');
        } catch (err) {
            alert("Failed to publish ticket.");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fade-in">
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>AI Safe Odds Generator</h1>
                    <p className={styles.pageSubtitle}>AI analysis of today's top matches to build a low-risk 20+ odds ticket</p>
                </div>
                {data && (
                    <button
                        className="btn btn-ghost"
                        onClick={handleGenerate}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                        Regenerate
                    </button>
                )}
            </div>

            {!data ? (
                <div className={styles.formCard} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
                        <Sparkles size={64} className="text-primary" style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 900 }}>Generate Safe 20+ Odds</h2>
                    <p style={{ maxWidth: '500px', margin: '0 auto 2rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                        Click the button below to have AI analyze today's priority matches (Real Madrid, Benfica, Inter Miami, etc.) and create a high-probability accumulator for you to review.
                    </p>
                    <button className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={loading} style={{ padding: '1rem 2.5rem' }}>
                        {loading ? 'Analyzing World Football...' : 'Start AI Generation'}
                    </button>
                </div>
            ) : (
                <div className={styles.pageGrid}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className={styles.formCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 className={styles.bookingCodesSectionTitle}>
                                    <CheckCircle2 size={18} color="var(--color-primary)" />
                                    AI Selections Review
                                </h2>
                                <span style={{
                                    background: 'var(--color-primary-glow)',
                                    color: 'var(--color-primary)',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: 800
                                }}>
                                    {data.selections.length} Matches Found
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {data.selections.map((s, i) => (
                                    <div key={i} style={{
                                        padding: '1.25rem',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '12px',
                                        background: 'var(--color-surface)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.league}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{s.time}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{s.home_team} vs {s.away_team}</div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span style={{
                                                    background: 'var(--color-bg-card)',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontWeight: 800,
                                                    fontSize: '0.9rem',
                                                    border: '1px solid var(--color-border)',
                                                    color: 'var(--color-text)'
                                                }}>{s.pick}</span>
                                                <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>@{s.odds}</span>
                                            </div>
                                        </div>
                                        {s.reasoning && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                                                <span style={{ color: 'var(--color-primary)', marginRight: '4px' }}>★</span> {s.reasoning}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className={styles.formCard}>
                            <h2 className={styles.bookingCodesSectionTitle}>Ticket Summary</h2>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="label">Accumulator Title</label>
                                <input type="text" className="input" value={data.title} onChange={e => setData({ ...data, title: e.target.value })} />
                            </div>

                            <div style={{
                                padding: '1.5rem',
                                background: 'linear-gradient(135deg, rgba(0,200,81,0.1), rgba(0,200,81,0.02))',
                                borderRadius: '16px',
                                border: '1px solid var(--color-primary)',
                                marginBottom: '1.5rem',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>ESTIMATED TOTAL ODDS</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>{data.total_odds}</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%', height: '54px', fontSize: '1rem', fontWeight: 800 }}
                                    onClick={handlePublish}
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 className="spin" size={20} /> : <CheckCircle2 size={20} />}
                                    {saving ? 'Publishing...' : 'Review and Publish'}
                                </button>
                                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
                                    Clicking "Publish" will add this ticket to your public dashboard.
                                </p>
                            </div>
                        </div>

                        <div className={styles.formCard} style={{ background: 'var(--color-surface)' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem' }}>How it works</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                                The AI analyzes team form, historical data, and market trends to select outcomes with a high probability of success, prioritizing <strong>Double Chance</strong> and <strong>Goal Markets</strong>.
                            </p>
                        </div>
                    </aside>
                </div>
            )}

            <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
