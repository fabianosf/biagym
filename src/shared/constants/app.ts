import Constants from 'expo-constants';

import { buildWhatsAppUrl } from '@/shared/utils/phone';

export const APP_NAME = 'BiAGym';
export const APP_SLUG = 'biagym';
export const APP_SCHEME = 'biagym';
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
export const APP_BUILD =
  Constants.nativeBuildVersion ??
  Constants.expoConfig?.ios?.buildNumber ??
  String(Constants.expoConfig?.android?.versionCode ?? '1');

export const BUNDLE_IDENTIFIER = 'com.biagym.app';

export { BRAND_ICON, BRAND_LOGO } from './brand';

export function getStoreWhatsAppUrl(productName: string): string | null {
  const phone = process.env.EXPO_PUBLIC_STORE_WHATSAPP_PHONE;
  if (!phone) {
    return null;
  }

  const message = `Oi! Vi o produto "${productName}" na loja do app e queria saber como comprar.`;
  return buildWhatsAppUrl(phone, message);
}

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
