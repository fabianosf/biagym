import { Image, Text, View } from 'react-native';

import { APP_NAME, BRAND_LOGO } from '@/shared/constants/app';

type BrandMarkProps = {
  showName?: boolean;
  size?: number;
};

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
