'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import styles from '../admin.module.css';

interface Prediction {
  id: string;
  title: string;
  match?: string;
  pick?: string;
  odds?: string;
  league?: string;
  result?: string;
  is_premium?: boolean;
  created_at?: any;
  booking_codes?: { platform: string; code: string; odds?: string }[];
}

const RESULT_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  win: { label: '✔ Won', bg: 'rgba(0,200,81,0.12)', color: '#00c851' },
  lose: { label: '✖ Lost', bg: 'rgba(255,59,48,0.12)', color: '#ff3b30' },
  pending: { label: '⏳ Pending', bg: 'rgba(247,166,0,0.12)', color: '#f7a600' },
};

export default function Dashboard() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [categories, setCategories] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const predSnap = await getDocs(
        query(collection(db, 'predictions'), orderBy('created_at', 'desc'))
      );
      setPredictions(predSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Prediction[]);

      const catSnap = await getDocs(collection(db, 'categories'));
      setCategories(catSnap.size);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'predictions', id));
      setPredictions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete prediction.');
    } finally {
      setDeleting(null);
    }
  };

  const wins = predictions.filter(p => p.result === 'win').length;
  const losses = predictions.filter(p => p.result === 'lose').length;
  const pending = predictions.filter(p => p.result === 'pending' || !p.result).length;
  const winRate = predictions.length > 0 ? Math.round((wins / Math.max(wins + losses, 1)) * 100) : 0;

  return (
    <div>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>Overview of all your predictions and performance</p>
        </div>
        <Link href="/admin/predictions/new" className="btn btn-primary">
          + New Prediction
        </Link>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {[
          { icon: '📋', label: 'Total Tips', value: predictions.length, cls: 'blue', change: 'All time' },
          { icon: '✅', label: 'Won', value: wins, cls: 'green', change: `${winRate}% win rate` },
          { icon: '❌', label: 'Lost', value: losses, cls: 'red', change: 'This period' },
          { icon: '⏳', label: 'Pending', value: pending, cls: 'amber', change: 'Awaiting result' },
          { icon: '🏷️', label: 'Categories', value: categories, cls: 'blue', change: 'Created' },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles[s.cls]}`}>{s.icon}</div>
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>{s.label}</div>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statChange}>{s.change}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Predictions Table */}
      <div className={styles.dataCard}>
        <div className={styles.dataCardHeader}>
          <span className={styles.dataCardTitle}>📊 All Predictions</span>
          <Link href="/admin/predictions/new" className="btn btn-primary btn-sm">+ Add New</Link>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Loading predictions...</span>
          </div>
        ) : predictions.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>⚽</div>
            <h3>No predictions yet</h3>
            <p>Create your first prediction to get started.</p>
            <Link href="/admin/predictions/new" className="btn btn-primary">Create Prediction</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Match / Title</th>
                  <th>Pick</th>
                  <th>Odds</th>
                  <th>Result</th>
                  <th>VIP</th>
                  <th>Codes</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map(pred => {
                  const rs = RESULT_STYLES[pred.result ?? 'pending'] ?? RESULT_STYLES.pending;
                  return (
                    <tr key={pred.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {pred.match || pred.title}
                        </div>
                        {pred.league && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {pred.league}
                          </div>
                        )}
                      </td>
                      <td style={{ color: 'var(--color-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>
                        {pred.pick || '—'}
                      </td>
                      <td style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                        {pred.odds || '—'}
                      </td>
                      <td>
                        <span style={{ background: rs.bg, color: rs.color, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {rs.label}
                        </span>
                      </td>
                      <td>
                        {pred.is_premium
                          ? <span style={{ color: '#f7a600', fontWeight: 700, fontSize: '0.8rem' }}>⚡ VIP</span>
                          : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Free</span>
                        }
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {pred.booking_codes?.length
                          ? `${pred.booking_codes.length} code${pred.booking_codes.length > 1 ? 's' : ''}`
                          : '—'
                        }
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {pred.created_at?.toDate
                          ? new Date(pred.created_at.toDate()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                          : '—'
                        }
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <Link
                            href={`/admin/predictions/${pred.id}/edit`}
                            className="btn btn-ghost btn-sm"
                          >
                            ✏ Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(pred.id, pred.match || pred.title)}
                            disabled={deleting === pred.id}
                            className="btn btn-danger btn-sm"
                          >
                            {deleting === pred.id ? '...' : '🗑 Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
