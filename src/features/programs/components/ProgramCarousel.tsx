import type { Program, ProgramSummary } from '@/domain';
import type { UserProgress } from '@/domain/progress';
import { Link, type Href } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ProgramPosterCard } from './ProgramPosterCard';

type ProgramCarouselProps = {
  title: string;
  subtitle?: string;
  programs: readonly (ProgramSummary | Program)[];
  progressByProgramId?: Record<string, UserProgress>;
  seeMoreHref?: Href;
};

export function ProgramCarousel({
  title,
  subtitle,
  programs,
  progressByProgramId,
  seeMoreHref,
}: ProgramCarouselProps) {
  if (programs.length === 0) {
    return null;
  }

  return (
    <View className="mb-7">
      <View className="mb-3 flex-row items-end justify-between px-5">
        <View className="flex-1 pr-4">
          <Text className="text-[22px] font-bold text-ink">{title}</Text>
          {subtitle ? (
            <Text className="mt-0.5 text-sm text-muted">{subtitle}</Text>
          ) : null}
        </View>
        {seeMoreHref ? (
          <Link href={seeMoreHref} asChild>
            <Pressable hitSlop={8}>
              <Text className="text-sm font-semibold text-primary">Ver mais</Text>
            </Pressable>
          </Link>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 px-5"
      >
        {programs.map((program) => (
          <ProgramPosterCard
            key={program.id}
            program={program}
            progress={progressByProgramId?.[program.id] ?? null}
          />
        ))}
      </ScrollView>
    </View>
  );
}
