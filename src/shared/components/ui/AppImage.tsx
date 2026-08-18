import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageProps, type ImageSource } from 'expo-image';
import { useEffect, useState } from 'react';
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
  onError,
  ...props
}: AppImageProps) {
  const resolved = source ?? (uri ? { uri } : undefined);
  const [hasError, setHasError] = useState(false);

  // Reseta o estado de erro quando a imagem muda (ex.: mesma instância
  // reaproveitada para outro item de lista) para não travar no ícone de
  // erro de uma URL antiga que falhou.
  useEffect(() => {
    setHasError(false);
  }, [uri, source]);

  return (
    <View className={`overflow-hidden bg-surface ${className ?? ''}`}>
      {hasError ? (
        <View
          style={{ width: '100%', aspectRatio }}
          className="items-center justify-center bg-surface"
        >
          <Ionicons name="image-outline" size={22} color="#9B9B9B" />
        </View>
      ) : (
        <Image
          source={resolved}
          contentFit={contentFit}
          transition={transition}
          recyclingKey={uri}
          cachePolicy="memory-disk"
          style={{ width: '100%', aspectRatio }}
          onError={(event) => {
            setHasError(true);
            onError?.(event);
          }}
          {...props}
        />
      )}
    </View>
  );
}
