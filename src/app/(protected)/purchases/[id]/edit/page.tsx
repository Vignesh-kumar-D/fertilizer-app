'use client';

import { Suspense } from 'react';
import NewPurchaseForm from '@/components/farmers/new-purchase-form'; // Assume we extract the form to a component
import { useParams } from 'next/navigation';

export default function AddPurchasePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewPurchaseForm purchaseId={id} />
    </Suspense>
  );
}
