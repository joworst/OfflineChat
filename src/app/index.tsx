import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import DeviceCard from '../components/DeviceCard';
import {
  requestPermissions,
  startScan,
  stopScan,
} from '../services/bluetooth';
import { initDatabase } from '../database/sqlite';

interface Device {
  id: string;
  name: string;
  rssi: number;
  device: any;
}

export default function HomeScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    initDatabase().catch(console.log);
  }, []);

  const handleScan = useCallback(async () => {
    try {
      await requestPermissions();
    } catch (e: any) {
      Alert.alert('Permission refusée', e.message);
      return;
    }

    setScanning(true);
    setDevices([]);

    startScan(
      (device: Device) => {
        setDevices((prev) => {
          const exists = prev.find((d) => d.id === device.id);
          if (exists) {
            return prev.map((d) => (d.id === device.id ? device : d));
          }
          return [...prev, device];
        });
      },
      (error: any) => {
        console.log(error);
        Alert.alert('Erreur scan', error.message);
        setScanning(false);
      }
    );

    setTimeout(() => {
      stopScan();
      setScanning(false);
    }, 10000);
  }, []);

  const handleDevicePress = useCallback((device: Device) => {
    stopScan();
    setScanning(false);
    router.push(`/chat/${encodeURIComponent(device.id)}?name=${encodeURIComponent(device.name)}`);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appareils à proximité</Text>

      {devices.length === 0 && !scanning && (
        <Text style={styles.hint}>Appuie sur "Scanner" pour trouver des appareils</Text>
      )}

      {scanning && devices.length === 0 && (
        <ActivityIndicator size="large" color="#007AFF" style={{ margin: 20 }} />
      )}

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DeviceCard
            name={item.name}
            rssi={item.rssi}
            onPress={() => handleDevicePress(item)}
          />
        )}
        style={styles.list}
      />

      <View style={styles.buttonContainer}>
        <Button
          title={scanning ? 'Scan en cours...' : 'Scanner les appareils'}
          onPress={handleScan}
          disabled={scanning}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 16,
    color: '#1a1a1a',
  },
  hint: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 20,
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
});
