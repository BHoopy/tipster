'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import styles from '../admin.module.css';

interface Category { id: string; name: string; slug: string; }

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState({ name: '', slug: '' });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => { fetchCategories(); }, []);

  async function fetchCategories() {
    setFetching(true);
    const snap = await getDocs(collection(db, 'categories'));
    setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    setFetching(false);
  }

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setNewCat({ name, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCat.name,
        slug: newCat.slug,
        created_at: new Date(),
      });
      setNewCat({ name: '', slug: '' });
      await fetchCategories();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'categories', id));
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Categories</h1>
          <p className={styles.pageSubtitle}>Organise your predictions into categories</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Add Category Form */}
        <div>
          <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
              🏷️ Add Category
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              <div className={styles.formGroup}>
                <label className="label">Category Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Daily Best Tips"
                  value={newCat.name}
                  onChange={e => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className="label">Slug (auto-generated)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="daily-best-tips"
                  value={newCat.slug}
                  onChange={e => setNewCat({ ...newCat, slug: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  URL: /category/{newCat.slug || 'your-slug'}
                </span>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '...' : '+ Create Category'}
              </button>
            </form>
          </div>
        </div>

        {/* Categories List */}
        <div>
          <div className={styles.dataCard}>
            <div className={styles.dataCardHeader}>
              <span className={styles.dataCardTitle}>📂 All Categories ({categories.length})</span>
            </div>

            {fetching ? (
              <div className={styles.loading}>
                <div className={styles.spinner} />
              </div>
            ) : categories.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>🏷️</div>
                <h3>No categories yet</h3>
                <p>Create your first category using the form.</p>
              </div>
            ) : (
              <div>
                {categories.map((cat, i) => (
                  <div
                    key={cat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.875rem 1.5rem',
                      borderBottom: i < categories.length - 1 ? '1px solid var(--color-border)' : 'none',
                      gap: '1rem',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 32, height: 32, background: 'var(--color-primary-glow)', border: '1px solid rgba(0,200,81,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {cat.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.9375rem' }}>{cat.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>/category/{cat.slug}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      disabled={deleting === cat.id}
                      className="btn btn-danger btn-sm"
                      style={{ flexShrink: 0 }}
                    >
                      {deleting === cat.id ? '...' : '🗑 Delete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
