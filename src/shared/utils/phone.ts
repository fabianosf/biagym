const MIN_DIGITS = 10;
const MAX_DIGITS = 13;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function normalizeWhatsAppPhone(value: string): string | null {
  const digits = digitsOnly(value);
  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) {
    return null;
  }

  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

export function formatPhoneDisplay(value: string): string {
  const digits = digitsOnly(value);
  const national = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;

  if (national.length === 11) {
    return `(${national.slice(0, 2)}) ${national.slice(2, 7)}-${national.slice(7)}`;
  }

  if (national.length === 10) {
    return `(${national.slice(0, 2)}) ${national.slice(2, 6)}-${national.slice(6)}`;
  }

  return value.trim();
}

export function buildWhatsAppUrl(value: string): string | null {
  const normalized = normalizeWhatsAppPhone(value);
  return normalized ? `https://wa.me/${normalized}` : null;
}

export function parseRequiredWhatsAppPhone(value: string): { phone: string } | { error: string } {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { error: 'Informe o WhatsApp com DDD. Exemplo: (11) 98888-8888.' };
  }

  const normalized = normalizeWhatsAppPhone(trimmed);
  if (!normalized) {
    return { error: 'WhatsApp inválido. Use DDD + número, com 10 ou 11 dígitos.' };
  }

  return { phone: normalized };
}

export function parseOptionalWhatsAppPhone(value: string): { phone?: string } | { error: string } {
  if (value.trim().length === 0) {
    return {};
  }

  return parseRequiredWhatsAppPhone(value);
}
