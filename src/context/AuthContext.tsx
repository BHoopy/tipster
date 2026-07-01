'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  sendEmailOtp: () => Promise<void>;
  verifyEmailOtp: (otp: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isVip: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVip, setIsVip] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        let validVip = false;
        if (userData?.role === 'admin') {
          validVip = true;
        } else if (userData?.is_vip && userData?.vip_purchased_at) {
          const purchasedAt = userData.vip_purchased_at.toDate();
          validVip = purchasedAt.toDateString() === new Date().toDateString();
        }
        setIsAdmin(userData?.role === 'admin');
        setIsVip(validVip);
      } else {
        setIsAdmin(false);
        setIsVip(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserDoc(result.user);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(result.user, { displayName: name });
      await syncUserDoc(result.user, name);
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  };

  const sendEmailOtp = async () => {
    const u = auth.currentUser;
    if (!u?.email) throw new Error('No user signed in');

    const res = await fetch('/api/resend/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: u.email, uid: u.uid }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
  };

  const verifyEmailOtp = async (otp: string) => {
    const u = auth.currentUser;
    if (!u) throw new Error('No user signed in');

    const res = await fetch('/api/resend/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: u.uid, otp }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid OTP');
  };

  const syncUserDoc = async (user: User, displayName?: string) => {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: displayName || user.displayName,
        photoURL: user.photoURL,
        role: 'user',
        createdAt: new Date(),
      });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      loginWithEmail,
      registerWithEmail,
      sendEmailOtp,
      verifyEmailOtp,
      logout,
      isAdmin,
      isVip
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
