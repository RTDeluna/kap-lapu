import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from './AppText';

export interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** A simple bottom sheet over a dimmed backdrop. Tapping outside closes it. */
export function ConfirmSheet({ visible, title, onClose, children }: ConfirmSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.grip} />
          <AppText variant="title" accessibilityRole="header">
            {title}
          </AppText>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,24,30,0.5)' },
  sheet: {
    backgroundColor: theme.colors.surfaceRaised,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.space[5],
    paddingBottom: Math.max(rt.insets.bottom, theme.space[5]),
    gap: theme.space[4],
    boxShadow: theme.shadow.sheet,
  },
  grip: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.line,
  },
}));
