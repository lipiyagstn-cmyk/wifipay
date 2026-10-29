import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CompositeScreenProps, NavigationProp } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PegawaiTabParamList, RootStackParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<PegawaiTabParamList, 'DashboardPegawai'>,
  NativeStackScreenProps<RootStackParamList>
>;

const statistics = [
  { label: 'Jumlah pelanggan', value: '540', detail: '12 pelanggan baru', icon: 'people-outline' as const, tint: '#2563EB', background: '#EFF6FF' },
  { label: 'Tugas hari ini', value: '08', detail: '3 perlu diselesaikan', icon: 'checkbox-outline' as const, tint: '#0F766E', background: '#E8F7F4' },
  { label: 'Gangguan aktif', value: '05', detail: 'Belum ditangani', icon: 'warning-outline' as const, tint: '#DC6B24', background: '#FFF4E8' },
  { label: 'Kunjungan hari ini', value: '06', detail: '2 sudah selesai', icon: 'location-outline' as const, tint: '#7C3AED', background: '#F3EEFF' },
];

const shortcuts = [
  { label: 'Data Pelanggan', icon: 'people-outline' as const, color: '#2563EB', route: 'DataPelanggan' as const },
  { label: 'Gangguan Pelanggan', icon: 'warning-outline' as const, color: '#DC6B24', route: 'GangguanPegawai' as const },
  { label: 'Kunjungan', icon: 'location-outline' as const, color: '#0F766E', route: 'KunjunganPegawai' as const },
  { label: 'Pembayaran', icon: 'card-outline' as const, color: '#7C3AED', route: 'PembayaranPegawai' as const },
];

const recentActivities = [
  { title: 'Instalasi pelanggan baru', subtitle: 'Jl. Cikutra, Budi Santoso', time: '09.42', icon: 'wifi-outline' as const, color: '#2563EB' },
  { title: 'Pembayaran diterima', subtitle: 'Dewi Ayu · Rp 150.000', time: '09.15', icon: 'checkmark-circle-outline' as const, color: '#0F766E' },
  { title: 'Laporan gangguan masuk', subtitle: 'Area Sukajadi · Prioritas sedang', time: '08.50', icon: 'alert-circle-outline' as const, color: '#DC6B24' },
];

export default function PegawaiDashboardScreen({ navigation }: Props) {
  const rootNavigation = navigation.getParent<NavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Hi, Pegawai 👋</Text>
            <Text style={styles.welcome}>Selamat datang kembali</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Keluar"
            accessibilityRole="button"
            onPress={() => rootNavigation?.reset({ index: 0, routes: [{ name: 'Login' }] })}
            style={styles.logoutButton}
          >
            <Ionicons name="log-out-outline" size={21} color="#475569" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Ringkasan hari ini</Text>
          <Text style={styles.sectionCaption}>Senin, 28 September</Text>
        </View>
        <View style={styles.statisticsGrid}>
          {statistics.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: item.background }]}>
                <Ionicons name={item.icon} size={20} color={item.tint} />
              </View>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={styles.statDetail}>{item.detail}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Menu layanan</Text>
        </View>
        <View style={styles.shortcutGrid}>
          {shortcuts.map((item) => (
            <TouchableOpacity
              key={item.label}
              accessibilityRole="button"
              onPress={() => {
                if (item.route === 'PembayaranPegawai') {
                  rootNavigation?.navigate('PembayaranPegawai');
                } else {
                  navigation.navigate(item.route);
                }
              }}
              style={styles.shortcut}
            >
              <View style={[styles.shortcutIcon, { backgroundColor: `${item.color}14` }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={styles.shortcutLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.activityHeading}>
          <Text style={styles.sectionTitle}>Aktivitas terbaru</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('GangguanPegawai')}>
            <Text style={styles.seeAll}>Lihat gangguan</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityList}>
          {recentActivities.map((activity, index) => (
            <View key={activity.title} style={[styles.activityRow, index === recentActivities.length - 1 && styles.lastActivityRow]}>
              <View style={[styles.activityIcon, { backgroundColor: `${activity.color}14` }]}>
                <Ionicons name={activity.icon} size={19} color={activity.color} />
              </View>
              <View style={styles.activityCopy}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
              </View>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 27 },
  headerText: { flex: 1 },
  greeting: { color: '#14243A', fontSize: 23, fontWeight: '800' },
  welcome: { color: '#718096', fontSize: 14, marginTop: 5 },
  logoutButton: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E6EBF2' },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: '#172B45', fontSize: 17, fontWeight: '800' },
  sectionCaption: { color: '#8794A7', fontSize: 11 },
  statisticsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 23 },
  statCard: { width: '48.2%', minHeight: 146, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 11, borderWidth: 1, borderColor: '#EDF0F5' },
  statIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  statValue: { color: '#172B45', fontSize: 23, fontWeight: '800' },
  statLabel: { color: '#4B5B70', fontSize: 12, fontWeight: '700', marginTop: 2 },
  statDetail: { color: '#98A3B2', fontSize: 10, marginTop: 5 },
  shortcutGrid: { gap: 9, marginBottom: 23 },
  shortcut: { minHeight: 62, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 12, borderWidth: 1, borderColor: '#EDF0F5' },
  shortcutIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  shortcutLabel: { flex: 1, color: '#26384E', fontSize: 13, fontWeight: '700' },
  activityHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  seeAll: { color: '#2563EB', fontSize: 11, fontWeight: '700' },
  activityList: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 13, borderWidth: 1, borderColor: '#EDF0F5' },
  activityRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F2F6' },
  lastActivityRow: { borderBottomWidth: 0 },
  activityIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  activityCopy: { flex: 1 },
  activityTitle: { color: '#26384E', fontSize: 12, fontWeight: '700' },
  activitySubtitle: { color: '#8794A7', fontSize: 10, marginTop: 4 },
  activityTime: { color: '#98A3B2', fontSize: 10, marginLeft: 7 },
});