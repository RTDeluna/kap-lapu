import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/components/AppText';
import { CaretLeftIcon } from '@/components/icons';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';

// TODO: replace with the real Privacy text before launch.
export default function PrivacyScreen() {
  const router = useRouter();
  const { theme } = useUnistyles();
  return (
    <Screen>
      <View style={styles.header}>
        <IconButton accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/ako'))}>
          <CaretLeftIcon size={22} color={theme.colors.ink} weight="bold" />
        </IconButton>
        <AppText variant="titleLg" accessibilityRole="header">
          Privacy
        </AppText>
      </View>
      <AppText tone="muted">Coming before launch.</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
}));
