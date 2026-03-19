'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '@/types/auth';
import { useAuth } from '@/contexts/auth.context';
import {
  Users, CreditCard, DollarSign, TrendingUp, Activity, Clock,
  Dumbbell, UserCheck, AlertCircle, CheckCircle2, BarChart3,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { RecentRoutines } from '@/components/routines/recent-routines';

export default function DashboardPage() {
  const { user } = useAuth();

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

  const getRoleInfo = () => {
    switch (user?.role) {
      case UserRole.GYM_ADMIN:     return { title: 'Dashboard del Gimnasio',  subtitle: 'Gestión completa de tu gimnasio',      icon: Dumbbell };
      case UserRole.TRAINER:       return { title: 'Dashboard del Entrenador', subtitle: 'Gestiona tus clientes y rutinas',       icon: UserCheck };
      case UserRole.RECEPTIONIST:  return { title: 'Dashboard de Recepción',   subtitle: 'Operaciones diarias del gimnasio',      icon: Activity };
      default:                     return { title: 'Dashboard',                subtitle: 'Bienvenido',                            icon: Activity };
    }
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;
  const isLoading = gymMetricsLoading || trainerMetricsLoading;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(Number(amount));

  return (
    <ProtectedRoute allowedRoles={[UserRole.GYM_ADMIN, UserRole.TRAINER, UserRole.RECEPTIONIST]}>
      <DashboardLayout>
        <div className="py-4 sm:py-6 space-y-6 sm:space-y-8">

          {/* Header */}
          <div className="bg-gradient-to-r from-dark to-gray-800 rounded-2xl p-5 sm:p-8 text-white shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="p-2 sm:p-3 bg-primary rounded-xl shrink-0">
                  <RoleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-dark" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-3xl font-bold truncate">{roleInfo.title}</h2>
                  <p className="text-gray-300 text-sm sm:text-base mt-0.5">{roleInfo.subtitle}</p>
                </div>
              </div>
              <div className="hidden md:block text-right shrink-0">
                <p className="text-gray-400 text-sm">Bienvenido de vuelta</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{user?.firstName}</p>
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {/* Clientes */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
                <CardDescription className="text-gray-600 text-xs sm:text-sm">
                  {user?.role === UserRole.TRAINER ? 'Clientes Asignados' : 'Clientes Activos'}
                </CardDescription>
                <div className="p-2 sm:p-3 bg-primary/10 rounded-xl shrink-0">
                  <Users className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 pt-0">
                <CardTitle className="text-2xl sm:text-4xl font-bold text-dark mb-1 sm:mb-2">
                  {isLoading ? '...' : (user?.role === UserRole.TRAINER ? trainerMetrics?.assignedClients || 0 : gymMetrics?.activeClients || 0)}
                </CardTitle>
                {user?.role !== UserRole.TRAINER ? (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    <span className="text-xs sm:text-sm text-green-600 font-medium">+0%</span>
                    <span className="hidden sm:inline text-xs text-gray-400">desde el mes pasado</span>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500">Tus clientes actuales</p>
                )}
              </CardContent>
            </Card>

            {/* Membresías / Rutinas */}
            {user?.role !== UserRole.TRAINER ? (
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
                  <CardDescription className="text-gray-600 text-xs sm:text-sm">Membresías Activas</CardDescription>
                  <div className="p-2 sm:p-3 bg-blue-50 rounded-xl shrink-0">
                    <CreditCard className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 pt-0">
                  <CardTitle className="text-2xl sm:text-4xl font-bold text-dark mb-1 sm:mb-2">
                    {isLoading ? '...' : gymMetrics?.activeMemberships || 0}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    <span className="text-xs sm:text-sm text-green-600 font-medium">+0%</span>
                    <span className="hidden sm:inline text-xs text-gray-400">desde el mes pasado</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
                  <CardDescription className="text-gray-600 text-xs sm:text-sm">Rutinas Creadas</CardDescription>
                  <div className="p-2 sm:p-3 bg-purple-50 rounded-xl shrink-0">
                    <Dumbbell className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 pt-0">
                  <CardTitle className="text-2xl sm:text-4xl font-bold text-dark mb-1 sm:mb-2">
                    {isLoading ? '...' : trainerMetrics?.routinesCreated || 0}
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-gray-500">Este mes</p>
                </CardContent>
              </Card>
            )}

            {/* Ingresos — GYM_ADMIN only */}
            {user?.role === UserRole.GYM_ADMIN && (
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
                  <CardDescription className="text-gray-600 text-xs sm:text-sm">Ingresos del Mes</CardDescription>
                  <div className="p-2 sm:p-3 bg-green-50 rounded-xl shrink-0">
                    <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 pt-0">
                  <CardTitle className="text-lg sm:text-3xl font-bold text-dark mb-1 sm:mb-2 leading-tight">
                    {isLoading ? '...' : formatCurrency(Number(gymMetrics?.monthlyRevenue || 0))}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    <span className="text-xs sm:text-sm text-green-600 font-medium">+0%</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nuevos Clientes / Progreso */}
            {(user?.role === UserRole.GYM_ADMIN || user?.role === UserRole.RECEPTIONIST) ? (
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-primary to-primary-dark">
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
                  <CardDescription className="text-dark/70 text-xs sm:text-sm">Nuevos Clientes</CardDescription>
                  <div className="p-2 sm:p-3 bg-dark/10 rounded-xl shrink-0">
                    <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-dark" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 pt-0">
                  <CardTitle className="text-2xl sm:text-4xl font-bold text-dark mb-1 sm:mb-2">
                    {isLoading ? '...' : gymMetrics?.newClients || 0}
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-dark/70 font-medium">Este mes</p>
                </CardContent>
              </Card>
            ) : user?.role === UserRole.TRAINER ? (
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-primary to-primary-dark">
                <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
                  <CardDescription className="text-dark/70 text-xs sm:text-sm">Progreso Registrado</CardDescription>
                  <div className="p-2 sm:p-3 bg-dark/10 rounded-xl shrink-0">
                    <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-dark" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 pt-0">
                  <CardTitle className="text-2xl sm:text-4xl font-bold text-dark mb-1 sm:mb-2">0</CardTitle>
                  <p className="text-xs sm:text-sm text-dark/70 font-medium">Esta semana</p>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Activity Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg shrink-0">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-dark text-base sm:text-lg">
                      {user?.role === UserRole.TRAINER ? 'Rutinas Recientes' : 'Actividad Reciente'}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {user?.role === UserRole.TRAINER ? 'Últimas rutinas creadas o modificadas' : 'Últimas acciones en el gimnasio'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6">
                <RecentRoutines limit={5} />
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg shrink-0">
                    {user?.role === UserRole.TRAINER
                      ? <UserCheck className="h-5 w-5 text-orange-600" />
                      : <Clock className="h-5 w-5 text-orange-600" />}
                  </div>
                  <div>
                    <CardTitle className="text-dark text-base sm:text-lg">
                      {user?.role === UserRole.TRAINER ? 'Clientes Asignados' : user?.role === UserRole.RECEPTIONIST ? 'Membresías por Vencer Hoy' : 'Membresías por Vencer'}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {user?.role === UserRole.TRAINER ? 'Tus clientes actuales' : user?.role === UserRole.RECEPTIONIST ? 'Vencimientos de hoy' : 'Próximos vencimientos'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-gray-500">Cargando...</p>
                  </div>
                ) : user?.role === UserRole.TRAINER && trainerMetrics?.assignedClientsList?.length ? (
                  <div className="space-y-2 sm:space-y-3">
                    {trainerMetrics.assignedClientsList.map((client) => (
                      <div key={client.id} className="flex items-center justify-between p-3 bg-bone rounded-lg">
                        <div>
                          <p className="font-semibold text-dark text-sm">{client.firstName} {client.lastName}</p>
                          <p className="text-xs text-gray-500">{client.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : user?.role !== UserRole.TRAINER && gymMetrics?.expiringMemberships?.length ? (
                  <div className="space-y-2 sm:space-y-3">
                    {gymMetrics.expiringMemberships.map((membership) => (
                      <div key={membership.id} className="flex items-center justify-between p-3 bg-bone rounded-lg">
                        <div>
                          <p className="font-semibold text-dark text-sm">{membership.client.firstName} {membership.client.lastName}</p>
                          <p className="text-xs text-gray-500">{membership.client.email}</p>
                        </div>
                        <p className="text-xs text-orange-600 font-medium shrink-0 ml-2">
                          {new Date(membership.endDate).toLocaleDateString('es-CR')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="p-4 bg-green-50 rounded-full mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-500">
                      {user?.role === UserRole.TRAINER ? 'No tienes clientes asignados' : user?.role === UserRole.RECEPTIONIST ? 'No hay membresías por vencer hoy' : 'No hay membresías por vencer'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {user?.role === UserRole.TRAINER ? 'Los clientes asignados aparecerán aquí' : 'Todas las membresías están al día'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Gym summary — GYM_ADMIN only */}
          {user?.role === UserRole.GYM_ADMIN && (
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-dark text-base sm:text-lg">Resumen del Gimnasio</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Estadísticas generales de rendimiento</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                  {[
                    { icon: <TrendingUp className="h-5 w-5 text-green-600" />, bg: 'bg-green-50', label: 'Tasa de Retención', value: '0%' },
                    { icon: <Activity className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50', label: 'Promedio de Asistencia', value: '0%' },
                    { icon: <Dumbbell className="h-5 w-5 text-purple-600" />, bg: 'bg-purple-50', label: 'Equipamiento Activo', value: '0' },
                    { icon: <Users className="h-5 w-5 text-orange-600" />, bg: 'bg-orange-50', label: 'Staff Activo', value: '0' },
                  ].map(({ icon, bg, label, value }) => (
                    <div key={label} className="flex items-center justify-between p-3 sm:p-4 bg-bone rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 ${bg} rounded-lg shrink-0`}>{icon}</div>
                        <span className="text-sm font-medium text-dark">{label}</span>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-dark">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
