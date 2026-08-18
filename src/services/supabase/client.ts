import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aesjs from 'aes-js';
import * as SecureStore from 'expo-secure-store';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './types';

/**
 * expo-secure-store tem limite de ~2KB por item (Android Keystore), e a
 * sessão do Supabase costuma passar disso. A chave AES fica no SecureStore
 * (hardware-backed) e o payload da sessão (maior) fica no AsyncStorage, mas
 * cifrado — um dump do AsyncStorage sozinho não é mais utilizável.
 */
class LargeSecureStore {
  private async getOrCreateKey(keyName: string): Promise<Uint8Array> {
    const existing = await SecureStore.getItemAsync(keyName);
    if (existing) {
      return aesjs.utils.hex.toBytes(existing);
    }

    const key = crypto.getRandomValues(new Uint8Array(32));
    await SecureStore.setItemAsync(keyName, aesjs.utils.hex.fromBytes(key));
    return key;
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) {
      return null;
    }

    const encryptionKey = await this.getOrCreateKey(`${key}-encryption-key`);
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const bytes = cipher.decrypt(aesjs.utils.hex.toBytes(encrypted));
    return aesjs.utils.utf8.fromBytes(bytes);
  }

  async setItem(key: string, value: string): Promise<void> {
    const encryptionKey = await this.getOrCreateKey(`${key}-encryption-key`);
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const bytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await AsyncStorage.setItem(key, aesjs.utils.hex.fromBytes(bytes));
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(`${key}-encryption-key`);
  }
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function isPlaceholder(value: string | undefined): boolean {
  if (!value) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized.includes('seu-projeto') ||
    normalized.includes('sua-chave') ||
    normalized === 'your-anon-key'
  );
}

export function isSupabaseConfigured(): boolean {
  return !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey);
}

function createSupabaseClient(): SupabaseClient<Database> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase não configurado. Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  return createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      storage: new LargeSecureStore(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

let client: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!client) {
    client = createSupabaseClient();
  }

  return client;
}
