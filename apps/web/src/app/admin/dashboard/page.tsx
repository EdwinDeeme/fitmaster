'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '@/types/auth';
import { useAuth } from '@/contexts/auth.context';
import { Building2, Users, TrendingUp, DollarSign, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { gymsService } from '@/services/gyms.service';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  // Fetch gym stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['gym-stats'],
    queryFn: gymsService.getStats,
  });

  // Fetch all gyms
  const { data: gyms, isLoading: gymsLoading } = useQuery({
    queryKey: ['gyms'],
    queryFn: gymsService.getAll,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
      <DashboardLayout>
        <div className="py-6 space-y-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-dark to-gray-800 rounded-2xl p-5 sm:p-8 text-white shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-4xl font-bold mb-1 sm:mb-2 truncate">Panel de Control</h2>
                <p className="text-gray-300 text-sm sm:text-lg">
                  Bienvenido de vuelta, <span className="text-primary font-semibold">{user?.firstName}</span>
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-primary via-primary to-primary/80 px-4 py-2 rounded-lg shadow-md shrink-0">
                <Activity className="h-5 w-5 text-dark" />
                <span className="text-dark font-semibold">Sistema Activo</span>
              </div>
            </div>
          </div>

          {/* Platform Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-gray-600">Total Gimnasios</CardDescription>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Building2 className="h-6 w-6 text-green-700" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-4xl font-bold text-dark mb-2">
                  {statsLoading ? '...' : stats?.totalGyms || 0}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-700 font-medium">
                    {statsLoading ? '...' : stats?.gymsByStatus?.active || 0} activos
                  </span>
                  <span className="text-xs text-gray-400">
                    • {statsLoading ? '...' : (stats?.gymsByStatus?.trial || 0)} en prueba
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-gray-600">Total Usuarios</CardDescription>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-4xl font-bold text-dark mb-2">
                  {statsLoading ? '...' : stats?.totalUsers || 0}
                </CardTitle>
                <p className="text-sm text-gray-500">En toda la plataforma</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-gray-600">Ingresos (MRR)</CardDescription>
                <div className="p-3 bg-green-50 rounded-xl">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-4xl font-bold text-dark mb-2">
                  {statsLoading ? '...' : formatCurrency(Number(stats?.totalRevenue || 0))}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">+0%</span>
                  <span className="text-xs text-gray-400">vs mes anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-primary to-primary-dark">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-dark/70">Tasa de Crecimiento</CardDescription>
                <div className="p-3 bg-dark/10 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-dark" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-4xl font-bold text-dark mb-2">0%</CardTitle>
                <p className="text-sm text-dark/70 font-medium">Este mes</p>
              </CardContent>
            </Card>
          </div>

          {/* Gyms Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <CardTitle className="text-dark">Gimnasios Recientes</CardTitle>
                    <CardDescription>Últimos gimnasios registrados</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {gymsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-gray-500">Cargando...</p>
                  </div>
                ) : gyms && gyms.length > 0 ? (
                  <div className="space-y-3">
                    {gyms.slice(0, 5).map((gym) => (
                      <div 
                        key={gym.id} 
                        onClick={() => window.location.href = `/admin/gyms/${gym.id}`}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-bone to-white rounded-xl hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer border border-gray-100"
                      >
                        {/* Icono del gimnasio */}
                        <div className="flex-shrink-0">
                          <div className="p-3 bg-primary/10 rounded-xl">
                            <Building2 className="h-6 w-6 text-green-700" />
                          </div>
                        </div>

                        {/* Información principal */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-dark text-base mb-1 truncate">
                            {gym.name}
                          </h4>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-gray-400" />
                              <span>{gym._count.users} staff</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-blue-400" />
                              <span>{gym._count.clients} clientes</span>
                            </div>
                          </div>
                        </div>

                        {/* Fecha y flecha */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-gray-400">
                              {formatDate(gym.createdAt)}
                            </p>
                          </div>
                          <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-primary/10 transition-colors">
                            <svg 
                              className="h-4 w-4 text-gray-400" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="p-4 bg-bone rounded-full mb-4">
                      <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No hay gimnasios registrados</p>
                    <p className="text-xs text-gray-400 mt-1">Los nuevos gimnasios aparecerán aquí</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-dark">Suscripciones por Vencer</CardTitle>
                    <CardDescription>Próximos vencimientos de planes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="p-4 bg-green-50 rounded-full mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-500">No hay suscripciones por vencer</p>
                  <p className="text-xs text-gray-400 mt-1">Todas las suscripciones están al día</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Analytics */}
          <Card className="border-none shadow-lg bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-dark">Analíticas de Plataforma</CardTitle>
                  <CardDescription>Resumen de actividad en la plataforma</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex items-center gap-3 p-4 bg-bone rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Gimnasios Activos</p>
                    <p className="text-2xl font-bold text-dark">
                      {statsLoading ? '...' : stats?.totalGyms || 0}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-bone rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Gimnasios Inactivos</p>
                    <p className="text-2xl font-bold text-dark">0</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-bone rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Pagos Pendientes</p>
                    <p className="text-2xl font-bold text-dark">₡0</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-bone rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Tickets de Soporte</p>
                    <p className="text-2xl font-bold text-dark">0</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
