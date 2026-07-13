import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../theme';
import { ScanSessionProvider } from '../src/context/ScanSession';

export default function RootLayout() {
  return (
    <ScanSessionProvider>
      <StatusBar style="light" />
      <View style={styles.root}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
            headerTitleStyle: { fontWeight: '600' },
            contentStyle: { backgroundColor: Colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="list/[id]"
            options={{
              title: 'Editar Lista',
              presentation: 'card',
              headerStyle: { backgroundColor: Colors.surface },
              headerTintColor: Colors.primary,
            }}
          />
        </Stack>
      </View>
    </ScanSessionProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
