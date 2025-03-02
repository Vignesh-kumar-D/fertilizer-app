// src/app/layout.tsx
import { Header } from '@/components/shared/header';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { MockDataProvider } from '@/lib/mock-data-context';
import { FirebaseProvider } from '@/lib/firebase/firebase-context';

const APP_NAME = 'Vetri Agro services';
const APP_DEFAULT_TITLE = 'Vetri Agro services';
const APP_TITLE_TEMPLATE = 'Vetri Agro services';
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
      <head>
        {/* Other meta tags */}

        {/* Enable standalone mode for iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        {/* Set the app icon for iOS */}
        <link rel="apple-touch-icon" href="/images/icon_1024x1024.png" />

        {/* Splash screen for iPhone 12, 13, 14 Pro */}
        <link
          rel="apple-touch-startup-image"
          href="/images/icon_1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />

        {/* Since you only have one splash image size, we'll use it for all devices */}
        {/* You might want to create more sizes later for better device coverage */}
        <link
          rel="apple-touch-startup-image"
          href="/images/icon_1170x2532.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        />

        <link
          rel="apple-touch-startup-image"
          href="/images/icon_1170x2532.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
        />

        <link
          rel="apple-touch-startup-image"
          href="/images/icon_1170x2532.png"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"
        />

        <link
          rel="apple-touch-startup-image"
          href="/images/icon_1170x2532.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.className
        )}
      >
        <MockDataProvider>
          <FirebaseProvider>
            <Header />
            <main>{children}</main>
          </FirebaseProvider>
        </MockDataProvider>
        <Toaster />
      </body>
    </html>
  );
}
