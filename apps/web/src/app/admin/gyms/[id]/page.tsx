'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';
import { 
  Building2, Users, CreditCard, ArrowLeft, Edit, Ban, CheckCircle, 
  Clock, Package, DollarSign, Calendar, Mail, Shield, X 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gymsService, AssignPlanData } from '@/services/gyms.service';
import { plansService } from '@/services/plans.service';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function GymDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const gymId = params.id as string;
  const queryClient = useQueryClient();

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'TRIAL'>('ACTIVE');
  const [planData, setPlanData] = useState<AssignPlanData>({
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    trialEndDate: '',
  });
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null);

  const { data: gym, isLoading } = useQuery({
    queryKey: ['gym', gymId],
    queryFn: () => gymsService.getOne(gymId),
  });

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: plansService.getAll,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => gymsService.update(gymId, { status: status as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', gymId] });
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setIsStatusModalOpen(false);
    },
  });

  const assignPlanMutation = useMutation({
    mutationFn: (data: AssignPlanData) => gymsService.assignPlan(gymId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', gymId] });
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setIsPlanModalOpen(false);
    },
  });

  const handleStatusChange = () => {
    updateStatusMutation.mutate(newStatus);
  };

  const handlePlanAssignment = () => {
    const data: AssignPlanData = {
      planId: planData.planId,
      startDate: startDate.toISOString().split('T')[0],
      trialEndDate: trialEndDate ? trialEndDate.toISOString().split('T')[0] : '',
    };
    assignPlanMutation.mutate(data);
  };

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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: 'Activo',
      TRIAL: 'Prueba',
      SUSPENDED: 'Suspendido',
      INACTIVE: 'Inactivo',
    };
    return labels[status] || status;
  };

  const getSubscriptionStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: 'Activo',
      TRIAL: 'Prueba',
      TRIALING: 'Prueba',
      PAST_DUE: 'Vencido',
      CANCELED: 'Cancelado',
      UNPAID: 'Sin Pagar',
    };
    return labels[status] || status;
  };

  const getInvoiceStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PAID: 'Pagado',
      PENDING: 'Pendiente',
      OVERDUE: 'Vencido',
      CANCELED: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getIntervalLabel = (interval: string) => {
    const labels: Record<string, string> = {
      MONTHLY: 'mes',
      QUARTERLY: 'trimestre',
      ANNUAL: 'año',
    };
    return labels[interval] || 'mes';
  };

  const getAvailablePlans = () => {
    if (!plans) return [];
    
    // Si no hay suscripción actual, mostrar todos los planes
    if (!gym.subscription) return plans;
    
    const currentPlan = gym.subscription.plan;
    const currentLimits = currentPlan.limits as any;
    
    // Filtrar planes que tengan límites mayores o iguales
    return plans.filter(plan => {
      const planLimits = plan.limits as any;
      
      // Comparar límites principales
      const hasEnoughClients = planLimits.maxClients === -1 || 
                               currentLimits.maxClients === -1 || 
                               planLimits.maxClients >= currentLimits.maxClients;
      
      const hasEnoughStaff = planLimits.maxStaff === -1 || 
                            currentLimits.maxStaff === -1 || 
                            planLimits.maxStaff >= currentLimits.maxStaff;
      
      const hasEnoughStorage = planLimits.maxStorage >= currentLimits.maxStorage;
      
      return hasEnoughClients && hasEnoughStaff && hasEnoughStorage;
    });
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      GYM_ADMIN: 'bg-purple-50 text-purple-700',
      TRAINER: 'bg-blue-50 text-blue-700',
      RECEPTIONIST: 'bg-green-50 text-green-700',
    };

    const labels = {
      GYM_ADMIN: 'Administrador',
      TRAINER: 'Entrenador',
      RECEPTIONIST: 'Recepcionista',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[role as keyof typeof styles]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">Cargando detalles del gimnasio...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!gym) {
    return (
      <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500">Gimnasio no encontrado</p>
            <Button onClick={() => router.push('/admin/gyms')} className="mt-4">
              Volver a Gimnasios
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
      <DashboardLayout>
        <div className="py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/gyms')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-dark">{gym.name}</h1>
                <p className="text-gray-600 mt-1">{gym.subdomain}.fitmaster.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(gym.status)}
              <Button
                variant="outline"
                onClick={() => {
                  setNewStatus(gym.status);
                  setIsStatusModalOpen(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Cambiar Estado
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-gray-600">Usuarios Staff</CardDescription>
                <Users className="h-5 w-5 text-green-700" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl font-bold text-dark">{gym._count.users}</CardTitle>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-gray-600">Clientes</CardDescription>
                <Users className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl font-bold text-dark">{gym._count.clients}</CardTitle>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-gray-600">Membresías</CardDescription>
                <CreditCard className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl font-bold text-dark">{gym._count.memberships}</CardTitle>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-gray-600">Rutinas</CardDescription>
                <Package className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl font-bold text-dark">{gym._count.routines}</CardTitle>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Info */}
          <Card className="border-none shadow-lg bg-white">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-dark">Suscripción</CardTitle>
                  <CardDescription>Información del plan actual</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    if (gym.subscription) {
                      setPlanData({
                        planId: gym.subscription.plan.id,
                        startDate: new Date(gym.subscription.startDate).toISOString().split('T')[0],
                        trialEndDate: gym.subscription.trialEndDate || '',
                      });
                      setStartDate(new Date(gym.subscription.startDate));
                      setTrialEndDate(gym.subscription.trialEndDate ? new Date(gym.subscription.trialEndDate) : null);
                    } else {
                      setPlanData({
                        planId: '',
                        startDate: new Date().toISOString().split('T')[0],
                        trialEndDate: '',
                      });
                      setStartDate(new Date());
                      setTrialEndDate(null);
                    }
                    setIsPlanModalOpen(true);
                  }}
                >
                  <Package className="h-4 w-4 mr-2" />
                  {gym.subscription ? 'Cambiar Plan' : 'Asignar Plan'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {gym.subscription ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Plan Actual</p>
                    <p className="text-lg font-semibold text-dark">{gym.subscription.plan.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Precio</p>
                    <p className="text-lg font-semibold text-green-700">
                      {formatCurrency(Number(gym.subscription.plan.price))}/{getIntervalLabel(gym.subscription.plan.interval)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Estado</p>
                    <p className="text-lg font-semibold text-dark">{getSubscriptionStatusLabel(gym.subscription.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Inicio</p>
                    <p className="text-sm text-dark">
                      {formatDate(gym.subscription.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Próximo Pago</p>
                    <p className="text-sm text-dark">
                      {formatDate(gym.subscription.currentPeriodEnd)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No hay plan asignado</p>
                  <p className="text-sm text-gray-400 mt-1">Asigna un plan para activar el gimnasio</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Users List */}
          <Card className="border-none shadow-lg bg-white">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-dark">Usuarios del Gimnasio</CardTitle>
              <CardDescription>Staff con acceso al sistema</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {gym.users && gym.users.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {gym.users.map((user) => (
                    <div key={user.id} className="flex flex-col p-4 bg-bone rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Shield className="h-4 w-4 text-green-700" />
                          </div>
                          {getRoleBadge(user.role)}
                        </div>
                        <p className="text-xs text-gray-400">
                          {formatShortDate(user.createdAt)}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-dark text-sm mb-1">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No hay usuarios registrados</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          {gym.subscription && gym.subscription.invoices && gym.subscription.invoices.length > 0 && (
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-dark">Facturas Recientes</CardTitle>
                <CardDescription>Últimas 5 facturas</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {gym.subscription.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-bone rounded-lg">
                      <div>
                        <p className="font-semibold text-dark">
                          {formatCurrency(Number(invoice.amount))}
                        </p>
                        <p className="text-sm text-gray-500">
                          Vence: {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'PAID' 
                            ? 'bg-green-50 text-green-700' 
                            : invoice.status === 'PENDING'
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {getInvoiceStatusLabel(invoice.status)}
                        </span>
                        {invoice.paidAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(invoice.paidAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Status Modal */}
        {isStatusModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-dark">Cambiar Estado</h2>
                <button
                  onClick={() => setIsStatusModalOpen(false)}
                  className="p-2 hover:bg-bone rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <Label>Estado Actual: {getStatusLabel(gym.status)}</Label>
                  <div className="relative mt-2">
                    <button
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white cursor-pointer text-left flex items-center justify-between"
                    >
                      <span>
                        {newStatus === 'ACTIVE' && 'Activo'}
                        {newStatus === 'TRIAL' && 'Prueba'}
                        {newStatus === 'SUSPENDED' && 'Suspendido'}
                        {newStatus === 'INACTIVE' && 'Inactivo'}
                      </span>
                      <svg 
                        className={`h-4 w-4 text-gray-500 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isStatusDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsStatusDropdownOpen(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              setNewStatus('ACTIVE');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-bone transition-colors ${
                              newStatus === 'ACTIVE' ? 'bg-primary/10 text-green-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            Activo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewStatus('TRIAL');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-bone transition-colors ${
                              newStatus === 'TRIAL' ? 'bg-primary/10 text-green-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            Prueba
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewStatus('SUSPENDED');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-bone transition-colors ${
                              newStatus === 'SUSPENDED' ? 'bg-primary/10 text-green-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            Suspendido
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewStatus('INACTIVE');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-bone transition-colors ${
                              newStatus === 'INACTIVE' ? 'bg-primary/10 text-green-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            Inactivo
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsStatusModalOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleStatusChange}
                    className="flex-1 bg-primary hover:bg-primary-dark text-dark"
                    disabled={updateStatusMutation.isPending}
                  >
                    Actualizar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plan Assignment Modal */}
        {isPlanModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-dark">
                  {gym.subscription ? 'Cambiar Plan' : 'Asignar Plan'}
                </h2>
                <button
                  onClick={() => setIsPlanModalOpen(false)}
                  className="p-2 hover:bg-bone rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                {gym.subscription && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                    <p className="text-sm text-blue-800">
                      Solo puedes cambiar a planes con límites iguales o superiores al plan actual.
                    </p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="planId">Plan</Label>
                  <div className="relative mt-2">
                    <button
                      type="button"
                      onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white cursor-pointer text-left flex items-center justify-between"
                    >
                      <span className={planData.planId ? 'text-gray-900' : 'text-gray-500'}>
                        {planData.planId 
                          ? `${plans?.find(p => p.id === planData.planId)?.name} - ${formatCurrency(Number(plans?.find(p => p.id === planData.planId)?.price))}/mes`
                          : 'Seleccionar plan...'}
                      </span>
                      <svg 
                        className={`h-4 w-4 text-gray-500 transition-transform ${isPlanDropdownOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isPlanDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsPlanDropdownOpen(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                          {getAvailablePlans().length > 0 ? (
                            getAvailablePlans().map((plan) => (
                              <button
                                key={plan.id}
                                type="button"
                                onClick={() => {
                                  setPlanData({ ...planData, planId: plan.id });
                                  setIsPlanDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left hover:bg-bone transition-colors ${
                                  planData.planId === plan.id ? 'bg-primary/10 text-green-700 font-medium' : 'text-gray-700'
                                }`}
                              >
                                {plan.name} - {formatCurrency(Number(plan.price))}/{getIntervalLabel(plan.interval)}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-4 text-center text-sm text-gray-500">
                              No hay planes disponibles con límites mayores
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <div className="relative mt-2">
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => date && setStartDate(date)}
                      dateFormat="dd/MM/yyyy"
                      className="w-full px-3 py-2 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      calendarClassName="custom-datepicker"
                    />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="trialEndDate">Fin de Prueba (Opcional)</Label>
                  <div className="relative mt-2">
                    <DatePicker
                      selected={trialEndDate}
                      onChange={(date) => setTrialEndDate(date)}
                      dateFormat="dd/MM/yyyy"
                      isClearable
                      placeholderText="Seleccionar fecha..."
                      className="w-full px-3 py-2 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      calendarClassName="custom-datepicker"
                    />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsPlanModalOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handlePlanAssignment}
                    className="flex-1 bg-primary hover:bg-primary-dark text-dark"
                    disabled={assignPlanMutation.isPending || !planData.planId}
                  >
                    {gym.subscription ? 'Cambiar' : 'Asignar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #555;
          }

          /* Custom DatePicker Styles */
          .react-datepicker {
            font-family: inherit;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }
          
          .react-datepicker__header {
            background-color: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
            border-radius: 12px 12px 0 0;
            padding-top: 12px;
          }
          
          .react-datepicker__current-month {
            font-weight: 600;
            color: #111827;
            font-size: 0.95rem;
            margin-bottom: 8px;
          }
          
          .react-datepicker__day-name {
            color: #6b7280;
            font-weight: 500;
            font-size: 0.85rem;
            width: 2.2rem;
            line-height: 2.2rem;
          }
          
          .react-datepicker__day {
            width: 2.2rem;
            line-height: 2.2rem;
            font-size: 0.9rem;
            color: #374151;
            border-radius: 8px;
            transition: all 0.2s;
          }
          
          .react-datepicker__day:hover {
            background-color: #f3f4f6;
            color: #111827;
          }
          
          .react-datepicker__day--selected,
          .react-datepicker__day--keyboard-selected {
            background-color: #C1FF72 !important;
            color: #1a1a1a !important;
            font-weight: 600;
          }
          
          .react-datepicker__day--selected:hover {
            background-color: #b3f05e !important;
          }
          
          .react-datepicker__day--today {
            font-weight: 600;
            color: #15803d;
            background-color: #f0fdf4;
          }
          
          .react-datepicker__day--disabled {
            color: #d1d5db;
            cursor: not-allowed;
          }
          
          .react-datepicker__day--disabled:hover {
            background-color: transparent;
          }
          
          .react-datepicker__navigation {
            top: 14px;
          }
          
          .react-datepicker__navigation-icon::before {
            border-color: #6b7280;
            border-width: 2px 2px 0 0;
            height: 7px;
            width: 7px;
          }
          
          .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
            border-color: #111827;
          }
          
          .react-datepicker__month {
            margin: 0.8rem;
          }
          
          .react-datepicker__day--outside-month {
            color: #d1d5db;
          }
          
          .react-datepicker__close-icon::after {
            background-color: #6b7280;
            font-size: 18px;
            padding: 0;
            width: 18px;
            height: 18px;
            line-height: 18px;
          }
          
          .react-datepicker__close-icon::after:hover {
            background-color: #374151;
          }
        `}</style>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
