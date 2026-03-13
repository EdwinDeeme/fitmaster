'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';
import { Building2, Users, CreditCard, Search, MoreVertical, Eye, Ban, CheckCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { gymsService } from '@/services/gyms.service';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GymsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: gyms, isLoading } = useQuery({
    queryKey: ['gyms'],
    queryFn: gymsService.getAll,
  });

  const filteredGyms = gyms?.filter((gym) =>
    gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gym.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-50 text-green-700 border-green-200',
      TRIAL: 'bg-blue-50 text-blue-700 border-blue-200',
      SUSPENDED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      INACTIVE: 'bg-gray-50 text-gray-700 border-gray-200',
    };

    const labels = {
      ACTIVE: 'Activo',
      TRIAL: 'Prueba',
      SUSPENDED: 'Suspendido',
      INACTIVE: 'Inactivo',
    };

    const icons = {
      ACTIVE: CheckCircle,
      TRIAL: Clock,
      SUSPENDED: Ban,
      INACTIVE: Ban,
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        <Icon className="h-3 w-3" />
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
    }).format(amount);
  };

  const getIntervalLabel = (interval: string) => {
    const labels: Record<string, string> = {
      MONTHLY: 'mes',
      QUARTERLY: 'trimestre',
      ANNUAL: 'año',
    };
    return labels[interval] || 'mes';
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
      <DashboardLayout>
        <div className="py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-dark">Gestión de Gimnasios</h1>
              <p className="text-gray-600 mt-1">
                Visualiza y administra todos los gimnasios de la plataforma
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Los gimnasios se crean automáticamente cuando un cliente completa el pago
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o subdominio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </CardContent>
          </Card>

          {/* Gyms List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Cargando gimnasios...</p>
            </div>
          ) : filteredGyms && filteredGyms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGyms.map((gym) => (
                <Card key={gym.id} className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
                  <CardHeader className="border-b border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-3 bg-primary/10 rounded-xl">
                          <Building2 className="h-6 w-6 text-green-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg text-dark truncate">{gym.name}</CardTitle>
                          <CardDescription className="text-sm truncate">
                            {gym.subdomain}.fitmaster.com
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(gym.status)}
                        <p className="text-xs text-gray-400">
                          {formatShortDate(gym.createdAt)}
                        </p>
                      </div>
                    </div>
                    {gym.subscription && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">
                          {gym.subscription.plan.name}
                        </span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Usuarios Staff</span>
                        </div>
                        <span className="text-sm font-semibold text-dark">{gym._count.users}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Clientes</span>
                        </div>
                        <span className="text-sm font-semibold text-dark">{gym._count.clients}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Membresías</span>
                        </div>
                        <span className="text-sm font-semibold text-dark">{gym._count.memberships}</span>
                      </div>
                      
                      {gym.subscription && (
                        <div className="pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Suscripción</span>
                            <span className="text-sm font-semibold text-green-700">
                              {formatCurrency(Number(gym.subscription.plan.price))}/{getIntervalLabel(gym.subscription.plan.interval)}
                            </span>
                          </div>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`/admin/gyms/${gym.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-none shadow-sm">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="p-4 bg-bone rounded-full mb-4">
                    <Building2 className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">
                    {searchTerm ? 'No se encontraron gimnasios' : 'No hay gimnasios registrados'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchTerm 
                      ? 'Intenta con otro término de búsqueda' 
                      : 'Los gimnasios aparecerán aquí cuando los clientes completen el proceso de pago'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
