import AsyncStorage from '@react-native-async-storage/async-storage';

export const setItem = async (key: string, value: any) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

export const getItem = async (key: string) => {
  const value = await AsyncStorage.getItem(key);
  if (!value) return null;
  // Try to parse as JSON, but if fails, return as string (for token)
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const removeItem = async (key: string) => {
  await AsyncStorage.removeItem(key);
};

export const clearAll = async () => {
  await AsyncStorage.clear();
};
