'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Lock, ArrowRight, CheckCircle, CreditCard, LogIn } from 'lucide-react';
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
        // Fetch dynamic pricing from settings if available
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'general');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setVipPrice(docSnap.data().vipPrice || 50);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };
        fetchSettings();
    }, []);

    const perks = [
        'Daily High-Odds Selections',
        'Exclusive Booking Codes'
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
                <div className={styles.badge}>
                    <Zap size={14} fill="currentColor" />
                    <span>VIP EXCLUSIVE</span>
                </div>

                <div className={styles.iconCircle}>
                    <Lock size={32} className={styles.lockIcon} />
                </div>

                <h2 className={styles.title}>Unlock Premium Access</h2>
                <p className={styles.subtitle}>
                    {user
                        ? 'You need a valid daily pass to view VIP predictions today. Get access to our most accurate daily predictions.'
                        : 'Sign in and get access to our most accurate daily predictions to maximize your winning potential.'
                    }
                </p>

                <div className={styles.perksList}>
                    {perks.map((perk, i) => (
                        <div key={i} className={styles.perkItem}>
                            <CheckCircle size={18} className={styles.checkIcon} />
                            <span>{perk}</span>
                        </div>
                    ))}
                </div>

                {user && (
                    <div className={styles.priceContainer}>
                        <span className={styles.currency}>GHS</span>
                        <span className={styles.amount}>{vipPrice}</span>
                        <span className={styles.period}>/ day</span>
                    </div>
                )}

                {!user ? (
                    <button
                        onClick={() => setIsAuthModalOpen(true)}
                        className={styles.payButton}
                        style={{ marginTop: '1rem' }}
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
                    >
                        {loading ? (
                            <div className={styles.spinner}></div>
                        ) : (
                            <>
                                <CreditCard size={20} />
                                <span>Pay {vipPrice} GHS Now</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                )}

                {error && <p className={styles.errorMessage}>{error}</p>}

                {user && (
                    <p className={styles.secureText}>
                        Secure daily payment via Paystack
                    </p>
                )}
            </div>
        </div>
    );
}
