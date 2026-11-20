import React, { useEffect, useSyncExternalStore } from 'react';
import {
  ScrollView,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { CompositeScreenProps, NavigationProp } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdminStackParamList, AdminTabParamList } from '../../navigation/adminTypes';
import type { RootStackParamList } from '../../navigation/types';
import { api, getApiErrorMessage } from '../../api';
import { getCurrentUser, logout } from '../../auth/authService';
import { getCustomers, loadCustomers, subscribeToCustomers } from '../../customerStore';
import { getEmployees, loadEmployees, subscribeToEmployees } from '../../employeeStore';
import { formatRupiah, useAdminInvoices } from './adminData';
import { loadInvoices } from '../../paymentStore';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AdminTabParamList, 'DashboardAdmin'>,
  NativeStackScreenProps<AdminStackParamList>
>;

const shortcuts = [
  { title: 'Paket Internet', subtitle: 'Kelola nama dan harga paket', icon: 'wifi-outline' as const, color: '#0F766E', background: '#E7F7F1', route: 'PaketAdmin' as const },
  { title: 'Laporan', subtitle: 'Ringkasan laporan operasional', icon: 'bar-chart-outline' as const, color: '#7C3AED', background: '#F2EBFF', route: 'LaporanAdmin' as const },
  { title: 'Pengaduan', subtitle: 'Tinjau dan tindak lanjuti keluhan', icon: 'chatbubble-ellipses-outline' as const, color: '#DC4C4C', background: '#FFF0F0', route: 'PengaduanAdmin' as const },
];

export default function DashboardAdmin({ navigation }: Props) {
  const customers = useSyncExternalStore(subscribeToCustomers, getCustomers, getCustomers);
  const employees = useSyncExternalStore(subscribeToEmployees, getEmployees, getEmployees);
  const invoices = useAdminInvoices();
  const paidInvoices = invoices.filter((invoice) => invoice.status === 'Lunas');
  const collected = paidInvoices.reduce((total, invoice) => total + invoice.amount, 0);
  const outstanding = invoices
    .filter((invoice) => invoice.status === 'Belum Bayar')
    .reduce((total, invoice) => total + invoice.amount, 0);
  const rootNavigation = navigation.getParent()
    ?.getParent<NavigationProp<RootStackParamList>>();
  const adminNavigation = navigation.getParent<NavigationProp<AdminStackParamList>>();
  const user = getCurrentUser();

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      loadCustomers(),
      loadEmployees(),
      loadInvoices(),
    ]).catch((error: unknown) => {
      Alert.alert('Gagal memuat dashboard', getApiErrorMessage(error));
    });
  }, []);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.greeting}>Hai, {user?.name ?? 'Admin'} 👋</Text>
            <Text style={styles.subtitle}>Selamat datang kembali</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Notifikasi"
              onPress={() => adminNavigation?.navigate('NotifikasiAdmin')}
              style={styles.headerActionButton}
            >
              <Ionicons name="notifications-outline" size={21} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Keluar"
              onPress={() => {
                logout();
                rootNavigation?.reset({ index: 0, routes: [{ name: 'Login' }] });
              }}
              style={styles.headerActionButton}
            >
              <Ionicons name="log-out-outline" size={21} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.summaryHeading}>
            <Text style={styles.sectionTitle}>Ringkasan hari ini</Text>
            <Text style={styles.sectionCaption}>{new Date().toLocaleDateString('id-ID')}</Text>
          </View>
          <View style={styles.financeCard}>
            <View style={styles.financeTop}>
              <View>
                <Text style={styles.financeLabel}>Uang masuk</Text>
                <Text style={styles.financeAmount}>{formatRupiah(collected)}</Text>
              </View>
              <View style={styles.financeIcon}>
                <Ionicons name="trending-up-outline" size={22} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.financeDivider} />
            <View style={styles.financeBottom}>
              <Text style={styles.financeFootnote}>{paidInvoices.length} tagihan lunas</Text>
              <Text style={styles.financeFootnote}>Belum tertagih {formatRupiah(outstanding)}</Text>
            </View>
          </View>
          <SummaryCard icon="people-outline" label="Pelanggan" value={`${customers.length}`} detail="terdaftar" tint="#2563EB" background="#EAF2FF" />
          <SummaryCard icon="briefcase-outline" label="Pegawai" value={`${employees.length}`} detail="tim layanan" tint="#7C3AED" background="#F2EBFF" />
          <SummaryCard icon="receipt-outline" label="Tagihan" value={`${invoices.length}`} detail="periode ini" tint="#D97706" background="#FFF5E5" />
          <SummaryCard icon="alert-circle-outline" label="Belum lunas" value={`${invoices.length - paidInvoices.length}`} detail="tagihan aktif" tint="#DC4C4C" background="#FFF0F0" />
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Akses cepat</Text>
        </View>
        <View style={styles.shortcutList}>
          {shortcuts.map((shortcut) => (
            <TouchableOpacity
              key={shortcut.route}
              accessibilityRole="button"
              onPress={() => navigation.navigate(shortcut.route)}
              style={styles.shortcut}
            >
              <View style={[styles.shortcutIcon, { backgroundColor: shortcut.background }]}>
                <Ionicons name={shortcut.icon} size={21} color={shortcut.color} />
              </View>
              <View style={styles.shortcutCopy}>
                <Text style={styles.shortcutTitle}>{shortcut.title}</Text>
                <Text style={styles.shortcutSubtitle}>{shortcut.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9AA6B5" />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
  tint,
  background,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  detail: string;
  tint: string;
  background: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: background }]}>
        <Ionicons name={icon} size={19} color={tint} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statDetail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  headerCopy: { flex: 1, paddingRight: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerActionButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E6EBF2' },
  greeting: { color: '#14243A', fontSize: 23, fontWeight: '800' },
  subtitle: { color: '#718096', fontSize: 14, marginTop: 5 },
  logoutButton: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E6EBF2' },
  financeCard: { width: '100%', backgroundColor: '#1D4ED8', borderRadius: 19, padding: 18, marginBottom: 12, shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 4 },
  financeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  financeLabel: { color: '#D8E6FF', fontSize: 12, fontWeight: '600' },
  financeAmount: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', marginTop: 6 },
  financeIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF24', alignItems: 'center', justifyContent: 'center' },
  financeDivider: { height: 1, backgroundColor: '#FFFFFF38', marginVertical: 15 },
  financeBottom: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  financeFootnote: { color: '#E2ECFF', fontSize: 10, fontWeight: '600', flexShrink: 1 },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, marginTop: 2 },
  sectionTitle: { color: '#172B45', fontSize: 17, fontWeight: '800' },
  sectionCaption: { color: '#8794A7', fontSize: 11 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 13 },
  summaryHeading: { width: '100%', flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  statCard: { width: '48.2%', minHeight: 146, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 11, borderWidth: 1, borderColor: '#EDF0F5' },
  statIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { color: '#172B45', fontSize: 23, fontWeight: '800' },
  statLabel: { color: '#4B5B70', fontSize: 12, fontWeight: '700', marginTop: 2 },
  statDetail: { color: '#98A3B2', fontSize: 10, marginTop: 4 },
  shortcutList: { gap: 9, marginBottom: 21 },
  shortcut: { minHeight: 68, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 15, paddingHorizontal: 12, borderWidth: 1, borderColor: '#EDF0F5' },
  shortcutIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  shortcutCopy: { flex: 1 },
  shortcutTitle: { color: '#26384E', fontSize: 13, fontWeight: '700' },
  shortcutSubtitle: { color: '#8A96A6', fontSize: 11, marginTop: 3 },
  seeAll: { color: '#2563EB', fontSize: 12, fontWeight: '700' },
  invoiceRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 11, marginBottom: 8, borderWidth: 1, borderColor: '#EDF0F5' },
  invoiceIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  invoiceCopy: { flex: 1 },
  invoiceName: { color: '#26384E', fontSize: 12, fontWeight: '700' },
  invoiceMeta: { color: '#8A96A6', fontSize: 10, marginTop: 4 },
  invoiceAmountCopy: { alignItems: 'flex-end' },
  invoiceAmount: { color: '#26384E', fontSize: 11, fontWeight: '700' },
  invoiceStatus: { fontSize: 10, fontWeight: '700', marginTop: 4 },
  paidText: { color: '#16804A' },
  unpaidText: { color: '#C43D3D' },
  disclaimer: { color: '#9AA6B5', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 13 },
});
