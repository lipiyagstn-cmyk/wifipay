import React, { useSyncExternalStore } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NavigationProp } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../navigation/adminTypes';
import type { RootStackParamList } from '../../navigation/types';
import { getCustomers, subscribeToCustomers } from '../../customerStore';
import { getEmployees, subscribeToEmployees } from '../../employeeStore';
import { formatRupiah, useAdminInvoices } from './adminData';

type Props = NativeStackScreenProps<AdminStackParamList, 'DashboardAdmin'>;

const shortcuts = [
  { title: 'Data Pelanggan', subtitle: 'Profil dan status pelanggan', icon: 'people-outline' as const, color: '#2563EB', background: '#EAF2FF', route: 'DataPelangganAdmin' as const },
  { title: 'Data Pegawai', subtitle: 'Tim dan area layanan', icon: 'briefcase-outline' as const, color: '#7C3AED', background: '#F2EBFF', route: 'DataPegawaiAdmin' as const },
  { title: 'Data Tagihan', subtitle: 'Status pembayaran bulanan', icon: 'receipt-outline' as const, color: '#D97706', background: '#FFF5E5', route: 'DataTagihanAdmin' as const },
  { title: 'Keuangan', subtitle: 'Pemasukan dan piutang', icon: 'wallet-outline' as const, color: '#059669', background: '#E7F7F1', route: 'KeuanganAdmin' as const },
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
  const rootNavigation = navigation.getParent<NavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>WIFIPAY · ADMIN</Text>
            <Text style={styles.greeting}>Dashboard</Text>
            <Text style={styles.subtitle}>Pantau operasional layanan internet Anda.</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Keluar"
            onPress={() => rootNavigation?.reset({ index: 0, routes: [{ name: 'Login' }] })}
            style={styles.logoutButton}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.financeCard}>
          <View style={styles.financeTop}>
            <View>
              <Text style={styles.financeLabel}>Uang masuk tercatat</Text>
              <Text style={styles.financeAmount}>{formatRupiah(collected)}</Text>
            </View>
            <View style={styles.financeIcon}>
              <Ionicons name="trending-up-outline" size={21} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.financeDivider} />
          <View style={styles.financeBottom}>
            <Text style={styles.financeFootnote}>{paidInvoices.length} tagihan lunas</Text>
            <Text style={styles.financeFootnote}>Belum tertagih {formatRupiah(outstanding)}</Text>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Ringkasan</Text>
          <Text style={styles.demoBadge}>DATA DEMO</Text>
        </View>
        <View style={styles.statsGrid}>
          <SummaryCard icon="people-outline" label="Pelanggan" value={`${customers.length}`} detail="terdaftar" tint="#2563EB" background="#EAF2FF" />
          <SummaryCard icon="briefcase-outline" label="Pegawai" value={`${employees.length}`} detail="tim layanan" tint="#7C3AED" background="#F2EBFF" />
          <SummaryCard icon="receipt-outline" label="Tagihan" value={`${invoices.length}`} detail="periode ini" tint="#D97706" background="#FFF5E5" />
          <SummaryCard icon="alert-circle-outline" label="Belum lunas" value={`${invoices.length - paidInvoices.length}`} detail="perlu ditindaklanjuti" tint="#DC4C4C" background="#FFF0F0" />
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Menu admin</Text>
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

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Tagihan terbaru</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => navigation.navigate('DataTagihanAdmin')}
          >
            <Text style={styles.seeAll}>Lihat semua</Text>
          </TouchableOpacity>
        </View>
        {invoices.slice(0, 3).map((invoice) => (
          <View key={invoice.id} style={styles.invoiceRow}>
            <View style={styles.invoiceIcon}>
              <Ionicons name="receipt-outline" size={18} color="#52647A" />
            </View>
            <View style={styles.invoiceCopy}>
              <Text style={styles.invoiceName}>{invoice.customerName}</Text>
              <Text style={styles.invoiceMeta}>{invoice.id} · {invoice.dueDate}</Text>
            </View>
            <View style={styles.invoiceAmountCopy}>
              <Text style={styles.invoiceAmount}>{formatRupiah(invoice.amount)}</Text>
              <Text style={[styles.invoiceStatus, invoice.status === 'Lunas' ? styles.paidText : styles.unpaidText]}>
                {invoice.status}
              </Text>
            </View>
          </View>
        ))}
        <Text style={styles.disclaimer}>Ringkasan menggunakan data demo lokal, bukan laporan server.</Text>
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
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  headerCopy: { flex: 1, paddingRight: 12 },
  eyebrow: { color: '#2563EB', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  greeting: { color: '#172B45', fontSize: 28, fontWeight: '800', marginTop: 5 },
  subtitle: { color: '#718096', fontSize: 13, marginTop: 4, lineHeight: 19 },
  logoutButton: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center' },
  financeCard: { backgroundColor: '#1D4ED8', borderRadius: 20, padding: 18, marginBottom: 23, shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 4 },
  financeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  financeLabel: { color: '#D8E6FF', fontSize: 12, fontWeight: '600' },
  financeAmount: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', marginTop: 6 },
  financeIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF24', alignItems: 'center', justifyContent: 'center' },
  financeDivider: { height: 1, backgroundColor: '#FFFFFF38', marginVertical: 15 },
  financeBottom: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  financeFootnote: { color: '#E2ECFF', fontSize: 11, fontWeight: '600' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 2 },
  sectionTitle: { color: '#172B45', fontSize: 17, fontWeight: '800' },
  demoBadge: { color: '#64748B', backgroundColor: '#E9EEF5', overflow: 'hidden', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { width: '48.3%', minHeight: 137, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EDF0F5' },
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
