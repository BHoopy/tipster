'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { HeaderTabsProvider } from '@/context/HeaderTabsContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthModalProvider>
        <AuthProvider>
          <HeaderTabsProvider>
            {children}
          </HeaderTabsProvider>
        </AuthProvider>
      </AuthModalProvider>
    </ThemeProvider>
  );
}
