'use client';

import { Button } from '@/components/ui/button';
import { Payment } from '@/types/gym';
import { Printer } from 'lucide-react';

const methodLabels: Record<string, string> = { CREDIT_CARD: 'Tarjeta de Crédito', DEBIT_CARD: 'Tarjeta de Débito', SINPE_MOVIL: 'SINPE Móvil', CASH: 'Efectivo' };
const typeLabels: Record<string, string> = { MONTHLY: 'Mensual', QUARTERLY: 'Trimestral', ANNUAL: 'Anual' };

interface Props { payment: Payment; onClose: () => void; }

export function InvoicePrint({ payment, onClose }: Props) {
  const handlePrint = () => window.print();
  const client = payment.membership?.client;
  const fmt = (n: number) => `₡${Number(n).toLocaleString('es-CR')}`;

  return (
    <div className="p-6">
      <div id="invoice-content" className="space-y-4">
        {/* Header */}
        <div className="text-center border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-dark">FitMaster</h2>
          <p className="text-sm text-gray-500">Recibo de Pago</p>
          <p className="text-xs text-gray-400 mt-1">#{payment.id.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Client Info */}
        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase font-semibold">Cliente</p>
          <p className="font-medium text-dark">{client?.firstName} {client?.lastName}</p>
          <p className="text-sm text-gray-500">{client?.email}</p>
        </div>

        {/* Payment Details */}
        <div className="bg-bone rounded-xl p-4 space-y-2">
          {[
            { label: 'Fecha', value: new Date(payment.createdAt).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' }) },
            { label: 'Membresía', value: payment.membership?.type ? typeLabels[payment.membership.type] : '—' },
            { label: 'Método de Pago', value: methodLabels[payment.method] },
            ...(payment.sinpeReference ? [{ label: 'Ref. SINPE', value: payment.sinpeReference }] : []),
            { label: 'Estado', value: 'Completado' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
          <span className="text-lg font-semibold text-dark">Total</span>
          <span className="text-2xl font-bold text-dark">{fmt(Number(payment.amount))}</span>
        </div>

        <p className="text-xs text-center text-gray-400 pt-2">Gracias por su pago. Este recibo es válido como comprobante.</p>
      </div>

      <div className="flex justify-end gap-3 mt-6 print:hidden">
        <Button variant="outline" onClick={onClose}>Cerrar</Button>
        <Button onClick={handlePrint} className="flex items-center gap-2"><Printer className="h-4 w-4" />Imprimir</Button>
      </div>
    </div>
  );
}
