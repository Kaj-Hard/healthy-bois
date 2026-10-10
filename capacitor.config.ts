import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dk.healthybois.app',
  appName: 'Healthy Bois',
  webDir: 'dist',
  backgroundColor: '#FFF6EC',
  android: {
    // Everything ships inside the APK; nothing is ever loaded over the network.
    allowMixedContent: false,
  },
};

export default config;
