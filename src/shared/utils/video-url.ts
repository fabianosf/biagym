export function isPlayableVideoUrl(url: string | null | undefined): url is string {
  if (!url) {
    return false;
  }

  const trimmed = url.trim();
  return trimmed.length > 0 && trimmed !== 'pending-upload';
}
