# Tipster

A sports betting tips platform built with Next.js 16, TypeScript, Firebase, and Paystack.

## Features

- **Free Tips** — Daily free betting predictions with match details and odds
- **VIP Tickets** — Premium subscription-based betting bundles with higher accuracy
- **Payment Integration** — Paystack-powered payments for VIP subscriptions
- **Admin Dashboard** — Manage tips, VIP bundles, and view history
- **Push Notifications** — Firebase Cloud Messaging for real-time tip alerts
- **Authentication** — Firebase Auth with email/password
- **Dark Mode** — Built-in theme toggle
- **Responsive Design** — Mobile-first glassmorphism UI

## Tech Stack

| Layer        | Technology                              |
| ------------ | --------------------------------------- |
| Framework    | Next.js 16 (App Router)                 |
| Language     | TypeScript (strict mode)                |
| Auth         | Firebase Authentication                 |
| Database     | Cloud Firestore                         |
| Payments     | Paystack                                |
| Notifications| Firebase Cloud Messaging                |
| Styling      | CSS Modules + CSS Variables + Glassmorphism |
| Icons        | Lucide React                            |

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Firebase project with Authentication, Firestore, and Cloud Messaging enabled
- Paystack account (for payment processing)

### Installation

```bash
git clone https://github.com/BHoopy/tipster.git
cd tipster
npm install
```

### Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Refer to `.env.example` for all required variables. You'll need:

| Variable | Where to Get It |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Console → Project Settings → General → Your apps → Web app |
| `PAYSTACK_SECRET_KEY` | Paystack Dashboard → Settings → API Keys & Webhooks |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack Dashboard → Settings → API Keys & Webhooks |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Console → Project Settings → Service Accounts → Generate new private key |
| `FOOTBALL_API_KEY` | football-data.org API |
| `OPENROUTER_API_KEY` | OpenRouter API |
| Cloudinary keys | Cloudinary Dashboard |

> **Never commit `.env.local` or any file containing real secrets to version control.**

### Firebase Setup

1. Enable **Authentication** (Email/Password) in Firebase Console
2. Create a **Cloud Firestore** database
3. Enable **Firebase Cloud Messaging** and upload the VAPID key (Settings → Cloud Messaging)
4. Generate a **Service Account** private key (Project Settings → Service Accounts)

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/              # Next.js App Router (pages + API routes)
│   ├── admin/        # Admin dashboard
│   ├── api/          # API endpoints (paystack, upload, notifications)
│   └── paystack/     # Payment callback page
├── components/       # Reusable UI components
│   ├── admin/        # Admin panel components
│   └── home/         # Home page components (tips display)
├── context/          # React Context (auth, theme, modal)
├── hooks/            # Custom hooks
├── lib/              # Firebase config, Paystack helpers, utilities
├── styles/           # Global CSS
└── types/            # TypeScript type definitions
```

## API Routes

| Route | Description |
|---|---|
| `POST /api/paystack/initialize` | Initialize a Paystack payment |
| `GET /api/paystack/verify` | Verify a Paystack transaction |
| `POST /api/notifications/send` | Send push notifications to users (admin) |
| `POST /api/upload` | Upload images to Cloudinary (admin) |

## License

MIT — see [LICENSE](LICENSE) for details.
