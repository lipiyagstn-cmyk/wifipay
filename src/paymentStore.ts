import { api, resolveApiResourceUri } from './services/api';
import type { Customer } from './customerStore';
import { getCurrentUser } from './auth/authService';

export type InvoiceStatus = 'Lunas' | 'Belum Bayar';

export type AdminInvoice = {
  id: string;
  paymentId: string | null;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerPhotoUri: string | null;
  packageName: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  verificationStatus: 'Menunggu Verifikasi' | 'Ditolak' | null;
  paymentMethod?: string;
  paidAt?: string;
  receivedBy?: string;
  period: string;
  qrCodeUri: string | null;
  qrCodeValue?: string | null;
};

type BackendInvoice = {
  id?: string | number;
  payment_id?: string | number;
  customer_id?: string | number;
  pelanggan_id?: string | number;
  customer?: string | (Partial<Customer> & { id?: string | number; nama?: string }) | null;
  pelanggan?: string | (Partial<Customer> & { id?: string | number; nama?: string }) | null;
  client?: string | (Partial<Customer> & { id?: string | number; nama?: string }) | null;
  customer_name?: string;
  customer_address?: string;
  customer_photo_uri?: string | null;
  package?: string;
  package_name?: string;
  amount?: number | string;
  jumlah?: number | string;
  total_bayar?: number | string;
  due_date?: string;
  jatuh_tempo?: string | null;
  dueDate?: string;
  status?: string;
  payment_method?: string;
  metode_pembayaran?: string | null;
  paid_at?: string;
  dibayar_at?: string | null;
  tanggal_bayar?: string | null;
  diterima_oleh?: string | null;
  period?: string;
  periode?: string;
  qr_code_url?: string | null;
  qr_code?: string | null;
  qr_code_data?: string | null;
  qr_code_value?: string | null;
  payment_qr?: string | null;
  payment_qr_data?: string | null;
  payment_qr_code?: string | null;
  qrCodeUri?: string | null;
  payment?: {
    id?: string | number;
    payment_id?: string | number;
    status?: string;
    diterima_oleh?: string | null;
    qr_code_url?: string | null;
    qr_code?: string | null;
    qr_code_data?: string | null;
    qr_code_value?: string | null;
  } | null;
};

let invoices: AdminInvoice[] = [];
const listeners = new Set<() => void>();

function findInvoiceList(value: unknown, depth = 0): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (depth >= 4 || typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  for (const key of [
    'payments',
    'bills',
    'tagihan',
    'invoices',
    'recent_unpaid_bills',
    'items',
    'data',
  ]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
    const nested = findInvoiceList(record[key], depth + 1);
    if (nested) return nested;
  }
  return null;
}

function getRelation(value: unknown, keys: string[]): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const relation = record[key];
    if (typeof relation === 'object' && relation !== null && !Array.isArray(relation)) {
      return relation as Record<string, unknown>;
    }
  }
  return null;
}

function getRelationString(value: unknown, keys: string[]): string | undefined {
  if (typeof value === 'string') return value;
  const record = getRelation({ relation: value }, ['relation']);
  if (!record) return undefined;
  for (const key of keys) {
    if (typeof record[key] === 'string') return record[key] as string;
  }
  return undefined;
}

function normalizeInvoice(value: unknown): AdminInvoice {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Format data tagihan dari backend tidak valid.');
  }
  const invoice = value as BackendInvoice;
  const customerRelation = getRelation(invoice, ['customer', 'pelanggan', 'client']);
  const rawCustomer = invoice.customer ?? invoice.pelanggan ?? invoice.client;
  const relatedName = customerRelation?.name ?? customerRelation?.nama;
  const customerName = typeof rawCustomer === 'string'
    ? rawCustomer
    : typeof relatedName === 'string'
      ? relatedName
      : invoice.customer_name ?? getCurrentUser()?.name;
  const id = invoice.id ?? invoice.payment_id;
  const paymentId = invoice.payment_id ?? invoice.payment?.payment_id ??
    invoice.payment?.id ?? id;
  const customerId = invoice.customer_id ?? invoice.pelanggan_id ??
    customerRelation?.id ?? customerRelation?.customer_id ?? customerRelation?.pelanggan_id ??
    (getCurrentUser()?.role === 'pelanggan'
      ? getCurrentUser()?.customerId ?? getCurrentUser()?.id
      : undefined);
  const rawAmount = invoice.amount ?? invoice.jumlah ?? invoice.total_bayar;
  const amount = typeof rawAmount === 'string' ? Number(rawAmount) : rawAmount;
  const dueValue = invoice.due_date ?? invoice.jatuh_tempo ?? invoice.dueDate;
  const dueDate = typeof dueValue === 'string' ? dueValue : '';
  const status = (invoice.payment?.status ?? invoice.status)?.trim().toLowerCase().replace(/[\s-]+/g, '_');
  const rawPackage = invoice.package_name ?? invoice.package ??
    customerRelation?.package ?? customerRelation?.paket;
  const packageName = getRelationString(rawPackage, ['name', 'nama', 'package_name']);
  const paymentQr = invoice.payment;
  const qrImageUri = invoice.qr_code_url ?? invoice.qrCodeUri ??
    paymentQr?.qr_code_url ?? null;
  const qrCodeValue = invoice.qr_code ?? invoice.qr_code_data ?? invoice.qr_code_value ??
    invoice.payment_qr ?? invoice.payment_qr_data ?? invoice.payment_qr_code ??
    paymentQr?.qr_code ?? paymentQr?.qr_code_data ?? paymentQr?.qr_code_value ?? null;
  const qrImageData = typeof qrCodeValue === 'string' && qrCodeValue.startsWith('data:image/')
    ? qrCodeValue
    : null;

  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    (typeof customerId !== 'string' && typeof customerId !== 'number') ||
    !customerName ||
    (packageName !== undefined && typeof packageName !== 'string') ||
    amount === undefined ||
    !Number.isFinite(amount) ||
    typeof dueDate !== 'string' ||
    (status !== 'lunas' && status !== 'paid' && status !== 'belum_bayar' &&
    status !== 'belum_dibayar' && status !== 'unpaid' && status !== 'pending' &&
    status !== 'menunggu_penagihan' && status !== 'menunggu_verifikasi' &&
    status !== 'pending_verification' && status !== 'ditolak' && status !== 'rejected')
  ) {
    throw new Error('Format data tagihan dari backend tidak valid.');
  }

  return {
    id: String(id),
    paymentId: paymentId == null ? null : String(paymentId),
    customerId: String(customerId),
    customerName,
    customerAddress: typeof customerRelation?.address === 'string'
      ? customerRelation.address
      : typeof customerRelation?.alamat === 'string'
        ? customerRelation.alamat
        : invoice.customer_address ?? '',
    customerPhotoUri: typeof customerRelation?.homePhotoUri === 'string'
      ? customerRelation.homePhotoUri
      : typeof customerRelation?.foto_rumah === 'string'
        ? customerRelation.foto_rumah
        : invoice.customer_photo_uri ?? null,
    packageName: typeof packageName === 'string' ? packageName : '',
    amount,
    dueDate,
    status: status === 'lunas' || status === 'paid' ? 'Lunas' : 'Belum Bayar',
    verificationStatus: status === 'menunggu_verifikasi' || status === 'pending_verification'
      ? 'Menunggu Verifikasi'
      : status === 'ditolak' || status === 'rejected'
        ? 'Ditolak'
        : null,
    paymentMethod: invoice.payment_method ?? invoice.metode_pembayaran ?? undefined,
    paidAt: invoice.paid_at ?? invoice.dibayar_at ?? invoice.tanggal_bayar ?? undefined,
    receivedBy: invoice.diterima_oleh ?? invoice.payment?.diterima_oleh ?? undefined,
    period: invoice.period ?? invoice.periode ?? '',
    qrCodeUri: resolveApiResourceUri(qrImageUri ?? qrImageData),
    qrCodeValue: qrCodeValue && !qrCodeValue.startsWith('data:image/')
      ? qrCodeValue
      : null,
  };
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

export function getInvoices(): AdminInvoice[] {
  return invoices;
}

export function getCustomerInvoices(customerId: string | null): AdminInvoice[] {
  if (getCurrentUser()?.role === 'pelanggan') {
    return invoices;
  }
  return customerId ? invoices.filter((invoice) => invoice.customerId === customerId) : [];
}

export function getCurrentInvoice(customerId: string | null): AdminInvoice | null {
  return getCustomerInvoices(customerId)[0] ?? null;
}

export function subscribeToInvoices(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearInvoices(): void {
  invoices = [];
  notifyListeners();
}

export async function loadInvoices(): Promise<void> {
  const role = getCurrentUser()?.role;
  const path = role === 'admin'
    ? '/admin/payments'
    : role === 'pegawai'
      ? '/employee/payments'
      : role === 'pelanggan'
        ? '/customer/bills'
        : '/invoices';
  const response = await api.get<unknown>(path);
  const data = findInvoiceList(response.data);
  if (!data) {
    throw new Error('Format daftar tagihan dari backend tidak valid.');
  }
  invoices = data.map(normalizeInvoice);
  notifyListeners();
}

export async function verifyPayment(paymentId: string): Promise<void> {
  const invoice = invoices.find((item) => item.paymentId === paymentId);
  if (!invoice || invoice.verificationStatus !== 'Menunggu Verifikasi') {
    throw new Error('Pembayaran belum dikirim pelanggan atau tidak sedang menunggu verifikasi.');
  }
  const role = getCurrentUser()?.role;
  if (role === 'pegawai') {
    throw new Error('Akun pegawai tidak memiliki izin untuk memverifikasi pembayaran.');
  }
  if (role !== 'admin') {
    throw new Error('Verifikasi pembayaran hanya tersedia untuk akun admin.');
  }
  await api.post(`/admin/payments/${encodeURIComponent(paymentId)}/verify`, {
    aksi: 'setujui',
  });
}

export async function confirmCashPayment(invoiceId: string): Promise<void> {
  const invoice = invoices.find((item) => item.id === invoiceId);
  if (!invoice || invoice.status === 'Lunas') {
    throw new Error('Tagihan belum tersedia atau sudah lunas.');
  }
  const role = getCurrentUser()?.role;
  if (role === 'pegawai') {
    await api.post(`/employee/payments/${encodeURIComponent(invoice.id)}/cash-confirm`, {
      nominal_diterima: invoice.amount,
      catatan: 'Diterima tunai',
    });
    await loadInvoices();
    return;
  }
  if (role === 'admin') {
    if (!invoice.paymentId) {
      throw new Error('Belum ada data pembayaran yang dapat diverifikasi.');
    }
    await verifyPayment(invoice.paymentId);
    await loadInvoices();
    return;
  }
  if (role !== 'pelanggan') {
    throw new Error('Akun belum terautentikasi untuk mengonfirmasi pembayaran.');
  }
  await api.post(`/customer/bills/${encodeURIComponent(invoice.id)}/payment`, { method: 'cash' });
  await loadInvoices();
}
