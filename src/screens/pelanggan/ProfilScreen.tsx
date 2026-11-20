import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NavigationProp } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { PelangganTabParamList, RootStackParamList } from '../../navigation/types';
import { api, getApiErrorMessage } from '../../api';
import { getCurrentCustomerId, getCurrentUser, logout, updateCurrentUser } from '../../auth/authService';
import { getCustomer, loadCustomer, subscribeToCustomers } from '../../customerStore';

type Props = BottomTabScreenProps<PelangganTabParamList, 'ProfilPelanggan'>;

export default function ProfilPelangganScreen({ navigation }: Props) {
  const rootNavigation = navigation.getParent<NavigationProp<RootStackParamList>>();
  const customerId = getCurrentCustomerId();
  const customer = useSyncExternalStore(
    subscribeToCustomers,
    () => getCustomer(customerId),
    () => getCustomer(customerId),
  );
  const user = getCurrentUser();
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    address: '',
  });
  const [passwordEditing, setPasswordEditing] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  useEffect(() => {
    if (!customerId) return;
    loadCustomer(customerId).catch((error: unknown) => {
      Alert.alert('Gagal memuat profil', getApiErrorMessage(error));
    });
  }, [customerId]);

  const openProfileEditor = () => {
    setProfileDraft({
      name: customer?.name ?? user?.name ?? '',
      email: user?.email ?? '',
      phone: customer?.phone ?? '',
      address: customer?.address ?? '',
    });
    setProfileEditing(true);
  };

  const saveProfile = async () => {
    const name = profileDraft.name.trim();
    const email = profileDraft.email.trim();
    if (!name || !email) {
      Alert.alert('Data belum lengkap', 'Nama dan email wajib diisi.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Email tidak valid', 'Masukkan alamat email dengan format yang benar.');
      return;
    }

    setProfileSaving(true);
    try {
      await api.patch('/customer/profile', {
        name,
        email,
        no_hp: profileDraft.phone.trim() || null,
        alamat: profileDraft.address.trim() || null,
      });
      updateCurrentUser({ name, email, phone: profileDraft.phone.trim() });
      if (customerId) await loadCustomer(customerId);
      setProfileEditing(false);
      Alert.alert('Profil diperbarui', 'Perubahan profil berhasil disimpan.');
    } catch (error) {
      Alert.alert('Gagal memperbarui profil', getApiErrorMessage(error));
    } finally {
      setProfileSaving(false);
    }
  };

  const openPasswordEditor = () => {
    setCurrentPassword('');
    setNewPassword('');
    setPasswordConfirmation('');
    setPasswordEditing(true);
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword || !passwordConfirmation) {
      Alert.alert('Data belum lengkap', 'Isi password saat ini, password baru, dan konfirmasi password.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Password belum valid', 'Password baru harus terdiri dari minimal 8 karakter.');
      return;
    }
    if (newPassword !== passwordConfirmation) {
      Alert.alert('Konfirmasi tidak cocok', 'Password baru dan konfirmasi password harus sama.');
      return;
    }

    setPasswordSaving(true);
    try {
      const { data } = await api.patch<unknown>('/customer/profile/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: passwordConfirmation,
      });
      const message = typeof data === 'object' && data !== null &&
        'message' in data && typeof data.message === 'string'
        ? data.message
        : 'Kata sandi pelanggan berhasil diperbarui.';
      setPasswordEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordConfirmation('');
      Alert.alert('Password diperbarui', message);
    } catch (error) {
      Alert.alert('Gagal mengubah password', getApiErrorMessage(error));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Profil Saya</Text>
        <Text style={styles.pageSubtitle}>Informasi akun dan layanan internet Anda.</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={40} color="#0F766E" />
            </View>
            <View style={styles.memberMark}>
              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.name} numberOfLines={2}>{customer?.name ?? user?.name ?? '-'}</Text>
          <Text style={styles.memberLabel}>Pelanggan WiFiPay</Text>
          <View style={styles.customerIdBadge}>
            <Ionicons name="wifi-outline" size={13} color="#0F766E" />
            <Text style={styles.customerIdText}>ID {customer?.id ?? customerId ?? '-'}</Text>
          </View>
        </View>

        <View style={styles.planCard}>
          <View style={styles.planIcon}>
            <Ionicons name="wifi" size={19} color="#FFFFFF" />
          </View>
          <View style={styles.planCopy}>
            <Text style={styles.planCaption}>PAKET AKTIF</Text>
            <Text style={styles.planTitle} numberOfLines={2}>{customer?.package ?? '-'}</Text>
          </View>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>{customer?.status ?? '-'}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informasi akun</Text>
          <TouchableOpacity accessibilityRole="button" onPress={openProfileEditor} style={styles.editButton}>
            <Ionicons name="create-outline" size={16} color="#0F766E" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.infoCard}>
          <InfoRow icon="mail-outline" label="Email" value={user?.email ?? '-'} />
          <InfoRow icon="call-outline" label="Nomor HP" value={customer?.phone ?? '-'} />
          <InfoRow icon="location-outline" label="Alamat pemasangan" value={customer?.address ?? '-'} last />
        </View>

        <Text style={[styles.sectionTitle, styles.supportHeading]}>Keamanan akun</Text>
        <TouchableOpacity accessibilityRole="button" onPress={openPasswordEditor} style={styles.securityCard}>
          <Ionicons name="lock-closed-outline" size={19} color="#0F766E" />
          <Text style={styles.securityText}>Ubah Password</Text>
          <Ionicons name="chevron-forward" size={17} color="#8A9998" />
        </TouchableOpacity>

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
          onPress={() => {
            logout();
            rootNavigation?.reset({ index: 0, routes: [{ name: 'Login' }] });
          }}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={18} color="#B54747" />
          <Text style={styles.logoutText}>Keluar dari akun</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={profileEditing} transparent animationType="fade" onRequestClose={() => setProfileEditing(false)}>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profil</Text>
                <TouchableOpacity accessibilityLabel="Tutup" onPress={() => setProfileEditing(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
              <ProfileField label="Nama" value={profileDraft.name} onChangeText={(name) => setProfileDraft((value) => ({ ...value, name }))} />
              <ProfileField label="Email" value={profileDraft.email} keyboardType="email-address" onChangeText={(email) => setProfileDraft((value) => ({ ...value, email }))} />
              <ProfileField label="Nomor HP" value={profileDraft.phone} keyboardType="phone-pad" onChangeText={(phone) => setProfileDraft((value) => ({ ...value, phone }))} />
              <ProfileField label="Alamat pemasangan" value={profileDraft.address} multiline onChangeText={(address) => setProfileDraft((value) => ({ ...value, address }))} />
              <TouchableOpacity accessibilityRole="button" disabled={profileSaving} onPress={() => void saveProfile()} style={[styles.submitButton, profileSaving && styles.disabledButton]}>
                {profileSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Simpan Perubahan</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={passwordEditing} transparent animationType="fade" onRequestClose={() => {
        if (!passwordSaving) setPasswordEditing(false);
      }}>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ubah Password</Text>
                <TouchableOpacity accessibilityLabel="Tutup" disabled={passwordSaving} onPress={() => setPasswordEditing(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
              <ProfileField label="Password saat ini" value={currentPassword} secureTextEntry onChangeText={setCurrentPassword} />
              <ProfileField label="Password baru (minimal 8 karakter)" value={newPassword} secureTextEntry onChangeText={setNewPassword} />
              <ProfileField label="Konfirmasi password baru" value={passwordConfirmation} secureTextEntry onChangeText={setPasswordConfirmation} />
              <TouchableOpacity accessibilityRole="button" disabled={passwordSaving} onPress={() => void savePassword()} style={[styles.submitButton, passwordSaving && styles.disabledButton]}>
                {passwordSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Simpan Password</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ProfileField({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        autoCorrect={false}
        keyboardType={keyboardType}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        style={[styles.fieldInput, multiline && styles.multilineInput]}
      />
    </View>
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
        <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 28 },
  pageTitle: { color: '#17363B', fontSize: 22, fontWeight: '800' },
  pageSubtitle: { color: '#788B8D', fontSize: 12, marginTop: 5, marginBottom: 15 },
  profileCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E6EFED', padding: 19, marginBottom: 13 },
  avatarWrap: { width: 88, height: 88, borderRadius: 44, padding: 3, borderWidth: 2, borderColor: '#BDE5DB', marginBottom: 10 },
  avatar: { width: '100%', height: '100%', borderRadius: 44, backgroundColor: '#DDF3EC', alignItems: 'center', justifyContent: 'center' },
  memberMark: { position: 'absolute', right: 2, bottom: 2, width: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F766E', borderWidth: 2, borderColor: '#FFFFFF' },
  name: { color: '#17363B', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  memberLabel: { color: '#788B8D', fontSize: 12, marginTop: 4 },
  customerIdBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EAF7F4', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 6, marginTop: 10 },
  customerIdText: { color: '#0F766E', fontSize: 10, fontWeight: '700' },
  planCard: { minHeight: 70, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F766E', borderRadius: 15, paddingHorizontal: 13, marginBottom: 21 },
  planIcon: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)', marginRight: 10 },
  planCopy: { flex: 1, flexShrink: 1, marginRight: 8 },
  planCaption: { color: '#BCE6DE', fontSize: 9, fontWeight: '700' },
  planTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginTop: 4 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 18, paddingHorizontal: 8, paddingVertical: 6 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9EF0C1' },
  activeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  sectionTitle: { color: '#244247', fontSize: 15, fontWeight: '800', marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 5, marginBottom: 10 },
  editButtonText: { color: '#0F766E', fontSize: 12, fontWeight: '700' },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 15, borderWidth: 1, borderColor: '#E6EFED', paddingHorizontal: 13 },
  infoRow: { minHeight: 65, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEF2F1' },
  lastInfoRow: { borderBottomWidth: 0 },
  infoIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF7F4', marginRight: 10 },
  infoCopy: { flex: 1 },
  infoLabel: { color: '#879798', fontSize: 10 },
  infoValue: { color: '#294449', fontSize: 12, fontWeight: '600', marginTop: 4, flexShrink: 1 },
  supportHeading: { marginTop: 21 },
  securityCard: { minHeight: 55, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 15, borderWidth: 1, borderColor: '#E6EFED', paddingHorizontal: 14 },
  securityText: { flex: 1, color: '#294449', fontSize: 12, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(16, 35, 55, 0.42)' },
  modalScroll: { flexGrow: 1, justifyContent: 'center' },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  modalTitle: { color: '#17363B', fontSize: 18, fontWeight: '800' },
  closeButton: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#F2F5F8', alignItems: 'center', justifyContent: 'center' },
  fieldGroup: { marginBottom: 11 },
  fieldLabel: { color: '#526477', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  fieldInput: { minHeight: 44, borderWidth: 1, borderColor: '#DCE4ED', backgroundColor: '#FBFCFE', borderRadius: 10, paddingHorizontal: 11, color: '#1C344D', fontSize: 13 },
  multilineInput: { minHeight: 70, paddingTop: 10, textAlignVertical: 'top' },
  submitButton: { minHeight: 47, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F766E', borderRadius: 11, marginTop: 6 },
  submitButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  disabledButton: { opacity: 0.7 },
  supportCard: { minHeight: 68, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 15, borderWidth: 1, borderColor: '#E6EFED', paddingHorizontal: 12 },
  supportIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF7F4', marginRight: 10 },
  supportCopy: { flex: 1 },
  supportTitle: { color: '#294449', fontSize: 12, fontWeight: '700' },
  supportSubtitle: { color: '#879798', fontSize: 10, marginTop: 4 },
  logoutButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 13, borderWidth: 1, borderColor: '#F1DADA', marginTop: 20 },
  logoutText: { color: '#B54747', fontSize: 12, fontWeight: '700' },
});