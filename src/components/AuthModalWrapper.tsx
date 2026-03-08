'use client';

import AuthModal from '@/components/AuthModal';
import { useAuthModal } from '@/context/AuthModalContext';

export default function AuthModalWrapper() {
    const { isAuthModalOpen, closeAuthModal } = useAuthModal();
    return <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />;
}
