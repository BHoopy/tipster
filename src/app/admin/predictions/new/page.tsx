'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { processPrediction } from '@/ai/flows/process-prediction-flow';
import { Trash2, Plus, X, ListPlus, ChevronLeft, ScanText, Sparkles } from 'lucide-react';
import styles from '../../admin.module.css';

interface BookingCode { platform: string; code: string; odds: string; }
interface Selection { home_team: string; away_team: string; pick: string; odds: string; league: string; time: string; match_date: string; result: 'win' | 'lose' | 'pending'; }

const PLATFORMS = [
  { value: 'betway', label: 'Betway' },
  { value: 'sportybet', label: 'SportyBet' },
  { value: 'bet9ja', label: 'Bet9ja' },
  { value: 'msport', label: 'MSport' },
  { value: '1xbet', label: '1xBet' },
];

const emptySelection = (): Selection => ({ home_team: '', away_team: '', pick: '', odds: '', league: '', time: '', match_date: '', result: 'pending' });
const emptyCode = (): BookingCode => ({ platform: 'betway', code: '', odds: '' });

export default function NewPrediction() {
  const router = useRouter();
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
    is_premium: false,
  });

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
          home_team: s.home_team || '',
          away_team: s.away_team || '',
          pick: s.pick || '',
          odds: s.odds || '',
          league: s.league || '',
          time: s.time || '',
          match_date: s.match_date || '',
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
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'AI processing failed. Please fill manually.');
    } finally {
      setProcessingAi(false);
    }
  };

  const addSelection = () => setSelections(prev => [...prev, emptySelection()]);
  const removeSelection = (i: number) => setSelections(prev => prev.filter((_, idx) => idx !== i));
  const updateSelection = (i: number, field: keyof Selection, value: string) =>
    setSelections(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  
  const getMatchString = (s: Selection) => s.home_team && s.away_team ? `${s.home_team} vs ${s.away_team}` : s.home_team || s.away_team || '';

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

      const validSelections = selections.filter(s => s.home_team.trim() !== '' && s.away_team.trim() !== '');
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
    <div className="fade-in">
      <div className={styles.pageHeader}>
        <div>
          <button onClick={() => router.back()} className={styles.backLink} style={{ marginBottom: '0.5rem' }}>
            <ChevronLeft size={16} /> Back to Dashboard
          </button>
          <h1 className={styles.pageTitle}>Create New Ticket</h1>
          <p className={styles.pageSubtitle}>Paste bet slip text for AI to extract picks automatically</p>
        </div>
      </div>

      <div className={styles.pageGrid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div className={styles.formCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <ScanText size={20} color="var(--color-primary)" />
              <h2 className={styles.bookingCodesSectionTitle} style={{ marginBottom: 0 }}>AI Text Extractor</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Paste raw text from bet slip. AI will extract teams, markets, odds and calculate total odds.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <textarea
                className="input"
                style={{ minHeight: '150px', resize: 'vertical' }}
                placeholder="Paste bet slip text here...&#10;Example:&#10;Man City vs Liverpool&#10;Home Win @ 1.85&#10;Over 2.5 @ 1.90&#10;Total Odds: 3.52&#10;&#10;Or paste multiple games:&#10;Arsenal vs Chelsea - 1 @ 2.00&#10;Man Utd vs Liverpool - Over 2.5 @ 1.75&#10;Total Odds: 3.50"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
              />
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleAiProcess} 
                disabled={processingAi || !aiInput.trim()}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Sparkles size={16} />
                {processingAi ? 'Processing...' : 'Extract Picks with AI'}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div className={styles.formCard}>
              <div style={{ marginBottom: '2rem' }}>
                <h2 className={styles.bookingCodesSectionTitle}>🎟️ Ticket Information</h2>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className="label">Ticket Title</label>
                    <input type="text" className="input" placeholder="e.g. 10 Odds Accumulator" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className="label">Total Odds</label>
                    <input type="text" className="input" placeholder="e.g. 10.50" value={form.total_odds} onChange={e => setForm({...form, total_odds: e.target.value})} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h2 className={styles.bookingCodesSectionTitle}>⚽ Individual Selections</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {selections.map((s, i) => (
                    <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', background: 'var(--color-surface)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selection #{i + 1}</span>
                        <button type="button" onClick={() => removeSelection(i)} disabled={selections.length === 1} style={{ color: 'var(--color-danger)' }}><Trash2 size={18} /></button>
                      </div>
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label className="label">Home Team</label>
                          <input type="text" className="input" placeholder="e.g. Manchester City" value={s.home_team} onChange={e => updateSelection(i, 'home_team', e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                          <label className="label">Away Team</label>
                          <input type="text" className="input" placeholder="e.g. Liverpool" value={s.away_team} onChange={e => updateSelection(i, 'away_team', e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                          <label className="label">Market</label>
                          <input 
                            type="text" 
                            className="input" 
                            placeholder="e.g. 1, X, 2, Over 1.5, BTTS Yes"
                            value={s.pick} 
                            onChange={e => updateSelection(i, 'pick', e.target.value)} 
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className="label">Odds</label>
                          <input type="text" className="input" placeholder="e.g. 1.85" value={s.odds} onChange={e => updateSelection(i, 'odds', e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                          <label className="label">League</label>
                          <input type="text" className="input" placeholder="Competition" value={s.league} onChange={e => updateSelection(i, 'league', e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                          <label className="label">Date</label>
                          <input type="text" className="input" placeholder="e.g. 02/03/2026" value={s.match_date} onChange={e => updateSelection(i, 'match_date', e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                          <label className="label">Time</label>
                          <input type="time" className="input" value={s.time} onChange={e => updateSelection(i, 'time', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addSelection} className={styles.addCodeBtn}><Plus size={16} /> Add Match</button>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h2 className={styles.bookingCodesSectionTitle}>🎰 Platform Booking Codes</h2>
                <div className={styles.bookingCodesSection}>
                  {bookingCodes.map((bc, i) => (
                    <div key={i} className={styles.bookingCodeRow}>
                      <select className={styles.select} value={bc.platform} onChange={e => updateCode(i, 'platform', e.target.value)}>
                        {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                      <input type="text" className="input" placeholder="CODE" value={bc.code} onChange={e => updateCode(i, 'code', e.target.value)} />
                      <input type="text" className="input" placeholder="Odds" value={bc.odds} onChange={e => updateCode(i, 'odds', e.target.value)} />
                      <button type="button" onClick={() => removeCode(i)} className="btn btn-ghost" style={{ padding: '0.5rem', color: 'var(--color-danger)' }} disabled={bookingCodes.length === 1}><Trash2 size={18} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addCode} className={styles.addCodeBtn}><Plus size={16} /> Add Another Platform</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1, maxWidth: '300px' }} disabled={loading}>{loading ? 'Publishing...' : 'Publish Ticket'}</button>
                <label className={styles.switchRow} onClick={() => setForm({...form, is_premium: !form.is_premium})} style={{ minWidth: '160px' }}>
                  <div style={{ flex: 1 }}><span style={{ fontWeight: 700, fontSize: '0.9rem' }}>⚡ VIP ONLY</span></div>
                  <div className={`${styles.switch} ${form.is_premium ? styles.on : ''}`}><div className={styles.switchThumb} /></div>
                </label>
              </div>
            </div>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div className={styles.formCard}>
            <h2 className={styles.bookingCodesSectionTitle}>🖼️ Ticket Media</h2>
            <div style={{ width: '100%' }}>
              {previewUrl ? (
                <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                  <img src={previewUrl} style={{ width: '100%', display: 'block' }} alt="Preview" />
                  <button type="button" onClick={() => { setPreviewUrl(''); setMediaFile(null); }} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', borderRadius: '50%', color: '#fff', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}><X size={18} /></button>
                </div>
              ) : (
                <label className={styles.uploadZone}>
                  <ListPlus size={36} className={styles.uploadIcon} />
                  <div className={styles.uploadText}>Upload Image/Video</div>
                  <div className={styles.uploadHint}>JPG, PNG, MP4 up to 10MB</div>
                  <input type="file" accept="image/*,video/*" onChange={handleFile} style={{ display: 'none' }} />
                </label>
              )}
            </div>
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                <strong>Tip:</strong> Uploading a screenshot of your bet slip builds trust with your audience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
