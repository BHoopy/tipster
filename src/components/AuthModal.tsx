'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Mail, Lock, User, LogIn, UserPlus, Chrome } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginWithEmail, registerWithEmail, signInWithGoogle } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }} className="fade-in">
        
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}>
              {mode === 'login' ? 'Welcome Back' : 'Join Leeman Tips'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              {mode === 'login' ? 'Sign in to access premium picks' : 'Create an account for expert predictions'}
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)', hover: { color: 'var(--color-text)' } }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'signup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label className="label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    className="input"
                    placeholder="John Doe"
                    required
                    style={{ paddingLeft: '2.5rem' }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label className="label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="email"
                  className="input"
                  placeholder="name@example.com"
                  required
                  style={{ paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  required
                  style={{ paddingLeft: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Processing...' : mode === 'login' ? <><LogIn size={18} /> Login</> : <><UserPlus size={18} /> Create Account</>}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '1rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or continue with</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>

          <button onClick={handleGoogle} className="btn btn-ghost" style={{ width: '100%', height: '48px', display: 'flex', gap: '0.75rem' }} disabled={loading}>
            <Chrome size={18} /> Google
          </button>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {mode === 'login' ? (
              <>Don't have an account? <button onClick={() => setMode('signup')} style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Join Now</button></>
            ) : (
              <>Already have an account? <button onClick={() => setMode('login')} style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Sign In</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
