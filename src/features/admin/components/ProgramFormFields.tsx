import { PROGRAM_LEVELS, type Category, type ProgramLevel } from '@/domain';
import { uploadProgramCover } from '@/services';
import { AppImage } from '@/shared/components';
import { useT } from '@/shared/theme';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

export type ProgramFormValues = {
  title: string;
  slug: string;
  description: string;
  coverUrl: string;
  trainerName: string;
  level: ProgramLevel;
  durationWeeks: string;
  categoryIds: string[];
  isPublished: boolean;
};

type ProgramFormFieldsProps = {
  values: ProgramFormValues;
  categories: Category[];
  onChange: (values: ProgramFormValues) => void;
};

function Field({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'url';
}) {
  return (
    <View>
      <Text className="mb-2 text-sm text-muted">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        className={`rounded-2xl border border-line bg-elevated px-4 py-3.5 text-ink ${
          multiline ? 'min-h-[96px]' : ''
        }`}
        placeholderTextColor="#9B9B9B"
      />
    </View>
  );
}

export function ProgramFormFields({ values, categories, onChange }: ProgramFormFieldsProps) {
  const t = useT();
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  function toggleCategory(categoryId: string) {
    const exists = values.categoryIds.includes(categoryId);
    onChange({
      ...values,
      categoryIds: exists
        ? values.categoryIds.filter((id) => id !== categoryId)
        : [...values.categoryIds, categoryId],
    });
  }

  async function handlePickCover() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setCoverError(t('admin.programForm.coverPermissionDenied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    setIsUploadingCover(true);
    setCoverError(null);
    try {
      const coverUrl = await uploadProgramCover({
        fileUri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });
      onChange({ ...values, coverUrl });
    } catch {
      setCoverError(t('admin.programForm.coverUploadFailed'));
    } finally {
      setIsUploadingCover(false);
    }
  }

  return (
    <View className="gap-4">
      <Field
        label={t('admin.programForm.title')}
        value={values.title}
        onChangeText={(title) => onChange({ ...values, title })}
      />
      <Field
        label={t('admin.programForm.slug')}
        value={values.slug}
        onChangeText={(slug) => onChange({ ...values, slug })}
      />
      <Field
        label={t('admin.programForm.description')}
        value={values.description}
        onChangeText={(description) => onChange({ ...values, description })}
        multiline
      />
      <View>
        <Text className="mb-2 text-sm text-muted">{t('admin.programForm.cover')}</Text>
        {values.coverUrl ? (
          <AppImage uri={values.coverUrl} aspectRatio={3 / 4} className="mb-3 w-32 rounded-2xl" />
        ) : null}
        <Pressable
          onPress={() => void handlePickCover()}
          disabled={isUploadingCover}
          className="min-h-[48px] flex-row items-center justify-center gap-2 rounded-2xl border border-primary/40"
        >
          {isUploadingCover ? <ActivityIndicator /> : null}
          <Text className="font-semibold text-primary">
            {isUploadingCover
              ? t('admin.programForm.uploading')
              : values.coverUrl
                ? t('admin.programForm.changeCover')
                : t('admin.programForm.attachCover')}
          </Text>
        </Pressable>
        {coverError ? <Text className="mt-2 text-xs text-red-400">{coverError}</Text> : null}
      </View>
      <Field
        label={t('admin.programForm.trainerName')}
        value={values.trainerName}
        onChangeText={(trainerName) => onChange({ ...values, trainerName })}
      />
      <Field
        label={t('admin.programForm.durationWeeks')}
        value={values.durationWeeks}
        onChangeText={(durationWeeks) => onChange({ ...values, durationWeeks })}
        keyboardType="numeric"
      />

      <View>
        <Text className="mb-2 text-sm text-muted">{t('admin.programForm.level')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {PROGRAM_LEVELS.map((level) => (
            <Pressable
              key={level}
              onPress={() => onChange({ ...values, level })}
              className={`rounded-full px-3 py-2 ${
                values.level === level ? 'bg-primary' : 'bg-elevated'
              }`}
            >
              <Text
                className={values.level === level ? 'font-semibold text-background' : 'text-muted'}
              >
                {t(`programLevels.${level}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text className="mb-2 text-sm text-muted">{t('admin.programForm.categories')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {categories.map((category) => {
            const selected = values.categoryIds.includes(category.id);
            return (
              <Pressable
                key={category.id}
                onPress={() => toggleCategory(category.id)}
                className={`rounded-full px-3 py-2 ${
                  selected ? 'border border-primary/40 bg-primary/20' : 'bg-elevated'
                }`}
              >
                <Text className={selected ? 'text-primary' : 'text-muted'}>
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={() => onChange({ ...values, isPublished: !values.isPublished })}
        className={`rounded-2xl border px-4 py-3.5 ${
          values.isPublished ? 'border-primary/40 bg-primary/10' : 'border-line bg-surface'
        }`}
      >
        <Text className="font-medium text-ink">
          {values.isPublished ? t('admin.programForm.published') : t('admin.programForm.draft')}
        </Text>
      </Pressable>
    </View>
  );
}
