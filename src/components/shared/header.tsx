// src/components/shared/header.tsx
'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Removed useState as Sheet is removed
// Removed Sheet, SheetContent, SheetTrigger
import {
  LayoutDashboard,
  Users,
  Store, // Note: You might want ShoppingCart from lucide-react if that's what you used in BottomNav
  CalendarDays, // Note: You might want ClipboardList from lucide-react if that's what you used in BottomNav
  // Menu icon is removed
  User,
} from 'lucide-react';
import { useFirebase } from '@/lib/firebase/firebase-context'; // Assuming path is correct
import { ButtonLoader } from './loader'; // Assuming path is correct
import Image from 'next/image';

// --- Navigation Definitions ---
// (Consider defining these in a separate config file if used elsewhere, e.g., BottomNav)

// Base navigation items
const baseNavigation = [
  {
    name: 'Farmers',
    href: '/farmers',
    icon: Users, // Icon for Farmers
    pattern: /^\/farmers/,
  },
  {
    name: 'Purchases',
    href: '/purchases',
    icon: Store, // Icon for Purchases (Consider IndianRupee or ShoppingCart maybe?)
    pattern: /^\/purchases/,
  },
  {
    name: 'Visits',
    href: '/visits',
    icon: CalendarDays, // Icon for Visits (Consider ClipboardList?)
    pattern: /^\/visits/,
  },
  // You might want to add Combos here for desktop consistency?
  // {
  //   name: 'Combos',
  //   href: '/combos',
  //   icon: Star, // Or Sparkles
  //   pattern: /^\/combos/,
  // },
];

// Admin-only navigation item
const adminNavItem = {
  name: 'Dashboard',
  href: '/dashboard',
  icon: LayoutDashboard,
  pattern: /^\/dashboard/,
};

// --- Header Component ---
export function Header() {
  const pathname = usePathname();
  // Removed isOpen state for Sheet
  const { currentUser, isAdmin, loading } = useFirebase();

  // Generate navigation based on user role
  const navigation = isAdmin
    ? [adminNavItem, ...baseNavigation]
    : [...baseNavigation];

  // If still loading auth state or not authenticated, don't render header
  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-white">
        <div className="container flex h-16 items-center justify-center px-4 sm:px-8">
          <ButtonLoader size={24} />
        </div>
      </header>
    );
  }

  // Don't render anything if not logged in (as per original logic)
  if (!currentUser) {
    return null;
  }

  // Render Desktop Header
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {' '}
      {/* Updated background style */}
      <div className="container flex h-16 items-center px-4 sm:px-8 justify-between">
        {/* Left Section: Logo & App Name */}
        <div className="flex items-center space-x-2 mr-6">
          {' '}
          {/* Added margin */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src={'/images/icon_maskable_512x512.png'} // Ensure this path is correct in public folder
              alt={`Sree Vetri Agro Services Logo`}
              width={36} // Slightly smaller logo?
              height={36}
              className="object-contain rounded-md" // Changed to rounded-md?
            />
            {/* App Name - simplified for better responsiveness view */}
            <span
              className={cn('font-bold text-primary tracking-tight text-lg')}
            >
              {' '}
              {/* Single text size */}
              SREE VETRI AGRO
            </span>
          </Link>
        </div>

        {/* Middle Section: Desktop Navigation (Visible md and up) */}
        <nav className="hidden md:flex flex-1 items-center justify-center space-x-6">
          {' '}
          {/* Centered navigation */}
          {navigation.map((item) => {
            // More robust active check: handles '/farmers' and '/farmers/[id]'
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name} // Use name as key if href might not be unique across sections in future
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary px-2 py-1 rounded-md', // Added padding/rounding
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:bg-accent/50' // Added background on active/hover
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Desktop Profile (Visible md and up) */}
        <div className="hidden md:flex items-center space-x-4 ml-6">
          {' '}
          {/* Added margin */}
          <Link
            key={'profile'}
            href={'/profile'}
            className={cn(
              'flex items-center gap-2 text-sm font-medium transition-colors text-muted-foreground hover:text-primary',
              pathname.startsWith('/profile') ? 'text-primary' : '' // Active check for profile
            )}
          >
            <User className="h-5 w-5" />
            {/* Optionally hide name if too long, show on hover? */}
            <span className="truncate max-w-[100px]">
              {currentUser.name || 'Profile'}
            </span>
          </Link>
          {/* You might add a Sign Out button here */}
        </div>

        {/* Mobile Menu Trigger and Sheet Content are REMOVED */}
      </div>
    </header>
  );
}
