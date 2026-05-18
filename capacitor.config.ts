import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'stockmaster',
  webDir: 'www',
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      iosKeychainPrefix: 'stockmaster-app',
      iosBiometric: {
        biometricAuth: false,
        biometricTitle: "Biometric login for StockMaster"
      },
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false,
        biometricTitle: "Biometric login for StockMaster",
        biometricSubTitle: "Log in using your biometric"
      }
    }
  }
};

export default config;
