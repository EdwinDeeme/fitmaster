'use client';

import { useAuth } from '@/contexts/auth.context';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  const getNavigation = () => {
    if (user?.role === 'SUPER_ADMIN') {
      return [
        { name: 'Dashboard', href: '/admin/dashboard' },
        { name: 'Gimnasios', href: '/admin/gyms' },
        { name: 'Planes', href: '/admin/plans' },
        { name: 'Facturación', href: '/admin/billing' },
      ];
    }
    if (user?.role === 'GYM_ADMIN') {
      return [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Clientes', href: '/clients' },
        { name: 'Membresías', href: '/memberships' },
        { name: 'Finanzas', href: '/finances' },
        { name: 'Rutinas', href: '/routines' },
        { name: 'Equipamiento', href: '/equipment' },
        { name: 'Staff', href: '/staff' },
      ];
    }
    if (user?.role === 'TRAINER') {
      return [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Mis Clientes', href: '/clients' },
        { name: 'Rutinas', href: '/routines' },
        { name: 'Equipamiento', href: '/equipment' },
      ];
    }
    if (user?.role === 'RECEPTIONIST') {
      return [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Clientes', href: '/clients' },
        { name: 'Membresías', href: '/memberships' },
        { name: 'Finanzas', href: '/finances' },
      ];
    }
    return [];
  };

  const navigation = getNavigation();

  const getUserInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.charAt(0).toUpperCase() || ''}${user.lastName?.charAt(0).toUpperCase() || ''}`;
  };

  return (
    <div className="min-h-screen bg-bone">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {/* Hamburger — mobile only */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-bone transition-colors"
                onClick={() => setMobileMenuOpen(o => !o)}
                aria-label="Menú"
              >
                {mobileMenuOpen ? <X className="h-5 w-5 text-dark" /> : <Menu className="h-5 w-5 text-dark" />}
              </button>
              <Logo size="sm" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {mounted && navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href ? 'bg-primary text-dark' : 'text-gray-700 hover:bg-bone'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User + Logout */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shrink-0">
                  <span className="text-dark font-bold text-xs sm:text-sm">
                    {mounted ? getUserInitials() : ''}
                  </span>
                </div>
                <div className="hidden lg:block text-sm">
                  <p className="font-semibold text-dark leading-tight">
                    {mounted ? `${user?.firstName} ${user?.lastName}` : ''}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="flex items-center gap-1.5">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && mounted && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === item.href ? 'bg-primary text-dark' : 'text-gray-700 hover:bg-bone'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16, scale: 0.996 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.998 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}