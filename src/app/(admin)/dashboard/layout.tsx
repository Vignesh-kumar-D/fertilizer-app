// app/(admin)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/lib/firebase/firebase-context';
import { PageLoader } from '@/components/shared/loader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isAdmin, loading } = useFirebase();
  const router = useRouter();

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        // Not authenticated
        router.push('/login');
      } else if (!isAdmin) {
        // Not an admin
        router.push('/farmers');
      }
    }
  }, [currentUser, isAdmin, loading, router]);

  // Show loading state while checking auth
  if (loading || !currentUser || !isAdmin) {
    return <PageLoader />;
  }

  // Render admin content if authenticated and admin
  return <>{children}</>;
}
