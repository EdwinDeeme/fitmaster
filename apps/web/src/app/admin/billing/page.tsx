'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';
import { DollarSign, Download, Filter, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function BillingPage() {
  // Mock data - esto se conectará con el backend después
  const invoices = [
    {
      id: '1',
      gymName: 'Test Gym',
      amount: 100000,
      status: 'paid',
      date: '2024-03-01',
      plan: 'Plan Profesional',
    },
    {
      id: '2',
      gymName: 'Test Gym',
      amount: 100000,
      status: 'paid',
      date: '2024-02-01',
      plan: 'Plan Profesional',
    },
  ];

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

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      overdue: 'bg-red-50 text-red-700 border-red-200',
    };

    const labels = {
      paid: 'Pagado',
      pending: 'Pendiente',
      overdue: 'Vencido',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
      <DashboardLayout>
        <div className="py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-dark">Facturación</h1>
              <p className="text-gray-600 mt-1">Gestiona los pagos y facturas de todos los gimnasios</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button className="bg-primary hover:bg-primary-dark text-dark font-semibold">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-gray-600">Ingresos del Mes</CardDescription>
                <div className="p-3 bg-green-50 rounded-xl">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl font-bold text-dark">₡0</CardTitle>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">+0%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-gray-600">Facturas Pagadas</CardDescription>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <CheckCircle2 className="h-5 w-5 text-green-700" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl font-bold text-dark">0</CardTitle>
                <p className="text-sm text-gray-500 mt-2">Este mes</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-gray-600">Facturas Pendientes</CardDescription>
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl font-bold text-dark">0</CardTitle>
                <p className="text-sm text-gray-500 mt-2">Por cobrar</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-gray-600">Facturas Vencidas</CardDescription>
                <div className="p-3 bg-red-50 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl font-bold text-dark">0</CardTitle>
                <p className="text-sm text-gray-500 mt-2">Requieren atención</p>
              </CardContent>
            </Card>
          </div>

          {/* Invoices Table */}
          <Card className="border-none shadow-lg bg-white">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-dark">Facturas Recientes</CardTitle>
              <CardDescription>Historial de pagos de todos los gimnasios</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Gimnasio</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Plan</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Monto</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Fecha</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Estado</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-gray-100 hover:bg-bone transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-medium text-dark">{invoice.gymName}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">{invoice.plan}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-dark">{formatCurrency(invoice.amount)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">
                            {formatDate(invoice.date)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
