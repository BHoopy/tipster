'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LuX as X, LuMail as Mail, LuLock as Lock, LuLogIn as LogIn, LuUserPlus as UserPlus, LuEye as Eye, LuEyeOff as EyeOff, LuMailCheck as MailCheck, LuRefreshCw as RefreshCw, LuCheck as Check } from 'react-icons/lu';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode || 'login');
  const [signupStep, setSignupStep] = useState<'form' | 'verify'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resent, setResent] = useState(false);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { loginWithEmail, registerWithEmail, sendEmailOtp, verifyEmailOtp, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'login');
      setSignupStep('form');
      setOtp(['', '', '', '', '', '']);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (signupStep === 'verify') {
      sendEmailOtp().catch((err) => setError(err.message));
    }
  }, [signupStep]);

  if (!isOpen) return null;

  const resetState = () => {
    setEmail('');
    setPassword('');
    setError('');
    setLoading(false);
    setShowPassword(false);
    setResent(false);
    setSignupStep('form');
    setOtp(['', '', '', '', '', '']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        onClose();
      } else {
        const displayName = email.split('@')[0].split('.')[0];
        await registerWithEmail(email, password, displayName);
        setSignupStep('verify');
      }
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        setMode('login');
        setError('');
      } else if (err?.code === 'auth/invalid-credential') {
        setError('This email may use Google sign-in. Try the Google button above.');
      } else {
        setError(err.message || 'Authentication failed');
      }
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

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      setError('');
      await sendEmailOtp();
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Enter the full 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await verifyEmailOtp(code);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;

    const newOtp = [...otp];
    for (let i = 0; i < paste.length; i++) {
      newOtp[i] = paste[i];
    }
    setOtp(newOtp);

    const nextIndex = Math.min(paste.length, 5);
    otpRefs.current[nextIndex]?.focus();
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError('');
    resetState();
  };

  const handleClose = () => {
    resetState();
    onClose();
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
              {signupStep === 'verify' ? 'Verify Your Email' : mode === 'login' ? 'Welcome Back' : 'Join Tipster'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              {signupStep === 'verify'
                ? 'Enter the 6-digit code sent to your email'
                : mode === 'login'
                  ? 'Sign in to access premium picks'
                  : 'Create an account for expert predictions'
              }
            </p>
          </div>
          <button onClick={handleClose} style={{ color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {signupStep === 'verify' ? (
            /* OTP Verify Step */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(0,168,107,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                <MailCheck size={32} style={{ color: 'var(--color-primary)' }} />
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                We sent a code to <strong style={{ color: 'var(--color-primary)' }}>{email}</strong>
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Enter the code below to activate your account.
              </p>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }} onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    style={{
                      width: '48px',
                      height: '56px',
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      outline: 'none',
                    }}
                  />
                ))}
              </div>

              <button onClick={handleVerifyOtp} className="btn btn-primary" style={{ width: '100%', height: '44px', marginBottom: '0.75rem' }} disabled={loading}>
                <Check size={16} style={{ marginRight: '0.5rem' }} />
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <button onClick={handleResendOtp} className="btn btn-outline" style={{ width: '100%', height: '44px' }} disabled={loading}>
                <RefreshCw size={16} style={{ marginRight: '0.5rem' }} />
                {resent ? 'Code Sent!' : 'Resend Code'}
              </button>
            </div>
          ) : (
            /* Form Step */
            <>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                  {error}
                </div>
              )}

              <button onClick={handleGoogle} style={{ 
                width: '100%', 
                height: '48px', 
                display: 'flex', 
                gap: '0.75rem', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--color-border)', 
                justifyContent: 'center', 
                alignItems: 'center',
                background: 'var(--color-bg-card)',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: 'var(--color-text)',
                transition: 'all 0.2s ease'
              }} disabled={loading}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/60px-Google_%22G%22_logo.svg.png?_=20230822192911" alt="Google Logo" width="20" height="20" />
                Continue with Google
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '1rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or continue with email</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                    <input
                      type="email"
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 40px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.875rem',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)'
                      }}
                      placeholder="name@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      style={{
                        width: '100%',
                        padding: '12px 40px 12px 40px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.875rem',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)'
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
                        color: 'var(--color-text-secondary)',
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

                {mode === 'signup' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                    <input type="checkbox" required style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }} />
                    I am 18 years and above & I agree to the <a href="/privacy" target="_blank" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Terms and Conditions</a>.
                  </label>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px', marginTop: '0.5rem', boxShadow: '0 4px 6px -1px rgba(7, 94, 84, 0.25)' }} disabled={loading}>
                  {loading ? 'Processing...' : mode === 'login' ? <><LogIn size={18} /> Login</> : <><UserPlus size={18} /> Create Account</>}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                {mode === 'login' ? (
                  <>Don't have an account? <button onClick={() => switchMode('signup')} style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Join Now</button></>
                ) : (
                  <>Already have an account? <button onClick={() => switchMode('login')} style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Sign In</button></>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
