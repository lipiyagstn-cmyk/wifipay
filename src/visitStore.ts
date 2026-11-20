import { api } from './services/api';

export type VisitStatus =
  | 'Tagihan Dibayar'
  | 'Belum Bayar'
  | 'Terjadwal'
  | 'Dalam Perjalanan'
  | 'Selesai';

export type Visit = {
  id: string;
  time: string;
  title: string;
  customer: string;
  customerCode: string;
  employee: string;
  address: string;
  note: string;
  status: VisitStatus;
};

let visits: Visit[] = [];
const listeners = new Set<() => void>();

function unwrapData(value: unknown): unknown {
  if (typeof value === 'object' && value !== null && 'data' in value) {
    return value.data;
  }
  return value;
}

function normalizeVisit(value: unknown): Visit {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Format data kunjungan dari backend tidak valid.');
  }
  const data = value as Record<string, unknown>;
  const id = data.id;
  const rawCustomer = data.pelanggan ?? data.customer;
  const customerRelation = typeof rawCustomer === 'object' && rawCustomer !== null
    ? rawCustomer as Record<string, unknown>
    : null;
  const rawEmployee = data.pegawai ?? data.employee;
  const employeeRelation = typeof rawEmployee === 'object' && rawEmployee !== null
    ? rawEmployee as Record<string, unknown>
    : null;
  const customer = customerRelation?.nama ?? customerRelation?.name ??
    data.customer_name ?? rawCustomer;
  const customerCode = customerRelation?.kode ?? customerRelation?.code ?? data.customer_code;
  const employee = employeeRelation?.name ?? employeeRelation?.nama ??
    data.employee_name ?? rawEmployee;
  const time = data.waktu_kunjungan ?? data.time ?? data.scheduled_at;
  const rawStatus = data.status;
  const status = typeof rawStatus === 'string'
    ? rawStatus.trim().toLowerCase().replace(/[\s-]+/g, '_')
    : '';
  const title = data.title ?? data.description ?? data.catatan ?? data.note ?? status;
  const address = data.address ?? data.customer_address;
  const note = data.catatan ?? data.note;

  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    typeof time !== 'string' ||
    typeof customer !== 'string' ||
    typeof rawStatus !== 'string' ||
    (customerCode !== undefined && typeof customerCode !== 'string') ||
    (employee !== undefined && typeof employee !== 'string') ||
    (address !== undefined && typeof address !== 'string') ||
    (note !== undefined && typeof note !== 'string')
  ) {
    throw new Error('Format data kunjungan dari backend tidak valid.');
  }

  const normalizedStatus: VisitStatus =
    status === 'tagihan_dibayar' || status === 'paid' || status === 'payment_received'
      ? 'Tagihan Dibayar'
      : status === 'belum_bayar' || status === 'unpaid'
        ? 'Belum Bayar'
        : status === 'dalam_perjalanan' || status === 'in_progress'
          ? 'Dalam Perjalanan'
          : status === 'selesai' || status === 'completed'
            ? 'Selesai'
            : 'Terjadwal';

  return {
    id: String(id),
    time,
    title: typeof title === 'string' ? title : '',
    customer,
    customerCode: typeof customerCode === 'string' ? customerCode : '',
    employee: typeof employee === 'string' ? employee : '',
    address: typeof address === 'string' ? address : '',
    note: typeof note === 'string' ? note : '',
    status: normalizedStatus,
  };
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

export function getVisits(): Visit[] {
  return visits;
}

export function subscribeToVisits(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearVisits(): void {
  visits = [];
  notifyListeners();
}

export async function loadVisits(): Promise<void> {
  const response = await api.get<unknown>('/employee/visits');
  const data = unwrapData(response.data);
  if (!Array.isArray(data)) {
    throw new Error('Format daftar kunjungan dari backend tidak valid.');
  }
  visits = data.map(normalizeVisit);
  notifyListeners();
}
