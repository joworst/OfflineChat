import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import { encrypt, decrypt } from './cryptoService';
import { unwrapMessage, MESSAGE_TYPES } from './transportManager';

const CHAT_SERVICE_UUID = '0000180c-0000-1000-8000-00805f9b34fb';
const CHAT_CHARACTERISTIC_UUID = '0000180d-0000-1000-8000-00805f9b34fb';

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 1000;
const SCAN_TIMEOUT = 15000;

let manager;

export function getManager() {
  if (!manager) {
    manager = new BleManager();
  }
  return manager;
}

export async function requestPermissions() {
  if (Platform.OS === 'android') {
    const apiLevel = Platform.Version;
    if (apiLevel >= 31) {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      const allGranted = Object.values(granted).every(
        (v) => v === PermissionsAndroid.RESULTS.GRANTED
      );
      if (!allGranted) {
        throw new Error('Bluetooth permissions not granted');
      }
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Location permission not granted');
      }
    }
  }
}

export function startScan(onDeviceFound, onError) {
  const bleManager = getManager();
  bleManager.startDeviceScan(
    null,
    null,
    (error, device) => {
      if (error) {
        if (onError) onError(error);
        return;
      }
      if (device && device.name) {
        onDeviceFound({
          id: device.id,
          name: device.name,
          rssi: device.rssi,
          device,
        });
      }
    }
  );
}

export function stopScan() {
  const bleManager = getManager();
  bleManager.stopDeviceScan();
}

export function scanWithTimeout(onDeviceFound, onError) {
  return new Promise((resolve) => {
    const devices = [];
    startScan(
      (device) => {
        const exists = devices.find(d => d.id === device.id);
        if (exists) {
          Object.assign(exists, device);
        } else {
          devices.push(device);
        }
        if (onDeviceFound) onDeviceFound(device);
      },
      onError
    );
    setTimeout(() => {
      stopScan();
      resolve(devices);
    }, SCAN_TIMEOUT);
  });
}

export async function connectToDevice(deviceInfo, onDisconnect) {
  const bleManager = getManager();
  const device = await bleManager.connectToDevice(deviceInfo.id);
  await device.discoverAllServicesAndCharacteristics();
  device.onDisconnected((error) => {
    if (onDisconnect) onDisconnect(error);
  });
  return device;
}

export async function connectWithAutoReconnect(deviceInfo, onStatusChange, onMessage) {
  const MAX_ATTEMPTS = MAX_RECONNECT_ATTEMPTS;
  let attempt = 0;
  let device = null;
  let cancelled = false;

  const tryConnect = async () => {
    while (attempt < MAX_ATTEMPTS && !cancelled) {
      try {
        onStatusChange('connecting');
        device = await connectToDevice(deviceInfo, async (error) => {
          onStatusChange('disconnected');
          if (!cancelled) {
            const delay = RECONNECT_BASE_DELAY * Math.min(Math.pow(2, attempt), 16);
            attempt++;
            await new Promise(r => setTimeout(r, delay));
            if (!cancelled) {
              await tryConnect();
            }
          }
        });
        attempt = 0;
        onStatusChange('connected');
        if (onMessage) {
          await subscribeToMessages(device, onMessage);
        }
        return device;
      } catch (error) {
        attempt++;
        if (attempt >= MAX_ATTEMPTS || cancelled) {
          onStatusChange('disconnected');
          throw error;
        }
        const delay = RECONNECT_BASE_DELAY * Math.min(Math.pow(2, attempt), 16);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    return device;
  };

  const cancel = () => {
    cancelled = true;
    if (device) {
      device.cancelConnection().catch(() => {});
    }
  };

  try {
    device = await tryConnect();
  } catch (error) {
    cancel();
    throw error;
  }

  return { device, cancel };
}

export async function sendRawMessage(device, payload) {
  const encrypted = encrypt(payload);
  await device.writeCharacteristicWithResponseForService(
    CHAT_SERVICE_UUID,
    CHAT_CHARACTERISTIC_UUID,
    btoa(encrypted)
  );
}

export async function sendMessage(device, message) {
  await sendRawMessage(device, message);
}

export async function subscribeToMessages(device, onMessage) {
  await device.monitorCharacteristicForService(
    CHAT_SERVICE_UUID,
    CHAT_CHARACTERISTIC_UUID,
    (error, characteristic) => {
      if (error) {
        console.log('Subscription error:', error);
        return;
      }
      if (characteristic?.value) {
        const encrypted = atob(characteristic.value);
        const decrypted = decrypt(encrypted);
        if (decrypted) {
          const parsed = unwrapMessage(decrypted);
          onMessage(parsed);
        }
      }
    }
  );
}

export function destroyManager() {
  if (manager) {
    manager.destroy();
    manager = null;
  }
}
