import { colors, radius, shadow, size, spacing, typography, type ThemeId, type TypeStyleName } from './tokens';

/**
 * Font family names as registered with expo-font (see src/theme/fonts.ts).
 * React Native picks a weight by family name, so each weight is its own family and
 * text styles never set fontWeight (Android ignores it for custom fonts anyway).
 */
export const fontFamilies = {
  display: {
    700: 'BricolageGrotesque_700Bold',
    800: 'BricolageGrotesque_800ExtraBold',
  },
  sans: {
    400: 'Figtree_400Regular',
    600: 'Figtree_600SemiBold',
    700: 'Figtree_700Bold',
  },
} as const;

function familyFor(family: 'display' | 'sans', weight: number): string {
  const weights: Record<number, string> = fontFamilies[family];
  const name = weights[weight];
  if (!name) throw new Error(`No ${family} font loaded for weight ${weight}`);
  return name;
}

export type TextVariant = TypeStyleName;

export interface TypeStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

/** The nine type styles from tokens.json, ready to drop into a Text style. */
export const textStyles = Object.fromEntries(
  (Object.keys(typography) as TypeStyleName[]).map((name) => {
    const t = typography[name];
    const style: TypeStyle = {
      fontFamily: familyFor(t.family, t.fontWeight),
      fontSize: t.fontSize,
      lineHeight: t.lineHeight,
      letterSpacing: t.letterSpacing,
    };
    return [name, style];
  }),
) as Record<TypeStyleName, TypeStyle>;

function makeTheme(id: ThemeId) {
  return {
    id,
    colors: colors[id],
    space: spacing,
    radius,
    size,
    shadow: shadow[id],
    text: textStyles,
  } as const;
}

export const lightTheme = makeTheme('light');
export const darkTheme = makeTheme('dark');

export type AppTheme = typeof lightTheme | typeof darkTheme;
export type ThemeColors = AppTheme['colors'];
