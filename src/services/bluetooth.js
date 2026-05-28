import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';

const CHAT_SERVICE_UUID = '0000180c-0000-1000-8000-00805f9b34fb';
const CHAT_CHARACTERISTIC_UUID = '0000180d-0000-1000-8000-00805f9b34fb';

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

export async function connectToDevice(deviceInfo, onDisconnect) {
  const bleManager = getManager();
  const device = await bleManager.connectToDevice(deviceInfo.id);
  await device.discoverAllServicesAndCharacteristics();
  device.onDisconnected((error) => {
    if (onDisconnect) onDisconnect(error);
  });
  return device;
}

export async function sendMessage(device, message) {
  const characteristic = await device.writeCharacteristicWithResponseForService(
    CHAT_SERVICE_UUID,
    CHAT_CHARACTERISTIC_UUID,
    btoa(message)
  );
  return characteristic;
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
        const message = atob(characteristic.value);
        onMessage(message);
      }
    }
  );
}
