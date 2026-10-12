import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/components/AppText';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { XIcon } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/data/auth';
import { useLogCatch } from '@/data/catches';
import { useSpot } from '@/data/spots';
import { errorMessage } from '@/data/supabase';
import { parseWeightKg } from '@/lib/format';

const METHODS = ['shore casting', 'jigging', 'popping', 'squid jig', 'bottom', 'trolling'];

export default function LogCatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useUnistyles();
  const { userId, loading } = useAuth();
  const spot = useSpot(id).data;
  const logCatch = useLogCatch();

  const [species, setSpecies] = useState('');
  const [weight, setWeight] = useState('');
  const [method, setMethod] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (!loading && !userId) return <Redirect href={`/sign-in?next=${encodeURIComponent(`/spot/${id}/log-catch`)}`} />;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const submit = () => {
    setFormError(null);
    const name = species.trim();
    if (!name) {
      setFormError('Ilagay ang isda na nahuli mo.');
      return;
    }
    const kg = parseWeightKg(weight);
    if (kg !== null && (Number.isNaN(kg) || kg <= 0 || kg >= 500)) {
      setFormError('Ang timbang ay numero lang, halimbawa 2.1');
      return;
    }
    logCatch.mutate(
      { spotId: id, species: name, weightKg: kg, method },
      { onSuccess: close },
    );
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen topInset={false}>
        <View style={styles.header}>
          <IconButton accessibilityLabel="Close" onPress={close}>
            <XIcon size={22} color={theme.colors.ink} weight="bold" />
          </IconButton>
          <View style={styles.flex}>
            <AppText variant="title" accessibilityRole="header">
              Log a catch
            </AppText>
            {spot ? (
              <AppText variant="bodySm" tone="muted" numberOfLines={1}>
                {spot.name}
              </AppText>
            ) : null}
          </View>
        </View>

        <TextField
          label="Anong isda?"
          placeholder="Talakitok, pusit, lapu-lapu"
          value={species}
          onChangeText={setSpecies}
          maxLength={60}
          autoCapitalize="sentences"
          returnKeyType="next"
        />
        <TextField
          label="Timbang (kg)"
          helper="Optional"
          placeholder="2.1"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          maxLength={6}
        />

        <View style={styles.methods}>
          <AppText variant="bodySm" style={styles.label}>
            Paano nahuli?
          </AppText>
          <View style={styles.chips}>
            {METHODS.map((m) => (
              <Chip key={m} label={m} selected={method === m} onPress={() => setMethod(method === m ? null : m)} />
            ))}
          </View>
        </View>

        {formError || logCatch.error ? (
          <Banner tone="danger">{formError ?? errorMessage(logCatch.error)}</Banner>
        ) : null}

        <Button label="Save catch" tone="primary" size="large" loading={logCatch.isPending} onPress={submit} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create((theme) => ({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  methods: { gap: 6 },
  label: { fontFamily: theme.text.bodyStrong.fontFamily },
  chips: { flexDirection: 'row', flexWrap: 'wrap', columnGap: theme.space[2] },
}));
