import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DataPelangganAdminScreen from './DataPelangganAdminScreen';
import DataPegawaiAdminScreen from './DataPegawaiAdminScreen';

type UserType = 'Pelanggan' | 'Pegawai';

export default function DataPenggunaAdminScreen() {
  const [userType, setUserType] = useState<UserType>('Pelanggan');

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.switcher}>
        {(['Pelanggan', 'Pegawai'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            accessibilityRole="button"
            accessibilityState={{ selected: userType === type }}
            onPress={() => setUserType(type)}
            style={[styles.option, userType === type && styles.optionSelected]}
          >
            <Text style={[styles.optionText, userType === type && styles.optionTextSelected]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {userType === 'Pelanggan'
        ? <DataPelangganAdminScreen applySafeArea={false} />
        : <DataPegawaiAdminScreen applySafeArea={false} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  switcher: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginTop: 12,
    marginBottom: 4,
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#E9EEF5',
  },
  option: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  optionSelected: { backgroundColor: '#FFFFFF' },
  optionText: { color: '#718096', fontSize: 12, fontWeight: '600' },
  optionTextSelected: { color: '#2563EB', fontWeight: '800' },
});
