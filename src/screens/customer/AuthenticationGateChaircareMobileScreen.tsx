import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { getApiBaseUrl, setApiBaseUrl, sanitizeUserErrorMessage } from '../../services/api/apiClient';

/**
 * Screen ID: C03
 * Title: Authentication Gate (Sign In / Sign Up Modal)
 * Reference: design-reference/customer/authentication_gate_chaircare_mobile
 */
export const AuthenticationGateChaircareMobileScreen: React.FC<{
  navigation: any;
  route?: any;
}> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { login, pendingReturnRoute, setPendingReturnRoute } = useAuth();
  const { draft } = useBooking();

  // Mode: 'overview' | 'signin'
  const [authMode, setAuthMode] = useState<'overview' | 'signin'>('overview');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const serviceTitle = draft?.serviceTitle || 'Office Chair Repair';
  const servicePrice = draft?.estimatedTotal ? `From ₹${draft.estimatedTotal}` : 'From ₹599';

  const isSignInValid = emailOrPhone.trim().length > 0 && password.trim().length > 0;

  const handleSignInSubmit = async () => {
    setErrorMessage(null);

    if (!isSignInValid) {
      setErrorMessage('Please enter both your phone/email and password.');
      return;
    }

    if (!emailOrPhone.trim()) {
      setErrorMessage('Please enter your registered email or phone number.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsAuthenticating(true);

    try {
      const result = await login(emailOrPhone, password);
      setIsAuthenticating(false);

      if (result.success) {
        if (result.user?.role === 'technician' || result.user?.role === 'admin') {
          // AuthContext automatically sets role to technician/admin, causing RootNavigator to mount their respective dashboard
          return;
        }
        const targetRoute = route?.params?.returnTo || pendingReturnRoute || 'BookingStep1';
        setPendingReturnRoute(null);
        if (
          targetRoute === 'CustomerProfileTab' ||
          targetRoute === 'ServicesAvailableTab' ||
          targetRoute === 'MyRequestsTab' ||
          targetRoute === 'NotificationsTab'
        ) {
          navigation.replace('CustomerMain', { screen: targetRoute });
        } else {
          navigation.replace(targetRoute);
        }
      } else {
        setErrorMessage(sanitizeUserErrorMessage(result.error) || 'Invalid credentials. Please check and try again.');
      }
    } catch (err: any) {
      setIsAuthenticating(false);
      setErrorMessage(sanitizeUserErrorMessage(err) || 'Login failed. Please check your credentials and try again.');
    }
  };

  const handleCreateCustomerAccount = () => {
    navigation.navigate('CustomerRegistration', {
      returnTo: route?.params?.returnTo || pendingReturnRoute,
    });
  };

  const handleJoinAsTechnician = () => {
    navigation.navigate('TechnicianOnboarding');
  };

  const handleCreateAccount = () => {
    handleCreateCustomerAccount();
  };

  const handleDismiss = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Dimmed Scrim */}
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.backdropScrim} />
      </TouchableWithoutFeedback>

      {/* Interactive Bottom Sheet Modal */}
      <View
        style={[
          styles.sheetContainer,
          { paddingBottom: Math.max(insets.bottom, 16) + 12 },
        ]}
      >
        {/* Tactile Grab Handle */}
        <View style={styles.grabHandleContainer}>
          <View style={styles.grabHandle} />
        </View>

        {/* Sheet Header Toolbar */}
        <View style={styles.sheetHeader}>
          <View style={styles.headerBadgeGroup}>
            <Text style={styles.headerBadgeText}>CHAIRCARE AUTH</Text>
            <View style={styles.headerDot} />
            <Text style={styles.headerStepText}>
              {authMode === 'signin' ? 'SIGN IN' : 'VERIFIED ACCESS'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleDismiss}
            activeOpacity={0.7}
            accessibilityLabel="Close auth sheet"
          >
            <AppIcon name="X" size={18} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.sheetContent}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Contextual Selected Service Pill Card */}
          <View style={styles.selectedServiceCard}>
            <View style={styles.serviceLeft}>
              <View style={styles.chairIconBox}>
                <BrandLogo size={24} />
              </View>
              <View style={styles.serviceInfo}>
                <View style={styles.selectedBadgeRow}>
                  <View style={styles.selectedPill}>
                    <Text style={styles.selectedPillText}>SELECTED</Text>
                  </View>
                  <Text style={styles.selectedServiceName} numberOfLines={1}>
                    {serviceTitle}
                  </Text>
                </View>
                <Text style={styles.selectedServiceSub} numberOfLines={1}>
                  Standard Re-tensioning • {servicePrice}
                </Text>
              </View>
            </View>
            <View style={styles.checkCircle}>
              <AppIcon name="Check" size={18} color="#059669" />
            </View>
          </View>

          {/* Headline & Value Pitch */}
          <View style={styles.headlineSection}>
            <View style={styles.titleRow}>
              <Text style={styles.headlineText}>
                {authMode === 'signin' ? 'Welcome Back!' : 'Almost there!'}
              </Text>
              <View style={styles.verifiedGateBadge}>
                <Text style={styles.verifiedGateText}>VERIFIED GATE</Text>
              </View>
            </View>
            <Text style={styles.pitchText}>
              {authMode === 'signin'
                ? 'Sign in to access your booked services, diagnostic history, and live tracking.'
                : 'Sign in or create an account to request certified technicians, monitor real-time arrival telemetry, and store warranty records.'}
            </Text>
          </View>

          {/* Dynamic Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <AppIcon name="AlertTriangle" size={16} color="#DC2626" />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {authMode === 'signin' ? (
            /* Sign In Input Mode */
            <View style={styles.signInForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL OR PHONE NUMBER</Text>
                <View style={styles.inputWrapper}>
                  <AppIcon name="User" size={18} color={Colors.outline} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="customer@chaircare.com or +91..."
                    placeholderTextColor={Colors.outline}
                    value={emailOrPhone}
                    onChangeText={(val) => {
                      setEmailOrPhone(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <AppIcon name="Lock" size={18} color={Colors.outline} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••••••"
                    placeholderTextColor={Colors.outline}
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                  >
                    <AppIcon
                      name={showPassword ? 'Eye' : 'EyeOff'}
                      size={18}
                      color={Colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.signInBtn, (!isSignInValid || isAuthenticating) && { opacity: 0.5 }]}
                onPress={handleSignInSubmit}
                disabled={isAuthenticating || !isSignInValid}
                activeOpacity={0.88}
              >
                {isAuthenticating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.signInBtnText}>
                      {!isSignInValid ? 'Fill Phone & Password *' : 'Sign In'}
                    </Text>
                    <AppIcon name="ArrowRight" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              {/* Account Creation Options in Sign In Mode */}
              <View style={styles.createAccountSection}>
                <Text style={styles.createAccountHeading}>NEW TO CHAIRCARE?</Text>
                <View style={styles.createAccountRow}>
                  <TouchableOpacity
                    style={styles.createCustomerSubBtn}
                    onPress={handleCreateCustomerAccount}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="User" size={14} color={Colors.primary} />
                    <Text style={styles.createCustomerSubText}>Customer Account</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.createTechSubBtn}
                    onPress={handleJoinAsTechnician}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="Wrench" size={14} color="#005236" />
                    <Text style={styles.createTechSubText}>Technician Partner (KYC)</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.switchModeBtn}
                onPress={() => {
                  setAuthMode('overview');
                  setErrorMessage(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.switchModeText}>← Back to Options</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Overview Action Group */
            <View style={styles.actionGroup}>
              {/* Action 1: Sign In */}
              <TouchableOpacity
                style={styles.signInBtn}
                onPress={() => {
                  setAuthMode('signin');
                  setErrorMessage(null);
                }}
                activeOpacity={0.85}
              >
                <AppIcon name="ArrowRight" size={16} color="#FFFFFF" />
                <Text style={styles.signInBtnText}>Sign In with Phone or Email</Text>
              </TouchableOpacity>

              {/* Action 2: Create Customer Account */}
              <TouchableOpacity
                style={styles.signUpBtn}
                onPress={handleCreateCustomerAccount}
                activeOpacity={0.85}
              >
                <AppIcon name="User" size={18} color={Colors.onSurface} />
                <Text style={styles.signUpBtnText}>Create Customer Account</Text>
              </TouchableOpacity>

              {/* Action 3: Join as Technician Partner */}
              <TouchableOpacity
                style={styles.techPartnerBtn}
                onPress={handleJoinAsTechnician}
                activeOpacity={0.85}
              >
                <AppIcon name="Wrench" size={16} color="#005236" />
                <Text style={styles.techPartnerBtnText}>Join as Technician Partner (Submit KYC)</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Security & Trust Micro-copy */}
          <View style={styles.trustSection}>
            <View style={styles.trustRow}>
              <AppIcon name="Lock" size={14} color={Colors.onSurfaceVariant} />
              <Text style={styles.trustText}>
                Secure 256-bit encryption • Encrypted data protection
              </Text>
            </View>
            <Text style={styles.trustSubtext}>
              No credit card needed • Free estimate on desk assessments
            </Text>
          </View>

          {/* Dismissal Link Action */}
          <View style={styles.dismissContainer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>← Continue Browsing Services</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdropScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.scrim,
  },
  sheetContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    ...Shadows.level3,
  },
  grabHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  grabHandle: {
    width: 44,
    height: 4.5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceVariant,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBadgeText: {
    ...Typography.labelMono,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  headerDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
  },
  headerStepText: {
    ...Typography.labelMono,
    color: Colors.outline,
    letterSpacing: 0.6,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContent: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 14,
  },
  selectedServiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 12,
    ...Shadows.level1,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  chairIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  serviceInfo: {
    flex: 1,
    gap: 3,
  },
  selectedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedPill: {
    backgroundColor: Colors.tertiaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  selectedPillText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.tertiaryContainer,
    letterSpacing: 0.5,
  },
  selectedServiceName: {
    ...Typography.labelMd,
    color: Colors.onSurface,
    fontWeight: '700',
    flex: 1,
  },
  selectedServiceSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  headlineSection: {
    gap: 6,
    paddingTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headlineText: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  verifiedGateBadge: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  verifiedGateText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
    letterSpacing: 0.5,
  },
  pitchText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: BorderRadius.md,
    padding: 10,
    gap: 8,
  },
  errorBannerText: {
    ...Typography.bodySm,
    color: '#991B1B',
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  signInForm: {
    gap: 12,
    paddingTop: 4,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    gap: 10,
  },
  textInput: {
    flex: 1,
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurface,
  },
  eyeBtn: {
    padding: 6,
  },
  switchModeBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchModeText: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.secondaryCobalt,
    fontWeight: '600',
  },
  actionGroup: {
    gap: 10,
    paddingTop: 2,
  },
  signInBtn: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Shadows.level2,
  },
  signInBtnText: {
    ...Typography.labelMd,
    fontSize: 13,
    color: Colors.onPrimary,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  signUpBtn: {
    height: 48,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Shadows.level1,
  },
  signUpBtnText: {
    ...Typography.labelMd,
    fontSize: 13,
    color: Colors.onSurface,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  techPartnerBtn: {
    height: 48,
    backgroundColor: 'rgba(0, 82, 54, 0.08)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 82, 54, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Shadows.level1,
  },
  techPartnerBtnText: {
    ...Typography.labelMd,
    fontSize: 13,
    color: '#005236',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  createAccountSection: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    marginTop: 4,
  },
  createAccountHeading: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
    letterSpacing: 0.8,
  },
  createAccountRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  createCustomerSubBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  createCustomerSubText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  createTechSubBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 82, 54, 0.06)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 82, 54, 0.2)',
  },
  createTechSubText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#005236',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 10,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.outlineHairline,
  },
  separatorText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
    letterSpacing: 0.8,
  },
  demoLoginBtn: {
    height: 46,
    backgroundColor: Colors.secondaryFixed,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  demoLoginText: {
    ...Typography.labelMd,
    fontSize: 13,
    color: Colors.onSecondaryFixed,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  trustSection: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  trustSubtext: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.outline,
    textAlign: 'center',
  },
  dismissContainer: {
    alignItems: 'center',
    paddingTop: 2,
    paddingBottom: 4,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelText: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
});
