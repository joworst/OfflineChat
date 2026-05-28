import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function DeviceCard({ name, rssi, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.rssi}>Signal: {rssi} dBm</Text>
      </View>
      <Text style={styles.arrow}>{'>'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  rssi: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  arrow: {
    fontSize: 18,
    color: '#888',
  },
});
