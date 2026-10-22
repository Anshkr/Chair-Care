import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { AppIcon } from './AppIcon';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { authApi } from '../../services/api/authApi';
import { sanitizeUserErrorMessage } from '../../services/api/apiClient';

export interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  userRoleLabel?: string;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
  userRoleLabel = 'Account Security',
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const curr = currentPassword.trim();
    const next = newPassword.trim();
    const conf = confirmPassword.trim();

    if (!curr) {
      setErrorMessage('Please enter your current password.');
      return;
    }
    if (!next) {
      setErrorMessage('Please enter a new password.');
      return;
    }
    if (next.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (curr === next) {
      setErrorMessage('New password cannot be the same as your current password.');
      return;
    }
    if (next !== conf) {
      setErrorMessage('New passwords do not match. Please verify both fields.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authApi.changePassword(curr, next);

      if (res.success) {
        setSuccessMessage('Your password has been changed successfully!');
        setTimeout(() => {
          handleClose();
          if (onSuccess) onSuccess();
          Alert.alert('Password Updated', 'Your account password has been updated securely.');
        }, 1200);
      } else {
        setErrorMessage(sanitizeUserErrorMessage(res.error) || 'Failed to update password. Please check your current password.');
      }
    } catch (err: any) {
      setErrorMessage(sanitizeUserErrorMessage(err) || 'Unable to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity
          style={styles.dismissOverlay}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.sheetCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerIconCircle}>
              <AppIcon name="Lock" size={20} color={Colors.primary} />
            </View>
            <View style={styles.headerTitleCol}>
              <Text style={styles.headerTag}>{userRoleLabel.toUpperCase()}</Text>
              <Text style={styles.headerTitle}>Change Password</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <AppIcon name="X" size={18} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollBody}
          >
            {/* Status alerts */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <AppIcon name="AlertTriangle" size={16} color="#ba1a1a" />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.successBanner}>
                <AppIcon name="CheckCircle" size={16} color="#005236" />
                <Text style={styles.successBannerText}>{successMessage}</Text>
              </View>
            ) : null}

            {/* Field 1: Current Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.inputFieldWrap}>
                <TextInput
                  style={styles.textInput}
                  secureTextEntry={!showCurrent}
                  placeholder="Enter your current password"
                  placeholderTextColor={Colors.outline}
                  value={currentPassword}
                  onChangeText={(val) => {
                    setCurrentPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowCurrent(!showCurrent)}
                  activeOpacity={0.7}
                >
                  <AppIcon
                    name={showCurrent ? 'EyeOff' : 'Eye'}
                    size={18}
                    color={Colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Field 2: New Password */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>New Password</Text>
                <Text style={styles.labelHint}>Min. 6 chars</Text>
              </View>
              <View style={styles.inputFieldWrap}>
                <TextInput
                  style={styles.textInput}
                  secureTextEntry={!showNew}
                  placeholder="Create a strong new password"
                  placeholderTextColor={Colors.outline}
                  value={newPassword}
                  onChangeText={(val) => {
                    setNewPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowNew(!showNew)}
                  activeOpacity={0.7}
                >
                  <AppIcon
                    name={showNew ? 'EyeOff' : 'Eye'}
                    size={18}
                    color={Colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Field 3: Confirm New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.inputFieldWrap}>
                <TextInput
                  style={styles.textInput}
                  secureTextEntry={!showConfirm}
                  placeholder="Re-enter your new password"
                  placeholderTextColor={Colors.outline}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirm(!showConfirm)}
                  activeOpacity={0.7}
                >
                  <AppIcon
                    name={showConfirm ? 'EyeOff' : 'Eye'}
                    size={18}
                    color={Colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleClose}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  (!currentPassword || !newPassword || !confirmPassword || isLoading) &&
                    styles.saveBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!currentPassword || !newPassword || !confirmPassword || isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <AppIcon name="Key" size={16} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>Update Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.large,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 82, 54, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTag: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...Typography.titleMedium,
    fontWeight: '700',
    color: Colors.onSurface,
    fontSize: 18,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    paddingVertical: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.25)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    gap: 8,
  },
  errorBannerText: {
    ...Typography.bodySmall,
    color: '#ba1a1a',
    flex: 1,
    fontWeight: '500',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 82, 54, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 82, 54, 0.25)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    gap: 8,
  },
  successBannerText: {
    ...Typography.bodySmall,
    color: '#005236',
    flex: 1,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    ...Typography.labelSmall,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: 6,
  },
  labelHint: {
    ...Typography.labelSmall,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  inputFieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant || '#E2E8F0',
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceVariant ? `${Colors.surfaceVariant}30` : '#F8FAFC',
    paddingHorizontal: Spacing.sm,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: Colors.onSurface,
    paddingHorizontal: Spacing.xs,
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant || '#E2E8F0',
    backgroundColor: Colors.surface,
  },
  cancelBtnText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  saveBtn: {
    flex: 1.6,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Shadows.small,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
