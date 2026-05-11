import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Credex | Audit AI Spend',
  description: 'Find overspend in your AI stack and get a clear savings report.',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
