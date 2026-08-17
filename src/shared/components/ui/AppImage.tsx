import { Image, type ImageProps, type ImageSource } from 'expo-image';
import { View } from 'react-native';

type AppImageProps = Omit<ImageProps, 'source'> & {
  uri?: string;
  source?: ImageSource;
  aspectRatio?: number;
  className?: string;
};

export function AppImage({
  uri,
  source,
  aspectRatio = 16 / 9,
  className,
  contentFit = 'cover',
  transition = 200,
  ...props
}: AppImageProps) {
  const resolved = source ?? (uri ? { uri } : undefined);

  return (
    <View className={`overflow-hidden bg-surface ${className ?? ''}`}>
      <Image
        source={resolved}
        contentFit={contentFit}
        transition={transition}
        recyclingKey={uri}
        cachePolicy="memory-disk"
        style={{ width: '100%', aspectRatio }}
        {...props}
      />
    </View>
  );
}
