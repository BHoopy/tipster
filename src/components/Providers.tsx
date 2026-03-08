'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthModalProvider>
        <AuthProvider>{children}</AuthProvider>
      </AuthModalProvider>
    </ThemeProvider>
  );
}
