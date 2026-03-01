'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { ChevronDown, ChevronUp, Copy, Clock, Zap, CheckCircle2, XCircle, ListPlus } from 'lucide-react';
import styles from './page.module.css';
import AuthModal from '@/components/AuthModal';

interface Selection {
  match: string;
  pick: string;
  odds: string;
  league?: string;
  time?: string;
  result: 'win' | 'lose' | 'pending';
}

interface Prediction {
  id: string;
  title: string;
  selections: Selection[];
  total_odds?: string;
  result: 'win' | 'lose' | 'pending';
  is_premium?: boolean;
  booking_codes?: { platform: string; code: string; odds?: string }[];
  created_at?: any;
}

function StatusBadge({ result, size = 'md' }: { result?: string, size?: 'sm' | 'md' }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    win: { label: 'WON', color: '#00c851', bg: 'rgba(0, 200, 81, 0.15)' },
    lose: { label: 'LOST', color: '#ff3b30', bg: 'rgba(255, 59, 48, 0.15)' },
    pending: { label: 'PENDING', color: '#f7a600', bg: 'rgba(247, 166, 0, 0.15)' },
  };
  const s = map[result || 'pending'] || map.pending;
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
  const { user, isAdmin, logout } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
              <Image src="/leeman.png" alt="Leeman" width={34} height={34} className={styles.logoImg} />
              <span className={styles.logoText}>Leeman Tips</span>
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
          <div className={styles.heroTag}><span className={styles.heroDot} /> Live Tickets</div>
          <h1>Expert <span>Daily</span> Tickets.</h1>
          <p>Winning accumulator tips and booking codes from top football analysts.</p>
          <div className={styles.heroActions}>
            <button onClick={() => setFilter('free')} className={`btn ${filter === 'free' ? 'btn-primary' : 'btn-ghost'}`}>Free Tickets</button>
            <button onClick={() => setFilter('vip')} className={`btn ${filter === 'vip' ? 'btn-secondary' : 'btn-ghost'}`}>⚡ VIP Picks</button>
          </div>
        </div>
      </section>

      <section className={styles.predictionSection}>
        <div className="container">
          <div className={styles.predictionList}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '16px', marginBottom: '1rem' }} />)
            ) : display.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <div style={{ marginBottom: '1rem', opacity: 0.5 }}><Zap size={48} /></div>
                <p style={{ color: 'var(--color-text-muted)' }}>No {filter === 'vip' ? 'VIP' : 'Free'} tickets available right now.</p>
              </div>
            ) : (
              display.map(ticket => (
                <div key={ticket.id} className={styles.predictionItem} style={{ border: ticket.is_premium ? '2px solid var(--color-gold)' : '1px solid var(--color-border)' }}>
                  <div className={styles.predictionMain} onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{ticket.title}</h3>
                        {ticket.is_premium && <Zap size={16} color="var(--color-gold)" fill="var(--color-gold)" />}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ListPlus size={14} /> {ticket.selections?.length || 0} Games</span>
                        <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{ticket.total_odds ? `@ ${ticket.total_odds}` : ''}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <StatusBadge result={ticket.result} />
                      {expandedId === ticket.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {expandedId === ticket.id && (
                    <div className={styles.bookingExpand}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                        {ticket.selections?.map((sel, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem', background: 'var(--color-surface)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{sel.match}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{sel.league}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: 'var(--color-secondary)', fontWeight: 800, fontSize: '0.9rem' }}>{sel.pick} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>@ {sel.odds}</span></div>
                              <div style={{ marginTop: '0.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                                {sel.result === 'win' ? <CheckCircle2 size={16} color="var(--color-primary)" /> : sel.result === 'lose' ? <XCircle size={16} color="var(--color-danger)" /> : <Clock size={16} color="var(--color-text-muted)" />}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {ticket.booking_codes && ticket.booking_codes.length > 0 && (
                        <div style={{ marginTop: '1.5rem' }}>
                          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Booking Codes</h4>
                          <div className={styles.bookingGrid}>
                            {ticket.booking_codes.map((bc, idx) => (
                              <div key={idx} className={styles.bookingCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                  <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{bc.platform}</span>
                                  {bc.odds && <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>@ {bc.odds}</span>}
                                </div>
                                <div className={styles.bookingCodeBox}>
                                  <span className={styles.bookingCode}>{bc.code}</span>
                                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(bc.code); alert('Copied!'); }} className={styles.copyBtn}><Copy size={14} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerLogo}><span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>LEEMAN TIPS</span></div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>&copy; {new Date().getFullYear()} Leeman Tips. Play responsibly. 18+</p>
          {isAdmin && (
            <div style={{ marginTop: '1rem' }}>
              <Link href="/admin" style={{ color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 700 }}>Admin Dashboard</Link>
            </div>
          )}
        </div>
      </footer>
    </main>
  );
}
