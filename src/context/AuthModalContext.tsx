'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type AuthMode = 'login' | 'signup';

interface AuthModalContextType {
    isAuthModalOpen: boolean;
    openAuthModal: (mode?: AuthMode) => void;
    closeAuthModal: () => void;
    initialMode: AuthMode;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [initialMode, setInitialMode] = useState<AuthMode>('login');

    const openAuthModal = (mode?: AuthMode) => {
        setInitialMode(mode || 'login');
        setIsAuthModalOpen(true);
    };
    const closeAuthModal = () => setIsAuthModalOpen(false);

    return (
        <AuthModalContext.Provider value={{ isAuthModalOpen, openAuthModal, closeAuthModal, initialMode }}>
            {children}
        </AuthModalContext.Provider>
    );
}

export function useAuthModal() {
    const context = useContext(AuthModalContext);
    if (context === undefined) {
        throw new Error('useAuthModal must be used within an AuthModalProvider');
    }
    return context;
}
