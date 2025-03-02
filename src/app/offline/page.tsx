// app/offline/page.tsx
'use client';

import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">You&apos;re offline</h1>
        <p className="mb-6 text-gray-600">
          It looks like you&apos;re not connected to the internet. Some features
          may be limited until your connection is restored.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
