'use client';

import { LuLayoutDashboard as LayoutDashboard, LuTicket as Ticket, LuZap as Zap } from 'react-icons/lu';

interface SidebarProps {
    view: 'free' | 'vip' | 'history';
    setView: (view: 'free' | 'vip' | 'history') => void;
}

export default function AdminSidebar({ view, setView }: SidebarProps) {
    return (
        <div style={{
            width: '250px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            flexShrink: 0
        }}>
            <button
                onClick={() => setView('free')}
                className={view === 'free' ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ width: '100%', justifyContent: 'flex-start', border: view === 'free' ? 'none' : undefined }}
            >
                <LayoutDashboard size={20} /> Free Tips
            </button>
            <button
                onClick={() => setView('vip')}
                className={view === 'vip' ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ width: '100%', justifyContent: 'flex-start', border: view === 'vip' ? 'none' : undefined }}
            >
                <Zap size={20} /> VIP Bundles
            </button>
            <button
                onClick={() => setView('history')}
                className={view === 'history' ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ width: '100%', justifyContent: 'flex-start', border: view === 'history' ? 'none' : undefined }}
            >
                <Ticket size={20} /> History
            </button>
        </div>
    );
}
