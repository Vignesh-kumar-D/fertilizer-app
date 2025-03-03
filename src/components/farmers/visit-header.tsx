'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, X, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Farmer } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';

interface VisitHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  farmers: Farmer[];
  selectedFarmerId: string;
  onFarmerChange: (value: string) => void;
}

export default function VisitHeader({
  searchTerm,
  onSearchChange,
  farmers,
  selectedFarmerId,
  onFarmerChange,
}: VisitHeaderProps) {
  const router = useRouter();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const handleClearFilters = () => {
    onFarmerChange('');
    onSearchChange('');
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Visits</h1>
          <p className="text-muted-foreground">
            Track and manage your farm visits
          </p>
        </div>

        <Button onClick={() => router.push('/visits/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Visit
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input - Full width on mobile, flexible width on desktop */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search visits..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-2.5"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:flex items-center gap-2">
          <Select value={selectedFarmerId} onValueChange={onFarmerChange}>
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="All Farmers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Farmers</SelectItem>
              {farmers.map((farmer) => (
                <SelectItem key={farmer.id} value={farmer.id}>
                  {farmer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchTerm || selectedFarmerId) && (
            <Button variant="outline" onClick={handleClearFilters} size="sm">
              Clear Filters
            </Button>
          )}
        </div>

        {/* Mobile Filter Button */}
        <div className="md:hidden">
          <Sheet
            open={isMobileFiltersOpen}
            onOpenChange={setIsMobileFiltersOpen}
          >
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Narrow down visits based on filters
                </SheetDescription>
              </SheetHeader>

              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile-farmer-filter">Farmer</Label>
                  <Select
                    value={selectedFarmerId}
                    onValueChange={(value) => {
                      onFarmerChange(value);
                    }}
                  >
                    <SelectTrigger id="mobile-farmer-filter" className="w-full">
                      <SelectValue placeholder="All Farmers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Farmers</SelectItem>
                      {farmers.map((farmer) => (
                        <SelectItem key={farmer.id} value={farmer.id}>
                          {farmer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SheetFooter className="pt-4 flex gap-2">
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="flex-1"
                  >
                    Clear All
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button className="flex-1">Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
