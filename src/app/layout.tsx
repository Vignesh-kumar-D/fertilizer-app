// src/app/layout.tsx
import { Header } from '@/components/shared/header';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { MockDataProvider } from '@/lib/mock-data-context';

const APP_NAME = 'FertilizerApp';
const APP_DEFAULT_TITLE = 'FertilizerApp';
const APP_TITLE_TEMPLATE = 'FertilizerApp';
const APP_DESCRIPTION = 'Track and manage farmer purchases and visits';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: APP_DEFAULT_TITLE,
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
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
