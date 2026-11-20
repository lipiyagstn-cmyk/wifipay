import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getApiErrorMessage } from '../../api';
import { getVisits, loadVisits, subscribeToVisits, type Visit } from '../../visitStore';

const statusColors: Record<string, { color: string; background: string }> = {
  'Tagihan Dibayar': { color: '#16804A', background: '#D8F7E8' },
  'Belum Bayar': { color: '#C43D3D', background: '#FDECEC' },
  Terjadwal: { color: '#A96A08', background: '#FFF4D9' },
  'Dalam Perjalanan': { color: '#2563EB', background: '#EAF2FF' },
  Selesai: { color: '#16804A', background: '#E8F6EE' },
};

function isPaid(visit: Visit): boolean {
  return visit.status === 'Tagihan Dibayar';
}

function parseDateFilter(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
    ? date
    : null;
}

function formatVisitTime(value: string): { date: string; time: string } {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: value, time: '' };
  return {
    date: parsed.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: `${parsed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })} WIB`,
  };
}

export default function KunjunganScreen() {
  const visits = useSyncExternalStore(subscribeToVisits, getVisits, getVisits);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadVisits().catch((error: unknown) => {
      Alert.alert('Gagal memuat kunjungan', getApiErrorMessage(error));
    });
  }, []);

  const todayCount = useMemo(() => visits.filter((visit) => {
    const time = new Date(visit.time);
    const now = new Date();
    return !Number.isNaN(time.getTime()) &&
      time.getFullYear() === now.getFullYear() &&
      time.getMonth() === now.getMonth() &&
      time.getDate() === now.getDate();
  }).length, [visits]);
  const paidCount = useMemo(() => visits.filter(isPaid).length, [visits]);
  const statusOptions = useMemo(
    () => ['Semua Status', ...new Set(visits.map((visit) => visit.status))],
    [visits],
  );
  const filteredVisits = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('id-ID');
    const from = parseDateFilter(startDate);
    const to = parseDateFilter(endDate);
    if (startDate.trim() && !from || endDate.trim() && !to) return [];
    if (to) to.setHours(23, 59, 59, 999);

    return visits.filter((visit) => {
      const searchable = `${visit.customer} ${visit.customerCode} ${visit.note} ${visit.employee}`
        .toLocaleLowerCase('id-ID');
      const time = new Date(visit.time);
      return (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (statusFilter === 'Semua Status' || visit.status === statusFilter) &&
        (!from || time >= from) &&
        (!to || time <= to);
    });
  }, [endDate, query, startDate, statusFilter, visits]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Riwayat Kunjungan</Text>
            <Text style={styles.subtitle}>Aktivitas kunjungan pelanggan.</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="location-outline" size={22} color="#7C3AED" />
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard icon="clipboard-outline" label="Total Kunjungan" value={visits.length} tone="purple" />
          <SummaryCard icon="calendar-outline" label="Kunjungan Hari Ini" value={todayCount} tone="green" />
          <SummaryCard icon="checkmark-circle-outline" label="Tagihan Dibayar" value={paidCount} tone="green" />
          <SummaryCard icon="close-circle-outline" label="Belum Bayar" value={visits.length - paidCount} tone="red" />
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.filterLabel}>Cari</Text>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" />
            <TextInput
              accessibilityLabel="Cari nama pelanggan, kode, atau catatan"
              value={query}
              onChangeText={setQuery}
              placeholder="Nama pelanggan, kode, catatan..."
              placeholderTextColor="#A0AAB7"
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>

          <Text style={styles.filterLabel}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusOptions}>
            {statusOptions.map((status) => {
              const active = statusFilter === status;
              return (
                <TouchableOpacity
                  key={status}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setStatusFilter(status)}
                  style={[styles.statusOption, active && styles.statusOptionActive]}
                >
                  <Text style={[styles.statusOptionText, active && styles.statusOptionTextActive]}>{status}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.dateFields}>
            <View style={styles.dateField}>
              <Text style={styles.filterLabel}>Tanggal Awal</Text>
              <TextInput
                accessibilityLabel="Tanggal awal"
                value={startDate}
                onChangeText={setStartDate}
                placeholder="dd/mm/yyyy"
                placeholderTextColor="#A0AAB7"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                style={styles.dateInput}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.filterLabel}>Tanggal Akhir</Text>
              <TextInput
                accessibilityLabel="Tanggal akhir"
                value={endDate}
                onChangeText={setEndDate}
                placeholder="dd/mm/yyyy"
                placeholderTextColor="#A0AAB7"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                style={styles.dateInput}
              />
            </View>
          </View>
          <View style={styles.filterActions}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                setQuery('');
                setStatusFilter('Semua Status');
                setStartDate('');
                setEndDate('');
              }}
              style={styles.resetButton}
            >
              <Ionicons name="refresh-outline" size={16} color="#475569" />
              <Text style={styles.resetText}>Reset Filter</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.listHeading}>
          <Text style={styles.sectionTitle}>Daftar Riwayat</Text>
          <Text style={styles.visitCount}>{filteredVisits.length} kunjungan</Text>
        </View>

        {filteredVisits.map((visit) => {
          const palette = statusColors[visit.status] ?? statusColors['Belum Bayar'];
          const formatted = formatVisitTime(visit.time);
          return (
            <View key={visit.id} style={styles.visitCard}>
              <View style={styles.cardTop}>
                <View style={styles.dateBlock}>
                  <Text style={styles.dateText}>{formatted.date}</Text>
                  {!!formatted.time && <Text style={styles.timeText}>{formatted.time}</Text>}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: palette.background }]}>
                  <View style={[styles.statusDot, { backgroundColor: palette.color }]} />
                  <Text style={[styles.statusText, { color: palette.color }]}>{visit.status}</Text>
                </View>
              </View>

              <View style={styles.customerRow}>
                <View style={styles.customerIcon}>
                  <Ionicons name="person-outline" size={17} color="#64748B" />
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{visit.customer}</Text>
                  {!!visit.customerCode && <Text style={styles.customerCode}>{visit.customerCode}</Text>}
                </View>
                {!!visit.employee && (
                  <View style={styles.employeeBlock}>
                    <Text style={styles.employeeLabel}>PEGAWAI</Text>
                    <Text style={styles.employeeName}>{visit.employee}</Text>
                  </View>
                )}
              </View>

              {!!visit.note && (
                <View style={styles.noteBox}>
                  <Ionicons name="chatbox-ellipses-outline" size={15} color="#708197" />
                  <Text style={styles.noteText}>{visit.note}</Text>
                </View>
              )}
              <Text style={styles.visitId}>ID kunjungan · {visit.id}</Text>
            </View>
          );
        })}

        {filteredVisits.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={30} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Tidak ada riwayat kunjungan</Text>
            <Text style={styles.emptyText}>Coba ubah kata kunci atau filter yang dipilih.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  value: number;
  tone: 'purple' | 'green' | 'red';
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, styles[`summaryIcon_${tone}`]]}>
        <Ionicons name={icon} size={19} color={tone === 'purple' ? '#7C3AED' : tone === 'green' ? '#16804A' : '#DC3545'} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  title: { color: '#172F49', fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#7B899A', fontSize: 12, marginTop: 5 },
  headerIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0EAFE' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
  summaryCard: { width: '48%', flexGrow: 1, minHeight: 112, backgroundColor: '#FFFFFF', borderRadius: 15, padding: 13, borderWidth: 1, borderColor: '#EDF0F5' },
  summaryIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  summaryIcon_purple: { backgroundColor: '#F0EAFE' },
  summaryIcon_green: { backgroundColor: '#D8F7E8' },
  summaryIcon_red: { backgroundColor: '#FDE7E9' },
  summaryLabel: { color: '#8290A2', fontSize: 10 },
  summaryValue: { color: '#172F49', fontSize: 20, fontWeight: '800', marginTop: 4 },
  filterCard: { backgroundColor: '#FFFFFF', borderRadius: 15, borderWidth: 1, borderColor: '#EDF0F5', padding: 13, marginBottom: 17 },
  filterLabel: { color: '#526579', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  searchBox: { minHeight: 42, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, marginBottom: 12 },
  searchInput: { flex: 1, color: '#243A52', fontSize: 12, paddingVertical: 8 },
  statusOptions: { gap: 7, paddingBottom: 12 },
  statusOption: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 18, paddingHorizontal: 11, paddingVertical: 7 },
  statusOptionActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  statusOptionText: { color: '#64748B', fontSize: 10, fontWeight: '600' },
  statusOptionTextActive: { color: '#FFFFFF' },
  dateFields: { flexDirection: 'row', gap: 9 },
  dateField: { flex: 1 },
  dateInput: { height: 40, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 9, paddingHorizontal: 9, color: '#243A52', fontSize: 11 },
  filterActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  resetButton: { height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 9, paddingHorizontal: 10 },
  resetText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  listHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: '#203951', fontSize: 15, fontWeight: '800' },
  visitCount: { color: '#7B899A', fontSize: 11 },
  visitCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E8EDF3', padding: 13, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  dateBlock: { flex: 1 },
  dateText: { color: '#243A52', fontSize: 12, fontWeight: '800' },
  timeText: { color: '#8995A4', fontSize: 10, marginTop: 3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 16, paddingHorizontal: 9, paddingVertical: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '700' },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  customerIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  customerInfo: { flex: 1 },
  customerName: { color: '#243A52', fontSize: 13, fontWeight: '800' },
  customerCode: { color: '#8995A4', fontSize: 10, marginTop: 2 },
  employeeBlock: { alignItems: 'flex-end', maxWidth: '34%' },
  employeeLabel: { color: '#94A3B8', fontSize: 8, fontWeight: '700', marginBottom: 3 },
  employeeName: { color: '#526579', fontSize: 11 },
  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, backgroundColor: '#F8FAFC', borderRadius: 9, padding: 9, marginTop: 11 },
  noteText: { flex: 1, color: '#64748B', fontSize: 10, lineHeight: 15 },
  visitId: { color: '#A0AAB7', fontSize: 9, marginTop: 9 },
  emptyState: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 24 },
  emptyTitle: { color: '#526579', fontSize: 13, fontWeight: '700', marginTop: 9 },
  emptyText: { color: '#94A3B8', fontSize: 11, marginTop: 4, textAlign: 'center' },
});
