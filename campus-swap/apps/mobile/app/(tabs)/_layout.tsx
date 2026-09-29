import { Tabs } from 'expo-router';
import { Platform, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { colors, fonts, layout } from '@/theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.crimson,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: layout.tabBarHeight + (Platform.OS === 'ios' ? insets.bottom - 24 : 0),
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 12),
          backgroundColor: colors.white,
          borderTopColor: colors.tabBorder,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        tabBarItemStyle: { minWidth: 60 },
      }}
    >
      <Tabs.Screen name="index" options={tab('Home', 'home')} />
      <Tabs.Screen name="sell" options={tab('Sell', 'plus')} />
      <Tabs.Screen name="inbox" options={tab('Inbox', 'inbox')} />
      <Tabs.Screen name="profile" options={tab('Profile', 'profile')} />
    </Tabs>
  );
}

/** The active tab is drawn a touch heavier, matching the design screens. */
function tab(title: string, icon: IconName) {
  return {
    title,
    tabBarIcon: ({ color, focused }: { color: ColorValue; focused: boolean }) => (
      <Icon name={icon} size={22} color={color} strokeWidth={focused ? 1.9 : 1.6} />
    ),
    tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
    tabBarAccessibilityLabel: title,
  };
}
