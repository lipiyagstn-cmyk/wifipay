import { api, resolveApiResourceUri } from './services/api';
import { getCurrentUser } from './auth/authService';

export type ComplaintStatus = 'Baru' | 'Diproses' | 'Selesai';

export type ComplaintReport = {
  id: string;
  category: string;
  detail: string;
  customer: string;
  customerId: string;
  address: string;
  createdAt: string;
  time: string;
  priority: 'Tinggi' | 'Sedang' | 'Rendah' | null;
  photoUri: string | null;
  status: ComplaintStatus;
};

type NewComplaint = Omit<ComplaintReport, 'id' | 'status'> & {
  photoFileName?: string | null;
  photoMimeType?: string;
};

type BackendComplaint = {
  id?: string | number;
  complaint_id?: string | number;
  pengaduan_id?: string | number;
  issue_id?: string | number;
  gangguan_id?: string | number;
  category?: string;
  kategori?: string;
  jenis?: string;
  jenis_pengaduan?: string;
  jenis_gangguan?: string;
  judul?: string;
  judul_keluhan?: string;
  detail?: string;
  deskripsi?: string;
  description?: string;
  pesan?: string;
  customer?: string | { id?: string | number; name?: string; nama?: string; address?: string; alamat?: string } | null;
  pelanggan?: string | { id?: string | number; name?: string; nama?: string; address?: string; alamat?: string } | null;
  user?: { id?: string | number; user_id?: string | number; name?: string; nama?: string; email?: string } | null;
  pengaduan?: {
    jenis_gangguan?: string;
    judul_keluhan?: string;
    deskripsi?: string;
    foto?: string | null;
  } | null;
  gangguan?: Record<string, unknown> | null;
  keluhan?: string;
  customer_name?: string | null;
  customer_id?: string | number;
  pelanggan_id?: string | number;
  customerId?: string | number;
  address?: string;
  alamat?: string;
  created_at?: string;
  createdAt?: string;
  tanggal?: string;
  tanggal_lapor?: string;
  reported_at?: string;
  time?: string;
  priority?: string;
  photo_uri?: string | null;
  photo_url?: string | null;
  photoUri?: string | null;
  photoUrl?: string | null;
  foto?: string | null;
  foto_url?: string | null;
  status?: string;
};

let reports: ComplaintReport[] = [];
const listeners = new Set<() => void>();

function unwrapData(value: unknown): unknown {
  if (typeof value === 'object' && value !== null && 'data' in value) {
    return value.data;
  }
  return value;
}

function findComplaintList(value: unknown, depth = 0): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (depth >= 4 || typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  for (const key of [
    'complaints',
    'recent_complaints',
    'pengaduan',
    'pengaduan_terbaru',
    'issues',
    'recent_issues',
    'gangguan_terbaru',
    'items',
    'data',
  ]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
    const nested = findComplaintList(record[key], depth + 1);
    if (nested) return nested;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getIdentifier(value: unknown, keys: string[]): string | number | undefined {
  if (!isRecord(value)) return undefined;
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string' || typeof candidate === 'number') return candidate;
  }
  return undefined;
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function normalizeComplaint(value: unknown): ComplaintReport {
  if (!isRecord(value)) {
    throw new Error('Format data keluhan dari backend tidak valid.');
  }
  const complaintData = value as BackendComplaint;
  const nestedCustomer = isRecord(complaintData.customer)
    ? complaintData.customer
    : isRecord(complaintData.pelanggan)
      ? complaintData.pelanggan
      : null;
  const nestedUser = isRecord(complaintData.user) ? complaintData.user : null;
  const nestedIssue = isRecord(complaintData.gangguan) ? complaintData.gangguan : null;
  const nestedComplaint = isRecord(complaintData.pengaduan)
    ? complaintData.pengaduan
    : nestedIssue && isRecord(nestedIssue.pengaduan)
      ? nestedIssue.pengaduan
      : null;
  const nestedIssueCustomer = isRecord(nestedIssue?.pelanggan)
    ? nestedIssue.pelanggan
    : null;
  const id = complaintData.id ?? complaintData.issue_id ?? complaintData.gangguan_id ??
    complaintData.complaint_id ?? complaintData.pengaduan_id;
  const category = complaintData.category ?? complaintData.kategori ??
    complaintData.jenis ?? complaintData.jenis_pengaduan ?? complaintData.jenis_gangguan ??
    nestedComplaint?.jenis_gangguan;
  const description = complaintData.detail ?? complaintData.deskripsi ??
    nestedComplaint?.deskripsi ?? complaintData.description ??
    complaintData.pesan ?? complaintData.keluhan;
  const title = complaintData.judul_keluhan ?? complaintData.judul ??
    nestedComplaint?.judul_keluhan;
  const detail = [title, description].filter(
    (part): part is string => typeof part === 'string' && part.trim().length > 0,
  ).join('\n') || undefined;
  const address = complaintData.address ?? complaintData.alamat ??
    nestedCustomer?.address ?? nestedCustomer?.alamat ?? '';
  const rawStatusValue = complaintData.status ??
    (typeof nestedIssue?.status === 'string' ? nestedIssue.status : undefined);
  const rawStatus = rawStatusValue?.trim().toLowerCase().replace(/[\s-]+/g, '_');
  const status: ComplaintStatus | null =
    rawStatus === 'baru' || rawStatus === 'menunggu' ||
    rawStatus === 'new' || rawStatus === 'open'
      ? 'Baru'
      : rawStatus === 'diproses' || rawStatus === 'in_progress' ||
          rawStatus === 'processing' || rawStatus === 'processed'
        ? 'Diproses'
        : rawStatus === 'selesai' || rawStatus === 'resolved' || rawStatus === 'closed' ||
            rawStatus === 'completed'
          ? 'Selesai'
          : null;
  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    typeof category !== 'string' ||
    typeof detail !== 'string' ||
    status === null
  ) {
    throw new Error('Data pengaduan dari backend harus memiliki ID, jenis gangguan, deskripsi, dan status yang dikenali.');
  }
  const createdAtValue = complaintData.created_at ?? complaintData.createdAt ??
    complaintData.tanggal ?? complaintData.tanggal_lapor ?? complaintData.reported_at ??
    (typeof nestedIssue?.reported_at === 'string' ? nestedIssue.reported_at : '');
  const createdAtDate = new Date(createdAtValue);
  const customerName =
    (typeof complaintData.customer === 'string'
      ? complaintData.customer
      : getString(nestedCustomer?.name) ?? getString(nestedCustomer?.nama)) ??
    (typeof complaintData.pelanggan === 'string'
      ? complaintData.pelanggan
      : getString(nestedCustomer?.name) ?? getString(nestedCustomer?.nama)) ??
    complaintData.customer_name ??
    getString(nestedUser?.name) ?? getString(nestedUser?.nama) ??
    getString(nestedIssueCustomer?.name) ?? getString(nestedIssueCustomer?.nama) ?? '';

  return {
    id: String(id),
    category,
    detail,
    customer: customerName,
    customerId: String(complaintData.customer_id ?? complaintData.pelanggan_id ??
      complaintData.customerId ?? nestedCustomer?.id ??
      getIdentifier(nestedIssueCustomer, ['id', 'customer_id', 'pelanggan_id']) ??
      nestedUser?.id ?? nestedUser?.user_id ?? ''),
    address: typeof address === 'string' ? address : '',
    createdAt: Number.isNaN(createdAtDate.getTime())
      ? createdAtValue
      : createdAtDate.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
    time:
      complaintData.time ??
      (Number.isNaN(createdAtDate.getTime())
        ? ''
        : createdAtDate.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })),
    priority:
      complaintData.priority === 'Tinggi' ||
      complaintData.priority === 'Sedang' ||
      complaintData.priority === 'Rendah'
        ? complaintData.priority
        : null,
    photoUri: resolveApiResourceUri(
      complaintData.photo_url ?? complaintData.photoUrl ?? complaintData.foto_url ??
      complaintData.photo_uri ?? complaintData.photoUri ?? complaintData.foto ??
      getString(nestedComplaint?.foto),
    ),
    status,
  };
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

export function getComplaintReports(): ComplaintReport[] {
  return reports;
}

export function subscribeToComplaintReports(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearComplaintReports(): void {
  reports = [];
  notifyListeners();
}

export async function loadComplaintReports(): Promise<void> {
  const role = getCurrentUser()?.role;
  const path = role === 'admin'
    ? '/admin/issues'
    : role === 'pegawai'
      ? '/employee/issues'
      : '/customer/complaints';
  const response = await api.get<BackendComplaint[] | { data: BackendComplaint[] }>(path);
  const data = findComplaintList(response.data);
  if (!data) {
    throw new Error('Format daftar keluhan dari backend tidak valid.');
  }
  reports = data.map(normalizeComplaint);
  notifyListeners();
}

export async function addComplaintReport(report: NewComplaint): Promise<void> {
  const fields = {
    jenis_gangguan: report.category,
    judul_keluhan: report.category,
    deskripsi: report.detail,
    customer_id: report.customerId,
    address: report.address,
    priority: report.priority,
  };

  if (report.photoUri) {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => formData.append(key, String(value)));
    const appendNativeFile = formData.append as unknown as (
      name: string,
      file: { uri: string; name: string; type: string },
    ) => void;
    appendNativeFile.call(formData, 'foto', {
      uri: report.photoUri,
      name: report.photoFileName || 'foto-keluhan.jpg',
      type: report.photoMimeType || 'image/jpeg',
    });
    await api.post('/customer/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  } else {
    await api.post('/customer/complaints', fields);
  }
  await loadComplaintReports();
}

export async function updateComplaintReportStatus(
  id: string,
  status: ComplaintStatus,
): Promise<void> {
  const role = getCurrentUser()?.role;
  const path = role === 'admin'
    ? `/admin/issues/${encodeURIComponent(id)}/status`
    : role === 'pegawai'
      ? `/employee/issues/${encodeURIComponent(id)}/status`
      : null;
  if (!path) {
    throw new Error('Akun pelanggan tidak memiliki izin untuk mengubah status keluhan.');
  }
  const backendStatus = role === 'admin'
    ? status === 'Baru'
      ? 'Menunggu'
      : status
    : status === 'Baru'
      ? 'menunggu'
      : status.toLowerCase();
  await api.patch(path, { status: backendStatus });
  reports = reports.map((report) => (report.id === id ? { ...report, status } : report));
  notifyListeners();
}