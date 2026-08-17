import {
  AdminShell,
  ProgramFormFields,
  type ProgramFormValues,
} from '@/features/admin/components';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { Button, ErrorState, LoadingIndicator } from '@/shared/components';
import { resolveRouteParam, slugify } from '@/shared/utils';
import {
  adminCreateProgram,
  adminUpdateProgram,
  getAdminProgramDetail,
  getDataErrorMessage,
  listCategories,
} from '@/services';
import type { Category } from '@/domain';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

const EMPTY_FORM: ProgramFormValues = {
  title: '',
  slug: '',
  description: '',
  coverUrl: '',
  trainerName: '',
  level: 'iniciante',
  durationWeeks: '4',
  categoryIds: [],
  isPublished: false,
};

export function AdminProgramFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = resolveRouteParam(params.id);
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [values, setValues] = useState<ProgramFormValues>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const cats = await listCategories();
      setCategories(cats);

      if (!id) {
        setIsLoading(false);
        return;
      }

      const detail = await getAdminProgramDetail(id);
      if (!detail) {
        setError('Programa não encontrado.');
        return;
      }

      setValues({
        title: detail.program.title,
        slug: detail.program.slug,
        description: detail.program.description,
        coverUrl: detail.program.coverUrl,
        trainerName: detail.program.trainerName,
        level: detail.program.level,
        durationWeeks: String(detail.program.durationWeeks),
        categoryIds: [...detail.program.categoryIds],
        isPublished: detail.program.isPublished,
      });
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const durationWeeks = Number.parseInt(values.durationWeeks, 10);
    if (!values.title.trim() || !values.slug.trim() || Number.isNaN(durationWeeks)) {
      setError('Preencha título, slug e duração válida.');
      setIsSaving(false);
      return;
    }

    try {
      if (isEditing && id) {
        await adminUpdateProgram(id, {
          title: values.title.trim(),
          slug: values.slug.trim(),
          description: values.description.trim(),
          coverUrl: values.coverUrl.trim(),
          trainerName: values.trainerName.trim(),
          level: values.level,
          durationWeeks,
          categoryIds: values.categoryIds,
          isPublished: values.isPublished,
        });
        setSuccess('Programa atualizado.');
      } else {
        const created = await adminCreateProgram({
          title: values.title.trim(),
          slug: values.slug.trim() || slugify(values.title),
          description: values.description.trim(),
          coverUrl: values.coverUrl.trim(),
          trainerName: values.trainerName.trim(),
          level: values.level,
          durationWeeks,
          categoryIds: values.categoryIds,
          isPublished: values.isPublished,
        });
        router.replace(adminRoutes.programDetail(created.id));
        return;
      }
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminShell
      title={isEditing ? 'Editar programa' : 'Novo programa'}
      subtitle="Metadados, categorias e publicação"
      showBack
      onBack={() => router.back()}
    >
      {isLoading ? <LoadingIndicator fullScreen message="Carregando formulário..." /> : null}

      {!isLoading && error && !values.title ? (
        <View className="px-5 pt-4">
          <ErrorState message={error} onRetry={() => void load()} />
        </View>
      ) : null}

      {!isLoading ? (
        <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 py-4 pb-10">
          <ProgramFormFields
            values={values}
            categories={categories}
            onChange={(next) => {
              setValues((current) => ({
                ...next,
                slug:
                  !isEditing && current.slug === slugify(current.title)
                    ? slugify(next.title)
                    : next.slug,
              }));
            }}
          />

          {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
          {success ? <Text className="text-sm text-primary">{success}</Text> : null}

          <Button
            disabled={isSaving}
            loading={isSaving}
            onPress={() => void handleSave()}
            label={isEditing ? 'Salvar alterações' : 'Criar programa'}
          />

          {isEditing && id ? (
            <Button
              variant="secondary"
              onPress={() => router.push(adminRoutes.programDetail(id))}
              label="Gerenciar semanas e aulas"
            />
          ) : null}
        </ScrollView>
      ) : null}
    </AdminShell>
  );
}
