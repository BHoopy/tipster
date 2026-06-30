'use client';

import { useTheme } from '@/context/ThemeContext';
import { LuSun as Sun, LuMoon as Moon, LuMonitor as Monitor } from 'react-icons/lu';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const options = [
        { value: 'light', label: 'Light', icon: Sun },
        { value: 'dark', label: 'Dark', icon: Moon },
        { value: 'auto', label: 'Auto', icon: Monitor },
    ] as const;

    return (
        <div style={{
            display: 'flex',
            gap: '0.25rem',
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.15rem'
        }}>
            {options.map(opt => {
                const active = theme === opt.value;
                const Icon = opt.icon;
                return (
                    <button
                        key={opt.value}
                        onClick={() => setTheme(opt.value)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.3rem 0.6rem',
                            borderRadius: 'calc(var(--radius-sm) - 2px)',
                            border: 'none',
                            background: active ? 'var(--color-primary)' : 'transparent',
                            color: active ? 'white' : 'var(--color-text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            transition: 'all 0.15s'
                        }}
                        title={opt.label}
                    >
                        <Icon size={14} />
                        <span>{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
