import { translate } from '@/shared/i18n';
import { usePreferencesStore } from '@/shared/theme/preferences.store';

export function formatRecipientSummary(names: readonly string[]): string {
  const locale = usePreferencesStore.getState().locale;
  const t = (key: string, vars?: Record<string, string>) => translate(locale, key, vars);
  const clean = names.map((name) => name.trim()).filter((name) => name.length > 0);
  if (clean.length === 0) {
    return t('admin.recipients.none');
  }

  if (clean.length === 1) {
    return clean[0] ?? t('admin.recipients.none');
  }

  if (clean.length === 2) {
    return t('admin.recipients.two', { first: clean[0] ?? '', second: clean[1] ?? '' });
  }

  return t('admin.recipients.more', {
    first: clean[0] ?? '',
    second: clean[1] ?? '',
    count: String(clean.length - 2),
  });
}
