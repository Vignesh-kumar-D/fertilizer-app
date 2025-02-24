// src/app/layout.tsx
import { Header } from '@/components/shared/header';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { MockDataProvider } from '@/lib/mock-data-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FertilizerApp',
  description: 'Track and manage farmer purchases and visits',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.className
        )}
      >
        <Header />
        <MockDataProvider>
          <main>{children}</main>
        </MockDataProvider>
        <Toaster />
      </body>
    </html>
  );
}
