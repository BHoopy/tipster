'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import styles from './admin.module.css';

const navItems = [
  { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/admin/predictions/new', icon: '➕', label: 'New Prediction' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className={styles.loading} style={{ height: '100vh', background: 'var(--color-bg)' }}>
        <div className={styles.spinner} />
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Verifying admin access...</span>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Image src="/leeman.png" alt="Logo" width={32} height={32} className={styles.sidebarLogoImg} />
          <div>
            <div className={styles.sidebarLogoText}>Leeman Tips</div>
            <div className={styles.sidebarBadge}>Admin Panel</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>Navigation</div>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.userSection}>
          <Link href="/" className={styles.backLink}>
            ← Back to Site
          </Link>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <span className={styles.topbarTitle}>
            {navItems.find(n => isActive(n.href))?.label ?? 'Admin'}
          </span>
          <Link href="/admin/predictions/new" className="btn btn-primary btn-sm">
            + New Prediction
          </Link>
        </header>
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
