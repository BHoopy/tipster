import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Leeman Tips – Expert Sports Betting Predictions',
  description: 'Daily expert football predictions, booking codes, and betting tips from Leeman. Free & VIP picks updated every day.',
  keywords: 'betting tips, football predictions, booking codes, Betway, SportyBet, sports tips',
  openGraph: {
    title: 'Leeman Tips – Expert Sports Betting Predictions',
    description: 'Daily expert football predictions & booking codes from Leeman.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
