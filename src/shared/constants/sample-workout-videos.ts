import type { MuscleGroup } from '@/domain/workout';

export type SampleWorkoutVideo = {
  readonly id: string;
  readonly fileName: string;
  readonly title: string;
  readonly muscleGroup: MuscleGroup;
  readonly description: string;
  readonly module: number;
  readonly sets: number;
  readonly reps: string;
  readonly loadKg?: number;
  readonly restSeconds: number;
};

export const SAMPLE_WORKOUT_VIDEOS: readonly SampleWorkoutVideo[] = [
  {
    id: 'video1',
    fileName: 'video1.mp4',
    title: 'Aquecimento articular',
    muscleGroup: 'corpo_todo',
    description: 'Mobilidade de ombros, quadril e tornozelos antes da carga.',
    module: require('../../../videos/video1.mp4'),
    sets: 2,
    reps: '12',
    restSeconds: 30,
  },
  {
    id: 'video2',
    fileName: 'video2.mp4',
    title: 'Agachamento',
    muscleGroup: 'pernas',
    description: 'Pés na largura do quadril, joelho alinhado com o pé.',
    module: require('../../../videos/video2.mp4'),
    sets: 4,
    reps: '8-10',
    loadKg: 40,
    restSeconds: 90,
  },
  {
    id: 'video3',
    fileName: 'video3.mp4',
    title: 'Prancha e core',
    muscleGroup: 'core',
    description: 'Mantenha o tronco firme. Não deixe o quadril cair.',
    module: require('../../../videos/video3.mp4'),
    sets: 3,
    reps: '40s',
    restSeconds: 45,
  },
  {
    id: 'video4',
    fileName: 'video4.mp4',
    title: 'Remada e empurrar',
    muscleGroup: 'costas',
    description: 'Escápulas juntas na puxada. Controle a descida.',
    module: require('../../../videos/video4.mp4'),
    sets: 4,
    reps: '10-12',
    loadKg: 20,
    restSeconds: 75,
  },
  {
    id: 'video5',
    fileName: 'video5.mp4',
    title: 'Condicionamento',
    muscleGroup: 'cardio',
    description: 'Circuito contínuo, ritmo desafiador e técnica primeiro.',
    module: require('../../../videos/video5.mp4'),
    sets: 3,
    reps: '45s',
    restSeconds: 30,
  },
];
