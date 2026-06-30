'use client';

import React, { useState, useEffect } from 'react';
import { LuZap as Zap, LuArrowRight as ArrowRight, LuCircleCheck as CheckCircle, LuCreditCard as CreditCard, LuLogIn as LogIn, LuCrown as Crown, LuShield as Shield, LuTarget as Target, LuTrendingUp as TrendingUp } from 'react-icons/lu';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import styles from './VipLocked.module.css';
import AuthModal from '@/components/AuthModal';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface VipLockedProps {
    onSuccess: () => void;
}

export default function VipLocked({ onSuccess }: VipLockedProps) {
    const { user, isVip } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [vipPrice, setVipPrice] = useState(50);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'general');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setVipPrice(docSnap.data().vipPrice || 50);
                }
            } catch {
                setVipPrice(50);
            }
        };
        fetchSettings();
    }, []);

    const perks = [
        { icon: Target, text: 'Daily High-Odds Selections' },
        { icon: Zap, text: 'Exclusive Booking Codes' },
        { icon: TrendingUp, text: '90%+ Win Rate Guaranteed' },
        { icon: Shield, text: 'Refund If Ticket Loses' }
    ];

    const handlePayment = async () => {
        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/paystack/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, email: user.email }),
            });

            const data = await res.json();

            if (data.authorization_url) {
                window.location.href = data.authorization_url;
            } else {
                throw new Error(data.error || 'Failed to initialize payment');
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            <div className={styles.card}>
                <div className={styles.glowOrb} />

                <div className={styles.badge}>
                    <Crown size={14} />
                    <span>VIP Exclusive</span>
                </div>

                <div className={styles.iconCircle}>
                    <Image
                        src="/Vip.png"
                        alt="VIP"
                        width={48}
                        height={48}
                        className={styles.vipIcon}
                        unoptimized
                    />
                </div>

                <h2 className={styles.title}>
                    {user ? "Today's VIP Package" : "Unlock Premium Access"}
                </h2>
                <p className={styles.subtitle}>
                    {user
                        ? `Get exclusive access to today's premium ticket bundle for GHS ${vipPrice}. Start winning big with our expert selections.`
                        : 'Sign in to access our most accurate daily predictions and professional VIP ticket bundles.'
                    }
                </p>

                <div className={styles.vipNote}>
                    GHS {vipPrice} for Full Access
                </div>

                <div className={styles.perksList}>
                    {perks.map((perk, i) => (
                        <div key={i} className={styles.perkItem}>
                            <perk.icon size={18} className={styles.checkIcon} />
                            <span>{perk.text}</span>
                        </div>
                    ))}
                </div>

                {!user ? (
                    <button
                        onClick={() => setIsAuthModalOpen(true)}
                        className={styles.payButton}
                    >
                        <LogIn size={20} />
                        <span>Sign In to Access VIP</span>
                        <ArrowRight size={18} />
                    </button>
                ) : (
                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className={styles.payButton}
                        style={{ background: '#8b5cf6', color: 'white' }}
                    >
                        {loading ? (
                            <div className={styles.spinner} style={{ borderTopColor: '#78350f' }}></div>
                        ) : (
                            <>
                                <CreditCard size={20} />
                                <span>Unlock Package (GHS {vipPrice})</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                )}

                {error && <p className={styles.errorMessage}>{error}</p>}

                {user && (
                    <>
                        <div className={styles.secureText}>
                            <Shield size={12} />
                            Secure payment via Paystack • Instant access
                        </div>
                        <div className={styles.subscriptionNote}>
                            All VIP tickets are valid until slips are won
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
