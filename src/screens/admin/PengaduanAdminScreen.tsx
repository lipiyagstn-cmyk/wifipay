import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getApiErrorMessage } from '../../api';
import {
  getComplaintReports,
  loadComplaintReports,
  subscribeToComplaintReports,
  updateComplaintReportStatus,
  type ComplaintStatus,
} from '../../complaintStore';

const nextStatus: Record<ComplaintStatus, ComplaintStatus> = {
  Baru: 'Diproses',
  Diproses: 'Selesai',
  Selesai: 'Selesai',
};

export default function PengaduanAdminScreen() {
  const complaints = useSyncExternalStore(
    subscribeToComplaintReports,
    getComplaintReports,
    getComplaintReports,
  );
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    loadComplaintReports().catch((error: unknown) => {
      Alert.alert('Gagal memuat pengaduan', getApiErrorMessage(error));
    }).finally(() => setLoading(false));
  }, []);

  const setStatus = async (id: string, status: ComplaintStatus) => {
    setUpdatingIds((current) => new Set(current).add(id));
    try {
      await updateComplaintReportStatus(id, status);
    } catch (error) {
      Alert.alert('Gagal memperbarui pengaduan', getApiErrorMessage(error));
    } finally {
      setUpdatingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Pengaduan pelanggan</Text>
        <Text style={styles.subtitle}>Tinjau dan perbarui status melalui API admin.</Text>
        {loading ? <ActivityIndicator color="#7C3AED" style={styles.loading} /> : complaints.length ? complaints.map((complaint) => {
          const canAdvance = complaint.status !== 'Selesai';
          const updating = updatingIds.has(complaint.id);
          return (
            <View key={complaint.id} style={styles.card}>
              <View style={styles.cardHeading}>
                <View style={styles.iconWrap}><Ionicons name="chatbubble-ellipses-outline" size={18} color="#7C3AED" /></View>
                <View style={styles.copy}>
                  <Text style={styles.category}>{complaint.category}</Text>
                  <Text style={styles.customer}>{complaint.customer || `Pelanggan ${complaint.customerId}`}</Text>
                </View>
                <Text style={styles.status}>{complaint.status}</Text>
              </View>
              <Text style={styles.detail}>{complaint.detail}</Text>
              <Text style={styles.address}>{complaint.address}</Text>
              <View style={styles.footer}>
                <Text style={styles.date}>{[complaint.createdAt, complaint.time].filter(Boolean).join(' · ')}</Text>
                {canAdvance ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    disabled={updating}
                    onPress={() => void setStatus(complaint.id, nextStatus[complaint.status])}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionText}>
                      {updating ? 'Memperbarui…' : `Tandai ${nextStatus[complaint.status].toLowerCase()}`}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        }) : (
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-outline" size={28} color="#94A3B8" />
            <Text style={styles.emptyText}>Belum ada pengaduan.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { padding: 18, paddingBottom: 30 },
  loading: { marginVertical: 28 },
  title: { color: '#172B45', fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#718096', fontSize: 12, marginTop: 4, marginBottom: 17 },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EDF3', borderRadius: 15, padding: 14, marginBottom: 10 },
  cardHeading: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#F2EBFF', alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  copy: { flex: 1 },
  category: { color: '#26384E', fontSize: 13, fontWeight: '700' },
  customer: { color: '#718096', fontSize: 10, marginTop: 3 },
  status: { color: '#8B5E12', fontSize: 10, fontWeight: '700', backgroundColor: '#FFF5E5', borderRadius: 14, paddingHorizontal: 8, paddingVertical: 5 },
  detail: { color: '#475569', fontSize: 12, lineHeight: 18, marginTop: 12 },
  address: { color: '#8491A2', fontSize: 10, marginTop: 6 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTopWidth: 1, borderTopColor: '#F1F4F8', marginTop: 11, paddingTop: 10 },
  date: { flex: 1, color: '#94A3B8', fontSize: 9 },
  actionButton: { backgroundColor: '#EAF2FF', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  actionText: { color: '#2563EB', fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', padding: 25, borderRadius: 15 },
  emptyText: { color: '#718096', fontSize: 12 },
});
