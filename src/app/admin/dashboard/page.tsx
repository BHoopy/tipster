'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import styles from '../admin.module.css';
import { Trophy, CheckCircle2, XCircle, Timer, Trash2, Edit3, PlusCircle, Settings, Save } from 'lucide-react';
import { setDoc } from 'firebase/firestore';

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
  const [vipPrice, setVipPrice] = useState(50);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const snap = await getDocs(query(collection(db, 'settings')));
      const general = snap.docs.find(d => d.id === 'general');
      if (general) setVipPrice(general.data().vipPrice || 50);
    } catch (err) { console.error(err); }
  }

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), { vipPrice }, { merge: true });
      alert('Settings saved!');
    } catch (err) { alert('Failed to save settings'); }
    finally { setSavingSettings(false); }
  };

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
    <div className="fade-in">
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
            <div className={styles.statLabel}>Total Tickets</div>
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
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blue}`} style={{ background: 'rgba(247,166,0,0.1)', color: '#f7a600' }}><Settings size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>VIP Price (GHS)</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <input
                type="number"
                value={vipPrice}
                onChange={(e) => setVipPrice(Number(e.target.value))}
                style={{ width: '80px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', padding: '4px 8px' }}
              />
              <button onClick={saveSettings} disabled={savingSettings} className="btn btn-primary btn-sm" style={{ padding: '4px 8px' }}>
                {savingSettings ? <div className={styles.spinner} style={{ width: '14px', height: '14px' }} /> : <Save size={16} />}
              </button>
            </div>
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
                  <th>Ticket</th>
                  <th>Games</th>
                  <th>Type</th>
                  <th>Result</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map(pred => {
                  const rs = RESULT_STYLES[pred.result || 'pending'];
                  return (
                    <tr key={pred.id}>
                      <td style={{ fontWeight: 700 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{pred.title}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                            {pred.created_at?.toDate ? pred.created_at.toDate().toLocaleDateString() : '—'}
                          </span>
                        </div>
                      </td>
                      <td>{pred.selections?.length || 0}</td>
                      <td>{pred.is_premium ? '⚡ VIP' : 'Free'}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: rs.bg,
                          color: rs.color,
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          textTransform: 'uppercase'
                        }}>
                          {rs.icon} {rs.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <Link href={`/admin/predictions/${pred.id}/edit`} className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }}>
                            <Edit3 size={16} />
                          </Link>
                          <button onClick={() => handleDelete(pred.id, pred.title)} className="btn btn-danger btn-sm" style={{ padding: '0.4rem' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {predictions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                No tickets found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
