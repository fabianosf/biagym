import { Image, Text, View } from 'react-native';

import { APP_NAME, BRAND_LOGO } from '@/shared/constants/app';

type BrandMarkProps = {
  showName?: boolean;
  size?: number;
};

/**
 * Logo oficial da BiA Gym (assets/images/logo.png) já traz o nome desenhado
 * na própria imagem — por isso `showName` não repete o texto ao lado por
 * padrão; ele só existe para telas que precisem de um rótulo textual extra.
 */
export function BrandMark({ showName = false, size = 32 }: BrandMarkProps) {
  return (
    <View className={`items-center ${showName ? 'flex-row gap-2' : 'self-center'}`}>
      <Image
        source={BRAND_LOGO}
        style={{ width: size, height: size, borderRadius: size * 0.2 }}
        resizeMode="contain"
        accessibilityLabel={APP_NAME}
      />
      {showName ? (
        <Text className="text-[18px] font-extrabold tracking-[1.4px] text-primary">
          {APP_NAME.toUpperCase()}
        </Text>
      ) : null}
    </View>
  );
}
