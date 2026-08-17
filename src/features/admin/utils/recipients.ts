export function formatRecipientSummary(names: readonly string[]): string {
  const clean = names.map((name) => name.trim()).filter((name) => name.length > 0);
  if (clean.length === 0) {
    return 'Nenhum aluno';
  }

  if (clean.length === 1) {
    return clean[0] ?? 'Nenhum aluno';
  }

  if (clean.length === 2) {
    return `${clean[0]} e ${clean[1]}`;
  }

  return `${clean[0]}, ${clean[1]} e mais ${clean.length - 2}`;
}
