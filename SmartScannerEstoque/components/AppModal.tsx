import React from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';

interface AppModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  style?: ViewStyle;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  title,
  subtitle,
  onClose,
  children,
  footer,
  style,
}) => {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const maxHeight = height * 0.8;

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.content,
            isSmallScreen && styles.contentSmall,
            { maxHeight },
            style,
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={[styles.title, isSmallScreen && styles.titleSmall]}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle}>{subtitle}</Text>
            ) : null}
            {children}
          </ScrollView>
          {footer ? (
            <View style={styles.footer}>{footer}</View>
          ) : null}
        </View>
      </View>
    </RNModal>
  );
};

interface ModalActionProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
}

export const ModalAction: React.FC<ModalActionProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.action, variant === 'ghost' && styles.actionGhost]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.actionText, variant === 'ghost' && styles.actionGhostText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.overlay,
  },
  content: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    width: '90%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contentSmall: {
    padding: Spacing.lg,
    width: '95%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  titleSmall: {
    fontSize: Typography.sizes.lg,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  action: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  actionGhost: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: {
    color: Colors.white,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  actionGhostText: {
    color: Colors.text,
  },
});
