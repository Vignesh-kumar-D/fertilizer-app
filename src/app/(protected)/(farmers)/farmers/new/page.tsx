'use client';
import { FarmerForm } from '@/components/farmers/farmer-form';

export default function NewFarmerPage() {
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Add New Farmer</h1>
      <FarmerForm />
    </div>
  );
}
