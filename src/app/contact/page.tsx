'use client';

import { LuMail as Mail, LuMessageCircle as MessageCircle, LuMapPin as MapPin } from 'react-icons/lu';

export default function ContactPage() {
    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                Contact Us
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                Get in touch with the Tipster team
            </p>

            <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="glass-card" style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'rgba(0,168,107,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Mail size={22} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.15rem' }}>Email</h3>
                        <a href="mailto:support@tipster.app" style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>
                            support@tipster.app
                        </a>
                    </div>
                </div>

                <div className="glass-card" style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'rgba(0,168,107,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <MessageCircle size={22} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.15rem' }}>Social</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            Reach out on our social channels for quick updates and support.
                        </p>
                    </div>
                </div>

                <div className="glass-card" style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'rgba(0,168,107,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <MapPin size={22} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.15rem' }}>Location</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            Playchamp Tips, Lagos, Nigeria
                        </p>
                    </div>
                </div>
            </div>

            <div style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem'
            }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                    Send Us a Message
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                    Have a question or feedback? Email us directly and we&apos;ll get back to you.
                </p>
                <a
                    href="mailto:support@tipster.app"
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
                >
                    <Mail size={18} /> Email Support
                </a>
            </div>
        </div>
    );
}
