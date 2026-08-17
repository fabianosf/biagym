import type { ReactNode } from 'react';

import { captureException } from '@/services/observability';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Ocorreu um erro inesperado.',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    captureException(error, {
      componentStack: errorInfo.componentStack,
      boundary: 'AppErrorBoundary',
    });
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-background px-6">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <Ionicons name="alert-circle-outline" size={28} color="#F87171" />
          </View>
          <Text className="text-center text-xl font-semibold text-ink">
            Algo deu errado
          </Text>
          <Text className="mt-3 text-center text-sm leading-6 text-muted">
            {this.state.message}
          </Text>
          <Pressable
            onPress={this.handleRetry}
            className="mt-6 min-h-[52px] items-center justify-center rounded-2xl bg-primary px-5"
          >
            <Text className="font-semibold text-white">Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
