import React, { useEffect, useState } from 'react';
import { Text, View, Button, Platform, PermissionsAndroid, Alert } from 'react-native';
import { BleManager, State, Device } from 'react-native-ble-plx';

const BluetoothApp = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [bluetoothState, setBluetoothState] = useState<State>(State.Unknown);
  const manager = new BleManager();

  useEffect(() => {
    const subscription = manager.onStateChange(state => {
      setBluetoothState(state);
    }, true);

    return () => {
      subscription.remove();
    };
  }, []);

  const requestBluetoothPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to use Bluetooth',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission granted');
          return true;
        } else {
          console.log('Location permission denied');
          return false;
        }
      } else if (Platform.OS === 'ios') {
        // Request Bluetooth permissions for iOS
        const bleGranted = await manager.enable();
        if (bleGranted) {
          console.log('Bluetooth permission granted');
          return true;
        } else {
          console.log('Bluetooth permission denied');
          return false;
        }
      }
    } catch (error) {
      console.error('Permission Error:', error);
      return false;
    }
  };

  const startScan = async () => {
    try {
      setScanning(true);
      const permissionGranted = await requestBluetoothPermission();
      if (!permissionGranted) {
        Alert.alert(
          'Permission Required',
          'Bluetooth scanning requires Bluetooth permission. Please grant the permission to use Bluetooth.'
        );
        return;
      }
      if (bluetoothState !== State.PoweredOn) {
        Alert.alert('Bluetooth Error', 'Bluetooth is not enabled on your device.');
        return;
      }
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan Error:', error);
          Alert.alert('Scan Error', 'Failed to start device scan. Please try again.');
          setScanning(false); // Stop scanning if an error occurs
          return;
        }
        if (device) {
          setDevices(prevDevices => {
            const existingDevice = prevDevices.find(d => d && d.id === device.id);
            if (!existingDevice) {
              return [...prevDevices, device];
            }
            return prevDevices;
          });
        }
      });
    } catch (error) {
      console.error('Scan Error:', error);
      Alert.alert('Scan Error', 'Failed to start device scan. Please try again.');
      setScanning(false); // Stop scanning if an error occurs
    }
  };

  const stopScan = () => {
    setScanning(false);
    manager.stopDeviceScan();
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title={scanning ? 'Stop Scan' : 'Start Scan'} onPress={scanning ? stopScan : startScan} />
      <Text>Devices:</Text>
      {devices.filter(device => device !== null).map(device => (
        <Text key={device!.id}>{device!.name || 'Unknown Device'}</Text>
      ))}
    </View>
  );
};

export default BluetoothApp;
