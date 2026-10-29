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
  priority: 'Sedang';
  photoUri: string | null;
  status: ComplaintStatus;
};

type NewComplaint = Omit<ComplaintReport, 'id' | 'status'>;

let reports: ComplaintReport[] = [];
const listeners = new Set<() => void>();

export function getComplaintReports(): ComplaintReport[] {
  return reports;
}

export function subscribeToComplaintReports(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addComplaintReport(report: NewComplaint): ComplaintReport {
  const complaint: ComplaintReport = {
    ...report,
    id: `KLM-${Date.now().toString().slice(-6)}`,
    status: 'Baru',
  };
  reports = [complaint, ...reports];
  listeners.forEach((listener) => listener());
  return complaint;
}

export function updateComplaintReportStatus(id: string, status: ComplaintStatus): void {
  reports = reports.map((report) => report.id === id ? { ...report, status } : report);
  listeners.forEach((listener) => listener());
}