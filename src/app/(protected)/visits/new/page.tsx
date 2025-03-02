// src/app/visits/new/page.tsx
'use client';

import { Suspense } from 'react';
import NewVisitForm from '@/components/farmers/new-visit-form'; // Assume we extract the form to a component

export default function AddVisitPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewVisitForm />
    </Suspense>
  );
}
