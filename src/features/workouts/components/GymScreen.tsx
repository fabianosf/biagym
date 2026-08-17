import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type GymScreenProps = {
  children: ReactNode;
};

export function GymScreen({ children }: GymScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-gym" style={{ paddingTop: insets.top }}>
      {children}
    </View>
  );
}
