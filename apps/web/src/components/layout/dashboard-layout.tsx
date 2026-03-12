'use client';

import { useAuth } from '@/contexts/auth.context';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Navigation based on role
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
        { name: 'Pagos', href: '/payments' },
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
        { name: 'Pagos', href: '/payments' },
      ];
    }

    return [];
  };

  const navigation = getNavigation();

  // Get user initials
  const getUserInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.firstName?.charAt(0).toUpperCase() || '';
    const lastInitial = user.lastName?.charAt(0).toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  };

  return (
    <div className="min-h-screen bg-bone">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Logo size="sm" />
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-primary text-dark'
                      : 'text-gray-700 hover:bg-bone'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User Avatar & Logout */}
            <div className="flex items-center gap-3">
              {/* User Avatar with Initials */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                  <span className="text-dark font-bold text-sm">
                    {getUserInitials()}
                  </span>
                </div>
                <div className="hidden lg:block text-sm">
                  <p className="font-semibold text-dark">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
