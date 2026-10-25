import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface ModerationReasonOption {
  id: string;
  title: string;
  description: string;
}

const MODERATION_REASONS: ModerationReasonOption[] = [
  {
    id: 'offensive',
    title: 'Inappropriate / offensive content',
    description: 'Profanity, abusive language, or harassment',
  },
  {
    id: 'spam',
    title: 'Spam or advertising',
    description: 'Third-party promotions or irrelevant links',
  },
  {
    id: 'refuted',
    title: 'Misleading or factually refuted information',
    description: 'Disproved by signed digital worksheet #WS-10483',
  },
  {
    id: 'pii',
    title: 'Personal information (PII)',
    description: 'Unmasked phone numbers, emails, or personal addresses',
  },
  {
    id: 'policy',
    title: 'Platform policy violation',
    description: 'Coercion, payment circumvention, or non-service review',
  },
  {
    id: 'other',
    title: 'Other operational discrepancy',
    description: 'Duplicate submission or technician app sync glitch',
  },
];

interface HideReviewConfirmationProps {
  navigation?: any;
  route?: {
    params?: {
      reviewId?: string;
      review?: any;
      moderationAction?: string;
      notes?: string;
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

export const HideReviewConfirmationChaircareMobileScreen: React.FC<
  HideReviewConfirmationProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const passedReview = route?.params?.review;
  const initialNotes =
    route?.params?.notes ||
    'Verified counter-evidence: Signed digital OTP worksheet (#WS-10483) explicitly documents customer declined heavy-duty class-4 cylinder replacement. Review withheld under refuted claims clause.';

  const reviewData = {
    id: passedReview?.id || 'rev-02',
    code: passedReview?.code || '#REV-88493',
    customerName: passedReview?.reviewerName || passedReview?.customerName || 'Priya Sharma',
    customerInitials:
      passedReview?.reviewerInitials || passedReview?.customerInitials || 'PS',
    customerLocation:
      passedReview?.reviewerLocation ||
      passedReview?.customerLocation ||
      'DLF Phase 2, Gurugram',
    rating: passedReview?.rating !== undefined ? passedReview.rating : 2.0,
    serviceTitle: passedReview?.serviceTitle || 'Hydraulic Replacement',
    serviceCode: passedReview?.serviceCode || '#CC-10483',
    reviewText:
      passedReview?.reviewText ||
      'The technician was late and the repair did not solve the problem. Sinking still occurs.',
    technicianName: passedReview?.reportedBy || passedReview?.technicianName || 'Amit Kumar',
    technicianCsatBefore: '4.82',
    technicianCsatAfter: '4.86',
    csatDelta: '+0.04 pts',
  };

  const [selectedReason, setSelectedReason] = useState<string>('refuted');
  const [internalNotes, setInternalNotes] = useState<string>(initialNotes);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleConfirmHide = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Apply the mutation to the review data object
    const updatedReview = {
      ...reviewData,
      isHidden: true,
      moderationStatus: 'Hidden',
      moderationAction: 'hidden',
      removalReason: selectedReason,
      removalReasonLabel:
        MODERATION_REASONS.find((r) => r.id === selectedReason)?.title ||
        'Misleading or factually refuted information',
      internalNotes: internalNotes,
      hiddenAt: new Date().toISOString(),
      updatedTechnicianCsat: reviewData.technicianCsatAfter,
    };

    // Navigate to A38 — Review Action Completed
    if (navigation) {
      navigation.navigate('ReviewActionCompleted', {
        reviewId: reviewData.id,
        review: updatedReview,
        actionType: 'hide',
        reason: selectedReason,
        notes: internalNotes,
      });
    }
  };

  const handleCancel = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack();
    } else if (navigation) {
      navigation.navigate('ReviewModeration', {
        reviewId: reviewData.id,
        review: reviewData,
      });
    }
  };

  return (
    <View style={styles.backdropContainer}>
      <View
        style={[
          styles.modalSheet,
          isDesktop && styles.modalSheetDesktop,
          { paddingTop: Math.max(insets.top, 8) },
        ]}
      >
        {/* 1. Top App Bar */}
        <View style={styles.topAppBar}>
          <View style={styles.topAppBarLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleCancel}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <AppIcon name="arrow_back" size={20} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Hide Review Confirmation
            </Text>
          </View>

          <View style={styles.topAppBarRight}>
            <TouchableOpacity
              style={styles.moreButton}
              activeOpacity={0.7}
              accessibilityLabel="More options"
            >
              <AppIcon name="more_vert" size={20} />
            </TouchableOpacity>
            <View style={styles.adminAvatar}>
              <AppIcon name="account_circle" size={20} />
            </View>
          </View>
        </View>

        {/* Drag Handle Indicator */}
        <View style={styles.dragHandleWrapper}>
          <View style={styles.dragHandle} />
        </View>

        {/* Scrollable Form Content */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 120 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Warning Banner */}
          <View style={styles.warningBanner}>
            <View style={styles.warningIconBox}>
              <AppIcon name="visibility_off" size={20} />
            </View>
            <View style={styles.warningTextGroup}>
              <View style={styles.badgeRow}>
                <View style={styles.removalActionBadge}>
                  <Text style={styles.removalActionBadgeText}>
                    REMOVAL ACTION
                  </Text>
                </View>
                <Text style={styles.immediateEffectText}>Immediate Effect</Text>
              </View>
              <Text style={styles.warningHeading}>Hide this review?</Text>
              <Text style={styles.warningDescription}>
                The review will no longer be visible to customers or impact
                public technician ratings, but will remain accessible in
                administrative audit logs.
              </Text>
            </View>
          </View>

          {/* Target Review Card */}
          <View style={styles.targetReviewCard}>
            <View style={styles.reviewCardHeader}>
              <View style={styles.userProfileGroup}>
                <View style={styles.userAvatarCircle}>
                  <Text style={styles.userAvatarText}>
                    {reviewData.customerInitials}
                  </Text>
                </View>
                <View>
                  <Text style={styles.userNameText}>
                    {reviewData.customerName}
                  </Text>
                  <View style={styles.locationRow}>
                    <AppIcon name="location_on" size={20} />
                    <Text style={styles.locationText}>
                      {reviewData.customerLocation}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.ratingGroup}>
                {renderStars(reviewData.rating, 14, '#CBD5E1')}
                <Text style={styles.ratingMonoText}>
                  {reviewData.rating.toFixed(1)} / 5.0
                </Text>
              </View>
            </View>

            {/* Pill Badges */}
            <View style={styles.pillBadgesRow}>
              <View style={styles.servicePill}>
                <AppIcon name="build" size={20} />
                <Text style={styles.pillText}>{reviewData.serviceTitle}</Text>
              </View>
              <View style={styles.servicePill}>
                <AppIcon name="receipt" size={20} />
                <Text style={styles.pillText}>{reviewData.serviceCode}</Text>
              </View>
            </View>

            {/* Review Quoted Body */}
            <View style={styles.reviewQuoteBox}>
              <Text style={styles.quoteBodyText}>
                <Text style={styles.quoteMark}>“</Text>
                {reviewData.reviewText.replace(/^“|”$/g, '')}
                <Text style={styles.quoteMark}>”</Text>
              </Text>
            </View>
          </View>

          {/* Reason Selection Group */}
          <View style={styles.reasonCard}>
            <View style={styles.reasonCardHeader}>
              <Text style={styles.reasonTitle}>
                Select Reason for Removal{' '}
                <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.mandatoryBadge}>
                <Text style={styles.mandatoryBadgeText}>Mandatory</Text>
              </View>
            </View>

            <View style={styles.reasonsList}>
              {MODERATION_REASONS.map((reason) => {
                const isSelected = selectedReason === reason.id;
                return (
                  <TouchableOpacity
                    key={reason.id}
                    style={[
                      styles.reasonOptionItem,
                      isSelected && styles.reasonOptionItemSelected,
                    ]}
                    onPress={() => setSelectedReason(reason.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>

                    <View style={styles.reasonTextContainer}>
                      <Text
                        style={[
                          styles.reasonOptionTitle,
                          isSelected && styles.reasonOptionTitleSelected,
                        ]}
                      >
                        {reason.title}
                      </Text>
                      <Text
                        style={[
                          styles.reasonOptionDesc,
                          isSelected && styles.reasonOptionDescSelected,
                        ]}
                      >
                        {reason.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Internal Moderation Notes */}
          <View style={styles.notesCard}>
            <View style={styles.notesCardHeader}>
              <Text style={styles.notesLabel}>
                Internal Moderation Notes{' '}
                <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <Text style={styles.confidentialAuditTag}>CONFIDENTIAL AUDIT</Text>
            </View>

            <TextInput
              style={styles.notesInput}
              value={internalNotes}
              onChangeText={setInternalNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholder="Enter internal moderation rationale..."
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.notesHelpText}>
              Visible to Tier-3 ops administrators and regional audit logs. Not
              visible to customer.
            </Text>
          </View>

          {/* Rating Recalculation Impact Notice */}
          <View style={styles.impactNoticeBox}>
            <AppIcon name="warning" size={20} />
            <View style={styles.impactTextContainer}>
              <Text style={styles.impactTitle}>Rating Recalculation Impact:</Text>
              <Text style={styles.impactBody}>
                Technician score for{' '}
                <Text style={styles.impactTechName}>
                  {reviewData.technicianName}
                </Text>{' '}
                will immediately recalculate from{' '}
                <Text style={styles.impactScoreBefore}>
                  {reviewData.technicianCsatBefore}
                </Text>{' '}
                to{' '}
                <Text style={styles.impactScoreAfter}>
                  {reviewData.technicianCsatAfter} ({reviewData.csatDelta})
                </Text>
                .
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Footer Actions */}
        <View
          style={[
            styles.stickyFooter,
            { paddingBottom: Math.max(insets.bottom, 12) + 8 },
          ]}
        >
          {/* Primary Confirm Button */}
          <TouchableOpacity
            style={[
              styles.confirmButton,
              isSubmitting && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmHide}
            activeOpacity={0.85}
            disabled={isSubmitting}
          >
            <AppIcon name="visibility_off" size={20} />
            <Text style={styles.confirmButtonText}>
              {isSubmitting ? 'Hiding Review...' : 'Hide Review (Confirm)'}
            </Text>
            <AppIcon name="arrow_forward" size={20} />
          </TouchableOpacity>

          {/* Secondary Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel & Return</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdropContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    position: 'relative',
    ...Shadows.level3,
  },
  modalSheetDesktop: {
    height: '96%',
    marginTop: 'auto',
  },

  /* Top App Bar */
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    zIndex: 30,
  },
  topAppBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFont: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 24,
    color: '#334155',
    includeFontPadding: false,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  topAppBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIconFont: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#64748b',
    includeFontPadding: false,
  },
  adminAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  avatarIconFont: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ffffff',
    includeFontPadding: false,
  },

  /* Drag handle */
  dragHandleWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: '#f8fafc',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },

  /* Scroll container */
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 16,
  },

  /* Warning Alert Banner */
  warningBanner: {
    backgroundColor: 'rgba(254, 242, 242, 0.85)',
    borderWidth: 1,
    borderColor: '#fee2e2',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  warningIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#b91c1c',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  warningIconFont: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 26,
    color: '#ffffff',
    includeFontPadding: false,
  },
  warningTextGroup: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  removalActionBadge: {
    backgroundColor: '#b91c1c',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  removalActionBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  immediateEffectText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#b91c1c',
  },
  warningHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 24,
  },
  warningDescription: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 18,
  },

  /* Target Review Card */
  targetReviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    ...Shadows.level1,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  userProfileGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  userNameText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  locationPinIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    color: '#94a3b8',
    includeFontPadding: false,
  },
  locationText: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 11,
    color: '#64748b',
  },
  ratingGroup: {
    alignItems: 'flex-end',
  },
  starRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
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
    color: '#cbd5e1',
    includeFontPadding: false,
  },
  ratingMonoText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  pillBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    color: '#475569',
    includeFontPadding: false,
  },
  pillText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11,
    fontWeight: '500',
    color: '#334155',
  },
  reviewQuoteBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  quoteBodyText: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 12,
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  quoteMark: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'normal',
  },

  /* Reason Selection */
  reasonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    ...Shadows.level1,
  },
  reasonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  reasonTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  requiredAsterisk: {
    color: '#dc2626',
  },
  mandatoryBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mandatoryBadgeText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  reasonsList: {
    gap: 8,
  },
  reasonOptionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  reasonOptionItemSelected: {
    borderColor: '#0f172a',
    borderWidth: 2,
    backgroundColor: '#f8fafc',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioCircleSelected: {
    borderColor: '#0f172a',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0f172a',
  },
  reasonTextContainer: {
    flex: 1,
  },
  reasonOptionTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  reasonOptionTitleSelected: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    color: '#0f172a',
  },
  reasonOptionDesc: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
    lineHeight: 16,
  },
  reasonOptionDescSelected: {
    color: '#475569',
  },

  /* Internal Moderation Notes */
  notesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
    ...Shadows.level1,
  },
  notesCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notesLabel: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  confidentialAuditTag: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  notesInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 12,
    color: '#1e293b',
    lineHeight: 18,
    minHeight: 80,
  },
  notesHelpText: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 10,
    color: '#94a3b8',
    lineHeight: 14,
  },

  /* Impact Notice */
  impactNoticeBox: {
    backgroundColor: 'rgba(254, 243, 199, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.6)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  impactWarningIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#d97706',
    includeFontPadding: false,
    marginTop: 1,
  },
  impactTextContainer: {
    flex: 1,
  },
  impactTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#78350f',
    marginBottom: 2,
  },
  impactBody: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
  },
  impactTechName: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    textDecorationLine: 'underline',
    textDecorationColor: '#f59e0b',
  },
  impactScoreBefore: {
    fontFamily: 'JetBrainsMono-Medium',
    fontWeight: '600',
  },
  impactScoreAfter: {
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
    color: '#0f172a',
  },

  /* Sticky Footer Actions */
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
    zIndex: 40,
    ...Shadows.level2,
  },
  confirmButton: {
    backgroundColor: '#b91c1c',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },
  confirmButtonText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
});
