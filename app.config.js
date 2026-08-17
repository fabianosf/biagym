const APP_VERSION = '1.0.0';
const IOS_BUILD_NUMBER = '1';
const ANDROID_VERSION_CODE = 1;

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: 'BiAGym',
  slug: 'biagym',
  version: APP_VERSION,
  orientation: 'portrait',
  scheme: 'biagym',
  userInterfaceStyle: 'light',
  icon: './assets/images/icon.png',
  description:
    'Treinos, aulas e progresso no seu ritmo — o app da BiAGym.',
  primaryColor: '#E8573A',
  ios: {
    bundleIdentifier: 'com.treinosatleta.app',
    buildNumber: IOS_BUILD_NUMBER,
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
      },
      UIBackgroundModes: ['remote-notification'],
    },
  },
  android: {
    package: 'com.treinosatleta.app',
    versionCode: ANDROID_VERSION_CODE,
    permissions: ['INTERNET', 'ACCESS_NETWORK_STATE', 'POST_NOTIFICATIONS'],
    adaptiveIcon: {
      backgroundColor: '#0B0B0B',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-asset',
    'expo-font',
    'expo-video',
    '@sentry/react-native',
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#E8573A',
        defaultChannel: 'default',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFFFFF',
        image: './assets/images/splash-icon.png',
        imageWidth: 120,
        dark: {
          backgroundColor: '#FFFFFF',
          image: './assets/images/splash-icon.png',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '',
    },
  },
};

module.exports = config;
