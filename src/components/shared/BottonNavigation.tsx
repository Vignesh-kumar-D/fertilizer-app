// src/components/layout/BottomNavigation.tsx (or your chosen path)
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardList, // Icon for Visits
  ShoppingCart, // Icon for Purchases
  Star, // Icon for Combos
  CircleUserRound, // Icon for Profile
  Plus,
  CalendarCheck, // Icon for Add Visit Button in Drawer
  IndianRupee, // Icon for Add Purchase Button in Drawer
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming shadcn/ui utils
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'; // Using Drawer for mobile FAB action
import { Button } from '@/components/ui/button';

// --- Define navigation items in the CORRECT order ---
// [Item1, Item2, Item3] [FAB] [Item4, Item5, Item6]
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/farmers', label: 'Farmers', icon: Users },
  { href: '/visits', label: 'Visits', icon: ClipboardList },
  // The FAB placeholder is handled by layout division (3 items left, 3 items right)
  { href: '/purchases', label: 'Purchases', icon: ShoppingCart },
  { href: '/combos', label: 'Combos', icon: Star },
  { href: '/profile', label: 'Profile', icon: CircleUserRound }, // Profile Added
];
// Total 6 navigation items

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Close drawer and navigate
  const handleNavigation = (path: string) => {
    router.push(path);
    setIsDrawerOpen(false);
  };

  // Improved active state checker
  const isActive = (itemHref: string) => {
    // Exact match for dashboard or base paths like /farmers
    if (pathname === itemHref) return true;
    // Match for sub-paths like /farmers/[id], but avoid matching /farmers-other-route
    if (itemHref !== '/' && pathname.startsWith(itemHref + '/')) return true;
    return false;
  };

  return (
    <>
      {/* Bottom Navigation Bar - visible only below md breakpoint */}
      {/* Slightly Taller Bar: Height increased to h-[68px] (approx 4.25rem) to give FAB more room */}
      <div className="fixed bottom-0 left-0 right-0 z-40 h-[68px] border-t bg-background shadow-[0_-2px_6px_-1px_rgba(0,0,0,0.1)] md:hidden">
        {/* Relative container to position the FAB */}
        <div className="relative h-full">
          {/* Flex container for the 6 navigation items */}
          <nav className="flex h-full items-center justify-around">
            {/* First 3 items (Left) */}
            {navItems.slice(0, 3).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-full w-[calc(100%/7)] flex-col items-center justify-center gap-0.5 pt-1 text-center text-xs', // Each takes 1/7th width
                  isActive(item.href)
                    ? 'text-primary' // Active color
                    : 'text-muted-foreground hover:text-foreground' // Default colors
                )}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="mt-0.5 truncate px-1">{item.label}</span>{' '}
                {/* Truncate long labels */}
              </Link>
            ))}

            {/* Placeholder Div - Takes up the middle 1/7th space where FAB sits */}
            <div className="w-[calc(100%/7)] flex-shrink-0"></div>

            {/* Last 3 items (Right) */}
            {navItems.slice(3).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-full w-[calc(100%/7)] flex-col items-center justify-center gap-0.5 pt-1 text-center text-xs', // Each takes 1/7th width
                  isActive(item.href)
                    ? 'text-primary' // Active color
                    : 'text-muted-foreground hover:text-foreground' // Default colors
                )}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="mt-0.5 truncate px-1">{item.label}</span>{' '}
                {/* Truncate long labels */}
              </Link>
            ))}
          </nav>

          {/* Actual Floating Action Button (FAB) - Centered and Raised */}
          {/* Positioned absolutely relative to the parent div */}
          <div className="absolute left-1/2 top-[-20px] transform -translate-x-1/2">
            {' '}
            {/* Adjust top-[-20px] to control elevation */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  // Larger FAB, elevated with border to separate from bar
                  className="h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 border-4 border-background"
                  aria-label="Add New Record"
                >
                  <Plus className="h-7 w-7" /> {/* Larger Plus Icon */}
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader className="text-left">
                  <DrawerTitle>Add New Record</DrawerTitle>
                  <DrawerDescription>
                    Choose the type of record you want to create.
                  </DrawerDescription>
                </DrawerHeader>
                {/* Drawer content with Visit/Purchase buttons */}
                <div className="grid grid-cols-2 gap-4 p-4 pb-0">
                  <Button
                    variant="outline"
                    className="py-6 text-lg flex h-auto flex-col items-center justify-center gap-2" // Centered content
                    onClick={() => handleNavigation('/visits/new')}
                  >
                    <CalendarCheck className="mb-1 h-8 w-8" />
                    Visit
                  </Button>
                  <Button
                    variant="outline"
                    className="py-6 text-lg flex h-auto flex-col items-center justify-center gap-2" // Centered content
                    onClick={() => handleNavigation('/purchases/new')}
                  >
                    <IndianRupee className="mb-1 h-8 w-8" />
                    Purchase
                  </Button>
                </div>
                <DrawerFooter className="pt-4">
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>

      {/* === IMPORTANT === */}
      {/* Add Padding to the element wrapping your page content in layout.tsx */}
      {/* This prevents the bottom nav from overlapping your page content */}
      {/* Example for layout.tsx: */}
      {/* <main className="flex-grow pb-[68px] md:pb-0"> {children} </main> */}
      {/* Make sure the padding value matches the height 'h-[68px]' */}
      {/* ---             --- */}
    </>
  );
}
