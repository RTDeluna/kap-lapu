import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { CalendarBlankIcon } from '@/components/icons';
import { Screen } from '@/components/Screen';

/** Stage 2 placeholder: bookings and payments do not exist yet. */
export default function TripsScreen() {
  const router = useRouter();
  const { theme } = useUnistyles();
  return (
    <Screen>
      <AppText variant="titleLg" accessibilityRole="header">
        Trips
      </AppText>
      <View style={styles.card}>
        <CalendarBlankIcon size={40} color={theme.colors.dagat} weight="duotone" />
        <AppText>Bookings open soon. Sa ngayon, mag message muna sa owner mula sa Bangka tab.</AppText>
        <Button label="Tingnan ang mga bangka" tone="primary" onPress={() => router.navigate('/bangka')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    gap: theme.space[4],
    padding: theme.space[5],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceRaised,
  },
}));
