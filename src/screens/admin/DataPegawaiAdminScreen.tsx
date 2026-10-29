import React, { useState, useSyncExternalStore } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  subscribeToEmployees,
  updateEmployee,
  type Employee,
} from '../../employeeStore';

export default function DataPegawaiAdminScreen() {
  const employees = useSyncExternalStore(subscribeToEmployees, getEmployees, getEmployees);
  const [formVisible, setFormVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [area, setArea] = useState('');
  const [status, setStatus] = useState<Employee['status']>('Aktif');
  const [formError, setFormError] = useState('');

  const openNewEmployee = () => {
    setEditingEmployee(null);
    setName('');
    setPosition('');
    setArea('');
    setStatus('Aktif');
    setFormError('');
    setFormVisible(true);
  };

  const openEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setName(employee.name);
    setPosition(employee.position);
    setArea(employee.area);
    setStatus(employee.status);
    setFormError('');
    setFormVisible(true);
  };

  const saveEmployee = () => {
    if (!name.trim() || !position.trim() || !area.trim()) {
      setFormError('Nama, jabatan, dan area layanan wajib diisi.');
      return;
    }

    const employeeData = {
      name: name.trim(),
      position: position.trim(),
      area: area.trim(),
      status,
    };
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, employeeData);
    } else {
      createEmployee(employeeData);
    }
    setFormVisible(false);
  };

  const confirmDelete = (employee: Employee) => {
    Alert.alert(
      'Hapus pegawai?',
      `Data ${employee.name} akan dihapus dari daftar pegawai.`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => deleteEmployee(employee.id) },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>Tim operasional</Text>
            <Text style={styles.subtitle}>Kelola pegawai, jabatan, dan area layanan.</Text>
          </View>
          <View style={styles.totalBadge}>
            <Text style={styles.totalText}>{employees.length} pegawai</Text>
          </View>
        </View>

        <TouchableOpacity accessibilityRole="button" onPress={openNewEmployee} style={styles.addButton}>
          <Ionicons name="person-add-outline" size={19} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Tambah pegawai</Text>
        </TouchableOpacity>

        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Ionicons name="people-outline" size={22} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.summaryValue}>{employees.filter((employee) => employee.status === 'Aktif').length} pegawai aktif</Text>
            <Text style={styles.summaryCaption}>Dari {employees.length} pegawai terdaftar</Text>
          </View>
        </View>

        <View style={styles.listHeading}>
          <Text style={styles.sectionTitle}>Daftar pegawai</Text>
          <Text style={styles.count}>{employees.length} orang</Text>
        </View>
        {employees.length ? employees.map((employee, index) => {
          const palette = [
            { color: '#2563EB', background: '#EAF2FF', icon: 'construct-outline' as const },
            { color: '#7C3AED', background: '#F2EBFF', icon: 'headset-outline' as const },
            { color: '#059669', background: '#E7F7F1', icon: 'wifi-outline' as const },
          ][index % 3];

          return (
            <View key={employee.id} style={styles.card}>
              <View style={[styles.avatar, { backgroundColor: palette.background }]}>
                <Ionicons name={palette.icon} size={22} color={palette.color} />
              </View>
              <View style={styles.details}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{employee.name}</Text>
                  <Text style={[styles.status, employee.status === 'Aktif' ? styles.active : styles.inactive]}>
                    {employee.status}
                  </Text>
                </View>
                <Text style={styles.position}>{employee.position}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color="#8A96A6" />
                  <Text style={styles.meta}>{employee.area}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.employeeId}>{employee.id}</Text>
                  <View style={styles.rowActions}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${employee.name}`}
                      onPress={() => openEditEmployee(employee)}
                      style={styles.iconButton}
                    >
                      <Ionicons name="create-outline" size={18} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Hapus ${employee.name}`}
                      onPress={() => confirmDelete(employee)}
                      style={styles.iconButton}
                    >
                      <Ionicons name="trash-outline" size={17} color="#DC4C4C" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        }) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={30} color="#94A3B8" />
            <Text style={styles.emptyText}>Belum ada data pegawai.</Text>
          </View>
        )}
        <Text style={styles.disclaimer}>Data disimpan lokal di perangkat selama aplikasi berjalan.</Text>
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
                  <Text style={styles.formTitle}>{editingEmployee ? 'Edit pegawai' : 'Pegawai baru'}</Text>
                  <Text style={styles.formSubtitle}>Isi data untuk tim operasional.</Text>
                </View>
                <TouchableOpacity accessibilityLabel="Tutup form" onPress={() => setFormVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color="#475569" />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Nama</Text>
              <TextInput
                accessibilityLabel="Nama pegawai"
                autoCapitalize="words"
                onChangeText={setName}
                placeholder="Nama lengkap"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={name}
              />
              <Text style={styles.fieldLabel}>Jabatan</Text>
              <TextInput
                accessibilityLabel="Jabatan pegawai"
                autoCapitalize="sentences"
                onChangeText={setPosition}
                placeholder="Contoh: Teknisi jaringan"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={position}
              />
              <Text style={styles.fieldLabel}>Area layanan</Text>
              <TextInput
                accessibilityLabel="Area layanan pegawai"
                autoCapitalize="sentences"
                onChangeText={setArea}
                placeholder="Contoh: Cibeunying · Bandung"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={area}
              />
              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.choiceRow}>
                {(['Aktif', 'Nonaktif'] as const).map((item) => (
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
              <TouchableOpacity accessibilityRole="button" onPress={saveEmployee} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>{editingEmployee ? 'Simpan perubahan' : 'Simpan pegawai'}</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" onPress={() => setFormVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  addButton: { minHeight: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563EB', borderRadius: 12, marginBottom: 13 },
  addButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  summary: { minHeight: 76, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 14, marginBottom: 21, borderWidth: 1, borderColor: '#EDF0F5' },
  summaryIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF2FF', marginRight: 12 },
  summaryValue: { color: '#172B45', fontSize: 14, fontWeight: '800' },
  summaryCaption: { color: '#8A96A6', fontSize: 10, marginTop: 4 },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  sectionTitle: { color: '#172B45', fontSize: 16, fontWeight: '800' },
  count: { color: '#7B8797', fontSize: 11, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 13, marginBottom: 10, borderWidth: 1, borderColor: '#EDF0F5' },
  avatar: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  details: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  name: { flex: 1, color: '#26384E', fontSize: 13, fontWeight: '700' },
  status: { overflow: 'hidden', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: '700' },
  active: { color: '#16804A', backgroundColor: '#E8F6EE' },
  inactive: { color: '#64748B', backgroundColor: '#EEF2F6' },
  position: { color: '#64748B', fontSize: 11, marginTop: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  meta: { color: '#7B8797', fontSize: 10, marginLeft: 4 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  employeeId: { color: '#A0AAB8', fontSize: 9 },
  rowActions: { flexDirection: 'row', gap: 6 },
  iconButton: { width: 31, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#F4F7FB' },
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
  choiceRow: { flexDirection: 'row', gap: 7, marginBottom: 14 },
  choice: { flex: 1, minHeight: 37, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  selectedChoice: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  choiceText: { color: '#64748B', fontSize: 10, fontWeight: '700' },
  selectedChoiceText: { color: '#FFFFFF' },
  formError: { color: '#B42318', fontSize: 11, marginBottom: 8 },
  saveButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', borderRadius: 11, marginTop: 3 },
  saveButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  cancelButton: { minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#64748B', fontSize: 11, fontWeight: '700' },
});
