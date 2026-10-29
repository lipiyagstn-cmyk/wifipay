import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
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
import type { PegawaiTabParamList, RootStackParamList } from '../../navigation/types';

type Props = BottomTabScreenProps<PegawaiTabParamList, 'ProfilPegawai'>;
type ProfileField = 'name' | 'email' | 'phone' | 'position' | 'area';

const profileImage = '';

export default function ProfilScreen({ navigation }: Props) {
  const [profile, setProfile] = useState({
    name: 'Rizki Pratama',
    email: 'rizki@wifipay.id',
    phone: '+62 812-3456-7890',
    position: 'Teknisi Jaringan',
    area: 'Bandung Utara',
  });
  const [draft, setDraft] = useState(profile);
  const [modal, setModal] = useState<'profile' | 'password' | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const rootNavigation = navigation.getParent<NavigationProp<RootStackParamList>>();

  const openProfileEditor = () => {
    setDraft(profile);
    setModal('profile');
  };

  const saveProfile = () => {
    if (!draft.name.trim() || !draft.email.trim() || !draft.phone.trim()) {
      Alert.alert('Data belum lengkap', 'Nama, email, dan nomor HP wajib diisi.');
      return;
    }
    setProfile(draft);
    setModal(null);
    Alert.alert('Profil diperbarui', 'Perubahan profil berhasil disimpan di perangkat ini.');
  };

  const savePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Data belum lengkap', 'Isi semua kolom password.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Password terlalu pendek', 'Gunakan minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password tidak sama', 'Pastikan konfirmasi password sesuai.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setModal(null);
    Alert.alert('Password diperbarui', 'Perubahan password demo berhasil disimpan di perangkat ini.');
  };

  const logout = () => {
    rootNavigation?.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Profil Pegawai</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: profileImage }} style={styles.avatar} />
            <View style={styles.onlineMark} />
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.role}>{profile.position}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informasi pribadi</Text>
          <TouchableOpacity accessibilityRole="button" onPress={openProfileEditor} style={styles.editLink}>
            <Ionicons name="create-outline" size={16} color="#2563EB" />
            <Text style={styles.editLinkText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <ProfileInfo icon="mail-outline" label="Email" value={profile.email} />
          <ProfileInfo icon="call-outline" label="Nomor HP" value={profile.phone} />
          <ProfileInfo icon="briefcase-outline" label="Jabatan" value={profile.position} />
          <ProfileInfo icon="location-outline" label="Area kerja" value={profile.area} last />
        </View>

        <Text style={[styles.sectionTitle, styles.accountHeading]}>Akun</Text>
        <View style={styles.actionCard}>
          <ActionRow icon="lock-closed-outline" label="Ubah Password" onPress={() => setModal('password')} />
          <View style={styles.actionDivider} />
          <ActionRow icon="log-out-outline" label="Logout" destructive onPress={logout} />
        </View>
      </ScrollView>

      <Modal visible={modal !== null} transparent animationType="fade" onRequestClose={() => setModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modal === 'profile' ? 'Edit Profil' : 'Ubah Password'}</Text>
              <TouchableOpacity accessibilityLabel="Tutup" onPress={() => setModal(null)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {modal === 'profile' ? (
              <>
                <EditField label="Nama" value={draft.name} onChangeText={(name) => setDraft((value) => ({ ...value, name }))} />
                <EditField label="Email" value={draft.email} onChangeText={(email) => setDraft((value) => ({ ...value, email }))} keyboardType="email-address" />
                <EditField label="Nomor HP" value={draft.phone} onChangeText={(phone) => setDraft((value) => ({ ...value, phone }))} keyboardType="phone-pad" />
                <EditField label="Jabatan" value={draft.position} onChangeText={(position) => setDraft((value) => ({ ...value, position }))} />
                <EditField label="Area kerja" value={draft.area} onChangeText={(area) => setDraft((value) => ({ ...value, area }))} />
                <ModalButton label="Simpan Perubahan" onPress={saveProfile} />
              </>
            ) : (
              <>
                <EditField label="Password saat ini" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
                <EditField label="Password baru" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
                <EditField label="Konfirmasi password baru" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
                <ModalButton label="Simpan Password" onPress={savePassword} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ProfileInfo({ icon, label, value, last = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && styles.lastRow]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color="#2563EB" />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({ icon, label, onPress, destructive = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; destructive?: boolean }) {
  const color = destructive ? '#C2413B' : '#34495C';
  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} style={styles.actionRow}>
      <Ionicons name={icon} size={19} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={17} color="#A4AFBA" />
    </TouchableOpacity>
  );
}

function EditField({ label, value, onChangeText, secureTextEntry = false, keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; secureTextEntry?: boolean; keyboardType?: 'default' | 'email-address' | 'phone-pad' }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        autoCorrect={false}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        style={styles.fieldInput}
      />
    </View>
  );
}

function ModalButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} style={styles.modalSubmit}>
      <Text style={styles.modalSubmitText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FB' },
  content: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 30 },
  pageTitle: { color: '#142D47', fontSize: 22, fontWeight: '800', marginBottom: 15 },
  profileCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: '#E8EDF3' },
  avatarWrap: { width: 92, height: 92, borderRadius: 46, padding: 3, borderWidth: 2, borderColor: '#DCE9FF', marginBottom: 11 },
  avatar: { width: '100%', height: '100%', borderRadius: 46, backgroundColor: '#DBEAFE' },
  onlineMark: { position: 'absolute', right: 3, bottom: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#22A06B', borderWidth: 3, borderColor: '#FFFFFF' },
  name: { color: '#172F49', fontSize: 20, fontWeight: '800' },
  role: { color: '#718096', fontSize: 13, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 23, marginBottom: 10 },
  sectionTitle: { color: '#203951', fontSize: 15, fontWeight: '800' },
  editLink: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 5 },
  editLinkText: { color: '#2563EB', fontSize: 12, fontWeight: '700' },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E8EDF3' },
  infoRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EFF2F6' },
  lastRow: { borderBottomWidth: 0 },
  infoIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#EFF5FF', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  infoCopy: { flex: 1 },
  infoLabel: { color: '#8794A4', fontSize: 10 },
  infoValue: { color: '#294057', fontSize: 13, fontWeight: '600', marginTop: 4 },
  accountHeading: { marginTop: 23, marginBottom: 10 },
  actionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E8EDF3' },
  actionRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 11 },
  actionLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  actionDivider: { height: 1, backgroundColor: '#EFF2F6' },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(16, 35, 55, 0.42)' },
  modalCard: { maxHeight: '88%', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  modalTitle: { color: '#172F49', fontSize: 18, fontWeight: '800' },
  closeButton: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#F2F5F8', alignItems: 'center', justifyContent: 'center' },
  fieldGroup: { marginBottom: 11 },
  fieldLabel: { color: '#526477', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  fieldInput: { height: 44, borderWidth: 1, borderColor: '#DCE4ED', backgroundColor: '#FBFCFE', borderRadius: 10, paddingHorizontal: 11, color: '#1C344D', fontSize: 13 },
  modalSubmit: { height: 47, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', borderRadius: 11, marginTop: 6 },
  modalSubmitText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});