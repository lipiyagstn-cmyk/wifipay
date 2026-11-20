import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

export function createTabBarOptions(accentColor: string): BottomTabNavigationOptions {
  return {
    headerShown: false,
    tabBarActiveTintColor: accentColor,
    tabBarInactiveTintColor: '#94A3B8',
    tabBarHideOnKeyboard: true,
    tabBarStyle: {
      height: 68,
      paddingTop: 5,
      paddingBottom: 7,
      backgroundColor: '#FFFFFF',
      borderTopColor: '#E7EDF3',
      borderTopWidth: 1,
      elevation: 10,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: '700',
    },
  };
}
