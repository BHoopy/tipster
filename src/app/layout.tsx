import '@/styles/globals.css';
import { Providers } from '@/components/Providers';
import Header from '@/components/Header';
import { ReactNode } from 'react';

export const metadata = {
    title: 'Tipster Fhink - Expert Football Betting Tips',
    description: 'Pro football betting analysis, free tips and VIP ticket bundles.',
    icons: {
        icon: '/logo.png',
    },
};

export default function RootLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <Providers>
                    <Header />
                    <main style={{ minHeight: 'calc(100vh - 70px - 200px)', padding: '2rem 0' }}>
                        {children}
                    </main>
                    <footer style={{
                        background: 'white',
                        borderTop: '1px solid var(--color-border)',
                        padding: '3rem 0',
                        marginTop: 'auto'
                    }}>
                        <div className="container" style={{ textAlign: 'center' }}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <img src="/logo.png" alt="TF Logo" width={32} height={32} style={{ borderRadius: '6px' }} />
                                    <span style={{
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        color: 'var(--color-primary)'
                                    }}>Tipster <span style={{ color: 'var(--color-text)' }}>Fhink</span></span>
                                </div>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', maxWidth: '400px' }}>
                                    Premium sports analysis and expert predictions for winning strategies.
                                </p>
                                <div style={{
                                    marginTop: '1.5rem',
                                    fontSize: '0.75rem',
                                    color: 'var(--color-text-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    © {new Date().getFullYear()} TF Betting. All Rights Reserved.
                                </div>
                            </div>
                        </div>
                    </footer>
                </Providers>
            </body>
        </html>
    );
}
