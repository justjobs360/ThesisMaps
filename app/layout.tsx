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
    default: 'ThesisMaps: Visual Research Intelligence for Graduate Researchers',
  },
  description:
    'ThesisMaps helps PhD and masters students map their literature, discover research gaps, build structured outlines, and prepare for their thesis defence, all in one visual platform.',
  metadataBase: new URL('https://www.thesismaps.com'),
  alternates: { canonical: 'https://www.thesismaps.com' },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://www.thesismaps.com',
    siteName: 'ThesisMaps',
    title: 'ThesisMaps: Visual Research Intelligence',
    description: 'Map your literature. Find the gaps. Write with confidence.',
    // Images intentionally omitted: app/opengraph-image.tsx generates them and
    // Next injects the tags automatically. Hardcoding /og-image.png here pointed
    // at a file that never existed (public/ is empty).
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ThesisMaps: Visual Research Intelligence',
    description: 'Map your literature. Find the gaps. Write with confidence.',
  },
  keywords: ['thesis research', 'literature review', 'knowledge graph', 'PhD tools', 'research gaps', 'citation map'],
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={[instrumentSerif.variable, dmSans.variable].join(' ')}>
      {/* JSON-LD lives on the landing page (app/page.tsx), not here — in the root
          layout it was injected into every route, including /admin. */}
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
