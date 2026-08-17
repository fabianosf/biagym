import Constants from 'expo-constants';

export const APP_NAME = 'BiAGym';
export const APP_SLUG = 'biagym';
export const APP_SCHEME = 'biagym';
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
export const APP_BUILD =
  Constants.nativeBuildVersion ??
  Constants.expoConfig?.ios?.buildNumber ??
  String(Constants.expoConfig?.android?.versionCode ?? '1');

export const BUNDLE_IDENTIFIER = 'com.treinosatleta.app';

export function getSupabaseSqlEditorUrl(): string | null {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return null;
  }

  try {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
    if (!projectRef) {
      return null;
    }
    return `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
  } catch {
    return null;
  }
}
