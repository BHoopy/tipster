# Agent Guidelines for Tipster

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
│   ├── api/               # API routes
│   │   ├── notifications/send/    # Push notification endpoint
│   │   ├── paystack/               # Payment verification
│   │   │   ├── initialize/
│   │   │   └── verify/
│   │   └── upload/                 # Image upload
│   ├── paystack/callback/  # Payment callback page
│   ├── admin/              # Admin dashboard (page.tsx)
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/            # Reusable UI components
│   ├── home/              # Home page components
│   │   ├── FreeTipCard.tsx
│   │   ├── FreeTipsList.tsx
│   │   ├── VipTicketCard.tsx
│   │   ├── VipTicketsList.tsx
│   │   ├── HistorySection.tsx
│   │   ├── HomeHeader.tsx
│   │   ├── HomeStats.tsx
│   │   └── NoTipsMessage.tsx
│   ├── admin/              # Admin components
│   │   ├── AdminSidebar.tsx
│   │   ├── FreeTipsManager.tsx
│   │   ├── VipBundlesManager.tsx
│   │   ├── HistoryManager.tsx
│   │   └── types.ts
│   ├── Header.tsx
│   ├── AuthModal.tsx
│   ├── AuthModalWrapper.tsx
│   ├── AutocompleteInput.tsx
│   ├── NotificationSettings.tsx
│   ├── Providers.tsx
│   └── VipLocked.tsx
├── context/               # React Context providers
│   ├── AuthContext.tsx    # Auth + hook (useAuth)
│   ├── AuthModalContext.tsx
│   └── ThemeContext.tsx   # Dark mode
├── hooks/                 # Custom hooks
│   └── useAutocomplete.ts
├── lib/                   # Firebase config, utilities
│   ├── firebase.ts        # Client Firebase config
│   ├── firebase-admin.ts  # Admin SDK
│   ├── paystack.ts        # Paystack helpers
│   └── utils.ts           # Utility functions
├── styles/                # Global CSS
│   └── globals.css
└── types/                 # TypeScript type definitions
    └── game.ts
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - All TypeScript strict options are on (see tsconfig.json)
- Use explicit types for function parameters and return types
- Use `interface` for object shapes, `type` for unions/aliases
- Never use `any` - use `unknown` if type is truly unknown

```typescript
// Good
interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

// Good
type LoadingState = 'idle' | 'loading' | 'success' | 'error';
```

### Imports

Always use the `@/` alias for src/ imports. Order imports as follows:

```typescript
// 1. External React/Next imports
import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// 2. External library imports
import { doc, getDoc } from 'firebase/firestore';

// 3. @/ imports - lib utilities
import { auth, db } from '@/lib/firebase';

// 4. @/ imports - context
import { useAuth } from '@/context/AuthContext';

// 5. @/ imports - components
import Header from '@/components/Header';

// 6. @/ imports - types
import type { Game } from '@/types/game';
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `Header.tsx`, `AuthModal.tsx` |
| Hooks | camelCase with `use` | `useAuth`, `useAutocomplete` |
| Context | PascalCase + Context | `AuthContext`, `ThemeContext` |
| Non-component files | kebab-case | `firebase.ts`, `paystack.ts` |
| Types/Interfaces | PascalCase | `Match`, `VipTicket`, `Game` |
| CSS Modules | PascalCase | `VipLocked.module.css` |

### Components

- Use `'use client'` for any component using hooks or browser APIs
- Prefer functional components with hooks
- Extract reusable logic into custom hooks
- Export components as named exports when they're imported elsewhere

```typescript
// Component pattern
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface MyComponentProps {
  title: string;
  onComplete?: () => void;
}

export default function MyComponent({ title, onComplete }: MyComponentProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
}
```

### React Patterns

#### Context Pattern (Provider + Hook in same file)

```typescript
// Export both the provider and hook from the same file
const MyContext = createContext<MyContextType | undefined>(undefined);

export function MyProvider({ children }: { children: ReactNode }) {
  // Provider logic here
  return <MyContext.Provider value={...}>{children}</MyContext.Provider>;
}

export function useMyContext() {
  const context = useContext(MyContext);
  if (context === undefined) {
    throw new Error('useMyContext must be used within a MyProvider');
  }
  return context;
}
```

### Error Handling

- Use try/catch for all async operations
- Always log errors with `console.error` before re-throwing
- Re-throw errors after logging to preserve error flow
- Show user-friendly error messages in UI via toast/alert

```typescript
const fetchData = async () => {
  try {
    const doc = await getDoc(docRef);
    if (!doc.exists()) {
      throw new Error('Document not found');
    }
    return doc.data();
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error; // Re-throw to preserve error flow
  }
};
```

### Styling

This project uses CSS variables in `src/styles/globals.css`:

```css
/* Colors */
--color-primary: #00A86B;
--color-bg, --color-text, --color-border
--color-success, --color-warning, --color-error

/* Gradients */
--gradient-primary, --gradient-premium

/* Spacing & Radius */
--radius-sm, --radius-md, --radius-lg, --radius-xl

/* Shadows */
--shadow-sm, --shadow-md, --shadow-lg, --shadow-glow

/* Glassmorphism */
--glass-bg, --glass-border
```

Use CSS classes from globals.css or CSS Modules. Use inline styles sparingly for dynamic values.

### Firebase & Firestore

- Collections: `free_tips`, `vip_tickets`, `users`
- Use `onSnapshot` for real-time data
- Always handle loading and error states
- Admin functions use firebase-admin SDK in `/lib/firebase-admin.ts`

### API Routes

- Place in `src/app/api/[endpoint]/route.ts`
- Return JSON responses with appropriate status codes (200, 400, 500)
- Handle errors gracefully with try/catch
- Validate request bodies with Zod schemas

```typescript
// API route pattern
import { NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);
    
    // Process...
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Message' }, { status: 400 });
  }
}
```

## UI/UX Guidelines

This is a sports betting tips platform targeting senior UI/UX. Key considerations:

- Mobile-first responsive design required
- Glassmorphism aesthetic (`glass-bg`, `backdrop-filter`)
- Use Lucide React icons throughout
- Dark mode support via ThemeContext
- Smooth animations (`fadeInUp`, `slideIn`)
- Tables with zebra striping for tips display

## Environment Variables

Required in `.env.local`:
- Firebase config: `NEXT_PUBLIC_FIREBASE_*`
- Paystack keys: `PAYSTACK_SECRET_KEY`
- Cloudinary: `NEXT_PUBLIC_CLOUDINARY_*`

Never commit secrets to git. Use `.env.local` for local development.
