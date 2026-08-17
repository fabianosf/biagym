export function isPlayableVideoUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }

  const trimmed = url.trim();
  return trimmed.length > 0 && trimmed !== 'pending-upload';
}
