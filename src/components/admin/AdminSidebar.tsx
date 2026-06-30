'use client';

import { LuLayoutDashboard as LayoutDashboard, LuTicket as Ticket, LuZap as Zap, LuChartBarIncreasing as BarChart } from 'react-icons/lu';

interface SidebarProps {
    view: 'free' | 'vip' | 'history' | 'analytics';
    setView: (view: 'free' | 'vip' | 'history' | 'analytics') => void;
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
            <button
                onClick={() => setView('analytics')}
                className={view === 'analytics' ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ width: '100%', justifyContent: 'flex-start', border: view === 'analytics' ? 'none' : undefined }}
            >
                <BarChart size={20} /> Analytics
            </button>
        </div>
    );
}
