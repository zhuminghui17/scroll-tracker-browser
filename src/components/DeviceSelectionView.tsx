// DeviceSelectionView: Modal for selecting iPhone device model

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { DeviceConfig } from '../utils/DeviceConfig';

interface DeviceSelectionViewProps {
  visible: boolean;
  currentDevice: string;
  onClose: () => void;
  onSelectDevice: (deviceModel: string) => void;
}

const DeviceSelectionView: React.FC<DeviceSelectionViewProps> = ({
  visible,
  currentDevice,
  onClose,
  onSelectDevice,
}) => {
  const devices = DeviceConfig.getAvailableDevices();

  // Group devices by series
  const groupedDevices: { [key: string]: string[] } = {};
  devices.forEach((device) => {
    let series = 'Other';
    if (device.includes('17')) series = 'iPhone 17 Series (2025)';
    else if (device.includes('16')) series = 'iPhone 16 Series (2024)';
    else if (device.includes('15')) series = 'iPhone 15 Series (2023)';
    else if (device.includes('14')) series = 'iPhone 14 Series';
    else if (device.includes('13')) series = 'iPhone 13 Series';
    else if (device.includes('12')) series = 'iPhone 12 Series';
    else if (device.includes('11')) series = 'iPhone 11 Series';
    else if (device.includes('XS') || device.includes('XR') || device.includes('X')) series = 'iPhone X Series';
    else if (device.includes('SE')) series = 'iPhone SE Series';
    else if (device.includes('Air')) series = 'iPhone 17 Series (2025)';

    if (!groupedDevices[series]) {
      groupedDevices[series] = [];
    }
    groupedDevices[series].push(device);
  });

  // Order of series
  const seriesOrder = [
    'iPhone 17 Series (2025)',
    'iPhone 16 Series (2024)',
    'iPhone 15 Series (2023)',
    'iPhone 14 Series',
    'iPhone 13 Series',
    'iPhone 12 Series',
    'iPhone 11 Series',
    'iPhone X Series',
    'iPhone SE Series',
    'Other',
  ];

  const handleSelectDevice = (device: string) => {
    onSelectDevice(device);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Device</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Current Device Info */}
        <View style={styles.currentDeviceContainer}>
          <Text style={styles.currentDeviceLabel}>Current Device:</Text>
          <Text style={styles.currentDeviceText}>{currentDevice}</Text>
        </View>

        {/* Device List */}
        <ScrollView style={styles.scrollView}>
          {seriesOrder.map((series) => {
            const devicesInSeries = groupedDevices[series];
            if (!devicesInSeries || devicesInSeries.length === 0) return null;

            return (
              <View key={series} style={styles.seriesContainer}>
                <Text style={styles.seriesTitle}>{series}</Text>
                {devicesInSeries.map((device) => (
                  <TouchableOpacity
                    key={device}
                    style={[
                      styles.deviceItem,
                      currentDevice === device && styles.deviceItemSelected,
                    ]}
                    onPress={() => handleSelectDevice(device)}
                  >
                    <Text
                      style={[
                        styles.deviceItemText,
                        currentDevice === device && styles.deviceItemTextSelected,
                      ]}
                    >
                      {device}
                    </Text>
                    {currentDevice === device && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  currentDeviceContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  currentDeviceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  currentDeviceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  seriesContainer: {
    marginBottom: 16,
  },
  seriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deviceItemSelected: {
    backgroundColor: '#E8F4FD',
  },
  deviceItemText: {
    fontSize: 16,
    color: '#000',
  },
  deviceItemTextSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  checkmark: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '700',
  },
});

export default DeviceSelectionView;

