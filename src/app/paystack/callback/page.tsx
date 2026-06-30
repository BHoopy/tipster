'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuLoader as Loader2, LuCircleCheckBig as CheckCircle2, LuCircleX as XCircle } from 'react-icons/lu';

function PaystackCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reference = searchParams.get('reference');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your payment...');

    useEffect(() => {
        if (!reference) {
            setStatus('error');
            setMessage('No reference found in the URL');
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch(`/api/paystack/verify?reference=${reference}`);
                const data = await res.json();

                if (data.success) {
                    setStatus('success');
                    setMessage('Payment successful! You are now a VIP.');
                    setTimeout(() => {
                        router.push('/');
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Payment verification failed');
                }
            } catch (err) {
                setStatus('error');
                setMessage('An error occurred during verification');
            }
        };

        verify();
    }, [reference, router]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            padding: '2rem'
        }}>
            <div style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '24px',
                padding: '3rem',
                textAlign: 'center',
                maxWidth: '400px',
                width: '100%'
            }}>
                {status === 'loading' && (
                    <>
                        <Loader2 size={48} className="animate-spin" style={{ color: 'var(--color-gold)', marginBottom: '1.5rem' }} />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>Verifying Payment</h1>
                        <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle2 size={48} style={{ color: 'var(--color-primary)', marginBottom: '1.5rem' }} />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>Success!</h1>
                        <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>{message}</p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '2rem' }}>Redirecting to home...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle size={48} style={{ color: 'var(--color-danger)', marginBottom: '1.5rem' }} />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>Payment Failed</h1>
                        <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>{message}</p>
                        <button
                            onClick={() => router.push('/')}
                            style={{
                                marginTop: '2rem',
                                background: 'var(--color-gold)',
                                color: '#000',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '0.75rem 1.5rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                            }}
                        >
                            Back to Home
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function PaystackCallback() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} /></div>}>
            <PaystackCallbackContent />
        </Suspense>
    );
}
