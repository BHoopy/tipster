'use client';

import { useState, useEffect, useRef, TouchEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuthModal } from '@/context/AuthModalContext';
import { LuLogOut as LogOut, LuSun as Sun, LuMoon as Moon, LuLogIn as LogIn, LuMenu as Menu, LuX as X, LuBell as Bell, LuBellOff as BellOff, LuTrophy as Trophy, LuStar as Star, LuHome as Home, LuZap as Zap } from 'react-icons/lu';

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
            background: 'var(--color-primary)',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
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
                        color: 'white'
                    }}>Tipster</span>
                </Link>

                {/* Desktop Navigation */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} className="desktop-nav">
                    {/* Notification Bell */}
                    {notificationPermission !== 'granted' ? (
                        <button 
                            onClick={requestNotificationPermission}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '99px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                background: 'rgba(255,255,255,0.15)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: 'white'
                            }}
                            title="Enable notifications"
                        >
                            <BellOff size={20} />
                        </button>
                    ) : (
                        <button 
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '99px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                background: 'rgba(255,255,255,0.15)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: 'white'
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
                                background: 'white',
                                borderRadius: '50%'
                            }} />
                        </button>
                    )}


                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {isAdmin && (
                                <Link href="/admin" style={{
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(255,255,255,0.2)',
                                    color: 'white'
                                }}>
                                    Admin
                                </Link>
                            )}
                            <button onClick={logout} style={{
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(255,255,255,0.15)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={openAuthModal} style={{
                            padding: '0.5rem 1.25rem',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'white',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
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
                        background: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: 'white'
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
                            <button style={{
                                width: '100%',
                                justifyContent: 'center',
                                padding: '0.625rem 1.25rem',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--color-primary)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }} onClick={openAuthModal}>
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
