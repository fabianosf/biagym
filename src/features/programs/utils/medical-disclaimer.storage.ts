import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@treinos_atleta/medical_disclaimer_accepted_v1';

export async function hasAcceptedMedicalDisclaimer(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  return value === 'true';
}

export async function acceptMedicalDisclaimer(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, 'true');
}
