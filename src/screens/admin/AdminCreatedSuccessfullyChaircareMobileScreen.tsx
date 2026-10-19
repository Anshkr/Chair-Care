import { AppIcon } from '../../components/common/AppIcon';
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface AdminCreatedSuccessfullyProps {
  navigation?: any;
  route?: {
    params?: {
      adminData?: {
        id?: string;
        name?: string;
        email?: string;
        phoneNumber?: string;
        role?: string;
        roleType?: string;
        status?: string;
        statusLabel?: string;
        isInviteEmailActive?: boolean;
        is2FAActive?: boolean;
        createdAt?: string;
        secKey?: string;
        isPermissionUpdate?: boolean;
      };
    };
  };
}

export const AdminCreatedSuccessfullyChaircareMobileScreen: React.FC<
  AdminCreatedSuccessfullyProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const adminData = route?.params?.adminData;
  const isPermissionUpdate = adminData?.isPermissionUpdate || false;

  // Fallback / Normalized Data
  const adminName = adminData?.name || 'Priya Sharma';
  const adminEmail = adminData?.email || 'priya.sharma@chaircare.corp';
  const adminRole = adminData?.role || 'Operations Admin';
  const adminRoleType = adminData?.roleType || 'ops';

  // Calculate initials
  const initials = adminName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Toast State
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

  const handleBackToAdminUsers = () => {
    if (navigation) {
      navigation.navigate('AdminUsers');
    }
  };

  const handleViewProfile = () => {
    if (navigation) {
      navigation.navigate('AdminProfilePriyaSharma', {
        adminId: adminData?.id || 'ADM-0082',
        adminUser: adminData,
      });
    } else {
      displayToast(`Opening profile for ${adminName}`);
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* Fixed Top-Right Dismiss Button */}
      <View
        style={[
          styles.floatingCloseBar,
          { top: Math.max(insets.top, 10) },
        ]}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleBackToAdminUsers}
          activeOpacity={0.7}
          accessibilityLabel="Dismiss"
        >
          <AppIcon name="close" size={20} />
        </TouchableOpacity>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
          {
            paddingTop: Math.max(insets.top, 10) + 16,
            paddingBottom: Math.max(insets.bottom, 20) + 30,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Ambient Top Glow Accent */}
        <View style={styles.ambientGlow} />

        {/* Success Hero Visual */}
        <View style={styles.heroSection}>
          {/* Checkmark Emblem */}
          <View style={styles.checkmarkContainer}>
            <View style={styles.pulseRing} />
            <View style={styles.checkmarkOuterCircle}>
              <View style={styles.checkmarkInnerCircle}>
                <AppIcon name="check" size={20} />
              </View>
            </View>
          </View>

          {/* Status Subhead Pill */}
          <View style={styles.statusSubheadPill}>
            <View style={styles.statusSubheadDot} />
            <Text style={styles.statusSubheadText}>
              {isPermissionUpdate
                ? 'STATUS: PERMISSIONS COMMITTED • AUDITED'
                : 'STATUS: ONBOARDING INITIATED • REVERSIBLE ROLE'}
            </Text>
          </View>

          {/* Headings */}
          <View style={styles.headingsCol}>
            <Text style={styles.mainTitleText}>
              {isPermissionUpdate
                ? 'Permissions Updated'
                : 'Admin Created Successfully'}
            </Text>
            <Text style={styles.mainSubtitleText}>
              {isPermissionUpdate ? (
                <>
                  The administrator’s access for{' '}
                  <Text style={styles.boldSubtitleName}>{adminName}</Text> has
                  been updated successfully.
                </>
              ) : (
                <>
                  {adminName} has been added as an{' '}
                  <Text style={styles.boldSubtitleRole}>{adminRole}</Text> with
                  configured access credentials.
                </>
              )}
            </Text>
          </View>
        </View>

        {/* Summary Manifest Bento Card */}
        <View style={styles.bentoCard}>
          {/* Bento Header Bar */}
          <View style={styles.bentoHeaderRow}>
            <View style={styles.bentoHeaderLeft}>
              <AppIcon name="badge" size={20} />
              <Text style={styles.bentoHeaderTitle}>
                SYSTEM ACCESS MANIFEST
              </Text>
            </View>
            <View style={styles.revBadge}>
              <Text style={styles.revBadgeText}>REV: 2026.10</Text>
            </View>
          </View>

          {/* Member Identity Header */}
          <View style={styles.memberIdentityRow}>
            <View style={styles.memberAvatarBox}>
              <Text style={styles.memberAvatarInitials}>{initials}</Text>
              <View style={styles.memberAvatarDoneBadge}>
                <AppIcon name="done" size={20} />
              </View>
            </View>

            <View style={styles.memberIdentityInfo}>
              <View style={styles.memberNameRow}>
                <Text style={styles.memberNameText} numberOfLines={1}>
                  {adminName}
                </Text>
                <View style={styles.memberRoleBadge}>
                  <Text style={styles.memberRoleBadgeText}>{adminRole}</Text>
                </View>
              </View>
              <Text style={styles.memberEmailText} numberOfLines={1}>
                {adminEmail}
              </Text>
            </View>
          </View>

          {/* Micro Data Rows */}
          <View style={styles.microDataStack}>
            <View style={styles.microDataRow}>
              <Text style={styles.microDataLabel}>Access Tier</Text>
              <Text style={styles.microDataValue}>
                {adminRoleType === 'super'
                  ? 'Super Admin (Full Root Access)'
                  : adminRoleType === 'finance'
                  ? 'Finance (4 Modules Enabled)'
                  : adminRoleType === 'support'
                  ? 'Support (3 Modules Enabled)'
                  : 'Operations (5 Modules Enabled)'}
              </Text>
            </View>

            <View style={styles.microDataRow}>
              <Text style={styles.microDataLabel}>Lifecycle Status</Text>
              <View style={styles.lifecycleRight}>
                <View style={styles.lifecycleDot} />
                <Text style={styles.lifecycleText}>
                  Active • Invitation Dispatched
                </Text>
              </View>
            </View>

            <View style={styles.microDataRow}>
              <Text style={styles.microDataLabel}>Effective Timestamp</Text>
              <Text style={styles.microDataMono}>
                Today, 12 Oct 2026 • 11:50 AM IST
              </Text>
            </View>

            <View style={styles.microDataRow}>
              <Text style={styles.microDataLabel}>Authorized Sign-off</Text>
              <View style={styles.signOffBadge}>
                <Text style={styles.signOffText}>Super Admin (#SA-01)</Text>
              </View>
            </View>
          </View>

          {/* Module Privileges Assigned */}
          <View style={styles.privilegesSection}>
            <Text style={styles.privilegesLabel}>
              MODULE PRIVILEGES ASSIGNED
            </Text>
            <View style={styles.privilegePillsWrap}>
              <View style={styles.privilegePill}>
                <Text style={styles.privilegePillCheck}>check_small</Text>
                <Text style={styles.privilegePillText}>Requests</Text>
              </View>

              <View style={styles.privilegePill}>
                <Text style={styles.privilegePillCheck}>check_small</Text>
                <Text style={styles.privilegePillText}>Bookings</Text>
              </View>

              <View style={styles.privilegePill}>
                <Text style={styles.privilegePillCheck}>check_small</Text>
                <Text style={styles.privilegePillText}>Telemetry</Text>
              </View>

              <View style={styles.privilegePill}>
                <Text style={styles.privilegePillCheck}>check_small</Text>
                <Text style={styles.privilegePillText}>Techs</Text>
              </View>

              <View style={styles.privilegePill}>
                <Text style={styles.privilegePillCheck}>check_small</Text>
                <Text style={styles.privilegePillText}>Customers</Text>
              </View>

              <View style={styles.privilegePillMuted}>
                <Text style={styles.privilegePillLock}>lock</Text>
                <Text style={styles.privilegePillTextMuted}>Finance Muted</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Invitation & Security Protocol Dispatch Card */}
        <View style={styles.dispatchCard}>
          <View style={styles.dispatchCardTop}>
            <View style={styles.dispatchIconBox}>
              <AppIcon name="forward_to_inbox" size={20} />
            </View>
            <View style={styles.dispatchTitleCol}>
              <Text style={styles.dispatchTitleText}>
                Invitation & Security Protocol Sent
              </Text>
              <Text style={styles.dispatchDescText}>
                An activation link with a secure one-time onboarding token has been delivered to:
              </Text>
            </View>
          </View>

          {/* High-Trust Delivery Target Pill */}
          <View style={styles.deliveryTargetPill}>
            <View style={styles.deliveryTargetLeft}>
              <AppIcon name="verified_user" size={20} />
              <Text style={styles.deliveryTargetEmail} numberOfLines={1}>
                {adminEmail}
              </Text>
            </View>
            <View style={styles.dispatchedBadge}>
              <AppIcon name="done" size={20} />
              <Text style={styles.dispatchedBadgeText}>Dispatched</Text>
            </View>
          </View>

          {/* Security Instruction Callout */}
          <View style={styles.securityCalloutRow}>
            <AppIcon name="timer" size={20} />
            <Text style={styles.securityCalloutText}>
              Recipient must authenticate with corporate SSO and configure hardware 2FA within{' '}
              <Text style={styles.securityHoursHighlight}>24 hours</Text> before token expiration.
            </Text>
          </View>
        </View>

        {/* Adaptive State Transformation Note Card */}
        <View style={styles.stateDynamicsCard}>
          <AppIcon name="swap_horizontal_circle" size={20} />
          <View style={styles.stateDynamicsContent}>
            <Text style={styles.stateDynamicsTitle}>STATE DYNAMICS NOTE</Text>
            <Text style={styles.stateDynamicsDesc}>
              When modifying existing administrator permissions, this view renders:{' '}
              <Text style={styles.stateDynamicsQuote}>
                “Permissions Updated — The administrator’s access has been updated successfully.”
              </Text>
            </Text>
          </View>
        </View>

        {/* Primary & Secondary Action CTAs */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryProfileButton}
            onPress={handleViewProfile}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryProfileButtonText}>View Admin Profile</Text>
            <AppIcon name="arrow_forward" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryUsersButton}
            onPress={handleBackToAdminUsers}
            activeOpacity={0.7}
          >
            <AppIcon name="group" size={20} />
            <Text style={styles.secondaryUsersButtonText}>Back to Admin Users</Text>
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
  floatingCloseBar: {
    position: 'absolute',
    right: 16,
    zIndex: 50,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(230, 232, 234, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  closeIcon: {
    fontFamily: 'Material Icons',
    fontSize: 20,
    color: '#191C1E',
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  scrollContentDesktop: {
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },

  ambientGlow: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(111, 251, 190, 0.2)',
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    gap: 12,
    paddingTop: 8,
  },
  checkmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  pulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(111, 251, 190, 0.35)',
  },
  checkmarkOuterCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#6FFBBE',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  checkmarkInnerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: '#005236',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkIcon: {
    fontFamily: 'Material Icons',
    fontSize: 38,
    color: '#F7F9FB',
  },
  statusSubheadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6E8EA',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    ...Shadows.level1,
  },
  statusSubheadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#005236',
  },
  statusSubheadText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9.5,
    color: '#45464D',
    letterSpacing: 0.5,
  },
  headingsCol: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  mainTitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 22,
    color: '#191C1E',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  mainSubtitleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#45464D',
    textAlign: 'center',
    lineHeight: 19,
  },
  boldSubtitleRole: {
    fontFamily: 'Inter-SemiBold',
    color: '#191C1E',
  },
  boldSubtitleName: {
    fontFamily: 'Inter-SemiBold',
    color: '#191C1E',
  },

  // Bento Card
  bentoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    gap: 12,
    ...Shadows.level2,
  },
  bentoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(242, 244, 246, 0.7)',
    marginHorizontal: -16,
    marginTop: -16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  bentoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bentoHeaderIcon: {
    fontFamily: 'Material Icons',
    fontSize: 18,
    color: '#45464D',
  },
  bentoHeaderTitle: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10.5,
    color: '#45464D',
    letterSpacing: 0.5,
  },
  revBadge: {
    backgroundColor: '#E0E3E5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  revBadgeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9.5,
    color: '#45464D',
  },

  // Member Identity Header
  memberIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 2,
  },
  memberAvatarBox: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ECEEF0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  memberAvatarInitials: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 17,
    color: '#191C1E',
  },
  memberAvatarDoneBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#005236',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarDoneIcon: {
    fontFamily: 'Material Icons',
    fontSize: 10,
    color: '#FFFFFF',
  },
  memberIdentityInfo: {
    flex: 1,
    gap: 2,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  memberNameText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 16,
    color: '#191C1E',
  },
  memberRoleBadge: {
    backgroundColor: '#DBE1FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  memberRoleBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#003EA8',
  },
  memberEmailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464D',
  },

  // Micro Data Rows
  microDataStack: {
    gap: 6,
    paddingTop: 4,
  },
  microDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  microDataLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464D',
  },
  microDataValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#191C1E',
  },
  lifecycleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lifecycleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#005236',
  },
  lifecycleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
    color: '#191C1E',
  },
  microDataMono: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#191C1E',
  },
  signOffBadge: {
    backgroundColor: '#ECEEF0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  signOffText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#191C1E',
  },

  // Privileges Section
  privilegesSection: {
    gap: 8,
    paddingTop: 2,
  },
  privilegesLabel: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10,
    color: '#45464D',
    letterSpacing: 0.6,
  },
  privilegePillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  privilegePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECEEF0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  privilegePillCheck: {
    fontFamily: 'Material Icons',
    fontSize: 15,
    color: '#005236',
    marginRight: 2,
  },
  privilegePillText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11.5,
    color: '#191C1E',
  },
  privilegePillMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(224, 227, 229, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  privilegePillLock: {
    fontFamily: 'Material Icons',
    fontSize: 13,
    color: '#76777D',
    marginRight: 4,
  },
  privilegePillTextMuted: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    color: '#76777D',
  },

  // Dispatch Card
  dispatchCard: {
    backgroundColor: '#F2F4F6',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    ...Shadows.level1,
  },
  dispatchCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dispatchIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DBE1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  dispatchIcon: {
    fontFamily: 'Material Icons',
    fontSize: 20,
    color: '#0051D5',
  },
  dispatchTitleCol: {
    flex: 1,
    gap: 2,
  },
  dispatchTitleText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14.5,
    color: '#191C1E',
  },
  dispatchDescText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    color: '#45464D',
    lineHeight: 16,
  },
  deliveryTargetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...Shadows.level1,
  },
  deliveryTargetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  deliveryVerifiedIcon: {
    fontFamily: 'Material Icons',
    fontSize: 16,
    color: '#0051D5',
  },
  deliveryTargetEmail: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11.5,
    color: '#191C1E',
    flex: 1,
  },
  dispatchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#6FFBBE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dispatchedBadgeIcon: {
    fontFamily: 'Material Icons',
    fontSize: 12,
    color: '#002113',
  },
  dispatchedBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10.5,
    color: '#002113',
  },
  securityCalloutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 2,
  },
  securityTimerIcon: {
    fontFamily: 'Material Icons',
    fontSize: 15,
    color: '#45464D',
    marginTop: 1,
  },
  securityCalloutText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    color: '#45464D',
    flex: 1,
    lineHeight: 16,
  },
  securityHoursHighlight: {
    fontFamily: 'Inter-SemiBold',
    color: '#191C1E',
  },

  // State Dynamics Card
  stateDynamicsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(230, 232, 234, 0.6)',
    borderRadius: 12,
    padding: 12,
  },
  stateDynamicsIcon: {
    fontFamily: 'Material Icons',
    fontSize: 18,
    color: '#45464D',
    marginTop: 1,
  },
  stateDynamicsContent: {
    flex: 1,
    gap: 2,
  },
  stateDynamicsTitle: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    color: '#45464D',
    letterSpacing: 0.5,
  },
  stateDynamicsDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    color: '#45464D',
    lineHeight: 16,
  },
  stateDynamicsQuote: {
    color: '#191C1E',
    fontFamily: 'Inter-Medium',
    fontStyle: 'normal',
  },

  // Actions Container
  actionsContainer: {
    gap: 10,
    paddingTop: 4,
  },
  primaryProfileButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  primaryProfileButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  primaryProfileButtonIcon: {
    fontFamily: 'Material Icons',
    fontSize: 18,
    color: '#FFFFFF',
  },
  secondaryUsersButton: {
    backgroundColor: '#ECEEF0',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryUsersButtonIcon: {
    fontFamily: 'Material Icons',
    fontSize: 18,
    color: '#191C1E',
  },
  secondaryUsersButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13.5,
    color: '#191C1E',
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
