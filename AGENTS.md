# Agent Guidelines for FhinkTips

This is a Next.js 16 sports betting tips platform with TypeScript, Firebase, and Paystack integration.

## Build Commands

```bash
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run Next.js ESLint
```

No test framework is currently configured. Do not add tests unless explicitly requested.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (Paystack, notifications, upload)
│   ├── admin/             # Admin dashboard
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable UI components
├── context/               # React Context providers (Auth, Theme, AuthModal)
├── hooks/                 # Custom hooks
├── lib/                   # Firebase config, utilities
└── styles/                # Global CSS
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - All TypeScript strict options are on
- Use explicit types for function parameters and return types
- Use `interface` for object shapes, `type` for unions/aliases
- Never use `any` - use `unknown` if type is truly unknown

### Imports

```typescript
// Use @/ alias for src/ imports
import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';

// Order: external libs → @/ imports → relative imports (if any)
```

### Naming Conventions

- **Components**: PascalCase (e.g., `Header.tsx`, `AuthModal.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth`, `useAutocomplete`)
- **Context**: `AuthContext`, `ThemeContext` - provider + hook in same file
- **Files**: kebab-case for non-component files (`firebase.ts`, `paystack.ts`)
- **Types/Interfaces**: PascalCase (`Match`, `VipTicket`, `GroupedTips`)

### Components

- Use `'use client'` for any component using hooks or browser APIs
- Prefer functional components with hooks
- Use CSS Modules (`.module.css`) or inline styles - this project uses inline styles heavily
- Extract reusable logic into custom hooks

### React Patterns

```typescript
// Context pattern used in this project
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Error Handling

- Use try/catch for async operations
- Always log errors with `console.error`
- Re-throw errors after logging to preserve error flow
- Show user-friendly error messages in UI

### Styling

This project uses CSS variables defined in `src/styles/globals.css`:

```css
--color-primary: #00A86B;
--color-bg, --color-text, --color-border
--gradient-primary, --gradient-premium
--radius-sm/md/lg/xl
--shadow-sm/md/lg/glow
--glass-bg, --glass-border
```

Use inline styles sparingly - prefer CSS classes defined in globals.css or CSS Modules.

### Firebase & Firestore

- Collections: `free_tips`, `vip_tickets`, `users`
- Use `onSnapshot` for real-time data
- Always handle loading and error states

### API Routes

- Place in `src/app/api/[endpoint]/route.ts`
- Return JSON responses with appropriate status codes
- Handle errors gracefully with try/catch

## UI/UX Notes

This is a sports betting tips platform targeting a senior UI/UX developer. Key considerations:

- Mobile-first responsive design required
- Glassmorphism aesthetic (glass-bg, backdrop-filter)
- Use Lucide React icons throughout
- Dark mode support via ThemeContext
- Smooth animations (fadeInUp, slideIn)
- Tables with zebra striping for tips display

## Environment Variables

Required in `.env.local`:
- Firebase config (apiKey, authDomain, projectId, etc.)
- Paystack keys
- Cloudinary keys

Never commit secrets to git.
