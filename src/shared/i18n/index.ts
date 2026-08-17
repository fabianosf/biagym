import { en } from './locales/en';
import { ptBR } from './locales/pt-BR';

export const APP_LOCALES = ['pt-BR', 'en'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

const dictionaries: Record<AppLocale, unknown> = {
  'pt-BR': ptBR,
  en,
};

function readPath(source: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = source;

  for (const part of parts) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : undefined;
}

export function translate(locale: AppLocale, key: string, vars?: Record<string, string>): string {
  const value = readPath(dictionaries[locale], key) ?? readPath(ptBR, key) ?? key;
  if (!vars) {
    return value;
  }

  return Object.entries(vars).reduce(
    (text, [name, replacement]) => text.split(`{${name}}`).join(replacement),
    value,
  );
}

export { ptBR, en };
