import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BrandMark } from '@/shared/components';
import { colors } from '@/shared/theme';

export function AuthLoadingScreen() {
  return (
    <View style={styles.container}>
      <BrandMark size={56} showName={false} />
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gym,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  spinner: {
    marginTop: 28,
  },
});
