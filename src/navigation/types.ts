import type { NavigatorScreenParams } from '@react-navigation/native';
import type { AdminStackParamList } from './adminTypes';

export type PegawaiTabParamList = {
  DashboardPegawai: undefined;
  DataPelanggan: undefined;
  GangguanPegawai: undefined;
  KunjunganPegawai: undefined;
  ProfilPegawai: undefined;
};

export type PelangganTabParamList = {
  HomePelanggan: undefined;
  TagihanPelanggan: undefined;
  RiwayatPembayaran: undefined;
  KeluhanPelanggan: undefined;
  ProfilPelanggan: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Admin: NavigatorScreenParams<AdminStackParamList> | undefined;
  PegawaiTabs: NavigatorScreenParams<PegawaiTabParamList> | undefined;
  PelangganTabs: NavigatorScreenParams<PelangganTabParamList> | undefined;
  BayarTagihan: undefined;
  PembayaranPegawai: undefined;
};