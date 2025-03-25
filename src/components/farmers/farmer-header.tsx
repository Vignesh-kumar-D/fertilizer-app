'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FarmerHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchField: string;
  onSearchFieldChange: (value: string) => void;
}

export function FarmerHeader({
  searchTerm,
  onSearchChange,
  searchField,
  onSearchFieldChange,
}: FarmerHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center w-full sm:w-auto space-x-2">
        <div className="relative flex-1 sm:w-64 flex items-center">
          <Search className="h-4 w-4 absolute left-3 text-muted-foreground" />
          <Input
            placeholder="Search farmers..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>
        <Select value={searchField} onValueChange={onSearchFieldChange}>
          <SelectTrigger className="w-[120px] sm:w-[180px]">
            <SelectValue placeholder="Search by" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="location">Location</SelectItem>
            <SelectItem value="zone">Zone</SelectItem>
            <SelectItem value="crops">Crops</SelectItem>
            <SelectItem value="all">All Fields</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={() => router.push('/farmers/new')}
        className="w-full sm:w-auto"
      >
        <Plus className="mr-2 h-4 w-4" /> Add Farmer
      </Button>
    </div>
  );
}
