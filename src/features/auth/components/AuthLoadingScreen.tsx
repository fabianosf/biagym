import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { APP_NAME } from '@/shared/constants/app';
import { colors } from '@/shared/theme';

export function AuthLoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>{APP_NAME.toUpperCase()}</Text>
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
      <Text style={styles.caption}>Carregando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brand: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  spinner: {
    marginTop: 28,
  },
  caption: {
    marginTop: 16,
    color: colors.muted,
    fontSize: 14,
  },
});
