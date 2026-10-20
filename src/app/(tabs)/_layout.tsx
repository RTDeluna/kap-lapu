import { Tabs } from 'expo-router/js-tabs';
import { useUnistyles } from 'react-native-unistyles';

import { BoatIcon, CalendarBlankIcon, ICON_TAB, MapTrifoldIcon, UserCircleIcon } from '@/components/icons';

export default function TabsLayout() {
  const { theme } = useUnistyles();
  const c = theme.colors;
  // Duotone at 24: the selected tab gets a mango fill behind an ink stroke, as in the mockups.
  const iconProps = (focused: boolean) =>
    ({
      size: ICON_TAB,
      weight: 'duotone',
      color: focused ? c.ink : c.inkMuted,
      duotoneColor: focused ? c.mango : c.inkMuted,
      duotoneOpacity: focused ? 0.45 : 0.15,
    }) as const;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.ink,
        tabBarInactiveTintColor: c.inkMuted,
        tabBarStyle: {
          backgroundColor: c.surfaceRaised,
          borderTopColor: c.line,
          minHeight: 64,
        },
        tabBarItemStyle: { minHeight: theme.size.tapMin },
        tabBarLabelStyle: {
          fontFamily: theme.text.label.fontFamily,
          fontSize: 12,
          letterSpacing: theme.text.label.letterSpacing,
        },
        sceneStyle: { backgroundColor: c.surface },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ focused }) => <MapTrifoldIcon {...iconProps(focused)} />,
        }}
      />
      <Tabs.Screen
        name="bangka"
        options={{
          title: 'Bangka',
          tabBarIcon: ({ focused }) => <BoatIcon {...iconProps(focused)} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ focused }) => <CalendarBlankIcon {...iconProps(focused)} />,
        }}
      />
      <Tabs.Screen
        name="ako"
        options={{
          title: 'Ako',
          tabBarIcon: ({ focused }) => <UserCircleIcon {...iconProps(focused)} />,
        }}
      />
    </Tabs>
  );
}
