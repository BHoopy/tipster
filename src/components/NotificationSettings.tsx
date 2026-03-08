'use client';

import { useState, useEffect } from 'react';
import { initMessaging } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { Bell, BellOff, Check, AlertCircle } from 'lucide-react';

type NotificationSettingsProps = {
    onTokenChange?: (token: string | null) => void;
};

export default function NotificationSettings({ onTokenChange }: NotificationSettingsProps) {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        setLoading(true);
        setMessage(null);

        try {
            const messaging = await initMessaging();
            
            if (!messaging) {
                setMessage({ type: 'error', text: 'Push notifications are not supported in this browser.' });
                setLoading(false);
                return;
            }

            const token = await getToken(messaging, {
                vapidKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp2NwhsV7Ew'
            });
            
            setFcmToken(token);
            setPermission('granted');
            onTokenChange?.(token);
            setMessage({ type: 'success', text: 'Notifications enabled successfully!' });
            
            // Handle foreground messages
            onMessage(messaging, (payload) => {
                console.log('Foreground message received:', payload);
                const notification = new Notification(payload.notification?.title || 'New Tip', {
                    body: payload.notification?.body || 'You have a new prediction!',
                    icon: '/logo.png'
                });
            });
        } catch (error: any) {
            console.error('Error getting notification permission:', error);
            if (error.code === 'messaging/permission-blocked') {
                setMessage({ type: 'error', text: 'Notifications are blocked. Please enable them in your browser settings.' });
            } else {
                setMessage({ type: 'error', text: 'Failed to enable notifications. Please try again.' });
            }
        }
        
        setLoading(false);
    };

    const revokePermission = () => {
        setPermission('denied');
        setFcmToken(null);
        onTokenChange?.(null);
        setMessage({ type: 'success', text: 'Notifications disabled.' });
    };

    if (typeof window === 'undefined' || !('Notification' in window)) {
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
