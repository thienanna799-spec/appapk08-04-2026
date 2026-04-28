import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.drivergo.app',
  appName: 'DriverGo',
  webDir: 'dist',
  // Production APK loads from built dist/ files.
  // For live-reload dev, uncomment with your LAN IP:
  // server: {
  //   url: 'http://192.168.x.x:4000',
  //   cleartext: true,
  // },
  android: {
    allowMixedContent: true,
  },
};

export default config;
