import type { Metadata } from 'next';
import { Providers } from './store/provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Your App',
  description: 'Login page',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}