// src/components/farmers/farmer-header.tsx
'use client';

import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

interface FarmerHeaderProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export function FarmerHeader({
  searchTerm = '',
  onSearchChange,
}: FarmerHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 className="text-2xl font-bold text-foreground">Farmers</h1>

      <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4">
        <div className="relative flex-1 sm:flex-initial min-w-[280px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search farmers..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>

        <Button
          onClick={() => router.push('/farmers/new')}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Farmer
        </Button>
      </div>
    </div>
  );
}
