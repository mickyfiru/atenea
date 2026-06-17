import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radius } from '../constants/theme';
import { RootScreenProps } from '../navigation/types';
import { startPhoneSignIn } from '../services/auth';

export function PhoneAuthScreen({ navigation }: RootScreenProps<'PhoneAuth'>) {
  const [phoneNumber, setPhoneNumber] = useState('+56 9 ');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await startPhoneSignIn(phoneNumber);
      navigation.navigate('OtpVerification', {
        phoneNumber,
        verificationId: result.mode === 'mock' ? result.verificationId : undefined,
      });
    } catch {
      setError('No pudimos iniciar la verificacion. Revisa el numero e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <View>
          <Text style={styles.title}>Ingresa tu celular</Text>
          <Text style={styles.subtitle}>
            ATENEA usara Firebase Auth para verificar tu numero con un codigo OTP.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Numero telefonico</Text>
          <TextInput
            keyboardType="phone-pad"
            onChangeText={setPhoneNumber}
            placeholder="+56 9 1234 5678"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={phoneNumber}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.actions}>
          <PrimaryButton label={loading ? 'Enviando...' : 'Enviar codigo'} onPress={submit} />
          <PrimaryButton label="Volver" onPress={() => navigation.goBack()} variant="light" />
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
    gap: 10,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  input: {
    backgroundColor: colors.soft,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
    minHeight: 64,
    paddingHorizontal: 18,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    gap: 12,
  },
});
