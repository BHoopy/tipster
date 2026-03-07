'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import styles from './prediction.module.css';
import VipLocked from '@/components/VipLocked';

export default function PredictionPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isVip, loading: authLoading } = useAuth();
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getDoc(doc(db, 'predictions', id as string)).then(snap => {
        if (snap.exists()) {
          setPrediction(snap.data());
        }
        setLoading(false);
      });
    }
  }, [id]);

  if (loading || authLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!prediction) {
    return (
      <main className={styles.main}>
        <div className="container">
          <h1>Prediction Not Found</h1>
          <Link href="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </main>
    );
  }

  if (prediction.is_premium && !isVip) {
    return (
      <main className={styles.main}>
        <div className="container">
          <VipLocked onSuccess={() => window.location.reload()} />
        </div>
      </main>
    );
  }

  const createdAt = prediction.created_at?.toDate ? prediction.created_at.toDate().toLocaleDateString() : 'N/A';

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className="container">
          <nav className={styles.nav}>
            <Link href="/" className={styles.logo}>Leeman Tips</Link>
            <div className={styles.navLinks}>
              <Link href="/category/daily-best">Daily Best</Link>
              <Link href="/category/football">Football</Link>
              <Link href="/category/basketball">Basketball</Link>
              <Link href="/admin" className="btn btn-primary">Admin</Link>
            </div>
          </nav>
        </div>
      </header>

      <section className={styles.content}>
        <div className="container">
          <Link href="/" className={styles.backLink}>← Back to Home</Link>

          <article className={styles.article}>
            <h1>{prediction.title}</h1>
            <p className={styles.meta}>Published on {createdAt}</p>

            {prediction.media_url && (
              <div className={styles.media}>
                {prediction.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img src={prediction.media_url} alt={prediction.title} />
                ) : (
                  <video src={prediction.media_url} controls />
                )}
              </div>
            )}

            <div className={styles.content}>
              {prediction.content}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
