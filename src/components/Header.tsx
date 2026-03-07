'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { LogOut, Sun, Moon, LogIn } from 'lucide-react';

export default function Header() {
    const { user, logout, isAdmin } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <header style={{
            background: 'white',
            borderBottom: '1px solid var(--color-border)',
            height: '70px',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center'
        }}>
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%'
            }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Image src="/logo.png" alt="TF Logo" width={40} height={40} style={{ borderRadius: '8px' }} />
                    <span style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        letterSpacing: '-0.025em',
                        color: 'var(--color-primary)'
                    }}>Tipster <span style={{ color: 'var(--color-text)' }}>Fhink</span></span>
                </Link>

                <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button onClick={toggleTheme} className="btn-outline" style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '99px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>

                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ textAlign: 'right', display: 'none' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.displayName || 'User'}</div>
                            </div>
                            <button onClick={logout} className="btn-outline" style={{ padding: '0.5rem' }}>
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <button className="btn btn-primary">
                            <LogIn size={18} /> Sign In
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
}
