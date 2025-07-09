import { useEffect, useState } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { theme } from '@/constants/theme';
import { StyleSheet, Text } from 'react-native';

const toastConfig = {
  info: (props: any) => (
    <View style={toastStyles.toastContainer}>
      <Text style={toastStyles.toastTitle}>{props.text1}</Text>
      {props.text2 ? <Text style={toastStyles.toastMessage}>{props.text2}</Text> : null}
    </View>
  ),
  success: (props: any) => (
    <View style={[toastStyles.toastContainer, { borderLeftColor: theme.colors.success }] }>
      <Text style={toastStyles.toastTitle}>{props.text1}</Text>
      {props.text2 ? <Text style={toastStyles.toastMessage}>{props.text2}</Text> : null}
    </View>
  ),
  error: (props: any) => (
    <View style={[toastStyles.toastContainer, { borderLeftColor: theme.colors.error }] }>
      <Text style={toastStyles.toastTitle}>{props.text1}</Text>
      {props.text2 ? <Text style={toastStyles.toastMessage}>{props.text2}</Text> : null}
    </View>
  ),
};

const toastStyles = StyleSheet.create({
  toastContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  toastTitle: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  toastMessage: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
});

export default function RootLayout() {
  useFrameworkReady();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      const publicRoutes = ['/login', '/signup', '/otp-verification'];
      if (!token && !publicRoutes.includes(pathname)) {
        router.replace('/login');
      }
      setCheckingAuth(false);
    };
    checkToken();
  }, [pathname]);

  if (checkingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
      <Toast config={toastConfig} position="top" topOffset={60} />
    </>
  );
}