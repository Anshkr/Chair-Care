import { AppIcon } from '../../components/common/AppIcon';
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface CustomerActionConfirmedProps {
  navigation?: any;
  route?: {
    params?: {
      actionType?: 'block' | 'unblock';
      actionTitle?: string;
      actionSubtitle?: string;
      customerId?: string;
      customer?: any;
      reason?: string;
    };
  };
}

export const CustomerActionConfirmedChaircareMobileScreen: React.FC<
  CustomerActionConfirmedProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const params = route?.params;

  // Pulse animation for micro-metric dot and entrance
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 65,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle continuous pulse on status dot
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim, fadeAnim, scaleAnim]);

  const actionType = params?.actionType || (params?.customer?.status === 'blocked' ? 'block' : 'block');
  const isBlockAction = actionType === 'block';

  const passedCust = params?.customer;
  const custId = params?.customerId || passedCust?.id || 'cust-01';

  // Selected customer details with fallback to canonical Ansh Kumar Stitch reference data
  const custName = passedCust?.name || 'Ansh Kumar';
  const custInitials = passedCust?.initials || 'AK';
  const custCode = passedCust?.code || '#CUST-7741';

  const reasonCited =
    params?.reason ||
    passedCust?.holdReason ||
    passedCust?.adminNotes ||
    (isBlockAction ? 'Repeated cancellations' : 'Supervisory Audit Cleared');

  // Format dynamic timestamp or use reference standard
  const timestampFormatted = '12 Oct 2026 • 04:30 PM IST';

  const headline =
    params?.actionTitle ||
    (isBlockAction ? 'Customer Blocked' : 'Customer Account Re-activated');

  const description =
    params?.actionSubtitle ||
    (isBlockAction
      ? `${custName} has been blocked and will no longer be permitted to create new service requests or initiate technician dispatches.`
      : `${custName}'s account has been restored to Active status and auto-dispatch matching has been re-enabled.`);

  const badgePillText = isBlockAction
    ? 'ACCOUNT ACCESS SUSPENDED'
    : 'ACCOUNT RESTORED / ACTIVE';

  const statusLabel = isBlockAction ? 'Blocked' : 'Active';

  // Navigation handlers preserving customer context
  const handleViewCustomerProfile = () => {
    if (navigation) {
      navigation.navigate('CustomerProfileAnshKumar', {
        customerId: custId,
        customer: passedCust || {
          id: custId,
          name: custName,
          initials: custInitials,
          code: custCode,
          status: isBlockAction ? 'blocked' : 'active',
          isHold: isBlockAction,
          holdReason: isBlockAction ? reasonCited : undefined,
        },
      });
    }
  };

  const handleBackToCustomers = () => {
    if (navigation) {
      navigation.navigate('Customers');
    }
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24) + 16,
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            width: '100%',
          }}
        >
          {/* 1. Subtle Architectural Ambient Header Glow & Status Capsule */}
          <View style={styles.heroSection}>
            {/* Ambient status halo */}
            <View
              style={[
                styles.ambientGlow,
                isBlockAction ? styles.glowError : styles.glowSuccess,
              ]}
            />

            {/* Crimson / Green Security Status Badge Icon */}
            <View
              style={[
                styles.securityIconContainer,
                isBlockAction
                  ? styles.securityIconContainerError
                  : styles.securityIconContainerSuccess,
              ]}
            >
              <AppIcon name={isBlockAction ? 'shield_person' : 'verified_user'} size={20} />
              {/* Bottom right mini badge */}
              <View
                style={[
                  styles.securityMiniBadge,
                  isBlockAction
                    ? styles.securityMiniBadgeError
                    : styles.securityMiniBadgeSuccess,
                ]}
              >
                <AppIcon name={isBlockAction ? 'block' : 'check'} size={20} />
              </View>
            </View>

            {/* Micro-Metric Status Pill */}
            <View
              style={[
                styles.microStatusPill,
                isBlockAction
                  ? styles.microStatusPillError
                  : styles.microStatusPillSuccess,
              ]}
            >
              <Animated.View
                style={[
                  styles.microStatusDot,
                  isBlockAction
                    ? styles.microStatusDotError
                    : styles.microStatusDotSuccess,
                  { opacity: pulseAnim },
                ]}
              />
              <Text
                style={[
                  styles.microStatusText,
                  isBlockAction ? styles.textError : styles.textSuccess,
                ]}
              >
                {badgePillText}
              </Text>
            </View>

            {/* Primary Title */}
            <Text style={styles.heroTitle}>{headline}</Text>

            {/* Supporting Description */}
            <Text style={styles.heroSubtitle}>{description}</Text>
          </View>

          {/* 2. Execution Manifest Engineering Spec Card */}
          <View style={styles.manifestCard}>
            {/* Card Head Spec Bar */}
            <View style={styles.manifestHeadBar}>
              <View style={styles.manifestHeadLeft}>
                <AppIcon name="terminal" size={20} />
                <Text style={styles.manifestHeadTitle}>
                  EXECUTION MANIFEST • NODE: BLR-ALPHA
                </Text>
              </View>
              <View style={styles.secBadge}>
                <Text style={styles.secBadgeText}>SEC-L4</Text>
              </View>
            </View>

            {/* Customer Identity Snapshot Row */}
            <View style={styles.customerSnapshotRow}>
              <View style={styles.customerIdentityLeft}>
                <View style={styles.customerAvatarContainer}>
                  <Text style={styles.customerAvatarText}>{custInitials}</Text>
                </View>
                <View style={styles.customerMetaCol}>
                  <Text style={styles.customerNameText} numberOfLines={1}>
                    {custName}
                  </Text>
                  <Text style={styles.customerCodeText}>{custCode}</Text>
                </View>
              </View>

              <View
                style={[
                  styles.statusTagPill,
                  isBlockAction
                    ? styles.statusTagPillError
                    : styles.statusTagPillSuccess,
                ]}
              >
                <View
                  style={[
                    styles.statusTagDot,
                    isBlockAction
                      ? styles.statusTagDotError
                      : styles.statusTagDotSuccess,
                  ]}
                />
                <Text
                  style={[
                    styles.statusTagText,
                    isBlockAction ? styles.textError : styles.textSuccess,
                  ]}
                >
                  {statusLabel}
                </Text>
              </View>
            </View>

            {/* Metric Data Grid */}
            <View style={styles.metricDataGrid}>
              {/* Item: Reason Cited */}
              <View style={styles.metricRow}>
                <Text style={styles.metricRowLabel}>Reason Cited</Text>
                <Text style={styles.metricRowValue} numberOfLines={1}>
                  {reasonCited}
                </Text>
              </View>

              {/* Item: Effective Date & Time */}
              <View style={styles.metricRow}>
                <Text style={styles.metricRowLabel}>Effective Date &amp; Time</Text>
                <Text style={styles.metricRowValueMono}>{timestampFormatted}</Text>
              </View>

              {/* Item: Admin Token / Signed */}
              <View style={styles.metricRow}>
                <Text style={styles.metricRowLabel}>Admin Token / Signed</Text>
                <View style={styles.adminTokenRow}>
                  <AppIcon name="verified_user" size={20} />
                  <Text style={styles.adminTokenText}>Session #8849</Text>
                </View>
              </View>

              {/* Item: Live Ticket Escalation / Impact */}
              <View style={styles.liveTicketCard}>
                <View style={styles.liveTicketHead}>
                  <View style={styles.liveTicketHeadLeft}>
                    <AppIcon name={isBlockAction ? 'notification_important' : 'task_alt'} size={20} />
                    <Text style={styles.liveTicketHeadTitle}>
                      Live Ticket Impact
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.liveTicketCount,
                      isBlockAction ? styles.textError : styles.textSuccess,
                    ]}
                  >
                    {isBlockAction ? '1 Intercepted' : '0 Blocked'}
                  </Text>
                </View>
                <Text style={styles.liveTicketDescription}>
                  {isBlockAction ? (
                    <>
                      Active ticket{' '}
                      <Text style={styles.liveTicketCode}>#CC-10499</Text> routed
                      to Supervisory Ops queue for automated freeze.
                    </>
                  ) : (
                    'All service channels operational. Standard technician auto-dispatch queue unlocked.'
                  )}
                </Text>
              </View>
            </View>
          </View>

          {/* 3. Automated Dispatch Protocol Card */}
          <View style={styles.protocolCard}>
            <View style={styles.protocolIconContainer}>
              <AppIcon name="mark_email_read" size={20} />
            </View>
            <View style={styles.protocolContentCol}>
              <Text style={styles.protocolTitle}>
                AUTOMATED DISPATCH PROTOCOL
              </Text>
              <Text style={styles.protocolDescription}>
                {isBlockAction
                  ? 'The customer account has been muted. In-app messaging and SMS notification dispatched with support dispute escalation link.'
                  : 'The customer account has been unblocked. Welcome back email and SMS confirmation notification dispatched to customer.'}
              </Text>
            </View>
          </View>

          {/* 4. Reversible Dual-State Status Control Card */}
          <View style={styles.reversibleCard}>
            <View style={styles.reversibleHeaderRow}>
              <Text style={styles.reversibleHeaderTitle}>
                OPERATIONAL STATUS STATE
              </Text>
              <Text style={styles.reversibleHeaderBadge}>Reversible Override</Text>
            </View>

            {/* Toggle Graphic Pill Display */}
            <View style={styles.dualStateDisplayContainer}>
              {/* Blocked State */}
              <View
                style={[
                  styles.dualStatePill,
                  isBlockAction
                    ? styles.dualStatePillActiveError
                    : styles.dualStatePillInactive,
                ]}
              >
                <AppIcon name="do_not_disturb_on" size={20} />
                <Text
                  style={[
                    styles.dualStatePillText,
                    isBlockAction ? styles.textError : styles.textMuted,
                    isBlockAction && styles.textSemibold,
                  ]}
                >
                  Blocked
                </Text>
              </View>

              {/* Transfer Sync Arrow */}
              <View style={styles.dualStateSyncCircle}>
                <AppIcon name="sync_alt" size={20} />
              </View>

              {/* Active Account State */}
              <View
                style={[
                  styles.dualStatePill,
                  !isBlockAction
                    ? styles.dualStatePillActiveSuccess
                    : styles.dualStatePillInactive,
                ]}
              >
                <AppIcon name="check_circle" size={20} />
                <Text
                  style={[
                    styles.dualStatePillText,
                    !isBlockAction ? styles.textSuccess : styles.textMuted,
                    !isBlockAction && styles.textSemibold,
                  ]}
                >
                  Active Account
                </Text>
              </View>
            </View>

            {/* Explanatory Note */}
            <View style={styles.reversibleInfoRow}>
              <AppIcon name="info" size={20} />
              <Text style={styles.reversibleInfoText}>
                <Text style={styles.reversibleInfoTextBold}>Status Control: </Text>
                This customer can be {isBlockAction ? 'unblocked and restored to Active' : 'managed or blocked'} status at any time via the Customer Account Management panel.
              </Text>
            </View>
          </View>

          {/* 5. Interactive Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleViewCustomerProfile}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryButtonText}>View Customer Profile</Text>
              <AppIcon name="arrow_forward" size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleBackToCustomers}
              activeOpacity={0.82}
            >
              <AppIcon name="group" size={20} />
              <Text style={styles.secondaryButtonText}>Back to All Customers</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },

  /* 1. Status Hero Section */
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    paddingTop: 8,
    paddingBottom: 16,
    position: 'relative',
    width: '100%',
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    width: 200,
    height: 120,
    borderRadius: 100,
    opacity: 0.18,
  },
  glowError: {
    backgroundColor: '#ba1a1a',
  },
  glowSuccess: {
    backgroundColor: '#009668',
  },
  securityIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
    ...Shadows.level1,
  },
  securityIconContainerError: {
    backgroundColor: '#ffdad6',
  },
  securityIconContainerSuccess: {
    backgroundColor: '#d1fae5',
  },
  securityIconText: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 40,
    includeFontPadding: false,
  },
  securityMiniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  securityMiniBadgeError: {
    backgroundColor: '#ba1a1a',
  },
  securityMiniBadgeSuccess: {
    backgroundColor: '#009668',
  },
  securityMiniBadgeIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#ffffff',
    includeFontPadding: false,
  },

  microStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: 6,
    gap: 6,
  },
  microStatusPillError: {
    backgroundColor: '#ffdad6',
  },
  microStatusPillSuccess: {
    backgroundColor: '#d1fae5',
  },
  microStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  microStatusDotError: {
    backgroundColor: '#ba1a1a',
  },
  microStatusDotSuccess: {
    backgroundColor: '#009668',
  },
  microStatusText: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: Typography.displayHeroMobile?.fontFamily || 'PlusJakartaSans-Bold',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...Typography.bodyMd,
    color: '#45464d',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },

  /* 2. Execution Manifest Card */
  manifestCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginTop: 12,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  manifestHeadBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f2f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e3e5',
  },
  manifestHeadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  manifestTerminalIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#45464d',
    includeFontPadding: false,
  },
  manifestHeadTitle: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#45464d',
    fontWeight: '600',
  },
  secBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#eceef0',
  },
  secBadgeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    lineHeight: 14,
    color: '#45464d',
    fontWeight: '600',
  },

  /* Customer Snapshot Row */
  customerSnapshotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f2f4f6',
  },
  customerIdentityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  customerAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#131b2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: '#dae2fd',
    fontWeight: '700',
  },
  customerMetaCol: {
    flex: 1,
  },
  customerNameText: {
    ...Typography.titleLg,
    fontSize: 17,
    fontWeight: '600',
    color: '#191c1e',
  },
  customerCodeText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#45464d',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statusTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  statusTagPillError: {
    backgroundColor: '#ffdad6',
  },
  statusTagPillSuccess: {
    backgroundColor: '#d1fae5',
  },
  statusTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTagDotError: {
    backgroundColor: '#ba1a1a',
  },
  statusTagDotSuccess: {
    backgroundColor: '#009668',
  },
  statusTagText: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '600',
  },

  /* Metric Data Grid */
  metricDataGrid: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#ffffff',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metricRowLabel: {
    ...Typography.bodySm,
    color: '#45464d',
  },
  metricRowValue: {
    ...Typography.bodySm,
    color: '#191c1e',
    fontWeight: '500',
    textAlign: 'right',
  },
  metricRowValueMono: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#191c1e',
    fontWeight: '500',
    textAlign: 'right',
  },
  adminTokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#0051d5',
    includeFontPadding: false,
  },
  adminTokenText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#0051d5',
    fontWeight: '600',
  },

  /* Live Ticket Card */
  liveTicketCard: {
    backgroundColor: '#f2f4f6',
    borderRadius: BorderRadius.lg,
    padding: 10,
    marginTop: 4,
    gap: 4,
  },
  liveTicketHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveTicketHeadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveTicketAlertIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    includeFontPadding: false,
  },
  liveTicketHeadTitle: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#191c1e',
  },
  liveTicketCount: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    fontWeight: '700',
  },
  liveTicketDescription: {
    ...Typography.bodySm,
    fontSize: 12,
    lineHeight: 17,
    color: '#45464d',
  },
  liveTicketCode: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#191c1e',
    fontWeight: '600',
  },

  /* 3. Automated Dispatch Protocol Card */
  protocolCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    backgroundColor: '#f2f4f6',
    borderRadius: BorderRadius.xl,
    padding: 16,
    marginTop: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e6e8ea',
  },
  protocolIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#e0e3e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#0051d5',
    includeFontPadding: false,
  },
  protocolContentCol: {
    flex: 1,
    gap: 3,
  },
  protocolTitle: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#0051d5',
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  protocolDescription: {
    ...Typography.bodySm,
    fontSize: 12,
    lineHeight: 17,
    color: '#45464d',
  },

  /* 4. Reversible Dual-State Status Control Card */
  reversibleCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 16,
    marginTop: 12,
    gap: 12,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  reversibleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reversibleHeaderTitle: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  reversibleHeaderBadge: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#009668',
    fontWeight: '600',
  },
  dualStateDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 8,
  },
  dualStatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  dualStatePillActiveError: {
    backgroundColor: '#ffdad6',
    ...Shadows.level1,
  },
  dualStatePillActiveSuccess: {
    backgroundColor: '#d1fae5',
    ...Shadows.level1,
  },
  dualStatePillInactive: {
    backgroundColor: '#eceef0',
  },
  dualStatePillIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    includeFontPadding: false,
  },
  dualStatePillText: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '500',
  },
  dualStateSyncCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e3e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dualStateSyncIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#45464d',
    includeFontPadding: false,
  },
  reversibleInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 2,
  },
  reversibleInfoIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#76777d',
    marginTop: 2,
    includeFontPadding: false,
  },
  reversibleInfoText: {
    ...Typography.bodySm,
    fontSize: 12,
    lineHeight: 18,
    color: '#45464d',
    flex: 1,
  },
  reversibleInfoTextBold: {
    fontWeight: '600',
    color: '#191c1e',
  },

  /* 5. Interactive Action Buttons */
  actionsContainer: {
    width: '100%',
    gap: 10,
    marginTop: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    ...Shadows.level2,
  },
  primaryButtonText: {
    fontFamily: Typography.titleLg.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  primaryButtonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6e8ea',
    borderRadius: BorderRadius.lg,
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 8,
  },
  secondaryButtonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
    includeFontPadding: false,
  },
  secondaryButtonText: {
    fontFamily: Typography.titleLg.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: '#191c1e',
  },

  /* Utility Color Classes */
  textError: {
    color: '#ba1a1a',
  },
  textSuccess: {
    color: '#009668',
  },
  textSuccessMuted: {
    color: '#4edea3',
  },
  textMuted: {
    color: '#76777d',
  },
  textSemibold: {
    fontWeight: '700',
  },
});
