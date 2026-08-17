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

/** Exige nome e sobrenome no cadastro / onboarding. */
export function parseRequiredFullName(value: string): { name: string } | { error: string } {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 3) {
    return { error: 'Informe seu nome completo.' };
  }

  if (looksLikeGeneratedAccountName(trimmed)) {
    return { error: 'Informe seu nome e sobrenome, não o e-mail.' };
  }

  const parts = trimmed.split(' ');
  if (parts.length < 2 || parts.some((part) => part.length < 2)) {
    return { error: 'Informe nome e sobrenome.' };
  }

  return { name: toTitleCaseName(trimmed) };
}

export function getDisplayPersonName(
  ...candidates: Array<string | null | undefined>
): string | null {
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

export function formatHelloGreeting(...candidates: Array<string | null | undefined>): string {
  const name = getDisplayPersonName(...candidates);
  return name ? `Olá, ${name}` : 'Olá!';
}

export function getNameInitials(name: string | null | undefined, fallback = 'BG'): string {
  const display = getDisplayPersonName(name);
  if (!display) {
    return fallback;
  }

  const parts = display.split(' ').slice(0, 2);
  return parts.map((part) => part.charAt(0)).join('') || fallback;
}
