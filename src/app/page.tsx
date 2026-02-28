'use client';

import React from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BookingCode {
  platform: string;
  code: string;
  odds?: string;
}

interface Prediction {
  id: string;
  title: string;
  content?: string;
  media_url?: string;
  category_id: string;
  match?: string;
  league?: string;
  pick?: string;
  odds?: string;
  time?: string;
  result?: 'win' | 'lose' | 'pending';
  is_premium?: boolean;
  booking_codes?: BookingCode[];
  created_at?: any;
}

// ─── Dummy data for preview ───────────────────────────────────────────────────
const DUMMY_PREDICTIONS: Prediction[] = [
  {
    id: 'd1', title: 'Man City vs Chelsea', match: 'Man City vs Chelsea',
    league: 'Premier League', pick: 'Man City Win', odds: '1.65',
    time: '17:30', result: 'win', category_id: 'football', is_premium: false,
    booking_codes: [
      { platform: 'betway', code: 'LMN-BW-291543', odds: '1.65' },
      { platform: 'sportybet', code: 'LMSPY-4923X', odds: '1.68' },
    ],
  },
  {
    id: 'd2', title: 'Real Madrid vs Atletico', match: 'Real Madrid vs Atletico',
    league: 'La Liga', pick: 'GG (Both Teams Score)', odds: '1.80',
    time: '20:00', result: 'win', category_id: 'football', is_premium: false,
    booking_codes: [
      { platform: 'bet9ja', code: 'B9JA-LM-88874', odds: '1.80' },
    ],
  },
  {
    id: 'd3', title: 'PSG vs Marseille', match: 'PSG vs Marseille',
    league: 'Ligue 1', pick: 'Over 2.5 Goals', odds: '1.55',
    time: '21:00', result: 'pending', category_id: 'football', is_premium: false,
    booking_codes: [
      { platform: 'sportybet', code: 'SPY-LEEM-6671', odds: '1.55' },
      { platform: 'betway', code: 'BW-LEEM-3310', odds: '1.52' },
    ],
  },
  {
    id: 'd4', title: 'Arsenal vs Tottenham', match: 'Arsenal vs Tottenham',
    league: 'Premier League', pick: 'Arsenal Win & Over 1.5', odds: '2.10',
    time: '14:00', result: 'lose', category_id: 'football', is_premium: true,
    booking_codes: [
      { platform: 'betway', code: 'LM-ARS-5572', odds: '2.10' },
      { platform: 'msport', code: 'MS-LEEMAN-4412', odds: '2.15' },
    ],
  },
  {
    id: 'd5', title: 'Bayern vs Dortmund', match: 'Bayern vs Dortmund',
    league: 'Bundesliga', pick: 'Over 3.5 Goals', odds: '2.00',
    time: '18:30', result: 'pending', category_id: 'football', is_premium: false,
    booking_codes: [
      { platform: 'sportybet', code: 'SPYLM-7721K', odds: '2.00' },
    ],
  },
  {
    id: 'd6', title: 'Juventus vs Inter', match: 'Juventus vs Inter',
    league: 'Serie A', pick: 'Draw', odds: '3.40',
    time: '19:45', result: 'win', category_id: 'football', is_premium: true,
    booking_codes: [
      { platform: 'betway', code: 'BW-JUVE-9921', odds: '3.40' },
      { platform: 'bet9ja', code: 'B9JA-JUV-8830', odds: '3.35' },
      { platform: 'sportybet', code: 'SPY-JUVE-1122', odds: '3.45' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PLATFORM_META: Record<string, { label: string; cls: string }> = {
  betway: { label: 'Betway', cls: 'betway' },
  sportybet: { label: 'SportyBet', cls: 'sportybet' },
  bet9ja: { label: 'Bet9ja', cls: 'bet9ja' },
  msport: { label: 'MSport', cls: 'msport' },
};

function BookingCodeCard({ code, platform, odds }: { code: string; platform: string; odds?: string }) {
  const [copied, setCopied] = useState(false);
  const meta = PLATFORM_META[platform] || { label: platform, cls: 'sportybet' };

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`${styles.bookingCard} ${styles[meta.cls]}`}>
      <div className={styles.bookingHeader}>
        <div className={styles.bookingPlatform}>
          <div className={`${styles.bookingLogo} ${styles[meta.cls]}`}>
            {platform === 'sportybet' ? (
              <Image
                src="/sportybet_logo.webp"
                alt="SportyBet"
                width={28}
                height={28}
                className={styles.platformIconImg}
              />
            ) : platform === 'betway' ? (
              <Image
                src="/betway.webp"
                alt="Betway"
                width={28}
                height={28}
                className={styles.platformIconImg}
              />
            ) : (
              meta.label.slice(0, 2).toUpperCase()
            )}
          </div>
          <span className={styles.bookingPlatformName}>{meta.label}</span>
        </div>
        {odds && <span className={styles.bookingOdds}>@ {odds}</span>}
      </div>
      <div>
        <span className={styles.bookingLabel}>Booking Code</span>
        <div className={styles.bookingCodeBox}>
          <span className={styles.bookingCode}>{code}</span>
          <button
            onClick={handleCopy}
            className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultBadge({ result }: { result?: 'win' | 'lose' | 'pending' | string }) {
  if (result === 'win') return (
    <span className={`${styles.badge} ${styles.badgeWin}`} style={{ background: 'rgba(0,200,81,0.12)', color: '#00c851', border: '1px solid rgba(0,200,81,0.25)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.73rem', fontWeight: 700 }}>
      ✔ Won
    </span>
  );
  if (result === 'lose') return (
    <span style={{ background: 'rgba(255,59,48,0.12)', color: '#ff3b30', border: '1px solid rgba(255,59,48,0.25)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.73rem', fontWeight: 700, display: 'inline-block' }}>
      ✖ Lost
    </span>
  );
  return (
    <span style={{ background: 'rgba(247,166,0,0.12)', color: '#f7a600', border: '1px solid rgba(247,166,0,0.25)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.73rem', fontWeight: 700, display: 'inline-block' }}>
      ⏳ Pending
    </span>
  );
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loadingObj, setLoadingObj] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { user, loading, isAdmin, signIn, logout } = useAuth();

  useEffect(() => {
    async function fetchData() {
      try {
        const categoriesSnap = await getDocs(
          query(collection(db, 'categories'), orderBy('name', 'asc'))
        );
        setCategories(categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Category[]);

        const predictionsSnap = await getDocs(
          query(collection(db, 'predictions'), orderBy('created_at', 'desc'))
        );
        const preds = predictionsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Prediction[];
        setPredictions(preds);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoadingObj(false);
      }
    }
    fetchData();
  }, []);

  // Merge real + dummy data for display
  const basePredictions = loadingObj
    ? []
    : predictions.length > 0
      ? predictions
      : DUMMY_PREDICTIONS;

  // Filter based on active tab
  const displayPredictions = activeTab === 'vip'
    ? basePredictions.filter(p => p.is_premium)
    : basePredictions;



  // Win stats (dummy or real)
  const wins = displayPredictions.filter(p => p.result === 'win').length;
  const total = displayPredictions.filter(p => p.result !== 'pending').length || 1;
  const winRate = Math.round((wins / total) * 100);

  return (
    <main className={styles.main}>
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className="container">
          <div className={styles.headerInner}>
            <Link href="/" className={styles.logoWrap}>
              <Image
                src="/leeman.png"
                alt="Leeman Tips"
                width={36}
                height={36}
                className={styles.logoImg}
              />
              <span className={styles.logoText}>Leeman Tips</span>
            </Link>

            <nav className={styles.nav}>
              <Link href="/" className={`${styles.navLink} ${activeTab === 'all' ? styles.active : ''}`}>Home</Link>
            </nav>

            <div className={styles.navActions}>
              {!loading && (
                <>
                  {isAdmin && (
                    <Link href="/admin" className="btn btn-ghost btn-sm">
                      ⚙ Admin
                    </Link>
                  )}
                  {user ? (
                    <>
                      {user.photoURL && (
                        <img src={user.photoURL} alt="avatar" className={styles.userAvatar} />
                      )}
                      <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
                    </>
                  ) : (
                    <button onClick={signIn} className="btn btn-primary btn-sm">
                      Sign In
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroTag}>
              <span className={styles.heroDot} />
              Daily Tips Updated
            </div>
            <h1>
              Win More with <span>Leeman Tips</span>
            </h1>
            <p>
              Expert football predictions, booking codes &amp; daily betting tips shared directly by Leeman. Free &amp; premium picks every day.
            </p>
            <div className={styles.heroActions}>
              <button onClick={!user ? signIn : undefined} className="btn btn-primary btn-lg">
                🎯 Get Free Tips
              </button>
              <Link href="/category/vip" className="btn btn-ghost btn-lg">
                ⚡ VIP Picks
              </Link>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>{winRate}%</span>
                <span className={styles.heroStatLabel}>Win Rate</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>{displayPredictions.length}+</span>
                <span className={styles.heroStatLabel}>Tips Today</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>5K+</span>
                <span className={styles.heroStatLabel}>Followers</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>Daily</span>
                <span className={styles.heroStatLabel}>Updates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Navigation Tabs ───────────────────────────────────────────── */}
      <div className={styles.categoryBar}>
        <div className="container" style={{ padding: 0 }}>
          <div className={styles.categoryTabs}>
            <button
              onClick={() => setActiveTab('all')}
              className={`${styles.categoryTab} ${activeTab === 'all' ? styles.activeTab : ''}`}
            >
              ⚽ Today's Tips
            </button>
            <button
              onClick={() => setActiveTab('vip')}
              className={`${styles.categoryTab} ${activeTab === 'vip' ? styles.activeTab : ''}`}
            >
              ⚡ VIP Tips
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main Content ────────────────────────────────────────────────── */}
      <section className={styles.content}>
        <div className="container">
          <div className={styles.contentLayout}>
            {/* Main Column */}
            <div>
              {/* Predictions Table */}
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Today's Predictions</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>

              <div className={styles.predictionCard}>
                <div className={styles.predTableWrap}>
                  <table className={styles.predTable}>
                    <thead>
                      <tr>
                        <th>Match</th>
                        <th>Pick / Tip</th>
                        <th>Odds</th>
                        <th>Time</th>
                        <th>Result</th>
                        <th>Codes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingObj ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i}>
                            <td colSpan={6}>
                              <div className={`skeleton loadingRow`} style={{ height: 48, borderRadius: 6 }} />
                            </td>
                          </tr>
                        ))
                      ) : displayPredictions.length === 0 ? (
                        <tr>
                          <td colSpan={6}>
                            <div className={styles.emptyState}>
                              <div className={styles.emptyStateIcon}>⚽</div>
                              <h3>No predictions yet</h3>
                              <p>Check back soon for today's tips!</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        displayPredictions.map(pred => (
                          <React.Fragment key={pred.id}>
                            <tr
                              onClick={() => setExpandedId(expandedId === pred.id ? null : pred.id)}
                              style={{ cursor: pred.booking_codes?.length ? 'pointer' : 'default' }}
                            >
                              <td className={styles.matchCell}>
                                <div className={styles.matchTeams}>
                                  {pred.match || pred.title}
                                  {pred.is_premium && (
                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', background: 'rgba(247,166,0,0.15)', color: '#f7a600', border: '1px solid rgba(247,166,0,0.3)', padding: '0.15rem 0.4rem', borderRadius: '999px', fontWeight: 700, verticalAlign: 'middle' }}>
                                      ⚡ VIP
                                    </span>
                                  )}
                                </div>
                                <div className={styles.matchMeta}>
                                  ⚽ <span className={styles.matchLeague}>{pred.league || 'Football'}</span>
                                </div>
                              </td>
                              <td className={styles.pickCell}>{pred.pick || pred.content?.substring(0, 40)}</td>
                              <td className={styles.oddsCell}>{pred.odds || '—'}</td>
                              <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                                {pred.time || (pred.created_at?.toDate?.() ? new Date(pred.created_at.toDate()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—')}
                              </td>
                              <td><ResultBadge result={pred.result || 'pending'} /></td>
                              <td>
                                {pred.booking_codes?.length ? (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}>
                                    {expandedId === pred.id ? '▲ Hide' : `▼ ${pred.booking_codes.length} code${pred.booking_codes.length > 1 ? 's' : ''}`}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>
                                )}
                              </td>
                            </tr>
                            {expandedId === pred.id && pred.booking_codes?.length && (
                              <tr>
                                <td colSpan={6} style={{ padding: '0 1rem 1rem', background: 'var(--color-surface)' }}>
                                  <div style={{ paddingTop: '0.75rem' }}>
                                    <div className={styles.bookingLabel} style={{ marginBottom: '0.625rem' }}>
                                      📌 Booking Codes for {pred.match || pred.title}
                                    </div>
                                    <div className={styles.bookingGrid}>
                                      {pred.booking_codes.map((bc, i) => (
                                        <BookingCodeCard key={i} code={bc.code} platform={bc.platform} odds={bc.odds} />
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>


            </div>

            {/* Sidebar */}
            <aside className={styles.sidebar}>
              {/* Win Rate Card */}
              <div className={styles.sideCard}>
                <div className={styles.sideCardHeader}>📊 Performance</div>
                <div className={styles.sideCardBody}>
                  <div className={styles.winRateBar}>
                    <div className={styles.winRateLabel}>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Win Rate</span>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{winRate}%</span>
                    </div>
                    <div className={styles.winRateTrack}>
                      <div className={styles.winRateFill} style={{ width: `${winRate}%` }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.875rem' }}>
                    {[
                      { label: 'Won', value: wins, color: 'var(--color-win)' },
                      { label: 'Lost', value: displayPredictions.filter(p => p.result === 'lose').length, color: 'var(--color-lose)' },
                      { label: 'Pending', value: displayPredictions.filter(p => p.result === 'pending').length, color: 'var(--color-pending)' },
                      { label: 'Total', value: displayPredictions.length, color: 'var(--color-text-secondary)' },
                    ].map(stat => (
                      <div key={stat.label} style={{ background: 'var(--color-surface)', borderRadius: 8, padding: '0.625rem 0.75rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.375rem', fontWeight: 800, color: stat.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{stat.value}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>



              {/* VIP CTA */}
              <div style={{ background: 'linear-gradient(135deg, rgba(247,166,0,0.1), rgba(255,107,0,0.08))', border: '1px solid rgba(247,166,0,0.2)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--color-secondary)', marginBottom: '0.375rem' }}>Go VIP</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  Get exclusive tips with higher odds & guaranteed booking codes
                </p>
                <Link href="/category/vip" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  Upgrade to VIP
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerInner}>
            <div>
              <div className={styles.logoWrap} style={{ marginBottom: '0.5rem' }}>
                <Image src="/leeman.png" alt="Leeman Tips" width={24} height={24} className={styles.logoImg} />
                <span className={styles.logoText} style={{ fontSize: '1rem' }}>Leeman Tips</span>
              </div>
              <p className={styles.footerText}>© {new Date().getFullYear()} Leeman Tips. Bet responsibly. 18+</p>
            </div>
            <div className={styles.footerLinks}>
              <Link href="/" className={styles.footerLink}>Home</Link>
              <Link href="/admin" className={styles.footerLink}>Admin</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
