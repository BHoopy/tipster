'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { Menu, X, LayoutDashboard, FilePlus2, LogOut, ArrowLeft } from 'lucide-react';
import styles from './admin.module.css';

const navItems = [
  { href: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { href: '/admin/predictions/new', icon: <FilePlus2 size={20} />, label: 'New Prediction' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAdmin, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, loading, isAdmin, router]);

  useEffect(() => {
    // Close sidebar on navigation
    setIsSidebarOpen(false);
  }, [pathname]);

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
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Image src="/leeman.png" alt="Logo" width={32} height={32} className={styles.sidebarLogoImg} />
          <div style={{ flex: 1 }}>
            <div className={styles.sidebarLogoText}>Leeman Tips</div>
            <div className={styles.sidebarBadge}>Admin Panel</div>
          </div>
          <button className={styles.menuBtn} onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
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
            <ArrowLeft size={16} /> Back to Site
          </Link>
          <button onClick={logout} className={styles.backLink} style={{ color: 'var(--color-danger)' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <span className={styles.topbarTitle}>
            {navItems.find(n => isActive(n.href))?.label ?? 'Admin'}
          </span>
          <Link href="/admin/predictions/new" className="btn btn-primary btn-sm">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FilePlus2 size={16} /> <span style={{ display: 'none', sm: 'inline' }}>New</span>
            </span>
          </Link>
        </header>
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
