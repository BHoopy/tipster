'use client';

import { useState, useEffect, useRef, TouchEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuthModal } from '@/context/AuthModalContext';
import { LogOut, Sun, Moon, LogIn, Menu, X, Bell, BellOff, Trophy, Star, Home, Zap } from 'lucide-react';

export default function Header() {
    const { user, logout, isAdmin } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { openAuthModal } = useAuthModal();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [swipeNavOpen, setSwipeNavOpen] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
    const [showBottomNav, setShowBottomNav] = useState(false);
    const [activeTab, setActiveTab] = useState<'free' | 'vip'>('free');
    const touchStartX = useRef<number>(0);
    const touchCurrentX = useRef<number>(0);
    const swipeNavRef = useRef<HTMLDivElement>(null);
    const lastScrollY = useRef<number>(0);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 70) {
                if (currentScrollY > lastScrollY.current) {
                    setShowBottomNav(true);
                } else {
                    setShowBottomNav(false);
                }
            } else {
                setShowBottomNav(false);
            }
            
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches[0].clientX < 30) {
                touchStartX.current = e.touches[0].clientX;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (touchStartX.current > 0) {
                touchCurrentX.current = e.touches[0].clientX;
                const diff = touchCurrentX.current - touchStartX.current;
                if (diff > 10) {
                    setSwipeNavOpen(true);
                }
            }
        };

        const handleTouchEnd = () => {
            touchStartX.current = 0;
            touchCurrentX.current = 0;
        };

        document.addEventListener('touchstart', handleTouchStart as any, { passive: true });
        document.addEventListener('touchmove', handleTouchMove as any, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart as any);
            document.removeEventListener('touchmove', handleTouchMove as any);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (swipeNavRef.current && !swipeNavRef.current.contains(e.target as Node)) {
                setSwipeNavOpen(false);
            }
        };
        if (swipeNavOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [swipeNavOpen]);

    const requestNotificationPermission = async () => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
        }
    };

    return (
        <header style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
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
                    }}>Tipster</span>
                </Link>

                {/* Desktop Navigation */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} className="desktop-nav">
                    {/* Notification Bell */}
                    {notificationPermission !== 'granted' ? (
                        <button 
                            onClick={requestNotificationPermission}
                            className="btn-outline"
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '99px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}
                            title="Enable notifications"
                        >
                            <BellOff size={20} />
                        </button>
                    ) : (
                        <button 
                            className="btn-outline"
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '99px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}
                            title="Notifications enabled"
                        >
                            <Bell size={20} />
                            <span style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '8px',
                                height: '8px',
                                background: 'var(--color-success)',
                                borderRadius: '50%'
                            }} />
                        </button>
                    )}

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
                            {isAdmin && (
                                <Link href="/admin" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                                    Admin
                                </Link>
                            )}
                            <button onClick={logout} className="btn-outline" style={{ padding: '0.5rem' }}>
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <button className="btn btn-primary" onClick={openAuthModal}>
                            <LogIn size={18} /> Sign In
                        </button>
                    )}
                </nav>

                {/* Mobile Menu Button */}
                <button 
                    className="mobile-menu-btn"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    style={{
                        display: 'none',
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)'
                    }}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="mobile-menu" style={{
                        position: 'absolute',
                        top: '70px',
                        left: 0,
                        right: 0,
                        background: 'white',
                        borderBottom: '1px solid var(--color-border)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 99
                    }}>
                        {/* Notification Bell Mobile */}
                        {notificationPermission !== 'granted' ? (
                            <button 
                                onClick={requestNotificationPermission}
                                className="btn btn-outline"
                                style={{ width: '100%', justifyContent: 'flex-start', gap: '0.75rem' }}
                            >
                                <BellOff size={20} /> Enable Notifications
                            </button>
                        ) : (
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.75rem', 
                                padding: '0.75rem',
                                background: 'var(--color-primary-light)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--color-primary)',
                                fontSize: '0.875rem',
                                fontWeight: 600
                            }}>
                                <Bell size={20} /> Notifications Enabled
                            </div>
                        )}

                        <button onClick={toggleTheme} className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start', gap: '0.75rem' }}>
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />} 
                            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                        </button>

                        {user ? (
                            <>
                                {isAdmin && (
                                    <Link href="/admin" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                        Admin Dashboard
                                    </Link>
                                )}
                                <button onClick={logout} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', gap: '0.75rem' }}>
                                    <LogOut size={20} /> Sign Out
                                </button>
                            </>
                        ) : (
                            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={openAuthModal}>
                                <LogIn size={18} /> Sign In
                            </button>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                @media (max-width: 768px) {
                    .desktop-nav { display: none !important; }
                    .mobile-menu-btn { display: flex !important; }
                }
                @media (min-width: 769px) {
                    .mobile-menu { display: none !important; }
                }
            `}</style>
        </header>
    );
}
