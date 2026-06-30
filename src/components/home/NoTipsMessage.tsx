import { LuBell as Bell } from 'react-icons/lu';
import Image from 'next/image';

export default function NoTipsMessage() {
    return (
        <div className="glass-card" style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
        }}>
            <div style={{
                marginBottom: '0.5rem'
            }}>
                <Image 
                    src="/no_ticket.webp" 
                    alt="No Tickets" 
                    width={100} 
                    height={100} 
                    style={{ objectFit: 'contain' }} 
                />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>No Tickets Available</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', maxWidth: '280px', margin: '0 auto 1.5rem' }}>
                We're currently analyzing today's matches to find the best value picks. Check back in a few minutes!
            </p>
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1rem',
                background: 'var(--color-primary)',
                borderRadius: '100px',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(0,168,107,0.2)'
            }}>
                <Bell size={14} /> Get Notified
            </div>
        </div>
    );
}
