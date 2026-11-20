import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Directory, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { zipSync, strToU8 } from 'fflate';
import { api, getApiErrorMessage } from '../../api';
import { getComplaintReports, loadComplaintReports, subscribeToComplaintReports } from '../../complaintStore';
import { getInvoices, loadInvoices, subscribeToInvoices, type AdminInvoice } from '../../paymentStore';
import { formatRupiah } from './adminData';

type ReportType = 'Semua Transaksi' | 'Pembayaran' | 'Pengaduan';
type ReportStatus = 'Semua Status' | 'Lunas' | 'Belum Bayar' | 'Baru' | 'Diproses' | 'Selesai';
type ReportRow = {
  id: string;
  date: string;
  customer: string;
  packageName: string;
  method: string;
  amount: number;
  status: string;
  employee: string;
  type: 'Pembayaran' | 'Pengaduan';
};

const reportTypes: ReportType[] = ['Semua Transaksi', 'Pembayaran', 'Pengaduan'];
const reportStatuses: ReportStatus[] = ['Semua Status', 'Lunas', 'Belum Bayar', 'Baru', 'Diproses', 'Selesai'];

function formatInputDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: formatInputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: formatInputDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

function parseInputDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, rawDay, rawMonth, rawYear] = match;
  const date = new Date(Number(rawYear), Number(rawMonth) - 1, Number(rawDay));
  if (
    date.getFullYear() !== Number(rawYear) ||
    date.getMonth() !== Number(rawMonth) - 1 ||
    date.getDate() !== Number(rawDay)
  ) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDate(value: string): Date | null {
  const trimmed = value.trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    const result = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
    return result.getFullYear() === Number(dateOnly[1]) &&
      result.getMonth() === Number(dateOnly[2]) - 1 &&
      result.getDate() === Number(dateOnly[3])
      ? result
      : null;
  }

  const localizedNumeric = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(trimmed);
  if (localizedNumeric) {
    const result = new Date(Number(localizedNumeric[3]), Number(localizedNumeric[2]) - 1, Number(localizedNumeric[1]));
    return result.getFullYear() === Number(localizedNumeric[3]) &&
      result.getMonth() === Number(localizedNumeric[2]) - 1 &&
      result.getDate() === Number(localizedNumeric[1])
      ? result
      : null;
  }

  const localized = /^(\d{1,2})\s+([a-z.]+)\s+(\d{4})$/i.exec(trimmed);
  if (localized) {
    const monthIndexes: Record<string, number> = {
      jan: 0, januari: 0,
      feb: 1, februari: 1,
      mar: 2, maret: 2,
      apr: 3, april: 3,
      mei: 4,
      jun: 5, juni: 5,
      jul: 6, juli: 6,
      agu: 7, agt: 7, agustus: 7,
      sep: 8, september: 8,
      okt: 9, oktober: 9,
      nov: 10, november: 10,
      des: 11, desember: 11,
    };
    const month = monthIndexes[localized[2].replace(/\.$/, '').toLowerCase()];
    if (month === undefined) return null;
    const result = new Date(Number(localized[3]), month, Number(localized[1]));
    return result.getDate() === Number(localized[1]) ? result : null;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatReportDate(value: string): string {
  const date = parseDate(value);
  if (!date) return value || '-';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function inRange(value: string, start: Date, end: Date): boolean {
  const date = parseDate(value);
  const exclusiveEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
  return date !== null && date >= start && date < exclusiveEnd;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function getString(record: Record<string, unknown> | null, keys: string[]): string {
  if (!record) return '';
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' || typeof value === 'number') return String(value);
  }
  return '';
}

function findTransactionList(value: unknown, depth = 0): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (depth >= 4) return null;
  const record = asRecord(value);
  if (!record) return null;
  for (const key of ['transactions', 'transaksi', 'payments', 'pembayaran', 'data_pembayaran', 'items', 'data']) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  for (const nested of Object.values(record)) {
    const result = findTransactionList(nested, depth + 1);
    if (result) return result;
  }
  return null;
}

function getAmount(record: Record<string, unknown>): number {
  const raw = record.amount ?? record.nominal ?? record.jumlah ?? record.total_bayar;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  if (typeof raw === 'string') {
    const amount = Number(raw.replace(/[^\d,-]/g, '').replace(',', '.'));
    return Number.isFinite(amount) ? amount : 0;
  }
  return 0;
}

function invoiceToRow(invoice: AdminInvoice): ReportRow {
  return {
    id: invoice.paymentId ?? invoice.id,
    date: invoice.paidAt ?? invoice.dueDate,
    customer: invoice.customerName,
    packageName: invoice.packageName || invoice.period || '-',
    method: invoice.paymentMethod || '-',
    amount: invoice.amount,
    status: invoice.status,
    employee: invoice.receivedBy || '-',
    type: 'Pembayaran',
  };
}

function normalizeReportRow(value: unknown): ReportRow | null {
  const record = asRecord(value);
  if (!record) return null;
  const customerRelation = asRecord(record.pelanggan ?? record.customer);
  const employeeRelation = asRecord(record.pegawai ?? record.employee);
  const id = getString(record, ['id', 'payment_id', 'transaksi_id', 'invoice_id']);
  const date = getString(record, ['tanggal', 'tanggal_bayar', 'dibayar_at', 'date', 'created_at']);
  const customer = getString(customerRelation, ['nama', 'name']) ||
    getString(record, ['nama_pelanggan', 'customer_name', 'pelanggan']);
  const rawStatus = getString(record, ['status']);
  if (!id || !date || !customer || !rawStatus) return null;
  const normalizedStatus = rawStatus.trim().toLowerCase().replace(/[_-]+/g, ' ');
  const status = normalizedStatus === 'belum bayar' || normalizedStatus === 'unpaid'
    ? 'Belum Bayar'
    : normalizedStatus === 'lunas' || normalizedStatus === 'paid'
      ? 'Lunas'
      : rawStatus;
  return {
    id,
    date,
    customer,
    packageName: getString(record, ['paket', 'package_name', 'package', 'periode', 'period']) || '-',
    method: getString(record, ['metode_pembayaran', 'payment_method', 'metode']) || '-',
    amount: getAmount(record),
    status,
    employee: getString(employeeRelation, ['name', 'nama']) ||
      getString(record, ['diterima_oleh', 'employee_name', 'pegawai']) || '-',
    type: 'Pembayaran',
  };
}

function complaintToRow(complaint: ReturnType<typeof getComplaintReports>[number]): ReportRow {
  return {
    id: complaint.id,
    date: complaint.createdAt,
    customer: complaint.customer || '-',
    packageName: complaint.category,
    method: '-',
    amount: 0,
    status: complaint.status,
    employee: '-',
    type: 'Pengaduan',
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function createExcelWorkbook(rows: ReportRow[], startDate: string, endDate: string, reportType: ReportType, paymentStatus: ReportStatus): Uint8Array {
  const values: (string | number)[][] = [
    ['Laporan WiFiPay'],
    ['Periode', startDate, 'sampai', endDate],
    ['Jenis laporan', reportType],
    ['Status laporan', paymentStatus],
    [],
    ['No', 'Tanggal', 'ID Transaksi', 'Nama Pelanggan', 'Paket WiFi/Jenis', 'Metode', 'Nominal', 'Status', 'Pegawai'],
    ...rows.map((row, index) => [
      index + 1,
      formatReportDate(row.date),
      row.id,
      row.customer,
      row.packageName,
      row.method,
      row.amount,
      row.status,
      row.employee,
    ]),
  ];
  const sheetRows = values.map((cells, rowIndex) => {
    const xmlCells = cells.map((value, columnIndex) => {
      const cellRef = `${String.fromCharCode(65 + columnIndex)}${rowIndex + 1}`;
      return typeof value === 'number'
        ? `<c r="${cellRef}"><v>${Number.isFinite(value) ? value : 0}</v></c>`
        : `<c r="${cellRef}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
    }).join('');
    return `<row r="${rowIndex + 1}">${xmlCells}</row>`;
  }).join('');
  const files = {
    '[Content_Types].xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '</Types>',
    ),
    '_rels/.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>',
    ),
    'xl/workbook.xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="Laporan" sheetId="1" r:id="rId1"/></sheets></workbook>',
    ),
    'xl/_rels/workbook.xml.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
      '</Relationships>',
    ),
    'xl/worksheets/sheet1.xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      `<sheetData>${sheetRows}</sheetData></worksheet>`,
    ),
  };
  return zipSync(files);
}

export default function LaporanAdminScreen() {
  const invoices = useSyncExternalStore(subscribeToInvoices, getInvoices, getInvoices);
  const complaints = useSyncExternalStore(subscribeToComplaintReports, getComplaintReports, getComplaintReports);
  const defaultRange = currentMonthRange();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [reportType, setReportType] = useState<ReportType>('Semua Transaksi');
  const [paymentStatus, setPaymentStatus] = useState<ReportStatus>('Semua Status');
  const [searchQuery, setSearchQuery] = useState('');
  const [rawReport, setRawReport] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

  const loadReport = useCallback(async () => {
    try {
      const [, response] = await Promise.all([
        Promise.all([loadInvoices(), loadComplaintReports()]),
        api.get<unknown>('/admin/reports'),
      ]);
      setRawReport(response.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport().catch((error: unknown) => {
      Alert.alert('Gagal memuat laporan', getApiErrorMessage(error));
    });
  }, [loadReport]);

  const start = parseInputDate(startDate);
  const end = parseInputDate(endDate);
  const dateError = start === null || end === null
    ? 'Gunakan format tanggal dd/mm/yyyy.'
    : start > end
      ? 'Tanggal awal tidak boleh melewati tanggal akhir.'
      : '';
  const reportPayments = useMemo(() => {
    const apiRows = findTransactionList(rawReport)?.map(normalizeReportRow)
      .filter((row): row is ReportRow => row !== null) ?? [];
    const source = apiRows.length ? apiRows : invoices.map(invoiceToRow);
    return source.filter((row) => start !== null && end !== null && inRange(row.date, start, end));
  }, [invoices, rawReport, start, end]);
  const reportComplaints = useMemo(() => complaints
    .map(complaintToRow)
    .filter((row) => start !== null && end !== null && inRange(row.date, start, end)), [complaints, start, end]);
  const rows = useMemo(() => {
    const selectedRows = reportType === 'Pengaduan'
      ? reportComplaints
      : reportType === 'Pembayaran'
        ? reportPayments
        : [...reportPayments, ...reportComplaints];
    const query = searchQuery.trim().toLocaleLowerCase('id-ID');
    return selectedRows.filter((row) => {
      const matchesStatus = paymentStatus === 'Semua Status' ||
        row.status.toLowerCase() === paymentStatus.toLowerCase();
      const searchableText = [
        row.id,
        row.date,
        formatReportDate(row.date),
        row.customer,
        row.packageName,
        row.method,
        row.amount,
        row.status,
        row.employee,
      ].join(' ').toLocaleLowerCase('id-ID');
      return matchesStatus && (!query || searchableText.includes(query));
    });
  }, [paymentStatus, reportComplaints, reportPayments, reportType, searchQuery]);
  const totalRevenue = reportPayments
    .filter((row) => row.status.toLowerCase() === 'lunas' || row.status.toLowerCase() === 'paid')
    .reduce((sum, row) => sum + row.amount, 0);
  const cashRevenue = reportPayments
    .filter((row) => /tunai|cash/i.test(row.method) && /lunas|paid/i.test(row.status))
    .reduce((sum, row) => sum + row.amount, 0);
  const qrisRevenue = reportPayments
    .filter((row) => /qris/i.test(row.method) && /lunas|paid/i.test(row.status))
    .reduce((sum, row) => sum + row.amount, 0);

  const buildHtml = () => `
    <!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body{font-family:Arial,sans-serif;color:#172B45;padding:24px}
      h1{font-size:22px;margin-bottom:4px}p{color:#64748B;font-size:12px}
      .summary{display:flex;gap:12px;margin:20px 0}.summary div{border:1px solid #E2E8F0;padding:12px;border-radius:8px;flex:1}
      table{border-collapse:collapse;width:100%;font-size:10px}th,td{border:1px solid #E2E8F0;padding:8px;text-align:left}
      th{background:#F1F5F9}
    </style></head><body>
    <h1>Laporan WiFiPay</h1>
    <p>Periode ${escapeHtml(startDate)} - ${escapeHtml(endDate)} · ${escapeHtml(reportType)} · ${escapeHtml(paymentStatus)}</p>
    <div class="summary"><div>Total Pendapatan<br><b>${escapeHtml(formatRupiah(totalRevenue))}</b></div>
    <div>Pembayaran Tunai<br><b>${escapeHtml(formatRupiah(cashRevenue))}</b></div>
    <div>Pembayaran QRIS<br><b>${escapeHtml(formatRupiah(qrisRevenue))}</b></div>
    <div>Total Pengaduan<br><b>${reportComplaints.length}</b></div></div>
    <table><thead><tr><th>No</th><th>Tanggal</th><th>ID</th><th>Pelanggan</th><th>Paket/Jenis</th><th>Metode</th><th>Nominal</th><th>Status</th><th>Pegawai</th></tr></thead>
    <tbody>${rows.map((row, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(formatReportDate(row.date))}</td><td>${escapeHtml(row.id)}</td><td>${escapeHtml(row.customer)}</td><td>${escapeHtml(row.packageName)}</td><td>${escapeHtml(row.method)}</td><td>${escapeHtml(formatRupiah(row.amount))}</td><td>${escapeHtml(row.status)}</td><td>${escapeHtml(row.employee)}</td></tr>`).join('')}</tbody></table>
    </body></html>`;

  const exportPdf = async () => {
    if (exporting) return;
    setExporting('pdf');
    try {
      if (Platform.OS === 'web') {
        await Print.printToFileAsync({ html: buildHtml() });
        return;
      }

      const { base64 } = await Print.printToFileAsync({ html: buildHtml(), base64: true });
      if (!base64) throw new Error('File PDF tidak berhasil dibuat.');
      const pdfFile = new File(Paths.cache, `laporan-wifipay-${Date.now()}.pdf`);
      pdfFile.create({ overwrite: true });
      await pdfFile.write(Uint8Array.from(atob(base64), (character) => character.charCodeAt(0)));
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Fitur berbagi tidak tersedia untuk menyimpan PDF pada perangkat ini.');
      }
      await Sharing.shareAsync(pdfFile.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch (error) {
      Alert.alert('Gagal mengekspor PDF', getApiErrorMessage(error));
    } finally {
      setExporting(null);
    }
  };

  const exportExcel = async () => {
    if (exporting) return;
    setExporting('excel');
    try {
      const workbook = createExcelWorkbook(rows, startDate, endDate, reportType, paymentStatus);
      const fileName = `laporan-wifipay-${Date.now()}.xlsx`;
      const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (Platform.OS === 'web') {
        const blobBytes = new Uint8Array(workbook.length);
        blobBytes.set(workbook);
        const blob = new Blob([blobBytes.buffer], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        Alert.alert('Excel berhasil diunduh', 'Periksa folder Downloads pada browser.');
      } else {
        const directory = await Directory.pickDirectoryAsync();
        const file = directory.createFile(fileName, mimeType);
        await file.write(workbook);
        Alert.alert('Excel berhasil disimpan', `File tersimpan di folder ${directory.name}.`);
      }
    } catch (error) {
      Alert.alert('Gagal mengekspor Excel', getApiErrorMessage(error));
    } finally {
      setExporting(null);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>Laporan</Text>
            <Text style={styles.subtitle}>Filter dan ekspor laporan operasional.</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Muat ulang laporan"
            onPress={() => {
              setLoading(true);
              loadReport().catch((error: unknown) => Alert.alert('Gagal memuat laporan', getApiErrorMessage(error)));
            }}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh-outline" size={19} color="#7C3AED" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterCard}>
          <View style={styles.cardHeading}>
            <View style={styles.purpleIcon}><Ionicons name="filter-outline" size={17} color="#7C3AED" /></View>
            <Text style={styles.cardTitle}>Filter Laporan</Text>
          </View>
          <View style={styles.dateFields}>
            <View style={styles.dateField}>
              <Text style={styles.label}>Dari Tanggal</Text>
              <TextInput
                accessibilityLabel="Dari tanggal"
                value={startDate}
                onChangeText={setStartDate}
                placeholder="dd/mm/yyyy"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                style={styles.input}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.label}>Sampai Tanggal</Text>
              <TextInput
                accessibilityLabel="Sampai tanggal"
                value={endDate}
                onChangeText={setEndDate}
                placeholder="dd/mm/yyyy"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                style={styles.input}
              />
            </View>
          </View>
          {dateError ? <Text style={styles.validationText}>{dateError}</Text> : null}
          <View style={styles.searchField}>
            <Ionicons name="search-outline" size={17} color="#8290A2" />
            <TextInput
              accessibilityLabel="Cari laporan"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Cari tanggal, pelanggan, ID..."
              returnKeyType="search"
              style={styles.searchInput}
            />
            {searchQuery ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Hapus pencarian"
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={17} color="#8290A2" />
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={styles.label}>Jenis Laporan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
            {reportTypes.map((type) => (
              <FilterChip key={type} label={type} selected={reportType === type} onPress={() => setReportType(type)} />
            ))}
          </ScrollView>

          <Text style={styles.label}>Status Laporan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
            {reportStatuses.map((status) => (
              <FilterChip key={status} label={status} selected={paymentStatus === status} onPress={() => setPaymentStatus(status)} />
            ))}
          </ScrollView>

          <View style={styles.exportActions}>
            <TouchableOpacity accessibilityRole="button" disabled={exporting !== null} onPress={exportPdf} style={[styles.exportButton, styles.pdfButton]}>
              <Ionicons name={exporting === 'pdf' ? 'hourglass-outline' : 'document-text-outline'} size={16} color="#FFFFFF" />
              <Text style={styles.exportText}>{exporting === 'pdf' ? 'Memproses...' : 'Export PDF'}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" disabled={exporting !== null} onPress={exportExcel} style={[styles.exportButton, styles.excelButton]}>
              <Ionicons name={exporting === 'excel' ? 'hourglass-outline' : 'document-outline'} size={16} color="#FFFFFF" />
              <Text style={styles.exportText}>{exporting === 'excel' ? 'Memproses...' : 'Export Excel'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard icon="trending-up-outline" label="Total Pendapatan" value={formatRupiah(totalRevenue)} tone="green" />
          <SummaryCard icon="wallet-outline" label="Pembayaran Tunai" value={formatRupiah(cashRevenue)} tone="orange" />
          <SummaryCard icon="phone-portrait-outline" label="Pembayaran QRIS" value={formatRupiah(qrisRevenue)} tone="blue" />
          <SummaryCard icon="chatbox-ellipses-outline" label="Total Pengaduan" value={String(reportComplaints.length)} tone="red" />
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableHeading}>
            <View style={styles.cardHeading}>
              <View style={styles.purpleIcon}><Ionicons name="document-text-outline" size={17} color="#7C3AED" /></View>
              <Text style={styles.cardTitle}>
                {reportType === 'Pengaduan' ? 'Data Pengaduan' : reportType === 'Pembayaran' ? 'Data Pembayaran' : 'Data Transaksi'}
              </Text>
            </View>
            <Text style={styles.resultCount}>{loading ? 'Memuat...' : `Menampilkan ${rows.length} transaksi`}</Text>
          </View>
          {loading ? (
            <ActivityIndicator color="#7C3AED" style={styles.loader} />
          ) : rows.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                <View style={styles.tableRow}>
                  {['NO', 'TANGGAL', 'ID TRANSAKSI', 'NAMA PELANGGAN', 'PAKET / JENIS', 'METODE', 'NOMINAL', 'STATUS', 'PEGAWAI'].map((column) => (
                    <Text key={column} style={[styles.tableHeader, styles[columnStyleKey(column)]]}>{column}</Text>
                  ))}
                </View>
                {rows.map((row, index) => (
                  <View key={`${row.type}-${row.id}`} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.column_no]}>{index + 1}</Text>
                    <Text style={[styles.tableCell, styles.column_date]}>{formatReportDate(row.date)}</Text>
                    <Text style={[styles.tableCell, styles.column_id]}>{row.id}</Text>
                    <Text style={[styles.tableCell, styles.column_customer]}>{row.customer}</Text>
                    <Text style={[styles.tableCell, styles.column_package]}>{row.packageName}</Text>
                    <Text style={[styles.tableCell, styles.column_method]}>{row.method}</Text>
                    <Text style={[styles.tableCell, styles.column_amount]}>{formatRupiah(row.amount)}</Text>
                    <Text style={[styles.tableCell, styles.column_status]}>{row.status}</Text>
                    <Text style={[styles.tableCell, styles.column_employee]}>{row.employee}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={30} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Tidak ada data laporan</Text>
              <Text style={styles.emptyText}>Coba ubah periode atau filter lainnya.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function columnStyleKey(label: string):
  | 'column_no'
  | 'column_date'
  | 'column_id'
  | 'column_customer'
  | 'column_package'
  | 'column_method'
  | 'column_amount'
  | 'column_status'
  | 'column_employee' {
  if (label === 'NO') return 'column_no';
  if (label === 'TANGGAL') return 'column_date';
  if (label === 'ID TRANSAKSI') return 'column_id';
  if (label === 'NAMA PELANGGAN') return 'column_customer';
  if (label === 'PAKET / JENIS') return 'column_package';
  if (label === 'METODE') return 'column_method';
  if (label === 'NOMINAL') return 'column_amount';
  if (label === 'STATUS') return 'column_status';
  return 'column_employee';
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.filterChip, selected && styles.filterChipSelected]}
    >
      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone: 'green' | 'orange' | 'blue' | 'red';
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, styles[`summaryIcon_${tone}`]]}>
        <Ionicons name={icon} size={19} color={tone === 'green' ? '#059669' : tone === 'orange' ? '#D97706' : tone === 'blue' ? '#0284C7' : '#DC3545'} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { padding: 16, paddingBottom: 30 },
  heading: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  headingCopy: { flex: 1 },
  title: { color: '#172B45', fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#718096', fontSize: 12, marginTop: 4 },
  refreshButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F2EBFF', alignItems: 'center', justifyContent: 'center' },
  filterCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EDF3', borderRadius: 16, padding: 14, marginBottom: 14 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  purpleIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F2EBFF', alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  cardTitle: { color: '#26384E', fontSize: 14, fontWeight: '800' },
  dateFields: { flexDirection: 'row', gap: 9 },
  dateField: { flex: 1 },
  label: { color: '#526579', fontSize: 10, fontWeight: '700', marginBottom: 5 },
  input: { height: 41, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 9, paddingHorizontal: 10, color: '#243A52', fontSize: 11, marginBottom: 11 },
  validationText: { color: '#DC3545', fontSize: 10, marginTop: -5, marginBottom: 9 },
  searchField: { minHeight: 41, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 9, paddingHorizontal: 10, marginBottom: 11 },
  searchInput: { flex: 1, color: '#243A52', fontSize: 11, paddingVertical: 9 },
  filterOptions: { gap: 7, paddingBottom: 10 },
  filterChip: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 17, paddingHorizontal: 10, paddingVertical: 7 },
  filterChipSelected: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  filterChipText: { color: '#64748B', fontSize: 10, fontWeight: '600' },
  filterChipTextSelected: { color: '#FFFFFF' },
  exportActions: { flexDirection: 'row', gap: 8, marginTop: 9 },
  exportButton: { flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10 },
  pdfButton: { backgroundColor: '#E11D48' },
  excelButton: { backgroundColor: '#059669' },
  exportText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 14 },
  summaryCard: { flexBasis: '48%', flexGrow: 1, minHeight: 106, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDF0F5', borderRadius: 14, padding: 12 },
  summaryIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  summaryIcon_green: { backgroundColor: '#D8F7E8' },
  summaryIcon_orange: { backgroundColor: '#FFF2CC' },
  summaryIcon_blue: { backgroundColor: '#E0F2FE' },
  summaryIcon_red: { backgroundColor: '#FDE7E9' },
  summaryLabel: { color: '#8290A2', fontSize: 9 },
  summaryValue: { color: '#172F49', fontSize: 15, fontWeight: '800', marginTop: 3 },
  tableCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EDF3', borderRadius: 16, paddingVertical: 13 },
  tableHeading: { paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  resultCount: { color: '#8290A2', fontSize: 9 },
  loader: { padding: 28 },
  tableRow: { minHeight: 43, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F4F8', paddingHorizontal: 11 },
  tableHeader: { color: '#8290A2', fontSize: 8, fontWeight: '800', paddingVertical: 12 },
  tableCell: { color: '#526579', fontSize: 9, paddingVertical: 10 },
  column_no: { width: 36 },
  column_date: { width: 100 },
  column_id: { width: 105 },
  column_customer: { width: 120 },
  column_package: { width: 110 },
  column_method: { width: 76 },
  column_amount: { width: 100 },
  column_status: { width: 95 },
  column_employee: { width: 90 },
  empty: { alignItems: 'center', padding: 25 },
  emptyTitle: { color: '#718096', fontSize: 12, fontWeight: '700', marginTop: 8 },
  emptyText: { color: '#94A3B8', fontSize: 10, textAlign: 'center', marginTop: 4 },
});
