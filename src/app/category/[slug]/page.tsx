import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import styles from './category.module.css';

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const categoriesSnap = await getDocs(query(collection(db, 'categories'), where('slug', '==', slug)));
  const category = categoriesSnap.docs[0]?.data();
  
  if (!category) {
    return (
      <main className={styles.main}>
        <div className="container">
          <h1>Category Not Found</h1>
          <Link href="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </main>
    );
  }

  const predictionsSnap = await getDocs(
    query(
      collection(db, 'predictions'),
      where('category_id', '==', categoriesSnap.docs[0].id),
      orderBy('created_at', 'desc')
    )
  );
  
  const predictions = predictionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className="container">
          <nav className={styles.nav}>
            <Link href="/" className={styles.logo}>Tipster Fhink</Link>
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
          <h1>{category.name}</h1>
          <div className={styles.grid}>
            {predictions.map((pred: any) => (
              <Link key={pred.id} href={`/prediction/${pred.id}`} className="card">
                {pred.media_url && (
                  <img src={pred.media_url} alt={pred.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />
                )}
                <h3>{pred.title}</h3>
                <p>{pred.content?.substring(0, 150)}...</p>
              </Link>
            ))}
            {predictions.length === 0 && (
              <p>No predictions in this category yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
