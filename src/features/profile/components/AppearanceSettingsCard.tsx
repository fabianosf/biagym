import { Card } from '@/shared/components';
import { usePreferencesStore, useT, type AppearancePreference } from '@/shared/theme';
import { Pressable, Text, View } from 'react-native';

const APPEARANCE_OPTIONS: AppearancePreference[] = ['light', 'dark', 'system'];

export function AppearanceSettingsCard() {
  const t = useT();
  const appearance = usePreferencesStore((state) => state.appearance);
  const locale = usePreferencesStore((state) => state.locale);
  const setAppearance = usePreferencesStore((state) => state.setAppearance);
  const setLocale = usePreferencesStore((state) => state.setLocale);

  return (
    <Card className="gap-4">
      <View>
        <Text className="text-base font-semibold text-ink">{t('appearance.title')}</Text>
        <Text className="mt-1 text-sm text-muted">{t('appearance.hint')}</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {APPEARANCE_OPTIONS.map((option) => (
            <Pressable
              key={option}
              onPress={() => setAppearance(option)}
              className={`rounded-full px-3 py-2 ${
                appearance === option ? 'bg-primary' : 'bg-elevated'
              }`}
            >
              <Text className={appearance === option ? 'font-semibold text-white' : 'text-ink'}>
                {t(`appearance.${option}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text className="text-base font-semibold text-ink">{t('language.title')}</Text>
        <Text className="mt-1 text-sm text-muted">{t('language.hint')}</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => setLocale('pt-BR')}
            className={`rounded-full px-3 py-2 ${locale === 'pt-BR' ? 'bg-primary' : 'bg-elevated'}`}
          >
            <Text className={locale === 'pt-BR' ? 'font-semibold text-white' : 'text-ink'}>
              {t('language.pt')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setLocale('en')}
            className={`rounded-full px-3 py-2 ${locale === 'en' ? 'bg-primary' : 'bg-elevated'}`}
          >
            <Text className={locale === 'en' ? 'font-semibold text-white' : 'text-ink'}>
              {t('language.en')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}
