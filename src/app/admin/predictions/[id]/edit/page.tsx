'use client';

import { useState, useEffect, use } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, X, ChevronLeft, CheckCircle2, XCircle, Timer } from 'lucide-react';
import styles from '../../../admin.module.css';

interface BookingCode { platform: string; code: string; odds: string; }
interface Selection { match: string; pick: string; odds: string; league: string; time: string; result: 'win' | 'lose' | 'pending'; }

const RESULT_ICONS = {
  win: <CheckCircle2 size={16} color="var(--color-primary)" />,
  lose: <XCircle size={16} color="var(--color-danger)" />,
  pending: <Timer size={16} color="var(--color-secondary)" />,
};

export default function EditPrediction({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [bookingCodes, setBookingCodes] = useState<BookingCode[]>([]);
  const [form, setForm] = useState({ title: '', total_odds: '', is_premium: false, media_url: '', result: 'pending' });

  useEffect(() => {
    async function fetchData() {
      try {
        const predSnap = await getDoc(doc(db, 'predictions', id));
        if (predSnap.exists()) {
          const data = predSnap.data();
          setForm({
            title: data.title || '',
            total_odds: data.total_odds || '',
            is_premium: data.is_premium || false,
            media_url: data.media_url || '',
            result: data.result || 'pending',
          });
          setSelections(data.selections || []);
          setBookingCodes(data.booking_codes || []);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    fetchData();
  }, [id]);

  const updateSelectionResult = (index: number, res: 'win' | 'lose' | 'pending') => {
    const updated = selections.map((s, i) => i === index ? { ...s, result: res } : s);
    setSelections(updated);
    
    // Automatically calculate ticket result
    if (updated.some(s => s.result === 'lose')) {
      setForm(prev => ({ ...prev, result: 'lose' }));
    } else if (updated.every(s => s.result === 'win')) {
      setForm(prev => ({ ...prev, result: 'win' }));
    } else {
      setForm(prev => ({ ...prev, result: 'pending' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'predictions', id), {
        ...form,
        selections,
        booking_codes: bookingCodes,
        updated_at: new Date(),
      });
      router.push('/admin/dashboard');
    } catch (err) {
      alert('Update failed');
    } finally { setSaving(false); }
  };

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <button onClick={() => router.back()} className={styles.backLink}><ChevronLeft size={16} /> Back</button>
        <h1 className={styles.pageTitle}>Edit Ticket</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
          <div className={styles.formCard}>
            <h2 className={styles.bookingCodesSectionTitle}>🏆 Match Results</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selections.map((s, i) => (
                <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1.25rem', background: 'var(--color-surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{s.match}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{s.pick} @ {s.odds}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {(['pending', 'win', 'lose'] as const).map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => updateSelectionResult(i, r)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            background: s.result === r ? 'var(--color-bg-card)' : 'transparent',
                            opacity: s.result === r ? 1 : 0.4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          {RESULT_ICONS[r]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : 'Save Changes'}</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 1rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Ticket Result:</span>
                <span style={{ color: form.result === 'win' ? 'var(--color-primary)' : form.result === 'lose' ? 'var(--color-danger)' : 'var(--color-secondary)', fontWeight: 800 }}>
                  {form.result.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.formCard}>
            <h2 className={styles.bookingCodesSectionTitle}>Quick Settings</h2>
            <div className={styles.formGroup}>
              <label className="label">Ticket Title</label>
              <input type="text" className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label className="label">Total Odds</label>
              <input type="text" className="input" value={form.total_odds} onChange={e => setForm({...form, total_odds: e.target.value})} />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
