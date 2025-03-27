// src/app/visits/new/page.tsx
'use client';

import { Suspense } from 'react';
import NewVisitForm from '@/components/farmers/new-visit-form'; // Assume we extract the form to a component
import { useParams } from 'next/navigation';

export default function AddVisitPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewVisitForm visitId={id} />
    </Suspense>
  );
}
