import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Truck } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import Button from '@/components/Button';
import { verifyPartner } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OTPVerification() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await verifyPartner({ email, otp });
      const { token, partner } = res.data || res;
      if (token && partner) {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('partner', JSON.stringify(partner));
        console.log('Token after verification:', token); // Log token after verification
        router.replace('/(tabs)');
      } else {
        Alert.alert('Success', 'OTP verified! You can now login.', [
          { text: 'OK', onPress: () => router.replace('/login') }
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Truck size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>OTP Verification</Text>
          <Text style={styles.subtitle}>Enter the OTP sent to your email</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#eee' }]}
              value={email as string}
              editable={false}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>OTP</Text>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              placeholder="Enter OTP"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
          <Button
            title={loading ? 'Verifying...' : 'Verify'}
            onPress={handleVerify}
            loading={loading}
            disabled={loading || !otp}
            style={styles.submitButton}
          />
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={styles.switchTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
    marginBottom: theme.spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  form: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.white,
  },
  submitButton: {
    marginTop: theme.spacing.lg,
  },
  switchButton: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  switchText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  switchTextBold: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});
