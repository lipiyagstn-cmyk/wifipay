import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
  accentColor: string;
};

export default function RoleTabIcon({ name, color, size, focused, accentColor }: Props) {
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: `${accentColor}14` }]}>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 48,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
});
