import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { getGatewayUrl, setGatewayUrl } from '../config/gateway';

const RELAY_URL = 'https://infinite-scroll-relay-production.up.railway.app';

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
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'checking' | 'connected' | 'no_printer' | 'error'>('idle');
  const [printerConnected, setPrinterConnected] = useState(false);

  useEffect(() => {
    if (visible) {
      setStatus('idle');
      checkConnection();
    }
  }, [visible]);

  const checkConnection = async () => {
    setTesting(true);
    setStatus('checking');
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${RELAY_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        const data = await response.json();
        setPrinterConnected(data.printerConnected === true);
        setStatus(data.printerConnected ? 'connected' : 'no_printer');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setTesting(false);
    }
  };

  const handleUseRelay = async () => {
    await setGatewayUrl(RELAY_URL);
    onSave(RELAY_URL);
    onClose();
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return '#34C759';
      case 'no_printer': return '#FF9500';
      case 'error': return '#FF3B30';
      default: return '#666';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'checking': return 'Checking...';
      case 'connected': return 'Relay Connected, Printer Online';
      case 'no_printer': return 'Relay Connected, Printer Offline';
      case 'error': return 'Cannot reach relay server';
      default: return '';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Connection</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.statusCard}>
            <Text style={styles.label}>Cloud Relay Server</Text>
            <Text style={styles.urlText}>{RELAY_URL}</Text>
            
            <View style={styles.statusRow}>
              {testing ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              )}
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={checkConnection}
              disabled={testing}
            >
              <Text style={styles.refreshButtonText}>↻ Refresh</Text>
            </TouchableOpacity>
          </View>

          {status === 'no_printer' && (
            <View style={styles.hintCard}>
              <Text style={styles.hintTitle}>Printer Not Connected</Text>
              <Text style={styles.hintText}>
                Make sure the printer is turned on and connected, and the gateway is running on the Mac/Pi.
              </Text>
            </View>
          )}

          {status === 'connected' && (
            <TouchableOpacity style={styles.useButton} onPress={handleUseRelay}>
              <Text style={styles.useButtonText}>Use This Connection</Text>
            </TouchableOpacity>
          )}
        </View>
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
  content: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  urlText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  refreshButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
  hintCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  hintTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  codeText: {
    fontFamily: 'Courier',
    fontSize: 12,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    color: '#333',
  },
  useButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  useButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default GatewaySettingsView;
