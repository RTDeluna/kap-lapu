import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from './AppText';

export interface EmptyStateProps {
  title: string;
  body?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, body, icon, action }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      {icon}
      <AppText variant="title" style={styles.center}>
        {title}
      </AppText>
      {body ? (
        <AppText tone="muted" style={styles.center}>
          {body}
        </AppText>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: { alignItems: 'center', gap: theme.space[3], paddingVertical: theme.space[8] },
  center: { textAlign: 'center' },
}));
