'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';
import { Building2, Users, CreditCard, Plus, Search, MoreVertical } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { gymsService } from '@/services/gyms.service';
import { useState } from 'react';

export default function GymsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: gyms, isLoading } = useQuery({
    queryKey: ['gyms'],
    queryFn: gymsService.getAll,
  });

  const filteredGyms = gyms?.filter((gym) =>
    gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gym.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
      <DashboardLayout>
        <div className="py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-dark">Gestión de Gimnasios</h1>
              <p className="text-gray-600 mt-1">Administra todos los gimnasios de la plataforma</p>
            </div>
            <Button className="bg-primary hover:bg-primary-dark text-dark font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Gimnasio
            </Button>
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
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-dark">{gym.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {gym.subdomain}.fitmaster.com
                          </CardDescription>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-bone rounded-lg transition-colors">
                        <MoreVertical className="h-5 w-5 text-gray-400" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Usuarios</span>
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
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                          Creado: {new Date(gym.createdAt).toLocaleDateString('es-CR')}
                        </p>
                      </div>
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
                    {searchTerm ? 'Intenta con otro término de búsqueda' : 'Crea el primer gimnasio para comenzar'}
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
