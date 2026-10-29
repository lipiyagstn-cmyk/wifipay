import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getComplaintReports, subscribeToComplaintReports, updateComplaintReportStatus } from '../../complaintStore';

type IssueStatus = 'Baru' | 'Diproses' | 'Selesai';
type IssueFilter = 'Semua' | 'Baru' | 'Diproses';
type Issue = {
  id: string;
  title: string;
  customer: string;
  address: string;
  time: string;
  priority: 'Tinggi' | 'Sedang' | 'Rendah';
  status: IssueStatus;
  detail?: string;
  photoUri?: string | null;
  customerReported?: boolean;
};

const initialIssues: Issue[] = [
  { id: 'GNG-0261', title: 'Sinyal internet tidak stabil', customer: 'Budi Santoso', address: 'Sukajadi, Bandung', time: '09.14', priority: 'Tinggi', status: 'Baru' },
  { id: 'GNG-0258', title: 'Router sering memulai ulang', customer: 'Siti Rahma', address: 'Dago, Bandung', time: '08.42', priority: 'Sedang', status: 'Diproses' },
  { id: 'GNG-0252', title: 'Kecepatan internet menurun', customer: 'Arman Hidayat', address: 'Antapani, Bandung', time: 'Kemarin, 16.20', priority: 'Rendah', status: 'Selesai' },
];

const filters: IssueFilter[] = ['Semua', 'Baru', 'Diproses'];

const statusColors: Record<IssueStatus, { text: string; background: string }> = {
  Baru: { text: '#B45309', background: '#FFF3DC' },
  Diproses: { text: '#2563EB', background: '#EAF2FF' },
  Selesai: { text: '#16804A', background: '#E8F6EE' },
};

export default function GangguanScreen() {
  const [issues, setIssues] = useState(initialIssues);
  const [activeFilter, setActiveFilter] = useState<IssueFilter>('Semua');
  const customerReports = useSyncExternalStore(subscribeToComplaintReports, getComplaintReports, getComplaintReports);
  const reportedIssues: Issue[] = customerReports.map((report) => ({
    id: report.id,
    title: report.category,
    customer: `${report.customer} · ${report.customerId}`,
    address: report.address,
    time: `${report.createdAt}, ${report.time}`,
    priority: report.priority,
    status: report.status,
    detail: report.detail,
    photoUri: report.photoUri,
    customerReported: true,
  }));
  const allIssues = [...reportedIssues, ...issues];
  const filteredIssues = useMemo(
    () => allIssues.filter((issue) => activeFilter === 'Semua' || issue.status === activeFilter),
    [activeFilter, customerReports, issues],
  );
  const activeCount = allIssues.filter((issue) => issue.status !== 'Selesai').length;

  const advanceIssue = (id: string) => {
    if (customerReports.some((report) => report.id === id)) {
      const issue = customerReports.find((report) => report.id === id);
      if (issue) updateComplaintReportStatus(id, issue.status === 'Baru' ? 'Diproses' : 'Selesai');
      return;
    }
    setIssues((current) => current.map((issue) => {
      if (issue.id !== id) return issue;
      return { ...issue, status: issue.status === 'Baru' ? 'Diproses' : 'Selesai' };
    }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Gangguan Pelanggan</Text>
            <Text style={styles.subtitle}>Pantau dan tangani laporan jaringan.</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="warning-outline" size={22} color="#2563EB" />
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryLabel}>Perlu ditangani</Text>
            <Text style={styles.summaryValue}>{String(activeCount).padStart(2, '0')} laporan aktif</Text>
          </View>
          <View style={styles.summaryIcon}>
            <Ionicons name="pulse-outline" size={21} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.filterRow}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === filter }}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filterButton, activeFilter === filter && styles.filterButtonActive]}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
              {filter === 'Baru' && <View style={styles.filterDot} />}
            </TouchableOpacity>
          ))}
        </View>

        {filteredIssues.map((issue) => {
          const status = statusColors[issue.status];
          const priorityColor = issue.priority === 'Tinggi' ? '#C43D3D' : issue.priority === 'Sedang' ? '#B66A18' : '#667085';

          return (
            <View key={issue.id} style={styles.issueCard}>
              <View style={styles.cardTop}>
                <View style={styles.idGroup}>
                  <Ionicons name="document-text-outline" size={15} color="#75859A" />
                  <Text style={styles.issueId}>{issue.id}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
                  <Text style={[styles.statusText, { color: status.text }]}>{issue.status}</Text>
                </View>
              </View>

              <Text style={styles.issueTitle}>{issue.title}</Text>
              <Text style={styles.customer}>{issue.customer}</Text>

              {issue.customerReported && (
                <View style={styles.customerReportTag}>
                  <Ionicons name="person-outline" size={12} color="#0F766E" />
                  <Text style={styles.customerReportTagText}>Laporan dari pelanggan</Text>
                </View>
              )}

              {issue.photoUri && <Image source={{ uri: issue.photoUri }} style={styles.reportPhoto} />}
              {issue.detail && <Text style={styles.reportDetail}>{issue.detail}</Text>}

              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={15} color="#8492A4" />
                <Text style={styles.metaText}>{issue.address}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={15} color="#8492A4" />
                <Text style={styles.metaText}>Dilaporkan {issue.time}</Text>
                <Text style={styles.priorityLabel}>Prioritas</Text>
                <Text style={[styles.priorityValue, { color: priorityColor }]}>{issue.priority}</Text>
              </View>

              {issue.status !== 'Selesai' && (
                <TouchableOpacity accessibilityRole="button" onPress={() => advanceIssue(issue.id)} style={styles.actionButton}>
                  <Text style={styles.actionText}>{issue.status === 'Baru' ? 'Mulai penanganan' : 'Tandai selesai'}</Text>
                  <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {filteredIssues.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={30} color="#16804A" />
            <Text style={styles.emptyTitle}>Tidak ada laporan di filter ini</Text>
            <Text style={styles.emptySubtitle}>Pilih filter lain untuk melihat laporan.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FB' },
  content: { paddingHorizontal: 18, paddingTop: 15, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  title: { color: '#172F49', fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#7B899A', fontSize: 12, marginTop: 5 },
  headerIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF2FF' },
  summaryCard: { minHeight: 84, borderRadius: 16, backgroundColor: '#2563EB', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  summaryCopy: { gap: 4 },
  summaryLabel: { color: '#DCE9FF', fontSize: 11 },
  summaryValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  summaryIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 13 },
  filterButton: { minHeight: 35, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 13, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5EAF1' },
  filterButtonActive: { backgroundColor: '#EAF2FF', borderColor: '#BBD2FF' },
  filterText: { color: '#718096', fontSize: 11, fontWeight: '700' },
  filterTextActive: { color: '#2563EB' },
  filterDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D98B26' },
  issueCard: { backgroundColor: '#FFFFFF', borderRadius: 15, borderWidth: 1, borderColor: '#E8EDF3', padding: 14, marginBottom: 11 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  idGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  issueId: { color: '#77869A', fontSize: 10, fontWeight: '700' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 10, fontWeight: '700' },
  issueTitle: { color: '#243A52', fontSize: 15, fontWeight: '800' },
  customer: { color: '#596B7F', fontSize: 12, marginTop: 4, marginBottom: 10 },
  customerReportTag: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EAF7F4', borderRadius: 13, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 8 },
  customerReportTagText: { color: '#0F766E', fontSize: 9, fontWeight: '700' },
  reportPhoto: { width: '100%', height: 150, borderRadius: 11, marginBottom: 8, backgroundColor: '#E8EDF3' },
  reportDetail: { color: '#526477', fontSize: 11, lineHeight: 16, marginBottom: 7 },
  metaRow: { minHeight: 23, flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#7B899A', fontSize: 10 },
  priorityLabel: { color: '#98A3B1', fontSize: 9, marginLeft: 'auto' },
  priorityValue: { fontSize: 10, fontWeight: '700' },
  actionButton: { minHeight: 39, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#2563EB', borderRadius: 10, marginTop: 11 },
  actionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 16 },
  emptyTitle: { color: '#294057', fontSize: 13, fontWeight: '700', marginTop: 9 },
  emptySubtitle: { color: '#8492A4', fontSize: 11, marginTop: 4, textAlign: 'center' },
});