import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { darkTheme } from '../theme/colors';

export default function DeviceCard({ name, rssi, onPress }) {
  const signalStrength = rssi >= -50 ? 'Fort' : rssi >= -70 ? 'Moyen' : 'Faible';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <View style={styles.avatarDot} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.rssi}>
          Signal: {signalStrength} ({rssi} dBm)
        </Text>
      </View>
      <Text style={styles.arrow}>&gt;</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: darkTheme.card,
    padding: 16,
    marginVertical: 5,
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: darkTheme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: darkTheme.primary,
    opacity: 0.8,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
  },
  rssi: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginTop: 3,
  },
  arrow: {
    fontSize: 20,
    color: darkTheme.textMuted,
    fontWeight: '300',
  },
});
