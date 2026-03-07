'use client';

import React from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { Copy, Clock, Zap, CheckCircle2, XCircle, ListPlus } from 'lucide-react';
import styles from './page.module.css';
import AuthModal from '@/components/AuthModal';
import VipLocked from '@/components/VipLocked';

interface Selection {
  home_team: string;
  away_team: string;
  pick: string;
  odds: string;
  league?: string;
  time?: string;
  match_date?: string;
  result: 'win' | 'lose' | 'pending';
}

interface Prediction {
  id: string;
  title: string;
  selections: Selection[];
  total_odds: string;
  createdAt: string;
  is_premium: boolean;
  booking_codes?: { platform: string; code: string; odds: string }[];
  media_url?: string;
  status?: 'pending' | 'won' | 'lost';
  result?: 'win' | 'lose' | 'pending';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  return `${day}${suffix} ${month}, ${year}`;
}

const MARKETS_LABELS: Record<string, string> = {
  '1': 'Home Win',
  'X': 'Draw',
  '2': 'Away Win',
  '1X': 'Double Chance 1X',
  '12': 'Double Chance 12',
  'X2': 'Double Chance X2',
  'Over 0.5': 'Over 0.5',
  'Over 1.5': 'Over 1.5',
  'Over 2.5': 'Over 2.5',
  'Over 3.5': 'Over 3.5',
  'Under 2.5': 'Under 2.5',
  'Under 3.5': 'Under 3.5',
  'BTTS Yes': 'BTTS Yes',
  'BTTS No': 'BTTS No',
  'GG': 'GG',
  'NG': 'NG',
  '1 & Over 1.5': '1 & Over 1.5',
  '2 & Over 1.5': '2 & Over 1.5',
  '1HT': '1st Half Home',
  'XHT': '1st Half Draw',
  '2HT': '1st Half Away',
  'Corners Over 7.5': 'Corners O7.5',
  'Corners Over 9.5': 'Corners O9.5',
};

const getMarketLabel = (value: string) => MARKETS_LABELS[value] || value;

function StatusBadge({ result, size = 'md' }: { result?: string, size?: 'sm' | 'md' }) {
  const status = result?.toLowerCase() || 'pending';
  const map: Record<string, { label: string; color: string; bg: string }> = {
    win: { label: 'WON', color: '#00c851', bg: 'rgba(0, 200, 81, 0.15)' },
    won: { label: 'WON', color: '#00c851', bg: 'rgba(0, 200, 81, 0.15)' },
    lose: { label: 'LOST', color: '#ff3b30', bg: 'rgba(255, 59, 48, 0.15)' },
    lost: { label: 'LOST', color: '#ff3b30', bg: 'rgba(255, 59, 48, 0.15)' },
    pending: { label: 'PENDING', color: '#f7a600', bg: 'rgba(247, 166, 0, 0.15)' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      padding: size === 'sm' ? '0.2rem 0.5rem' : '0.4rem 0.8rem',
      borderRadius: '6px',
      fontSize: size === 'sm' ? '0.6rem' : '0.7rem',
      fontWeight: 800,
      border: `1px solid ${s.color}20`,
      whiteSpace: 'nowrap'
    }}>
      {s.label}
    </span>
  );
}

export default function Home() {
  const { user, isAdmin, isVip, logout } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [filter, setFilter] = useState<'free' | 'vip'>('free');

  useEffect(() => {
    getDocs(query(collection(db, 'predictions'), orderBy('created_at', 'desc'))).then(snap => {
      setPredictions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Prediction[]);
      setLoading(false);
    });
  }, []);

  const display = predictions.filter(p => filter === 'vip' ? p.is_premium : !p.is_premium);

  return (
    <main className={styles.main}>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <header className={styles.header}>
        <div className="container">
          <div className={styles.headerInner}>
            <Link href="/" className={styles.logoWrap}>
              <span className={styles.logoText}>Tipster Fhink</span>
            </Link>
            <nav className={styles.nav}>
              {isAdmin && <Link href="/admin" className="btn btn-ghost btn-sm">Admin</Link>}
              {user ? (
                <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
              ) : (
                <button onClick={() => setIsAuthModalOpen(true)} className="btn btn-primary btn-sm">Sign In</button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroTag}><span className={styles.heroDot} /> {predictions.length} Tickets Live</div>
          <h1>Expert <span>Daily</span> Picks.</h1>
          <p>{filter === 'vip' ? '🔥 Guaranteed wins. VIP-only access. Join now.' : 'The highest quality football betting analysis and booking codes from top professional tipsters.'}</p>
          <div className={styles.heroActions}>
            <button
              onClick={() => setFilter('free')}
              className={`btn btn-lg ${filter === 'free' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ paddingLeft: '2rem', paddingRight: '2rem' }}
            >
              Free Tickets
            </button>
            <button
              onClick={() => setFilter('vip')}
              className={`btn btn-lg ${filter === 'vip' ? 'btn-secondary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', background: filter === 'vip' ? 'linear-gradient(135deg, var(--color-gold), #b37700)' : 'transparent' }}
            >
              <Zap size={18} fill={filter === 'vip' ? '#000' : 'currentColor'} color={filter === 'vip' ? '#000' : 'currentColor'} />
              VIP Exclusive
            </button>
          </div>
        </div>
      </section>

      <section className={styles.predictionSection}>
        <div className="container">
          <div className={styles.predictionList}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '16px', marginBottom: '1rem' }} />)
            ) : filter === 'vip' && !isVip ? (
              <VipLocked onSuccess={() => window.location.reload()} />
            ) : display.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <div style={{ marginBottom: '1rem', opacity: 0.5 }}><Zap size={48} /></div>
                <p style={{ color: 'var(--color-text-muted)' }}>No {filter === 'vip' ? 'VIP' : 'Free'} tickets available right now.</p>
              </div>
            ) : (
              display.map(ticket => (
                <div
                  key={ticket.id}
                  className={`${styles.predictionItem} ${ticket.is_premium ? styles.vipItem : ''}`}
                >
                  <div className={styles.predictionMain}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: ticket.is_premium ? 'var(--color-gold)' : 'inherit' }}>{ticket.title}</h3>
                        {ticket.is_premium && <div style={{ background: 'var(--color-gold)', borderRadius: '4px', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}><Zap size={10} color="#000" fill="#000" /><span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#000' }}>VIP</span></div>}
                      </div>
                      <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><ListPlus size={16} opacity={0.6} /> {ticket.selections?.length || 0} Selections</span>
                        {ticket.total_odds && (
                          <span style={{
                            background: ticket.is_premium ? 'rgba(247, 166, 0, 0.1)' : 'rgba(0, 200, 81, 0.1)',
                            color: ticket.is_premium ? 'var(--color-gold)' : 'var(--color-primary)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: 800,
                            border: '1px solid currentColor'
                          }}>
                            @ {ticket.total_odds}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <StatusBadge result={ticket.status || ticket.result} />
                    </div>
                  </div>

                  <div className={styles.bookingExpand}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
                      {ticket.selections?.map((sel, idx) => (
                        <div
                          key={idx}
                          className={`${styles.matchRow} ${sel.result === 'win' ? styles.matchRowWin : sel.result === 'lose' ? styles.matchRowLose : ''}`}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.975rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {sel.home_team} <span style={{ opacity: 0.3, fontSize: '0.7rem' }}>VS</span> {sel.away_team}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              {sel.league} {sel.time && ` • ${sel.time}`}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <div style={{ color: 'var(--color-secondary)', fontWeight: 800, fontSize: '0.9rem' }}>{getMarketLabel(sel.pick)}</div>
                              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>@ {sel.odds}</div>
                            </div>
                            <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                              {sel.result === 'win' ? <CheckCircle2 size={18} color="var(--color-primary)" /> : sel.result === 'lose' ? <XCircle size={18} color="var(--color-danger)" /> : <Clock size={16} opacity={0.4} />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {ticket.media_url && (
                      <div className={styles.tipImage}>
                        <img src={ticket.media_url} alt="Betslip" />
                      </div>
                    )}

                    {ticket.booking_codes && ticket.booking_codes.length > 0 && (
                      <div style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', paddingLeft: '4px' }}>
                          <span style={{ width: '12px', height: '1px', background: 'var(--color-primary)' }} />
                          <h4 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Booking Codes</h4>
                        </div>
                        <div className={styles.bookingGrid}>
                          {ticket.booking_codes.map((bc, idx) => (
                            <div key={idx} className={styles.bookingCard}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div className={styles.bookingPlatform}>
                                  {bc.platform}
                                </div>
                                {bc.odds && <span style={{ color: 'var(--color-primary)', fontWeight: 900, fontSize: '0.95rem' }}>@ {bc.odds}</span>}
                              </div>
                              <div className={styles.bookingCodeBox}>
                                <span className={styles.bookingCode}>{bc.code}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(bc.code);
                                    const target = e.currentTarget;
                                    const originalContent = target.innerHTML;
                                    target.innerHTML = '<span style="font-size: 10px; font-weight: 800">COPIED</span>';
                                    setTimeout(() => target.innerHTML = originalContent, 2000);
                                  }}
                                  className={styles.copyButton}
                                >
                                  <Copy size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerLogo}><span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>TIPSTER FHINK</span></div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>&copy; {new Date().getFullYear()} Tipster Fhink. Play responsibly. 18+</p>
          {isAdmin && (
            <div style={{ marginTop: '1rem' }}>
              <Link href="/admin" style={{ color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 700 }}>Admin Dashboard</Link>
            </div>
          )}
        </div>
      </footer>

      <div className={styles.mobileNav}>
        <button
          onClick={() => setFilter('free')}
          className={`${styles.mobileTab} ${filter === 'free' ? styles.activeTab : ''}`}
        >
          Free Tickets
        </button>
        <button
          onClick={() => setFilter('vip')}
          className={`${styles.mobileTab} ${filter === 'vip' ? styles.activeVipTab : ''}`}
        >
          <Zap size={16} fill="currentColor" /> VIP Exclusive
        </button>
      </div>
    </main>
  );
}
