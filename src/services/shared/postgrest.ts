/**
 * Escapa os caracteres com significado sintático em filtros PostgREST
 * (.or(), ilike): vírgula separa condições, parênteses agrupam, % e * são
 * curingas do próprio ilike. Sempre use antes de interpolar texto livre
 * (busca, nome, etc.) dentro de um filtro `.or(...)`/`.ilike(...)`.
 */
export function escapePostgrestPattern(value: string): string {
  return value.replace(/[,()%*]/g, (char) => `\\${char}`);
}
