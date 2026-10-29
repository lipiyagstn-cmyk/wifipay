import { useMemo, useSyncExternalStore } from 'react';
import {
  getCustomers,
  subscribeToCustomers,
  type Customer,
} from '../../customerStore';
import {
  CURRENT_CUSTOMER_ID,
  getInvoicePayment,
  subscribeToInvoicePayments,
  type InvoicePayment,
} from '../../paymentStore';

export type AdminInvoice = {
  id: string;
  customerId: string;
  customerName: string;
  packageName: string;
  amount: number;
  dueDate: string;
  status: 'Lunas' | 'Belum Bayar';
  paymentMethod?: string;
  paidAt?: string;
};

const packagePrices: Record<string, number> = {
  '10 Mbps': 125_000,
  '20 Mbps': 150_000,
  '30 Mbps': 200_000,
};

const dueDates: Record<string, string> = {
  'WFP-008241': '5 Okt 2026',
  'WFP-007936': '7 Okt 2026',
  'WFP-006518': '10 Okt 2026',
};

function buildAdminInvoices(customers: Customer[], currentPayment: InvoicePayment | null): AdminInvoice[] {
  return customers.map((customer) => {
    const payment = customer.id === CURRENT_CUSTOMER_ID ? currentPayment : null;

    return {
      id: `INV-${customer.id}`,
      customerId: customer.id,
      customerName: customer.name,
      packageName: customer.package,
      amount: packagePrices[customer.package] ?? 0,
      dueDate: dueDates[customer.id] ?? '5 Okt 2026',
      status: payment ? 'Lunas' : 'Belum Bayar',
      paymentMethod: payment?.method,
      paidAt: payment?.paidAt,
    };
  });
}

export function useAdminInvoices(): AdminInvoice[] {
  const customers = useSyncExternalStore(subscribeToCustomers, getCustomers, getCustomers);
  const currentPayment = useSyncExternalStore(
    subscribeToInvoicePayments,
    () => getInvoicePayment(CURRENT_CUSTOMER_ID),
    () => getInvoicePayment(CURRENT_CUSTOMER_ID),
  );

  return useMemo(
    () => buildAdminInvoices(customers, currentPayment),
    [customers, currentPayment],
  );
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
