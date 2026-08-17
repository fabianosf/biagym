import { Button, Card, FeedbackBanner, TextField } from '@/shared/components';
import { APP_NAME } from '@/shared/constants/app';
import { routes } from '@/shared/constants/routes';
import { STUDENT_GOAL_LABELS, STUDENT_GOALS, type StudentGoal } from '@/domain/student';
import { getFriendlyErrorMessage } from '@/shared/errors';
import {
  formatHelloGreeting,
  getDisplayPersonName,
  parseRequiredFullName,
} from '@/shared/utils/person-name';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../hooks/useAuth';

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding, isLoading, user } = useAuth();
  const [name, setName] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState<StudentGoal>('condicionamento');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedName = getDisplayPersonName(user?.name);
    if (!storedName) {
      return;
    }

    setName((current) => (current.trim().length > 0 ? current : storedName));
  }, [user?.name]);

  async function handleSubmit() {
    setError(null);
    const parsedName = parseRequiredFullName(name);
    if ('error' in parsedName) {
      setError(parsedName.error);
      return;
    }

    const weight = Number(weightKg.replace(',', '.'));
    const height = Number(heightCm.replace(',', '.'));
    const parsedAge = Number.parseInt(age, 10);

    if (!Number.isFinite(weight) || weight < 30 || weight > 300) {
      setError('Informe um peso válido em kg.');
      return;
    }

    if (!Number.isFinite(height) || height < 120 || height > 230) {
      setError('Informe uma altura válida em cm.');
      return;
    }

    if (!Number.isFinite(parsedAge) || parsedAge < 12 || parsedAge > 90) {
      setError('Informe uma idade válida.');
      return;
    }

    try {
      await completeOnboarding({
        name: parsedName.name,
        weightKg: weight,
        heightCm: height,
        age: parsedAge,
        goal,
      });
      router.replace(routes.programs);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 12 }}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-xs font-bold uppercase tracking-[1.6px] text-primary">
          {APP_NAME}
        </Text>
        <Text className="mt-2 text-[28px] font-bold text-ink">
          {formatHelloGreeting(name, user?.name)}
        </Text>
        <Text className="mt-2 text-base leading-6 text-muted">
          Antes de treinar, conte um pouco sobre você. Isso ajuda a montar treinos e alimentação
          mais adequados.
        </Text>

        <Card className="mt-6 gap-4">
          <TextField
            label="Nome completo"
            value={name}
            onChangeText={setName}
            placeholder="Bruno Costa"
            autoCapitalize="words"
            autoComplete="name"
            icon="person-outline"
          />
          <TextField
            label="Peso (kg)"
            value={weightKg}
            onChangeText={setWeightKg}
            placeholder="72"
            keyboardType="decimal-pad"
            icon="barbell-outline"
          />
          <TextField
            label="Altura (cm)"
            value={heightCm}
            onChangeText={setHeightCm}
            placeholder="170"
            keyboardType="number-pad"
            icon="resize-outline"
          />
          <TextField
            label="Idade"
            value={age}
            onChangeText={setAge}
            placeholder="32"
            keyboardType="number-pad"
            icon="calendar-outline"
          />

          <View>
            <Text className="mb-2 text-sm font-medium text-muted">Objetivo principal</Text>
            <View className="flex-row flex-wrap gap-2">
              {STUDENT_GOALS.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setGoal(item)}
                  className={`rounded-full px-3 py-2 ${
                    goal === item ? 'bg-primary' : 'bg-surface'
                  }`}
                >
                  <Text className={goal === item ? 'font-semibold text-white' : 'text-ink'}>
                    {STUDENT_GOAL_LABELS[item]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {error ? <FeedbackBanner message={error} variant="warning" /> : null}

          <Button
            className="mt-2"
            label="Começar a treinar"
            onPress={() => void handleSubmit()}
            loading={isLoading}
          />
        </Card>
      </ScrollView>
    </View>
  );
}
