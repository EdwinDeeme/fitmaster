'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';
import { Package, Check, Plus, DollarSign, Edit, Trash2, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansService, Plan, CreatePlanData } from '@/services/plans.service';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isIntervalDropdownOpen, setIsIntervalDropdownOpen] = useState(false);
  const [isFeaturesDropdownOpen, setIsFeaturesDropdownOpen] = useState(false);
  
  // Características predefinidas
  const availableFeatures = [
    'Gestión de clientes',
    'Gestión de membresías',
    'Gestión de pagos',
    'Reportes básicos',
    'Reportes avanzados',
    'Rutinas con IA',
    'Gestión de equipamiento',
    'Gestión de promociones',
    'Soporte por email',
    'Soporte prioritario',
    'Soporte 24/7',
    'API personalizada',
    'Marca blanca',
    'Múltiples ubicaciones',
    'App móvil',
    'Notificaciones push',
    'Integración con redes sociales',
    'Sistema de referidos',
  ];
  
  const [formData, setFormData] = useState<CreatePlanData>({
    name: '',
    description: '',
    price: 0,
    currency: 'CRC',
    interval: 'MONTHLY',
    features: [],
    limits: {
      maxClients: 100,
      maxStaff: 3,
      maxStorage: 1,
      aiRoutines: false,
      customBranding: false,
      apiAccess: false,
    },
    isActive: true,
    isPopular: false,
    sortOrder: 0,
  });
  const [newFeature, setNewFeature] = useState('');

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: plansService.getAll,
  });

  const { data: stats } = useQuery({
    queryKey: ['plan-stats'],
    queryFn: plansService.getStats,
  });

  const createMutation = useMutation({
    mutationFn: plansService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan-stats'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePlanData> }) =>
      plansService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan-stats'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: plansService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan-stats'] });
    },
  });

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      currency: 'CRC',
      interval: 'MONTHLY',
      features: [],
      limits: {
        maxClients: 100,
        maxStaff: 3,
        maxStorage: 1,
        aiRoutines: false,
        customBranding: false,
        apiAccess: false,
      },
      isActive: true,
      isPopular: false,
      sortOrder: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: Number(plan.price),
      currency: plan.currency,
      interval: plan.interval,
      features: [...plan.features],
      limits: { ...plan.limits },
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    setNewFeature('');
    setIsIntervalDropdownOpen(false);
    setIsFeaturesDropdownOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este plan? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(id);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
    }).format(amount);
  };

  const intervalLabels = {
    MONTHLY: 'Mensual',
    QUARTERLY: 'Trimestral',
    ANNUAL: 'Anual',
  };

  const selectInterval = (interval: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL') => {
    setFormData({ ...formData, interval });
    setIsIntervalDropdownOpen(false);
  };

  const toggleFeature = (feature: string) => {
    if (formData.features.includes(feature)) {
      setFormData({
        ...formData,
        features: formData.features.filter(f => f !== feature),
      });
    } else {
      setFormData({
        ...formData,
        features: [...formData.features, feature],
      });
    }
  };

  const getUnselectedFeatures = () => {
    return availableFeatures.filter(f => !formData.features.includes(f));
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
      <DashboardLayout>
        <div className="py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-dark">Gestión de Planes</h1>
              <p className="text-gray-600 mt-1">Administra los planes de suscripción de la plataforma</p>
            </div>
            <Button 
              onClick={openCreateModal}
              className="bg-primary hover:bg-primary-dark text-dark font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Plan
            </Button>
          </div>

          {/* Plans Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Cargando planes...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans?.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`border-2 ${
                    plan.isPopular 
                      ? 'border-primary shadow-xl' 
                      : 'border-gray-200 shadow-lg'
                  } hover:shadow-xl transition-all bg-white relative flex flex-col h-full`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-dark text-xs font-bold px-3 py-1 rounded-full">
                        MÁS POPULAR
                      </span>
                    </div>
                  )}
                  <CardHeader className="border-b border-gray-100 pb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-xl ${
                        plan.isPopular 
                          ? 'bg-primary/20' 
                          : 'bg-gray-100'
                      }`}>
                        <Package className={`h-6 w-6 ${
                          plan.isPopular 
                            ? 'text-green-700' 
                            : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl text-dark">{plan.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {plan.isActive ? 'Activo' : 'Inactivo'} • {plan._count?.subscriptions || 0} suscripciones
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-dark">
                        {formatCurrency(Number(plan.price))}
                      </span>
                      <span className="text-gray-500">/mes</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 flex-1 flex flex-col">
                    <ul className="space-y-3 mb-6 flex-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <Check className="h-5 w-5 text-green-700" />
                          </div>
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2 mt-auto">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => openEditModal(plan)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(plan.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-lg bg-white">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-5 w-5 text-green-700" />
                  </div>
                  <p className="text-sm text-gray-600 flex-shrink-0">Planes Disponibles</p>
                  <p className="text-2xl font-bold text-dark ml-auto">
                    {stats?.totalPlans || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600 flex-shrink-0">Ingresos Mensuales (MRR)</p>
                  <p className="text-xl font-bold text-dark ml-auto">
                    {formatCurrency(stats?.totalMRR || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600 flex-shrink-0">Plan Más Popular</p>
                  <p className="text-xl font-bold text-dark ml-auto truncate">
                    {stats?.mostPopular?.name || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal Mejorado */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-dark">
                  {editingPlan ? 'Editar Plan' : 'Crear Nuevo Plan'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-bone rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                {/* Información Básica */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-green-700">Información Básica</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nombre del Plan</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Descripción</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="price">Precio (CRC)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="interval">Intervalo</Label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsIntervalDropdownOpen(!isIntervalDropdownOpen)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white cursor-pointer text-left flex items-center justify-between"
                        >
                          <span>{intervalLabels[formData.interval]}</span>
                          <svg 
                            className={`h-4 w-4 text-gray-500 transition-transform ${isIntervalDropdownOpen ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {isIntervalDropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setIsIntervalDropdownOpen(false)}
                            />
                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() => selectInterval('MONTHLY')}
                                className={`w-full px-3 py-2 text-left hover:bg-bone transition-colors ${
                                  formData.interval === 'MONTHLY' ? 'bg-primary/10 text-green-700 font-medium' : 'text-gray-700'
                                }`}
                              >
                                Mensual
                              </button>
                              <button
                                type="button"
                                onClick={() => selectInterval('QUARTERLY')}
                                className={`w-full px-3 py-2 text-left hover:bg-bone transition-colors ${
                                  formData.interval === 'QUARTERLY' ? 'bg-primary/10 text-green-700 font-medium' : 'text-gray-700'
                                }`}
                              >
                                Trimestral
                              </button>
                              <button
                                type="button"
                                onClick={() => selectInterval('ANNUAL')}
                                className={`w-full px-3 py-2 text-left hover:bg-bone transition-colors ${
                                  formData.interval === 'ANNUAL' ? 'bg-primary/10 text-green-700 font-medium' : 'text-gray-700'
                                }`}
                              >
                                Anual
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Características */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-green-700">Características</h3>
                  
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsFeaturesDropdownOpen(!isFeaturesDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white cursor-pointer text-left flex items-center justify-between"
                    >
                      <span className="text-gray-600">
                        {getUnselectedFeatures().length > 0 
                          ? 'Seleccionar características...' 
                          : 'Todas las características seleccionadas'}
                      </span>
                      <svg 
                        className={`h-4 w-4 text-gray-500 transition-transform ${isFeaturesDropdownOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isFeaturesDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsFeaturesDropdownOpen(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                          {getUnselectedFeatures().length > 0 ? (
                            getUnselectedFeatures().map((feature) => (
                              <button
                                key={feature}
                                type="button"
                                onClick={() => toggleFeature(feature)}
                                className="w-full px-3 py-2 text-left hover:bg-bone transition-colors text-gray-700 flex items-center gap-2"
                              >
                                <Plus className="h-4 w-4 text-green-700" />
                                {feature}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-4 text-center text-sm text-gray-500">
                              Todas las características están seleccionadas
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="inline-flex items-center gap-2 px-3 py-2 bg-bone rounded-lg">
                        <Check className="h-4 w-4 text-green-700" />
                        <span className="text-sm">{feature}</span>
                        <button
                          type="button"
                          onClick={() => toggleFeature(feature)}
                          className="p-0.5 hover:bg-gray-200 rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Límites */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-green-700">Límites y Capacidades</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="maxClients">Máx. Clientes</Label>
                      <Input
                        id="maxClients"
                        type="number"
                        value={formData.limits.maxClients}
                        onChange={(e) => setFormData({
                          ...formData,
                          limits: { ...formData.limits, maxClients: Number(e.target.value) }
                        })}
                      />
                      <p className="text-xs text-gray-500 mt-1">-1 = ilimitado</p>
                    </div>

                    <div>
                      <Label htmlFor="maxStaff">Máx. Staff</Label>
                      <Input
                        id="maxStaff"
                        type="number"
                        value={formData.limits.maxStaff}
                        onChange={(e) => setFormData({
                          ...formData,
                          limits: { ...formData.limits, maxStaff: Number(e.target.value) }
                        })}
                      />
                      <p className="text-xs text-gray-500 mt-1">-1 = ilimitado</p>
                    </div>

                    <div>
                      <Label htmlFor="maxStorage">Storage (GB)</Label>
                      <Input
                        id="maxStorage"
                        type="number"
                        value={formData.limits.maxStorage}
                        onChange={(e) => setFormData({
                          ...formData,
                          limits: { ...formData.limits, maxStorage: Number(e.target.value) }
                        })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.limits.aiRoutines}
                          onChange={(e) => setFormData({
                            ...formData,
                            limits: { ...formData.limits, aiRoutines: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </div>
                      <span className="text-xs font-medium whitespace-nowrap">Rutinas IA</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.limits.customBranding}
                          onChange={(e) => setFormData({
                            ...formData,
                            limits: { ...formData.limits, customBranding: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </div>
                      <span className="text-xs font-medium whitespace-nowrap">Marca Custom</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.limits.apiAccess}
                          onChange={(e) => setFormData({
                            ...formData,
                            limits: { ...formData.limits, apiAccess: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </div>
                      <span className="text-xs font-medium whitespace-nowrap">API Access</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </div>
                      <span className="text-xs font-medium whitespace-nowrap">Plan Activo</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.isPopular}
                          onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </div>
                      <span className="text-xs font-medium whitespace-nowrap">Popular</span>
                    </label>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary-dark text-dark"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingPlan ? 'Actualizar Plan' : 'Crear Plan'}
                  </Button>
                </div>
              </form>
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
        `}</style>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
