import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aesjs from 'aes-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './types';

/**
 * expo-secure-store tem limite de ~2KB por item (Android Keystore), e a
 * sessão do Supabase costuma passar disso. A chave AES fica no SecureStore
 * (hardware-backed) e o payload da sessão (maior) fica no AsyncStorage, mas
 * cifrado — um dump do AsyncStorage sozinho não é mais utilizável.
 *
 * expo-secure-store não existe no navegador (não há keychain de SO em web).
 * Nesse caso a chave também vai pro AsyncStorage (localStorage) — menos
 * blindado que o Keystore nativo, mas é a mesma limitação que qualquer app
 * web tem; não dá pra emular hardware-backed storage num browser.
 */
const HEX_PATTERN = /^[0-9a-fA-F]+$/;

function isValidHex(value: string): boolean {
  return value.length > 0 && value.length % 2 === 0 && HEX_PATTERN.test(value);
}

class LargeSecureStore {
  private async readRawKey(keyName: string): Promise<string | null> {
    try {
      return Platform.OS === 'web'
        ? await AsyncStorage.getItem(keyName)
        : await SecureStore.getItemAsync(keyName);
    } catch (error) {
      // Ex.: chave do Android Keystore invalidada (restauração de backup, troca de
      // biometria). Trata como ausente para que uma nova chave seja gerada.
      console.warn(`[LargeSecureStore] Falha ao ler "${keyName}" do storage nativo.`, error);
      return null;
    }
  }

  private async createKey(keyName: string): Promise<Uint8Array> {
    const key = crypto.getRandomValues(new Uint8Array(32));
    const hexKey = aesjs.utils.hex.fromBytes(key);
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(keyName, hexKey);
    } else {
      await SecureStore.setItemAsync(keyName, hexKey);
    }
    return key;
  }

  private async getOrCreateKey(keyName: string): Promise<Uint8Array> {
    const existing = await this.readRawKey(keyName);
    if (existing && isValidHex(existing)) {
      return aesjs.utils.hex.toBytes(existing);
    }

    return this.createKey(keyName);
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) {
      return null;
    }

    try {
      if (!isValidHex(encrypted)) {
        throw new Error('Payload armazenado não é hexadecimal válido.');
      }

      const encryptionKey = await this.getOrCreateKey(`${key}-encryption-key`);
      const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
      const bytes = cipher.decrypt(aesjs.utils.hex.toBytes(encrypted));
      const value = aesjs.utils.utf8.fromBytes(bytes);

      // Sessão do Supabase é sempre JSON; se a decriptação usou a chave errada
      // (ex.: chave recriada após corrupção), o resultado é lixo e falha aqui.
      JSON.parse(value);
      return value;
    } catch (error) {
      console.warn(`[LargeSecureStore] Entrada corrompida em "${key}", limpando.`, error);
      await this.removeItem(key);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const encryptionKey = await this.getOrCreateKey(`${key}-encryption-key`);
      const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
      const bytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
      await AsyncStorage.setItem(key, aesjs.utils.hex.fromBytes(bytes));
    } catch (error) {
      // Nunca deixa falha de storage derrubar o fluxo de login/navegação.
      console.warn(`[LargeSecureStore] Falha ao gravar "${key}".`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(`${key}-encryption-key`);
      } else {
        await SecureStore.deleteItemAsync(`${key}-encryption-key`);
      }
    } catch (error) {
      console.warn(`[LargeSecureStore] Falha ao remover "${key}".`, error);
    }
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
