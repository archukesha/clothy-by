import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'by.clothy.app',
  appName: 'Clothy.by',
  webDir: 'public',
  server: {
    url: 'https://93-123-84-38.sslip.io',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
