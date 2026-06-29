'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bell, BellOff, Check, AlertCircle } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array(rawData.split('').map((c) => c.charCodeAt(0)));
}

export default function NotificationSettings() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        setLoading(true);
        setMessage(null);

        try {
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidPublicKey) {
                setMessage({ type: 'error', text: 'Push notifications are not configured.' });
                setLoading(false);
                return;
            }

            const swRegistration = await navigator.serviceWorker.register('/sw.js');
            const subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            await setDoc(doc(db, 'push_subscriptions', subscription.endpoint), {
                subscription: subscription.toJSON(),
                createdAt: serverTimestamp(),
            });

            setPermission('granted');
            setMessage({ type: 'success', text: 'Notifications enabled successfully!' });
        } catch (error: any) {
            console.error('Error enabling notifications:', error);
            if (error.name === 'NotAllowedError') {
                setMessage({ type: 'error', text: 'Notifications are blocked. Please enable them in your browser settings.' });
            } else {
                setMessage({ type: 'error', text: 'Failed to enable notifications. Please try again.' });
            }
        }
        
        setLoading(false);
    };

    const revokePermission = useCallback(async () => {
        try {
            const swRegistration = await navigator.serviceWorker.ready;
            const subscription = await swRegistration.pushManager.getSubscription();
            if (subscription) {
                await deleteDoc(doc(db, 'push_subscriptions', subscription.endpoint));
                await subscription.unsubscribe();
            }
        } catch (error) {
            console.error('Error disabling notifications:', error);
        }

        setPermission('denied');
        setMessage({ type: 'success', text: 'Notifications disabled.' });
    }, []);

    if (!isMounted) {
        return null;
    }

    return (
        <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                {permission === 'granted' ? (
                    <Bell size={24} color="var(--color-primary)" />
                ) : (
                    <BellOff size={24} color="var(--color-text-muted)" />
                )}
                <div>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Push Notifications</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        Get notified when new tips are posted
                    </p>
                </div>
            </div>

            {message && (
                <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: message.type === 'success' ? 'var(--color-primary-light)' : '#fee2e2',
                    color: message.type === 'success' ? 'var(--color-primary-dark)' : '#991b1b',
                    fontSize: '0.875rem'
                }}>
                    {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            {permission === 'granted' ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        color: 'var(--color-success)',
                        fontSize: '0.875rem',
                        fontWeight: 600
                    }}>
                        <Check size={18} /> Enabled
                    </div>
                    <button 
                        onClick={revokePermission}
                        className="btn btn-outline"
                        style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                    >
                        Disable
                    </button>
                </div>
            ) : permission === 'denied' ? (
                <div style={{ 
                    padding: '0.75rem', 
                    background: '#fee2e2', 
                    borderRadius: 'var(--radius-sm)',
                    color: '#991b1b',
                    fontSize: '0.875rem',
                    textAlign: 'center'
                }}>
                    Notifications are blocked. Please enable them in your browser settings.
                </div>
            ) : (
                <button 
                    onClick={requestPermission}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%', opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? 'Enabling...' : 'Enable Notifications'}
                </button>
            )}
        </div>
    );
}
