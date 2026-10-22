import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { PrecisionCard } from '../../components/common/PrecisionCard';
import { PrecisionButton } from '../../components/common/PrecisionButton';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { sanitizeUserErrorMessage } from '../../services/api/apiClient';

export const SuperAdminLoginChaircareMobileScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { login, setRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAdminSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your corporate email identifier.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Required', 'Please enter your operator access key (password).');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password, 'admin');
      setLoading(false);
      if (!res.success) {
        Alert.alert('Authentication Failed', sanitizeUserErrorMessage(res.error) || 'Invalid administrator credentials. Please check your email and password.');
      }
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Authentication Failed', sanitizeUserErrorMessage(err) || 'Unable to authenticate. Please check your credentials and try again.');
    }
  };

  return (
    <ScreenContainer hasPadding={false}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Return to Customer App */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setRole('customer')}
        >
          <Text style={styles.backBtnText}>← Customer Marketplace</Text>
        </TouchableOpacity>

        {/* Top Protocol Badge */}
        <View style={styles.protocolBadgeContainer}>
          <View style={styles.protocolBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.protocolText}>
              ENTERPRISE PROTOCOL • RESTRICTED ACCESS
            </Text>
          </View>
        </View>

        {/* Branding & Shield Emblem */}
        <View style={styles.brandHeader}>
          <View style={styles.shieldEmblem}>
            <BrandLogo size={52} />
          </View>
          <Text style={styles.title}>ChairCare Admin</Text>
          <Text style={styles.subtitle}>Platform Management & Operations</Text>
        </View>

        {/* High-Precision Form Card */}
        <PrecisionCard style={styles.formCard}>
          {/* Corporate Identifier Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CORPORATE IDENTIFIER</Text>
            <View style={styles.inputWrapper}>
              <AppIcon name="Mail" size={18} />
              <TextInput
                style={styles.textInput}
                placeholder="admin@chaircare.pro"
                placeholderTextColor={Colors.outline}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Operator Access Key Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>OPERATOR ACCESS KEY</Text>
            <View style={styles.inputWrapper}>
              <AppIcon name="Key" size={18} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter cryptographic key"
                placeholderTextColor={Colors.outline}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <AppIcon name={showPassword ? 'Eye' : 'EyeOff'} size={20} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Session & Recovery Controls */}
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setRememberSession(!rememberSession)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, rememberSession && styles.checkboxActive]}>
                {rememberSession && <AppIcon name="Check" size={18} />}
              </View>
              <Text style={styles.checkboxLabel}>Remember session</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Audited Security Notice Callout */}
          <View style={styles.securityNotice}>
            <View style={styles.noticeHeader}>
              <AppIcon name="Lock" size={18} />
              <Text style={styles.noticeTitle}>Secure Admin Access</Text>
            </View>
            <Text style={styles.noticeText}>
              This area is restricted to authorized ChairCare platform administrators. All activity is logged and cryptographically audited.
            </Text>
          </View>

          {/* Primary Action Button */}
          <PrecisionButton
            title={loading ? 'Authenticating...' : 'Sign In →'}
            size="lg"
            variant="primary"
            onPress={handleAdminSignIn}
            disabled={loading}
            style={styles.signInBtn}
          />
        </PrecisionCard>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    gap: 16,
  },
  backBtn: {
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    ...Typography.labelMd,
    color: Colors.secondaryCobalt,
  },
  protocolBadgeContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  protocolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiaryEmerald,
  },
  protocolText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  brandHeader: {
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  shieldEmblem: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  shieldIcon: {
    fontSize: 28,
  },
  title: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  formCard: {
    padding: 16,
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurface,
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    gap: 8,
  },
  inputIcon: {
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  eyeBtn: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 16,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: BorderRadius.xs,
    borderWidth: 1.5,
    borderColor: Colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.secondaryCobalt,
    borderColor: Colors.secondaryCobalt,
  },
  checkmark: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  checkboxLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  forgotText: {
    ...Typography.labelMd,
    color: Colors.secondaryCobalt,
  },
  securityNotice: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: 12,
    gap: 4,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noticeIcon: {
    fontSize: 14,
  },
  noticeTitle: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  noticeText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  signInBtn: {
    marginTop: 4,
  },
});
