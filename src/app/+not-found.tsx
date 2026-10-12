import { useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen>
      <EmptyState title="Wala dito." body="Baka luma na ang link." action={<Button label="Balik sa mapa" onPress={() => router.replace('/')} />} />
    </Screen>
  );
}
