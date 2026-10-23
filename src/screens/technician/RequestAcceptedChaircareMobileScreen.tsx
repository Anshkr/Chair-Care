import { AppIcon } from '../../components/common/AppIcon';
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useTechnician } from '../../context/TechnicianContext';
import { phoneCallService } from '../../services/phone/phoneCallService';

interface RequestAcceptedProps {
  navigation?: any;
  route?: {
    params?: {
      requestId?: string;
      jobId?: string;
      request?: any;
    };
  };
}

export const RequestAcceptedChaircareMobileScreen: React.FC<
  RequestAcceptedProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { acceptedRequest } = useTechnician();

  const passedRequest = route?.params?.request || acceptedRequest;
  const passedId = route?.params?.requestId || route?.params?.jobId;

  // Selected request data with fallback to exact reference specs
  const ticket = passedRequest || {
    id: passedId || 'ticket-8492',
    ticketNumber: passedId?.includes('REQ') ? passedId : 'REQ-8492',
    categoryTag: 'Hydraulic & Tilt Assembly',
    serviceTitle: 'Office Chair Repair',
    customerName: 'Ansh Kumar',
    customerLocation: 'Flat 402, Palm Springs Residences',
    customerArea: 'Sector 54, Gurugram',
    customerRating: 4.9,
    isVerifiedCustomer: true,
    scheduleTime: 'Today, 2:30 PM (in 42 mins)',
    distance: '2.4 km',
    payoutRange: '₹499 – ₹799',
    payoutType: 'Instant UPI / Bank',
    status: 'accepted',
  };

  // Subtle pulsing animation for concentric rings
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 1600,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.08,
            duration: 1600,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: 1200,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ])
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim, opacityAnim]);

  const handleCallCustomer = () => {
    const phone = ticket.customerPhone || ticket.customer_phone || '+91 98765 43210';
    phoneCallService.callNumber(phone, ticket.customerName);
  };

  const handleNavigateToCustomer = () => {
    navigation.navigate('NavigateToCustomer', {
      requestId: ticket.id || ticket.ticketNumber,
      request: ticket,
    });
  };

  const handleGoToDashboard = () => {
    navigation.navigate('TechnicianMain', { screen: 'TechDashboardTab' });
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20) + 12,
            paddingBottom: Math.max(insets.bottom, 20) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Visual Section */}
        <View style={styles.successVisualSection}>
          <View style={styles.sealWrapper}>
            {/* Animated Concentric Ambient Rings */}
            <Animated.View
              style={[
                styles.ambientRingOuter,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: opacityAnim,
                },
              ]}
            />
            <View style={styles.ambientRingInner} />

            {/* Seal Container */}
            <View style={styles.sealContainer}>
              <AppIcon name="Check" size={18} />

              {/* Micro Verified Metric Pip */}
              <View style={styles.microVerifiedPip}>
                <AppIcon name="Check" size={18} />
              </View>
            </View>
          </View>

          <Text style={styles.successHeadline}>Job Accepted!</Text>
          <Text style={styles.successSubtext}>
            The service request has been confirmed and successfully added to
            your schedule. The customer has been alerted that you are on the
            job.
          </Text>

          {/* Operational State Badges */}
          <View style={styles.stateBadgesRow}>
            <View style={styles.dispatchLockedBadge}>
              <View style={styles.pulsingGreenDot} />
              <Text style={styles.dispatchLockedText}>
                Scheduled • Dispatch Locked
              </Text>
            </View>

            <View style={styles.scheduleBadge}>
              <AppIcon name="Clock" size={18} />
              <Text style={styles.scheduleBadgeText}>
                {ticket.scheduleTime || 'Today, 2:30 PM (in 42 mins)'}
              </Text>
            </View>
          </View>
        </View>

        {/* Accepted Job Details Card */}
        <View style={styles.detailsCard}>
          {/* Header Row */}
          <View style={styles.detailsHeaderRow}>
            <View style={styles.categoryTitleCol}>
              <Text style={styles.categoryMonoText}>
                {ticket.categoryTag || 'Hydraulic & Tilt Assembly'}
              </Text>
              <Text style={styles.jobTitleText}>
                {ticket.serviceTitle || 'Office Chair Repair'}
              </Text>
            </View>
            <View style={styles.ticketBadge}>
              <Text style={styles.ticketBadgeText}>
                #{ticket.ticketNumber || 'REQ-8492'}
              </Text>
            </View>
          </View>

          {/* Customer Snippet */}
          <View style={styles.customerSnippet}>
            <View style={styles.customerAvatarPod}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>AK</Text>
              </View>
              <View style={styles.avatarStarBadge}>
                <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.avatarRatingText}>
                  {ticket.customerRating ? ticket.customerRating.toFixed(1) : '4.9'}
                </Text>
              </View>
            </View>

            <View style={styles.customerInfoCol}>
              <Text style={styles.customerNameText}>
                {ticket.customerName || 'Ansh Kumar'}
              </Text>
              <Text style={styles.customerAddressText}>
                {ticket.customerLocation || 'Flat 402, Palm Springs Residences'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.callCustomerBtn}
              onPress={handleCallCustomer}
              activeOpacity={0.7}
              accessibilityLabel="Call Customer"
            >
              <AppIcon name="Phone" size={18} />
            </TouchableOpacity>
          </View>

          {/* Geo & Mechanics Grid */}
          <View style={styles.gridRow}>
            {/* Distance Card */}
            <View style={styles.gridCell}>
              <View style={styles.gridCellHeader}>
                <AppIcon name="Compass" size={18} color={Colors.secondary} />
                <Text style={styles.gridCellLabel}>Distance</Text>
              </View>
              <Text style={styles.gridCellValue}>{ticket.distance || '2.4 km'}</Text>
              <Text style={styles.gridCellSub}>
                {ticket.customerArea || 'Sector 54, Gurugram'}
              </Text>
            </View>

            {/* Payout Card */}
            <View style={styles.gridCell}>
              <View style={styles.gridCellHeader}>
                <AppIcon name="Tag" size={18} color="#059669" />
                <Text style={styles.gridCellLabel}>Booked Price</Text>
              </View>
              <Text style={styles.gridCellValue}>
                ₹{ticket.totalAmount || (ticket as any).total || 599}
              </Text>
              <Text style={styles.gridCellSub}>
                {ticket.isPaid ? 'Prepaid Online' : 'Pay After Fix'}
              </Text>
            </View>
          </View>

          {/* Payout Footnote */}
          <View style={styles.payoutFootnoteRow}>
            <AppIcon name="ShieldCheck" size={18} />
            <Text style={styles.footnoteText}>
              Direct Bank / UPI wallet payout triggered upon sign-off
            </Text>
          </View>
        </View>

        {/* Operational Protocol Checklist */}
        <View style={styles.protocolCard}>
          <View style={styles.protocolHeaderRow}>
            <Text style={styles.protocolHeadline}>Standard Dispatch Protocol</Text>
            <Text style={styles.stepIndicatorText}>STEP 1 OF 3</Text>
          </View>

          <View style={styles.protocolStepsList}>
            {/* Step 1 */}
            <View style={styles.protocolStepItem}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepTextCol}>
                <Text style={styles.stepTitle}>
                  Review customer photos & mechanism specs
                </Text>
                <Text style={styles.stepSubtitle}>
                  Tilt-lock cylinder type & gas-spring stroke diagnostics
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.protocolStepItem}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepTextCol}>
                <Text style={styles.stepTitle}>
                  Depart by 02:10 PM for on-time SLA
                </Text>
                <Text style={styles.stepSubtitle}>
                  Route has minor arterial traffic on Golf Course Road
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.protocolStepItem}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepTextCol}>
                <Text style={styles.stepTitle}>
                  Contact customer if security requires pre-pass
                </Text>
                <Text style={styles.stepSubtitle}>
                  Digital MyGate / Society visitor code auto-shared
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Actions Deck */}
        <View style={styles.actionsDeck}>
          {/* Primary Action: Navigate to Customer */}
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={handleNavigateToCustomer}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryActionText}>Navigate to Customer</Text>
            <Text style={styles.primaryActionArrow}>→</Text>
          </TouchableOpacity>

          {/* Secondary Action: Dashboard */}
          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={handleGoToDashboard}
            activeOpacity={0.8}
          >
            <AppIcon name="LayoutDashboard" size={18} color={Colors.onSurface} />
            <Text style={styles.secondaryActionText}>Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    flexGrow: 1,
  },
  successVisualSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sealWrapper: {
    position: 'relative',
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  ambientRingOuter: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.tertiaryFixed,
  },
  ambientRingInner: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: Colors.tertiaryFixedDim,
    opacity: 0.25,
  },
  sealContainer: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#002113', // Deep rich emerald container
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
    borderWidth: 2,
    borderColor: Colors.tertiaryFixed,
  },
  sealCheckIcon: {
    fontSize: 42,
    color: Colors.tertiaryFixed,
    fontWeight: '800',
  },
  microVerifiedPip: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 3,
    borderRadius: BorderRadius.full,
    ...Shadows.level1,
  },
  microVerifiedCheck: {
    fontSize: 14,
    color: Colors.secondaryCobalt,
    fontWeight: '900',
  },
  successHeadline: {
    ...Typography.headlineLg,
    fontSize: 28,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.4,
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubtext: {
    ...Typography.bodyMd,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  stateBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.md,
  },
  dispatchLockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: '#E6F7F0',
  },
  pulsingGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#005236',
  },
  dispatchLockedText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: '#005236',
  },
  scheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondaryFixed,
  },
  scheduleClockIcon: {
    fontSize: 11,
  },
  scheduleBadgeText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSecondaryFixedVariant,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerLow,
  },
  categoryTitleCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  categoryMonoText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  jobTitleText: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  ticketBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  ticketBadgeText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  customerSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  customerAvatarPod: {
    position: 'relative',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    ...Typography.labelMono,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.onPrimary,
  },
  avatarStarBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    ...Shadows.level1,
  },
  starIcon: {
    fontSize: 9,
  },
  avatarRatingText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  customerInfoCol: {
    flex: 1,
  },
  customerNameText: {
    ...Typography.bodyMd,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  customerAddressText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  callCustomerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  callIcon: {
    fontSize: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  gridCell: {
    flex: 1,
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    justifyContent: 'space-between',
    minHeight: 74,
  },
  gridCellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  distanceIcon: {
    fontSize: 13,
  },
  payoutIcon: {
    fontSize: 13,
  },
  gridCellLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  gridCellValue: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  gridCellSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  payoutFootnoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  footnoteShieldIcon: {
    fontSize: 13,
  },
  footnoteText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  protocolCard: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  protocolHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  protocolHeadline: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  stepIndicatorText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  protocolStepsList: {
    gap: 8,
  },
  protocolStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.onSecondaryFixed,
  },
  stepTextCol: {
    flex: 1,
  },
  stepTitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
    lineHeight: 18,
  },
  stepSubtitle: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },
  actionsDeck: {
    gap: 10,
  },
  primaryActionBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  primaryActionText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  primaryActionArrow: {
    fontSize: 16,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerHigh,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  calendarIcon: {
    fontSize: 15,
  },
  secondaryActionText: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
  },
});
