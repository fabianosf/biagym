export type SampleVideoDefinition = {
  readonly fileName: string;
  readonly title: string;
  readonly description: string;
  readonly durationSeconds: number;
  readonly isFreePreview: boolean;
};

export const SAMPLE_TRAINING_VIDEOS: readonly SampleVideoDefinition[] = [
  {
    fileName: 'video1.mp4',
    title: 'Aula 1 – Boas-vindas e aquecimento',
    description: 'Introdução ao programa e aquecimento guiado.',
    durationSeconds: 600,
    isFreePreview: true,
  },
  {
    fileName: 'video2.mp4',
    title: 'Aula 2 – Técnica de agachamento',
    description: 'Fundamentos do agachamento com foco em postura.',
    durationSeconds: 720,
    isFreePreview: false,
  },
  {
    fileName: 'video3.mp4',
    title: 'Aula 3 – Core e estabilidade',
    description: 'Exercícios de core para suporte ao treino de força.',
    durationSeconds: 540,
    isFreePreview: false,
  },
  {
    fileName: 'video4.mp4',
    title: 'Aula 4 – Empurrar e puxar',
    description: 'Movimentos compostos para membros superiores.',
    durationSeconds: 780,
    isFreePreview: false,
  },
  {
    fileName: 'video5.mp4',
    title: 'Aula 5 – Condicionamento metabólico',
    description: 'Circuito de condicionamento para fechar a semana.',
    durationSeconds: 660,
    isFreePreview: false,
  },
] as const;
