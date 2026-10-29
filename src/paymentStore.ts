export const CURRENT_CUSTOMER_ID = 'WFP-008241';

export type InvoicePayment = {
  status: 'Lunas';
  method: 'Tunai ke pegawai';
  paidAt: string;
};

const invoicePayments = new Map<string, InvoicePayment>();
const listeners = new Set<() => void>();

export function getInvoicePayment(customerId: string): InvoicePayment | null {
  return invoicePayments.get(customerId) ?? null;
}

export function subscribeToInvoicePayments(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function confirmCashPayment(customerId: string): void {
  invoicePayments.set(customerId, {
    status: 'Lunas',
    method: 'Tunai ke pegawai',
    paidAt: new Date().toISOString(),
  });
  listeners.forEach((listener) => listener());
}

export function deleteInvoicePayment(customerId: string): void {
  if (!invoicePayments.delete(customerId)) return;
  listeners.forEach((listener) => listener());
}