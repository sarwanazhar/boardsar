import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import BackendStatusWrapper from '@/components/BackendStatusWrapper';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'BoardSar - Professional Playful Whiteboard',
  description: 'Collaborate in real-time, sketch ideas, and build workflows together. No credit card, no limits, just pure creative freedom.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Gochi+Hand&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className={outfit.className}>
          <BackendStatusWrapper>
            {/* Client component will run initAuth */}
            {children}
          </BackendStatusWrapper>
        </div>
      </body>
    </html>
  );
}
