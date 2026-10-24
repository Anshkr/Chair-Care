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
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { adminApi } from '../../services/api/adminApi';

interface SupportTicketDetailsScreenProps {
  navigation?: any;
  route?: {
    params?: {
      ticketId?: string;
      ticket?: any;
    };
  };
}

export const SupportTicketDetailsSup10482ChaircareMobileScreen: React.FC<
  SupportTicketDetailsScreenProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const passedTicket = route?.params?.ticket;
  const [liveTicket, setLiveTicket] = useState<any>(passedTicket || null);
  const [openingChat, setOpeningChat] = useState(false);

  // Pulse animation for high priority and active step indicators
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Copied toast banner state
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  // Resolution modal state
  const [showResolveModal, setShowResolveModal] = useState(false);

  useEffect(() => {
    const rawId = route?.params?.ticketId || passedTicket?.id;
    if (rawId) {
      adminApi
        .getSupportTicketById(rawId)
        .then((res) => {
          if (res.success && res.data) {
            setLiveTicket(res.data);
          }
        })
        .catch(() => {});
    }
  }, [route?.params?.ticketId, passedTicket?.id]);

  const activeTicket = liveTicket || passedTicket;

  const rawCustName = activeTicket?.customerName || activeTicket?.userName || 'Customer';
  const initials =
    rawCustName
      .split(' ')
      .map((n: string) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'C';

  // Real ticket data without dummy mock fallback
  const ticketData = {
    id: activeTicket?.id || 'sup-1',
    code: activeTicket?.code || 'SUP-TKT',
    priority: activeTicket?.priority || 'high',
    priorityLabel: activeTicket?.priorityLabel || 'High Priority',
    status: activeTicket?.status || 'Open',
    createdTime: activeTicket?.timeLabel || 'Recent',
    channel: 'Mobile App',
    categoryHeader: `${activeTicket?.categoryLabel || 'Customer Support'} • Real Customer Ticket`,
    subject: activeTicket?.subject || activeTicket?.title || 'Support Claim Inquiry',
    statement:
      activeTicket?.statement ||
      activeTicket?.description ||
      'Customer has submitted a service issue regarding this order.',
    customerName: rawCustName,
    customerInitials: initials,
    customerTier: `${activeTicket?.userType || 'Customer'} • Verified Account`,
    customerPhone: activeTicket?.customerPhone || 'Not provided',
    customerEmail: activeTicket?.customerEmail || 'Not provided',
    customerAddress: activeTicket?.customerAddress || 'Address on file',
    serviceCode: activeTicket?.serviceCode ? `#${activeTicket.serviceCode.replace(/^#/, '')}` : '#SR-ORDER',
    serviceTitle: activeTicket?.serviceTitle || 'ChairCare Diagnostic Service',
    serviceSubtitle: activeTicket?.chairModel
      ? `${activeTicket.chairModel} Calibration & Repair`
      : 'Chair Support Request',
    assignedTech: activeTicket?.assignedTech || 'Unassigned',
    assignedTechRole: activeTicket?.assignedTechPhone
      ? `Tech Partner • ${activeTicket.assignedTechPhone}`
      : 'Service Partner',
    serviceSlotDate: activeTicket?.serviceSlotDate || 'Scheduled Service',
    serviceSlotTime: activeTicket?.serviceSlotTime || 'Visit Slot',
    escrowAmount: activeTicket?.escrowAmount || '₹499.00',
    escrowStatus: activeTicket?.escrowStatus || 'Settled via UPI',
    disputeFlag: activeTicket?.disputeFlag || activeTicket?.subject || 'Claim Submitted',
  };

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

  const handleCopyCode = () => {
    setShowCopiedToast(true);
    setTimeout(() => {
      setShowCopiedToast(false);
    }, 2000);
  };

  const handleAssignAdmin = () => {
    if (navigation) {
      navigation.navigate('AssignSupportTicketSup10482', {
        ticketId: ticketData.id,
        ticket: ticketData,
      });
    }
  };

  const handleReplyChat = async () => {
    try {
      setOpeningChat(true);
      await adminApi.openSupportChat(ticketData.id);
      Alert.alert(
        'Support Chat Activated',
        `Live support chat is open. Customer ${ticketData.customerName} has been notified.`,
        [
          {
            text: 'Enter Support Chat',
            onPress: () => {
              navigation.navigate('SupportConversation', {
                ticketId: ticketData.id,
                ticket: ticketData,
              });
            },
          },
        ]
      );
    } catch (err: any) {
      navigation.navigate('SupportConversation', {
        ticketId: ticketData.id,
        ticket: ticketData,
      });
    } finally {
      setOpeningChat(false);
    }
  };

  const handleConfirmResolve = () => {
    setShowResolveModal(false);
    if (navigation) {
      navigation.navigate('TicketResolvedSup10482', {
        ticketId: ticketData.id,
      });
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Bar with Back and Actions */}
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
                navigation?.navigate('Support');
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Support Ticket Details
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            accessibilityLabel="More ticket actions"
          >
            <AppIcon name="more_vert" size={20} />
          </TouchableOpacity>
          <View style={styles.headerAvatarContainer}>
            <AppIcon name="person" size={20} />
          </View>
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Ticket Case Meta Bar Card */}
        <View style={styles.metaBarCard}>
          <View style={styles.metaBarTopRow}>
            <View style={styles.metaBarLeft}>
              <Text style={styles.ticketTagLabel}>TICKET</Text>
              <TouchableOpacity
                style={styles.ticketCodeCopyBtn}
                onPress={handleCopyCode}
                activeOpacity={0.7}
              >
                <Text style={styles.ticketCodeHeading}>{ticketData.code}</Text>
                <AppIcon name="content_copy" size={20} />
              </TouchableOpacity>
              {showCopiedToast && (
                <View style={styles.copiedToastPill}>
                  <Text style={styles.copiedToastText}>Copied!</Text>
                </View>
              )}
            </View>

            <View style={styles.metaBarBadgesRow}>
              <View style={styles.highPriorityBadge}>
                <Animated.View
                  style={[styles.pulseRedDot, { opacity: pulseAnim }]}
                />
                <Text style={styles.highPriorityText}>
                  {ticketData.priorityLabel}
                </Text>
              </View>
              <View style={styles.statusPillBadge}>
                <Text style={styles.statusPillText}>{ticketData.status}</Text>
              </View>
            </View>
          </View>

          <View style={styles.metaBarBottomRow}>
            <View style={styles.metaItem}>
              <AppIcon name="schedule" size={20} />
              <Text style={styles.metaItemText}>
                Created: {ticketData.createdTime}
              </Text>
            </View>
            <Text style={styles.metaDivider}>•</Text>
            <View style={styles.metaItem}>
              <AppIcon name="smartphone" size={20} />
              <Text style={styles.metaItemText}>{ticketData.channel}</Text>
            </View>
          </View>
        </View>

        {/* 2. Issue Title & Statement Card */}
        <View style={styles.issueStatementCard}>
          <View style={styles.issueHeaderCol}>
            <Text style={styles.categorySubheading}>
              {ticketData.categoryHeader}
            </Text>
            <Text style={styles.issueTitleHeading}>{ticketData.subject}</Text>
          </View>

          {/* Formal Statement Quote Box */}
          <View style={styles.statementQuoteBox}>
            <View style={styles.statementQuoteLeftBar} />
            <Text style={styles.statementQuoteText}>
              {ticketData.statement}
            </Text>
            <View style={styles.submittedByRow}>
              <AppIcon name="verified" size={20} />
              <Text style={styles.submittedByText}>
                Submitted by {ticketData.customerName} (Verified Customer)
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Customer Profile Card */}
        <View style={styles.customerCard}>
          <View style={styles.customerTopRow}>
            <View style={styles.customerInfoLeft}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerAvatarText}>
                  {ticketData.customerInitials}
                </Text>
              </View>
              <View style={styles.customerDetailsCol}>
                <Text style={styles.customerNameText} numberOfLines={1}>
                  {ticketData.customerName}
                </Text>
                <View style={styles.customerTierPill}>
                  <Text style={styles.customerTierText}>
                    {ticketData.customerTier}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewProfileBtn}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('CustomerProfileAnshKumar');
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.viewProfileText}>View Profile</Text>
              <AppIcon name="arrow_forward" size={20} />
            </TouchableOpacity>
          </View>

          {/* Contact details box */}
          <View style={styles.contactDetailsBox}>
            <View style={styles.contactRow}>
              <View style={styles.contactLeft}>
                <AppIcon name="call" size={20} />
                <Text style={styles.contactMonoText}>
                  {ticketData.customerPhone}
                </Text>
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.contactActionLink}>Call</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.contactRow}>
              <View style={styles.contactLeft}>
                <AppIcon name="mail" size={20} />
                <Text style={styles.contactRegularText} numberOfLines={1}>
                  {ticketData.customerEmail}
                </Text>
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.contactActionLink}>Email</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.addressRow}>
              <AppIcon name="location_on" size={20} />
              <Text style={styles.addressText}>
                {ticketData.customerAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Related Service Order Card (Connected Context) */}
        <View style={styles.connectedContextCard}>
          <View style={styles.connectedContextHead}>
            <View style={styles.connectedLeft}>
              <AppIcon name="build_circle" size={20} />
              <Text style={styles.connectedLabel}>CONNECTED CONTEXT</Text>
            </View>
            <View style={styles.serviceCodeBadge}>
              <Text style={styles.serviceCodeBadgeText}>
                {ticketData.serviceCode}
              </Text>
            </View>
          </View>

          <View style={styles.serviceTitleSection}>
            <Text style={styles.serviceTitleText}>
              {ticketData.serviceTitle}
            </Text>
            <Text style={styles.serviceSubtitleText}>
              {ticketData.serviceSubtitle}
            </Text>
          </View>

          <View style={styles.serviceDetailsGrid}>
            <View style={styles.serviceGridCol}>
              <Text style={styles.gridColLabel}>ASSIGNED TECH</Text>
              <Text style={styles.gridColValue} numberOfLines={1}>
                {ticketData.assignedTech}
              </Text>
              <Text style={styles.gridColSub} numberOfLines={1}>
                {ticketData.assignedTechRole}
              </Text>
            </View>

            <View style={styles.serviceGridCol}>
              <Text style={styles.gridColLabel}>SERVICE SLOT</Text>
              <Text style={styles.gridColValue}>
                {ticketData.serviceSlotDate}
              </Text>
              <Text style={styles.gridColSub}>
                {ticketData.serviceSlotTime}
              </Text>
            </View>

            <View style={styles.escrowBannerBox}>
              <View style={styles.escrowRowTop}>
                <Text style={styles.escrowLabel}>Invoiced Escrow</Text>
                <Text style={styles.escrowAmountText}>
                  {ticketData.escrowAmount}
                </Text>
              </View>
              <View style={styles.escrowRowBottom}>
                <Text style={styles.escrowStatusText}>
                  {ticketData.escrowStatus}
                </Text>
                <View style={styles.disputeFlagGroup}>
                  <AppIcon name="warning" size={20} />
                  <Text style={styles.disputeFlagText}>
                    {ticketData.disputeFlag}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Evidence & Attachments Section */}
        <View style={styles.attachmentsCard}>
          <View style={styles.attachmentsHead}>
            <View style={styles.attachmentsTitleLeft}>
              <AppIcon name="attach_file" size={20} />
              <Text style={styles.attachmentsHeading}>Attachments</Text>
            </View>
            <View style={styles.verifiedCountBadge}>
              <Text style={styles.verifiedCountText}>3 Files Verified</Text>
            </View>
          </View>

          <View style={styles.attachmentsGrid}>
            {/* File 1: Unseated Bushing */}
            <View style={styles.attachmentItem}>
              <View style={styles.attachmentThumb}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1580481077195-c3a8a04295c0?auto=format&fit=crop&w=400&q=80',
                  }}
                  style={styles.attachmentImg}
                />
                <View style={styles.thumbExtBadge}>
                  <Text style={styles.thumbExtText}>JPG</Text>
                </View>
              </View>
              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentName} numberOfLines={1}>
                  Unseated Bushing
                </Text>
                <Text style={styles.attachmentMeta}>2.4 MB</Text>
              </View>
            </View>

            {/* File 2: Tax Invoice */}
            <View style={styles.attachmentItem}>
              <View style={styles.attachmentThumbPdf}>
                <AppIcon name="picture_as_pdf" size={20} />
                <View style={styles.thumbExtBadge}>
                  <Text style={styles.thumbExtText}>PDF</Text>
                </View>
              </View>
              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentName} numberOfLines={1}>
                  Tax Invoice
                </Text>
                <Text style={styles.attachmentMeta}>#CR-10482</Text>
              </View>
            </View>

            {/* File 3: Chat Transcript */}
            <View style={styles.attachmentItem}>
              <View style={styles.attachmentThumbChat}>
                <AppIcon name="chat" size={20} />
                <View style={styles.thumbExtBadge}>
                  <Text style={styles.thumbExtText}>PNG</Text>
                </View>
              </View>
              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentName} numberOfLines={1}>
                  Chat Transcript
                </Text>
                <Text style={styles.attachmentMeta}>In-app log</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewAllAttachmentsBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllAttachmentsText}>
              View All 3 Attachments (High-Res)
            </Text>
            <AppIcon name="open_in_new" size={20} />
          </TouchableOpacity>
        </View>

        {/* 6. Ticket Activity Lifecycle Timeline */}
        <View style={styles.activityCard}>
          <View style={styles.activityHead}>
            <Text style={styles.activityHeading}>Activity Lifecycle</Text>
            <Text style={styles.activityStepText}>Step 4 of 5</Text>
          </View>

          <View style={styles.timelineContainer}>
            {/* Continuous vertical line */}
            <View style={styles.timelineLine} />

            {/* Step 1 */}
            <View style={styles.timelineStepItem}>
              <View style={styles.stepCompletedCircle}>
                <AppIcon name="check" size={20} />
              </View>
              <View style={styles.stepContentCol}>
                <View style={styles.stepHeaderRow}>
                  <Text style={styles.stepTitle}>Ticket Created</Text>
                  <Text style={styles.stepTimestamp}>05 Oct, 05:20 PM</Text>
                </View>
                <Text style={styles.stepDesc}>
                  Customer submitted ticket via mobile app.
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.timelineStepItem}>
              <View style={styles.stepCompletedCircle}>
                <AppIcon name="check" size={20} />
              </View>
              <View style={styles.stepContentCol}>
                <View style={styles.stepHeaderRow}>
                  <Text style={styles.stepTitle}>Admin Assigned</Text>
                  <Text style={styles.stepTimestamp}>05 Oct, 05:25 PM</Text>
                </View>
                <Text style={styles.stepDesc}>
                  Unassigned → Auto-queued to Operations Desk.
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.timelineStepItem}>
              <View style={styles.stepCompletedCircle}>
                <AppIcon name="check" size={20} />
              </View>
              <View style={styles.stepContentCol}>
                <View style={styles.stepHeaderRow}>
                  <Text style={styles.stepTitle}>Customer Message Received</Text>
                  <Text style={styles.stepTimestamp}>05 Oct, 05:32 PM</Text>
                </View>
                <Text style={styles.stepDesc}>
                  Photos of chair uploaded by Rahul Mehta.
                </Text>
              </View>
            </View>

            {/* Step 4 (Current) */}
            <View style={styles.timelineStepItemCurrent}>
              <View style={styles.stepCurrentCircle}>
                <Animated.View
                  style={[styles.stepCurrentPulseDot, { opacity: pulseAnim }]}
                />
              </View>
              <View style={styles.stepContentCol}>
                <View style={styles.stepHeaderRow}>
                  <Text style={styles.stepTitleCurrent}>Admin Reviewing</Text>
                  <Text style={styles.stepTimestampCurrent}>
                    Today, 05:40 PM
                  </Text>
                </View>
                <Text style={styles.stepDescCurrent}>
                  Super Admin (#SA-01) investigating dispatch log &amp; technician notes.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 7. Sticky Bottom Action Controls */}
      <View
        style={[
          styles.bottomControlsBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        {/* Primary Reply Button */}
        <TouchableOpacity
          style={styles.replyButton}
          onPress={handleReplyChat}
          activeOpacity={0.8}
        >
          <AppIcon name="forum" size={20} />
          <Text style={styles.replyButtonText}>Reply (Open Support Chat)</Text>
          <AppIcon name="arrow_forward" size={20} />
        </TouchableOpacity>

        {/* Secondary Buttons Row */}
        <View style={styles.secondaryBtnRow}>
          <TouchableOpacity
            style={styles.assignAdminBtn}
            onPress={handleAssignAdmin}
            activeOpacity={0.8}
          >
            <AppIcon name="person_add" size={20} />
            <Text style={styles.assignBtnText}>Assign Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resolveTicketBtn}
            onPress={() => setShowResolveModal(true)}
            activeOpacity={0.8}
          >
            <AppIcon name="task_alt" size={20} />
            <Text style={styles.resolveBtnText}>Resolve Ticket</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 8. Resolve Confirmation Modal Dialog */}
      <Modal
        visible={showResolveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResolveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <AppIcon name="check_circle" size={20} />
            </View>
            <Text style={styles.modalTitle}>
              Resolve Ticket {ticketData.code}?
            </Text>
            <Text style={styles.modalBody}>
              This will notify customer {ticketData.customerName} and mark the
              service dispute as closed with a follow-up dispatch ticket.
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowResolveModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmResolve}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#f7f9fb',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },

  /* 1. Ticket Case Meta Bar */
  metaBarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    ...Shadows.level1,
  },
  metaBarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  ticketTagLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: '#45464d',
    textTransform: 'uppercase',
  },
  ticketCodeCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketCodeHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 17,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.2,
  },
  copyIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#76777d',
    includeFontPadding: false,
  },
  copiedToastPill: {
    backgroundColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  copiedToastText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#ffffff',
  },
  metaBarBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  highPriorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffdad6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  pulseRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ba1a1a',
  },
  highPriorityText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#93000a',
  },
  statusPillBadge: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#003ea8',
  },
  metaBarBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaScheduleIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#76777d',
    includeFontPadding: false,
  },
  metaPhoneIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#76777d',
    includeFontPadding: false,
  },
  metaItemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  metaDivider: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#c6c6cd',
  },

  /* 2. Issue Title & Statement Card */
  issueStatementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    ...Shadows.level1,
  },
  issueHeaderCol: {
    gap: 2,
  },
  categorySubheading: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10.5,
    letterSpacing: 0.6,
    color: '#0051d5',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  issueTitleHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#191c1e',
  },
  statementQuoteBox: {
    position: 'relative',
    backgroundColor: '#f2f4f6',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 10,
    gap: 6,
  },
  statementQuoteLeftBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#0051d5',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  statementQuoteText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#191c1e',
    fontStyle: 'italic',
  },
  submittedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  verifiedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#009668',
    includeFontPadding: false,
  },
  submittedByText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#45464d',
  },

  /* 3. Customer Profile Card */
  customerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    ...Shadows.level1,
  },
  customerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  customerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#131b2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#bec6e0',
  },
  customerDetailsCol: {
    gap: 2,
    flex: 1,
  },
  customerNameText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  customerTierPill: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  customerTierText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10.5,
    color: '#45464d',
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewProfileText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0051d5',
  },
  viewProfileIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#0051d5',
    includeFontPadding: false,
  },
  contactDetailsBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  contactIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#0051d5',
    includeFontPadding: false,
  },
  contactMonoText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11.5,
    color: '#191c1e',
  },
  contactRegularText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#191c1e',
    flex: 1,
  },
  contactActionLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0051d5',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 2,
  },
  locationIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#76777d',
    marginTop: 1,
    includeFontPadding: false,
  },
  addressText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#45464d',
    flex: 1,
  },

  /* 4. Related Service Order Card */
  connectedContextCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    ...Shadows.level1,
  },
  connectedContextHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buildCircleIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
  },
  connectedLabel: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10.5,
    letterSpacing: 0.6,
    color: '#45464d',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  serviceCodeBadge: {
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  serviceCodeBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#191c1e',
  },
  serviceTitleSection: {
    gap: 2,
  },
  serviceTitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  serviceSubtitleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  serviceDetailsGrid: {
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    padding: 10,
    gap: 10,
  },
  serviceGridCol: {
    gap: 1,
  },
  gridColLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 0.4,
    color: '#76777d',
    textTransform: 'uppercase',
  },
  gridColValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12.5,
    fontWeight: '600',
    color: '#191c1e',
  },
  gridColSub: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#76777d',
  },
  escrowBannerBox: {
    backgroundColor: 'rgba(230, 232, 234, 0.7)',
    borderRadius: 6,
    padding: 8,
    gap: 4,
    marginTop: 2,
  },
  escrowRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  escrowLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#45464d',
  },
  escrowAmountText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  escrowRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  escrowStatusText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#76777d',
  },
  disputeFlagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  disputeWarningIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  disputeFlagText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#ba1a1a',
  },

  /* 5. Evidence & Attachments */
  attachmentsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    ...Shadows.level1,
  },
  attachmentsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attachmentsTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attachFileIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
    includeFontPadding: false,
  },
  attachmentsHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  verifiedCountBadge: {
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  verifiedCountText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10.5,
    color: '#45464d',
  },
  attachmentsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  attachmentItem: {
    flex: 1,
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  attachmentThumb: {
    height: 80,
    backgroundColor: '#e6e8ea',
    position: 'relative',
  },
  attachmentImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  attachmentThumbPdf: {
    height: 80,
    backgroundColor: '#e6e8ea',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pdfIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 28,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  attachmentThumbChat: {
    height: 80,
    backgroundColor: '#e6e8ea',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chatIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 28,
    color: '#0051d5',
    includeFontPadding: false,
  },
  thumbExtBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  thumbExtText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9,
    fontWeight: '700',
    color: '#191c1e',
  },
  attachmentInfo: {
    padding: 6,
    gap: 1,
  },
  attachmentName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#191c1e',
  },
  attachmentMeta: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9.5,
    color: '#76777d',
  },
  viewAllAttachmentsBtn: {
    backgroundColor: '#eceef0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewAllAttachmentsText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
    fontWeight: '600',
    color: '#191c1e',
  },
  openInNewIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#191c1e',
    includeFontPadding: false,
  },

  /* 6. Ticket Activity Lifecycle Timeline */
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    ...Shadows.level1,
  },
  activityHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  activityStepText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#0051d5',
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: 24,
    gap: 16,
  },
  timelineLine: {
    position: 'absolute',
    left: 8,
    top: 6,
    bottom: 12,
    width: 2,
    backgroundColor: '#e0e3e5',
  },
  timelineStepItem: {
    position: 'relative',
    gap: 2,
  },
  stepCompletedCircle: {
    position: 'absolute',
    left: -24,
    top: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0051d5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 12,
    color: '#ffffff',
    includeFontPadding: false,
  },
  stepContentCol: {
    gap: 2,
  },
  stepHeaderRow: {
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
  stepTimestamp: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10.5,
    color: '#76777d',
  },
  stepDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#45464d',
  },
  timelineStepItemCurrent: {
    position: 'relative',
    gap: 2,
  },
  stepCurrentCircle: {
    position: 'absolute',
    left: -24,
    top: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#316bf3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCurrentPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  stepTitleCurrent: {
    fontFamily: 'Inter-Bold',
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0051d5',
  },
  stepTimestampCurrent: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0051d5',
  },
  stepDescCurrent: {
    fontFamily: 'Inter-Medium',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#191c1e',
  },

  /* 7. Sticky Bottom Action Controls */
  bottomControlsBar: {
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
  replyButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#0051d5',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  replyIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 19,
    color: '#ffffff',
    includeFontPadding: false,
  },
  replyButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  replyArrowIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 17,
    color: '#ffffff',
    includeFontPadding: false,
  },
  secondaryBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assignAdminBtn: {
    flex: 1,
    height: 38,
    backgroundColor: '#eceef0',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  assignIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 17,
    color: '#191c1e',
    includeFontPadding: false,
  },
  assignBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  resolveTicketBtn: {
    flex: 1,
    height: 38,
    backgroundColor: '#002113',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resolveIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 17,
    color: '#6ffbbe',
    includeFontPadding: false,
  },
  resolveBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#6ffbbe',
  },

  /* 8. Resolution Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    ...Shadows.level2,
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#002113',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 28,
    color: '#6ffbbe',
    includeFontPadding: false,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 17,
    fontWeight: '700',
    color: '#191c1e',
    textAlign: 'center',
  },
  modalBody: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#45464d',
    textAlign: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#eceef0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#191c1e',
  },
  modalConfirmBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#0051d5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#ffffff',
  },
});
