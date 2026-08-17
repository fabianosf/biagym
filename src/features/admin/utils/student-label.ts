export function getStudentFirstName(name: string): string {
  const first = name.trim().split(/\s+/).find((part) => part.length > 0);
  return first && first.length > 0 ? first : 'este aluno';
}
