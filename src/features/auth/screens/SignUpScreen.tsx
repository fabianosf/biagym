import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { routes } from '@/shared/constants/routes';
import {
  AppScreen,
  Button,
  Card,
  FeedbackBanner,
  PasswordField,
  TextField,
} from '@/shared/components';
import { isSupabaseConfigured } from '@/services/supabase';
import { useT } from '@/shared/theme';

import { parseRequiredFullName } from '@/shared/utils/person-name';
import { parseOptionalWhatsAppPhone } from '@/shared/utils/phone';

import { useAuth } from '../hooks/useAuth';

export function SignUpScreen() {
  const t = useT();
  const { signUp, isLoading, error, infoMessage, clearError, clearInfoMessage } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const isConfigured = isSupabaseConfigured();

  async function handleSubmit() {
    clearError();
    clearInfoMessage();
    setValidationError(null);

    const parsedName = parseRequiredFullName(name);
    if ('error' in parsedName) {
      setValidationError(parsedName.error);
      return;
    }

    if (!email.trim()) {
      setValidationError(t('auth.validationEmailRequired'));
      return;
    }

    const parsedPhone = parseOptionalWhatsAppPhone(phone);
    if ('error' in parsedPhone) {
      setValidationError(parsedPhone.error);
      return;
    }

    if (password.length < 6) {
      setValidationError(t('auth.validationPasswordMin'));
      return;
    }

    try {
      await signUp({
        name: parsedName.name,
        email: email.trim(),
        password,
        phone: parsedPhone.phone,
      });
    } catch {
      // Erro já tratado no store.
    }
  }

  return (
    <View className="flex-1 bg-background">
      <AppScreen edges={['top', 'left', 'right', 'bottom']} className="bg-background">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerClassName="flex-grow justify-center px-6 py-10"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-8 items-center">
              <Text className="text-[32px] font-semibold tracking-tight text-ink">
                {t('auth.signUpHeroTitle')}
              </Text>
              <Text className="mt-2 text-center text-base leading-6 text-muted">
                {t('auth.signUpHeroSubtitle')}
              </Text>
            </View>

            <Card>
              <Text className="text-2xl font-semibold text-ink">{t('auth.signUpTitle')}</Text>
              <Text className="mt-1 text-sm text-muted">{t('auth.signUpSubtitle')}</Text>

              {!isConfigured ? (
                <View className="mt-4">
                  <FeedbackBanner variant="warning" message={t('auth.configWarning')} />
                </View>
              ) : null}

              <View className="mt-6 gap-4">
                <TextField
                  label={t('auth.fullNameLabel')}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('auth.fullNamePlaceholder')}
                  autoCapitalize="words"
                  autoComplete="name"
                  icon="person-outline"
                />
                <TextField
                  label={t('auth.emailLabel')}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.emailPlaceholder')}
                  keyboardType="email-address"
                  autoComplete="email"
                />
                <TextField
                  label={t('auth.whatsappLabel')}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t('auth.whatsappPlaceholder')}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  icon="logo-whatsapp"
                />
                <PasswordField
                  label={t('auth.passwordLabel')}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('auth.passwordPlaceholderMin')}
                  autoComplete="new-password"
                />
              </View>

              {validationError ? (
                <View className="mt-4">
                  <FeedbackBanner message={validationError} variant="warning" />
                </View>
              ) : null}

              {error ? (
                <View className="mt-4">
                  <FeedbackBanner message={error} variant="warning" />
                </View>
              ) : null}

              {infoMessage ? (
                <View className="mt-4">
                  <FeedbackBanner message={infoMessage} variant="success" />
                </View>
              ) : null}

              <Button
                className="mt-6"
                label={isLoading ? t('auth.signUpButtonLoading') : t('auth.signUpButton')}
                onPress={() => void handleSubmit()}
                loading={isLoading}
                disabled={!isConfigured}
              />
            </Card>

            <View className="mt-8 flex-row justify-center">
              <Text className="text-muted">{t('auth.haveAccount')}</Text>
              <Link href={routes.signIn} asChild>
                <Pressable>
                  <Text className="font-semibold text-primary">{t('auth.signInButton')}</Text>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </AppScreen>
    </View>
  );
}
