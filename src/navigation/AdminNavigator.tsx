
import React from 'react';
import { createNativeStackNavigator } from
  '@react-navigation/native-stack';

import DashboardAdmin from '../screens/admin/DashboardAdmin';
import DataPelangganAdminScreen from '../screens/admin/DataPelangganAdminScreen';
import DataPegawaiAdminScreen from '../screens/admin/DataPegawaiAdminScreen';
import DataTagihanAdminScreen from '../screens/admin/DataTagihanAdminScreen';
import KeuanganAdminScreen from '../screens/admin/KeuanganAdminScreen';
import type { AdminStackParamList } from './adminTypes';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#F7F9FC' },
        headerTintColor: '#172B45',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#F7F9FC' },
      }}
    >
      <Stack.Screen
        name="DashboardAdmin"
        component={DashboardAdmin}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="DataPelangganAdmin" component={DataPelangganAdminScreen} options={{ title: 'Data Pelanggan' }} />
      <Stack.Screen name="DataPegawaiAdmin" component={DataPegawaiAdminScreen} options={{ title: 'Data Pegawai' }} />
      <Stack.Screen name="DataTagihanAdmin" component={DataTagihanAdminScreen} options={{ title: 'Data Tagihan' }} />
      <Stack.Screen name="KeuanganAdmin" component={KeuanganAdminScreen} options={{ title: 'Keuangan' }} />
    </Stack.Navigator>
  );
}
