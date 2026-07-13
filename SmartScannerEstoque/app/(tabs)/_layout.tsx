import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors, Typography, Radius, Spacing } from '../../theme';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    scanner: '📷',
    lists: '📋',
    settings: '⚙️',
  };

  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={[styles.icon, focused && styles.iconActive]}>{icons[name] || '•'}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ focused }) => <TabIcon name="scanner" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: 'Listas',
          tabBarIcon: ({ focused }) => <TabIcon name="lists" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Config',
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 70,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    elevation: 0,
  },
  tabLabel: {
    fontSize: Typography.sizes.xs,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  tabItem: {
    gap: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.cyan10,
    borderWidth: 1,
    borderColor: Colors.borderActive,
  },
  icon: {
    fontSize: 18,
  },
  iconActive: {
    fontSize: 18,
  },
});
