import { useSyncExternalStore } from 'react';
import {
  getInvoices,
  subscribeToInvoices,
  type AdminInvoice,
} from '../../paymentStore';

export type { AdminInvoice };

export function useAdminInvoices(): AdminInvoice[] {
  return useSyncExternalStore(subscribeToInvoices, getInvoices, getInvoices);
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
