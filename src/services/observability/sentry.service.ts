import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

type SentryUserContext = {
  id: string;
  role?: string;
};

type SentryCaptureContext = Record<string, unknown>;

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
const APP_ENV =
  process.env.EXPO_PUBLIC_APP_ENV ?? (__DEV__ ? 'development' : 'production');

let isInitialized = false;

function shouldEnableSentry(): boolean {
  if (!SENTRY_DSN) {
    return false;
  }

  if (__DEV__) {
    return process.env.EXPO_PUBLIC_SENTRY_ENABLED_IN_DEV === 'true';
  }

  return APP_ENV === 'production' || APP_ENV === 'staging';
}

function scrubEventUserData(event: Sentry.Event): void {
  if (event.user) {
    delete event.user.email;
    delete event.user.username;
    delete event.user.ip_address;
  }

  if (event.request?.headers) {
    delete event.request.headers.Authorization;
    delete event.request.headers.authorization;
    delete event.request.headers.Cookie;
    delete event.request.headers.cookie;
  }
}

export function initSentry(): void {
  if (isInitialized) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: shouldEnableSentry(),
    environment: APP_ENV,
    release: `${Constants.expoConfig?.slug ?? 'biagym'}@${Constants.expoConfig?.version ?? '1.0.0'}`,
    dist:
      Constants.expoConfig?.ios?.buildNumber ??
      String(Constants.expoConfig?.android?.versionCode ?? '1'),
    tracesSampleRate: APP_ENV === 'production' ? 0.2 : 0,
    enableAutoSessionTracking: shouldEnableSentry(),
    attachStacktrace: true,
    beforeSend(event) {
      scrubEventUserData(event);
      return event;
    },
  });

  Sentry.setTag('app.slug', Constants.expoConfig?.slug ?? 'biagym');
  isInitialized = true;
}

export function isSentryEnabled(): boolean {
  return shouldEnableSentry();
}

export function setSentryUser(user: SentryUserContext | null): void {
  if (!shouldEnableSentry()) {
    return;
  }

  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
  });

  if (user.role) {
    Sentry.setTag('user.role', user.role);
  }
}

export function setSentryScreenContext(pathname: string, routeLabel: string): void {
  if (!shouldEnableSentry()) {
    return;
  }

  Sentry.setContext('navigation', {
    pathname,
    route: routeLabel,
  });
}

export function captureException(error: unknown, context?: SentryCaptureContext): void {
  if (!shouldEnableSentry()) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('extra', context);
    }

    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  if (!shouldEnableSentry()) {
    return;
  }

  Sentry.captureMessage(message, level);
}

export { Sentry };
