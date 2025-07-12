import { useEffect, useState } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { theme } from '@/constants/theme';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getPartnerProfile } from '@/utils/api';

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
    const checkAuthAndPartner = async () => {
      const token = await AsyncStorage.getItem('token');
      const publicRoutes = ['/login', '/signup', '/otp-verification'];
      if (!token && !publicRoutes.includes(pathname)) {
        router.replace('/login');
        setCheckingAuth(false);
        return;
      }
      // If token exists, check if partner profile exists in DB
      if (token && !publicRoutes.includes(pathname)) {
        try {
          const res = await getPartnerProfile();
          if (!res || !res.data) {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('partner');
            router.replace('/login');
            setCheckingAuth(false);
            return;
          }
        } catch (e) {
          // If error is 404 or not found, treat as missing partner
          const err: any = e;
          if (err?.response?.status === 404 || (err?.message && typeof err.message === 'string' && err.message.toLowerCase().includes('not found'))) {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('partner');
            router.replace('/login');
            setCheckingAuth(false);
            return;
          }
        }
      }
      setCheckingAuth(false);
    };
    checkAuthAndPartner();
  }, [pathname]);

  if (checkingAuth) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
        <Toast config={toastConfig} position="top" topOffset={60} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}