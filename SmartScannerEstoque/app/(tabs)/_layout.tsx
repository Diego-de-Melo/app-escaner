import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScanLine, List, Settings } from 'lucide-react-native';
import { Colors, Typography, Radius, Spacing } from '../../theme';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const size = 22;
  const color = focused ? Colors.primary : Colors.textMuted;

  const iconMap: Record<string, React.ReactNode> = {
    scanner: <ScanLine size={size} color={color} strokeWidth={focused ? 2.2 : 1.8} />,
    lists: <List size={size} color={color} strokeWidth={focused ? 2.2 : 1.8} />,
    settings: <Settings size={size} color={color} strokeWidth={focused ? 2.2 : 1.8} />,
  };

  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      {iconMap[name] || null}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom + 12 : 24;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 70 + (insets.bottom > 0 ? insets.bottom : 0),
          paddingTop: Spacing.sm,
          paddingBottom: bottomPadding,
          elevation: 0,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: Typography.sizes.xs,
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginTop: 2,
        },
        tabBarItemStyle: {
          gap: 2,
        },
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
});
