import type { ReactNode } from 'react';

import { captureException } from '@/services/observability';
import { translate } from '@/shared/i18n';
import { usePreferencesStore } from '@/shared/theme/preferences.store';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

function tCurrent(key: string): string {
  return translate(usePreferencesStore.getState().locale, key);
}

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  message: string;
  retryKey: number;
};

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: '',
    retryKey: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return {
      hasError: true,
      message: error.message || tCurrent('common.unexpectedError'),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    captureException(error, {
      componentStack: errorInfo.componentStack,
      boundary: 'AppErrorBoundary',
    });
  }

  private handleRetry = (): void => {
    // Incrementa retryKey para forçar o remount da subárvore — se a
    // renderização quebrou por estado interno corrompido de um filho (não
    // só um erro transitório de rede), reabrir sem remount reproduziria o
    // mesmo crash imediatamente.
    this.setState((current) => ({
      hasError: false,
      message: '',
      retryKey: current.retryKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-background px-6">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <Ionicons name="alert-circle-outline" size={28} color="#F87171" />
          </View>
          <Text className="text-center text-xl font-semibold text-ink">
            {tCurrent('common.somethingWentWrong')}
          </Text>
          <Text className="mt-3 text-center text-sm leading-6 text-muted">
            {this.state.message}
          </Text>
          <Pressable
            onPress={this.handleRetry}
            className="mt-6 min-h-[52px] items-center justify-center rounded-2xl bg-primary px-5"
          >
            <Text className="font-semibold text-white">{tCurrent('workouts.tryAgain')}</Text>
          </Pressable>
        </View>
      );
    }

    return <React.Fragment key={this.state.retryKey}>{this.props.children}</React.Fragment>;
  }
}
