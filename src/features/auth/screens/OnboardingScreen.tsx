import { Button, Card, FeedbackBanner, TextField } from '@/shared/components';
import { APP_NAME } from '@/shared/constants/app';
import { routes } from '@/shared/constants/routes';
import { STUDENT_GOAL_LABELS, STUDENT_GOALS, type StudentGoal } from '@/domain/student';
import { getFriendlyErrorMessage } from '@/shared/errors';
import {
  formatHelloGreeting,
  getGivenAndFamilyName,
  parseRequiredFullName,
} from '@/shared/utils/person-name';
import { formatPhoneDisplay, parseRequiredWhatsAppPhone } from '@/shared/utils/phone';
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
  const [phone, setPhone] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState<StudentGoal>('condicionamento');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedName = getGivenAndFamilyName(user?.name);
    if (storedName) {
      setName((current) => (current.trim().length > 0 ? current : storedName));
    }

    if (user?.phone) {
      setPhone((current) =>
        current.trim().length > 0 ? current : formatPhoneDisplay(user.phone ?? ''),
      );
    }

    if (user?.bodyMetrics) {
      const metrics = user.bodyMetrics;
      setWeightKg((current) => (current.trim().length > 0 ? current : String(metrics.weightKg)));
      setHeightCm((current) => (current.trim().length > 0 ? current : String(metrics.heightCm)));
      setAge((current) => (current.trim().length > 0 ? current : String(metrics.age)));
      setGoal((current) => (current === 'condicionamento' ? metrics.goal : current));
    }
  }, [user?.bodyMetrics, user?.name, user?.phone]);

  async function handleSubmit() {
    setError(null);
    const parsedName = parseRequiredFullName(name);
    if ('error' in parsedName) {
      setError(parsedName.error);
      return;
    }

    const parsedPhone = parseRequiredWhatsAppPhone(phone);
    if ('error' in parsedPhone) {
      setError(parsedPhone.error);
      return;
    }

    const weight = Number(weightKg.replace(',', '.'));
    const height = Number(heightCm.replace(',', '.'));
    const parsedAge = Number.parseInt(age, 10);

    if (!Number.isFinite(weight) || weight < 30 || weight > 300) {
      setError('Informe seu peso em kg, entre 30 e 300. Exemplo: 72.');
      return;
    }

    if (!Number.isFinite(height) || height < 120 || height > 230) {
      setError('Informe sua altura em cm, entre 120 e 230. Exemplo: 170.');
      return;
    }

    if (!Number.isFinite(parsedAge) || parsedAge < 12 || parsedAge > 90) {
      setError('Informe sua idade em anos, entre 12 e 90.');
      return;
    }

    try {
      await completeOnboarding({
        name: parsedName.name,
        phone: parsedPhone.phone,
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
          Antes de treinar, conte um pouco sobre você: nome, WhatsApp, peso, altura, idade e
          objetivo. A treinadora usa isso para montar treinos e alimentação.
        </Text>

        <Card className="mt-6 gap-4">
          <TextField
            label="Nome e sobrenome"
            value={name}
            onChangeText={setName}
            placeholder="Ana Souza"
            autoCapitalize="words"
            autoComplete="name"
            icon="person-outline"
          />
          <TextField
            label="WhatsApp"
            value={phone}
            onChangeText={setPhone}
            placeholder="(11) 98888-8888"
            keyboardType="phone-pad"
            autoComplete="tel"
            icon="logo-whatsapp"
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
            <Text className="mb-2 text-sm font-medium text-muted">Qual é o seu objetivo?</Text>
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
            label="Salvar e começar a treinar"
            onPress={() => void handleSubmit()}
            loading={isLoading}
          />
        </Card>
      </ScrollView>
    </View>
  );
}
