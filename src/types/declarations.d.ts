declare module 'expo-router';

declare module 'react-native-ble-plx' {
  import { Device } from 'react-native-ble-plx';
  export class BleManager {
    constructor();
    startDeviceScan(
      serviceUUIDs: string[] | null,
      options: any | null,
      callback: (error: any | null, device: Device | null) => void
    ): void;
    stopDeviceScan(): void;
    connectToDevice(deviceId: string): Promise<Device>;
  }
  export interface Device {
    id: string;
    name: string | null;
    rssi: number | null;
    onDisconnected(callback: (error: any | null) => void): void;
    discoverAllServicesAndCharacteristics(): Promise<Device>;
    writeCharacteristicWithResponseForService(
      serviceUUID: string,
      characteristicUUID: string,
      value: string
    ): Promise<any>;
    monitorCharacteristicForService(
      serviceUUID: string,
      characteristicUUID: string,
      callback: (error: any | null, characteristic: any | null) => void
    ): Promise<void>;
    cancelConnection(): Promise<void>;
  }
}
