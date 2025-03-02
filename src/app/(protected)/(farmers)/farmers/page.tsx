// src/app/farmers/page.tsx
'use client';
import { FarmerList } from '@/components/farmers/farmer-list';

export default function FarmersPage() {
  return (
    <main className="container mx-auto p-4 space-y-4">
      <FarmerList />
    </main>
  );
}
