import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Network from 'expo-network';
import { getGatewayUrl, setGatewayUrl } from '../config/gateway';

interface GatewaySettingsViewProps {
  visible: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
}

const GatewaySettingsView: React.FC<GatewaySettingsViewProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [deviceIp, setDeviceIp] = useState<string | null>(null);
  const [loadingIp, setLoadingIp] = useState(false);

  useEffect(() => {
    if (visible) {
      getGatewayUrl().then(setUrl);
      setStatus('idle');
      fetchDeviceIp();
    }
  }, [visible]);

  const fetchDeviceIp = async () => {
    setLoadingIp(true);
    try {
      const ip = await Network.getIpAddressAsync();
      setDeviceIp(ip);
    } catch (err) {
      console.warn('[GatewaySettings] Failed to get IP:', err);
      setDeviceIp(null);
    } finally {
      setLoadingIp(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setStatus('idle');
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Alert.alert('Invalid URL', 'URL must start with http:// or https://');
      return;
    }
    
    await setGatewayUrl(url);
    onSave(url);
    onClose();
    Alert.alert('Saved', 'Gateway URL has been updated.');
  };

  const useDeviceIpAsGateway = () => {
    if (deviceIp) {
      setUrl(`http://${deviceIp}:3000`);
    }
  };

  const getNetworkPrefix = (ip: string): string => {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}`;
    }
    return ip;
  };

  const presets = [
    { label: 'Localhost (Simulator)', url: 'http://127.0.0.1:3000' },
    { label: 'Printer Direct (Ethernet)', url: 'http://192.168.123.100:3000' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Gateway Settings</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent}>
          <View style={styles.content}>
            {/* Device IP Section */}
            <View style={styles.ipSection}>
              <Text style={styles.label}>This Device's IP</Text>
              <View style={styles.ipRow}>
                {loadingIp ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : deviceIp ? (
                  <>
                    <Text style={styles.ipText}>{deviceIp}</Text>
                    <Text style={styles.networkHint}>
                      Network: {getNetworkPrefix(deviceIp)}.x
                    </Text>
                  </>
                ) : (
                  <Text style={styles.ipError}>Unable to get IP</Text>
                )}
                <TouchableOpacity style={styles.refreshButton} onPress={fetchDeviceIp}>
                  <Text style={styles.refreshButtonText}>↻</Text>
                </TouchableOpacity>
              </View>
              {deviceIp && (
                <Text style={styles.ipHint}>
                  Your Mac must be on the same network ({getNetworkPrefix(deviceIp)}.x) for the gateway to work.
                </Text>
              )}
            </View>

            <Text style={styles.label}>Gateway URL</Text>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="http://192.168.1.100:3000"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <View style={styles.testRow}>
              <TouchableOpacity
                style={styles.testButton}
                onPress={testConnection}
                disabled={testing}
              >
                {testing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.testButtonText}>Test Connection</Text>
                )}
              </TouchableOpacity>
              
              {status === 'success' && (
                <Text style={styles.statusSuccess}>✓ Connected</Text>
              )}
              {status === 'error' && (
                <Text style={styles.statusError}>✗ Failed</Text>
              )}
            </View>

            {/* Use This Device as Gateway */}
            {deviceIp && (
              <>
                <Text style={styles.sectionTitle}>Use This Device</Text>
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={useDeviceIpAsGateway}
                >
                  <Text style={styles.presetLabel}>This iPhone ({deviceIp})</Text>
                  <Text style={styles.presetUrl}>http://{deviceIp}:3000</Text>
                </TouchableOpacity>
              </>
            )}

            <Text style={styles.sectionTitle}>Quick Presets</Text>
            {presets.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.presetButton}
                onPress={() => setUrl(preset.url)}
              >
                <Text style={styles.presetLabel}>{preset.label}</Text>
                <Text style={styles.presetUrl}>{preset.url}</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.hint}>
              The gateway server runs on your Mac. Find its IP in System Settings → Wi-Fi → Details, 
              or run `ifconfig | grep inet` in Terminal. Make sure both devices are on the same network.
            </Text>
          </View>
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 17,
    color: '#007AFF',
  },
  saveButton: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  ipSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  ipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  ipText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  networkHint: {
    fontSize: 14,
    color: '#666',
  },
  ipError: {
    fontSize: 16,
    color: '#FF3B30',
  },
  ipHint: {
    marginTop: 8,
    fontSize: 13,
    color: '#888',
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  refreshButtonText: {
    fontSize: 18,
    color: '#007AFF',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  statusSuccess: {
    color: '#34C759',
    fontWeight: '600',
  },
  statusError: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 24,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  presetButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  presetLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  presetUrl: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  hint: {
    marginTop: 24,
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
});

export default GatewaySettingsView;
