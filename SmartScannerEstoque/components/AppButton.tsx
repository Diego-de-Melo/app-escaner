import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;

  const buttonStyles = [
    styles.base,
    isSmallScreen && styles.baseSmall,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'danger' && styles.danger,
    variant === 'ghost' && styles.ghost,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    isSmallScreen && styles.textSmall,
    variant === 'ghost' && styles.ghostText,
    variant === 'danger' && styles.dangerText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={Colors.white} size="small" />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  baseSmall: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 44,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  danger: {
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: 'rgba(255,60,60,0.2)',
  },
  ghost: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: Colors.white,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  textSmall: {
    fontSize: Typography.sizes.md,
  },
  ghostText: {
    color: Colors.text,
  },
  dangerText: {
    color: Colors.danger,
  },
});
