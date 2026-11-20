import React, { useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import { api, getApiErrorMessage } from '../../api';
import { getCurrentUser, logout, updateCurrentUser } from '../../auth/authService';
import { isRecord, unwrapApiData } from './adminApiUtils';

type AdminProfile = {
  name: string;
  email: string;
  phone: string;
};

function parseProfile(value: unknown): AdminProfile {
  const unwrapped = unwrapApiData(value);
  if (!isRecord(unwrapped)) throw new Error('Format profil admin dari backend tidak valid.');
  const nested = unwrapped.user ?? unwrapped.admin ?? unwrapped.profile;
  const data = isRecord(nested) ? nested : unwrapped;
  return {
    name: typeof data.name === 'string'
      ? data.name
      : typeof data.nama === 'string'
        ? data.nama
        : '',
    email: typeof data.email === 'string' ? data.email : '',
    phone: typeof data.phone === 'string'
      ? data.phone
      : typeof data.no_hp === 'string'
        ? data.no_hp
        : typeof data.phone_number === 'string'
          ? data.phone_number
          : '',
  };
}

export default function ProfilAdminScreen() {
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();
  const user = getCurrentUser();
  const [profile, setProfile] = useState<AdminProfile>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  });
  const [draft, setDraft] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api.get<unknown>('/admin/profile')
      .then(({ data }) => {
        if (!active) return;
        const nextProfile = parseProfile(data);
        setProfile(nextProfile);
        setDraft(nextProfile);
        updateCurrentUser(nextProfile);
      })
      .catch((error: unknown) => {
        if (active) Alert.alert('Gagal memuat profil', getApiErrorMessage(error));
      });

    return () => {
      active = false;
    };
  }, []);

  const openProfileEditor = () => {
    setDraft(profile);
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!draft.name.trim() || !draft.email.trim()) {
      Alert.alert('Data belum lengkap', 'Nama dan email wajib diisi.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      Alert.alert('Email tidak valid', 'Masukkan alamat email dengan format yang benar.');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/admin/profile', {
        name: draft.name.trim(),
        email: draft.email.trim(),
        no_hp: draft.phone.trim() || null,
      });
      const updatedProfile = {
        name: draft.name.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
      };
      setProfile(updatedProfile);
      setDraft(updatedProfile);
      updateCurrentUser(updatedProfile);
      setEditing(false);
      Alert.alert('Profil diperbarui', 'Perubahan profil berhasil disimpan.');
    } catch (error) {
      Alert.alert('Gagal memperbarui profil', getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const openPasswordEditor = () => {
    setCurrentPassword('');
    setNewPassword('');
    setPasswordConfirmation('');
    setPasswordModalVisible(true);
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
      const { data } = await api.patch<unknown>('/admin/profile/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: passwordConfirmation,
      });
      const message = isRecord(data) && typeof data.message === 'string'
        ? data.message
        : 'Password admin berhasil diperbarui.';
      setPasswordModalVisible(false);
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

  const signOut = () => {
    logout();
    rootNavigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Profil Admin</Text>
        <Text style={styles.pageSubtitle}>Kelola informasi pribadi dan keamanan akun.</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={40} color="#2563EB" />
            </View>
            <View style={styles.onlineMark} />
          </View>
          <Text style={styles.name} numberOfLines={2}>{profile.name || 'Nama belum tersedia'}</Text>
          <Text style={styles.role}>Administrator</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informasi pribadi</Text>
          <TouchableOpacity accessibilityRole="button" onPress={openProfileEditor} style={styles.editLink}>
            <Ionicons name="create-outline" size={16} color="#2563EB" />
            <Text style={styles.editLinkText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <ProfileInfo icon="mail-outline" label="Email" value={profile.email || '-'} />
          <ProfileInfo icon="call-outline" label="Nomor HP" value={profile.phone || '-'} last />
        </View>

        <Text style={[styles.sectionTitle, styles.accountHeading]}>Akun</Text>
        <View style={styles.actionCard}>
          <ActionRow
            icon="lock-closed-outline"
            label="Ubah Password"
            onPress={openPasswordEditor}
          />
          <View style={styles.actionDivider} />
          <ActionRow icon="log-out-outline" label="Logout" destructive onPress={signOut} />
        </View>
      </ScrollView>

      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profil</Text>
              <TouchableOpacity accessibilityLabel="Tutup" onPress={() => setEditing(false)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <EditField
              label="Nama"
              value={draft.name}
              onChangeText={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <EditField
              label="Email"
              value={draft.email}
              keyboardType="email-address"
              onChangeText={(email) => setDraft((current) => ({ ...current, email }))}
            />
            <EditField
              label="Nomor HP"
              value={draft.phone}
              keyboardType="phone-pad"
              onChangeText={(phone) => setDraft((current) => ({ ...current, phone }))}
            />
            <TouchableOpacity
              accessibilityRole="button"
              disabled={saving}
              onPress={() => void saveProfile()}
              style={[styles.modalSubmit, saving && styles.disabledButton]}
            >
              {saving
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.modalSubmitText}>Simpan Perubahan</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!passwordSaving) setPasswordModalVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ubah Password</Text>
              <TouchableOpacity
                accessibilityLabel="Tutup"
                disabled={passwordSaving}
                onPress={() => setPasswordModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <EditField
              label="Password saat ini"
              value={currentPassword}
              secureTextEntry
              onChangeText={setCurrentPassword}
            />
            <EditField
              label="Password baru (minimal 8 karakter)"
              value={newPassword}
              secureTextEntry
              onChangeText={setNewPassword}
            />
            <EditField
              label="Konfirmasi password baru"
              value={passwordConfirmation}
              secureTextEntry
              onChangeText={setPasswordConfirmation}
            />
            <TouchableOpacity
              accessibilityRole="button"
              disabled={passwordSaving}
              onPress={() => void savePassword()}
              style={[styles.modalSubmit, passwordSaving && styles.disabledButton]}
            >
              {passwordSaving
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.modalSubmitText}>Simpan Password</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ProfileInfo({
  icon,
  label,
  value,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && styles.lastRow]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color="#2563EB" />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  destructive = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const color = destructive ? '#C2413B' : '#34495C';
  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} style={styles.actionRow}>
      <Ionicons name={icon} size={19} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={17} color="#A4AFBA" />
    </TouchableOpacity>
  );
}

function EditField({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
}) {
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 30 },
  pageTitle: { color: '#142D47', fontSize: 22, fontWeight: '800' },
  pageSubtitle: { color: '#718096', fontSize: 12, marginTop: 5, marginBottom: 15 },
  profileCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: '#E8EDF3' },
  avatarWrap: { width: 92, height: 92, borderRadius: 46, padding: 3, borderWidth: 2, borderColor: '#DCE9FF', marginBottom: 11 },
  avatar: { width: '100%', height: '100%', borderRadius: 46, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  onlineMark: { position: 'absolute', right: 3, bottom: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#22A06B', borderWidth: 3, borderColor: '#FFFFFF' },
  name: { color: '#172F49', fontSize: 20, fontWeight: '800', textAlign: 'center' },
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
  infoValue: { color: '#294057', fontSize: 13, fontWeight: '600', marginTop: 4, flexShrink: 1 },
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
  disabledButton: { opacity: 0.7 },
  modalSubmitText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
