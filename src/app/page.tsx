'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { ChevronDown, ChevronUp, Copy, Check, Clock, Trophy, Zap, ShieldCheck } from 'lucide-react';
import styles from './page.module.css';
import AuthModal from '@/components/AuthModal';

interface Prediction {
  id: string;
  title: string;
  match?: string;
  league?: string;
  pick?: string;
  odds?: string;
  time?: string;
  result?: 'win' | 'lose' | 'pending';
  is_premium?: boolean;
  booking_codes?: { platform: string; code: string; odds?: string }[];
  created_at?: any;
}

const PLATFORMS: Record<string, string> = {
  betway: '/betway.webp',
  sportybet: '/sportybet_logo.webp',
  bet9ja: '/bet9ja.webp', // Assuming paths, fallback handles missing
  msport: '/msport.webp',
};

function ResultBadge({ result }: { result?: string }) {
  const styles_map: Record<string, { label: string; bg: string; color: string }> = {
    win: { label: 'WON', bg: 'rgba(0, 200, 81, 0.15)', color: '#00c851' },
    lose: { label: 'LOST', bg: 'rgba(255, 59, 48, 0.15)', color: '#ff3b30' },
    pending: { label: 'PENDING', bg: 'rgba(247, 166, 0, 0.15)', color: '#f7a600' },
  };
  const rs = styles_map[result || 'pending'] || styles_map.pending;
  return (
    <span style={{ 
      background: rs.bg, 
      color: rs.color, 
      padding: '0.35rem 0.75rem', 
      borderRadius: '6px', 
      fontSize: '0.65rem', 
      fontWeight: 800,
      letterSpacing: '0.04em',
      border: `1px solid ${rs.color}20`
    }}>
      {rs.label}
    </span>
  );
}

function BookingItem({ code, platform, odds }: { code: string; platform: string; odds?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.bookingCard}>
      <div className={styles.bookingHeader}>
        <div className={styles.bookingPlatform}>
          {PLATFORMS[platform] ? (
            <Image src={PLATFORMS[platform]} alt={platform} width={20} height={20} className={styles.platformIcon} />
          ) : (
            <div style={{ width: 20, height: 20, background: 'var(--color-surface-2)', borderRadius: 4 }} />
          )}
          <span style={{ textTransform: 'capitalize' }}>{platform}</span>
        </div>
        {odds && <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem' }}>@ {odds}</span>}
      </div>
      <div className={styles.bookingCodeBox}>
        <span className={styles.bookingCode}>{code}</span>
        <button onClick={handleCopy} className={styles.copyBtn}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isAdmin, loading: authLoading, logout } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'vip'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, 'predictions'), orderBy('created_at', 'desc'));
        const snap = await getDocs(q);
        setPredictions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Prediction[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayPredictions = filter === 'vip' 
    ? predictions.filter(p => p.is_premium)
    : predictions;

  return (
    <main className={styles.main}>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* ─── Header ────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className="container">
          <div className={styles.headerInner}>
            <Link href="/" className={styles.logoWrap}>
              <Image src="/leeman.png" alt="Leeman Tips" width={34} height={34} className={styles.logoImg} />
              <span className={styles.logoText}>Leeman Tips</span>
            </Link>

            <nav className={styles.nav}>
              {!authLoading && isAdmin && (
                <Link href="/admin" className="btn btn-ghost btn-sm">Admin</Link>
              )}
              {user ? (
                <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
              ) : (
                <button onClick={() => setIsAuthModalOpen(true)} className="btn btn-primary btn-sm">Sign In</button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* ─── Hero ──────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroTag}>
            <span className={styles.heroDot} />
            Live Predictions
          </div>
          <h1>Winning <span>Starts</span> Here.</h1>
          <p>Get daily high-accuracy football tips and booking codes from expert analysts.</p>
          <div className={styles.heroActions}>
            <button 
              onClick={() => setFilter('all')} 
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Today's Free Tips
            </button>
            <button 
              onClick={() => setFilter('vip')} 
              className={`btn ${filter === 'vip' ? 'btn-secondary' : 'btn-ghost'}`}
            >
              ⚡ VIP Predictions
            </button>
          </div>
        </div>
      </section>

      {/* ─── Main Content ────────────────────────────────────────── */}
      <section className={styles.predictionSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              {filter === 'vip' ? <Zap size={24} color="var(--color-secondary)" /> : <Trophy size={24} color="var(--color-primary)" />}
              {filter === 'all' ? "Today's Predictions" : "VIP Expert Picks"}
            </h2>
          </div>

          <div className={styles.predictionList}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />
              ))
            ) : displayPredictions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                <p>No predictions posted yet for this category.</p>
              </div>
            ) : (
              displayPredictions.map(pred => (
                <div key={pred.id} className={styles.predictionItem}>
                  {/* Desktop & Mobile Main Row */}
                  <div 
                    className={styles.predictionMain}
                    onClick={() => setExpandedId(expandedId === pred.id ? null : pred.id)}
                  >
                    <div className={styles.matchInfo}>
                      <div className={styles.matchTeams}>
                        {pred.match || pred.title}
                        {pred.is_premium && <span style={{ marginLeft: '8px', color: 'var(--color-secondary)' }}>⚡</span>}
                      </div>
                      <div className={styles.matchMeta}>
                        <ShieldCheck size={14} />
                        <span>{pred.league || 'Football'}</span>
                      </div>
                    </div>

                    <div className={styles.pickInfo}>
                      <span className={styles.pickLabel}>Pick</span>
                      <span className={styles.pickValue}>{pred.pick || '—'}</span>
                    </div>

                    <div className={styles.oddsInfo}>
                      <span className={styles.pickLabel}>Odds</span>
                      <span className={styles.oddsValue}>{pred.odds || '—'}</span>
                    </div>

                    <div className={styles.timeInfo}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                        <Clock size={14} />
                        {pred.time || '—'}
                      </div>
                    </div>

                    <div className={styles.statusInfo}>
                      <ResultBadge result={pred.result} />
                    </div>
                  </div>

                  {/* Mobile-only Stats View */}
                  <div className={styles.mobileStatsRow} onClick={() => setExpandedId(expandedId === pred.id ? null : pred.id)}>
                    <div className={styles.mobileStat}>
                      <span className={styles.mobileStatLabel}>Pick</span>
                      <span className={`${styles.mobileStatValue} ${styles.pick}`}>{pred.pick || '—'}</span>
                    </div>
                    <div className={styles.mobileStat}>
                      <span className={styles.mobileStatLabel}>Odds</span>
                      <span className={`${styles.mobileStatValue} ${styles.odds}`}>{pred.odds || '—'}</span>
                    </div>
                    <div className={styles.mobileStat}>
                      <span className={styles.mobileStatLabel}>Time</span>
                      <span className={styles.mobileStatValue}>{pred.time || '—'}</span>
                    </div>
                  </div>

                  {/* Expanded Booking Codes */}
                  {expandedId === pred.id && (
                    <div className={styles.bookingExpand}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                        AVAILABLE BOOKING CODES
                      </h4>
                      {pred.booking_codes && pred.booking_codes.length > 0 ? (
                        <div className={styles.bookingGrid}>
                          {pred.booking_codes.map((bc, idx) => (
                            <BookingItem key={idx} {...bc} />
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No codes provided for this match.</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerLogo}>
            <Image src="/leeman.png" alt="Leeman" width={24} height={24} />
            <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>LEEMAN TIPS</span>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/" className={styles.footerLink}>Home</Link>
            {!authLoading && isAdmin && <Link href="/admin" className={styles.footerLink}>Admin Panel</Link>}
            <a href="#" className={styles.footerLink}>Telegram</a>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            &copy; {new Date().getFullYear()} Leeman Tips. Play responsibly. 18+ only.
          </p>
        </div>
      </footer>
    </main>
  );
}