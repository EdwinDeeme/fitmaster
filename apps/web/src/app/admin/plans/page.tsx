'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';
import { Package, Check, Plus, DollarSign } from 'lucide-react';

export default function PlansPage() {
  // Mock data - esto se conectará con el backend después
  const plans = [
    {
      id: '1',
      name: 'Plan Básico',
      price: 50000,
      currency: 'CRC',
      interval: 'monthly',
      features: [
        'Hasta 100 clientes',
        'Hasta 3 usuarios staff',
        'Gestión de membresías',
        'Reportes básicos',
      ],
      active: true,
    },
    {
      id: '2',
      name: 'Plan Profesional',
      price: 100000,
      currency: 'CRC',
      interval: 'monthly',
      features: [
        'Hasta 500 clientes',
        'Hasta 10 usuarios staff',
        'Gestión de membresías',
        'Rutinas con IA',
        'Reportes avanzados',
        'Soporte prioritario',
      ],
      active: true,
    },
    {
      id: '3',
      name: 'Plan Enterprise',
      price: 200000,
      currency: 'CRC',
      interval: 'monthly',
      features: [
        'Clientes ilimitados',
        'Usuarios staff ilimitados',
        'Gestión de membresías',
        'Rutinas con IA',
        'Reportes avanzados',
        'Soporte 24/7',
        'API personalizada',
        'Marca blanca',
      ],
      active: true,
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
    }).format(amount);
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
            <Button className="bg-primary hover:bg-primary-dark text-dark font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Plan
            </Button>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`border-2 ${
                  plan.name === 'Plan Profesional' 
                    ? 'border-primary shadow-xl' 
                    : 'border-gray-200 shadow-lg'
                } hover:shadow-xl transition-all bg-white relative`}
              >
                {plan.name === 'Plan Profesional' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-dark text-xs font-bold px-3 py-1 rounded-full">
                      MÁS POPULAR
                    </span>
                  </div>
                )}
                <CardHeader className="border-b border-gray-100 pb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl ${
                      plan.name === 'Plan Profesional' 
                        ? 'bg-primary/20' 
                        : 'bg-gray-100'
                    }`}>
                      <Package className={`h-6 w-6 ${
                        plan.name === 'Plan Profesional' 
                          ? 'text-primary' 
                          : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-dark">{plan.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {plan.active ? 'Activo' : 'Inactivo'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-dark">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-gray-500">/mes</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <Button 
                      variant="outline" 
                      className="w-full"
                    >
                      Editar Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-gray-600">Gimnasios Activos</CardDescription>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Package className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl font-bold text-dark">0</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Con suscripción activa</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-gray-600">Ingresos Mensuales</CardDescription>
                <div className="p-3 bg-green-50 rounded-xl">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl font-bold text-dark">₡0</CardTitle>
                <p className="text-sm text-gray-500 mt-1">MRR total</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-gray-600">Plan Más Popular</CardDescription>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-2xl font-bold text-dark">Profesional</CardTitle>
                <p className="text-sm text-gray-500 mt-1">0 suscripciones</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
