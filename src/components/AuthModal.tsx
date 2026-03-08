'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Mail, Lock, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        const displayName = email.split('@')[0].split('.')[0];
        await registerWithEmail(email, password, displayName);
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
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      overflowY: 'auto'
    }}>
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)',
        margin: 'auto'
      }} className="fade-in">

        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}>
              {mode === 'login' ? 'Welcome Back' : 'Join Tipster Fhink'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              {mode === 'login' ? 'Sign in to access premium picks' : 'Create an account for expert predictions'}
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="email"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.875rem',
                    background: 'var(--color-bg)'
                  }}
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 40px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.875rem',
                    background: 'var(--color-bg)'
                  }}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px', marginTop: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 168, 107, 0.2)' }} disabled={loading}>
              {loading ? 'Processing...' : mode === 'login' ? <><LogIn size={18} /> Login</> : <><UserPlus size={18} /> Create Account</>}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '1rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or continue with</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>

          <button onClick={handleGoogle} style={{ 
            width: '100%', 
            height: '48px', 
            display: 'flex', 
            gap: '0.75rem', 
            borderRadius: 'var(--radius-sm)', 
            border: '1px solid #e0e0e0', 
            justifyContent: 'center', 
            alignItems: 'center',
            background: 'white',
            cursor: 'pointer',
            fontSize: '0.9375rem',
            fontWeight: 500,
            color: '#3c4043',
            transition: 'all 0.2s ease'
          }} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.8055 10.2275C19.8055 9.51805 19.7444 8.83527 19.6305 8.17273H10.2V12.0609H15.6016C15.3661 13.3005 14.6577 14.3519 13.6055 15.0609V17.5609H16.8277C18.7166 15.8191 19.8055 13.2525 19.8055 10.2275Z" fill="#4285F4"/>
              <path d="M10.2 20C12.9 20 15.1677 19.1041 16.8277 17.5609L13.6055 15.0609C12.7088 15.6686 11.5622 16.0219 10.2 16.0219C7.32277 16.0219 4.95555 14.263 4.17777 11.5369H1.05555V14.0784C2.43333 17.0941 5.48888 19.3222 8.8 19.3222C11.0333 19.3222 12.9694 18.4984 14.2333 17.3691L10.2 20Z" fill="#34A853"/>
              <path d="M4.17778 11.5369C3.83333 10.5341 3.83333 9.4305 4.17778 8.42772V5.88616H1.05556C0.277778 7.61227 0.277778 9.35233 1.05556 11.0784L4.17778 11.5369Z" fill="#FBBC05"/>
              <path d="M10.2 3.94364C11.5444 3.94364 12.8344 4.48127 13.8589 5.47272L16.8889 2.44272C15.1611 0.990275 12.9 0.200275 10.2 0.200275C7.86667 0.200275 5.98333 1.08972 4.44444 2.39716L7.51111 5.31083C8.80556 3.94305 10.2 3.94364 10.2 3.94364Z" fill="#EA4335"/>
            </svg>
            Continue with Google
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
