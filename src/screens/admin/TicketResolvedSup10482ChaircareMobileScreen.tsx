import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef, useEffect } from 'react';
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

interface TicketResolvedScreenProps {
  navigation?: any;
  route?: {
    params?: {
      ticketId?: string;
      ticket?: any;
    };
  };
}

export const TicketResolvedSup10482ChaircareMobileScreen: React.FC<
  TicketResolvedScreenProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const passedTicket = route?.params?.ticket;

  // Selected ticket context with graceful fallback
  const ticketData = {
    id: passedTicket?.id || 'sup-10482',
    code: passedTicket?.code || 'SUP-10482',
    resId: 'RES-84920',
    customerName: passedTicket?.customerName || passedTicket?.userName || 'Rahul Mehta',
    customerTier: 'Rahul Mehta (Tier-1 Client)',
    category: 'Service Issue (Mechanical Teardown)',
    handledBy: passedTicket?.assignedTo ? `${passedTicket.assignedTo} (#ADM-8824)` : 'Priya Sharma (#ADM-8824)',
    signOffBy: 'Super Admin (#SA-01)',
    resolvedTime: '05 Oct 2026 • 05:45 PM IST',
    reservedSlot: 'Tomorrow, 06 Oct 2026 • 10:00 AM – 12:00 PM',
    assignedTech: 'Deepak Kumar (Tier-1 Specialist • Van #07)',
    checksum: 'SHA256: 8f4c...b921',
  };

  // Pulse & Scale animation for celebratory emblem
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 7,
      useNativeDriver: true,
    }).start();

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
  }, [pulseAnim, scaleAnim]);

  const handleCopyTicket = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleViewTicketRecord = () => {
    if (navigation) {
      navigation.navigate('SupportTicketDetailsSup10482', {
        ticketId: ticketData.id,
        ticket: {
          ...passedTicket,
          status: 'Closed',
          priorityLabel: 'Resolved',
        },
      });
    }
  };

  const handleDoneBackToSupport = () => {
    if (navigation) {
      navigation.navigate('Support');
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* Scrollable Content Canvas */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 20) + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Subtle Top Ambient Glow Ribbon */}
        <View style={styles.ambientTopRibbon}>
          <View style={styles.ambientLeft}>
            <AppIcon name="verified" size={20} />
            <Text style={styles.ambientRibbonText} numberOfLines={1}>
              SUPPORT CASE RESOLVED • AUDIT COMMITTED
            </Text>
          </View>
          <View style={styles.resIdBadge}>
            <Text style={styles.resIdText}>{ticketData.resId}</Text>
          </View>
        </View>

        {/* 2. Celebratory Status Hero with Micro Aura */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconWrapper}>
            {/* Outer Pulsing Aura */}
            <Animated.View
              style={[
                styles.heroOuterAura,
                { opacity: pulseAnim, transform: [{ scale: scaleAnim }] },
              ]}
            />
            {/* Center Emblem */}
            <View style={styles.heroCenterEmblem}>
              <AppIcon name="check_circle" size={20} />
            </View>
          </View>

          <Text style={styles.heroTitle}>Ticket Resolved Successfully</Text>
          <Text style={styles.heroSubtitle}>
            The support request has been locked, committed, and permanently recorded
            in the immutable audit trail.
          </Text>
        </View>

        {/* 3. Resolution Outcome Highlight Card */}
        <View style={styles.outcomeHighlightCard}>
          <View style={styles.outcomeAccentBar} />

          <View style={styles.outcomeTopRow}>
            <View style={styles.outcomeLabelGroup}>
              <AppIcon name="task_alt" size={20} />
              <Text style={styles.outcomeLabelText}>
                COMMITTED RESOLUTION OUTCOME
              </Text>
            </View>
            <View style={styles.automatedLockBadge}>
              <Text style={styles.automatedLockText}>Automated Lock</Text>
            </View>
          </View>

          <Text style={styles.outcomeMainHeading}>
            Service Rescheduled • Free Priority Re-Dispatch
          </Text>

          {/* Scheduled Specs Grid */}
          <View style={styles.specsGridCard}>
            <View style={styles.specItemRow}>
              <AppIcon name="calendar_clock" size={20} />
              <View style={styles.specTextCol}>
                <Text style={styles.specLabel}>RESERVED SLOT</Text>
                <Text style={styles.specValue} numberOfLines={1}>
                  {ticketData.reservedSlot}
                </Text>
              </View>
            </View>

            <View style={[styles.specItemRow, styles.specItemBorder]}>
              <AppIcon name="engineering" size={20} />
              <View style={styles.specTextCol}>
                <Text style={styles.specLabel}>ASSIGNED MASTER TECH</Text>
                <Text style={styles.specValue} numberOfLines={1}>
                  {ticketData.assignedTech}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4. Comprehensive Execution Manifest Card */}
        <View style={styles.manifestCard}>
          <View style={styles.manifestHead}>
            <View style={styles.manifestTitleLeft}>
              <AppIcon name="receipt_long" size={20} />
              <Text style={styles.manifestHeading}>Execution Manifest</Text>
            </View>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={handleCopyTicket}
              activeOpacity={0.7}
            >
              <AppIcon name="content_copy" size={20} />
              <Text
                style={[
                  styles.copyLabelText,
                  isCopied && styles.copyLabelTextSuccess,
                ]}
              >
                {isCopied ? 'COPIED!' : ticketData.code}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.manifestRowsContainer}>
            <View style={[styles.manifestRow, styles.manifestRowAlt]}>
              <Text style={styles.manifestRowLabel}>Customer</Text>
              <Text style={styles.manifestRowValue}>{ticketData.customerTier}</Text>
            </View>

            <View style={styles.manifestRow}>
              <Text style={styles.manifestRowLabel}>Category</Text>
              <Text style={styles.manifestRowValue}>{ticketData.category}</Text>
            </View>

            <View style={[styles.manifestRow, styles.manifestRowAlt]}>
              <Text style={styles.manifestRowLabel}>Handled By</Text>
              <Text style={styles.manifestRowValue}>{ticketData.handledBy}</Text>
            </View>

            <View style={styles.manifestRow}>
              <Text style={styles.manifestRowLabel}>Authorized Sign-off</Text>
              <Text style={styles.manifestRowValue}>{ticketData.signOffBy}</Text>
            </View>

            <View style={[styles.manifestRow, styles.manifestRowAlt]}>
              <Text style={styles.manifestRowLabel}>Resolved Timestamp</Text>
              <Text style={styles.manifestRowValueMono}>
                {ticketData.resolvedTime}
              </Text>
            </View>

            <View style={styles.manifestRow}>
              <Text style={styles.manifestRowLabel}>Lifecycle Status</Text>
              <View style={styles.lifecyclePill}>
                <View style={styles.lifecycleDot} />
                <Text style={styles.lifecycleText}>Resolved &amp; Closed</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Formal Resolution Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHead}>
            <AppIcon name="contract" size={20} />
            <Text style={styles.summaryHeading}>
              Resolution Summary &amp; Customer Agreement
            </Text>
          </View>

          <View style={styles.summaryQuoteBox}>
            <Text style={styles.summaryQuoteText}>
              “Customer was contacted via direct support chat and phone. A new
              technician visit was scheduled for 6 Oct 2026 with a certified
              Tier-1 mechanic carrying Class-4 gas cylinder extraction tooling.
              Escrow hold maintained until customer sign-off.”
            </Text>
          </View>

          <View style={styles.checksumRow}>
            <Text style={styles.checksumLabel}>Cryptographic Checksum:</Text>
            <Text style={styles.checksumValue}>{ticketData.checksum}</Text>
          </View>
        </View>

        {/* 6. 5-Step Completed Case Timeline */}
        <View style={styles.timelineCard}>
          <View style={styles.timelineHead}>
            <View style={styles.timelineTitleLeft}>
              <AppIcon name="timeline" size={20} />
              <Text style={styles.timelineHeading}>Case Audit Timeline</Text>
            </View>
            <View style={styles.completeBadge}>
              <Text style={styles.completeBadgeText}>5 of 5 Complete</Text>
            </View>
          </View>

          <View style={styles.timelineList}>
            {/* Vertical connecting line */}
            <View style={styles.timelineVerticalTrack} />

            {/* Step 1 */}
            <View style={styles.timelineStep}>
              <View style={styles.stepCheckCircle}>
                <Text style={styles.stepCheckmark}>check</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <View style={styles.stepHeaderLine}>
                  <Text style={styles.stepTitle}>Ticket Created</Text>
                  <Text style={styles.stepTime}>05:20 PM</Text>
                </View>
                <Text style={styles.stepDescription}>
                  Customer initiated priority support payload
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.timelineStep}>
              <View style={styles.stepCheckCircle}>
                <Text style={styles.stepCheckmark}>check</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <View style={styles.stepHeaderLine}>
                  <Text style={styles.stepTitle}>Admin Assigned</Text>
                  <Text style={styles.stepTime}>05:25 PM</Text>
                </View>
                <Text style={styles.stepDescription}>
                  Claimed by Priya Sharma (#ADM-8824)
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.timelineStep}>
              <View style={styles.stepCheckCircle}>
                <Text style={styles.stepCheckmark}>check</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <View style={styles.stepHeaderLine}>
                  <Text style={styles.stepTitle}>Customer Contacted</Text>
                  <Text style={styles.stepTime}>05:30 PM</Text>
                </View>
                <Text style={styles.stepDescription}>
                  Interactive phone &amp; secure chat consultation held
                </Text>
              </View>
            </View>

            {/* Step 4 */}
            <View style={styles.timelineStep}>
              <View style={styles.stepCheckCircle}>
                <Text style={styles.stepCheckmark}>check</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <View style={styles.stepHeaderLine}>
                  <Text style={styles.stepTitle}>Resolution Provided</Text>
                  <Text style={styles.stepTime}>05:42 PM</Text>
                </View>
                <Text style={styles.stepDescription}>
                  Complimentary re-dispatch &amp; mechanic routed
                </Text>
              </View>
            </View>

            {/* Step 5 */}
            <View style={styles.timelineStep}>
              <View style={styles.stepCheckCircle}>
                <Text style={styles.stepCheckmark}>check</Text>
              </View>
              <View style={styles.stepTextContainer}>
                <View style={styles.stepHeaderLine}>
                  <Text style={styles.stepTitle}>Ticket Closed &amp; Archived</Text>
                  <Text style={styles.stepTime}>05:45 PM</Text>
                </View>
                <Text style={styles.stepDescription}>
                  Super Admin cryptographic sign-off applied
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 7. Customer Notification Confirmation Banner */}
        <View style={styles.notificationBanner}>
          <View style={styles.notifIconContainer}>
            <AppIcon name="mark_email_read" size={20} />
          </View>
          <View style={styles.notifTextCol}>
            <Text style={styles.notifHeading}>
              Customer Notified via SMS &amp; In-App Notice
            </Text>
            <Text style={styles.notifSubtext}>
              {ticketData.customerName} has received confirmation for tomorrow at
              10:00 AM. Live telemetry tracking activates 30 minutes prior to
              technician arrival.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 8. Action CTAs Sticky Bottom Deck */}
      <View
        style={[
          styles.bottomActionDeck,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <TouchableOpacity
          style={styles.primaryViewRecordBtn}
          onPress={handleViewTicketRecord}
          activeOpacity={0.85}
        >
          <AppIcon name="assignment_turned_in" size={20} />
          <Text style={styles.primaryViewBtnText}>View Ticket Record</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryDoneBtn}
          onPress={handleDoneBackToSupport}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryDoneBtnText}>
            Done (Back to Support Center)
          </Text>
        </TouchableOpacity>
      </View>
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
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },

  /* 1. Subtle Top Ambient Glow Ribbon */
  ambientTopRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#002113',
    ...Shadows.level1,
  },
  ambientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  ambientVerifiedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#6ffbbe',
    includeFontPadding: false,
  },
  ambientRibbonText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#6ffbbe',
    fontWeight: '700',
    flex: 1,
  },
  resIdBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  resIdText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10.5,
    color: '#009668',
  },

  /* 2. Celebratory Status Hero */
  heroSection: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  heroIconWrapper: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroOuterAura: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(78, 222, 163, 0.25)',
  },
  heroCenterEmblem: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6ffbbe',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  heroCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 32,
    color: '#002113',
    includeFontPadding: false,
  },
  heroTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: '#191c1e',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginTop: 4,
  },
  heroSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#45464d',
    textAlign: 'center',
    maxWidth: 290,
  },

  /* 3. Resolution Outcome Highlight Card */
  outcomeHighlightCard: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
    gap: 8,
    ...Shadows.level1,
  },
  outcomeAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: '#4edea3',
  },
  outcomeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 4,
  },
  outcomeLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  taskAltIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#009668',
    includeFontPadding: false,
  },
  outcomeLabelText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10.5,
    letterSpacing: 0.6,
    color: '#009668',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  automatedLockBadge: {
    backgroundColor: '#e0e3e5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  automatedLockText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10.5,
    color: '#45464d',
  },
  outcomeMainHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: '#191c1e',
    paddingLeft: 4,
  },
  specsGridCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginLeft: 4,
    ...Shadows.level1,
  },
  specItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specItemBorder: {
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eceef0',
  },
  specIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
  },
  specTextCol: {
    flex: 1,
    gap: 1,
  },
  specLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#76777d',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  specValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12.5,
    fontWeight: '600',
    color: '#191c1e',
  },

  /* 4. Comprehensive Execution Manifest Card */
  manifestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    ...Shadows.level1,
  },
  manifestHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  manifestTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
    includeFontPadding: false,
  },
  manifestHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f2f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  copyIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    color: '#0051d5',
    includeFontPadding: false,
  },
  copyLabelText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#0051d5',
  },
  copyLabelTextSuccess: {
    color: '#009668',
  },
  manifestRowsContainer: {
    gap: 2,
  },
  manifestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  manifestRowAlt: {
    backgroundColor: '#f7f9fb',
  },
  manifestRowLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  manifestRowValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  manifestRowValueMono: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#191c1e',
  },
  lifecyclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  lifecycleDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#002113',
  },
  lifecycleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#002113',
  },

  /* 5. Formal Resolution Summary Card */
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    ...Shadows.level1,
  },
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contractIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 17,
    color: '#45464d',
    includeFontPadding: false,
  },
  summaryHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#191c1e',
    flex: 1,
  },
  summaryQuoteBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    padding: 10,
  },
  summaryQuoteText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#45464d',
    fontStyle: 'italic',
  },
  checksumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  checksumLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#76777d',
  },
  checksumValue: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#191c1e',
  },

  /* 6. 5-Step Completed Case Timeline */
  timelineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    ...Shadows.level1,
  },
  timelineHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timelineIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
  },
  timelineHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14.5,
    fontWeight: '700',
    color: '#191c1e',
  },
  completeBadge: {
    backgroundColor: 'rgba(111, 251, 190, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  completeBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10.5,
    fontWeight: '700',
    color: '#009668',
  },
  timelineList: {
    position: 'relative',
    paddingLeft: 24,
    gap: 14,
  },
  timelineVerticalTrack: {
    position: 'absolute',
    left: 8,
    top: 6,
    bottom: 12,
    width: 2,
    backgroundColor: '#6ffbbe',
  },
  timelineStep: {
    position: 'relative',
    gap: 2,
  },
  stepCheckCircle: {
    position: 'absolute',
    left: -24,
    top: 1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6ffbbe',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  stepCheckmark: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 12,
    fontWeight: '700',
    color: '#002113',
    includeFontPadding: false,
  },
  stepTextContainer: {
    gap: 1,
  },
  stepHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12.5,
    fontWeight: '600',
    color: '#191c1e',
  },
  stepTime: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10.5,
    color: '#76777d',
  },
  stepDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#45464d',
  },

  /* 7. Customer Notification Confirmation Banner */
  notificationBanner: {
    backgroundColor: 'rgba(219, 225, 255, 0.35)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    ...Shadows.level1,
  },
  notifIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0051d5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notifEmailIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ffffff',
    includeFontPadding: false,
  },
  notifTextCol: {
    flex: 1,
    gap: 3,
  },
  notifHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13.5,
    fontWeight: '700',
    color: '#00174b',
    lineHeight: 18,
  },
  notifSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#003ea8',
  },

  /* 8. Action CTAs Sticky Bottom Deck */
  bottomActionDeck: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e3e5',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
    ...Shadows.level2,
    zIndex: 20,
  },
  primaryViewRecordBtn: {
    width: '100%',
    height: 46,
    backgroundColor: '#131b2e',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  primaryViewIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 19,
    color: '#bec6e0',
    includeFontPadding: false,
  },
  primaryViewBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13.5,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryDoneBtn: {
    width: '100%',
    height: 42,
    backgroundColor: '#e6e8ea',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryDoneBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },
});
