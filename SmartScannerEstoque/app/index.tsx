import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../theme';

export default function Index() {
  return <Redirect href="/scanner" />;
}
