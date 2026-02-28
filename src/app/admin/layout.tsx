'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';

const navItems = [
  { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/admin/predictions/new', icon: '➕', label: 'New Prediction' },
  { href: '/admin/categories', icon: '🏷️', label: 'Categories' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <div className={styles.adminLayout}>
      {/* ─── Sidebar ─────────────────────────────────────────────── */}
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

      {/* ─── Main Content ────────────────────────────────────────── */}
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
