import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef, useEffect } from 'react';
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

interface DisputeResolvedScreenProps {
  navigation?: any;
  route?: {
    params?: {
      disputeId?: string;
      dispute?: any;
      resolutionData?: any;
    };
  };
}

export const DisputeResolvedChaircareMobileScreen: React.FC<
  DisputeResolvedScreenProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const passedDispute = route?.params?.dispute;
  const resolutionData = route?.params?.resolutionData;

  // Animation states
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for locked and transfer status
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
  }, [scaleAnim, opacityAnim, pulseAnim]);

  // Resolution context data with fallbacks
  const disputeCode =
    resolutionData?.disputeCode || passedDispute?.code || 'DSP-20481';
  const disputeId =
    resolutionData?.disputeId || passedDispute?.id || 'dsp-20481';
  const resolutionRefId = 'RES-58192';
  const customerName = passedDispute?.customerName || 'Rahul Mehta';
  const customerLocation =
    passedDispute?.customerLocation || 'Sector 54, Gurugram';
  const customerUpi = 'rahul@okaxis';
  const technicianName = passedDispute?.technicianName || 'Rahul Sharma';
  const technicianRole = 'Master Specialist (Lvl 3)';
  const refundAmount =
    resolutionData?.refundAmount !== undefined
      ? resolutionData.refundAmount
      : 900;
  const techPayout =
    resolutionData?.techPayout !== undefined
      ? resolutionData.techPayout
      : 765;

  const resolutionClass =
    resolutionData?.option === 'full-refund'
      ? `Full Refund (₹${refundAmount.toFixed(2)})`
      : resolutionData?.option === 'release-tech'
      ? `Full Payout to Tech (₹${techPayout.toFixed(2)})`
      : resolutionData?.option === 'redispatch'
      ? 'Re-Dispatch Rectification'
      : resolutionData?.option === 'escalate'
      ? 'Escalated to Executive Panel'
      : `Partial Refund (₹${refundAmount.toFixed(2)})`;

  const handleCopyRef = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleViewRecord = () => {
    if (navigation) {
      navigation.navigate('DisputeDetailsDsp20481', {
        disputeId,
        dispute: {
          ...passedDispute,
          status: 'Resolved',
          isResolved: true,
          resolution: resolutionData,
        },
      });
    }
  };

  const handleBackToDisputes = () => {
    if (navigation) {
      navigation.navigate('Disputes');
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Bar */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToDisputes}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Dispute Resolved
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            accessibilityLabel="Context actions"
          >
            <AppIcon name="more_vert" size={20} />
          </TouchableOpacity>
          <View style={styles.headerAvatarContainer}>
            <AppIcon name="person" size={20} />
          </View>
        </View>
      </View>

      {/* Main Content ScrollView */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Status Context Ribbon */}
        <View style={styles.statusRibbon}>
          <View style={styles.statusRibbonLeft}>
            <Animated.View
              style={[styles.statusPulseDot, { opacity: pulseAnim }]}
            />
            <Text style={styles.statusRibbonText} numberOfLines={1}>
              SETTLEMENT COMMITTED • ID: {resolutionRefId}
            </Text>
          </View>
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedBadgeText}>LOCKED</Text>
          </View>
        </View>

        {/* 3. Success Hero Seal Card */}
        <Animated.View
          style={[
            styles.heroSealCard,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Ambient Precision Glow */}
          <View style={styles.ambientGlow} />

          {/* Animated Pulsing Seal */}
          <View style={styles.sealWrapper}>
            <Animated.View
              style={[styles.sealOuterHalo, { opacity: pulseAnim }]}
            />
            <View style={styles.sealCircle}>
              <AppIcon name="check_circle" size={20} />
            </View>
          </View>

          <Text style={styles.heroTitle}>Dispute Resolved Successfully</Text>
          <Text style={styles.heroSubtitle}>
            The partial refund has been initiated and the arbitration record is
            locked in the compliance ledger.
          </Text>

          {/* Prominent Settle Badge Card */}
          <View style={styles.settleBadgeCard}>
            <Text style={styles.settleBadgeLabel}>Settled Amount Credited</Text>
            <Text style={styles.settleAmountValue}>
              ₹{refundAmount.toFixed(2)}
            </Text>
            <View style={styles.gatewayClearedBadge}>
              <AppIcon name="verified_user" size={20} />
              <Text style={styles.gatewayClearedText}>
                Gateway Cleared • 100% Guaranteed
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* 4. Visual Asset Pairing: Ergonomic Service Sign-off Audit */}
        <View style={styles.inspectionBannerCard}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1580481077197-909930f3a61f?auto=format&fit=crop&w=800&q=80',
            }}
            style={styles.inspectionImage}
            resizeMode="cover"
          />
          <View style={styles.inspectionGradientOverlay}>
            <View style={styles.inspectionContentRow}>
              <View style={styles.inspectionTitleGroup}>
                <AppIcon name="handyman" size={20} />
                <Text style={styles.inspectionTitleText}>
                  Mechanic Inspection Cleared
                </Text>
              </View>
              <View style={styles.specBadge}>
                <Text style={styles.specBadgeText}>SPEC 4.2 COMPLIANT</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Resolution Execution Audit Manifest */}
        <View style={styles.manifestCard}>
          <View style={styles.manifestHeaderRow}>
            <View style={styles.manifestHeaderLeft}>
              <AppIcon name="verified" size={20} />
              <Text style={styles.manifestHeaderTitle}>Audit Manifest</Text>
            </View>
            <Text style={styles.manifestVersionTag}>AUTO-GEN V4.9</Text>
          </View>

          <View style={styles.manifestItemsList}>
            {/* Reference ID Row */}
            <View style={styles.manifestRow}>
              <Text style={styles.manifestLabel}>Resolution Ref ID</Text>
              <TouchableOpacity
                style={styles.copyRefButton}
                onPress={handleCopyRef}
                activeOpacity={0.7}
              >
                <Text style={styles.copyRefCode}>{resolutionRefId}</Text>
                <AppIcon name={isCopied ? 'check' : 'content_copy'} size={20} />
              </TouchableOpacity>
            </View>

            {/* Original Dispute ID */}
            <View style={styles.manifestRow}>
              <Text style={styles.manifestLabel}>Original Dispute ID</Text>
              <Text style={styles.manifestMonoValue}>{disputeCode}</Text>
            </View>

            {/* Customer */}
            <View style={styles.manifestRowTopAligned}>
              <Text style={styles.manifestLabel}>Customer</Text>
              <View style={styles.rightAlignedText}>
                <Text style={styles.manifestBoldValue}>{customerName}</Text>
                <Text style={styles.manifestSubValue}>{customerLocation}</Text>
              </View>
            </View>

            {/* Technician */}
            <View style={styles.manifestRowTopAligned}>
              <Text style={styles.manifestLabel}>Assigned Tech</Text>
              <View style={styles.rightAlignedText}>
                <Text style={styles.manifestBoldValue}>{technicianName}</Text>
                <Text style={styles.manifestTechTag}>{technicianRole}</Text>
              </View>
            </View>

            {/* Resolution Type */}
            <View style={styles.manifestRow}>
              <Text style={styles.manifestLabel}>Resolution Class</Text>
              <View style={styles.resolutionClassTag}>
                <Text style={styles.resolutionClassTagText}>
                  {resolutionClass}
                </Text>
              </View>
            </View>

            {/* Disbursement Route */}
            <View style={styles.manifestRowTopAligned}>
              <Text style={styles.manifestLabel}>Disbursement Route</Text>
              <View style={styles.rightAlignedText}>
                <Text style={styles.manifestBoldValue}>Instant UPI Reversal</Text>
                <Text style={styles.manifestSubValueMono}>{customerUpi}</Text>
              </View>
            </View>

            {/* Settlement State */}
            <View style={styles.manifestRowTopAligned}>
              <Text style={styles.manifestLabel}>Settlement State</Text>
              <View style={styles.rightAlignedText}>
                <View style={styles.transferInitiatedBadge}>
                  <Animated.View
                    style={[styles.transferPulseDot, { opacity: pulseAnim }]}
                  />
                  <Text style={styles.transferInitiatedText}>
                    Transfer Initiated
                  </Text>
                </View>
                <Text style={styles.ackCodeText}>Ack #984210948</Text>
              </View>
            </View>

            {/* Authorizing Admin */}
            <View style={styles.manifestRow}>
              <Text style={styles.manifestLabel}>Authorizing Signee</Text>
              <Text style={styles.manifestBoldValue}>
                Super Admin (#SA-01)
              </Text>
            </View>

            {/* Timestamp */}
            <View style={styles.manifestRow}>
              <Text style={styles.manifestLabel}>Ledger Timestamp</Text>
              <Text style={styles.manifestTimestampText}>
                05 Oct 2026 • 06:15 PM IST
              </Text>
            </View>
          </View>
        </View>

        {/* 6. Interactive Resolution Timeline */}
        <View style={styles.timelineCard}>
          <View style={styles.timelineHeaderRow}>
            <Text style={styles.timelineHeaderTitle}>Arbitration Log Chain</Text>
            <View style={styles.completedStepsBadge}>
              <Text style={styles.completedStepsBadgeText}>
                5 OF 5 COMPLETED
              </Text>
            </View>
          </View>

          <View style={styles.timelineList}>
            {/* Timeline Line Track */}
            <View style={styles.timelineVerticalLine} />

            {/* Step 1 */}
            <View style={styles.timelineStepItem}>
              <View style={styles.timelineCheckCircle}>
                <AppIcon name="check" size={20} />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineTitleRow}>
                  <Text style={styles.timelineStepTitle}>Dispute Opened</Text>
                  <Text style={styles.timelineStepTime}>
                    05 Oct, 07:15 PM
                  </Text>
                </View>
                <Text style={styles.timelineStepDesc}>
                  Hydraulic tension drift logged with diagnostic photos.
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.timelineStepItem}>
              <View style={styles.timelineCheckCircle}>
                <AppIcon name="check" size={20} />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineTitleRow}>
                  <Text style={styles.timelineStepTitle}>
                    Evidence & Photos Audited
                  </Text>
                  <Text style={styles.timelineStepTime}>Today, 10:20 AM</Text>
                </View>
                <Text style={styles.timelineStepDesc}>
                  QA Lead verified Class-4 cylinder micro-leak tolerance.
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.timelineStepItem}>
              <View style={styles.timelineCheckCircle}>
                <AppIcon name="check" size={20} />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineTitleRow}>
                  <Text style={styles.timelineStepTitle}>
                    Resolution Approved & Signed
                  </Text>
                  <Text style={styles.timelineStepTime}>Today, 06:10 PM</Text>
                </View>
                <Text style={styles.timelineStepDesc}>
                  Cryptographic token locked by compliance admin.
                </Text>
              </View>
            </View>

            {/* Step 4 */}
            <View style={styles.timelineStepItem}>
              <View style={styles.timelineCheckCircle}>
                <AppIcon name="check" size={20} />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineTitleRow}>
                  <Text style={styles.timelineStepTitle}>
                    Customer Notified
                  </Text>
                  <Text style={styles.timelineHighlightBadge}>
                    SMS & Email Sent
                  </Text>
                </View>
                <Text style={styles.timelineStepDesc}>
                  Direct refund tracer & bank reference emailed to Rahul Mehta.
                </Text>
              </View>
            </View>

            {/* Step 5 */}
            <View style={styles.timelineStepItem}>
              <View style={styles.timelineCheckCircle}>
                <AppIcon name="check" size={20} />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineTitleRow}>
                  <Text style={styles.timelineStepTitle}>
                    Technician Ledger Rebalanced
                  </Text>
                  <Text style={styles.timelineHighlightBadge}>Complete</Text>
                </View>
                <Text style={styles.timelineStepDesc}>
                  Settlement ledger updated; clawback balance offset applied.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 7. Dispatch & Payout Impact Confirmation */}
        <View style={styles.impactCard}>
          <View style={styles.impactHeaderRow}>
            <AppIcon name="sync_alt" size={20} />
            <Text style={styles.impactHeaderTitle}>
              Customer & Technician Impact
            </Text>
          </View>

          {/* Customer Impact Box */}
          <View style={styles.impactSubBox}>
            <View style={styles.impactSubHeader}>
              <Text style={styles.impactSubTitle}>Customer Account</Text>
              <View style={styles.activeTagBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeTagText}>Active</Text>
              </View>
            </View>
            <Text style={styles.impactSubDesc}>
              Rahul Mehta's account standing remains Active with full booking
              privileges and zero penalty flags.
            </Text>
          </View>

          {/* Technician Impact Box */}
          <View style={styles.impactSubBox}>
            <View style={styles.impactSubHeader}>
              <Text style={styles.impactSubTitle}>Dispatch Status</Text>
              <View style={styles.activeTagBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeTagText}>Online & Available</Text>
              </View>
            </View>
            <Text style={styles.impactSubDesc}>
              Rahul Sharma's field dispatch clearance has been fully restored.
            </Text>
            <View style={styles.techPayoutSubBar}>
              <Text style={styles.techPayoutSubLabel}>Adjusted Payout</Text>
              <Text style={styles.techPayoutSubValue}>
                ₹{techPayout.toFixed(2)} • Fri Disbursement
              </Text>
            </View>
          </View>
        </View>

        {/* 8. Bottom Action Controls */}
        <View style={styles.bottomActionsArea}>
          <TouchableOpacity
            style={styles.primaryViewRecordBtn}
            onPress={handleViewRecord}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryViewRecordBtnText}>
              View Dispute Record
            </Text>
            <AppIcon name="open_in_new" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryDoneBtn}
            onPress={handleBackToDisputes}
            activeOpacity={0.7}
          >
            <AppIcon name="arrow_back" size={20} />
            <Text style={styles.secondaryDoneBtnText}>
              Done (Back to Disputes)
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
    backgroundColor: '#f7f9fb',
  },

  /* Header */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(247, 249, 251, 0.94)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e3e5',
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    marginLeft: -8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  backIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 24,
    color: '#191c1e',
    includeFontPadding: false,
  },
  headerTitleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: '#191c1e',
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  headerIconText: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#45464d',
    includeFontPadding: false,
  },
  headerAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    ...Shadows.level1,
  },
  headerAvatarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },

  /* Content Scroll */
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },

  /* Status Context Ribbon */
  statusRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#eceef0',
    borderRadius: 12,
    ...Shadows.level1,
  },
  statusRibbonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  statusPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#009668',
  },
  statusRibbonText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    fontWeight: '500',
    color: '#45464d',
    letterSpacing: 0.5,
  },
  lockedBadge: {
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  lockedBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#002113',
    letterSpacing: 0.6,
  },

  /* Hero Seal Card */
  heroSealCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level2,
    gap: 12,
  },
  ambientGlow: {
    position: 'absolute',
    top: -48,
    alignSelf: 'center',
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(78, 222, 163, 0.25)',
  },
  sealWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sealOuterHalo: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(0, 150, 104, 0.2)',
  },
  sealCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#009668',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level3,
  },
  sealCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 44,
    color: '#ffffff',
    includeFontPadding: false,
  },
  heroTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: '#191c1e',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#45464d',
    textAlign: 'center',
    maxWidth: 290,
  },
  settleBadgeCard: {
    width: '100%',
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    ...Shadows.level1,
  },
  settleBadgeLabel: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#45464d',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  settleAmountValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.5,
  },
  gatewayClearedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  gatewayShieldIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#002113',
    includeFontPadding: false,
  },
  gatewayClearedText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#002113',
  },

  /* Inspection Banner Card */
  inspectionBannerCard: {
    width: '100%',
    height: 144,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.level1,
  },
  inspectionImage: {
    width: '100%',
    height: '100%',
  },
  inspectionGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 14,
  },
  inspectionContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inspectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  handymanIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#6ffbbe',
    includeFontPadding: false,
  },
  inspectionTitleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  specBadge: {
    backgroundColor: 'rgba(0, 150, 104, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  specBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.6,
  },

  /* Audit Manifest Card */
  manifestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  manifestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    marginHorizontal: -16,
    marginTop: -16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  manifestHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  manifestVerifiedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#0051d5',
    includeFontPadding: false,
  },
  manifestHeaderTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: '#191c1e',
  },
  manifestVersionTag: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
  },
  manifestItemsList: {
    gap: 10,
  },
  manifestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  manifestRowTopAligned: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  manifestLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  copyRefButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyRefCode: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#0051d5',
  },
  copyRefIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#45464d',
    includeFontPadding: false,
  },
  manifestMonoValue: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  rightAlignedText: {
    alignItems: 'flex-end',
  },
  manifestBoldValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  manifestSubValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464d',
  },
  manifestSubValueMono: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },
  manifestTechTag: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#0051d5',
  },
  resolutionClassTag: {
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resolutionClassTagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#191c1e',
  },
  transferInitiatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  transferPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#009668',
  },
  transferInitiatedText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#009668',
  },
  ackCodeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
    marginTop: 2,
  },
  manifestTimestampText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },

  /* Arbitration Timeline */
  timelineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineHeaderTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: '#191c1e',
  },
  completedStepsBadge: {
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  completedStepsBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#002113',
    letterSpacing: 0.5,
  },
  timelineList: {
    position: 'relative',
    paddingLeft: 28,
    gap: 16,
  },
  timelineVerticalLine: {
    position: 'absolute',
    left: 10,
    top: 8,
    bottom: 8,
    width: 2,
    backgroundColor: 'rgba(0, 150, 104, 0.3)',
  },
  timelineStepItem: {
    position: 'relative',
  },
  timelineCheckCircle: {
    position: 'absolute',
    left: -28,
    top: 1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#009668',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  timelineCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    includeFontPadding: false,
  },
  timelineContent: {
    gap: 2,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineStepTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },
  timelineStepTime: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
  },
  timelineHighlightBadge: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10,
    fontWeight: '600',
    color: '#0051d5',
  },
  timelineStepDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: '#45464d',
  },

  /* Customer & Tech Impact */
  impactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  impactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  impactHeaderIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#000000',
    includeFontPadding: false,
  },
  impactHeaderTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: '#191c1e',
  },
  impactSubBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  impactSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  impactSubTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },
  activeTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#009668',
  },
  activeTagText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    fontWeight: '600',
    color: '#002113',
  },
  impactSubDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#45464d',
  },
  techPayoutSubBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
  },
  techPayoutSubLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464d',
  },
  techPayoutSubValue: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#191c1e',
  },

  /* Bottom Actions */
  bottomActionsArea: {
    gap: 10,
    paddingTop: 4,
  },
  primaryViewRecordBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    ...Shadows.level2,
  },
  primaryViewRecordBtnText: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  openInNewIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 19,
    color: '#ffffff',
    includeFontPadding: false,
  },
  secondaryDoneBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eceef0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  backToDisputesIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 19,
    color: '#45464d',
    includeFontPadding: false,
  },
  secondaryDoneBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#191c1e',
  },
});
