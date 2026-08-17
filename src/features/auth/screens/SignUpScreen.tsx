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

import { parseRequiredFullName } from '@/shared/utils/person-name';

import { useAuth } from '../hooks/useAuth';

export function SignUpScreen() {
  const { signUp, isLoading, error, infoMessage, clearError, clearInfoMessage } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
      setValidationError('Informe seu e-mail.');
      return;
    }

    if (password.length < 6) {
      setValidationError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      await signUp({
        name: parsedName.name,
        email: email.trim(),
        password,
      });
    } catch {
      // Erro já tratado no store.
    }
  }

  return (
    <View className="flex-1 bg-background" style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
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
              <Text className="text-[32px] font-semibold tracking-tight text-ink">Comece agora</Text>
              <Text className="mt-2 text-center text-base leading-6 text-muted">
                Uma conta. Programas, aulas e progresso no mesmo lugar.
              </Text>
            </View>

            <Card>
              <Text className="text-2xl font-semibold text-ink">Criar conta</Text>
              <Text className="mt-1 text-sm text-muted">
                Cadastro rápido. Confirme o e-mail se o Supabase exigir.
              </Text>

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
                  label="Nome completo"
                  value={name}
                  onChangeText={setName}
                  placeholder="Bruno Costa"
                  autoCapitalize="words"
                  autoComplete="name"
                  icon="person-outline"
                />
                <TextField
                  label="E-mail"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  keyboardType="email-address"
                  autoComplete="email"
                />
                <PasswordField
                  label="Senha"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
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
                label={isLoading ? 'Criando conta...' : 'Criar conta'}
                onPress={() => void handleSubmit()}
                loading={isLoading}
                disabled={!isConfigured}
              />
            </Card>

            <View className="mt-8 flex-row justify-center">
              <Text className="text-muted">Já tem conta? </Text>
              <Link href={routes.signIn} asChild>
                <Pressable>
                  <Text className="font-semibold text-primary">Entrar</Text>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </AppScreen>
    </View>
  );
}
