import './globals.css';
import type { Metadata } from 'next';
import { Instrument_Serif, DM_Sans } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-instrument-serif',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: {
    template: '%s | ThesisMaps',
    default: 'ThesisMaps — Visual Research Intelligence for Graduate Researchers',
  },
  description:
    'ThesisMaps helps PhD and masters students map their literature, discover research gaps, build structured outlines, and prepare for their thesis defence — all in one visual platform.',
  metadataBase: new URL('https://www.thesismaps.com'),
  alternates: { canonical: 'https://www.thesismaps.com' },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://www.thesismaps.com',
    siteName: 'ThesisMaps',
    title: 'ThesisMaps — Visual Research Intelligence',
    description: 'Map your literature. Find the gaps. Write with confidence.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ThesisMaps — Visual Research Intelligence Platform' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ThesisMaps — Visual Research Intelligence',
    description: 'Map your literature. Find the gaps. Write with confidence.',
    images: ['/og-image.png'],
  },
  keywords: ['thesis research', 'literature review', 'knowledge graph', 'PhD tools', 'research gaps', 'citation map'],
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={[instrumentSerif.variable, dmSans.variable].join(' ')}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'ThesisMaps',
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web',
              url: 'https://www.thesismaps.com',
              description:
                'Visual Research Intelligence Platform for graduate-level thesis research.',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'GBP',
              },
            })
              .replace(/</g, '<')
              .replace(/>/g, '>'),
          }}
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
