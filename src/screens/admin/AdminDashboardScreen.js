import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function AdminDashboard({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: COLORS.admin }]}>
        <Text style={styles.greeting}>Hi, Admin 👋</Text>
        <Text style={styles.subGreeting}>Sistem Manajemen Pembayaran</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Total Pelanggan</Text>
            <Text style={styles.cardValue}>1.250</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Total Pembayaran</Text>
            <Text style={styles.cardValue}>Rp 12.500.000</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={() => navigation.replace('SelectRole')}
        >
          <Text style={styles.logoutText}>Keluar / Ganti Role</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 24, paddingTop: 48, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  subGreeting: { color: '#E2E8F0', marginTop: 4 },
  content: { padding: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { flex: 0.48, backgroundColor: '#FFF', padding: 16, borderRadius: 12, elevation: 2 },
  cardTitle: { fontSize: 12, color: '#64748B' },
  cardValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4, color: '#1E293B' },
  logoutBtn: { marginTop: 32, padding: 14, backgroundColor: '#EF4444', borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#FFF', fontWeight: 'bold' }
});