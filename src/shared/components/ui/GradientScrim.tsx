import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { gradients } from '@/shared/theme';

export function GradientScrim() {
  return (
    <LinearGradient
      colors={[...gradients.hero]}
      locations={[0.15, 0.55, 1]}
      style={StyleSheet.absoluteFill}
    />
  );
}
