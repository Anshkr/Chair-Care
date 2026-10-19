import { AppIcon } from '../../components/common/AppIcon';
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useTechnician } from '../../context/TechnicianContext';
import { technicianApi } from '../../services/api/technicianApi';

interface JobCompletedProps {
  navigation?: any;
  route?: {
    params?: {
      requestId?: string;
      jobId?: string;
      request?: any;
    };
  };
}

export const JobCompletedChaircareMobileScreen: React.FC<JobCompletedProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { acceptedRequest, setAcceptedRequest } = useTechnician();

  const passedRequest = route?.params?.request || acceptedRequest;
  const passedId = route?.params?.requestId || route?.params?.jobId;

  // Selected request context
  const ticket = passedRequest || {
    id: passedId || '',
    ticketNumber: passedId || 'DISPATCH',
    dispatchNumber: passedId ? String(passedId).slice(0, 4) : 'DONE',
    customerName: 'Customer',
    chairModel: 'Ergonomic Task Chair',
    serviceTitle: 'Office Chair Repair',
    baseRate: 499,
    additionalPartsCost: 250,
    durationMinutes: 45,
    status: 'completed',
  };

  const baseRate = Number(ticket.totalAmount) || Number((ticket as any).total) || ticket.baseRate || 599;
  const additionalCost = ticket.additionalWork?.totalCost || ticket.additionalPartsCost || 0;
  const grandTotal = baseRate + additionalCost;
  const duration = ticket.durationMinutes || (ticket.durationSeconds ? Math.ceil(ticket.durationSeconds / 60) : 48);

  // Celebratory Ripple Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.35,
            duration: 1600,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.05,
            duration: 1600,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1100,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: 1100,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ])
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim, opacityAnim]);

  // Ensure request is saved as completed in technician context and backend
  useEffect(() => {
    if (ticket.id) {
      technicianApi.updateJobStatus(ticket.id, 'completed').catch(() => {});
    }
    if (ticket.status !== 'completed') {
      const completedRecord = {
        ...ticket,
        status: 'completed',
        completedAt: new Date().toISOString(),
      };
      setAcceptedRequest(completedRecord);
    }
  }, [ticket.id, ticket.status]);

  const handleViewPayoutLedger = () => {
    navigation.navigate('TechnicianMain', { screen: 'EarningsTab' });
  };

  const handleReturnToQueue = () => {
    navigation.navigate('TechnicianMain', { screen: 'JobRequestsTab' });
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20) + 8,
            paddingBottom: Math.max(insets.bottom, 20) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimalist Operational Micro-Bar */}
        <View style={styles.microBar}>
          <View style={styles.microBarLeft}>
            <AppIcon name="Check" size={18} />
            <Text style={styles.protocolText}>
              PROTOCOL DISPATCH #{ticket.dispatchNumber || '8492'}
            </Text>
          </View>
          <View style={styles.sessionClosedBadge}>
            <Text style={styles.sessionClosedText}>Session Closed</Text>
          </View>
        </View>

        {/* Celebratory Engineering Success Hero */}
        <View style={styles.heroSuccessCard}>
          <View style={styles.haloWrapper}>
            <Animated.View
              style={[
                styles.rippleOuterRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: opacityAnim,
                },
              ]}
            />
            <View style={styles.rippleInnerRing} />
            <View style={styles.sealCircle}>
              <AppIcon name="Check" size={18} />
            </View>
          </View>

          <Text style={styles.headlineTitle}>Service Completed!</Text>
          <Text style={styles.headlineSubtitle}>
            Great job! This ergonomic asset service has been successfully
            completed and field verified.
          </Text>

          {/* Verification Pill */}
          <View style={styles.verificationPill}>
            <View style={styles.pulsingGreenDot} />
            <Text style={styles.verifiedText}>
              Customer Digitally Verified
            </Text>
            <Text style={styles.pillBullet}>•</Text>
            <Text style={styles.timestampText}>Today at 03:14 PM</Text>
          </View>
        </View>

        {/* Asset & Job Summary Spec Sheet */}
        <View style={styles.specSheetCard}>
          <View style={styles.specHeaderRow}>
            <View style={styles.specAssetGroup}>
              <View style={styles.chairIconBox}>
                <AppIcon name="Armchair" size={18} />
              </View>
              <View style={styles.chairNameCol}>
                <Text style={styles.targetAssetLabel}>TARGET ASSET</Text>
                <Text style={styles.chairModelName}>
                  {ticket.chairModel || 'Herman Miller Aeron (Size B)'}
                </Text>
              </View>
            </View>
            <View style={styles.ticketBadge}>
              <Text style={styles.ticketBadgeText}>
                #{ticket.ticketNumber || 'REQ-8492'}
              </Text>
            </View>
          </View>

          {/* Micro-stat Grid */}
          <View style={styles.microStatGrid}>
            <View style={styles.microStatCell}>
              <Text style={styles.statLabel}>CUSTOMER</Text>
              <View style={styles.customerValRow}>
                <AppIcon name="User" size={18} />
                <Text style={styles.customerValText}>
                  {ticket.customerName || 'Ansh Kumar'}
                </Text>
              </View>
            </View>

            <View style={styles.microStatCell}>
              <Text style={styles.statLabel}>DISPATCH DURATION</Text>
              <View style={styles.durationValRow}>
                <Text style={styles.durationHeroText}>{duration}</Text>
                <Text style={styles.durationSlaText}>/ 60 min SLA</Text>
              </View>
            </View>
          </View>

          {/* Efficiency Bonus Banner */}
          <View style={styles.efficiencyBanner}>
            <AppIcon name="Zap" size={18} />
            <Text style={styles.efficiencyText}>
              <Text style={styles.efficiencyBold}>
                +{60 - duration} min efficiency delta
              </Text>{' '}
              unlocked. Eligible for monthly speed rating multiplier.
            </Text>
          </View>
        </View>

        {/* Work Execution Audit & Verification Checklist */}
        <View style={styles.auditCard}>
          <View style={styles.auditHeaderRow}>
            <View style={styles.auditTitleGroup}>
              <AppIcon name="ClipboardList" size={18} />
              <Text style={styles.auditTitle}>Work Execution Audit</Text>
            </View>
            <View style={styles.verifiedCountBadge}>
              <Text style={styles.verifiedCountText}>4/4 Verified</Text>
            </View>
          </View>

          <View style={styles.auditItemsList}>
            {/* Item 1 */}
            <View style={styles.auditItemRow}>
              <View style={styles.auditCheckDot}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.auditTextCol}>
                <Text style={styles.auditItemTitle}>
                  Chair mechanism calibrated
                </Text>
                <Text style={styles.auditItemSub}>
                  Synchron-tilt locked and mechanical linkages lubricated
                </Text>
              </View>
            </View>

            {/* Item 2 */}
            <View style={styles.auditItemRow}>
              <View style={styles.auditCheckDot}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.auditTextCol}>
                <Text style={styles.auditItemTitle}>
                  Hydraulic assembly verified
                </Text>
                <Text style={styles.auditItemSub}>
                  Class-4 nitrogen cylinder seal pressure tested (no creep)
                </Text>
              </View>
            </View>

            {/* Item 3 */}
            <View style={styles.auditItemRow}>
              <View style={styles.auditCheckDot}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.auditTextCol}>
                <Text style={styles.auditItemTitle}>
                  Kinematic movement benchmarked
                </Text>
                <Text style={styles.auditItemSub}>
                  110kg load dynamic bearing & 360° caster track cleared
                </Text>
              </View>
            </View>

            {/* Item 4 */}
            <View style={styles.auditItemRow}>
              <View style={styles.auditCheckDot}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.auditTextCol}>
                <Text style={styles.auditItemTitle}>
                  Final quality certification
                </Text>
                <Text style={styles.auditItemSub}>
                  14-point BIFMA mechanical audit passed and signed off
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Estimated Earnings Ledger Card */}
        <View style={styles.earningsLedgerCard}>
          <View style={styles.ledgerHeaderRow}>
            <View>
              <Text style={styles.payoutTag}>CUSTOMER BOOKING PRICE</Text>
              <Text style={styles.ledgerTitle}>Settled Service Price</Text>
            </View>
            <View style={styles.ledgerAmountCol}>
              <Text style={styles.ledgerGrandAmount}>₹{grandTotal}</Text>
              <Text style={styles.rangeText}>{additionalCost > 0 ? `Base ₹${baseRate} + Parts ₹${additionalCost}` : 'Exact Booked Price'}</Text>
            </View>
          </View>

          {/* Breakdown Lines */}
          <View style={styles.payoutBreakdownCol}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>
                Booked Service Package
              </Text>
              <Text style={styles.breakdownVal}>₹{baseRate}.00</Text>
            </View>
            {additionalCost > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>
                  Approved Additional Work / Parts
                </Text>
                <Text style={styles.breakdownVal}>₹{additionalCost}.00</Text>
              </View>
            )}
          </View>

          {/* Payout Status Banner */}
          <View style={styles.payoutStatusBanner}>
            <View style={styles.payoutStatusHeader}>
              <View style={styles.amberDot} />
              <Text style={styles.payoutStatusTitle}>
                Pending Invoice Settlement
              </Text>
            </View>
            <Text style={styles.payoutStatusBody}>
              Customer is currently reviewing digital bill. Direct bank transfer &
              UPI auto-credit will release instantly upon confirmation.
            </Text>
          </View>
        </View>

        {/* Operational Follow-up Actions */}
        <View style={styles.followupActionsGroup}>
          <TouchableOpacity
            style={styles.primaryPayoutBtn}
            onPress={handleViewPayoutLedger}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryPayoutBtnText}>
              View Payout Ledger & Jobs
            </Text>
            <Text style={styles.payoutArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryQueueBtn}
            onPress={handleReturnToQueue}
            activeOpacity={0.8}
          >
            <AppIcon name="Home" size={18} />
            <Text style={styles.secondaryQueueBtnText}>
              Return to Dispatch Queue
            </Text>
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
    gap: 12,
  },
  microBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  microBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedIcon: {
    fontSize: 14,
    color: Colors.secondaryCobalt,
    fontWeight: '900',
  },
  protocolText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sessionClosedBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  sessionClosedText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#005236',
  },
  heroSuccessCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    textAlign: 'center',
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  haloWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    marginTop: 4,
  },
  rippleOuterRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 150, 104, 0.25)',
  },
  rippleInnerRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(111, 251, 190, 0.4)',
  },
  sealCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#002113',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
    borderWidth: 2,
    borderColor: Colors.tertiaryFixed,
  },
  sealCheckGlyph: {
    color: Colors.tertiaryFixed,
    fontSize: 26,
    fontWeight: '900',
  },
  headlineTitle: {
    ...Typography.headlineLg,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headlineSubtitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 18,
  },
  verificationPill: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
  },
  pulsingGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#005236',
  },
  verifiedText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  pillBullet: {
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  timestampText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  specSheetCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 12,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  specHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specAssetGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  chairIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chairIcon: {
    fontSize: 18,
  },
  chairNameCol: {
    flex: 1,
  },
  targetAssetLabel: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chairModelName: {
    ...Typography.titleLg,
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  ticketBadge: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  ticketBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
  },
  microStatGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  microStatCell: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
    justifyContent: 'space-between',
    minHeight: 60,
  },
  statLabel: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  customerValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  customerIcon: {
    fontSize: 13,
  },
  customerValText: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  durationValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginTop: 2,
  },
  durationHeroText: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  durationSlaText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  efficiencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(111, 251, 190, 0.25)',
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  speedometerIcon: {
    fontSize: 15,
  },
  efficiencyText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: '#005236',
    flex: 1,
    lineHeight: 16,
  },
  efficiencyBold: {
    fontWeight: '800',
  },
  auditCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 10,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  auditHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  auditTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  factCheckIcon: {
    fontSize: 16,
  },
  auditTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  verifiedCountBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  verifiedCountText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#005236',
  },
  auditItemsList: {
    gap: 8,
  },
  auditItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
  },
  auditCheckDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#002113',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  auditCheckMark: {
    color: Colors.tertiaryFixed,
    fontSize: 11,
    fontWeight: '900',
  },
  auditTextCol: {
    flex: 1,
  },
  auditItemTitle: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  auditItemSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  earningsLedgerCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 12,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  payoutTag: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  ledgerTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: 2,
  },
  ledgerAmountCol: {
    alignItems: 'flex-end',
  },
  ledgerGrandAmount: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  rangeText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  payoutBreakdownCol: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerLow,
    paddingTop: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  breakdownVal: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  payoutStatusBanner: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 4,
  },
  payoutStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amberDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F59E0B',
  },
  payoutStatusTitle: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  payoutStatusBody: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 15,
  },
  followupActionsGroup: {
    gap: 8,
    paddingTop: 4,
  },
  primaryPayoutBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  primaryPayoutBtnText: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  payoutArrow: {
    fontSize: 16,
    color: Colors.onPrimary,
    fontWeight: '800',
  },
  secondaryQueueBtn: {
    width: '100%',
    backgroundColor: Colors.surfaceContainer,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  homeIcon: {
    fontSize: 15,
  },
  secondaryQueueBtnText: {
    ...Typography.titleLg,
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
});
