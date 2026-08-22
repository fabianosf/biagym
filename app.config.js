const APP_VERSION = '1.0.0';
const IOS_BUILD_NUMBER = '1';
const ANDROID_VERSION_CODE = 1;

const BRAND_PRIMARY = '#10B981';
const BRAND_DARK = '#07140F';
const SPLASH_BLACK = '#000000';

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: 'BiAGym',
  slug: 'biagym',
  version: APP_VERSION,
  orientation: 'portrait',
  scheme: 'biagym',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  description:
    'Treinos, aulas e progresso no seu ritmo — o app da BiAGym.',
  // primaryColor tinge a tela de download/carregamento do Expo Go — preto
  // pra combinar com o splash, não o verde de destaque usado dentro do app.
  primaryColor: SPLASH_BLACK,
  // splash (campo legado, fora do plugin expo-splash-screen): é o que o
  // próprio app Expo Go lê pra desenhar a tela de "Downloading X%" antes do
  // bundle carregar — o plugin expo-splash-screen só vale pra builds nativas
  // (dev client / produção), não pro cliente genérico do Expo Go.
  splash: {
    backgroundColor: SPLASH_BLACK,
    image: './assets/images/icon.png',
    resizeMode: 'contain',
  },
  ios: {
    bundleIdentifier: 'com.biagym.app',
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
    package: 'com.biagym.app',
    versionCode: ANDROID_VERSION_CODE,
    permissions: ['INTERNET', 'ACCESS_NETWORK_STATE', 'POST_NOTIFICATIONS'],
    adaptiveIcon: {
      backgroundColor: BRAND_DARK,
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-asset',
    'expo-font',
    'expo-video',
    'expo-secure-store',
    '@sentry/react-native',
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: BRAND_PRIMARY,
        defaultChannel: 'default',
      },
    ],
    [
      'expo-splash-screen',
      {
        // splash-icon.png tem fundo branco sólido embutido — usamos o
        // icon.png (fundo preto de ponta a ponta) pra colar sem borda
        // visível na tela preta do splash.
        backgroundColor: SPLASH_BLACK,
        image: './assets/images/icon.png',
        imageWidth: 180,
        dark: {
          backgroundColor: SPLASH_BLACK,
          image: './assets/images/icon.png',
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
