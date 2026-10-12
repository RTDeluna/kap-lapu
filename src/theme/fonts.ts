import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque/800ExtraBold';
import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';

import { fontFamilies } from './themes';

/** Only the five weights the type scale uses, keyed by the family names in themes.ts. */
export const appFonts = {
  [fontFamilies.display[700]]: BricolageGrotesque_700Bold,
  [fontFamilies.display[800]]: BricolageGrotesque_800ExtraBold,
  [fontFamilies.sans[400]]: Figtree_400Regular,
  [fontFamilies.sans[600]]: Figtree_600SemiBold,
  [fontFamilies.sans[700]]: Figtree_700Bold,
};
