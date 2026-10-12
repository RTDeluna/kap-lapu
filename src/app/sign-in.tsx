import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/components/AppText';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { AppleLogoIcon, GoogleLogoIcon, ICON_INLINE, XIcon } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { errorMessage, supabase } from '@/data/supabase';
import { formatPhPhone, normalizePhPhone } from '@/lib/phone';

type Step = 'phone' | 'code';

/** Only same-app paths are allowed as a return target. */
function safeNext(next: string | undefined): Href {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next as Href;
  return '/';
}

export default function SignInScreen() {
  const router = useRouter();
  const { theme } = useUnistyles();
  const { next } = useLocalSearchParams<{ next?: string }>();

  const [step, setStep] = useState<Step>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [phone, setPhone] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const sendCode = async () => {
    setError(null);
    const e164 = normalizePhPhone(phoneInput);
    if (!e164) {
      setError('Gamitin ang 09XXXXXXXXX o +639XXXXXXXXX.');
      return;
    }
    setBusy(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: e164 });
    setBusy(false);
    if (otpError) {
      setError(errorMessage(otpError));
      return;
    }
    setPhone(e164);
    setCode('');
    setStep('code');
  };

  const verify = async () => {
    if (!phone) return;
    setError(null);
    const token = code.replace(/\D/g, '');
    if (token.length !== 6) {
      setError('Anim na numero ang code.');
      return;
    }
    setBusy(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    setBusy(false);
    if (verifyError) {
      setError(errorMessage(verifyError));
      return;
    }
    // Replace the sign in modal with where the person was going.
    router.dismissTo(safeNext(next));
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen topInset={false}>
        <View style={styles.header}>
          <IconButton accessibilityLabel="Close" onPress={close}>
            <XIcon size={22} color={theme.colors.ink} weight="bold" />
          </IconButton>
        </View>

        <View style={styles.intro}>
          <AppText variant="titleLg" accessibilityRole="header">
            {step === 'phone' ? 'Mag sign in sa Laot' : 'Ilagay ang code'}
          </AppText>
          <AppText tone="muted">
            {step === 'phone'
              ? 'Kailangan ng account para mag pin, mag log ng huli, at mag message sa bangka.'
              : `Nag send kami ng 6 digit code sa ${phone ? formatPhPhone(phone) : 'number mo'}.`}
          </AppText>
        </View>

        {step === 'phone' ? (
          <>
            <TextField
              label="Mobile number"
              placeholder="0917 123 4567"
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              maxLength={17}
              error={error}
              onSubmitEditing={() => void sendCode()}
            />
            <Button label="Send code" tone="primary" size="large" loading={busy} onPress={() => void sendCode()} />

            <View style={styles.divider}>
              <View style={styles.rule} />
              <AppText variant="bodySm" tone="muted">
                Soon
              </AppText>
              <View style={styles.rule} />
            </View>
            {/* Placeholders only. Google and Apple sign in are not wired yet. */}
            <Button
              label="Google, coming soon"
              disabled
              icon={(c) => <GoogleLogoIcon size={ICON_INLINE} color={c} />}
              accessibilityLabel="Sign in with Google, coming soon"
            />
            <Button
              label="Apple, coming soon"
              disabled
              icon={(c) => <AppleLogoIcon size={ICON_INLINE} color={c} />}
              accessibilityLabel="Sign in with Apple, coming soon"
            />
          </>
        ) : (
          <>
            <TextField
              label="6 digit code"
              placeholder="123456"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={6}
              error={error}
              onSubmitEditing={() => void verify()}
            />
            <Banner>Hindi kailanman hihingi ang Laot ng OTP. Dito mo lang ito ilalagay.</Banner>
            <Button label="Verify" tone="primary" size="large" loading={busy} onPress={() => void verify()} />
            <Button
              label="Ibang number"
              tone="quiet"
              onPress={() => {
                setStep('phone');
                setError(null);
              }}
            />
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create((theme) => ({
  flex: { flex: 1 },
  header: { flexDirection: 'row' },
  intro: { gap: theme.space[2] },
  divider: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  rule: { flex: 1, height: 1, backgroundColor: theme.colors.line },
}));
