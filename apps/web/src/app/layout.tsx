import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Findable - AI SEO Platform',
  description: 'Measure how models see you. Fix gaps. Win the pick at the moment of query.',
  keywords: ['AI SEO', 'LLM optimization', 'AI findability', 'developer tools'],
  authors: [{ name: 'Findable Team' }],
  openGraph: {
    title: 'Findable - AI SEO Platform',
    description: 'Measure how models see you. Fix gaps. Win the pick at the moment of query.',
    url: 'https://findable.ai',
    siteName: 'Findable',
    images: [
      {
        url: 'https://findable.ai/og.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Findable - AI SEO Platform',
    description: 'Measure how models see you. Fix gaps. Win the pick at the moment of query.',
    images: ['https://findable.ai/og.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}