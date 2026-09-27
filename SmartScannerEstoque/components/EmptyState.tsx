import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Package } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '../theme';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle }) => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Package size={28} color={Colors.primary} strokeWidth={1.5} />
      </View>
      <Text style={[styles.title, isSmallScreen && styles.titleSmall]}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxxl },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.cyan10,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm, textAlign: 'center' },
  titleSmall: { fontSize: Typography.sizes.base },
  subtitle: { fontSize: Typography.sizes.md, color: Colors.textMuted, textAlign: 'center' },
});
