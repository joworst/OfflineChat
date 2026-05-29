import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import DeviceCard from '../components/DeviceCard';
import {
  requestPermissions,
  startScan,
  stopScan,
} from '../services/bluetooth';
import { initDatabase } from '../database/sqlite';
import { getProfile, saveProfile, generateDefaultProfile } from '../services/profile';
import { darkTheme } from '../theme/colors';

interface Device {
  id: string;
  name: string;
  rssi: number;
  device: any;
}

interface Profile {
  pseudo: string;
  color: string;
  avatar: string;
}

export default function HomeScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    initDatabase().catch(console.log);
    loadProfile();
  }, []);

  const loadProfile = async () => {
    let p = await getProfile();
    if (!p) {
      p = generateDefaultProfile();
      await saveProfile(p);
    }
    setProfile(p);
    setProfileReady(true);
  };

  const handleScan = useCallback(async () => {
    try {
      await requestPermissions();
    } catch (e: any) {
      Alert.alert('Permission refusee', e.message);
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
    }, 15000);
  }, []);

  const handleDevicePress = useCallback((device: Device) => {
    stopScan();
    setScanning(false);
    router.push(
      `/chat/${encodeURIComponent(device.id)}?name=${encodeURIComponent(device.name)}&myName=${encodeURIComponent(profile?.pseudo || '')}&myColor=${encodeURIComponent(profile?.color || '#00D4FF')}`
    );
  }, [profile]);

  if (!profileReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={darkTheme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {}
      <View style={styles.profileBar}>
        <View style={[styles.profileAvatar, { backgroundColor: profile?.color || darkTheme.primary }]}>
          <Text style={styles.profileInitial}>
            {(profile?.pseudo || '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profilePseudo}>{profile?.pseudo}</Text>
          <Text style={styles.profileLabel}>Mon profil</Text>
        </View>
        <View style={styles.statusDot} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Appareils a proximite</Text>
        {scanning && (
          <View style={styles.scanningBadge}>
            <ActivityIndicator size="small" color={darkTheme.primary} style={{ marginRight: 6 }} />
            <Text style={styles.scanningText}>Scan en cours...</Text>
          </View>
        )}
      </View>

      {devices.length === 0 && !scanning && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>[]</Text>
          </View>
          <Text style={styles.emptyText}>Aucun appareil trouve</Text>
          <Text style={styles.emptyHint}>Appuie sur le bouton ci-dessous pour scanner</Text>
        </View>
      )}

      {scanning && devices.length === 0 && (
        <View style={styles.emptyScanning}>
          <ActivityIndicator size="large" color={darkTheme.primary} />
          <Text style={styles.scanningLabel}>Recherche d'appareils...</Text>
        </View>
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
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.scanButton, scanning && styles.scanButtonActive]}
          onPress={handleScan}
          disabled={scanning}
          activeOpacity={0.8}
        >
          <View style={[styles.scanButtonInner, scanning && styles.scanButtonInnerActive]}>
            <Text style={[styles.scanButtonIcon]}>+</Text>
            <Text style={styles.scanButtonText}>
              {scanning ? 'Scan en cours...' : 'Scanner les appareils'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: darkTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#0D0D0D',
    fontSize: 18,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profilePseudo: {
    color: darkTheme.text,
    fontSize: 17,
    fontWeight: '600',
  },
  profileLabel: {
    color: darkTheme.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: darkTheme.success,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: darkTheme.text,
    fontSize: 18,
    fontWeight: '700',
  },
  scanningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanningText: {
    color: darkTheme.primary,
    fontSize: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: darkTheme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  emptyIconText: {
    color: darkTheme.primary,
    fontSize: 28,
    opacity: 0.6,
  },
  emptyText: {
    color: darkTheme.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyHint: {
    color: darkTheme.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyScanning: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningLabel: {
    color: darkTheme.primary,
    marginTop: 16,
    fontSize: 14,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  scanButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: darkTheme.primary,
  },
  scanButtonActive: {
    borderColor: darkTheme.primaryDim,
  },
  scanButtonInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: darkTheme.overlay,
  },
  scanButtonInnerActive: {
    backgroundColor: darkTheme.overlay,
  },
  scanButtonIcon: {
    color: darkTheme.primary,
    fontSize: 20,
    marginRight: 10,
    fontWeight: '300',
  },
  scanButtonText: {
    color: darkTheme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
