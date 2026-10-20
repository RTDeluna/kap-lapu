import { forwardRef } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from './AppText';

export interface TextFieldProps extends TextInputProps {
  label: string;
  helper?: string;
  error?: string | null;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, helper, error, style, ...rest },
  ref,
) {
  const { theme } = useUnistyles();
  styles.useVariants({ invalid: !!error });
  return (
    <View style={styles.wrap}>
      <AppText variant="bodySm" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.inkMuted}
        selectionColor={theme.colors.dagat}
        maxFontSizeMultiplier={1.6}
        {...rest}
        style={[styles.input, style]}
      />
      {error ? (
        <AppText variant="bodySm" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : helper ? (
        <AppText variant="bodySm" tone="muted">
          {helper}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create((theme) => ({
  wrap: { gap: 6 },
  label: { fontFamily: theme.text.bodyStrong.fontFamily, color: theme.colors.ink },
  input: {
    minHeight: theme.size.tapMin,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surfaceRaised,
    paddingHorizontal: 14,
    color: theme.colors.ink,
    fontFamily: theme.text.body.fontFamily,
    fontSize: theme.text.body.fontSize,
    variants: {
      invalid: {
        true: { borderColor: theme.colors.danger },
        false: { borderColor: theme.colors.lineStrong },
      },
    },
  },
}));
