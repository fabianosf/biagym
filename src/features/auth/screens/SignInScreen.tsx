import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { routes } from '@/shared/constants/routes';
import {
  AppScreen,
  BrandMark,
  Button,
  Card,
  FeedbackBanner,
  PasswordField,
  TextField,
} from '@/shared/components';
import { isSupabaseConfigured } from '@/services/supabase';

import { useAuth } from '../hooks/useAuth';

export function SignInScreen() {
  const { signIn, requestPasswordReset, isLoading, error, infoMessage, clearError, clearInfoMessage } =
    useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const isConfigured = isSupabaseConfigured();

  const fieldErrors = useMemo(() => {
    if (!validationError) {
      return { email: null, password: null };
    }

    if (validationError.includes('e-mail')) {
      return { email: validationError, password: null };
    }

    if (validationError.includes('senha')) {
      return { email: null, password: validationError };
    }

    return { email: null, password: null };
  }, [validationError]);

  async function handleSubmit() {
    clearError();
    clearInfoMessage();
    setValidationError(null);

    if (!email.trim()) {
      setValidationError('Informe seu e-mail.');
      return;
    }

    if (!password) {
      setValidationError('Informe sua senha.');
      return;
    }

    try {
      await signIn({ email: email.trim(), password });
    } catch {
      // Erro já tratado no store.
    }
  }

  async function handlePasswordReset() {
    clearError();
    clearInfoMessage();
    setValidationError(null);

    if (!email.trim()) {
      setValidationError('Informe seu e-mail para redefinir a senha.');
      return;
    }

    setIsResetting(true);
    try {
      await requestPasswordReset(email.trim());
    } catch {
      // Erro já tratado no store.
    } finally {
      setIsResetting(false);
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
              <BrandMark size={56} showName={false} />
              <Text className="mt-3 text-center text-base leading-6 text-muted">
                Treinos, aulas e progresso no seu ritmo.
              </Text>
            </View>

            <Card>
              <Text className="text-2xl font-semibold text-ink">Entrar</Text>
              <Text className="mt-1 text-sm text-muted">Acesse programas, aulas e progresso.</Text>

              {!isConfigured ? (
                <View className="mt-4">
                  <FeedbackBanner
                    variant="warning"
                    message="Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env."
                  />
                </View>
              ) : null}

              <View className="mt-6 gap-4">
                <TextField
                  label="E-mail"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  keyboardType="email-address"
                  autoComplete="email"
                  error={fieldErrors.email}
                />
                <PasswordField
                  label="Senha"
                  value={password}
                  onChangeText={setPassword}
                  autoComplete="password"
                  error={fieldErrors.password}
                />
              </View>

              {validationError && !fieldErrors.email && !fieldErrors.password ? (
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
                label={isLoading ? 'Entrando...' : 'Entrar'}
                onPress={() => void handleSubmit()}
                loading={isLoading}
                disabled={isResetting || !isConfigured}
              />

              <Pressable
                disabled={isLoading || isResetting || !isConfigured}
                onPress={() => void handlePasswordReset()}
                className="mt-3 min-h-[44px] items-center justify-center"
              >
                <Text className="text-sm font-medium text-muted">
                  {isResetting ? 'Enviando link...' : 'Esqueci minha senha'}
                </Text>
              </Pressable>
            </Card>

            <View className="mt-8 flex-row justify-center">
              <Text className="text-muted">Não tem conta? </Text>
              <Link href={routes.signUp} asChild>
                <Pressable>
                  <Text className="font-semibold text-primary">Criar conta</Text>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </AppScreen>
    </View>
  );
}
