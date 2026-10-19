import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { AppIcon } from '../../components/common/AppIcon';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';

/**
 * Screen: Customer Registration / Sign Up
 * Route: CustomerRegistration
 * Responsive on Mobile, Tablet, and Web Desktop
 */
export const CustomerRegistrationChaircareMobileScreen: React.FC<{
  navigation: any;
  route?: any;
}> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { register, pendingReturnRoute, setPendingReturnRoute } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    setErrorMessage(null);

    // Validation
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMessage('Please enter a valid mobile phone number.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        name: fullName,
        email: email,
        phone: phone,
        password: password,
        defaultAddress: address,
      });

      setIsLoading(false);

      if (result.success) {
        const target = route?.params?.returnTo || pendingReturnRoute || 'CustomerMain';
        setPendingReturnRoute(null);
        if (
          target === 'CustomerProfileTab' ||
          target === 'ServicesAvailableTab' ||
          target === 'MyRequestsTab' ||
          target === 'NotificationsTab'
        ) {
          navigation.replace('CustomerMain', { screen: target });
        } else {
          navigation.replace(target);
        }
      } else {
        setErrorMessage(result.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  const handleNavigateToLogin = () => {
    navigation.replace('AuthenticationGate', {
      returnTo: route?.params?.returnTo || pendingReturnRoute,
    });
  };

  return (
    <ScreenContainer hasPadding={false}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerInnerContainer}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('CustomerMain'))}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <AppIcon name="ArrowLeft" size={20} color={Colors.onSurface} />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <BrandLogo size={22} containerStyle={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>Create Account</Text>
            </View>

            <View style={styles.headerRightPlaceholder} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollWrapper}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Responsive Centered Form Container */}
          <View style={styles.formContainer}>
            {/* Welcome Badge & Headline */}
            <View style={styles.heroSection}>
              <View style={styles.badgeRow}>
                <View style={styles.pillBadge}>
                  <AppIcon name="ShieldCheck" size={14} color={Colors.secondaryCobalt} />
                  <Text style={styles.pillBadgeText}>CHAIRCARE CUSTOMER</Text>
                </View>
              </View>
              <Text style={styles.heroHeadline}>Join ChairCare</Text>
              <Text style={styles.heroSubtext}>
                Book certified ergonomic chair repairs, monitor technician arrival telemetry, and store 90-day service warranty records.
              </Text>
            </View>

            {/* Dynamic Error Banner */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <AppIcon name="AlertTriangle" size={18} color="#DC2626" />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            )}

            {/* Registration Form Card */}
            <View style={styles.formCard}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel} numberOfLines={1}>
                  FULL NAME *
                </Text>
                <View style={styles.inputWrapper}>
                  <AppIcon name="User" size={18} color={Colors.outline} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Rahul Verma"
                    placeholderTextColor={Colors.outline}
                    value={fullName}
                    onChangeText={(val) => {
                      setFullName(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel} numberOfLines={1}>
                  EMAIL ADDRESS *
                </Text>
                <View style={styles.inputWrapper}>
                  <AppIcon name="Mail" size={18} color={Colors.outline} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="rahul.verma@example.com"
                    placeholderTextColor={Colors.outline}
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel} numberOfLines={1}>
                  MOBILE PHONE NUMBER *
                </Text>
                <View style={styles.inputWrapper}>
                  <AppIcon name="Phone" size={18} color={Colors.outline} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="+91 98765 43210"
                    placeholderTextColor={Colors.outline}
                    value={phone}
                    onChangeText={(val) => {
                      setPhone(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel} numberOfLines={1}>
                  PASSWORD (MIN 6 CHARACTERS) *
                </Text>
                <View style={styles.inputWrapper}>
                  <AppIcon name="Lock" size={18} color={Colors.outline} />
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    placeholder="Create a strong password"
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
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <AppIcon
                      name={showPassword ? 'Eye' : 'EyeOff'}
                      size={18}
                      color={Colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel} numberOfLines={1}>
                  CONFIRM PASSWORD *
                </Text>
                <View style={styles.inputWrapper}>
                  <AppIcon name="Lock" size={18} color={Colors.outline} />
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    placeholder="Re-enter your password"
                    placeholderTextColor={Colors.outline}
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                    accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    <AppIcon
                      name={showConfirmPassword ? 'Eye' : 'EyeOff'}
                      size={18}
                      color={Colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Primary Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel} numberOfLines={1}>
                  PRIMARY SERVICE ADDRESS (OPTIONAL)
                </Text>
                <View style={styles.inputWrapper}>
                  <AppIcon name="MapPin" size={18} color={Colors.outline} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Tower 3, Flat 502, Sector 62, Gurgaon"
                    placeholderTextColor={Colors.outline}
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>
              </View>

              {/* Submit CTA Button */}
              <TouchableOpacity
                style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.88}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Create My Account</Text>
                    <AppIcon name="ArrowRight" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Already have an account footer */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have a ChairCare account?</Text>
              <TouchableOpacity onPress={handleNavigateToLogin} activeOpacity={0.7}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  headerBar: {
    height: 56,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  headerInnerContainer: {
    width: '100%',
    maxWidth: 540,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  headerRightPlaceholder: {
    width: 36,
  },
  scrollWrapper: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 520,
    gap: 16,
  },
  heroSection: {
    gap: 6,
    width: '100%',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  pillBadgeText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
    letterSpacing: 0.6,
  },
  heroHeadline: {
    ...Typography.headlineLg,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  heroSubtext: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 19,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: BorderRadius.md,
    padding: 12,
    gap: 10,
    width: '100%',
  },
  errorBannerText: {
    ...Typography.bodySm,
    color: '#991B1B',
    flex: 1,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  formCard: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  inputGroup: {
    width: '100%',
    gap: 6,
  },
  inputLabel: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  inputWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    gap: 10,
    position: 'relative',
  },
  textInput: {
    flex: 1,
    ...Typography.bodyMd,
    fontSize: 13.5,
    color: Colors.onSurface,
    height: '100%',
  },
  passwordInput: {
    paddingRight: 32,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  submitBtn: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
    ...Shadows.level2,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    ...Typography.labelMd,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onPrimary,
    letterSpacing: 0.3,
  },
  footerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  footerText: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  signInLink: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    textDecorationLine: 'underline',
  },
});
