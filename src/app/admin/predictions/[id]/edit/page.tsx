'use client';

import { useState, useEffect, use } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Sparkles, Trash2, Plus, X, ChevronLeft } from 'lucide-react';
import styles from '../../../admin.module.css';

interface Category { id: string; name: string; }
interface BookingCode { platform: string; code: string; odds: string; }

const PLATFORMS = [
  { value: 'betway', label: 'Betway' },
  { value: 'sportybet', label: 'SportyBet' },
  { value: 'bet9ja', label: 'Bet9ja' },
  { value: 'msport', label: 'MSport' },
  { value: 'parimatch', label: 'PariMatch' },
  { value: '1xbet', label: '1xBet' },
];

const RESULT_OPTIONS = [
  { value: 'pending', label: '⏳ Pending' },
  { value: 'win', label: '✔ Won' },
  { value: 'lose', label: '✖ Lost' },
];

const emptyCode = (): BookingCode => ({ platform: 'betway', code: '', odds: '' });

export default function EditPrediction({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [bookingCodes, setBookingCodes] = useState<BookingCode[]>([emptyCode()]);

  const [form, setForm] = useState({
    title: '',
    match: '',
    league: '',
    pick: '',
    odds: '',
    time: '',
    content: '',
    category_id: '',
    result: 'pending',
    is_premium: false,
    media_url: '',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch categories
        const catSnap = await getDocs(collection(db, 'categories'));
        setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));

        // Fetch prediction
        const predSnap = await getDoc(doc(db, 'predictions', id));
        if (predSnap.exists()) {
          const data = predSnap.data();
          setForm({
            title: data.title || '',
            match: data.match || '',
            league: data.league || '',
            pick: data.pick || '',
            odds: data.odds || '',
            time: data.time || '',
            content: data.content || '',
            category_id: data.category_id || '',
            result: data.result || 'pending',
            is_premium: data.is_premium || false,
            media_url: data.media_url || '',
          });
          if (data.booking_codes) {
            setBookingCodes(data.booking_codes);
          }
          if (data.media_url) {
            setPreviewUrl(data.media_url);
          }
        } else {
          alert('Prediction not found');
          router.push('/admin/dashboard');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, router]);

  const set = (field: string, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const addCode = () => setBookingCodes(prev => [...prev, emptyCode()]);
  const removeCode = (i: number) => setBookingCodes(prev => prev.filter((_, idx) => idx !== i));
  const updateCode = (i: number, field: keyof BookingCode, value: string) =>
    setBookingCodes(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    if (previewUrl && !previewUrl.startsWith('http')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    set('media_url', '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalMediaUrl = form.media_url;

      if (mediaFile) {
        const fd = new FormData();
        fd.append('file', mediaFile);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        finalMediaUrl = data.secure_url;
      }

      const codes = bookingCodes.filter(c => c.code.trim() !== '');

      await updateDoc(doc(db, 'predictions', id), {
        ...form,
        media_url: finalMediaUrl,
        booking_codes: codes,
        updated_at: new Date(),
      });

      router.push('/admin/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to update prediction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading prediction data...</span>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <button onClick={() => router.back()} className={styles.backLink} style={{ marginBottom: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <ChevronLeft size={16} /> Back
          </button>
          <h1 className={styles.pageTitle}>Edit Prediction</h1>
          <p className={styles.pageSubtitle}>Update result and match details</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Left Column: Form */}
        <div>
          <form onSubmit={handleSubmit}>
            <div className={styles.formCard}>
              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ⚽ Match Info & Result
                </h2>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className="label">Result</label>
                    <select
                      className={styles.select}
                      value={form.result}
                      onChange={e => set('result', e.target.value)}
                      style={{ border: '2px solid var(--color-primary)', background: 'var(--color-surface-2)' }}
                    >
                      {RESULT_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className="label">Match</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Team A vs Team B"
                      value={form.match}
                      onChange={e => set('match', e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className="label">League</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Premier League"
                      value={form.league}
                      onChange={e => set('league', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className="label">Pick</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Over 2.5 Goals"
                      value={form.pick}
                      onChange={e => set('pick', e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className="label">Odds</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="1.85"
                      value={form.odds}
                      onChange={e => set('odds', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className="label">Match Time</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="20:00"
                      value={form.time}
                      onChange={e => set('time', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className="label">Category</label>
                    <select
                      className={styles.select}
                      value={form.category_id}
                      onChange={e => set('category_id', e.target.value)}
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup} style={{ alignSelf: 'end' }}>
                    <label
                      className={styles.switchRow}
                      onClick={() => set('is_premium', !form.is_premium)}
                    >
                      <div className={styles.switchLabel}>
                        <span className={styles.switchLabelText}>⚡ VIP / Premium</span>
                      </div>
                      <div className={`${styles.switch} ${form.is_premium ? styles.on : ''}`}>
                        <div className={styles.switchThumb} />
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0 0 1.75rem' }} />

              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.125rem' }}>
                  🎰 Booking Codes
                </h2>
                <div className={styles.bookingCodesSection}>
                  {bookingCodes.map((bc, i) => (
                    <div key={i} className={styles.bookingCodeRow}>
                      <div className={styles.formGroup}>
                        {i === 0 && <label className="label">Platform</label>}
                        <select
                          className={styles.select}
                          value={bc.platform}
                          onChange={e => updateCode(i, 'platform', e.target.value)}
                        >
                          {PLATFORMS.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        {i === 0 && <label className="label">Code</label>}
                        <input
                          type="text"
                          className="input"
                          placeholder="CODE"
                          value={bc.code}
                          onChange={e => updateCode(i, 'code', e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        {i === 0 && <label className="label">Odds</label>}
                        <input
                          type="text"
                          className="input"
                          placeholder="Odds"
                          value={bc.odds}
                          onChange={e => updateCode(i, 'odds', e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCode(i)}
                        className={styles.removeCodeBtn}
                        disabled={bookingCodes.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addCode} className={styles.addCodeBtn}>
                    <Plus size={14} /> Add Code
                  </button>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0 0 1.75rem' }} />

              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.125rem' }}>
                  📝 Details
                </h2>
                <div className={styles.formGroup}>
                  <label className="label">Analysis</label>
                  <textarea
                    className="input textarea"
                    placeholder="Notes..."
                    value={form.content}
                    onChange={e => set('content', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                  <label className="label">Page Title</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Display title"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                  {saving ? 'Updating...' : 'Update Prediction'}
                </button>
                <button type="button" onClick={() => router.back()} className="btn btn-ghost btn-lg">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Media */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className={styles.formCard} style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>
              🖼️ Media
            </h2>
            {previewUrl ? (
              <div style={{ position: 'relative' }}>
                {previewUrl.match(/\.(mp4|webm|ogg)$/i) || mediaFile?.type.startsWith('video/') ? (
                  <video src={previewUrl} style={{ width: '100%', borderRadius: 8 }} controls />
                ) : (
                  <img src={previewUrl} alt="Preview" style={{ width: '100%', borderRadius: 8 }} />
                )}
                <button
                  type="button"
                  onClick={removeMedia}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className={styles.uploadZone}>
                <div className={styles.uploadIcon}>📁</div>
                <div className={styles.uploadText}>Upload Media</div>
                <input type="file" accept="image/*,video/*" onChange={handleFile} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
