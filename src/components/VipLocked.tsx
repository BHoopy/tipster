'use client';

import React, { useState, useEffect } from 'react';
import { LuZap as Zap, LuArrowRight as ArrowRight, LuCircleCheck as CheckCircle, LuCreditCard as CreditCard, LuLogIn as LogIn, LuCrown as Crown, LuShield as Shield, LuTarget as Target, LuTrendingUp as TrendingUp } from 'react-icons/lu';
import { useAuth } from '@/context/AuthContext';
import styles from './VipLocked.module.css';
import AuthModal from '@/components/AuthModal';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

interface VipLockedProps {
    onSuccess: () => void;
}

export default function VipLocked({ onSuccess }: VipLockedProps) {
    const { user, isVip } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const vipPrice = Number(process.env.NEXT_PUBLIC_VIP_PRICE) || 30;
    const [todayOdds, setTodayOdds] = useState<{ name: string; odds: string }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const vipQuery = query(
                    collection(db, 'vip_tickets'),
                    where('isPublished', '==', true),
                    where('status', '==', 'pending'),
                    orderBy('createdAt', 'desc')
                );
                const vipSnap = await getDocs(vipQuery);
                if (!vipSnap.empty) {
                    const oddsList = vipSnap.docs
                        .map(d => ({ name: d.data().bundle_name || 'Ticket', odds: d.data().odds || '' }))
                        .filter(o => o.odds);
                    setTodayOdds(oddsList);
                }
            } catch (error) {
                console.error('Error fetching VIP tickets:', error);
            }
        };
        fetchData();
    }, []);

    const perks = [
        { icon: Target, text: 'Daily High-Odds Accumulator' },
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

                {!user && (
                    <h2 className={styles.title}>Unlock Premium Access</h2>
                )}
                {todayOdds.length > 0 && (
                    <div className={styles.oddsSection}>
                        <p className={styles.oddsTitle}>Today&apos;s VIP Total Odds</p>
                        <div className={styles.oddsList}>
                            {todayOdds.map((item, i) => (
                                <div key={i} className={styles.oddsItem}>
                                    <span className={styles.oddsNumber}>{i + 1}.</span>
                                    <span className={styles.oddsValue}>{item.odds} odds</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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

                    >
                        {loading ? (
                            <div className={styles.spinner}></div>
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
