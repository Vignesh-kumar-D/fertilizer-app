// app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/lib/firebase/firebase-context';
import { PageLoader } from '@/components/shared/loader';

export default function HomePage() {
  const { currentUser, loading, isAdmin } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        // Not authenticated, go to login
        router.push('/login');
      } else if (isAdmin) {
        // Admin user, go to dashboard
        router.push('/dashboard');
      } else {
        // Regular employee, go to profile
        router.push('/profile');
      }
    }
  }, [currentUser, loading, isAdmin, router]);

  // Show loading spinner while determining where to redirect
  return <PageLoader />;
}
