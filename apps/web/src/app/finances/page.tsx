'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { financesService } from '@/services/finances.service';
import { clientsService } from '@/services/clients.service';
import { membershipsService } from '@/services/memberships.service';
import { UserRole } from '@/types/auth';
import { Payment, Expense } from '@/types/gym';
import {
  TrendingUp, TrendingDown, DollarSign, Plus, Printer, Trash2,
  ArrowUpCircle, ArrowDownCircle, X, User,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PaymentForm } from '@/components/finances/payment-form';
import { ExpenseForm } from '@/components/finances/expense-form';
import { InvoicePrint } from '@/components/finances/invoice-print';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const methodLabels: Record<string, string> = { CREDIT_CARD: 'T. Crédito', DEBIT_CARD: 'T. Débito', SINPE_MOVIL: 'SINPE', CASH: 'Efectivo' };
const expenseCategoryLabels: Record<string, string> = { RENT: 'Alquiler', UTILITIES: 'Servicios', EQUIPMENT: 'Equipamiento', SALARIES: 'Salarios', MAINTENANCE: 'Mantenimiento', MARKETING: 'Marketing', SUPPLIES: 'Suministros', OTHER: 'Otro' };

function getClientName(p: Payment) {
  const first = p.client?.firstName ?? p.membership?.client?.firstName;
  const last = p.client?.lastName ?? p.membership?.client?.lastName;
  if (first) return `${first} ${last ?? ''}`.trim();
  return '—';
}

function getPaymentDescription(p: Payment) {
  if (p.metadata?.description) return p.metadata.description;
  if (p.membership) return 'Membresía';
  return '—';
}

// ─── Payment Detail ───────────────────────────────────────────────────────────
function PaymentDetail({ payment, onClose, onDelete, onPrint }: {
  payment: Payment;
  onClose: () => void;
  onDelete: () => void;
  onPrint: () => void;
}) {
  const fmt = (n: number) => `₡${Number(n).toLocaleString('es-CR')}`;
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{new Date(payment.createdAt).toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        <Badge variant="info">{methodLabels[payment.method]}</Badge>
      </div>
      <div className="text-3xl font-bold text-green-700">{fmt(Number(payment.amount))}</div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-0.5">
          <p className="text-xs text-gray-400 uppercase font-semibold">Cliente</p>
          <p className="text-dark font-medium">{getClientName(payment)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-gray-400 uppercase font-semibold">Descripción</p>
          <p className="text-dark">{getPaymentDescription(payment)}</p>
        </div>
        {payment.sinpeReference && (
          <div className="space-y-0.5 col-span-2">
            <p className="text-xs text-gray-400 uppercase font-semibold">Ref. SINPE</p>
            <p className="text-dark font-mono">{payment.sinpeReference}</p>
          </div>
        )}
        {payment.metadata?.notes && (
          <div className="space-y-0.5 col-span-2">
            <p className="text-xs text-gray-400 uppercase font-semibold">Notas</p>
            <p className="text-dark">{payment.metadata.notes}</p>
          </div>
        )}
      </div>
      <div className="flex justify-between pt-2 border-t border-gray-100">
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          <Trash2 className="h-4 w-4" /> Eliminar
        </button>
        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Printer className="h-4 w-4" /> Imprimir factura
        </button>
      </div>
    </div>
  );
}

// ─── Expense Detail ───────────────────────────────────────────────────────────
function ExpenseDetail({ expense, onClose, onDelete }: {
  expense: Expense;
  onClose: () => void;
  onDelete: () => void;
}) {
  const fmt = (n: number) => `₡${Number(n).toLocaleString('es-CR')}`;
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{new Date(expense.date).toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        <Badge variant="secondary">{expenseCategoryLabels[expense.category]}</Badge>
      </div>
      <div className="text-3xl font-bold text-red-600">{fmt(Number(expense.amount))}</div>
      <div className="grid grid-cols-1 gap-3 text-sm">
        <div className="space-y-0.5">
          <p className="text-xs text-gray-400 uppercase font-semibold">Descripción</p>
          <p className="text-dark font-medium">{expense.description}</p>
        </div>
        {expense.notes && (
          <div className="space-y-0.5">
            <p className="text-xs text-gray-400 uppercase font-semibold">Notas</p>
            <p className="text-dark">{expense.notes}</p>
          </div>
        )}
      </div>
      <div className="flex justify-start pt-2 border-t border-gray-100">
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          <Trash2 className="h-4 w-4" /> Eliminar egreso
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FinancesPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdFilter = searchParams.get('clientId');

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [tab, setTab] = useState<'overview' | 'income' | 'expenses'>('overview');
  const [showPayment, setShowPayment] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [printPayment, setPrintPayment] = useState<Payment | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'payment' | 'expense'; id: string; label: string } | null>(null);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['finances-summary', month, year],
    queryFn: () => financesService.getSummary(month, year),
  });

  // When filtering by client, fetch all their payments (not month-restricted)
  const { data: clientPayments = [], isLoading: clientPaymentsLoading } = useQuery({
    queryKey: ['finances-payments-client', clientIdFilter],
    queryFn: () => financesService.getPayments({ clientId: clientIdFilter! }),
    enabled: !!clientIdFilter,
  });

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: clientsService.getAll });
  const { data: memberships = [] } = useQuery({ queryKey: ['memberships'], queryFn: membershipsService.getAll });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['finances-summary'] });

  const allPayments = summary?.payments ?? [];
  const filteredPayments = clientIdFilter ? clientPayments : allPayments;
  const isPaymentsLoading = clientIdFilter ? clientPaymentsLoading : isLoading;

  const filteredClient = clientIdFilter ? clients.find(c => c.id === clientIdFilter) : null;

  const clearClientFilter = () => {
    router.replace('/finances');
  };

  const deletePayment = useMutation({
    mutationFn: financesService.deletePayment,
    onSuccess: () => { invalidate(); setSelectedPayment(null); setConfirmDelete(null); },
  });

  const deleteExpense = useMutation({
    mutationFn: financesService.deleteExpense,
    onSuccess: () => { invalidate(); setSelectedExpense(null); setConfirmDelete(null); },
  });

  const fmt = (n: number) => `₡${Number(n).toLocaleString('es-CR')}`;

  return (
    <ProtectedRoute allowedRoles={[UserRole.GYM_ADMIN]}>
      <DashboardLayout>
        <div className="py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-xl"><DollarSign className="h-6 w-6 text-green-600" /></div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-dark">Finanzas</h1>
                <p className="text-sm text-gray-500">Administración de ingresos y egresos</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-36 sm:w-44">
                <Select value={String(month)} onChange={e => setMonth(+e.target.value)}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </Select>
              </div>
              <div className="w-24">
                <Select value={String(year)} onChange={e => setYear(+e.target.value)}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </div>
              <Button onClick={() => setShowPayment(true)} size="sm" className="flex items-center gap-1">
                <Plus className="h-4 w-4" /><span className="hidden sm:inline">Ingreso</span>
              </Button>
              <Button onClick={() => setShowExpense(true)} size="sm" variant="outline" className="flex items-center gap-1">
                <Plus className="h-4 w-4" /><span className="hidden sm:inline">Egreso</span>
              </Button>
            </div>
          </div>

          {/* Client filter banner */}
          {clientIdFilter && (
            <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-2xl px-4 py-3">
              <User className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark">
                  Filtrando por cliente{filteredClient ? `: ${filteredClient.firstName} ${filteredClient.lastName}` : ''}
                </p>
                <p className="text-xs text-gray-500">
                  {filteredPayments.length} pago{filteredPayments.length !== 1 ? 's' : ''} en total
                </p>
              </div>
              <button onClick={clearClientFilter}
                className="p-1.5 rounded-lg hover:bg-primary/20 transition-colors shrink-0">
                <X className="h-4 w-4 text-dark" />
              </button>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-white">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl"><ArrowUpCircle className="h-6 w-6 text-green-600" /></div>
                <div><p className="text-sm text-gray-500">Ingresos</p><p className="text-2xl font-bold text-green-700">{fmt(summary?.totalIncome ?? 0)}</p></div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-gradient-to-br from-red-50 to-white">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-xl"><ArrowDownCircle className="h-6 w-6 text-red-500" /></div>
                <div><p className="text-sm text-gray-500">Egresos</p><p className="text-2xl font-bold text-red-600">{fmt(summary?.totalExpenses ?? 0)}</p></div>
              </CardContent>
            </Card>
            <Card className={`border-none shadow-sm bg-gradient-to-br ${(summary?.netProfit ?? 0) >= 0 ? 'from-primary/10 to-white' : 'from-red-50 to-white'}`}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${(summary?.netProfit ?? 0) >= 0 ? 'bg-primary/20' : 'bg-red-100'}`}>
                  {(summary?.netProfit ?? 0) >= 0
                    ? <TrendingUp className="h-6 w-6 text-dark" />
                    : <TrendingDown className="h-6 w-6 text-red-500" />}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Utilidad Neta</p>
                  <p className={`text-2xl font-bold ${(summary?.netProfit ?? 0) >= 0 ? 'text-dark' : 'text-red-600'}`}>
                    {fmt(summary?.netProfit ?? 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-bone rounded-xl p-1 w-fit">
            {(['overview', 'income', 'expenses'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:text-dark'}`}>
                {t === 'overview' ? 'Resumen' : t === 'income' ? 'Ingresos' : 'Egresos'}
              </button>
            ))}
          </div>

          {/* Income Table */}
          {(tab === 'overview' || tab === 'income') && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-dark">
                  {clientIdFilter && filteredClient
                    ? `Todos los pagos — ${filteredClient.firstName} ${filteredClient.lastName}`
                    : `Ingresos — ${MONTHS[month - 1]} ${year}`}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bone">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cliente / Descripción</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Método</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isPaymentsLoading
                      ? <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Cargando...</td></tr>
                      : (filteredPayments).length === 0
                        ? <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                            {clientIdFilter ? 'Sin pagos para este cliente en el período seleccionado' : 'Sin ingresos este mes'}
                          </td></tr>
                        : (filteredPayments).map(p => (
                          <tr key={p.id} onClick={() => setSelectedPayment(p)} className="hover:bg-bone/50 cursor-pointer transition-colors">
                            <td className="px-4 py-3 text-sm hidden sm:table-cell">{new Date(p.createdAt).toLocaleDateString('es-CR')}</td>
                            <td className="px-4 py-3 text-sm">
                              <p className="font-medium text-dark">{getClientName(p)}</p>
                              <p className="text-xs text-gray-400">{getPaymentDescription(p)}</p>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell"><Badge variant="info">{methodLabels[p.method]}</Badge></td>
                            <td className="px-4 py-3 text-sm font-bold text-green-700">{fmt(Number(p.amount))}</td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expenses Table — hidden when filtering by client */}
          {!clientIdFilter && (tab === 'overview' || tab === 'expenses') && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-red-500" />
                <span className="font-semibold text-dark">Egresos — {MONTHS[month - 1]} {year}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bone">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Categoría</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isLoading
                      ? <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Cargando...</td></tr>
                      : (summary?.expenses ?? []).length === 0
                        ? <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Sin egresos este mes</td></tr>
                        : (summary?.expenses ?? []).map(e => (
                          <tr key={e.id} onClick={() => setSelectedExpense(e)} className="hover:bg-bone/50 cursor-pointer transition-colors">
                            <td className="px-4 py-3 text-sm hidden sm:table-cell">{new Date(e.date).toLocaleDateString('es-CR')}</td>
                            <td className="px-4 py-3 text-sm font-medium">{e.description}</td>
                            <td className="px-4 py-3 hidden sm:table-cell"><Badge variant="secondary">{expenseCategoryLabels[e.category]}</Badge></td>
                            <td className="px-4 py-3 text-sm font-bold text-red-600">{fmt(Number(e.amount))}</td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <Modal open={showPayment} onClose={() => setShowPayment(false)} title="Registrar Ingreso" size="md">
          <PaymentForm
            clients={clients}
            memberships={memberships}
            onSuccess={() => { setShowPayment(false); invalidate(); }}
            onCancel={() => setShowPayment(false)}
          />
        </Modal>

        <Modal open={showExpense} onClose={() => setShowExpense(false)} title="Registrar Egreso" size="md">
          <ExpenseForm
            onSuccess={() => { setShowExpense(false); invalidate(); }}
            onCancel={() => setShowExpense(false)}
          />
        </Modal>

        <Modal open={!!selectedPayment} onClose={() => setSelectedPayment(null)} title="Detalle de Ingreso" size="sm">
          {selectedPayment && (
            <PaymentDetail
              payment={selectedPayment}
              onClose={() => setSelectedPayment(null)}
              onDelete={() => setConfirmDelete({ type: 'payment', id: selectedPayment.id, label: `₡${Number(selectedPayment.amount).toLocaleString('es-CR')}` })}
              onPrint={() => { setPrintPayment(selectedPayment); setSelectedPayment(null); }}
            />
          )}
        </Modal>

        <Modal open={!!selectedExpense} onClose={() => setSelectedExpense(null)} title="Detalle de Egreso" size="sm">
          {selectedExpense && (
            <ExpenseDetail
              expense={selectedExpense}
              onClose={() => setSelectedExpense(null)}
              onDelete={() => setConfirmDelete({ type: 'expense', id: selectedExpense.id, label: selectedExpense.description })}
            />
          )}
        </Modal>

        <Modal open={!!printPayment} onClose={() => setPrintPayment(null)} title="Factura" size="md">
          {printPayment && <InvoicePrint payment={printPayment} onClose={() => setPrintPayment(null)} />}
        </Modal>

        <ConfirmDialog
          open={!!confirmDelete}
          title={confirmDelete?.type === 'payment' ? '¿Eliminar ingreso?' : '¿Eliminar egreso?'}
          description={confirmDelete ? `"${confirmDelete.label}" será eliminado permanentemente.` : undefined}
          confirmLabel="Sí, eliminar"
          onConfirm={() => {
            if (!confirmDelete) return;
            if (confirmDelete.type === 'payment') deletePayment.mutate(confirmDelete.id);
            else deleteExpense.mutate(confirmDelete.id);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
