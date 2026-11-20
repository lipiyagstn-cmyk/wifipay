import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, getApiErrorMessage } from '../../api';
import { findApiList, getText, isRecord } from './adminApiUtils';

type InternetPackage = {
  id: string;
  name: string;
  price: number | null;
  status: 'aktif' | 'nonaktif';
};

function normalizePackage(value: unknown): InternetPackage {
  if (!isRecord(value)) throw new Error('Format paket dari backend tidak valid.');
  const id = getText(value, ['id', 'package_id']);
  const name = getText(value, ['nama', 'name', 'package_name']);
  const rawStatus = getText(value, ['status']).trim().toLowerCase();
  const rawPrice = value.harga ?? value.price;
  const price = typeof rawPrice === 'number'
    ? rawPrice
    : typeof rawPrice === 'string' && rawPrice.trim()
      ? Number(rawPrice)
      : null;
  if (
    !id ||
    !name ||
    (price !== null && (!Number.isFinite(price) || price < 0)) ||
    (rawStatus !== '' && rawStatus !== 'aktif' && rawStatus !== 'nonaktif')
  ) {
    throw new Error('Data paket harus memiliki id, nama, dan harga yang valid.');
  }
  return { id, name, price, status: rawStatus === 'nonaktif' ? 'nonaktif' : 'aktif' };
}

function formatPrice(price: number | null): string {
  return price === null
    ? 'Harga belum diatur'
    : `Rp ${new Intl.NumberFormat('id-ID').format(price)}`;
}

export default function PaketAdminScreen() {
  const [packages, setPackages] = useState<InternetPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<InternetPackage | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [formVisible, setFormVisible] = useState(false);

  const loadPackages = useCallback(async () => {
    try {
      const { data } = await api.get<unknown>('/admin/packages');
      const list = findApiList(data, ['packages', 'paket']);
      if (!list) throw new Error('Format daftar paket dari backend tidak valid.');
      setPackages(list.map(normalizePackage));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages().catch((error: unknown) => {
      Alert.alert('Gagal memuat paket', getApiErrorMessage(error));
    });
  }, [loadPackages]);

  const openForm = (item?: InternetPackage) => {
    setEditing(item ?? null);
    setName(item?.name ?? '');
    setPrice(item?.price == null ? '' : String(item.price));
    setFormVisible(true);
  };

  const savePackage = async () => {
    const trimmedName = name.trim();
    const parsedPrice = Number(price);
    if (!trimmedName || !price.trim() || !Number.isSafeInteger(parsedPrice) || parsedPrice < 0) {
      Alert.alert('Data belum valid', 'Isi nama paket dan harga berupa angka nol atau lebih.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nama: trimmedName,
        harga: parsedPrice,
        status: editing?.status ?? 'aktif',
      };
      if (editing) {
        await api.patch(`/admin/packages/${encodeURIComponent(editing.id)}`, payload);
      } else {
        await api.post('/admin/packages', payload);
      }
      setFormVisible(false);
      try {
        await loadPackages();
      } catch (error) {
        Alert.alert('Paket tersimpan', `Daftar paket gagal dimuat ulang. ${getApiErrorMessage(error)}`);
      }
    } catch (error) {
      Alert.alert('Gagal menyimpan paket', getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const deletePackage = (item: InternetPackage) => {
    Alert.alert('Hapus paket?', `Paket ${item.name} akan dihapus.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await api.delete(`/admin/packages/${encodeURIComponent(item.id)}`);
            } catch (error) {
              Alert.alert('Gagal menghapus paket', getApiErrorMessage(error));
              return;
            }
            try {
              await loadPackages();
            } catch (error) {
              Alert.alert('Paket dihapus', `Daftar paket gagal dimuat ulang. ${getApiErrorMessage(error)}`);
            }
          })();
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <View style={styles.headingText}>
            <Text style={styles.title}>Paket internet</Text>
            <Text style={styles.subtitle}>Data paket dimuat dan dikelola melalui API Laravel.</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={() => openForm()} style={styles.addButton}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {loading ? <ActivityIndicator color="#0F766E" /> : packages.length ? packages.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.packageIcon}><Ionicons name="wifi-outline" size={21} color="#0F766E" /></View>
            <View style={styles.packageCopy}>
              <Text style={styles.packageName}>{item.name}</Text>
              <Text style={styles.packagePrice}>{formatPrice(item.price)}</Text>
            </View>
            <TouchableOpacity accessibilityLabel={`Edit ${item.name}`} onPress={() => openForm(item)} style={styles.iconButton}>
              <Ionicons name="create-outline" size={19} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity accessibilityLabel={`Hapus ${item.name}`} onPress={() => deletePackage(item)} style={styles.iconButton}>
              <Ionicons name="trash-outline" size={18} color="#DC4C4C" />
            </TouchableOpacity>
          </View>
        )) : (
          <View style={styles.empty}>
            <Ionicons name="wifi-outline" size={28} color="#94A3B8" />
            <Text style={styles.emptyText}>Belum ada data paket.</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={formVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!saving) setFormVisible(false);
        }}
      >
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.form}>
            <Text style={styles.formTitle}>{editing ? 'Edit paket' : 'Paket baru'}</Text>
            <Text style={styles.fieldLabel}>Nama paket</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Contoh: 4 Mbps" style={styles.input} />
            <Text style={styles.fieldLabel}>Harga (Rp)</Text>
            <TextInput value={price} onChangeText={setPrice} keyboardType="number-pad" placeholder="60000" style={styles.input} />
            <TouchableOpacity accessibilityRole="button" onPress={savePackage} disabled={saving} style={styles.saveButton}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Simpan</Text>}
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" onPress={() => setFormVisible(false)} disabled={saving} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { padding: 18, paddingBottom: 30 },
  heading: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  headingText: { flex: 1 },
  title: { color: '#172B45', fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#718096', fontSize: 12, lineHeight: 18, marginTop: 4 },
  addButton: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F766E' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EDF3', borderRadius: 15, padding: 13, marginBottom: 10 },
  packageIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EAF7F4', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  packageCopy: { flex: 1 },
  packageName: { color: '#26384E', fontSize: 14, fontWeight: '700' },
  packagePrice: { color: '#718096', fontSize: 12, marginTop: 4 },
  iconButton: { width: 34, height: 38, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', padding: 25, borderRadius: 15 },
  emptyText: { color: '#718096', fontSize: 12 },
  backdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(15,23,42,0.45)' },
  form: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 18 },
  formTitle: { color: '#172B45', fontSize: 18, fontWeight: '800', marginBottom: 17 },
  fieldLabel: { color: '#475569', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#DDE4EC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14, color: '#172B45' },
  saveButton: { minHeight: 43, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', marginTop: 4 },
  saveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  cancelButton: { alignItems: 'center', padding: 12 },
  cancelText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
});
