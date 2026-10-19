import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface AssignmentSuccessProps {
  navigation?: any;
  route?: {
    params?: {
      requestId?: string;
      requestItem?: any;
      assignedTechnician?: any;
    };
  };
}

export const AssignmentSuccessChaircareMobileScreen: React.FC<AssignmentSuccessProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();

  const passedItem = route?.params?.requestItem;
  const passedId = route?.params?.requestId;
  const passedTech = route?.params?.assignedTechnician;

  // Selected request details with fallback to canonical CC-10483
  const trackingCode =
    passedItem?.trackingCode || (passedId ? `CC-${passedId.replace('req-', '')}` : 'CC-10483');
  const serviceTitle = passedItem?.serviceTitle || 'Hydraulic Swap';
  const customerName = passedItem?.customerName || 'Priya Sharma';
  const locationText =
    passedItem?.locationText || 'DLF Phase 2, Cyber Hub Corridor, Gurugram';
  const scheduleText = passedItem?.scheduleText || 'Today • 4:00 PM';

  // Selected technician details with fallback to Rahul Sharma
  const techName = passedTech?.name || 'Rahul Sharma';
  const techRating = passedTech?.rating || 4.9;
  const techAvatarUrl =
    passedTech?.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop';

  // Live countdown timer state (starts at 4 mins 52 secs)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(292);

  // Subtle native entrance animation for success badge
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs} remaining`;
  };

  const handleViewServiceRequest = () => {
    if (navigation) {
      navigation.navigate('ServiceRequestDetails', {
        requestId: passedId || 'req-10483',
        requestItem: {
          ...passedItem,
          id: passedId || 'req-10483',
          trackingCode,
          serviceTitle,
          customerName,
          locationText,
          status: 'assigned',
          statusLabel: 'Assigned',
          techName,
          techRating,
        },
      });
    }
  };

  const handleBackToAllRequests = () => {
    if (navigation) {
      navigation.navigate('ServiceRequests');
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Bar */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <View style={styles.livePingDot} />
          <Text style={styles.headerCorridorTag}>OPS-DISPATCH // {trackingCode}</Text>
        </View>

        <TouchableOpacity
          style={styles.closeDismissBtn}
          onPress={handleBackToAllRequests}
          activeOpacity={0.7}
        >
          <AppIcon name="X" size={18} />
        </TouchableOpacity>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 30, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Hero Confirmation Section with Animation */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.heroSuccessBadgeWrapper}>
            <View style={styles.heroPulseOuterRing} />
            <View style={styles.heroPulseGlow} />
            <View style={styles.heroMainCircle}>
              <AppIcon name="Check" size={28} />
            </View>
          </View>

          <View style={styles.protocolBadgePill}>
            <Text style={styles.protocolBadgeText}>DISPATCH PROTOCOL CONFIRMED</Text>
          </View>

          <Text style={styles.heroHeadline}>Technician Assigned!</Text>
          <Text style={styles.heroSubText}>
            <Text style={styles.boldWhiteHighlight}>{techName}</Text> has been successfully dispatched to
            service ticket <Text style={styles.boldTrackingCode}>#{trackingCode}</Text>. Both
            customer and technician have been alerted in real-time.
          </Text>
        </Animated.View>

        {/* 3. Dispatch Telemetry & Acceptance Countdown Card */}
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryTopRow}>
            <View style={styles.telemetryStatusLeft}>
              <View style={styles.beaconPingWrapper}>
                <View style={styles.beaconPingDot} />
              </View>
              <Text style={styles.telemetryStatusText}>Dispatched • Awaiting Acceptance</Text>
            </View>
            <View style={styles.countdownTimerPill}>
              <Text style={styles.countdownTimerText}>{formatTimer(secondsRemaining)}</Text>
            </View>
          </View>

          <View style={styles.socketBridgeBox}>
            <AppIcon name="Radio" size={18} />
            <View style={styles.socketTextCol}>
              <Text style={styles.socketTitleText}>Encrypted socket bridge initialized</Text>
              <Text style={styles.socketSubText}>
                Telemetry channel 09: GPS corridor locked • SLA ping latency 18ms
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Ticket Registry Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <AppIcon name="Award" size={18} />
              <Text style={styles.cardEyebrow}>TICKET REGISTRY</Text>
            </View>
            <View style={styles.ticketRegistryPill}>
              <Text style={styles.ticketRegistryText}>#{trackingCode}</Text>
            </View>
          </View>

          {/* Assigned Field Specialist Row */}
          <View style={styles.specialistRowBox}>
            <Image
              source={{ uri: techAvatarUrl }}
              style={styles.specialistAvatarImg}
              resizeMode="cover"
            />
            <View style={styles.specialistMetaCol}>
              <View style={styles.specialistNameRow}>
                <Text style={styles.specialistNameBold}>{techName}</Text>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.specialistSubRow}>
                <Text style={styles.specialistRank}>Master Tech</Text>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.specialistRatingMono}>{techRating} ★ (184 jobs)</Text>
              </View>
            </View>
          </View>

          {/* 2-Column Info Grid */}
          <View style={styles.gridTwoCol}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>SERVICE TYPE</Text>
              <View style={styles.gridValueRow}>
                <AppIcon name="Wrench" size={18} />
                <Text style={styles.gridValueBold} numberOfLines={1}>
                  {serviceTitle}
                </Text>
              </View>
            </View>

            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>SCHEDULED SLOT</Text>
              <View style={styles.gridValueRow}>
                <AppIcon name="Clock" size={18} />
                <Text style={styles.gridValueBold} numberOfLines={1}>
                  {scheduleText}
                </Text>
              </View>
            </View>
          </View>

          {/* Client & Destination Box */}
          <View style={styles.detailListBox}>
            <View style={styles.destinationItem}>
              <AppIcon name="MapPin" size={18} />
              <View style={styles.destinationTextCol}>
                <Text style={styles.destinationLabel}>CLIENT & DESTINATION</Text>
                <Text style={styles.destinationCustomerBold}>{customerName}</Text>
                <Text style={styles.destinationAddressText} numberOfLines={1}>
                  {locationText}
                </Text>
              </View>
            </View>

            {/* Payout & Escrow */}
            <View style={styles.payoutItem}>
              <View style={styles.payoutLeft}>
                <AppIcon name="CreditCard" size={18} />
                <Text style={styles.payoutLabel}>GUARANTEED PAYOUT</Text>
              </View>
              <View style={styles.payoutRight}>
                <Text style={styles.payoutAmountText}>₹499 – ₹799</Text>
                <Text style={styles.escrowSecuredTag}>Direct Escrow Secured</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Dispatch Sequence Telemetry (Live Audit Trail) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLeft}>
            <AppIcon name="TrendingUp" size={18} />
            <Text style={styles.cardEyebrow}>DISPATCH SEQUENCE TELEMETRY</Text>
          </View>

          <View style={styles.timelineSpineBox}>
            <View style={styles.timelineSpineLine} />

            {/* Step 1 */}
            <View style={styles.timelineStepRow}>
              <View style={[styles.timelineNode, styles.nodeComplete]}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.timelineContentCol}>
                <Text style={styles.timelineStepTitle}>Admin Manual Override Executed</Text>
                <Text style={styles.timelineStepSub}>
                  Root authorization token accepted • 15:42:10 IST
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.timelineStepRow}>
              <View style={[styles.timelineNode, styles.nodeComplete]}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.timelineContentCol}>
                <Text style={styles.timelineStepTitle}>Priority Push Sent to {techName}'s Terminal</Text>
                <Text style={styles.timelineStepSub}>
                  FCM packet delivered (Device ID #FD-9204)
                </Text>
              </View>
            </View>

            {/* Step 3 (Active) */}
            <View style={styles.timelineStepRow}>
              <View style={[styles.timelineNode, styles.nodeActive]}>
                <View style={styles.nodeActiveDot} />
              </View>
              <View style={styles.timelineContentCol}>
                <Text style={styles.timelineStepTitleActive}>
                  Awaiting Technician Acknowledgment
                </Text>
                <Text style={styles.timelineStepSub}>
                  Auto-escalation timer active (Threshold: 5 mins)
                </Text>
              </View>
            </View>

            {/* Step 4 (Standby) */}
            <View style={[styles.timelineStepRow, styles.stepPending]}>
              <View style={[styles.timelineNode, styles.nodePending]}>
                <View style={styles.nodePendingDot} />
              </View>
              <View style={styles.timelineContentCol}>
                <Text style={styles.timelineStepTitlePending}>
                  GPS En-Route Tracking Activation
                </Text>
                <Text style={styles.timelineStepSub}>Standby for live telemetry stream</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 6. Action Controls */}
        <View style={styles.actionControlsStack}>
          <TouchableOpacity
            style={styles.viewServiceRequestBtn}
            onPress={handleViewServiceRequest}
            activeOpacity={0.88}
          >
            <Text style={styles.viewServiceRequestBtnText}>View Service Request</Text>
            <Text style={styles.viewServiceRequestArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backAllRequestsBtn}
            onPress={handleBackToAllRequests}
            activeOpacity={0.75}
          >
            <Text style={styles.backAllRequestsBtnText}>Back to All Requests</Text>
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: 10,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        zIndex: 50,
      },
    }),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4edea3',
  },
  headerCorridorTag: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  closeDismissBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 8,
    gap: 12,
  },
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: 10,
  },
  heroSuccessBadgeWrapper: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  heroPulseOuterRing: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
  },
  heroPulseGlow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(78, 222, 163, 0.3)',
  },
  heroMainCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#002113',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  heroCheckIcon: {
    fontSize: 32,
    fontWeight: '900',
    color: '#6ffbbe',
  },
  protocolBadgePill: {
    backgroundColor: 'rgba(111, 251, 190, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: 8,
  },
  protocolBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#005236',
    letterSpacing: 0.8,
  },
  heroHeadline: {
    ...Typography.headlineSm,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  heroSubText: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 18,
  },
  boldWhiteHighlight: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  boldTrackingCode: {
    ...Typography.labelMono,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  telemetryCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    padding: 14,
    ...Shadows.level1,
  },
  telemetryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  telemetryStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  beaconPingWrapper: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaconPingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#009668',
  },
  telemetryStatusText: {
    ...Typography.labelMd,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  countdownTimerPill: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  countdownTimerText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  socketBridgeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.lg,
    padding: 10,
  },
  sensorIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  socketTextCol: {
    flex: 1,
  },
  socketTitleText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  socketSubText: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    ...Shadows.level1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeIcon: {
    fontSize: 14,
  },
  timelineIcon: {
    fontSize: 14,
  },
  cardEyebrow: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  ticketRegistryPill: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  ticketRegistryText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  specialistRowBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
    marginBottom: 10,
  },
  specialistAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  specialistMetaCol: {
    flex: 1,
  },
  specialistNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specialistNameBold: {
    ...Typography.titleLg,
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  verifiedCheckIcon: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.secondaryCobalt,
  },
  specialistSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  specialistRank: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
  },
  dotSeparator: {
    fontSize: 9,
    color: Colors.outline,
  },
  specialistRatingMono: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  gridTwoCol: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  gridCell: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
  },
  gridLabel: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  gridValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wrenchIcon: {
    fontSize: 13,
  },
  clockIcon: {
    fontSize: 13,
  },
  gridValueBold: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
    flex: 1,
  },
  detailListBox: {
    gap: 8,
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
  },
  locationPinIcon: {
    fontSize: 15,
    marginTop: 1,
  },
  destinationTextCol: {
    flex: 1,
  },
  destinationLabel: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  destinationCustomerBold: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: 1,
  },
  destinationAddressText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  payoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
  },
  payoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletIcon: {
    fontSize: 14,
  },
  payoutLabel: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  payoutRight: {
    alignItems: 'flex-end',
  },
  payoutAmountText: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  escrowSecuredTag: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '600',
    color: '#009668',
  },
  timelineSpineBox: {
    marginTop: 12,
    position: 'relative',
    paddingLeft: 22,
    gap: 14,
  },
  timelineSpineLine: {
    position: 'absolute',
    left: 9,
    top: 6,
    bottom: 8,
    width: 2,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  timelineStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  stepPending: {
    opacity: 0.6,
  },
  timelineNode: {
    position: 'absolute',
    left: -22,
    top: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeComplete: {
    backgroundColor: '#002113',
  },
  nodeCheckText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#6ffbbe',
  },
  nodeActive: {
    backgroundColor: Colors.secondaryCobalt,
  },
  nodeActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  nodePending: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  nodePendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.outline,
  },
  timelineContentCol: {
    flex: 1,
  },
  timelineStepTitle: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  timelineStepTitleActive: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  timelineStepTitlePending: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    color: Colors.onSurface,
  },
  timelineStepSub: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  actionControlsStack: {
    gap: 8,
    marginTop: 4,
  },
  viewServiceRequestBtn: {
    height: 50,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  viewServiceRequestBtnText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  viewServiceRequestArrow: {
    fontSize: 18,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  backAllRequestsBtn: {
    height: 46,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backAllRequestsBtnText: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
});
