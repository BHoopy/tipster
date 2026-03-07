'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function PaystackCallback() {
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
            background: '#0a0a0a',
            color: '#fff',
            padding: '2rem'
        }}>
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '24px',
                padding: '3rem',
                textAlign: 'center',
                maxWidth: '400px',
                width: '100%'
            }}>
                {status === 'loading' && (
                    <>
                        <Loader2 size={48} className="animate-spin" style={{ color: '#ffd700', marginBottom: '1.5rem' }} />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Verifying Payment</h1>
                        <p style={{ color: '#999', marginTop: '1rem' }}>{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle2 size={48} style={{ color: '#00c851', marginBottom: '1.5rem' }} />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Success!</h1>
                        <p style={{ color: '#999', marginTop: '1rem' }}>{message}</p>
                        <p style={{ color: '#555', fontSize: '0.8rem', marginTop: '2rem' }}>Redirecting to home...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle size={48} style={{ color: '#ff3b30', marginBottom: '1.5rem' }} />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Payment Failed</h1>
                        <p style={{ color: '#999', marginTop: '1rem' }}>{message}</p>
                        <button
                            onClick={() => router.push('/')}
                            style={{
                                marginTop: '2rem',
                                background: '#ffd700',
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
