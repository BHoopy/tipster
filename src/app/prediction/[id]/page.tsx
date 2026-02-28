import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import styles from './prediction.module.css';

export default async function PredictionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const predDoc = await getDoc(doc(db, 'predictions', id));
  
  if (!predDoc.exists()) {
    return (
      <main className={styles.main}>
        <div className="container">
          <h1>Prediction Not Found</h1>
          <Link href="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </main>
    );
  }

  const pred = predDoc.data();
  const createdAt = pred.created_at?.toDate ? pred.created_at.toDate().toLocaleDateString() : 'N/A';

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
            <h1>{pred.title}</h1>
            <p className={styles.meta}>Published on {createdAt}</p>
            
            {pred.media_url && (
              <div className={styles.media}>
                {pred.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img src={pred.media_url} alt={pred.title} />
                ) : (
                  <video src={pred.media_url} controls />
                )}
              </div>
            )}
            
            <div className={styles.content}>
              {pred.content}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
