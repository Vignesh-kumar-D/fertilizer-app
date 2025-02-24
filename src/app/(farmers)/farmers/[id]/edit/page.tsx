'use client';
import { FarmerForm } from '@/components/farmers/farmer-form';
import { useParams } from 'next/navigation';

export default function EditFarmerPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Farmer</h1>
      <FarmerForm farmerId={id} />
    </div>
  );
}
