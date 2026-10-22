import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../components/common/AppIcon';
import { Colors, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { adminApi } from '../../services/api/adminApi';
import { sanitizeUserErrorMessage } from '../../services/api/apiClient';

interface AddAdminProps {
  navigation?: any;
}

type RoleType = 'super' | 'ops' | 'support' | 'finance';

interface RoleOption {
  id: RoleType;
  title: string;
  badge: string;
  badgeType: 'super' | 'ops' | 'support' | 'finance';
  icon: string;
  description: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'super',
    title: 'Super Admin',
    badge: 'Highest Privilege',
    badgeType: 'super',
    icon: 'shield_person',
    description:
      'Full platform access across all operations, financial escrow, system configuration, and team management.',
  },
  {
    id: 'ops',
    title: 'Operations Admin',
    badge: 'Recommended for Fleet Ops',
    badgeType: 'ops',
    icon: 'precision_manufacturing',
    description:
      'Full control over service requests, customer bookings, live map tracking, and technician dispatch.',
  },
  {
    id: 'support',
    title: 'Support Admin',
    badge: 'Customer Care',
    badgeType: 'support',
    icon: 'support_agent',
    description:
      'Handle customer inquiries, dispute escalation, ticket resolutions, and service quality feedback.',
  },
  {
    id: 'finance',
    title: 'Finance Admin',
    badge: 'Financial Ops',
    badgeType: 'finance',
    icon: 'payments',
    description:
      'Manage gateway settlements, UPI payouts, refunds, invoice generation, and revenue auditing.',
  },
];

export const AddAdminChaircareMobileScreen: React.FC<AddAdminProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Form State
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<RoleType>('ops');
  const [isInviteEmailActive, setIsInviteEmailActive] = useState<boolean>(true);
  const [is2FAActive, setIs2FAActive] = useState<boolean>(true);

  // Button Loading State
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);
  const [isCreated, setIsCreated] = useState<boolean>(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2200);
  };

  const handleCreateAdmin = async () => {
    if (!fullName.trim() || !email.trim() || !phoneNumber.trim() || !password.trim()) {
      displayToast('Please fill in name, email, phone, and password');
      return;
    }

    if (password.trim().length < 6) {
      displayToast('Password must be at least 6 characters');
      return;
    }

    if (isProvisioning) return;
    setIsProvisioning(true);

    try {
      const res = await adminApi.createAdminUser({
        name: fullName.trim(),
        email: email.trim(),
        phone: phoneNumber.trim(),
        password: password.trim(),
        role: 'admin',
      });

      if (res.error) {
        displayToast(res.error || 'Failed to provision admin account');
        setIsProvisioning(false);
        return;
      }

      const createdUser = res.data?.user || res.data;
      const newAdminPayload = {
        id: createdUser?.id || `ADM-${Date.now().toString().slice(-4)}`,
        name: fullName.trim(),
        email: email.trim(),
        phoneNumber: `+91 ${phoneNumber.trim()}`,
        role:
          selectedRole === 'super'
            ? 'Super Admin'
            : selectedRole === 'ops'
            ? 'Operations Admin'
            : selectedRole === 'support'
            ? 'Support Admin'
            : 'Finance Admin',
        roleType: selectedRole,
        status: 'active',
        statusLabel: isInviteEmailActive ? 'Invited' : 'Active',
        isInviteEmailActive,
        is2FAActive,
        createdAt: new Date().toISOString(),
        secKey: `SEC-KEY: CC-${Math.floor(1000 + Math.random() * 9000)}-${selectedRole.toUpperCase()}`,
      };

      setIsProvisioning(false);
      setIsCreated(true);
      displayToast(`Admin account created for ${fullName}`);

      setTimeout(() => {
        if (navigation) {
          navigation.navigate('AdminCreatedSuccessfully', {
            adminData: newAdminPayload,
          });
        }
      }, 700);
    } catch (err: any) {
      setIsProvisioning(false);
      displayToast(sanitizeUserErrorMessage(err) || 'Unable to create administrator. Please try again.');
    }
  };

  const handleMoreOptions = () => {
    displayToast('Admin provisioning security rules active');
  };

  return (
    <View style={styles.screenContainer}>
      {/* Fixed Top Header */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top, 10) },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation?.canGoBack()) {
                navigation.goBack();
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>

          <Text style={styles.headerTitleText}>Add Admin</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            onPress={handleMoreOptions}
            accessibilityLabel="More options"
          >
            <AppIcon name="more_vert" size={20} />
          </TouchableOpacity>
          <View style={styles.headerAvatar}>
            <AppIcon name="person" size={20} />
          </View>
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Context & Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroContentLeft}>
            <View style={styles.provisioningBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.provisioningBadgeText}>
                ACCESS PROVISIONING
              </Text>
            </View>

            <Text style={styles.heroTitleText}>Create Admin Account</Text>
            <Text style={styles.heroDescText}>
              Give a trusted team member access to ChairCare's management tools and operational dispatch console.
            </Text>
          </View>

          <View style={styles.heroIconBox}>
            <AppIcon name="admin_panel_settings" size={20} />
          </View>
        </View>

        {/* Form Section: Personal Info */}
        <View style={styles.formSection}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              FULL NAME <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <AppIcon name="person" size={20} />
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Siddharth Rao"
                placeholderTextColor="#76777D"
              />
            </View>
          </View>

          {/* Corporate Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              CORPORATE EMAIL <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <AppIcon name="mail" size={20} />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="e.g. siddharth.rao@chaircare.pro"
                placeholderTextColor="#76777D"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Mobile Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              MOBILE PHONE NUMBER <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCodeBadge}>
                <Text style={styles.flagEmoji}>+91</Text>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <View style={styles.phoneInputContainer}>
                <AppIcon name="phone_iphone" size={20} />
                <TextInput
                  style={styles.textInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="98765 43210"
                  placeholderTextColor="#76777D"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Create Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              CREATE PASSWORD <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <AppIcon name="lock" size={20} />
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter login password (min 6 chars)"
                placeholderTextColor="#76777D"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                activeOpacity={0.7}
                style={{ padding: 4 }}
              >
                <AppIcon name={showPassword ? 'EyeOff' : 'Eye'} size={18} color="#76777D" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Role Selection Section */}
        <View style={styles.rolesSection}>
          <View style={styles.rolesSectionHeader}>
            <View>
              <Text style={styles.rolesSectionTitle}>
                Select Role <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <Text style={styles.rolesSectionSubtitle}>
                Choose the administrative authority level
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>LEVEL 02 ACTIVE</Text>
            </View>
          </View>

          {/* Role Cards Group */}
          <View style={styles.rolesList}>
            {ROLES.map((role) => {
              const isSelected = selectedRole === role.id;
              return (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleCard,
                    isSelected && styles.roleCardSelected,
                  ]}
                  onPress={() => setSelectedRole(role.id)}
                  activeOpacity={0.7}
                >
                  {isSelected && <View style={styles.roleCardActiveStripe} />}

                  <View style={styles.roleCardTop}>
                    <View style={styles.roleCardHeaderLeft}>
                      <View
                        style={[
                          styles.roleIconBox,
                          isSelected && styles.roleIconBoxSelected,
                        ]}
                      >
                        <AppIcon
                          name={role.icon}
                          size={20}
                          color={isSelected ? Colors.secondary : Colors.onSurfaceVariant}
                          strokeWidth={1.8}
                        />
                      </View>

                      <View style={styles.roleTitleCol}>
                        <Text style={styles.roleTitleText}>{role.title}</Text>
                        <View
                          style={[
                            styles.rolePill,
                            role.badgeType === 'super' && styles.rolePillSuper,
                            role.badgeType === 'ops' && styles.rolePillOps,
                            role.badgeType === 'support' && styles.rolePillSupport,
                            role.badgeType === 'finance' && styles.rolePillFinance,
                          ]}
                        >
                          <Text
                            style={[
                              styles.rolePillText,
                              role.badgeType === 'super' && styles.rolePillTextSuper,
                              role.badgeType === 'ops' && styles.rolePillTextOps,
                              role.badgeType === 'support' && styles.rolePillTextSupport,
                              role.badgeType === 'finance' && styles.rolePillTextFinance,
                            ]}
                          >
                            {role.badge}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Radio Indicator */}
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </View>

                  <Text style={styles.roleDescText}>{role.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Onboarding & Security Controls */}
        <View style={styles.securityControlsSection}>
          <Text style={styles.securitySectionTitle}>
            INVITATION & SECURITY SETUP
          </Text>

          {/* Send Invitation Email Card */}
          <View style={styles.toggleCard}>
            <View style={styles.toggleCardLeft}>
              <View style={styles.toggleTitleRow}>
                <AppIcon name="mark_email_read" size={20} />
                <Text style={styles.toggleTitleText}>Send Invitation Email</Text>
              </View>
              <Text style={styles.toggleDescText}>
                The user will receive an activation link with one-time setup code valid for 24 hours.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.switchTrack,
                isInviteEmailActive && styles.switchTrackActive,
              ]}
              onPress={() => setIsInviteEmailActive(!isInviteEmailActive)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.switchThumb,
                  isInviteEmailActive && styles.switchThumbActive,
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Hardware 2FA Checkbox Card */}
          <TouchableOpacity
            style={styles.checkboxCard}
            onPress={() => setIs2FAActive(!is2FAActive)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.customCheckbox,
                is2FAActive && styles.customCheckboxActive,
              ]}
            >
              {is2FAActive && (
                <AppIcon name="check" size={20} />
              )}
            </View>

            <View style={styles.checkboxContent}>
              <Text style={styles.checkboxTitleText}>
                Enforce Hardware 2FA on first sign-in
              </Text>
              <Text style={styles.checkboxDescText}>
                Requires FIDO2 WebAuthn security key or biometrics during identity verification step.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Operational Audit Stamp */}
        <View style={styles.auditStamp}>
          <View style={styles.auditStampLeft}>
            <AppIcon name="lock" size={20} />
            <Text style={styles.auditStampText}>
              SYSTEM AUDIT: 256-BIT DISPATCH LOGGING
            </Text>
          </View>
          <Text style={styles.zoneText}>ZONE-BLR-01</Text>
        </View>

        {/* Actions Container */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.createAdminButton,
              isCreated && styles.createAdminButtonSuccess,
            ]}
            onPress={handleCreateAdmin}
            activeOpacity={0.88}
          >
            {isProvisioning ? (
              <AppIcon name="sync" size={20} />
            ) : isCreated ? (
              <AppIcon name="check_circle" size={20} />
            ) : null}
            <Text style={styles.createAdminButtonText}>
              {isProvisioning
                ? 'Provisioning Account...'
                : isCreated
                ? 'Admin Created & Invited!'
                : 'Create Admin Account'}
            </Text>
            {!isProvisioning && !isCreated && (
              <AppIcon name="arrow_forward" size={20} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              if (navigation?.canGoBack()) {
                navigation.goBack();
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel & Return</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Toast Notification */}
      {toastVisible && (
        <View
          style={[
            styles.toastNotification,
            { top: Math.max(insets.top, 10) + 60 },
          ]}
        >
          <AppIcon name="check_circle" size={20} />
          <Text style={styles.toastMessageText} numberOfLines={2}>
            {toastMessage}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  headerContainer: {
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E8EA',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEEF0',
  },
  backIcon: {
    fontFamily: 'Material Icons',
    fontSize: 20,
    color: '#191C1E',
  },
  headerTitleText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 18,
    color: '#191C1E',
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEEF0',
  },
  actionIcon: {
    fontFamily: 'Material Icons',
    fontSize: 20,
    color: '#45464D',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontFamily: 'Material Icons',
    fontSize: 18,
    color: '#FFFFFF',
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 18,
  },
  scrollContentDesktop: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#F2F4F6',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    ...Shadows.level1,
  },
  heroContentLeft: {
    flex: 1,
    gap: 6,
  },
  provisioningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DBE1FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0051D5',
  },
  provisioningBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    color: '#00174B',
    letterSpacing: 0.5,
  },
  heroTitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 20,
    color: '#191C1E',
    letterSpacing: -0.3,
  },
  heroDescText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12.5,
    color: '#45464D',
    lineHeight: 18,
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...Shadows.level1,
  },
  heroIcon: {
    fontFamily: 'Material Icons',
    fontSize: 24,
    color: '#FFFFFF',
  },

  // Form Section
  formSection: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    color: '#191C1E',
    letterSpacing: 0.5,
  },
  requiredAsterisk: {
    color: '#BA1A1A',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    ...Shadows.level1,
  },
  inputLeadingIcon: {
    fontFamily: 'Material Icons',
    fontSize: 20,
    color: '#45464D',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13.5,
    color: '#191C1E',
    padding: 0,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6E8EA',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    ...Shadows.level1,
  },
  flagEmoji: {
    fontSize: 15,
  },
  countryCodeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 13,
    color: '#191C1E',
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    ...Shadows.level1,
  },

  // Roles Section
  rolesSection: {
    gap: 12,
  },
  rolesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  rolesSectionTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 16,
    color: '#191C1E',
  },
  rolesSectionSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464D',
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: '#DBE1FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    color: '#0051D5',
  },
  rolesList: {
    gap: 10,
  },
  roleCard: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    gap: 8,
    overflow: 'hidden',
    ...Shadows.level1,
  },
  roleCardSelected: {
    backgroundColor: 'rgba(219, 225, 255, 0.25)',
    borderColor: '#BEC6E0',
    ...Shadows.level1,
  },
  roleCardActiveStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: '#0051D5',
  },
  roleCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingLeft: 4,
  },
  roleCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  roleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E6E8EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconBoxSelected: {
    backgroundColor: '#0051D5',
  },
  roleIconText: {
    fontFamily: 'Material Icons',
    fontSize: 20,
    color: '#191C1E',
  },
  roleIconTextSelected: {
    color: '#FFFFFF',
  },
  roleTitleCol: {
    flex: 1,
    gap: 3,
  },
  roleTitleText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    color: '#191C1E',
  },
  rolePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  rolePillSuper: {
    backgroundColor: '#FFDAD6',
  },
  rolePillOps: {
    backgroundColor: '#DBE1FF',
  },
  rolePillSupport: {
    backgroundColor: '#E6E8EA',
  },
  rolePillFinance: {
    backgroundColor: 'rgba(111, 251, 190, 0.3)',
  },
  rolePillText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9.5,
  },
  rolePillTextSuper: {
    color: '#93000A',
  },
  rolePillTextOps: {
    color: '#0051D5',
  },
  rolePillTextSupport: {
    color: '#45464D',
  },
  rolePillTextFinance: {
    color: '#005236',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E0E3E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioCircleSelected: {
    backgroundColor: '#0051D5',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  roleDescText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464D',
    lineHeight: 16,
    paddingLeft: 4,
  },

  // Security Controls Section
  securityControlsSection: {
    gap: 10,
  },
  securitySectionTitle: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    color: '#45464D',
    letterSpacing: 0.5,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    gap: 12,
    ...Shadows.level1,
  },
  toggleCardLeft: {
    flex: 1,
    gap: 4,
  },
  toggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleIcon: {
    fontFamily: 'Material Icons',
    fontSize: 18,
    color: '#0051D5',
  },
  toggleTitleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13.5,
    color: '#191C1E',
  },
  toggleDescText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    color: '#45464D',
    lineHeight: 16,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#C6C6CD',
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: '#0051D5',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    ...Shadows.level1,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },

  // Checkbox Card
  checkboxCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    ...Shadows.level1,
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#E0E3E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  customCheckboxActive: {
    backgroundColor: '#0051D5',
  },
  customCheckmarkIcon: {
    fontFamily: 'Material Icons',
    fontSize: 15,
    color: '#FFFFFF',
  },
  checkboxContent: {
    flex: 1,
    gap: 4,
  },
  checkboxTitleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#191C1E',
  },
  checkboxDescText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    color: '#45464D',
    lineHeight: 16,
  },

  // Audit Stamp
  auditStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E6E8EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  auditStampLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  auditStampIcon: {
    fontFamily: 'Material Icons',
    fontSize: 14,
    color: '#45464D',
  },
  auditStampText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464D',
    letterSpacing: 0.4,
  },
  zoneText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    color: '#0051D5',
  },

  // Actions Container
  actionsContainer: {
    gap: 8,
    paddingTop: 4,
  },
  createAdminButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  createAdminButtonSuccess: {
    backgroundColor: '#0051D5',
  },
  createAdminButtonIcon: {
    fontFamily: 'Material Icons',
    fontSize: 20,
    color: '#FFFFFF',
  },
  createAdminButtonText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#45464D',
  },

  // Floating Toast Notification
  toastNotification: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#2D3133',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '90%',
    zIndex: 999,
    ...Shadows.level2,
  },
  toastCheckIcon: {
    fontFamily: 'Material Icons',
    fontSize: 16,
    color: '#6FFBBE',
  },
  toastMessageText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12.5,
    color: '#EFF1F3',
  },
});
