import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { APP_NAME } from '@/shared/constants/app';
import { useThemeColors } from '@/shared/theme';

type BrandMarkProps = {
  showName?: boolean;
  size?: number;
};

/**
 * Marca vetorial (sem PNG) — o logo antigo tinha "BiA GYM" desenhado dentro
 * da própria imagem, o que duplicava o nome do app em todo cabeçalho. Aqui é
 * só um ícone, nas cores reais do app (o PNG antigo era laranja/preto,
 * destoando do verde usado em todo o resto da UI).
 */
export function BrandMark({ showName = false, size = 32 }: BrandMarkProps) {
  const colors = useThemeColors();

  return (
    <View className={`items-center ${showName ? 'flex-row gap-2' : 'self-center'}`}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: colors.primary,
        }}
        className="items-center justify-center"
        accessibilityLabel={APP_NAME}
      >
        <Ionicons name="barbell" size={size * 0.58} color={colors.onPrimary} />
      </View>
      {showName ? (
        <Text className="text-[18px] font-extrabold tracking-[1.4px] text-primary">
          {APP_NAME.toUpperCase()}
        </Text>
      ) : null}
    </View>
  );
}
