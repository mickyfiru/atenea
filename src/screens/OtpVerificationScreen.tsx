import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radius } from '../constants/theme';
import { RootScreenProps } from '../navigation/types';
import { verifyOtpCode } from '../services/auth';

export function OtpVerificationScreen({
  navigation,
  route,
}: RootScreenProps<'OtpVerification'>) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    const ok = await verifyOtpCode(code);

    if (!ok) {
      setError('Ingresa el codigo enviado por SMS.');
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Atenea' } }],
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <View>
          <Text style={styles.title}>Verifica el codigo</Text>
          <Text style={styles.subtitle}>
            Enviamos un OTP a {route.params.phoneNumber}. En modo mock puedes usar cualquier
            codigo de 4 digitos.
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setCode}
            placeholder="000000"
            placeholderTextColor={colors.muted}
            style={styles.input}
            textAlign="center"
            value={code}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {route.params.verificationId ? (
            <Text style={styles.mock}>Verificacion local activa: {route.params.verificationId}</Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Verificar" onPress={submit} />
          <PrimaryButton label="Cambiar numero" onPress={() => navigation.goBack()} variant="light" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
    marginTop: 28,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 25,
    marginTop: 10,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: colors.soft,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 6,
    minHeight: 76,
    paddingHorizontal: 18,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  mock: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
});
