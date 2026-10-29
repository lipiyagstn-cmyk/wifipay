import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type VisitStatus = 'Terjadwal' | 'Dalam Perjalanan' | 'Selesai';
type Visit = {
  id: string;
  time: string;
  title: string;
  customer: string;
  address: string;
  status: VisitStatus;
};

const initialVisits: Visit[] = [
  { id: 'KJG-091', time: '09.00', title: 'Instalasi router baru', customer: 'Andi Permana', address: 'Cibeunying, Bandung', status: 'Selesai' },
  { id: 'KJG-094', time: '11.30', title: 'Pengecekan kualitas sinyal', customer: 'Nia Kurnia', address: 'Dago, Bandung', status: 'Terjadwal' },
  { id: 'KJG-098', time: '14.00', title: 'Instalasi pelanggan baru', customer: 'Farhan Maulana', address: 'Ujung Berung, Bandung', status: 'Terjadwal' },
];

const visitStatus: Record<VisitStatus, { color: string; background: string }> = {
  Terjadwal: { color: '#A96A08', background: '#FFF4D9' },
  'Dalam Perjalanan': { color: '#2563EB', background: '#EAF2FF' },
  Selesai: { color: '#16804A', background: '#E8F6EE' },
};

export default function KunjunganScreen() {
  const [visits, setVisits] = useState(initialVisits);
  const completedCount = useMemo(() => visits.filter((visit) => visit.status === 'Selesai').length, [visits]);

  const advanceVisit = (id: string) => {
    setVisits((current) => current.map((visit) => {
      if (visit.id !== id) return visit;
      return { ...visit, status: visit.status === 'Terjadwal' ? 'Dalam Perjalanan' : 'Selesai' };
    }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Kunjungan</Text>
            <Text style={styles.subtitle}>Jadwal tugas lapangan Anda.</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="location-outline" size={22} color="#2563EB" />
          </View>
        </View>

        <View style={styles.dateCard}>
          <View style={styles.dateIcon}>
            <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.dateCopy}>
            <Text style={styles.dateCaption}>JADWAL HARI INI</Text>
            <Text style={styles.dateTitle}>Senin, 28 September</Text>
          </View>
          <View style={styles.progressBlock}>
            <Text style={styles.progressValue}>{completedCount}/{visits.length}</Text>
            <Text style={styles.progressLabel}>selesai</Text>
          </View>
        </View>

        <View style={styles.routeHeading}>
          <Text style={styles.sectionTitle}>Rute kunjungan</Text>
          <Text style={styles.visitCount}>{visits.length} tugas</Text>
        </View>

        {visits.map((visit, index) => {
          const status = visitStatus[visit.status];
          const isLast = index === visits.length - 1;

          return (
            <View key={visit.id} style={styles.visitRow}>
              <View style={styles.timeline}>
                <View style={[styles.timelineDot, visit.status === 'Selesai' && styles.timelineDotDone]}>
                  {visit.status === 'Selesai' && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                </View>
                {!isLast && <View style={styles.timelineLine} />}
              </View>

              <View style={styles.visitCard}>
                <View style={styles.visitTop}>
                  <View style={styles.timeBlock}>
                    <Ionicons name="time-outline" size={14} color="#708197" />
                    <Text style={styles.timeText}>{visit.time}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{visit.status}</Text>
                  </View>
                </View>

                <Text style={styles.visitTitle}>{visit.title}</Text>
                <Text style={styles.customer}>{visit.customer}</Text>
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={15} color="#8190A1" />
                  <Text style={styles.address}>{visit.address}</Text>
                </View>
                <Text style={styles.visitId}>ID kunjungan · {visit.id}</Text>

                {visit.status !== 'Selesai' && (
                  <TouchableOpacity accessibilityRole="button" onPress={() => advanceVisit(visit.id)} style={styles.actionButton}>
                    <Text style={styles.actionText}>{visit.status === 'Terjadwal' ? 'Mulai kunjungan' : 'Tandai selesai'}</Text>
                    <Ionicons name={visit.status === 'Terjadwal' ? 'navigate-outline' : 'checkmark'} size={15} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
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
  dateCard: { minHeight: 78, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', borderRadius: 16, paddingHorizontal: 13, marginBottom: 22 },
  dateIcon: { width: 39, height: 39, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  dateCopy: { flex: 1 },
  dateCaption: { color: '#DCE9FF', fontSize: 9, fontWeight: '700' },
  dateTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginTop: 4 },
  progressBlock: { alignItems: 'flex-end' },
  progressValue: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  progressLabel: { color: '#DCE9FF', fontSize: 9, marginTop: 2 },
  routeHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#203951', fontSize: 15, fontWeight: '800' },
  visitCount: { color: '#7B899A', fontSize: 11 },
  visitRow: { flexDirection: 'row', alignItems: 'stretch' },
  timeline: { width: 24, alignItems: 'center' },
  timelineDot: { width: 17, height: 17, borderRadius: 9, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#8FB4F8', alignItems: 'center', justifyContent: 'center', marginTop: 16, zIndex: 1 },
  timelineDotDone: { borderColor: '#16804A', backgroundColor: '#16804A' },
  timelineLine: { position: 'absolute', top: 31, bottom: 0, width: 2, backgroundColor: '#DCE6F4' },
  visitCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 15, borderWidth: 1, borderColor: '#E8EDF3', padding: 13, marginBottom: 12 },
  visitTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  timeBlock: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timeText: { color: '#5B6C80', fontSize: 11, fontWeight: '700' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { fontSize: 9, fontWeight: '700' },
  visitTitle: { color: '#243A52', fontSize: 14, fontWeight: '800' },
  customer: { color: '#596B7F', fontSize: 11, marginTop: 4 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  address: { color: '#7B899A', fontSize: 10 },
  visitId: { color: '#A0AAB7', fontSize: 9, marginTop: 8 },
  actionButton: { minHeight: 37, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#2563EB', borderRadius: 10, marginTop: 11 },
  actionText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});