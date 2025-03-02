// src/components/shared/header.tsx
'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Users,
  Store,
  CalendarDays,
  Menu,
  User,
} from 'lucide-react';
import { useFirebase } from '@/lib/firebase/firebase-context';
import { ButtonLoader } from './loader';
// Base navigation items that all authenticated users can see
const baseNavigation = [
  {
    name: 'Farmers',
    href: '/farmers',
    icon: Users,
    pattern: /^\/farmers/,
  },
  {
    name: 'Purchases',
    href: '/purchases',
    icon: Store,
    pattern: /^\/purchases/,
  },
  {
    name: 'Visits',
    href: '/visits',
    icon: CalendarDays,
    pattern: /^\/visits/,
  },
];

// Admin-only navigation item
const adminNavItem = {
  name: 'Dashboard',
  href: '/dashboard',
  icon: LayoutDashboard,
  pattern: /^\/dashboard/,
};

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, isAdmin, loading } = useFirebase();

  // Generate navigation based on user role
  const navigation = isAdmin
    ? [adminNavItem, ...baseNavigation]
    : [...baseNavigation];

  // Handle sign out

  // If still loading auth state or not authenticated, don't render header
  if (loading) {
    return (
      <div className="flex w-full justify-center">
        <ButtonLoader size={24} />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center px-4 sm:px-8 justify-between">
        <div className="flex items-center space-x-2">
          {/* Logo/Icon */}
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-white"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>

          {/* App Name */}
          <Link href="/" className="flex items-center space-x-2">
            <span
              className={cn(
                'hidden md:inline-block text-xl font-bold text-primary',
                'tracking-tight'
              )}
            >
              Vetri Agro Services
            </span>
            <span
              className={cn(
                'md:hidden text-lg font-bold text-primary',
                'tracking-tight'
              )}
            >
              Vetri Agro
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => {
            const isActive = item.pattern.test(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center space-x-4">
          {/* User Profile Button */}
          <Link
            key={'profile'}
            href={'/profile'}
            className="hidden md:flex items-center space-x-2"
          >
            <User className="h-5 w-5" />
            <span className="text-sm">{currentUser.name}</span>
          </Link>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex flex-col space-y-4 py-4">
                {navigation.map((item) => {
                  const isActive = item.pattern.test(pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center space-x-3 px-3 py-2 rounded-md transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-primary/5 text-muted-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}

                {/* Mobile Profile Link */}
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-md transition-colors',
                    pathname === '/profile'
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-primary/5 text-muted-foreground'
                  )}
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Profile</span>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
