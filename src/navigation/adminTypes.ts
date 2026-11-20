import type { NavigatorScreenParams } from '@react-navigation/native';

export type AdminTabParamList = {
  DashboardAdmin: undefined;
  DataPenggunaAdmin: undefined;
  DataTagihanAdmin: undefined;
  KeuanganAdmin: undefined;
  ProfilAdmin: undefined;
};

export type AdminStackParamList = {
  AdminTabs: NavigatorScreenParams<AdminTabParamList> | undefined;
  DataPegawaiAdmin: undefined;
  PaketAdmin: undefined;
  LaporanAdmin: undefined;
  NotifikasiAdmin: undefined;
  PengaduanAdmin: undefined;
};
