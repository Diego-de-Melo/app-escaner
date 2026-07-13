import React from 'react';
import {
  TextInput,
  Text,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          isSmallScreen && styles.inputSmall,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={Colors.textDisabled}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.xs,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    color: Colors.text,
    fontSize: Typography.sizes.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputSmall: {
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  error: {
    color: Colors.danger,
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
});
