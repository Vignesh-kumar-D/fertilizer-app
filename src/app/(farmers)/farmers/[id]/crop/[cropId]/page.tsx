'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import FarmerCropActivities from '@/components/farmers/FarmerCropActivities';

export default function FarmerCropPage() {
  const { id, cropId } = useParams<{ id: string; cropId: string }>();

  return <FarmerCropActivities farmerId={id} cropId={cropId} />;
}
