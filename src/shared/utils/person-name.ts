import { translate } from '@/shared/i18n';
import { usePreferencesStore } from '@/shared/theme/preferences.store';

function tCurrent(key: string): string {
  return translate(usePreferencesStore.getState().locale, key);
}

/** Nome vindo do e-mail (ex.: bruno.costa) não deve aparecer na saudação. */
export function looksLikeGeneratedAccountName(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return true;
  }

  if (trimmed.includes('@')) {
    return true;
  }

  const compact = trimmed.toLowerCase();
  if (/^[a-z0-9._%+-]+$/.test(compact) && (compact.includes('.') || compact.includes('_'))) {
    return true;
  }

  return false;
}

export function toTitleCaseName(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function parseFullPersonName(value: string): string | null {
  const cleaned = toTitleCaseName(value);
  if (cleaned.length < 2 || looksLikeGeneratedAccountName(cleaned)) {
    return null;
  }

  return cleaned;
}

/** Primeiro nome + último sobrenome. Ignora e-mail e nomes gerados. */
export function toGivenAndFamilyName(value: string): string | null {
  const parsed = parseFullPersonName(value);
  if (!parsed) {
    return null;
  }

  const parts = parsed.split(' ').filter((part) => part.length >= 2);
  const first = parts[0];
  const last = parts.length >= 2 ? parts[parts.length - 1] : undefined;
  if (!first || !last) {
    return null;
  }

  return `${first} ${last}`;
}

/** Exige nome e sobrenome no cadastro / onboarding. */
export function parseRequiredFullName(value: string): { name: string } | { error: string } {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 3) {
    return { error: tCurrent('validation.fullNameTooShort') };
  }

  if (looksLikeGeneratedAccountName(trimmed)) {
    return { error: tCurrent('validation.fullNameLooksLikeEmail') };
  }

  const parts = trimmed.split(' ');
  if (parts.length < 2 || parts.some((part) => part.length < 2)) {
    return { error: tCurrent('validation.fullNameMissingLastName') };
  }

  return { name: toTitleCaseName(trimmed) };
}

export function getGivenAndFamilyName(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    const parsed = toGivenAndFamilyName(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

export function getDisplayPersonName(
  ...candidates: Array<string | null | undefined>
): string | null {
  const givenAndFamily = getGivenAndFamilyName(...candidates);
  if (givenAndFamily) {
    return givenAndFamily;
  }

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    const parsed = parseFullPersonName(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

export function formatHelloGreeting(
  t: (key: string, vars?: Record<string, string>) => string,
  ...candidates: Array<string | null | undefined>
): string {
  const name = getGivenAndFamilyName(...candidates);
  return name ? t('greeting.hello', { name }) : t('greeting.helloGeneric');
}

export function getNameInitials(name: string | null | undefined, fallback = 'BG'): string {
  const display = getGivenAndFamilyName(name) ?? getDisplayPersonName(name);
  if (!display) {
    return fallback;
  }

  const parts = display.split(' ').slice(0, 2);
  return parts.map((part) => part.charAt(0)).join('') || fallback;
}
