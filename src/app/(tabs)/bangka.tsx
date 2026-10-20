import { ActivityIndicator, FlatList, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/components/AppText';
import { Banner } from '@/components/Banner';
import { BoatCard } from '@/components/BoatCard';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { BoatIcon } from '@/components/icons';
import { useBoats } from '@/data/boats';

export default function BangkaScreen() {
  const { theme } = useUnistyles();
  const boats = useBoats();

  return (
    <FlatList
      style={styles.page}
      contentContainerStyle={styles.content}
      data={boats.data ?? []}
      keyExtractor={(b) => b.id}
      renderItem={({ item }) => <BoatCard boat={item} />}
      onRefresh={() => void boats.refetch()}
      refreshing={boats.isRefetching}
      ListHeaderComponent={
        <View style={styles.header}>
          <AppText variant="titleLg" accessibilityRole="header">
            Bangka sa Mariveles
          </AppText>
          <Banner>Sa bangka mo babayaran ang presyo ng trip. Huwag magbayad bago sumakay.</Banner>
        </View>
      }
      ListEmptyComponent={
        boats.isPending ? (
          <ActivityIndicator color={theme.colors.dagat} />
        ) : boats.isError ? (
          <EmptyState
            title="Hindi ma-load ang mga bangka"
            body="Check ang signal mo, tapos subukan ulit."
            action={<Button label="Subukan ulit" onPress={() => void boats.refetch()} />}
          />
        ) : (
          <EmptyState
            icon={<BoatIcon size={40} color={theme.colors.dagat} weight="duotone" />}
            title="Wala pang bangka dito"
            body="Ang mga owner ay nag ve-verify pa. Balik ka mamaya."
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  page: { flex: 1, backgroundColor: theme.colors.surface },
  content: {
    paddingTop: rt.insets.top + theme.space[5],
    paddingHorizontal: theme.space[4],
    paddingBottom: theme.space[6],
    gap: theme.space[3],
  },
  header: { gap: theme.space[3], marginBottom: theme.space[1] },
}));
