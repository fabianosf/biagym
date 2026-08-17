import type { Category, ProgramLevel } from '@/domain';
import { Pressable, Text, TextInput, View } from 'react-native';

const LEVELS: ProgramLevel[] = ['iniciante', 'intermediário', 'avançado'];

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
  function toggleCategory(categoryId: string) {
    const exists = values.categoryIds.includes(categoryId);
    onChange({
      ...values,
      categoryIds: exists
        ? values.categoryIds.filter((id) => id !== categoryId)
        : [...values.categoryIds, categoryId],
    });
  }

  return (
    <View className="gap-4">
      <Field
        label="Título"
        value={values.title}
        onChangeText={(title) => onChange({ ...values, title })}
      />
      <Field
        label="Slug"
        value={values.slug}
        onChangeText={(slug) => onChange({ ...values, slug })}
      />
      <Field
        label="Descrição"
        value={values.description}
        onChangeText={(description) => onChange({ ...values, description })}
        multiline
      />
      <Field
        label="URL da capa"
        value={values.coverUrl}
        onChangeText={(coverUrl) => onChange({ ...values, coverUrl })}
        keyboardType="url"
      />
      <Field
        label="Nome do(a) treinador(a)"
        value={values.trainerName}
        onChangeText={(trainerName) => onChange({ ...values, trainerName })}
      />
      <Field
        label="Duração (semanas)"
        value={values.durationWeeks}
        onChangeText={(durationWeeks) => onChange({ ...values, durationWeeks })}
        keyboardType="numeric"
      />

      <View>
        <Text className="mb-2 text-sm text-muted">Nível</Text>
        <View className="flex-row flex-wrap gap-2">
          {LEVELS.map((level) => (
            <Pressable
              key={level}
              onPress={() => onChange({ ...values, level })}
              className={`rounded-full px-3 py-2 ${
                values.level === level ? 'bg-primary' : 'bg-elevated'
              }`}
            >
              <Text
                className={`capitalize ${
                  values.level === level ? 'font-semibold text-background' : 'text-muted'
                }`}
              >
                {level}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text className="mb-2 text-sm text-muted">Categorias</Text>
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
          {values.isPublished ? 'Publicado no catálogo' : 'Rascunho (não publicado)'}
        </Text>
      </Pressable>
    </View>
  );
}
