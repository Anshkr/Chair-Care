import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface ReviewModerationScreenProps {
  navigation?: any;
  route?: {
    params?: {
      reviewId?: string;
      review?: any;
    };
  };
}

const renderStars = (rating: number, size = 14, emptyColor = '#CBD5E1') => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((idx) => {
        const isFilled = idx <= Math.floor(rating);
        const isHalf = !isFilled && idx - 0.5 <= rating;
        if (isFilled) {
          return (
            <AppIcon
              key={idx}
              name="Star"
              size={size}
              color="#F59E0B"
              fill="#F59E0B"
            />
          );
        }
        if (isHalf) {
          return (
            <AppIcon
              key={idx}
              name="StarHalf"
              size={size}
              color="#F59E0B"
              fill="#F59E0B"
            />
          );
        }
        return (
          <AppIcon
            key={idx}
            name="Star"
            size={size}
            color={emptyColor}
            fill="none"
          />
        );
      })}
    </View>
  );
};

export const ReviewModerationChaircareMobileScreen: React.FC<
  ReviewModerationScreenProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const passedReview = route?.params?.review;

  // Pulse animation for live status
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [adminNotes, setAdminNotes] = useState<string>(
    'Investigating technician dispatch telemetry log. Field GPS shows arrival was 14 min past appointment start window due to complex gated security clearance at DLF Tower 8B. Waiver upload matches customer registered phone number OTP.'
  );

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalConfirmLabel, setModalConfirmLabel] = useState('Confirm Action');
  const [isModalDestructive, setIsModalDestructive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfPreviewVisible, setPdfPreviewVisible] = useState(false);

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

  // Contested review context
  const reviewData = {
    id: passedReview?.id || 'rev-02',
    code: passedReview?.code || '#REV-88493',
    flagId: passedReview?.flagId || '#MOD-9102',
    flagReason: passedReview?.flagReason || 'Inappropriate / Misleading Content',
    customerName: passedReview?.reviewerName || 'Priya Sharma',
    customerInitials: passedReview?.reviewerInitials || 'PS',
    customerLocation: passedReview?.reviewerLocation || 'DLF Phase 2, Gurugram',
    rating: passedReview?.rating !== undefined ? passedReview.rating : 2.0,
    serviceTitle: passedReview?.serviceTitle || 'Hydraulic Replacement',
    serviceCode: passedReview?.serviceCode || '#CC-10483',
    chairModel: passedReview?.chairModel || 'Herman Miller Aeron (B)',
    reviewText:
      passedReview?.reviewText ||
      '“The technician was late and the repair did not solve the problem. Sinking still occurs.”',
    publishedDate: passedReview?.publishedDate || 'Yesterday • 6:42 PM',
    reportedBy: passedReview?.technicianName || 'Amit Kumar',
    reportedTechId: '#TK-842',
    reportTimestamp: 'Today • 10:24 AM IST',
    ticketLifecycle: 'Completed • Warranty Claim Active',
    techSpecialist: 'Level 3 Assembly Specialist',
    techStatement:
      '“The customer declined the recommended heavy-duty Class-4 cylinder upgrade and insisted on re-using their existing gas strut collar. I documented this in worksheet #WS-10483 before commencing repair.”',
    auditorName: 'S. Raman (Lead Ops)',
  };

  const openActionModal = (
    title: string,
    message: string,
    confirmLabel: string,
    destructive: boolean
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalConfirmLabel(confirmLabel);
    setIsModalDestructive(destructive);
    setModalVisible(true);
  };

  const handleKeepReview = () => {
    openActionModal(
      'Dismiss Flag & Keep Live',
      `This will reject the technician’s flag and keep ${reviewData.customerName}’s ${reviewData.rating.toFixed(
        1
      )}-star rating visible on all public channels.`,
      'Dismiss Flag & Keep',
      false
    );
  };

  const handleHideReview = () => {
    // Navigate toward A37 — Hide Review Confirmation
    if (navigation) {
      navigation.navigate('HideReviewConfirmation', {
        reviewId: reviewData.id,
        review: reviewData,
        moderationAction: 'hide',
        notes: adminNotes,
      });
    }
  };

  const handleEscalateReview = () => {
    openActionModal(
      'Escalate to Concierge',
      'Initiate ticket routing to Senior Operations Lead for direct customer call-back and warranty re-inspection?',
      'Initiate Escalation',
      false
    );
  };

  const handleModalConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setModalVisible(false);
    }, 700);
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
                navigation?.navigate('ReviewDetails', {
                  reviewId: reviewData.id,
                  review: reviewData,
                });
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go Back"
          >
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Review Moderation
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            accessibilityLabel="Screen Options"
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
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Urgent Alert Banner */}
        <View style={styles.urgentAlertBanner}>
          <View style={styles.urgentAlertLeft}>
            <View style={styles.alertIconBox}>
              <AppIcon name="report_problem" size={20} />
            </View>
            <View style={styles.alertTextContent}>
              <View style={styles.flagHeaderRow}>
                <View style={styles.flagBadge}>
                  <Text style={styles.flagBadgeText}>
                    FLAGGED {reviewData.flagId}
                  </Text>
                </View>
                <Text style={styles.priorityModText}>
                  Priority Moderation
                </Text>
              </View>
              <Text style={styles.alertTitle}>
                Review Reported — Requires Admin Attention
              </Text>
              <Text style={styles.alertDesc}>
                A field technician has flagged this review for factual
                discrepancy regarding customer-authorized parts.
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Contested Review Snapshot */}
        <View style={styles.contestedCard}>
          <View style={styles.contestedHeaderRow}>
            <View style={styles.contestedUserLeft}>
              <View style={styles.userInitialsCircle}>
                <Text style={styles.userInitialsText}>
                  {reviewData.customerInitials}
                </Text>
              </View>
              <View>
                <Text style={styles.userNameText}>
                  {reviewData.customerName}
                </Text>
                <View style={styles.userLocationRow}>
                  <AppIcon name="pin_drop" size={20} />
                  <Text style={styles.userLocationText}>
                    {reviewData.customerLocation}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.ratingRightGroup}>
              {renderStars(reviewData.rating, 14, '#CBD5E1')}
              <Text style={styles.ratingMonoScale}>
                {reviewData.rating.toFixed(1)} / 5.0
              </Text>
            </View>
          </View>

          {/* Metadata Badges */}
          <View style={styles.metadataBadgesRow}>
            <View style={styles.metaBadgeGray}>
              <AppIcon name="build" size={20} />
              <Text style={styles.metaBadgeText}>{reviewData.serviceTitle}</Text>
            </View>
            <View style={styles.metaBadgeGray}>
              <AppIcon name="confirmation_number" size={20} />
              <Text style={styles.metaBadgeMonoText}>
                {reviewData.serviceCode}
              </Text>
            </View>
            <View style={styles.metaBadgeDark}>
              <Text style={styles.metaBadgeDarkText}>
                {reviewData.chairModel}
              </Text>
            </View>
          </View>

          {/* Review Text Quote Bubble */}
          <View style={styles.quoteBubble}>
            <AppIcon name="format_quote" size={20} />
            <Text style={styles.quoteBodyText}>{reviewData.reviewText}</Text>
            <View style={styles.quoteMetaRow}>
              <Text style={styles.publishedTimestampText}>
                Published: {reviewData.publishedDate}
              </Text>
              <View style={styles.livePublicRow}>
                <Animated.View
                  style={[styles.livePulseDot, { opacity: pulseAnim }]}
                />
                <Text style={styles.livePublicText}>Live in Public Feed</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Report Incident Dossier */}
        <View style={styles.dossierCard}>
          <View style={styles.dossierHeaderRow}>
            <View style={styles.dossierHeaderLeft}>
              <AppIcon name="assignment_late" size={20} />
              <Text style={styles.dossierTitle}>Report Incident Dossier</Text>
            </View>
            <View style={styles.auditTrailTag}>
              <Text style={styles.auditTrailText}>AUDIT-TRAIL</Text>
            </View>
          </View>

          <View style={styles.dossierList}>
            {/* Reported By */}
            <View style={styles.dossierItemRow}>
              <View style={styles.dossierItemLabelGroup}>
                <AppIcon name="engineering" size={20} />
                <Text style={styles.dossierItemLabel}>Reported By</Text>
              </View>
              <View style={styles.rightAlignedText}>
                <Text style={styles.dossierBoldVal}>
                  {reviewData.reportedBy}
                </Text>
                <Text style={styles.dossierTechId}>
                  Tech ID {reviewData.reportedTechId}
                </Text>
              </View>
            </View>

            {/* Reason Cited */}
            <View style={styles.dossierItemRow}>
              <View style={styles.dossierItemLabelGroup}>
                <AppIcon name="rule" size={20} />
                <Text style={styles.dossierItemLabel}>Reason Cited</Text>
              </View>
              <View style={styles.reasonTagBadge}>
                <Text style={styles.reasonTagText}>
                  {reviewData.flagReason}
                </Text>
              </View>
            </View>

            {/* Timestamp */}
            <View style={styles.dossierItemRow}>
              <View style={styles.dossierItemLabelGroup}>
                <AppIcon name="schedule" size={20} />
                <Text style={styles.dossierItemLabel}>Timestamp</Text>
              </View>
              <Text style={styles.dossierTimestampVal}>
                {reviewData.reportTimestamp}
              </Text>
            </View>

            {/* Ticket Lifecycle */}
            <View style={styles.dossierItemRow}>
              <View style={styles.dossierItemLabelGroup}>
                <AppIcon name="verified_user" size={20} />
                <Text style={styles.dossierItemLabel}>Ticket Lifecycle</Text>
              </View>
              <View style={styles.ticketLifecycleGroup}>
                <View style={styles.greenDot} />
                <Text style={styles.ticketLifecycleText}>
                  {reviewData.ticketLifecycle}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4. Technician Counter-Evidence */}
        <View style={styles.evidenceCard}>
          <View style={styles.evidenceHeaderRow}>
            <View style={styles.evidenceHeaderLeft}>
              <View style={styles.shieldPersonIconBox}>
                <AppIcon name="shield_person" size={20} />
              </View>
              <View>
                <Text style={styles.evidenceTitle}>
                  Technician Counter-Evidence
                </Text>
                <Text style={styles.evidenceSubtitle}>
                  {reviewData.reportedBy} • {reviewData.techSpecialist}
                </Text>
              </View>
            </View>
            <View style={styles.fieldLoggedTag}>
              <Text style={styles.fieldLoggedText}>Field Logged</Text>
            </View>
          </View>

          {/* Statement Box */}
          <View style={styles.statementBox}>
            <Text style={styles.statementText}>{reviewData.techStatement}</Text>
          </View>

          {/* PDF Attachment Item */}
          <View style={styles.pdfAttachmentRow}>
            <View style={styles.pdfLeftGroup}>
              <View style={styles.pdfIconBox}>
                <AppIcon name="picture_as_pdf" size={20} />
              </View>
              <View style={styles.pdfMetaGroup}>
                <Text style={styles.pdfTitleText} numberOfLines={1}>
                  Worksheet_Signed_OTP.pdf
                </Text>
                <View style={styles.pdfSubDetailsRow}>
                  <Text style={styles.pdfSizeText}>1.4 MB</Text>
                  <Text style={styles.pdfDot}>•</Text>
                  <View style={styles.otpSignedGroup}>
                    <AppIcon name="check_circle" size={20} />
                    <Text style={styles.otpSignedText}>
                      Digitally Signed via OTP
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewPdfBtn}
              onPress={() => setPdfPreviewVisible(true)}
              activeOpacity={0.7}
            >
              <AppIcon name="visibility" size={20} />
              <Text style={styles.viewPdfText}>View</Text>
            </TouchableOpacity>
          </View>

          {/* Visual Evidence Grid */}
          <View style={styles.evidenceGrid}>
            <View style={styles.evidenceGridItem}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
                }}
                style={styles.evidenceImg}
                resizeMode="cover"
              />
              <View style={styles.evidenceLabelOverlay}>
                <Text style={styles.evidenceLabelText}>Shaft Wear Log</Text>
              </View>
            </View>

            <View style={styles.evidenceGridItem}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=400&q=80',
                }}
                style={styles.evidenceImg}
                resizeMode="cover"
              />
              <View style={styles.evidenceLabelOverlay}>
                <Text style={styles.evidenceLabelText}>
                  Signed Waiver #10483
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Admin Moderation Notes Field */}
        <View style={styles.notesCard}>
          <View style={styles.notesHeaderRow}>
            <View style={styles.notesHeaderLeft}>
              <AppIcon name="lock" size={20} />
              <Text style={styles.notesTitle}>Internal Moderation Notes</Text>
            </View>
            <Text style={styles.confidentialTag}>CONFIDENTIAL</Text>
          </View>

          <TextInput
            style={styles.notesTextInput}
            value={adminNotes}
            onChangeText={setAdminNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholder="Add confidential findings, telemetry cross-checks, or resolution rationale..."
            placeholderTextColor="#76777d"
          />

          <View style={styles.notesFooterRow}>
            <View style={styles.auditorGroup}>
              <AppIcon name="verified" size={20} />
              <Text style={styles.auditorText}>
                Auditor:{' '}
                <Text style={styles.auditorBold}>{reviewData.auditorName}</Text>
              </Text>
            </View>
            <Text style={styles.autoSavedText}>Auto-saved 2m ago</Text>
          </View>
        </View>

        {/* 6. Operational Moderation Actions Panel */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsHeaderTitle}>MODERATION DECISION</Text>

          {/* Primary Action: Keep Review */}
          <TouchableOpacity
            style={styles.keepReviewBtn}
            onPress={handleKeepReview}
            activeOpacity={0.85}
          >
            <AppIcon name="check_circle" size={20} />
            <Text style={styles.keepReviewBtnText}>
              Keep Review (Dismiss Report)
            </Text>
          </TouchableOpacity>

          {/* Secondary Action: Hide Review */}
          <TouchableOpacity
            style={styles.hideReviewBtn}
            onPress={handleHideReview}
            activeOpacity={0.85}
          >
            <AppIcon name="visibility_off" size={20} />
            <Text style={styles.hideReviewBtnText}>
              Hide Review (Remove from Public)
            </Text>
          </TouchableOpacity>

          {/* Tertiary Action: Escalate */}
          <TouchableOpacity
            style={styles.escalateBtn}
            onPress={handleEscalateReview}
            activeOpacity={0.85}
          >
            <AppIcon name="support_agent" size={20} />
            <Text style={styles.escalateBtnText}>
              Escalate to Customer Dispute Concierge
            </Text>
          </TouchableOpacity>

          {/* Policy Note Box */}
          <View style={styles.policyNoteBox}>
            <AppIcon name="info" size={20} />
            <Text style={styles.policyNoteText}>
              Hiding a review removes it from public technician rating metrics
              and the customer booking portal while preserving tamper-proof
              audit records for dispute mediation.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Confirmation Modal Layer */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalIconBox,
                isModalDestructive
                  ? styles.modalIconBoxDestructive
                  : styles.modalIconBoxNeutral,
              ]}
            >
              <AppIcon name="gavel" size={20} />
            </View>

            <View style={styles.modalTextGroup}>
              <Text style={styles.modalTitleText}>{modalTitle}</Text>
              <Text style={styles.modalMessageText}>{modalMessage}</Text>
            </View>

            <View style={styles.modalButtonsGroup}>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  isModalDestructive
                    ? styles.modalConfirmBtnDestructive
                    : styles.modalConfirmBtnPrimary,
                ]}
                onPress={handleModalConfirm}
                activeOpacity={0.85}
                disabled={isProcessing}
              >
                <Text style={styles.modalConfirmBtnText}>
                  {isProcessing ? 'Updating...' : modalConfirmLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
                disabled={isProcessing}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PDF Viewer Mock Modal */}
      <Modal
        visible={pdfPreviewVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPdfPreviewVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pdfModalCard}>
            <View style={styles.pdfModalHeader}>
              <View style={styles.pdfModalHeaderLeft}>
                <AppIcon name="picture_as_pdf" size={20} />
                <Text style={styles.pdfModalTitle}>
                  Worksheet_Signed_OTP.pdf
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPdfPreviewVisible(false)}
                style={styles.closePdfBtn}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.pdfMockContent}>
              <Text style={styles.pdfDocTitle}>CHAIRCARE SERVICE WORKSHEET</Text>
              <Text style={styles.pdfDocMeta}>
                Order: #CC-10483 • Date: 12 Oct 2026
              </Text>
              <View style={styles.pdfWaiverBox}>
                <Text style={styles.pdfWaiverText}>
                  "Customer acknowledged existing strut collar reuse against
                  technician advice."
                </Text>
                <Text style={styles.pdfOtpStamp}>
                  [OTP AUTH: 928-104 • VERIFIED]
                </Text>
              </View>
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
    fontFamily: 'PlusJakartaSans-SemiBold',
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

  /* Scroll Content */
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },

  /* 1. Urgent Alert Banner */
  urgentAlertBanner: {
    backgroundColor: 'rgba(255, 218, 214, 0.4)',
    borderRadius: 16,
    padding: 16,
    ...Shadows.level1,
  },
  urgentAlertLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  alertIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ba1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  alertIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#ffffff',
    includeFontPadding: false,
  },
  alertTextContent: {
    flex: 1,
    gap: 4,
  },
  flagHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  flagBadge: {
    backgroundColor: '#ba1a1a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  flagBadgeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  priorityModText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#93000a',
  },
  alertTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#191c1e',
    letterSpacing: -0.2,
  },
  alertDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#45464d',
  },

  /* 2. Contested Review Snapshot */
  contestedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  contestedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contestedUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  userInitialsCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#316bf3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitialsText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  userNameText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: '#191c1e',
  },
  userLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  pinIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#76777d',
    includeFontPadding: false,
  },
  userLocationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464d',
  },
  ratingRightGroup: {
    alignItems: 'flex-end',
    gap: 2,
  },
  starsHighBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 1,
  },
  starFilled: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#f59e0b',
    includeFontPadding: false,
  },
  starEmpty: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#c6c6cd',
    includeFontPadding: false,
  },
  ratingMonoScale: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },
  metadataBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaBadgeGray: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eceef0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaBadgeIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#191c1e',
    includeFontPadding: false,
  },
  metaBadgeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#191c1e',
  },
  metaBadgeMonoText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#191c1e',
  },
  metaBadgeDark: {
    backgroundColor: '#131b2e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaBadgeDarkText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#7c839b',
  },
  quoteBubble: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  quoteIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 24,
    color: '#c6c6cd',
    includeFontPadding: false,
  },
  quoteBodyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#191c1e',
    fontStyle: 'italic',
  },
  quoteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e3e5',
  },
  publishedTimestampText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
  },
  livePublicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ba1a1a',
  },
  livePublicText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#ba1a1a',
  },

  /* 3. Report Incident Dossier */
  dossierCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  dossierHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dossierHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assignmentIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#0051d5',
    includeFontPadding: false,
  },
  dossierTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: '#191c1e',
  },
  auditTrailTag: {
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  auditTrailText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
  },
  dossierList: {
    gap: 8,
  },
  dossierItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    padding: 10,
    borderRadius: 12,
  },
  dossierItemLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dossierItemIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#45464d',
    includeFontPadding: false,
  },
  dossierItemLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  rightAlignedText: {
    alignItems: 'flex-end',
  },
  dossierBoldVal: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    fontWeight: '500',
    color: '#191c1e',
  },
  dossierTechId: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#0051d5',
  },
  reasonTagBadge: {
    backgroundColor: '#ffdad6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reasonTagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#93000a',
  },
  dossierTimestampVal: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#191c1e',
  },
  ticketLifecycleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#009668',
  },
  ticketLifecycleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#191c1e',
  },

  /* 4. Technician Counter-Evidence */
  evidenceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  evidenceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  evidenceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  shieldPersonIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldPersonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },
  evidenceTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#191c1e',
  },
  evidenceSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464d',
  },
  fieldLoggedTag: {
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  fieldLoggedText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#002113',
  },
  statementBox: {
    backgroundColor: '#eceef0',
    borderRadius: 12,
    padding: 12,
  },
  statementText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#191c1e',
  },
  pdfAttachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    padding: 10,
    borderRadius: 12,
  },
  pdfLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pdfIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#e6e8ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#0051d5',
    includeFontPadding: false,
  },
  pdfMetaGroup: {
    flex: 1,
  },
  pdfTitleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#191c1e',
  },
  pdfSubDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  pdfSizeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
  },
  pdfDot: {
    color: '#76777d',
    fontSize: 9,
  },
  otpSignedGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  otpCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 12,
    color: '#009668',
    includeFontPadding: false,
  },
  otpSignedText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: '#009668',
  },
  viewPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0e3e5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewEyeIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#191c1e',
    includeFontPadding: false,
  },
  viewPdfText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#191c1e',
  },
  evidenceGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  evidenceGridItem: {
    flex: 1,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e6e8ea',
  },
  evidenceImg: {
    width: '100%',
    height: '100%',
  },
  evidenceLabelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  evidenceLabelText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#ffffff',
  },

  /* 5. Admin Moderation Notes Field */
  notesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    ...Shadows.level1,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#000000',
    includeFontPadding: false,
  },
  notesTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#191c1e',
  },
  confidentialTag: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#76777d',
    letterSpacing: 0.6,
  },
  notesTextInput: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#191c1e',
    minHeight: 70,
  },
  notesFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  auditorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  auditorVerifiedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#0051d5',
    includeFontPadding: false,
  },
  auditorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464d',
  },
  auditorBold: {
    fontFamily: 'Inter-SemiBold',
    color: '#191c1e',
  },
  autoSavedText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#76777d',
  },

  /* 6. Operational Moderation Actions */
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    ...Shadows.level1,
  },
  actionsHeaderTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#45464d',
    letterSpacing: 0.8,
  },
  keepReviewBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  actionIconLight: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ffffff',
    includeFontPadding: false,
  },
  keepReviewBtnText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  hideReviewBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ba1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  hideReviewBtnText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  escalateBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eceef0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  supportAgentIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
  },
  escalateBtnText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#0051d5',
  },
  policyNoteBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  policyInfoIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#76777d',
    includeFontPadding: false,
    marginTop: 1,
  },
  policyNoteText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: '#45464d',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 14,
    alignItems: 'center',
    ...Shadows.level3,
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconBoxNeutral: {
    backgroundColor: '#dbe1ff',
  },
  modalIconBoxDestructive: {
    backgroundColor: '#ffdad6',
  },
  modalGavelIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 26,
    includeFontPadding: false,
  },
  modalGavelIconNeutral: {
    color: '#0051d5',
  },
  modalGavelIconDestructive: {
    color: '#ba1a1a',
  },
  modalTextGroup: {
    alignItems: 'center',
    gap: 4,
  },
  modalTitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
    textAlign: 'center',
  },
  modalMessageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#45464d',
    textAlign: 'center',
  },
  modalButtonsGroup: {
    width: '100%',
    gap: 8,
    paddingTop: 4,
  },
  modalConfirmBtn: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnPrimary: {
    backgroundColor: '#000000',
  },
  modalConfirmBtnDestructive: {
    backgroundColor: '#ba1a1a',
  },
  modalConfirmBtnText: {
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalCancelBtn: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },

  /* PDF Preview Modal */
  pdfModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.level3,
  },
  pdfModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131b2e',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pdfModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pdfModalHeaderIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#f87171',
    includeFontPadding: false,
  },
  pdfModalTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#ffffff',
  },
  closePdfBtn: {
    padding: 4,
  },
  closePdfIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },
  pdfMockContent: {
    padding: 20,
    gap: 10,
    backgroundColor: '#f8fafc',
  },
  pdfDocTitle: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  pdfDocMeta: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  pdfWaiverBox: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
    marginTop: 8,
  },
  pdfWaiverText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#334155',
    fontStyle: 'italic',
  },
  pdfOtpStamp: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    color: '#16a34a',
    textAlign: 'center',
  },
});
