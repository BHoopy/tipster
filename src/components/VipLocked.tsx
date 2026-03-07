'use client';

import React, { useState } from 'react';
import { Zap, Lock, ArrowRight, CheckCircle, CreditCard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './VipLocked.module.css';

interface VipLockedProps {
    onSuccess: () => void;
}

export default function VipLocked({ onSuccess }: VipLockedProps) {
    const { user, isVip } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const perks = [
        'Daily High-Odds Selections',
        'Exclusive Booking Codes',
        '85%+ Win Rate Strategies',
        'Admin Direct Support',
        '24/7 Match Analysis'
    ];

    const handlePayment = async () => {
        if (!user) {
            setError('Please sign in to upgrade to VIP');
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
                    Get access to our most accurate daily predictions and maximize your winning potential.
                </p>

                <div className={styles.perksList}>
                    {perks.map((perk, i) => (
                        <div key={i} className={styles.perkItem}>
                            <CheckCircle size={18} className={styles.checkIcon} />
                            <span>{perk}</span>
                        </div>
                    ))}
                </div>

                <div className={styles.priceContainer}>
                    <span className={styles.currency}>GHS</span>
                    <span className={styles.amount}>50</span>
                    <span className={styles.period}>/ month</span>
                </div>

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
                            <span>Unlock Now</span>
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>

                {error && <p className={styles.errorMessage}>{error}</p>}

                <p className={styles.secureText}>
                    Secure payment via Paystack
                </p>
            </div>
        </div>
    );
}
