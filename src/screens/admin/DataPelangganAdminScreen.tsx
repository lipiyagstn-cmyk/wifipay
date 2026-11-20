import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import * as QrImage from 'qrcode';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import {
  createCustomerAccount,
  getCustomers,
  loadCustomers,
  subscribeToCustomers,
  updateCustomer,
  type Customer,
} from '../../customerStore';
import { createCustomerAddressQr } from '../../customerQr';
import { api, getApiErrorMessage } from '../../api';
import { findApiList, getText, isRecord } from './adminApiUtils';

type CustomerStatus = Customer['status'];

export default function DataPelangganAdminScreen({ applySafeArea = true }: { applySafeArea?: boolean }) {
  const customers = useSyncExternalStore(subscribeToCustomers, getCustomers, getCustomers);
  const [formVisible, setFormVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [qrCustomer, setQrCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [packageName, setPackageName] = useState('');
  const [customPackage, setCustomPackage] = useState('');
  const [packageOptions, setPackageOptions] = useState<string[]>([]);
  const [dueDay, setDueDay] = useState('');
  const [homePhotoUri, setHomePhotoUri] = useState<string | null>(null);
  const [status, setStatus] = useState<CustomerStatus>('Aktif');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [qrAction, setQrAction] = useState<'download' | 'print' | null>(null);
  const qrCaptureRef = useRef<ViewShotRef>(null);
  const safeAreaEdges: Edge[] = applySafeArea ? ['top', 'left', 'right'] : [];

  useEffect(() => {
    loadCustomers().catch((error: unknown) => {
      Alert.alert('Gagal memuat pelanggan', getApiErrorMessage(error));
    });
    api.get<unknown>('/admin/packages').then(({ data }) => {
      const list = findApiList(data, ['packages', 'paket']);
      if (!list) throw new Error('Format daftar paket dari backend tidak valid.');
      const options = list
        .filter(isRecord)
        .filter((item) => getText(item, ['status']).trim().toLowerCase() !== 'nonaktif')
        .map((item) => getText(item, ['nama', 'name', 'package_name']).trim())
        .filter(Boolean);
      setPackageOptions(options);
    }).catch((error: unknown) => {
      Alert.alert('Gagal memuat paket', getApiErrorMessage(error));
    });
  }, []);

  const downloadQr = async () => {
    if (!currentQrCustomer || qrAction) return;
    setQrAction('download');

    try {
      const imageUri = await qrCaptureRef.current?.capture();
      if (!imageUri) {
        throw new Error('Gambar QR belum siap. Tutup lalu buka kembali QR pelanggan.');
      }

      let canSaveToGallery = false;
      try {
        const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
        canSaveToGallery = permission.granted;
      } catch (permissionError) {
        console.warn('Izin galeri tidak tersedia; beralih ke menu berbagi:', permissionError);
      }

      if (canSaveToGallery) {
        try {
          await MediaLibrary.createAssetAsync(imageUri);
          Alert.alert('QR tersimpan', `QR ${currentQrCustomer.name} sudah disimpan ke galeri.`);
          return;
        } catch (saveError) {
          console.warn('Gagal menyimpan QR langsung ke galeri; beralih ke menu berbagi:', saveError);
        }
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: `Simpan QR ${currentQrCustomer.name}`,
        });
        Alert.alert('Pilih lokasi penyimpanan', 'Gunakan menu berbagi untuk menyimpan gambar QR ke perangkat.');
        return;
      }

      throw new Error('Menu berbagi tidak tersedia di perangkat ini.');
    } catch (error) {
      console.error('Gagal mengunduh QR pelanggan:', error);
      Alert.alert(
        'Gagal menyimpan QR',
        error instanceof Error ? error.message : 'Gambar QR tidak dapat disimpan ke galeri.',
      );
    } finally {
      setQrAction(null);
    }
  };

  const printQr = async () => {
    if (!currentQrCustomer || qrAction) return;
    setQrAction('print');

    try {
      const svg = await QrImage.toString(createCustomerAddressQr(currentQrCustomer), {
        type: 'svg',
        width: 720,
        margin: 4,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      const escapeHtml = (value: string) => value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

      await Print.printAsync({
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { font-family: Arial, sans-serif; color: #172B45; text-align: center; padding: 32px 20px; }
                h1 { color: #8A96A6; font-size: 14px; letter-spacing: 1px; margin-bottom: 22px; }
                .qr { box-sizing: border-box; width: 180px; height: 180px; margin: 0 auto; padding: 12px; border: 1px solid #E5E7EB; border-radius: 12px; }
                .qr svg { display: block; width: 100%; height: 100%; }
                .id { color: #8794A7; font-size: 12px; font-weight: 700; margin-top: 16px; }
              </style>
            </head>
            <body>
              <h1>QR CODE</h1>
              <div class="qr">${svg}</div>
              <p class="id">${escapeHtml(currentQrCustomer.id)}</p>
            </body>
          </html>
        `,
      });
    } catch (error) {
      console.error('Gagal mencetak QR pelanggan:', error);
      Alert.alert(
        'Gagal mencetak QR',
        error instanceof Error ? error.message : 'Dokumen QR tidak dapat dicetak.',
      );
    } finally {
      setQrAction(null);
    }
  };

  const openNewCustomer = () => {
    setEditingCustomer(null);
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setAddress('');
    setPackageName(packageOptions[0] ?? '');
    setCustomPackage('');
    setDueDay('');
    setHomePhotoUri(null);
    setStatus('Aktif');
    setFormError('');
    setFormVisible(true);
  };

  const openEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setEmail('');
    setPassword('');
    setPhone(customer.phone ?? '');
    setAddress(customer.address);
    setPackageName(packageOptions.includes(customer.package) ? customer.package : '');
    setCustomPackage(packageOptions.includes(customer.package) ? '' : customer.package);
    setDueDay(customer.dueDay ?? '');
    setHomePhotoUri(customer.homePhotoUri);
    setStatus(customer.status);
    setFormError('');
    setFormVisible(true);
  };

  const chooseHomePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Izin foto diperlukan', 'Izinkan akses galeri untuk memilih foto rumah pelanggan.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      const photo = result.assets?.[0];
      if (!result.canceled && photo) {
        const supportedName = !photo.fileName || /\.(jpe?g|png)$/i.test(photo.fileName);
        const supportedType = !photo.mimeType ||
          photo.mimeType === 'image/jpeg' ||
          photo.mimeType === 'image/png';
        if (!supportedName || !supportedType) {
          setFormError('Foto harus berformat JPG, JPEG, atau PNG.');
          return;
        }
        if (photo.fileSize && photo.fileSize > 2 * 1024 * 1024) {
          setFormError('Ukuran foto rumah maksimal 2 MB. Pilih foto yang lebih kecil.');
          return;
        }
        setHomePhotoUri(photo.uri);
        setFormError('');
      }
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  };

  const saveCustomer = async () => {
    const selectedPackage = customPackage.trim() || packageName.trim();
    if (!name.trim() || !address.trim()) {
      setFormError('Nama dan alamat pelanggan wajib diisi.');
      return;
    }
    if (!editingCustomer && (!email.trim() || !email.includes('@') || password.length < 8)) {
      setFormError('Masukkan email yang valid dan kata sandi minimal 8 karakter.');
      return;
    }
    if (!selectedPackage) {
      setFormError('Pilih paket WiFi atau masukkan nama paket lainnya.');
      return;
    }
    if (dueDay.trim() && (!/^\d+$/.test(dueDay) || Number(dueDay) < 1 || Number(dueDay) > 31)) {
      setFormError('Tanggal jatuh tempo harus berupa angka 1 sampai 31.');
      return;
    }

    setSaving(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          ...editingCustomer,
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim(),
          package: selectedPackage,
          dueDay: dueDay.trim() || null,
          homePhotoUri,
          status,
        });
      } else {
        await createCustomerAccount({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          address: address.trim(),
          package: packageName,
          customPackage: customPackage.trim(),
          dueDay,
          status: status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
          homePhotoUri,
        });
      }
      setFormVisible(false);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const currentQrCustomer = qrCustomer
    ? customers.find((customer) => customer.id === qrCustomer.id) ?? qrCustomer
    : null;

  return (
    <SafeAreaView edges={safeAreaEdges} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>Data pelanggan</Text>
            <Text style={styles.subtitle}>Kelola profil, paket, dan QR data pelanggan.</Text>
          </View>
          <View style={styles.totalBadge}>
            <Text style={styles.totalText}>{customers.length} pelanggan</Text>
          </View>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={openNewCustomer}
          style={styles.addButton}
        >
          <Ionicons name="person-add-outline" size={19} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Tambah pelanggan</Text>
        </TouchableOpacity>

        {customers.length ? customers.map((customer) => (
          <View key={customer.id} style={styles.card}>
            <View style={styles.cardHeading}>
              <View style={styles.customerIcon}>
                <Ionicons name="person-outline" size={20} color="#2563EB" />
              </View>
              <View style={styles.customerCopy}>
                <Text style={styles.name}>{customer.name}</Text>
                <Text style={styles.customerId}>{customer.id}</Text>
              </View>
              <Text style={[styles.status, customer.status === 'Aktif' ? styles.active : customer.status === 'Nonaktif' ? styles.inactive : styles.pending]}>
                {customer.status}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="wifi-outline" size={15} color="#64748B" />
              <Text style={styles.meta}>{customer.package || 'Paket belum diatur'}</Text>
            </View>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={17} color="#64748B" />
              <Text style={styles.address}>{customer.address || 'Alamat belum diatur'}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setQrCustomer(customer)}
                style={[styles.actionButton, styles.qrButton]}
              >
                <Ionicons name="qr-code-outline" size={17} color="#2563EB" />
                <Text style={styles.qrText}>QR Data Pelanggan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Edit ${customer.name}`}
                onPress={() => openEditCustomer(customer)}
                style={styles.iconButton}
              >
                <Ionicons name="create-outline" size={19} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>
        )) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={30} color="#94A3B8" />
            <Text style={styles.emptyText}>Belum ada data pelanggan.</Text>
          </View>
        )}
        <Text style={styles.disclaimer}>Data pelanggan dimuat dan disimpan melalui server.</Text>
      </ScrollView>

      <Modal
        visible={formVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFormVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.formCard}>
              <View style={styles.formHeading}>
                <View style={styles.formCopy}>
                  <Text style={styles.formTitle}>{editingCustomer ? 'Edit pelanggan' : 'Pelanggan baru'}</Text>
                  <Text style={styles.formSubtitle}>
                    {editingCustomer
                      ? 'Perbarui profil, paket WiFi, tagihan, dan foto rumah.'
                      : 'Isi informasi pelanggan WiFiPay.'}
                  </Text>
                </View>
                <TouchableOpacity accessibilityLabel="Tutup form" onPress={() => setFormVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color="#475569" />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Nama</Text>
              <TextInput
                accessibilityLabel="Nama pelanggan"
                autoCapitalize="words"
                onChangeText={setName}
                placeholder="Nama lengkap"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={name}
              />
              {!editingCustomer ? (
                <>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    accessibilityLabel="Email pelanggan"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    placeholder="nama@email.com"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    value={email}
                  />
                  <Text style={styles.fieldLabel}>Password</Text>
                  <TextInput
                    accessibilityLabel="Password pelanggan"
                    autoCapitalize="none"
                    onChangeText={setPassword}
                    placeholder="Minimal 8 karakter"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    style={styles.input}
                    value={password}
                  />
                </>
              ) : null}
              <Text style={styles.fieldLabel}>Nomor HP</Text>
              <TextInput
                accessibilityLabel="Nomor HP pelanggan"
                keyboardType="phone-pad"
                onChangeText={setPhone}
                placeholder="08xxxxxxxxxx"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={phone}
              />
              <Text style={styles.fieldLabel}>Alamat pemasangan</Text>
              <TextInput
                accessibilityLabel="Alamat pelanggan"
                autoCapitalize="sentences"
                multiline
                onChangeText={setAddress}
                placeholder="Alamat lengkap pelanggan"
                placeholderTextColor="#94A3B8"
                style={[styles.input, styles.multilineInput]}
                value={address}
              />
              <Text style={styles.fieldLabel}>Paket WiFi</Text>
              {packageOptions.length ? (
                <View style={styles.packageOptions}>
                  {packageOptions.map((item) => (
                    <TouchableOpacity
                      key={item}
                      accessibilityRole="button"
                      accessibilityState={{ selected: packageName === item && !customPackage }}
                      onPress={() => {
                        setPackageName(item);
                        setCustomPackage('');
                      }}
                      style={[styles.choice, styles.packageChoice, packageName === item && !customPackage && styles.selectedChoice]}
                    >
                      <Text style={[styles.choiceText, packageName === item && !customPackage && styles.selectedChoiceText]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.formSubtitle}>Paket tersedia tidak ditemukan; isi nama paket secara manual.</Text>
              )}
              <TextInput
                accessibilityLabel="Paket WiFi lainnya"
                onChangeText={(value) => {
                  setCustomPackage(value);
                  if (value.trim()) setPackageName('');
                }}
                placeholder="Paket lainnya (opsional)"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={customPackage}
              />
              <Text style={styles.fieldLabel}>Tanggal jatuh tempo bulanan</Text>
              <TextInput
                accessibilityLabel="Tanggal jatuh tempo"
                keyboardType="number-pad"
                maxLength={2}
                onChangeText={setDueDay}
                placeholder="Tanggal 1-31"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={dueDay}
              />
              <Text style={styles.fieldLabel}>Foto rumah pelanggan</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => void chooseHomePhoto()} style={styles.photoButton}>
                <Ionicons name="image-outline" size={18} color="#2563EB" />
                <Text style={styles.photoButtonText}>{homePhotoUri ? 'Ganti foto rumah' : 'Pilih foto rumah'}</Text>
              </TouchableOpacity>
              {homePhotoUri ? <Image source={{ uri: homePhotoUri }} style={styles.homePhotoPreview} /> : null}
              {!editingCustomer ? (
                <>
                  <Text style={styles.fieldLabel}>Role</Text>
                  <View style={styles.roleBadge}><Text style={styles.roleText}>Pelanggan</Text></View>
                </>
              ) : null}
              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.choiceRow}>
                {(editingCustomer
                  ? ['Aktif', 'Menunggu', 'Nonaktif'] as const
                  : ['Aktif', 'Nonaktif'] as const
                ).map((item) => (
                  <TouchableOpacity
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected: status === item }}
                    onPress={() => setStatus(item)}
                    style={[styles.choice, status === item && styles.selectedChoice]}
                  >
                    <Text style={[styles.choiceText, status === item && styles.selectedChoiceText]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {formError ? <Text accessibilityRole="alert" style={styles.formError}>{formError}</Text> : null}
              <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={() => void saveCustomer()} style={[styles.saveButton, saving && styles.disabledButton]}>
                <Text style={styles.saveButtonText}>{saving ? 'Menyimpan...' : editingCustomer ? 'Simpan perubahan' : 'Simpan pelanggan'}</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" onPress={() => setFormVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={currentQrCustomer !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setQrCustomer(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.qrCard}>
            <View style={styles.qrHeading}>
              <View style={styles.qrTitleGroup}>
                <Ionicons name="qr-code-outline" size={15} color="#7C3AED" />
                <Text style={styles.qrTitle}>QR CODE</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Tutup QR"
                onPress={() => setQrCustomer(null)}
                style={[styles.closeButton, styles.qrCloseButton]}
              >
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>
            {currentQrCustomer ? (
              <>
                <View style={styles.qrCode}>
                  <ViewShot
                    ref={qrCaptureRef}
                    options={{ format: 'png', quality: 1 }}
                  >
                    <View collapsable={false} style={styles.qrCapture}>
                      <QRCode value={createCustomerAddressQr(currentQrCustomer)} size={142} />
                    </View>
                  </ViewShot>
                </View>
                <Text style={styles.qrCustomerId}>{currentQrCustomer.id}</Text>
                <View style={styles.qrActions}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    disabled={qrAction !== null}
                    onPress={() => void downloadQr()}
                    style={[styles.qrActionButton, styles.downloadButton, qrAction !== null && styles.disabledButton]}
                  >
                    {qrAction === 'download' ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="download-outline" size={17} color="#FFFFFF" />
                    )}
                    <Text style={styles.qrActionText}>Download</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    disabled={qrAction !== null}
                    onPress={() => void printQr()}
                    style={[styles.qrActionButton, styles.printButton, qrAction !== null && styles.disabledButton]}
                  >
                    {qrAction === 'print' ? (
                      <ActivityIndicator size="small" color="#475569" />
                    ) : (
                      <Ionicons name="print-outline" size={15} color="#475569" />
                    )}
                    <Text style={styles.printButtonText}>Cetak</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { padding: 18, paddingBottom: 30 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headingCopy: { flex: 1, paddingRight: 8 },
  title: { color: '#172B45', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#718096', fontSize: 12, lineHeight: 17, marginTop: 4 },
  totalBadge: { backgroundColor: '#EAF2FF', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10 },
  totalText: { color: '#2563EB', fontSize: 10, fontWeight: '700' },
  addButton: { minHeight: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563EB', borderRadius: 12, marginBottom: 14 },
  addButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 11, borderWidth: 1, borderColor: '#EDF0F5' },
  cardHeading: { flexDirection: 'row', alignItems: 'center' },
  customerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  customerCopy: { flex: 1 },
  name: { color: '#172B45', fontSize: 14, fontWeight: '700' },
  customerId: { color: '#94A3B8', fontSize: 10, marginTop: 3 },
  status: { overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, fontWeight: '700', fontSize: 10 },
  active: { backgroundColor: '#DCFCE7', color: '#166534' },
  inactive: { backgroundColor: '#EEF2F6', color: '#64748B' },
  pending: { backgroundColor: '#FEF3C7', color: '#92400E' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  meta: { color: '#64748B', fontSize: 11 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  address: { flex: 1, color: '#475569', fontSize: 11, lineHeight: 17, marginLeft: 6 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  actionButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10 },
  qrButton: { flex: 1, backgroundColor: '#EFF6FF' },
  qrText: { color: '#2563EB', fontSize: 11, fontWeight: '700' },
  iconButton: { width: 40, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F4F7FB' },
  emptyState: { alignItems: 'center', padding: 28, backgroundColor: '#FFFFFF', borderRadius: 15 },
  emptyText: { color: '#718096', fontSize: 12, marginTop: 9 },
  disclaimer: { color: '#9AA6B5', fontSize: 10, textAlign: 'center', marginTop: 9 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 18, backgroundColor: 'rgba(20, 39, 59, 0.48)' },
  modalScroll: { flexGrow: 1, justifyContent: 'center' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 19, padding: 18 },
  formHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 15 },
  formCopy: { flex: 1, paddingRight: 8 },
  formTitle: { color: '#203951', fontSize: 18, fontWeight: '800' },
  formSubtitle: { color: '#718096', fontSize: 11, lineHeight: 16, marginTop: 4 },
  closeButton: { width: 33, height: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', borderRadius: 11 },
  fieldLabel: { color: '#334155', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  input: { minHeight: 42, borderWidth: 1, borderColor: '#D9E2EC', borderRadius: 10, paddingHorizontal: 11, color: '#172B45', fontSize: 12, marginBottom: 13, backgroundColor: '#FBFDFF' },
  multilineInput: { minHeight: 68, paddingTop: 10, textAlignVertical: 'top' },
  choiceRow: { flexDirection: 'row', gap: 7, marginBottom: 14 },
  packageOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
  packageChoice: { flex: 0, minWidth: 92, paddingHorizontal: 10 },
  choice: { flex: 1, minHeight: 37, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  selectedChoice: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  choiceText: { color: '#64748B', fontSize: 10, fontWeight: '700' },
  selectedChoiceText: { color: '#FFFFFF' },
  photoButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, borderWidth: 1, borderColor: '#D9E2EC', marginBottom: 10, backgroundColor: '#F8FBFF' },
  photoButtonText: { color: '#2563EB', fontSize: 11, fontWeight: '700' },
  homePhotoPreview: { width: '100%', height: 170, borderRadius: 10, marginBottom: 13 },
  roleBadge: { alignSelf: 'flex-start', borderRadius: 9, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, marginBottom: 13 },
  roleText: { color: '#2563EB', fontSize: 11, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
  formError: { color: '#B42318', fontSize: 11, marginBottom: 8 },
  saveButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', borderRadius: 11, marginTop: 3 },
  saveButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  cancelButton: { minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#64748B', fontSize: 11, fontWeight: '700' },
  qrCard: { width: '100%', maxWidth: 360, alignSelf: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 22, borderWidth: 1, borderColor: '#EEF0F4' },
  qrHeading: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  qrTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  qrTitle: { color: '#8A96A6', fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  qrCloseButton: { position: 'absolute', right: 0, top: -5 },
  qrCode: { padding: 11, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0F1F5' },
  qrCapture: { width: 144, height: 144, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  qrCustomerId: { color: '#8794A7', fontSize: 10, fontWeight: '700', fontFamily: 'monospace', marginTop: 13 },
  qrActions: { width: '100%', flexDirection: 'row', gap: 8, marginTop: 17 },
  qrActionButton: { flex: 1, minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 9 },
  downloadButton: { backgroundColor: '#7C3AED' },
  printButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  qrActionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  printButtonText: { color: '#475569', fontSize: 11, fontWeight: '700' },
});
