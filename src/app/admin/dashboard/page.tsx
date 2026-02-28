'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import styles from '../admin.module.css';
import { Trophy, CheckCircle2, XCircle, Timer, Trash2, Edit3, PlusCircle } from 'lucide-react';

interface Prediction {
  id: string;
  title: string;
  result: 'win' | 'lose' | 'pending';
  is_premium?: boolean;
  created_at?: any;
  selections?: any[];
}

const RESULT_STYLES: Record<string, { label: string; bg: string; color: string; icon: any }> = {
  win: { label: 'Won', bg: 'rgba(0,200,81,0.12)', color: '#00c851', icon: <CheckCircle2 size={14} /> },
  lose: { label: 'Lost', bg: 'rgba(255,59,48,0.12)', color: '#ff3b30', icon: <XCircle size={14} /> },
  pending: { label: 'Pending', bg: 'rgba(247,166,0,0.12)', color: '#f7a600', icon: <Timer size={14} /> },
};

export default function Dashboard() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const predSnap = await getDocs(query(collection(db, 'predictions'), orderBy('created_at', 'desc')));
      setPredictions(predSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Prediction[]);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete ticket "${title}"?`)) return;
    await deleteDoc(doc(db, 'predictions', id));
    setPredictions(prev => prev.filter(p => p.id !== id));
  };

  const wins = predictions.filter(p => p.result === 'win').length;
  const losses = predictions.filter(p => p.result === 'lose').length;
  const winRate = predictions.length > 0 ? Math.round((wins / Math.max(wins + losses, 1)) * 100) : 0;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <p className={styles.pageSubtitle}>Manage your expert tickets and track performance</p>
        </div>
        <Link href="/admin/predictions/new" className="btn btn-primary"><PlusCircle size={18} /> New Ticket</Link>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blue}`}><Trophy size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Tickets</div>
            <div className={styles.statValue}>{predictions.length}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.green}`}><CheckCircle2 size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Win Rate</div>
            <div className={styles.statValue}>{winRate}%</div>
          </div>
        </div>
      </div>

      <div className={styles.dataCard}>
        <div className={styles.dataCardHeader}><span className={styles.dataCardTitle}>🎟️ Active Tickets</span></div>
        {loading ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket Title</th>
                  <th>Games</th>
                  <th>Type</th>
                  <th>Result</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map(pred => {
                  const rs = RESULT_STYLES[pred.result || 'pending'];
                  return (
                    <tr key={pred.id}>
                      <td style={{ fontWeight: 700 }}>{pred.title}</td>
                      <td>{pred.selections?.length || 0} matches</td>
                      <td>{pred.is_premium ? '⚡ VIP' : 'Free'}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: rs.bg, color: rs.color, padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                          {rs.icon} {rs.label}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', opacity: 0.6 }}>{pred.created_at?.toDate ? pred.created_at.toDate().toLocaleDateString() : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <Link href={`/admin/predictions/${pred.id}/edit`} className="btn btn-ghost btn-sm"><Edit3 size={14} /></Link>
                          <button onClick={() => handleDelete(pred.id, pred.title)} className="btn btn-danger btn-sm"><Trash2 size={14} /></button>
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
