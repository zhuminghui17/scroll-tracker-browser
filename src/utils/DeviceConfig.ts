// Device PPI (Pixels Per Inch) lookup table for iPhone models

export interface DeviceInfo {
  model: string;
  ppi: number;
  screenHeight: number; // in pixels
  screenWidth: number; // in pixels
}

// Comprehensive iPhone PPI database
const DEVICE_PPI_TABLE: { [key: string]: DeviceInfo } = {
  // iPhone 17 Series (2025)
  'iPhone 17 Pro Max': { model: 'iPhone 17 Pro Max', ppi: 460, screenHeight: 2868, screenWidth: 1320 },
  'iPhone 17 Pro': { model: 'iPhone 17 Pro', ppi: 460, screenHeight: 2622, screenWidth: 1206 },
  'iPhone Air': { model: 'iPhone Air', ppi: 460, screenHeight: 2736, screenWidth: 1260 },
  'iPhone 17': { model: 'iPhone 17', ppi: 460, screenHeight: 2622, screenWidth: 1206 },

  // iPhone 16 Series (2024)
  'iPhone 16 Pro Max': { model: 'iPhone 16 Pro Max', ppi: 460, screenHeight: 2868, screenWidth: 1320 },
  'iPhone 16 Pro': { model: 'iPhone 16 Pro', ppi: 460, screenHeight: 2622, screenWidth: 1206 },
  'iPhone 16 Plus': { model: 'iPhone 16 Plus', ppi: 460, screenHeight: 2796, screenWidth: 1290 },
  'iPhone 16': { model: 'iPhone 16', ppi: 460, screenHeight: 2556, screenWidth: 1179 },
  
  // iPhone 15 Series (2023)
  'iPhone 15 Pro Max': { model: 'iPhone 15 Pro Max', ppi: 460, screenHeight: 2796, screenWidth: 1290 },
  'iPhone 15 Pro': { model: 'iPhone 15 Pro', ppi: 460, screenHeight: 2556, screenWidth: 1179 },
  'iPhone 15 Plus': { model: 'iPhone 15 Plus', ppi: 460, screenHeight: 2796, screenWidth: 1290 },
  'iPhone 15': { model: 'iPhone 15', ppi: 460, screenHeight: 2556, screenWidth: 1179 },
  
  // iPhone 14 Series
  'iPhone 14 Pro Max': { model: 'iPhone 14 Pro Max', ppi: 460, screenHeight: 2796, screenWidth: 1290 },
  'iPhone 14 Pro': { model: 'iPhone 14 Pro', ppi: 460, screenHeight: 2556, screenWidth: 1179 },
  'iPhone 14 Plus': { model: 'iPhone 14 Plus', ppi: 458, screenHeight: 2778, screenWidth: 1284 },
  'iPhone 14': { model: 'iPhone 14', ppi: 460, screenHeight: 2532, screenWidth: 1170 },
  
  // iPhone 13 Series
  'iPhone 13 Pro Max': { model: 'iPhone 13 Pro Max', ppi: 458, screenHeight: 2778, screenWidth: 1284 },
  'iPhone 13 Pro': { model: 'iPhone 13 Pro', ppi: 460, screenHeight: 2532, screenWidth: 1170 },
  'iPhone 13': { model: 'iPhone 13', ppi: 460, screenHeight: 2532, screenWidth: 1170 },
  'iPhone 13 mini': { model: 'iPhone 13 mini', ppi: 476, screenHeight: 2340, screenWidth: 1080 },
  
  // iPhone 12 Series
  'iPhone 12 Pro Max': { model: 'iPhone 12 Pro Max', ppi: 458, screenHeight: 2778, screenWidth: 1284 },
  'iPhone 12 Pro': { model: 'iPhone 12 Pro', ppi: 460, screenHeight: 2532, screenWidth: 1170 },
  'iPhone 12': { model: 'iPhone 12', ppi: 460, screenHeight: 2532, screenWidth: 1170 },
  'iPhone 12 mini': { model: 'iPhone 12 mini', ppi: 476, screenHeight: 2340, screenWidth: 1080 },
  
  // iPhone 11 Series
  'iPhone 11 Pro Max': { model: 'iPhone 11 Pro Max', ppi: 458, screenHeight: 2688, screenWidth: 1242 },
  'iPhone 11 Pro': { model: 'iPhone 11 Pro', ppi: 458, screenHeight: 2436, screenWidth: 1125 },
  'iPhone 11': { model: 'iPhone 11', ppi: 326, screenHeight: 1792, screenWidth: 828 },
  
  // iPhone XS/XR Series
  'iPhone XS Max': { model: 'iPhone XS Max', ppi: 458, screenHeight: 2688, screenWidth: 1242 },
  'iPhone XS': { model: 'iPhone XS', ppi: 458, screenHeight: 2436, screenWidth: 1125 },
  'iPhone XR': { model: 'iPhone XR', ppi: 326, screenHeight: 1792, screenWidth: 828 },
  'iPhone X': { model: 'iPhone X', ppi: 458, screenHeight: 2436, screenWidth: 1125 },
  
  // iPhone SE Series
  'iPhone SE (3rd generation)': { model: 'iPhone SE (3rd generation)', ppi: 326, screenHeight: 1334, screenWidth: 750 },
  'iPhone SE (2nd generation)': { model: 'iPhone SE (2nd generation)', ppi: 326, screenHeight: 1334, screenWidth: 750 },
  'iPhone SE': { model: 'iPhone SE', ppi: 326, screenHeight: 1136, screenWidth: 640 },
  
  // Default fallback
  'default': { model: 'Default iPhone', ppi: 460, screenHeight: 2532, screenWidth: 1170 },
};

export class DeviceConfig {
  private static instance: DeviceConfig;
  private deviceInfo: DeviceInfo;

  private constructor() {
    // Default to iPhone 14 Pro specs as a reasonable fallback
    this.deviceInfo = DEVICE_PPI_TABLE['default'];
  }

  static getInstance(): DeviceConfig {
    if (!DeviceConfig.instance) {
      DeviceConfig.instance = new DeviceConfig();
    }
    return DeviceConfig.instance;
  }

  // Get device PPI
  getPPI(): number {
    return this.deviceInfo.ppi;
  }

  // Get device info
  getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  // Set device manually (for testing or when auto-detection fails)
  setDevice(modelName: string): void {
    if (DEVICE_PPI_TABLE[modelName]) {
      this.deviceInfo = DEVICE_PPI_TABLE[modelName];
      console.log(`[DeviceConfig] Device set to: ${modelName}, PPI: ${this.deviceInfo.ppi}`);
    } else {
      console.warn(`[DeviceConfig] Unknown device: ${modelName}, using default`);
      this.deviceInfo = DEVICE_PPI_TABLE['default'];
    }
  }

  // Get all available device models
  static getAvailableDevices(): string[] {
    return Object.keys(DEVICE_PPI_TABLE).filter(key => key !== 'default');
  }

  // Auto-detect device (simplified for React Native)
  async autoDetectDevice(): Promise<void> {
    try {
      // For now, we'll use the default device
      // In a production app, you would use react-native-device-info here
      // const deviceModel = await DeviceInfo.getModel();
      // this.setDevice(deviceModel);
      
      console.log('[DeviceConfig] Using default device configuration');
      this.deviceInfo = DEVICE_PPI_TABLE['default'];
    } catch (error) {
      console.error('[DeviceConfig] Error detecting device:', error);
      this.deviceInfo = DEVICE_PPI_TABLE['default'];
    }
  }
}

export default DeviceConfig;

