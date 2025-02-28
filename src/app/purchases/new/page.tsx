'use client';

import { Suspense } from 'react';
import NewPurchaseForm from '@/components/farmers/new-purchase-form'; // Assume we extract the form to a component

export default function AddVisitPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewPurchaseForm />
    </Suspense>
  );
}
