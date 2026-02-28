'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { processPrediction } from '@/ai/flows/process-prediction-flow';
import { Sparkles, Trash2, Plus, X, ListPlus } from 'lucide-react';
import styles from '../../admin.module.css';

interface Category { id: string; name: string; }
interface BookingCode { platform: string; code: string; odds: string; }
interface Selection { match: string; pick: string; odds: string; league: string; time: string; result: 'win' | 'lose' | 'pending'; }

const PLATFORMS = [
  { value: 'betway', label: 'Betway' },
  { value: 'sportybet', label: 'SportyBet' },
  { value: 'bet9ja', label: 'Bet9ja' },
  { value: 'msport', label: 'MSport' },
  { value: '1xbet', label: '1xBet' },
];

const emptySelection = (): Selection => ({ match: '', pick: '', odds: '', league: '', time: '', result: 'pending' });
const emptyCode = (): BookingCode => ({ platform: 'betway', code: '', odds: '' });

export default function NewPrediction() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingAi, setProcessingAi] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const [selections, setSelections] = useState<Selection[]>([emptySelection()]);
  const [bookingCodes, setBookingCodes] = useState<BookingCode[]>([emptyCode()]);

  const [form, setForm] = useState({
    title: '',
    total_odds: '',
    content: '',
    category_id: '',
    is_premium: false,
  });

  useEffect(() => {
    getDocs(collection(db, 'categories')).then(snap => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    });
  }, []);

  const handleAiProcess = async () => {
    if (!aiInput.trim()) return;
    setProcessingAi(true);
    try {
      const result = await processPrediction(aiInput);
      setForm(prev => ({
        ...prev,
        title: result.title || prev.title,
        total_odds: result.total_odds || prev.total_odds,
        content: result.content || prev.content,
        is_premium: result.is_premium ?? prev.is_premium,
      }));

      if (result.selections?.length) {
        setSelections(result.selections.map(s => ({
          match: s.match || '',
          pick: s.pick || '',
          odds: s.odds || '',
          league: s.league || '',
          time: s.time || '',
          result: 'pending'
        })));
      }

      if (result.booking_codes?.length) {
        setBookingCodes(result.booking_codes.map(bc => ({
          platform: bc.platform.toLowerCase(),
          code: bc.code,
          odds: bc.odds || '',
        })));
      }
      setAiInput('');
    } catch (err) {
      console.error(err);
      alert('AI processing failed. Please fill manually.');
    } finally {
      setProcessingAi(false);
    }
  };

  const addSelection = () => setSelections(prev => [...prev, emptySelection()]);
  const removeSelection = (i: number) => setSelections(prev => prev.filter((_, idx) => idx !== i));
  const updateSelection = (i: number, field: keyof Selection, value: string) =>
    setSelections(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

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

      const validSelections = selections.filter(s => s.match.trim() !== '');
      const validCodes = bookingCodes.filter(c => c.code.trim() !== '');

      await addDoc(collection(db, 'predictions'), {
        ...form,
        selections: validSelections,
        booking_codes: validCodes,
        media_url: mediaUrl,
        result: 'pending',
        created_at: new Date(),
      });

      router.push('/admin/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to save ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>New Ticket</h1>
          <p className={styles.pageSubtitle}>Create a new set of predictions</p>
        </div>
      </div>

      <div className={styles.pageGrid}>
        <div>
          {/* AI Box */}
          <div className={styles.aiBox}>
            <div className={styles.aiBoxHeader}>
              <Sparkles size={18} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>AI Multi-Pick Extractor</h2>
            </div>
            <div className={styles.aiBoxBody}>
              <textarea
                className="input"
                style={{ flex: 1, minHeight: '100px' }}
                placeholder="Paste bet slip reservation text or multiple picks here..."
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
              />
              <button type="button" className="btn btn-primary" onClick={handleAiProcess} disabled={processingAi || !aiInput.trim()}>
                {processingAi ? '...' : 'Process Slip'}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formCard}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 className={styles.bookingCodesSectionTitle}>🎟️ Ticket Info</h2>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className="label">Ticket Title</label>
                    <input type="text" className="input" placeholder="e.g. 10 Odds Accumulator" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className="label">Total Odds</label>
                    <input type="text" className="input" placeholder="10.50" value={form.total_odds} onChange={e => setForm({...form, total_odds: e.target.value})} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h2 className={styles.bookingCodesSectionTitle}>⚽ Individual Picks</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {selections.map((s, i) => (
                    <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem', background: 'var(--color-surface)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>Pick #{i + 1}</span>
                        <button type="button" onClick={() => removeSelection(i)} disabled={selections.length === 1} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                      </div>
                      <div className={styles.formGrid}>
                        <input type="text" className="input" placeholder="Teams" value={s.match} onChange={e => updateSelection(i, 'match', e.target.value)} required />
                        <input type="text" className="input" placeholder="Pick" value={s.pick} onChange={e => updateSelection(i, 'pick', e.target.value)} required />
                        <input type="text" className="input" placeholder="Odds" value={s.odds} onChange={e => updateSelection(i, 'odds', e.target.value)} />
                        <input type="text" className="input" placeholder="League" value={s.league} onChange={e => updateSelection(i, 'league', e.target.value)} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addSelection} className={styles.addCodeBtn}><Plus size={14} /> Add Another Match</button>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h2 className={styles.bookingCodesSectionTitle}>🎰 Booking Codes</h2>
                <div className={styles.bookingCodesSection}>
                  {bookingCodes.map((bc, i) => (
                    <div key={i} className={styles.bookingCodeRow}>
                      <select className={styles.select} value={bc.platform} onChange={e => updateCode(i, 'platform', e.target.value)}>
                        {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                      <input type="text" className="input" placeholder="CODE" value={bc.code} onChange={e => updateCode(i, 'code', e.target.value)} />
                      <input type="text" className="input" placeholder="Odds" value={bc.odds} onChange={e => updateCode(i, 'odds', e.target.value)} />
                      <button type="button" onClick={() => removeCode(i)} className={styles.removeCodeBtn} disabled={bookingCodes.length === 1}><Trash2 size={16} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addCode} className={styles.addCodeBtn}><Plus size={14} /> Add Platform</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>{loading ? 'Saving...' : 'Publish Ticket'}</button>
                <label className={styles.switchRow} onClick={() => setForm({...form, is_premium: !form.is_premium})}>
                  <div style={{ flex: 1 }}><span style={{ fontWeight: 600, fontSize: '0.9rem' }}>⚡ VIP</span></div>
                  <div className={`${styles.switch} ${form.is_premium ? styles.on : ''}`}><div className={styles.switchThumb} /></div>
                </label>
              </div>
            </div>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className={styles.formCard}>
            <h2 className={styles.bookingCodesSectionTitle}>🖼️ Media</h2>
            {previewUrl ? (
              <div style={{ position: 'relative' }}>
                <img src={previewUrl} style={{ width: '100%', borderRadius: 8 }} alt="Preview" />
                <button type="button" onClick={() => { setPreviewUrl(''); setMediaFile(null); }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', color: '#fff', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
              </div>
            ) : (
              <label className={styles.uploadZone}>
                <ListPlus size={32} className={styles.uploadIcon} />
                <div className={styles.uploadText}>Upload Media</div>
                <div className={styles.uploadHint}>Image or Video</div>
                <input type="file" accept="image/*,video/*" onChange={handleFile} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
