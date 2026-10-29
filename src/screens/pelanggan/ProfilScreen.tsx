import React from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NavigationProp } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { PelangganTabParamList, RootStackParamList } from '../../navigation/types';

type Props = BottomTabScreenProps<PelangganTabParamList, 'ProfilPelanggan'>;

const customerAvatar = '';

export default function ProfilPelangganScreen({ navigation }: Props) {
  const rootNavigation = navigation.getParent<NavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Profil Saya</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: customerAvatar }} style={styles.avatar} />
            <View style={styles.memberMark}>
              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.name}>Budi Santoso</Text>
          <Text style={styles.memberLabel}>Pelanggan WiFiPay</Text>
          <View style={styles.customerIdBadge}>
            <Ionicons name="wifi-outline" size={13} color="#0F766E" />
            <Text style={styles.customerIdText}>ID WFP-008241</Text>
          </View>
        </View>

        <View style={styles.planCard}>
          <View style={styles.planIcon}>
            <Ionicons name="wifi" size={19} color="#FFFFFF" />
          </View>
          <View style={styles.planCopy}>
            <Text style={styles.planCaption}>PAKET AKTIF</Text>
            <Text style={styles.planTitle}>Home WiFi 20 Mbps</Text>
          </View>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Aktif</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Informasi akun</Text>
        <View style={styles.infoCard}>
          <InfoRow icon="mail-outline" label="Email" value="budi@domain.com" />
          <InfoRow icon="call-outline" label="Nomor HP" value="+62 812-3456-7890" />
          <InfoRow icon="location-outline" label="Alamat pemasangan" value="Jl. Cikutra No. 12, Bandung" last />
        </View>

        <Text style={[styles.sectionTitle, styles.supportHeading]}>Bantuan</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('KeluhanPelanggan')} style={styles.supportCard}>
          <View style={styles.supportIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={19} color="#0F766E" />
          </View>
          <View style={styles.supportCopy}>
            <Text style={styles.supportTitle}>Keluhan & bantuan</Text>
            <Text style={styles.supportSubtitle}>Laporkan kendala layanan internet</Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color="#8A9998" />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => rootNavigation?.reset({ index: 0, routes: [{ name: 'Login' }] })}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={18} color="#B54747" />
          <Text style={styles.logoutText}>Keluar dari akun</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, last = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && styles.lastInfoRow]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={17} color="#0F766E" />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8F8' },
  content: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 28 },
  pageTitle: { color: '#17363B', fontSize: 22, fontWeight: '800', marginBottom: 15 },
  profileCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E6EFED', padding: 19, marginBottom: 13 },
  avatarWrap: { width: 88, height: 88, borderRadius: 44, padding: 3, borderWidth: 2, borderColor: '#BDE5DB', marginBottom: 10 },
  avatar: { width: '100%', height: '100%', borderRadius: 44, backgroundColor: '#DDF3EC' },
  memberMark: { position: 'absolute', right: 2, bottom: 2, width: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F766E', borderWidth: 2, borderColor: '#FFFFFF' },
  name: { color: '#17363B', fontSize: 20, fontWeight: '800' },
  memberLabel: { color: '#788B8D', fontSize: 12, marginTop: 4 },
  customerIdBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EAF7F4', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 6, marginTop: 10 },
  customerIdText: { color: '#0F766E', fontSize: 10, fontWeight: '700' },
  planCard: { minHeight: 70, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F766E', borderRadius: 15, paddingHorizontal: 13, marginBottom: 21 },
  planIcon: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)', marginRight: 10 },
  planCopy: { flex: 1 },
  planCaption: { color: '#BCE6DE', fontSize: 9, fontWeight: '700' },
  planTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginTop: 4 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 18, paddingHorizontal: 8, paddingVertical: 6 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9EF0C1' },
  activeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  sectionTitle: { color: '#244247', fontSize: 15, fontWeight: '800', marginBottom: 10 },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 15, borderWidth: 1, borderColor: '#E6EFED', paddingHorizontal: 13 },
  infoRow: { minHeight: 65, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEF2F1' },
  lastInfoRow: { borderBottomWidth: 0 },
  infoIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF7F4', marginRight: 10 },
  infoCopy: { flex: 1 },
  infoLabel: { color: '#879798', fontSize: 10 },
  infoValue: { color: '#294449', fontSize: 12, fontWeight: '600', marginTop: 4 },
  supportHeading: { marginTop: 21 },
  supportCard: { minHeight: 68, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 15, borderWidth: 1, borderColor: '#E6EFED', paddingHorizontal: 12 },
  supportIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF7F4', marginRight: 10 },
  supportCopy: { flex: 1 },
  supportTitle: { color: '#294449', fontSize: 12, fontWeight: '700' },
  supportSubtitle: { color: '#879798', fontSize: 10, marginTop: 4 },
  logoutButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 13, borderWidth: 1, borderColor: '#F1DADA', marginTop: 20 },
  logoutText: { color: '#B54747', fontSize: 12, fontWeight: '700' },
});