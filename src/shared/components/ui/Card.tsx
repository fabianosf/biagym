import type { ReactNode } from 'react';
import { View } from 'react-native';

type CardProps = {
  children: ReactNode;
  className?: string;
  padded?: boolean;
};

export function Card({ children, className = '', padded = true }: CardProps) {
  return (
    <View
      className={`overflow-hidden rounded-card border border-line bg-surface ${
        padded ? 'p-5' : ''
      } ${className}`}
    >
      {children}
    </View>
  );
}
