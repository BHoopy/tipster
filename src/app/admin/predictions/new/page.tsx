'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import styles from '../../admin.module.css';

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

export default function NewPrediction() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
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
  });

  useEffect(() => {
    getDocs(collection(db, 'categories')).then(snap => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    });
  }, []);

  const set = (field: string, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // Booking code helpers
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
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let mediaUrl = '';

      if (mediaFile) {
        const fd = new FormData();
        fd.append('file', mediaFile);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        mediaUrl = data.secure_url;
      }

      // Filter out empty booking codes
      const codes = bookingCodes.filter(c => c.code.trim() !== '');

      await addDoc(collection(db, 'predictions'), {
        ...form,
        media_url: mediaUrl,
        booking_codes: codes,
        created_at: new Date(),
      });

      router.push('/admin/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to save prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>New Prediction</h1>
          <p className={styles.pageSubtitle}>Create a new betting tip with booking codes</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.formCard}>

          {/* ── Section: Match Info ── */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚽ Match Info
            </h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className="label">Match (e.g. Man City vs Chelsea)</label>
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
                <label className="label">League / Tournament</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Premier League"
                  value={form.league}
                  onChange={e => set('league', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className="label">Pick / Tip</label>
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
                  placeholder="e.g. 1.85"
                  value={form.odds}
                  onChange={e => set('odds', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className="label">Match Time</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. 20:00"
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
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className="label">Result</label>
                <select
                  className={styles.select}
                  value={form.result}
                  onChange={e => set('result', e.target.value)}
                >
                  {RESULT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup} style={{ alignSelf: 'end' }}>
                {/* VIP Toggle */}
                <label
                  className={styles.switchRow}
                  onClick={() => set('is_premium', !form.is_premium)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.switchLabel}>
                    <span className={styles.switchLabelText}>⚡ VIP / Premium</span>
                    <span className={styles.switchLabelDesc}>Exclusive paid pick</span>
                  </div>
                  <div className={`${styles.switch} ${form.is_premium ? styles.on : ''}`}>
                    <div className={styles.switchThumb} />
                  </div>
                </label>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0 0 1.75rem' }} />

          {/* ── Section: Booking Codes ── */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🎰 Booking Codes
            </h2>

            <div className={styles.bookingCodesSection}>
              <div className={styles.bookingCodesSectionTitle}>
                Add booking codes from different platforms
              </div>

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
                    {i === 0 && <label className="label">Booking Code</label>}
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. LMN-BW-291543"
                      value={bc.code}
                      onChange={e => updateCode(i, 'code', e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    {i === 0 && <label className="label">Odds (opt.)</label>}
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. 5.20"
                      value={bc.odds}
                      onChange={e => updateCode(i, 'odds', e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeCode(i)}
                    className={styles.removeCodeBtn}
                    style={{ marginTop: i === 0 ? '1.5rem' : 0 }}
                    disabled={bookingCodes.length === 1}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button type="button" onClick={addCode} className={styles.addCodeBtn}>
                + Add Platform Code
              </button>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0 0 1.75rem' }} />

          {/* ── Section: Extra Info ── */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.125rem' }}>
              📝 Analysis / Notes (Optional)
            </h2>

            <div className={styles.formGroup}>
              <label className="label">Content / Analysis</label>
              <textarea
                className="input textarea"
                placeholder="Add your match analysis, stats, or reasoning here..."
                value={form.content}
                onChange={e => set('content', e.target.value)}
                style={{ minHeight: 120 }}
              />
            </div>

            <div className={styles.formGroup} style={{ marginTop: '1.25rem' }}>
              <label className="label">Title (for page heading)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Man City vs Chelsea — Premier League Tip"
                value={form.title}
                onChange={e => set('title', e.target.value)}
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0 0 1.75rem' }} />

          {/* ── Section: Media ── */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.125rem' }}>
              🖼️ Media (Optional)
            </h2>

            {previewUrl ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                {mediaFile?.type.startsWith('video/') ? (
                  <video src={previewUrl} style={{ maxWidth: 240, borderRadius: 8, border: '1px solid var(--color-border)' }} controls />
                ) : (
                  <img src={previewUrl} alt="Preview" style={{ maxWidth: 240, borderRadius: 8, border: '1px solid var(--color-border)', objectFit: 'cover' }} />
                )}
                <button type="button" onClick={removeMedia} className="btn btn-danger btn-sm">
                  ✕ Remove
                </button>
              </div>
            ) : (
              <label className={styles.uploadZone} style={{ cursor: 'pointer', display: 'block' }}>
                <div className={styles.uploadIcon}>📁</div>
                <div className={styles.uploadText}>Click to upload image or video</div>
                <div className={styles.uploadHint}>JPG, PNG, GIF, MP4 — max 10MB</div>
                <input type="file" accept="image/*,video/*" onChange={handleFile} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          {/* ── Submit ── */}
          <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ minWidth: 180 }}>
              {loading ? (
                <>
                  <span className={styles.spinner} style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Saving...
                </>
              ) : (
                '✓ Publish Prediction'
              )}
            </button>
            <button type="button" onClick={() => router.back()} className="btn btn-ghost btn-lg">
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
