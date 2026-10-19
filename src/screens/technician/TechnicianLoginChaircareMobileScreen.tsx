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
import { StatusBadge } from '../../components/common/StatusBadge';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';

export const TechnicianLoginChaircareMobileScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { login, setRole, currentUser, logout } = useAuth();
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    const cleanIdentity = identity.trim();
    const cleanPassword = password.trim();

    if (!cleanIdentity) {
      Alert.alert('Required', 'Please enter your partner phone number or email.');
      return;
    }
    if (!cleanPassword) {
      Alert.alert('Required', 'Please enter your partner password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(cleanIdentity, cleanPassword, 'technician');
      setLoading(false);
      if (!res.success) {
        Alert.alert('Authentication Failed', res.error || 'Invalid technician credentials.');
      }
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Unable to authenticate.');
    }
  };

  return (
    <ScreenContainer hasPadding={false}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back to Customer Marketplace */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setRole('customer')}
        >
          <Text style={styles.backBtnText}>← Customer Marketplace</Text>
        </TouchableOpacity>

        {currentUser && currentUser.role !== 'technician' && (
          <View style={styles.sessionNoticeCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <AppIcon name="ShieldAlert" size={18} color="#D97706" />
              <Text style={styles.sessionNoticeTitle}>Technician Authorization Required</Text>
            </View>
            <Text style={styles.sessionNoticeBody}>
              Signed in as <Text style={{ fontWeight: '700' }}>{currentUser.name}</Text> ({currentUser.role}). Partner technician credentials are required to access this portal.
            </Text>
            <TouchableOpacity onPress={logout} style={{ marginTop: 8 }}>
              <Text style={{ ...Typography.labelSm, color: Colors.secondaryCobalt, fontWeight: '700' }}>
                Sign Out of Current Account →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Brand & Partner Emblem Header */}
        <View style={styles.brandHeader}>
          <View style={styles.partnerBadge}>
            <AppIcon name="ShieldCheck" size={16} color={Colors.onSecondaryFixed} />
            <Text style={styles.partnerBadgeText}>
              OFFICIAL SERVICE PARTNER PORTAL
            </Text>
          </View>

          <View style={styles.chairEmblem}>
            <BrandLogo size={56} rounded={true} />
            <View style={styles.calibratedPill} />
          </View>

          <Text style={styles.title}>ChairCare Technician</Text>
          <Text style={styles.subtitle}>
            Field technician portal for real-time dispatch, diagnostics & earnings.
          </Text>

          {/* Quick Demo Credentials Autofill Pills */}
          <View style={{ gap: 8, width: '100%', alignItems: 'center', marginTop: 12 }}>
            <TouchableOpacity
              style={styles.demoFillBtn}
              onPress={() => {
                setIdentity('ramesh.verma@chaircare.in');
                setPassword('Password@123');
              }}
              activeOpacity={0.75}
            >
              <AppIcon name="Zap" size={13} color={Colors.secondaryCobalt} />
              <Text style={styles.demoFillText}>
                Ramesh Verma: <Text style={{ fontWeight: '700' }}>ramesh.verma@chaircare.in</Text> (Tap to fill)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoFillBtn}
              onPress={() => {
                setIdentity('technician@chaircare.com');
                setPassword('Password@123');
              }}
              activeOpacity={0.75}
            >
              <AppIcon name="Zap" size={13} color={Colors.secondaryCobalt} />
              <Text style={styles.demoFillText}>
                Rajesh Kumar: <Text style={{ fontWeight: '700' }}>technician@chaircare.com</Text> (Tap to fill)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Credentials Card */}
        <PrecisionCard style={styles.loginCard}>
          {/* Telemetry Top Ribbon */}
          <View style={styles.telemetryRibbon}>
            <View style={styles.fleetTerminalRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.terminalText}>FLEET TERMINAL #08</Text>
            </View>
            <Text style={styles.sslText}>SSL ACTIVE</Text>
          </View>

          {/* Input 1: Phone / Email */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Phone Number / Email</Text>
              <Text style={styles.inputRequired}>REQUIRED</Text>
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefixIcon}>🪪</Text>
              <TextInput
                style={styles.textInput}
                placeholder="+91 98112 04921 or tech@chaircare.com"
                placeholderTextColor={Colors.outline}
                value={identity}
                onChangeText={setIdentity}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Input 2: Password */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Password</Text>
              <Text style={styles.inputRequired}>ENCRYPTED</Text>
            </View>
            <View style={styles.inputWrapper}>
              <AppIcon name="Lock" size={18} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••••••"
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

          {/* Remember & Forgot Password */}
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setRememberDevice(!rememberDevice)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, rememberDevice && styles.checkboxActive]}>
                {rememberDevice && <AppIcon name="Check" size={18} />}
              </View>
              <Text style={styles.checkboxLabel}>Remember device</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In CTA */}
          <PrecisionButton
            title={loading ? 'Authenticating...' : 'Sign In →'}
            size="lg"
            variant="primary"
            onPress={handleSignIn}
            disabled={loading}
            style={styles.signInBtn}
          />

          {/* Fast OTP Alternative */}
          <View style={styles.orDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <PrecisionButton
            title="Login with Mobile OTP"
            variant="outline"
            onPress={handleSignIn}
          />
        </PrecisionCard>

        {/* Verification & Onboarding Link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('TechnicianOnboarding')}
          activeOpacity={0.8}
        >
          <PrecisionCard style={styles.complianceCard}>
            <View style={styles.complianceRow}>
              <AppIcon name="ShieldCheck" size={18} />
              <View style={styles.complianceDetails}>
                <Text style={styles.complianceTitle}>Certified Technicians • Setup Profile</Text>
                <Text style={styles.complianceText}>
                  All partner technicians are background-verified. Tap here to complete onboarding.
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: Colors.secondaryCobalt, fontWeight: '700' }}>→</Text>
            </View>
          </PrecisionCard>
        </TouchableOpacity>
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
  sessionNoticeCard: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    borderRadius: BorderRadius.lg,
    padding: 12,
  },
  sessionNoticeTitle: {
    ...Typography.labelMd,
    color: '#D97706',
    fontWeight: '700',
  },
  sessionNoticeBody: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  brandHeader: {
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
    marginTop: 8,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  shieldIcon: {
    fontSize: 12,
  },
  partnerBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSecondaryFixed,
    fontWeight: '700',
  },
  chairEmblem: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 6,
  },
  emblemIcon: {
    fontSize: 32,
  },
  calibratedPill: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.tertiaryEmerald,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  demoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginTop: 4,
  },
  demoFillText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.secondaryCobalt,
  },
  title: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loginCard: {
    padding: 16,
    gap: 14,
  },
  telemetryRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  fleetTerminalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  terminalText: {
    ...Typography.labelMono,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  sslText: {
    ...Typography.labelMono,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
    fontSize: 10,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
  inputRequired: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.outline,
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
  inputPrefixIcon: {
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
  signInBtn: {
    marginTop: 4,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.outlineHairline,
  },
  orText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  complianceCard: {
    backgroundColor: Colors.surfaceContainerLow,
    padding: 14,
  },
  complianceRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  complianceIcon: {
    fontSize: 20,
  },
  complianceDetails: {
    flex: 1,
    gap: 2,
  },
  complianceTitle: {
    ...Typography.titleLg,
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  complianceText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
});
