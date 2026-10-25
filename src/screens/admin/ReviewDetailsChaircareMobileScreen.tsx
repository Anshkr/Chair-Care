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

interface ReviewDetailsScreenProps {
  navigation?: any;
  route?: {
    params?: {
      reviewId?: string;
      review?: any;
    };
  };
}

export const ReviewDetailsChaircareMobileScreen: React.FC<
  ReviewDetailsScreenProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const passedReview = route?.params?.review;

  // Pulse animation for status indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Selected review context with reference default fallback
  const reviewData = {
    id: passedReview?.id || 'rev-01',
    code: passedReview?.code || '#REV-88492',
    status: passedReview?.status || (passedReview?.isReported ? 'Reported' : 'Published'),
    isVerifiedPurchase: true,
    auditScore: '99.8%',
    node: 'DEL-NCR-04',
    rating: passedReview?.rating !== undefined ? passedReview.rating : 5.0,
    reviewText:
      passedReview?.reviewText ||
      '“Very professional and fixed the chair quickly. Explained the issue clearly and completed everything on time.”',
    customerName: passedReview?.reviewerName || 'Ansh Kumar',
    customerCode: '#CUST-7741',
    customerTier: 'Tier-1 Client',
    customerPhone: '+91 98201 44810',
    customerLocation: passedReview?.reviewerLocation || 'Sector 54, Gurugram',
    customerReviewsCount: '14 Reviews Logged',
    customerAvgRating: '4.9 Avg Given',
    serviceTitle: passedReview?.serviceTitle || 'Office Chair Repair',
    serviceSubtitle: 'Class-4 Hydraulic & Tilt Calibration',
    serviceCode: passedReview?.serviceCode || '#CC-10482',
    completedDate: '12 Oct 2026 • 03:14 PM IST',
    settlementAmount: '₹749 (Escrow Cleared)',
    technicianName: passedReview?.technicianName || 'Rahul Sharma',
    technicianRole: 'Master Tech • BIFMA Certified',
    technicianVan: 'VAN #04',
    technicianRating: '4.9',
    technicianJobs: '(320 jobs performed)',
    submissionTimestamp: passedReview?.publishedDate || '12 Oct 2026 • 6:42 PM IST',
    clientDevice: 'iOS v2.4 • Geofence Match',
    automatedModeration: 'Sentiment Pass (99.8%)',
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleKeepPublished = () => {
    showToast(`Review ${reviewData.code} re-verified and kept live.`);
  };

  const handleFlagSupervisory = () => {
    showToast('Escalated to Supervisory QA Queue with high priority.');
    // Optionally navigate forward to A36
    setTimeout(() => {
      if (navigation) {
        navigation.navigate('ReviewModeration', {
          reviewId: reviewData.id,
          review: reviewData,
        });
      }
    }, 800);
  };

  const handleHideReview = () => {
    // Navigate forward to A36 / Hide Review Confirmation
    if (navigation) {
      navigation.navigate('ReviewModeration', {
        reviewId: reviewData.id,
        review: reviewData,
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
                navigation?.navigate('ReviewsRatings');
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Review Details
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
        {/* 2. Sub-header Identity Strip */}
        <View style={styles.identityStrip}>
          <View style={styles.identityTopRow}>
            <View style={styles.identityCodeRow}>
              <View style={styles.codeTag}>
                <Text style={styles.codeTagText}>{reviewData.code}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Animated.View
                  style={[styles.statusPulseDot, { opacity: pulseAnim }]}
                />
                <Text style={styles.statusBadgeText}>{reviewData.status}</Text>
              </View>
            </View>

            <View style={styles.verifiedPurchaseBadge}>
              <AppIcon name="verified" size={20} />
              <Text style={styles.verifiedPurchaseText}>Verified Purchase</Text>
            </View>
          </View>

          <View style={styles.identityBottomRow}>
            <Text style={styles.identityMetaText}>
              AUDIT SCORE: {reviewData.auditScore}
            </Text>
            <Text style={styles.identityMetaText}>
              ZONE: {reviewData.node}
            </Text>
          </View>
        </View>

        {/* 3. Rating & Testimonial Hero Card */}
        <View style={styles.testimonialCard}>
          {/* Watermark Quote Icon */}
          <View style={styles.watermarkQuoteContainer}>
            <AppIcon name="format_quote" size={20} />
          </View>

          <View style={styles.testimonialContent}>
            {/* Stars & Numerical Rating */}
            <View style={styles.ratingRow}>
              <View style={styles.starsGroup}>
                {[1, 2, 3, 4, 5].map((idx) => {
                  const isFilled = idx <= Math.floor(reviewData.rating);
                  const isHalf = !isFilled && idx - 0.5 <= reviewData.rating;
                  return (
                    <AppIcon
                      key={idx}
                      name={isFilled ? 'Star' : isHalf ? 'StarHalf' : 'Star'}
                      size={20}
                      color={isFilled || isHalf ? '#F59E0B' : '#CBD5E1'}
                      fill={isFilled || isHalf ? '#F59E0B' : 'none'}
                    />
                  );
                })}
              </View>

              <View style={styles.scoreTextGroup}>
                <Text style={styles.scoreValue}>
                  {reviewData.rating.toFixed(1)}
                </Text>
                <Text style={styles.scoreScale}>/ 5.0</Text>
              </View>
            </View>

            {/* Quote Body */}
            <Text style={styles.quoteBodyText}>{reviewData.reviewText}</Text>

            {/* Ergonomic Experience Tags */}
            <View style={styles.experienceTagsRow}>
              <View style={styles.expTag}>
                <AppIcon name="schedule" size={20} />
                <Text style={styles.expTagText}>Prompt Arrival</Text>
              </View>

              <View style={styles.expTag}>
                <AppIcon name="cleaning_services" size={20} />
                <Text style={styles.expTagText}>Clean Workmanship</Text>
              </View>

              <View style={styles.expTag}>
                <AppIcon name="verified_user" size={20} />
                <Text style={styles.expTagText}>Genuine OEM Parts</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4. Customer Profile Card */}
        <View style={styles.customerCard}>
          <View style={styles.customerHeaderRow}>
            <View style={styles.customerHeaderLeft}>
              <View style={styles.customerAvatarBox}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                  }}
                  style={styles.customerAvatarImg}
                  resizeMode="cover"
                />
                <View style={styles.avatarCheckBadge}>
                  <AppIcon name="check" size={20} />
                </View>
              </View>
              <View>
                <Text style={styles.customerNameText}>
                  {reviewData.customerName}
                </Text>
                <Text style={styles.customerCodeText}>
                  {reviewData.customerCode}
                </Text>
              </View>
            </View>
            <View style={styles.clientTierBadge}>
              <Text style={styles.clientTierText}>
                {reviewData.customerTier}
              </Text>
            </View>
          </View>

          <View style={styles.customerInfoGrid}>
            <View style={styles.customerInfoBox}>
              <AppIcon name="call" size={20} />
              <Text style={styles.customerInfoTextMono} numberOfLines={1}>
                {reviewData.customerPhone}
              </Text>
            </View>
            <View style={styles.customerInfoBox}>
              <AppIcon name="near_me" size={20} />
              <Text style={styles.customerInfoText} numberOfLines={1}>
                {reviewData.customerLocation}
              </Text>
            </View>
          </View>

          <View style={styles.customerStatsFooter}>
            <View style={styles.statsLeftItem}>
              <AppIcon name="rate_review" size={20} />
              <Text style={styles.statsText}>
                {reviewData.customerReviewsCount}
              </Text>
            </View>
            <View style={styles.statsRightItem}>
              <AppIcon name="star" size={20} />
              <Text style={styles.statsAvgText}>
                {reviewData.customerAvgRating}
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Service & Dispatch Card */}
        <View style={styles.serviceCard}>
          <View style={styles.serviceHeaderRow}>
            <View style={styles.serviceHeaderLeft}>
              <View style={styles.chairIconBox}>
                <AppIcon name="chair" size={20} />
              </View>
              <View>
                <Text style={styles.serviceTitleText}>
                  {reviewData.serviceTitle}
                </Text>
                <Text style={styles.serviceSubtitleText}>
                  {reviewData.serviceSubtitle}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.serviceCodeBtn}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('ServiceRequestDetails');
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.serviceCodeBtnText}>
                {reviewData.serviceCode}
              </Text>
              <AppIcon name="arrow_outward" size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.serviceDetailsList}>
            <View style={styles.serviceDetailRow}>
              <View style={styles.detailLabelRow}>
                <AppIcon name="event" size={20} />
                <Text style={styles.detailLabelText}>Completed</Text>
              </View>
              <Text style={styles.detailValueText}>
                {reviewData.completedDate}
              </Text>
            </View>

            <View style={styles.serviceDetailRow}>
              <View style={styles.detailLabelRow}>
                <AppIcon name="payments" size={20} />
                <Text style={styles.detailLabelText}>Settlement</Text>
              </View>
              <Text style={styles.detailValueTextGreen}>
                {reviewData.settlementAmount}
              </Text>
            </View>
          </View>
        </View>

        {/* 6. Technician Details Card */}
        <View style={styles.technicianCard}>
          <View style={styles.techHeaderRow}>
            <View style={styles.techHeaderLeft}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
                }}
                style={styles.techAvatarImg}
                resizeMode="cover"
              />
              <View style={styles.techNameGroup}>
                <View style={styles.techNameVerifiedRow}>
                  <Text style={styles.techNameText}>
                    {reviewData.technicianName}
                  </Text>
                  <AppIcon name="verified" size={20} />
                </View>
                <Text style={styles.techRoleText}>
                  {reviewData.technicianRole}
                </Text>
              </View>
            </View>
            <View style={styles.vanTag}>
              <Text style={styles.vanTagText}>{reviewData.technicianVan}</Text>
            </View>
          </View>

          <View style={styles.techFooterRow}>
            <View style={styles.techRatingGroup}>
              <AppIcon name="star" size={20} />
              <Text style={styles.techRatingNumber}>
                {reviewData.technicianRating}
              </Text>
              <Text style={styles.techJobsText}>{reviewData.technicianJobs}</Text>
            </View>
            <TouchableOpacity style={styles.gpsTrailLink} activeOpacity={0.7}>
              <Text style={styles.gpsTrailText}>GPS Trail</Text>
              <AppIcon name="location_searching" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 7. Review Audit Metadata Matrix */}
        <View style={styles.auditMatrixCard}>
          <View style={styles.auditHeaderRow}>
            <View style={styles.auditHeaderLeft}>
              <AppIcon name="history_edu" size={20} />
              <Text style={styles.auditHeaderTitle}>
                DISPATCH AUDIT METRICS
              </Text>
            </View>
            <Text style={styles.auditShaText}>SHA256: VALID</Text>
          </View>

          <View style={styles.auditList}>
            <View style={styles.auditRow}>
              <Text style={styles.auditRowLabel}>Submission Timestamp</Text>
              <Text style={styles.auditRowValue}>
                {reviewData.submissionTimestamp}
              </Text>
            </View>

            <View style={styles.auditRow}>
              <Text style={styles.auditRowLabel}>Client Device / Telemetry</Text>
              <Text style={styles.auditRowValue} numberOfLines={1}>
                {reviewData.clientDevice}
              </Text>
            </View>

            <View style={styles.auditRow}>
              <Text style={styles.auditRowLabel}>Automated Moderation</Text>
              <Text style={styles.auditRowValueGreen}>
                {reviewData.automatedModeration}
              </Text>
            </View>
          </View>
        </View>

        {/* 8. Administrative Action Controls Panel */}
        <View style={styles.adminActionsCard}>
          <View style={styles.adminActionsHeader}>
            <Text style={styles.adminActionsTitle}>Super Admin Actions</Text>
            <View style={styles.secLvlBadge}>
              <Text style={styles.secLvlText}>SEC-LVL 4</Text>
            </View>
          </View>

          {/* Action 1: Keep Published */}
          <TouchableOpacity
            style={styles.keepPublishedBtn}
            onPress={handleKeepPublished}
            activeOpacity={0.85}
          >
            <View style={styles.actionBtnLeft}>
              <AppIcon name="check_circle" size={20} />
              <Text style={styles.keepPublishedText}>
                Keep Published (Active Live)
              </Text>
            </View>
            <AppIcon name="done" size={20} />
          </TouchableOpacity>

          {/* Action 2: Flag for Supervisory Review */}
          <TouchableOpacity
            style={styles.flagSupervisoryBtn}
            onPress={handleFlagSupervisory}
            activeOpacity={0.85}
          >
            <View style={styles.actionBtnLeft}>
              <AppIcon name="flag" size={20} />
              <Text style={styles.flagSupervisoryText}>
                Flag for Supervisory Review
              </Text>
            </View>
            <AppIcon name="chevron_right" size={20} />
          </TouchableOpacity>

          {/* Action 3: Hide Review from Public Index */}
          <TouchableOpacity
            style={styles.hideReviewBtn}
            onPress={handleHideReview}
            activeOpacity={0.85}
          >
            <View style={styles.actionBtnLeft}>
              <AppIcon name="visibility_off" size={20} />
              <Text style={styles.hideReviewText}>
                Hide Review from Public Index
              </Text>
            </View>
            <AppIcon name="report" size={20} />
          </TouchableOpacity>

          {/* Compliance Note */}
          <View style={styles.complianceNoteRow}>
            <AppIcon name="lock_clock" size={20} />
            <Text style={styles.complianceNoteText}>
              Administrative state alterations are logged in the 256-bit
              immutable platform audit chain with active technician GPS
              correlates.
            </Text>
          </View>
        </View>

        {/* 9. Feedback Toast Banner */}
        {toastMessage && (
          <View style={styles.toastBanner}>
            <View style={styles.toastLeft}>
              <AppIcon name="info" size={20} />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
            <TouchableOpacity onPress={() => setToastMessage(null)}>
              <AppIcon name="close" size={20} />
            </TouchableOpacity>
          </View>
        )}
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

  /* Identity Strip */
  identityStrip: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    ...Shadows.level1,
  },
  identityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identityCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeTag: {
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  codeTagText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(111, 251, 190, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#009668',
  },
  statusBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#009668',
  },
  verifiedPurchaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(111, 251, 190, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#009668',
    includeFontPadding: false,
  },
  verifiedPurchaseText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#009668',
  },
  identityBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  identityMetaText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },

  /* Testimonial Card */
  testimonialCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  watermarkQuoteContainer: {
    position: 'absolute',
    top: -12,
    right: -12,
    opacity: 0.12,
  },
  watermarkQuoteIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 100,
    color: '#e6e8ea',
    includeFontPadding: false,
  },
  testimonialContent: {
    zIndex: 2,
    gap: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  starsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 26,
    color: '#f59e0b',
    includeFontPadding: false,
  },
  scoreTextGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  scoreValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 20,
    fontWeight: '700',
    color: '#191c1e',
  },
  scoreScale: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },
  quoteBodyText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '600',
    color: '#191c1e',
  },
  experienceTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 4,
  },
  expTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eceef0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expTagIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#0051d5',
    includeFontPadding: false,
  },
  expTagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#45464d',
  },

  /* Customer Card */
  customerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  customerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatarBox: {
    position: 'relative',
  },
  customerAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e0e3e5',
  },
  avatarCheckBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0051d5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
    includeFontPadding: false,
  },
  customerNameText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  customerCodeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },
  clientTierBadge: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  clientTierText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#003ea8',
  },
  customerInfoGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  customerInfoBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f2f4f6',
    padding: 10,
    borderRadius: 12,
  },
  customerInfoIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
  },
  customerInfoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#191c1e',
    flexShrink: 1,
  },
  customerInfoTextMono: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#191c1e',
    flexShrink: 1,
  },
  customerStatsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(230, 232, 234, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statsLeftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#45464d',
    includeFontPadding: false,
  },
  statsText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#45464d',
  },
  statsRightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsStarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#f59e0b',
    includeFontPadding: false,
  },
  statsAvgText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },

  /* Service & Dispatch Card */
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  serviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  chairIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chairIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#191c1e',
    includeFontPadding: false,
  },
  serviceTitleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: '#191c1e',
  },
  serviceSubtitleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  serviceCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#eceef0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  serviceCodeBtnText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#0051d5',
  },
  arrowOutwardIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#0051d5',
    includeFontPadding: false,
  },
  serviceDetailsList: {
    gap: 8,
  },
  serviceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#45464d',
    includeFontPadding: false,
  },
  detailLabelText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  detailValueText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#191c1e',
  },
  detailValueTextGreen: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#009668',
  },

  /* Technician Card */
  technicianCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  techHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  techAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e0e3e5',
  },
  techNameGroup: {
    flex: 1,
  },
  techNameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  techNameText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  techVerifiedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#0051d5',
    includeFontPadding: false,
  },
  techRoleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  vanTag: {
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  vanTagText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#191c1e',
  },
  techFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    padding: 10,
    borderRadius: 12,
  },
  techRatingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  techStarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#f59e0b',
    includeFontPadding: false,
  },
  techRatingNumber: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  techJobsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  gpsTrailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gpsTrailText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#0051d5',
  },
  gpsTrailIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#0051d5',
    includeFontPadding: false,
  },

  /* Audit Matrix Card */
  auditMatrixCard: {
    backgroundColor: '#eceef0',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  auditHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  auditHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  auditEduIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#45464d',
    includeFontPadding: false,
  },
  auditHeaderTitle: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#45464d',
    letterSpacing: 0.6,
  },
  auditShaText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
  },
  auditList: {
    gap: 8,
    paddingTop: 4,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  auditRowLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  auditRowValue: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#191c1e',
  },
  auditRowValueGreen: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    color: '#009668',
  },

  /* Super Admin Actions Panel */
  adminActionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  adminActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 2,
  },
  adminActionsTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: '#191c1e',
  },
  secLvlBadge: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  secLvlText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#003ea8',
  },
  keepPublishedBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(111, 251, 190, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  actionBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCheckCircleIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#009668',
    includeFontPadding: false,
  },
  keepPublishedText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#009668',
  },
  actionDoneIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#009668',
    includeFontPadding: false,
  },
  flagSupervisoryBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#eceef0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  actionFlagIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
    includeFontPadding: false,
  },
  flagSupervisoryText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },
  actionChevronIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#45464d',
    includeFontPadding: false,
  },
  hideReviewBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#ffdad6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  actionHideIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#93000a',
    includeFontPadding: false,
  },
  hideReviewText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#93000a',
  },
  actionReportIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#93000a',
    includeFontPadding: false,
  },
  complianceNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 4,
  },
  lockClockIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#76777d',
    includeFontPadding: false,
    marginTop: 1,
  },
  complianceNoteText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: '#45464d',
  },

  /* Toast Banner */
  toastBanner: {
    backgroundColor: '#191c1e',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.level3,
  },
  toastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  toastInfoIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#6ffbbe',
    includeFontPadding: false,
  },
  toastText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#ffffff',
    flexShrink: 1,
  },
  toastCloseIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#ffffff',
    includeFontPadding: false,
  },
});
