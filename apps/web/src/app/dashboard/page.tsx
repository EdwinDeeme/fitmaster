'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '@/types/auth';
import { useAuth } from '@/contexts/auth.context';
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Clock, 
  Dumbbell,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { RecentRoutines } from '@/components/routines/recent-routines';

export default function DashboardPage() {
  const { user } = useAuth();

  // Fetch metrics based on role
  const { data: gymMetrics, isLoading: gymMetricsLoading } = useQuery({
    queryKey: ['gym-metrics'],
    queryFn: dashboardService.getGymMetrics,
    enabled: user?.role === UserRole.GYM_ADMIN || user?.role === UserRole.RECEPTIONIST,
  });

  const { data: trainerMetrics, isLoading: trainerMetricsLoading } = useQuery({
    queryKey: ['trainer-metrics'],
    queryFn: dashboardService.getTrainerMetrics,
    enabled: user?.role === UserRole.TRAINER,
  });

  // Get role-specific title and subtitle
  const getRoleInfo = () => {
    switch (user?.role) {
      case UserRole.GYM_ADMIN:
        return {
          title: 'Dashboard del Gimnasio',
          subtitle: 'Gestión completa de tu gimnasio',
          icon: Dumbbell,
        };
      case UserRole.TRAINER:
        return {
          title: 'Dashboard del Entrenador',
          subtitle: 'Gestiona tus clientes y rutinas',
          icon: UserCheck,
        };
      case UserRole.RECEPTIONIST:
        return {
          title: 'Dashboard de Recepción',
          subtitle: 'Operaciones diarias del gimnasio',
          icon: Activity,
        };
      default:
        return {
          title: 'Dashboard',
          subtitle: 'Bienvenido',
          icon: Activity,
        };
    }
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
    }).format(Number(amount));
  };

  const isLoading = gymMetricsLoading || trainerMetricsLoading;

  return (
    <ProtectedRoute
      allowedRoles={[UserRole.GYM_ADMIN, UserRole.TRAINER, UserRole.RECEPTIONIST]}
    >
      <DashboardLayout>
        <div className="py-6 space-y-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-dark to-gray-800 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-xl">
                  <RoleIcon className="h-8 w-8 text-dark" />
                </div>
                <div>
                  <h2 className="text-4xl font-bold mb-1">{roleInfo.title}</h2>
                  <p className="text-gray-300 text-lg">{roleInfo.subtitle}</p>
                </div>
              </div>
              <div className="hidden md:block text-right">
                <p className="text-gray-400 text-sm">Bienvenido de vuelta</p>
                <p className="text-2xl font-bold text-primary">{user?.firstName}</p>
              </div>
            </div>
          </div>

          {/* Gym Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Clientes - Todos los roles */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-gray-600">
                  {user?.role === UserRole.TRAINER ? 'Clientes Asignados' : 'Clientes Activos'}
                </CardDescription>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-4xl font-bold text-dark mb-2">
                  {isLoading ? '...' : (
                    user?.role === UserRole.TRAINER 
                      ? trainerMetrics?.assignedClients || 0
                      : gymMetrics?.activeClients || 0
                  )}
                </CardTitle>
                {user?.role !== UserRole.TRAINER && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">+0%</span>
                    <span className="text-xs text-gray-400">desde el mes pasado</span>
                  </div>
                )}
                {user?.role === UserRole.TRAINER && (
                  <p className="text-sm text-gray-500">Tus clientes actuales</p>
                )}
              </CardContent>
            </Card>

            {/* Membresías - Solo GYM_ADMIN y RECEPTIONIST */}
            {user?.role !== UserRole.TRAINER && (
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardDescription className="text-gray-600">Membresías Activas</CardDescription>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-4xl font-bold text-dark mb-2">
                    {isLoading ? '...' : gymMetrics?.activeMemberships || 0}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">+0%</span>
                    <span className="text-xs text-gray-400">desde el mes pasado</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rutinas - Solo TRAINER */}
            {user?.role === UserRole.TRAINER && (
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardDescription className="text-gray-600">Rutinas Creadas</CardDescription>
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <Dumbbell className="h-6 w-6 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-4xl font-bold text-dark mb-2">
                    {isLoading ? '...' : trainerMetrics?.routinesCreated || 0}
                  </CardTitle>
                  <p className="text-sm text-gray-500">Este mes</p>
                </CardContent>
              </Card>
            )}

            {/* Ingresos - Solo GYM_ADMIN */}
            {user?.role === UserRole.GYM_ADMIN && (
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardDescription className="text-gray-600">Ingresos del Mes</CardDescription>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-4xl font-bold text-dark mb-2">
                    {isLoading ? '...' : formatCurrency(Number(gymMetrics?.monthlyRevenue || 0))}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">+0%</span>
                    <span className="text-xs text-gray-400">desde el mes pasado</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nuevos Clientes - GYM_ADMIN y RECEPTIONIST */}
            {(user?.role === UserRole.GYM_ADMIN || user?.role === UserRole.RECEPTIONIST) && (
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-primary to-primary-dark">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardDescription className="text-dark/70">Nuevos Clientes</CardDescription>
                  <div className="p-3 bg-dark/10 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-dark" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-4xl font-bold text-dark mb-2">
                    {isLoading ? '...' : gymMetrics?.newClients || 0}
                  </CardTitle>
                  <p className="text-sm text-dark/70 font-medium">Este mes</p>
                </CardContent>
              </Card>
            )}

            {/* Progreso de Clientes - Solo TRAINER */}
            {user?.role === UserRole.TRAINER && (
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-primary to-primary-dark">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardDescription className="text-dark/70">Progreso Registrado</CardDescription>
                  <div className="p-3 bg-dark/10 rounded-xl">
                    <BarChart3 className="h-6 w-6 text-dark" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-4xl font-bold text-dark mb-2">0</CardTitle>
                  <p className="text-sm text-dark/70 font-medium">Esta semana</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Activity Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-dark">
                      {user?.role === UserRole.TRAINER ? 'Rutinas Recientes' : 'Actividad Reciente'}
                    </CardTitle>
                    <CardDescription>
                      {user?.role === UserRole.TRAINER 
                        ? 'Últimas rutinas creadas o modificadas'
                        : 'Últimas acciones en el gimnasio'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <RecentRoutines limit={5} />
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    {user?.role === UserRole.TRAINER ? (
                      <UserCheck className="h-5 w-5 text-orange-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-dark">
                      {user?.role === UserRole.TRAINER
                        ? 'Clientes Asignados'
                        : user?.role === UserRole.RECEPTIONIST
                        ? 'Membresías por Vencer Hoy'
                        : 'Membresías por Vencer'}
                    </CardTitle>
                    <CardDescription>
                      {user?.role === UserRole.TRAINER
                        ? 'Tus clientes actuales'
                        : user?.role === UserRole.RECEPTIONIST
                        ? 'Vencimientos de hoy'
                        : 'Próximos vencimientos'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-gray-500">Cargando...</p>
                  </div>
                ) : user?.role === UserRole.TRAINER && trainerMetrics?.assignedClientsList && trainerMetrics.assignedClientsList.length > 0 ? (
                  <div className="space-y-3">
                    {trainerMetrics.assignedClientsList.map((client) => (
                      <div key={client.id} className="flex items-center justify-between p-3 bg-bone rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-semibold text-dark">{client.firstName} {client.lastName}</p>
                          <p className="text-xs text-gray-500">{client.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : user?.role !== UserRole.TRAINER && gymMetrics?.expiringMemberships && gymMetrics.expiringMemberships.length > 0 ? (
                  <div className="space-y-3">
                    {gymMetrics.expiringMemberships.map((membership) => (
                      <div key={membership.id} className="flex items-center justify-between p-3 bg-bone rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-semibold text-dark">
                            {membership.client.firstName} {membership.client.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{membership.client.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-orange-600 font-medium">
                            {new Date(membership.endDate).toLocaleDateString('es-CR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="p-4 bg-green-50 rounded-full mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-500">
                      {user?.role === UserRole.TRAINER
                        ? 'No tienes clientes asignados'
                        : user?.role === UserRole.RECEPTIONIST
                        ? 'No hay membresías por vencer hoy'
                        : 'No hay membresías por vencer'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {user?.role === UserRole.TRAINER
                        ? 'Los clientes asignados aparecerán aquí'
                        : 'Todas las membresías están al día'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Role-specific additional info */}
          {user?.role === UserRole.GYM_ADMIN && (
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-dark">Resumen del Gimnasio</CardTitle>
                    <CardDescription>Estadísticas generales de rendimiento</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 bg-bone rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-dark">Tasa de Retención</span>
                    </div>
                    <span className="text-lg font-bold text-dark">0%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-bone rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Activity className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-dark">Promedio de Asistencia</span>
                    </div>
                    <span className="text-lg font-bold text-dark">0%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-bone rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Dumbbell className="h-5 w-5 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-dark">Equipamiento Activo</span>
                    </div>
                    <span className="text-lg font-bold text-dark">0</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-bone rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <Users className="h-5 w-5 text-orange-600" />
                      </div>
                      <span className="text-sm font-medium text-dark">Staff Activo</span>
                    </div>
                    <span className="text-lg font-bold text-dark">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
