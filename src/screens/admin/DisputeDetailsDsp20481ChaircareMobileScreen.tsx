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

interface DisputeDetailsScreenProps {
  navigation?: any;
  route?: {
    params?: {
      disputeId?: string;
      dispute?: any;
    };
  };
}

export const DisputeDetailsDsp20481ChaircareMobileScreen: React.FC<
  DisputeDetailsScreenProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const passedDispute = route?.params?.dispute;

  // Pulse animation for case file notification
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
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
  }, [pulseAnim]);

  // Dispute data with passed context fallback to DSP-20481 reference data
  const disputeData = {
    id: passedDispute?.id || 'dsp-20481',
    code: passedDispute?.code || 'DSP-20481',
    priority: passedDispute?.priority || 'high',
    priorityLabel: passedDispute?.priorityLabel || 'High Priority',
    status: passedDispute?.status || 'Under Review',
    headline:
      passedDispute?.quoteSummary || 'Customer Contests Incomplete Repair & Surcharge',
    serviceTitle:
      passedDispute?.serviceTitle || 'Office Chair Repair',
    serviceCode: passedDispute?.serviceCode || '#CC-10482',
    amountFormatted: passedDispute?.amountFormatted || '₹1,850.00',
    escrowStatus: passedDispute?.escrowStatusText || (passedDispute?.isResolved ? 'Settled' : 'Frozen'),
    gatewayName: 'Razorpay PG',
    gatewayTxn: 'Txn #RZP-90214',
    customerName: passedDispute?.customerName || 'Rahul Mehta',
    customerLocation: passedDispute?.customerLocation || 'Gurugram Sector 54',
    customerTier: 'Tier-1 Client',
    customerPhone: '+91 98201 44810',
    technicianName: passedDispute?.technicianName || 'Rahul Sharma',
    technicianRole: 'Master Specialist',
    technicianFleet: 'Van Fleet #04 • Rapid Response',
    technicianPhone: '+91 98765 43210',
    statement: passedDispute?.quoteSummary
      ? `“${passedDispute.quoteSummary}”`
      : '“The technician replaced the cylinder bushing but the chair continues to sink under weight. Furthermore, an extra ₹100 was billed for tension tuning that was never demonstrated or calibrated properly.”',
    submissionDate: passedDispute?.timestamp || '05 Oct 2026, 07:15 PM',
    premises: passedDispute?.customerLocation ? `${passedDispute.customerLocation}, DLF NCR` : 'Flat 402, Palm Springs, Sec 54',
    workWindow: '05 Oct 2026, 03:00 PM – 05:00 PM',
    serviceModel: passedDispute?.serviceTitle || 'Herman Miller Aeron Overhaul',
  };

  const handleCopyCode = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleStartResolution = () => {
    if (navigation) {
      navigation.navigate('DisputeResolution', {
        disputeId: disputeData.id,
        dispute: disputeData,
      });
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
            onPress={() => {
              if (navigation?.canGoBack()) {
                navigation.goBack();
              } else {
                navigation?.navigate('Disputes');
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Dispute Details
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
          { paddingBottom: Math.max(insets.bottom, 20) + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Case Meta Notification Pill */}
        <View style={styles.caseMetaPill}>
          <View style={styles.caseMetaLeft}>
            <Animated.View
              style={[styles.caseMetaRedDot, { opacity: pulseAnim }]}
            />
            <Text style={styles.caseMetaCode}>
              CASE FILE: {disputeData.code}
            </Text>
          </View>
          <Text style={styles.caseMetaAssignee}>Assigned to Super Admin</Text>
        </View>

        {/* 2. Status Hero Card */}
        <View style={styles.statusHeroCard}>
          <View style={styles.heroAccentBar} />

          {/* Top Code & Badges */}
          <View style={styles.heroTopRow}>
            <View style={styles.heroCodeGroup}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>{disputeData.code}</Text>
              </View>
              <TouchableOpacity
                onPress={handleCopyCode}
                activeOpacity={0.7}
                accessibilityLabel="Copy Dispute ID"
              >
                <AppIcon name="content_copy" size={20} />
              </TouchableOpacity>
              {isCopied && (
                <View style={styles.copiedPill}>
                  <Text style={styles.copiedText}>Copied!</Text>
                </View>
              )}
            </View>

            <View style={styles.heroBadgesGroup}>
              <View style={styles.highPriorityPill}>
                <Text style={styles.highPriorityPillText}>
                  {disputeData.priorityLabel}
                </Text>
              </View>
              <View style={styles.underReviewPill}>
                <View style={styles.underReviewDot} />
                <Text style={styles.underReviewPillText}>
                  {disputeData.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Headline & Subtitle */}
          <View style={styles.heroHeadlineSection}>
            <Text style={styles.heroHeadlineText}>{disputeData.headline}</Text>
            <View style={styles.heroServiceSubRow}>
              <AppIcon name="handyman" size={20} />
              <Text style={styles.heroServiceText}>
                {disputeData.serviceCode} • {disputeData.serviceTitle}
              </Text>
            </View>
          </View>

          {/* Escrow Ledger Box */}
          <View style={styles.escrowLedgerBox}>
            <View style={styles.escrowLeftCol}>
              <Text style={styles.escrowLabel}>DISPUTED ESCROW</Text>
              <View style={styles.escrowAmountRow}>
                <Text style={styles.escrowAmountText}>
                  {disputeData.amountFormatted}
                </Text>
                <View style={styles.escrowFrozenGroup}>
                  <AppIcon name="lock" size={20} />
                  <Text style={styles.frozenText}>
                    {disputeData.escrowStatus}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.escrowRightCol}>
              <Text style={styles.gatewayLabel}>{disputeData.gatewayName}</Text>
              <Text style={styles.gatewayTxnText}>
                {disputeData.gatewayTxn}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Dispute Participants Section */}
        <View style={styles.participantsSectionHeader}>
          <View style={styles.participantsTitleLeft}>
            <AppIcon name="groups" size={20} />
            <Text style={styles.participantsHeading}>Involved Parties</Text>
          </View>
          <Text style={styles.participantsMetaCount}>
            2 Verified Stakeholders
          </Text>
        </View>

        {/* Participant A: Customer Card */}
        <View style={styles.participantCard}>
          <View style={styles.participantTopRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>RM</Text>
            </View>
            <View style={styles.participantInfoCol}>
              <View style={styles.participantNameRow}>
                <Text style={styles.participantName}>
                  {disputeData.customerName}
                </Text>
                <View style={styles.tierPill}>
                  <Text style={styles.tierText}>{disputeData.customerTier}</Text>
                </View>
              </View>
              <View style={styles.locationRow}>
                <AppIcon name="location_on" size={20} />
                <Text style={styles.locationText}>
                  {disputeData.customerLocation}
                </Text>
              </View>
            </View>
          </View>

          {/* Customer Trust Scoreboard */}
          <View style={styles.scoreboardGrid}>
            <View style={styles.scoreboardCol}>
              <Text style={styles.scoreboardValue}>14</Text>
              <Text style={styles.scoreboardLabel}>Completed</Text>
            </View>
            <View style={styles.scoreboardCol}>
              <View style={styles.starValueRow}>
                <AppIcon name="star" size={20} />
                <Text style={styles.scoreboardValueBlue}>4.9</Text>
              </View>
              <Text style={styles.scoreboardLabel}>Avg Rating</Text>
            </View>
            <View style={styles.scoreboardCol}>
              <Text style={styles.scoreboardValueGreen}>0</Text>
              <Text style={styles.scoreboardLabel}>Prior Disputes</Text>
            </View>
          </View>

          {/* Contact Drawer */}
          <View style={styles.contactDrawerRow}>
            <TouchableOpacity style={styles.contactDrawerBtn} activeOpacity={0.7}>
              <AppIcon name="call" size={20} />
              <Text style={styles.drawerBtnText}>Call Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactDrawerBtn}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('SupportConversation', {
                    ticketId: 'sup-10482',
                  });
                }
              }}
              activeOpacity={0.7}
            >
              <AppIcon name="chat" size={20} />
              <Text style={styles.drawerBtnText}>Chat Logs</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Participant B: Technician Card */}
        <View style={styles.participantCard}>
          <View style={styles.participantTopRow}>
            <View style={styles.techAvatarWrapper}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                }}
                style={styles.techAvatarImg}
              />
              <View style={styles.techVerifiedBadge}>
                <AppIcon name="check" size={20} />
              </View>
            </View>

            <View style={styles.participantInfoCol}>
              <View style={styles.participantNameRow}>
                <Text style={styles.participantName}>
                  {disputeData.technicianName}
                </Text>
                <View style={styles.masterPill}>
                  <Text style={styles.masterPillText}>
                    {disputeData.technicianRole}
                  </Text>
                </View>
              </View>
              <View style={styles.locationRow}>
                <AppIcon name="local_shipping" size={20} />
                <Text style={styles.locationText}>
                  {disputeData.technicianFleet}
                </Text>
              </View>
            </View>
          </View>

          {/* Technician Fleet Scoreboard */}
          <View style={styles.scoreboardGrid}>
            <View style={styles.scoreboardCol}>
              <Text style={styles.scoreboardValue}>320</Text>
              <Text style={styles.scoreboardLabel}>Jobs Done</Text>
            </View>
            <View style={styles.scoreboardCol}>
              <View style={styles.starValueRow}>
                <AppIcon name="verified" size={20} />
                <Text style={styles.scoreboardValueBlue}>4.9</Text>
              </View>
              <Text style={styles.scoreboardLabel}>Fleet Score</Text>
            </View>
            <View style={styles.scoreboardCol}>
              <Text style={styles.scoreboardValueGreen}>100%</Text>
              <Text style={styles.scoreboardLabel}>SLA Adherence</Text>
            </View>
          </View>

          {/* Contact Drawer */}
          <View style={styles.contactDrawerRow}>
            <TouchableOpacity style={styles.contactDrawerBtn} activeOpacity={0.7}>
              <AppIcon name="call" size={20} />
              <Text style={styles.drawerBtnText}>Call Technician</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactDrawerBtn} activeOpacity={0.7}>
              <AppIcon name="forum" size={20} />
              <Text style={styles.drawerBtnText}>Tech Channel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Formal Customer Statement Card */}
        <View style={styles.statementCard}>
          <View style={styles.statementHead}>
            <AppIcon name="report_problem" size={20} />
            <Text style={styles.statementHeading}>
              Formal Customer Statement
            </Text>
          </View>

          <View style={styles.statementQuoteBox}>
            <AppIcon name="format_quote" size={20} />
            <Text style={styles.statementQuoteText}>
              {disputeData.statement}
            </Text>
            <View style={styles.verifiedSubmissionRow}>
              <AppIcon name="verified_user" size={20} />
              <Text style={styles.verifiedSubText}>
                Verified Customer Submission • {disputeData.submissionDate}
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Service & Financial Audit Card */}
        <View style={styles.serviceAuditCard}>
          <View style={styles.auditHead}>
            <Text style={styles.auditHeading}>Service &amp; Financial Audit</Text>
            <View style={styles.upiBadge}>
              <Text style={styles.upiBadgeText}>UPI Settled</Text>
            </View>
          </View>

          {/* Spec List */}
          <View style={styles.specList}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Service Type</Text>
              <Text style={styles.specValue}>{disputeData.serviceModel}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Work Window</Text>
              <Text style={styles.specValue}>{disputeData.workWindow}</Text>
            </View>
            <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.specLabel}>Premises</Text>
              <Text style={styles.specValue}>{disputeData.premises}</Text>
            </View>
          </View>

          {/* Financial Breakdown */}
          <View style={styles.invoiceBreakdownBox}>
            <Text style={styles.invoiceBreakdownLabel}>
              ITEMIZED INVOICE VERIFICATION
            </Text>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceItemName}>
                Diagnostic &amp; Mechanical Teardown
              </Text>
              <Text style={styles.invoiceItemPrice}>₹1,500.00</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceItemName}>
                Cylinder Heavy-Duty Bushing (Class 4)
              </Text>
              <Text style={styles.invoiceItemPrice}>₹250.00</Text>
            </View>
            <View style={styles.contestedBanner}>
              <View style={styles.contestedLeft}>
                <AppIcon name="flag" size={20} />
                <Text style={styles.contestedLabel}>
                  Contested: Dynamic Tension Tuning
                </Text>
              </View>
              <Text style={styles.contestedPrice}>₹100.00</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Paid into Escrow</Text>
              <Text style={styles.totalValue}>₹1,850.00</Text>
            </View>
          </View>
        </View>

        {/* 6. Evidence & Attachments Dossier */}
        <View style={styles.dossierCard}>
          <View style={styles.dossierHead}>
            <View>
              <Text style={styles.dossierHeading}>Evidence Dossier</Text>
              <Text style={styles.dossierSubheading}>
                4 critical items verified on ledger
              </Text>
            </View>
            <View style={styles.filesBadge}>
              <Text style={styles.filesBadgeText}>4 of 6 Files</Text>
            </View>
          </View>

          {/* 2x2 Evidence Grid */}
          <View style={styles.dossierGrid}>
            {/* Item 1 */}
            <View style={styles.dossierItem}>
              <View style={styles.dossierImgWrapper}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1580481077195-c3a8a04295c0?auto=format&fit=crop&w=400&q=80',
                  }}
                  style={styles.dossierImg}
                />
                <View style={styles.dossierTagBadge}>
                  <Text style={styles.dossierTagText}>Pre-Op #1</Text>
                </View>
              </View>
              <View style={styles.dossierInfoCol}>
                <Text style={styles.dossierTitle} numberOfLines={1}>
                  Initial Sag Diagnostic
                </Text>
                <Text style={styles.dossierMeta}>Captured 03:25 PM</Text>
              </View>
            </View>

            {/* Item 2 */}
            <View style={styles.dossierItem}>
              <View style={styles.dossierImgWrapper}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=400&q=80',
                  }}
                  style={styles.dossierImg}
                />
                <View style={styles.dossierTagBadge}>
                  <Text style={styles.dossierTagText}>Post-Op #2</Text>
                </View>
              </View>
              <View style={styles.dossierInfoCol}>
                <Text style={styles.dossierTitle} numberOfLines={1}>
                  Replaced Bushing
                </Text>
                <Text style={styles.dossierMeta}>Captured 05:10 PM</Text>
              </View>
            </View>

            {/* Item 3 */}
            <View style={styles.dossierItemDoc}>
              <View>
                <View style={styles.docCodeRow}>
                  <AppIcon name="draw" size={20} />
                  <Text style={styles.docCode}>#WS-10482</Text>
                </View>
                <Text style={styles.docTitle} numberOfLines={2}>
                  OTP Verified Worksheet
                </Text>
              </View>
              <View style={styles.docSignedGroup}>
                <AppIcon name="check_circle" size={20} />
                <Text style={styles.docSignedText}>Signed Digitally</Text>
              </View>
            </View>

            {/* Item 4 */}
            <View style={styles.dossierItemDoc}>
              <View>
                <View style={styles.docCodeRow}>
                  <AppIcon name="speaker_notes" size={20} />
                  <Text style={styles.docCode}>Chat Log</Text>
                </View>
                <Text style={styles.docTitle} numberOfLines={2}>
                  In-App Chat Stream
                </Text>
              </View>
              <View style={styles.docSignedGroup}>
                <AppIcon name="mark_chat_read" size={20} />
                <Text style={styles.docMsgText}>8 Messages Logged</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.viewAllDossierBtn} activeOpacity={0.7}>
            <Text style={styles.viewAllDossierText}>
              View All 6 Evidence Files (PDF &amp; High-Res)
            </Text>
            <AppIcon name="open_in_new" size={20} />
          </TouchableOpacity>
        </View>

        {/* 7. Operational Dispute Timeline */}
        <View style={styles.timelineCard}>
          <View style={styles.timelineHead}>
            <Text style={styles.timelineHeading}>Operational Lifecycle</Text>
            <Text style={styles.liveTelemetryText}>Live Telemetry</Text>
          </View>

          <View style={styles.timelineList}>
            {/* Vertical track */}
            <View style={styles.timelineTrack} />

            {/* Step 1 */}
            <View style={styles.timelineStep}>
              <View style={styles.stepDotBlue} />
              <View style={styles.stepContent}>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepTitle}>Service Requested</Text>
                  <Text style={styles.stepTime}>05 Oct, 11:30 AM</Text>
                </View>
                <Text style={styles.stepSub}>
                  Customer booked Aeron Ergonomic Overhaul via mobile app.
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.timelineStep}>
              <View style={styles.stepDotBlue} />
              <View style={styles.stepContent}>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepTitle}>Technician Assigned</Text>
                  <Text style={styles.stepTime}>05 Oct, 01:15 PM</Text>
                </View>
                <Text style={styles.stepSub}>
                  Specialist Rahul Sharma (Van #04) dispatched to Sector 54.
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.timelineStep}>
              <View style={styles.stepDotGreen} />
              <View style={styles.stepContent}>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepTitle}>
                    Service Started &amp; OTP Verified
                  </Text>
                  <Text style={styles.stepTime}>05 Oct, 03:22 PM</Text>
                </View>
                <Text style={styles.stepSub}>
                  Physical check-in completed; OTP #9482 verified at site.
                </Text>
              </View>
            </View>

            {/* Step 4 */}
            <View style={styles.timelineStep}>
              <View style={styles.stepDotBlue} />
              <View style={styles.stepContent}>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepTitle}>Payment Completed</Text>
                  <Text style={styles.stepTime}>05 Oct, 05:42 PM</Text>
                </View>
                <Text style={styles.stepSub}>
                  ₹1,850 UPI settled directly into gateway escrow pool.
                </Text>
              </View>
            </View>

            {/* Step 5 */}
            <View style={styles.timelineStep}>
              <View style={styles.stepDotRed} />
              <View style={styles.stepContent}>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepTitleRed}>Dispute Opened</Text>
                  <Text style={styles.stepTimeRed}>05 Oct, 07:15 PM</Text>
                </View>
                <Text style={styles.stepSub}>
                  Client submitted photos contesting sink issue &amp; surcharge.
                </Text>
              </View>
            </View>

            {/* Step 6 (Active) */}
            <View style={styles.timelineStep}>
              <View style={styles.stepDotBlack} />
              <View style={styles.stepContent}>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepTitleActive}>
                    Super Admin Review Active
                  </Text>
                  <Text style={styles.stepTimeActive}>Today, 10:20 AM</Text>
                </View>
                <Text style={styles.stepSub}>
                  Escrow locked. Telemetry and diagnostic audit in progress.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 8. Sticky Bottom Action Bar */}
      <View
        style={[
          styles.bottomActionBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <View style={styles.bottomContactRow}>
          <TouchableOpacity
            style={styles.contactActionBtn}
            activeOpacity={0.7}
          >
            <AppIcon name="support_agent" size={20} />
            <Text style={styles.contactActionText}>Contact Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactActionBtn}
            activeOpacity={0.7}
          >
            <AppIcon name="engineering" size={20} />
            <Text style={styles.contactActionText}>Contact Tech</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.primaryResolveBtn}
          onPress={handleStartResolution}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryResolveBtnText}>
            Start Resolution Process
          </Text>
          <AppIcon name="arrow_forward" size={20} />
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

  /* 1. Header Bar */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eceef0',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#191c1e',
    includeFontPadding: false,
  },
  headerTitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.2,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#191c1e',
    includeFontPadding: false,
  },
  headerAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  headerAvatarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },

  /* Scroll Content */
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },

  /* 1. Case Meta Pill */
  caseMetaPill: {
    backgroundColor: '#e6e8ea',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.level1,
  },
  caseMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  caseMetaRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ba1a1a',
  },
  caseMetaCode: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10.5,
    letterSpacing: 0.6,
    color: '#45464d',
    fontWeight: '700',
  },
  caseMetaAssignee: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#45464d',
  },

  /* 2. Status Hero Card */
  statusHeroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
    gap: 10,
    ...Shadows.level1,
  },
  heroAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: '#ba1a1a',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 4,
  },
  heroCodeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeBadge: {
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11.5,
    fontWeight: '700',
    color: '#191c1e',
  },
  copyIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#76777d',
    includeFontPadding: false,
  },
  copiedPill: {
    backgroundColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  copiedText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 9.5,
    color: '#ffffff',
  },
  heroBadgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  highPriorityPill: {
    backgroundColor: '#ffdad6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  highPriorityPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10.5,
    fontWeight: '600',
    color: '#93000a',
  },
  underReviewPill: {
    backgroundColor: '#e0e3e5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  underReviewDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#0051d5',
  },
  underReviewPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10.5,
    fontWeight: '600',
    color: '#45464d',
  },

  heroHeadlineSection: {
    paddingLeft: 4,
    gap: 4,
  },
  heroHeadlineText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#191c1e',
  },
  heroServiceSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  handymanIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 17,
    color: '#0051d5',
    includeFontPadding: false,
  },
  heroServiceText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12.5,
    color: '#45464d',
  },

  escrowLedgerBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 4,
  },
  escrowLeftCol: {
    gap: 2,
  },
  escrowLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 0.4,
    color: '#76777d',
    textTransform: 'uppercase',
  },
  escrowAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  escrowAmountText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#191c1e',
  },
  escrowFrozenGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  lockIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  frozenText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10.5,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  escrowRightCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  gatewayLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10.5,
    color: '#76777d',
  },
  gatewayTxnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#0051d5',
  },

  /* 3. Participants Section */
  participantsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  participantsTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupsIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#0051d5',
    includeFontPadding: false,
  },
  participantsHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  participantsMetaCount: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
  },

  participantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    ...Shadows.level1,
  },
  participantTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbe1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#00174b',
  },
  techAvatarWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  techAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  techVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6ffbbe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  techCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 12,
    color: '#002113',
    fontWeight: '700',
    includeFontPadding: false,
  },
  participantInfoCol: {
    flex: 1,
    gap: 2,
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  participantName: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  tierPill: {
    backgroundColor: '#131b2e',
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: BorderRadius.full,
  },
  tierText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: '#bec6e0',
  },
  masterPill: {
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: BorderRadius.full,
  },
  masterPillText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#002113',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pinIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#76777d',
    includeFontPadding: false,
  },
  vanIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#76777d',
    includeFontPadding: false,
  },
  locationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    color: '#45464d',
  },

  scoreboardGrid: {
    flexDirection: 'row',
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  scoreboardCol: {
    alignItems: 'center',
    gap: 1,
    flex: 1,
  },
  scoreboardValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  scoreboardValueBlue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#0051d5',
  },
  scoreboardValueGreen: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#009668',
  },
  starValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#0051d5',
    includeFontPadding: false,
  },
  verifiedScoreIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#0051d5',
    includeFontPadding: false,
  },
  scoreboardLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: '#76777d',
  },

  contactDrawerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contactDrawerBtn: {
    flex: 1,
    height: 36,
    backgroundColor: '#e6e8ea',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  drawerIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#0051d5',
    includeFontPadding: false,
  },
  drawerBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
    fontWeight: '600',
    color: '#191c1e',
  },

  /* 4. Statement Card */
  statementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    ...Shadows.level1,
  },
  statementHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportProblemIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  statementHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  statementQuoteBox: {
    position: 'relative',
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  quoteWatermarkIcon: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 34,
    color: 'rgba(198, 198, 205, 0.4)',
    includeFontPadding: false,
  },
  statementQuoteText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#191c1e',
    fontStyle: 'italic',
  },
  verifiedSubmissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  verifiedSubIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#76777d',
    includeFontPadding: false,
  },
  verifiedSubText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#76777d',
  },

  /* 5. Service & Financial Audit Card */
  serviceAuditCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    ...Shadows.level1,
  },
  auditHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  auditHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  upiBadge: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  upiBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10.5,
    fontWeight: '700',
    color: '#00174b',
  },
  specList: {
    gap: 8,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e3e5',
  },
  specLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  specValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
    textAlign: 'right',
    maxWidth: '60%',
  },
  invoiceBreakdownBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  invoiceBreakdownLabel: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    letterSpacing: 0.6,
    color: '#76777d',
    textTransform: 'uppercase',
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invoiceItemName: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
    flex: 1,
  },
  invoiceItemPrice: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#191c1e',
  },
  contestedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 218, 214, 0.5)',
    padding: 8,
    borderRadius: 6,
  },
  contestedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  flagIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  contestedLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
    fontWeight: '600',
    color: '#93000a',
  },
  contestedPrice: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#93000a',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  totalLabel: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#191c1e',
  },
  totalValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },

  /* 6. Evidence & Attachments Dossier */
  dossierCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    ...Shadows.level1,
  },
  dossierHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dossierHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  dossierSubheading: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    color: '#45464d',
  },
  filesBadge: {
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  filesBadgeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#45464d',
  },
  dossierGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dossierItem: {
    width: '48.5%',
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dossierImgWrapper: {
    height: 100,
    backgroundColor: '#e6e8ea',
    position: 'relative',
  },
  dossierImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  dossierTagBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dossierTagText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9.5,
    color: '#ffffff',
  },
  dossierInfoCol: {
    padding: 8,
    gap: 1,
  },
  dossierTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
    fontWeight: '600',
    color: '#191c1e',
  },
  dossierMeta: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#76777d',
  },
  dossierItemDoc: {
    width: '48.5%',
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  docCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  docIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#0051d5',
    includeFontPadding: false,
  },
  docCode: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#0051d5',
  },
  docTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
    fontWeight: '600',
    color: '#191c1e',
    lineHeight: 16,
  },
  docSignedGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    color: '#009668',
    includeFontPadding: false,
  },
  docSignedText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9.5,
    color: '#009668',
    fontWeight: '700',
  },
  docMsgIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    color: '#76777d',
    includeFontPadding: false,
  },
  docMsgText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9.5,
    color: '#76777d',
  },
  viewAllDossierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  viewAllDossierText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0051d5',
  },
  openInNewIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#0051d5',
    includeFontPadding: false,
  },

  /* 7. Operational Dispute Timeline */
  timelineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    ...Shadows.level1,
  },
  timelineHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  liveTelemetryText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
  },
  timelineList: {
    position: 'relative',
    paddingLeft: 20,
    gap: 16,
  },
  timelineTrack: {
    position: 'absolute',
    left: 6,
    top: 6,
    bottom: 10,
    width: 2,
    backgroundColor: '#e0e3e5',
  },
  timelineStep: {
    position: 'relative',
    gap: 2,
  },
  stepDotBlue: {
    position: 'absolute',
    left: -20,
    top: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#dbe1ff',
    borderWidth: 3,
    borderColor: '#0051d5',
  },
  stepDotGreen: {
    position: 'absolute',
    left: -20,
    top: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#6ffbbe',
    borderWidth: 3,
    borderColor: '#009668',
  },
  stepDotRed: {
    position: 'absolute',
    left: -20,
    top: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffdad6',
    borderWidth: 3,
    borderColor: '#ba1a1a',
  },
  stepDotBlack: {
    position: 'absolute',
    left: -20,
    top: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#000000',
    borderWidth: 3,
    borderColor: '#45464d',
  },
  stepContent: {
    gap: 1,
  },
  stepTitleRow: {
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
  stepTitleRed: {
    fontFamily: 'Inter-Bold',
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  stepTimeRed: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10.5,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  stepTitleActive: {
    fontFamily: 'Inter-Bold',
    fontSize: 12.5,
    fontWeight: '700',
    color: '#191c1e',
  },
  stepTimeActive: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10.5,
    fontWeight: '700',
    color: '#191c1e',
  },
  stepSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#45464d',
  },

  /* 8. Sticky Bottom Action Bar */
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e3e5',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
    ...Shadows.level2,
    zIndex: 30,
  },
  bottomContactRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contactActionBtn: {
    flex: 1,
    height: 38,
    backgroundColor: '#eceef0',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  contactActionIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#0051d5',
    includeFontPadding: false,
  },
  contactActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  primaryResolveBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#000000',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  primaryResolveBtnText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  primaryResolveIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 19,
    color: '#ffffff',
    includeFontPadding: false,
  },
});
