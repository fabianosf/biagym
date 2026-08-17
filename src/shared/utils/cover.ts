import type { ImageSource } from 'expo-image';

const PROGRAM_COVERS: readonly ImageSource[] = [
  require('../../../assets/images/covers/cover1.jpg'),
  require('../../../assets/images/covers/cover2.jpg'),
  require('../../../assets/images/covers/cover3.jpg'),
  require('../../../assets/images/covers/cover4.jpg'),
  require('../../../assets/images/covers/cover5.jpg'),
];

export function isRemoteCoverUrl(coverUrl: string): boolean {
  return coverUrl.startsWith('http') && !coverUrl.includes('placehold.co');
}

export function programCoverSource(programId: string, coverUrl: string): ImageSource {
  if (isRemoteCoverUrl(coverUrl)) {
    return { uri: coverUrl };
  }

  let hash = 0;
  for (const character of programId) {
    hash = (hash + character.charCodeAt(0)) % PROGRAM_COVERS.length;
  }

  return PROGRAM_COVERS[hash] ?? PROGRAM_COVERS[0]!;
}
