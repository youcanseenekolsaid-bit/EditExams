import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.editexams.app',
  appName: 'EditExams',
  webDir: 'dist',
  // أضف هذا الجزء لضمان تجربة هاتف أفضل
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  }
};

export default config;