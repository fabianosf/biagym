import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

type AppScreenProps = {
  children: ReactNode;
  className?: string;
  edges?: readonly Edge[];
};

export function AppScreen({
  children,
  className = '',
  edges = ['top', 'left', 'right'],
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = edges.includes('top') ? insets.top : 0;
  const paddingBottom = edges.includes('bottom') ? insets.bottom : 0;
  const paddingLeft = edges.includes('left') ? insets.left : 0;
  const paddingRight = edges.includes('right') ? insets.right : 0;

  return (
    <View
      className={`flex-1 ${className || 'bg-background'}`}
      style={{ flex: 1, paddingTop, paddingBottom, paddingLeft, paddingRight }}
    >
      {children}
    </View>
  );
}
