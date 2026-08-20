import { useAuth } from '@/features/auth';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useAdminEntry } from '@/features/admin/hooks/useAdminEntry';
import { OfflineBanner } from '@/features/offline';
import { NotificationSettingsCard } from '@/features/notifications';
import { AppearanceSettingsCard } from '@/features/profile/components/AppearanceSettingsCard';
import { getDataErrorMessage, updateOwnProfileAvatar, updateOwnProfilePhone, uploadAvatarPhoto } from '@/services';
import { AppImage, Button, Card, LoadingIndicator, TextField } from '@/shared/components';
import { APP_BUILD, APP_NAME, APP_VERSION } from '@/shared/constants/app';
import { useT, useThemeColors } from '@/shared/theme';
import { getDisplayPersonName, getGivenAndFamilyName, getNameInitials } from '@/shared/utils/person-name';
import { formatPhoneDisplay, parseRequiredWhatsAppPhone } from '@/shared/utils/phone';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const colors = useThemeColors();
  const { user, signOut, isLoading, isAdmin, canOpenAdmin } = useAuth();
  const enterAdmin = useAdminEntry();
  const [phoneDraft, setPhoneDraft] = useState(user?.phone ? formatPhoneDisplay(user.phone) : '');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const displayName =
    getGivenAndFamilyName(user?.name) ?? getDisplayPersonName(user?.name) ?? t('common.student');
  const initials = getNameInitials(user?.name);

  useEffect(() => {
    if (user?.phone) {
      setPhoneDraft((current) => (current.trim().length > 0 ? current : formatPhoneDisplay(user.phone ?? '')));
    }
  }, [user?.phone]);

  async function handleSavePhone() {
    if (!user) {
      return;
    }

    const parsed = parseRequiredWhatsAppPhone(phoneDraft);
    if ('error' in parsed) {
      setPhoneError(parsed.error);
      return;
    }

    setIsSavingPhone(true);
    setPhoneError(null);
    try {
      const saved = await updateOwnProfilePhone(user.id, parsed.phone);
      useAuthStore.setState({ user: { ...user, phone: saved } });
      setPhoneDraft(formatPhoneDisplay(saved));
    } catch (err) {
      setPhoneError(getDataErrorMessage(err));
    } finally {
      setIsSavingPhone(false);
    }
  }

  async function handlePickAvatar() {
    if (!user) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAvatarError(t('profile.avatarPermissionDenied'));
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
    setIsUploadingAvatar(true);
    setAvatarError(null);
    try {
      const avatarUrl = await uploadAvatarPhoto({
        userId: user.id,
        fileUri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });
      await updateOwnProfileAvatar(user.id, avatarUrl);
      useAuthStore.setState({ user: { ...user, avatarUrl } });
    } catch (err) {
      setAvatarError(getDataErrorMessage(err));
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <Text className="text-[28px] font-bold text-ink">{t('account.title')}</Text>
      </View>
      <OfflineBanner />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pb-12"
        showsVerticalScrollIndicator={false}
      >
        {!user ? (
          <LoadingIndicator message={t('profile.loading')} />
        ) : (
          <Card className="items-center">
            <Pressable
              onPress={() => void handlePickAvatar()}
              disabled={isUploadingAvatar}
              accessibilityRole="button"
              accessibilityLabel={t('account.changeAvatar')}
              className="h-20 w-20"
            >
              {user.avatarUrl ? (
                <AppImage
                  uri={user.avatarUrl}
                  aspectRatio={1}
                  className="h-20 w-20 rounded-full"
                  accessibilityLabel={t('profile.avatarOf', { name: displayName })}
                />
              ) : (
                <View className="h-20 w-20 items-center justify-center rounded-full bg-primary">
                  <Text className="text-3xl font-semibold text-white">{initials}</Text>
                </View>
              )}
              <View className="absolute inset-0 items-center justify-center rounded-full bg-black/40" style={{ opacity: isUploadingAvatar ? 1 : 0 }}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
              <View className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary">
                <Ionicons name="camera" size={13} color="#FFFFFF" />
              </View>
            </Pressable>
            {avatarError ? (
              <Text className="mt-2 text-center text-xs text-red-400">{avatarError}</Text>
            ) : null}
            <Text className="mt-4 text-2xl font-semibold text-ink">{displayName}</Text>
            <Text className="mt-1 text-sm text-muted">{user.email}</Text>
            <View className="mt-4 rounded-full bg-surface px-3 py-1">
              <Text className="text-xs capitalize text-muted">
                {isAdmin ? t('account.roleTrainer') : t('account.roleStudent')}
              </Text>
            </View>
            {user.bodyMetrics ? (
              <Text className="mt-3 text-center text-sm text-muted">
                {t('profile.metrics', {
                  weight: String(user.bodyMetrics.weightKg),
                  height: String(user.bodyMetrics.heightCm),
                  age: String(user.bodyMetrics.age),
                })}
                {'\n'}
                {t('profile.goal', { goal: t(`studentGoals.${user.bodyMetrics.goal}`) })}
              </Text>
            ) : null}
            <View className="mt-4 w-full gap-3">
              <TextField
                label={t('phone.label')}
                value={phoneDraft}
                onChangeText={setPhoneDraft}
                placeholder={t('phone.placeholder')}
                keyboardType="phone-pad"
                autoComplete="tel"
                icon="logo-whatsapp"
                error={phoneError}
              />
              <Button
                label={t('account.savePhone')}
                loading={isSavingPhone}
                onPress={() => void handleSavePhone()}
              />
            </View>
          </Card>
        )}

        <Pressable
          onPress={() => router.push('/evolution' as Href)}
          className="min-h-[72px] flex-row items-center rounded-card border border-line bg-surface px-4"
        >
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <Ionicons name="trending-up-outline" size={22} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-ink">{t('account.evolutionTitle')}</Text>
            <Text className="mt-0.5 text-sm text-muted">{t('account.evolutionSubtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/messages' as Href)}
          className="min-h-[72px] flex-row items-center rounded-card border border-line bg-surface px-4"
        >
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <Ionicons name="chatbubbles-outline" size={22} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-ink">{t('account.messagesTitle')}</Text>
            <Text className="mt-0.5 text-sm text-muted">{t('account.messagesSubtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>

        {canOpenAdmin ? (
          <Pressable
            onPress={() => void enterAdmin()}
            className="min-h-[72px] flex-row items-center rounded-card border border-primary/20 bg-primary/10 px-4 active:opacity-85"
          >
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-primary">
              <Ionicons name="shield-checkmark" size={22} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-ink">{t('account.adminTitle')}</Text>
              <Text className="mt-0.5 text-sm text-muted">
                {isAdmin ? t('account.adminSubtitleAdmin') : t('account.adminSubtitleGuest')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>
        ) : null}

        {user ? <AppearanceSettingsCard /> : null}

        {user ? <NotificationSettingsCard /> : null}

        <Button
          label={t('account.signOut')}
          variant="danger"
          onPress={() => void signOut()}
          loading={isLoading}
        />

        <Text className="mt-4 text-center text-xs text-faint">
          {APP_NAME} v{APP_VERSION} ({APP_BUILD})
        </Text>
      </ScrollView>
    </View>
  );
}
