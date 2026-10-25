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
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface ReviewActionCompletedProps {
  navigation?: any;
  route?: {
    params?: {
      reviewId?: string;
      review?: any;
      actionType?: string;
      reason?: string;
      notes?: string;
    };
  };
}

export const ReviewActionCompletedChaircareMobileScreen: React.FC<
  ReviewActionCompletedProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const passedReview = route?.params?.review;
  const passedReason = route?.params?.reason;
  const passedNotes = route?.params?.notes;

  // Pulse & scale animations for celebratory checkmark
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState<boolean>(false);

  useEffect(() => {
    // Entrance bounce
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim, scaleAnim]);

  const handleInspectAuditDossier = () => {
    setShowToast(true);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowToast(false);
    });
  };

  const reviewData = {
    id: passedReview?.id || 'rev-02',
    code: passedReview?.code || '#REV-88493',
    customerName: passedReview?.customerName || passedReview?.reviewerName || 'Priya Sharma',
    customerInitials:
      passedReview?.customerInitials || passedReview?.reviewerInitials || 'PS',
    rating: passedReview?.rating !== undefined ? passedReview.rating : 2.0,
    chairModel: passedReview?.chairModel || 'Herman Miller Aeron • B-Size Graphite',
    serviceTicket:
      passedReview?.serviceTitle && passedReview?.serviceCode
        ? `${passedReview.serviceTitle} ${passedReview.serviceCode}`
        : 'Hydraulic Replacement #CC-10483',
    technicianName:
      passedReview?.technicianName || passedReview?.reportedBy || 'Amit Kumar',
    technicianRole: 'SR. FIELD SPEC',
    technicianCsatBefore: '4.80 / 5.0',
    technicianCsatAfter: '4.84 / 5.0',
    csatDelta: '+0.04 DELTA',
    corridorName: 'Gurugram Central',
    corridorSla: '99.2% Nominal',
    ledgerId: '#9102',
    justification:
      passedReview?.removalReasonLabel ||
      (passedReason === 'refuted'
        ? 'Factually Refuted by Signed Worksheet (Ref: #WS-9912)'
        : passedReason === 'offensive'
        ? 'Inappropriate / offensive content'
        : passedReason === 'spam'
        ? 'Spam or advertising'
        : passedReason === 'pii'
        ? 'Personal information (PII)'
        : passedReason === 'policy'
        ? 'Platform policy violation'
        : 'Factually Refuted by Signed Worksheet (Ref: #WS-9912)'),
    effectiveTime: 'Today, 12 Oct 2026 • 10:31 AM IST',
    sessionAuth: 'Super Admin (Session #SA-01)',
  };

  const handleBackToReviews = () => {
    if (navigation) {
      navigation.navigate('ReviewsRatings');
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* Top Close Floating Button */}
      <View
        style={[
          styles.floatingCloseContainer,
          { top: Math.max(insets.top, 12) },
        ]}
      >
        <TouchableOpacity
          style={styles.floatingCloseButton}
          onPress={handleBackToReviews}
          activeOpacity={0.7}
          accessibilityLabel="Close Screen"
        >
          <AppIcon name="close" size={20} />
        </TouchableOpacity>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
          {
            paddingTop: Math.max(insets.top, 16) + 40,
            paddingBottom: Math.max(insets.bottom, 20) + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Audit Clearance Status Indicator */}
        <View style={styles.auditStatusRow}>
          <View style={styles.auditLoggedBadge}>
            <AppIcon name="verified_user" size={20} />
            <Text style={styles.auditLoggedText}>
              AUDIT LOGGED • IMMUTABLE RECORD
            </Text>
          </View>

          <View style={styles.ledgerBadge}>
            <View style={styles.ledgerPulseDot} />
            <Text style={styles.ledgerText}>LEDGER {reviewData.ledgerId}</Text>
          </View>
        </View>

        {/* 2. Success Hero Header */}
        <View style={styles.successHeroContainer}>
          <View style={styles.emblemWrapper}>
            <Animated.View
              style={[
                styles.emblemPulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.2],
                    outputRange: [0.6, 0.1],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.emblemCircle,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <AppIcon name="check_circle" size={20} />
            </Animated.View>
          </View>

          <Text style={styles.successTitle}>Review Concealed Successfully</Text>
          <Text style={styles.successSubtitle}>
            The feedback has been masked from public customer profiles and
            archived in the administrative compliance ledger.
          </Text>
        </View>

        {/* 3. Action Execution Manifest Card */}
        <View style={styles.manifestCard}>
          <View style={styles.manifestHeader}>
            <View style={styles.manifestHeaderLeft}>
              <AppIcon name="inventory_2" size={20} />
              <Text style={styles.manifestHeaderTitle}>
                ACTION EXECUTION MANIFEST
              </Text>
            </View>
            <View style={styles.committedBadge}>
              <Text style={styles.committedBadgeText}>COMMITTED</Text>
            </View>
          </View>

          {/* Reviewer Context Mini Row */}
          <View style={styles.reviewerMiniRow}>
            <View style={styles.reviewerAvatarCircle}>
              <Text style={styles.reviewerAvatarText}>
                {reviewData.customerInitials}
              </Text>
            </View>
            <View style={styles.reviewerInfo}>
              <View style={styles.reviewerNameRow}>
                <Text style={styles.reviewerName} numberOfLines={1}>
                  {reviewData.customerName}
                </Text>
                <View style={styles.maskedRatingBadge}>
                  <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.maskedRatingText}>
                    {reviewData.rating.toFixed(1)} (Masked)
                  </Text>
                </View>
              </View>
              <Text style={styles.chairModelText} numberOfLines={1}>
                {reviewData.chairModel}
              </Text>
            </View>
          </View>

          {/* Structured Data Grid */}
          <View style={styles.dataGrid}>
            <View style={styles.dataGridRow}>
              <Text style={styles.dataGridLabel}>Service Ticket</Text>
              <Text style={styles.dataGridValueMono}>
                {reviewData.serviceTicket}
              </Text>
            </View>

            <View style={styles.dataGridRow}>
              <Text style={styles.dataGridLabel}>Action Executed</Text>
              <View style={styles.actionExecutedValue}>
                <AppIcon name="visibility_off" size={20} />
                <Text style={styles.actionExecutedText}>
                  Masked from Directory
                </Text>
              </View>
            </View>

            <View style={styles.dataGridRow}>
              <Text style={styles.dataGridLabel}>Authorized By</Text>
              <Text style={styles.dataGridValueMono}>
                {reviewData.sessionAuth}
              </Text>
            </View>

            <View style={styles.dataGridRow}>
              <Text style={styles.dataGridLabel}>Effective Timestamp</Text>
              <Text style={styles.dataGridValueMono}>
                {reviewData.effectiveTime}
              </Text>
            </View>

            <View style={styles.dataGridJustificationBlock}>
              <Text style={styles.justificationLabel}>
                LOGGED JUSTIFICATION
              </Text>
              <View style={styles.justificationValueRow}>
                <AppIcon name="assignment_turned_in" size={20} />
                <Text style={styles.justificationText}>
                  {reviewData.justification}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4. Fleet Metric Impact Card */}
        <View style={styles.fleetCard}>
          <View style={styles.fleetHeader}>
            <View style={styles.fleetHeaderLeft}>
              <AppIcon name="query_stats" size={20} />
              <Text style={styles.fleetTitle}>Fleet Metric Recalibration</Text>
            </View>
            <View style={styles.automatedBadge}>
              <Text style={styles.automatedBadgeText}>AUTOMATED</Text>
            </View>
          </View>

          {/* Technician Score Restoration Box */}
          <View style={styles.techRestoreBox}>
            <View style={styles.techProfileRow}>
              <View style={styles.techAvatarCircle}>
                <Text style={styles.techAvatarText}>AK</Text>
              </View>
              <View style={styles.techInfo}>
                <View style={styles.techNameRow}>
                  <Text style={styles.techName}>{reviewData.technicianName}</Text>
                  <Text style={styles.techRoleBadge}>
                    {reviewData.technicianRole}
                  </Text>
                </View>
                <Text style={styles.techStatusSubtext}>Rating Restored</Text>
              </View>
            </View>

            {/* Score Delta Display */}
            <View style={styles.scoreDeltaRow}>
              <View style={styles.scoreComparison}>
                <Text style={styles.scoreBefore}>
                  {reviewData.technicianCsatBefore}
                </Text>
                <AppIcon name="trending_up" size={20} />
                <Text style={styles.scoreAfter}>
                  {reviewData.technicianCsatAfter}
                </Text>
              </View>
              <View style={styles.deltaBadge}>
                <Text style={styles.deltaBadgeText}>{reviewData.csatDelta}</Text>
              </View>
            </View>
          </View>

          {/* Corridor Telemetry Readout */}
          <View style={styles.corridorBox}>
            <View style={styles.corridorLeft}>
              <AppIcon name="location_on" size={20} />
              <View>
                <Text style={styles.corridorName}>
                  {reviewData.corridorName}
                </Text>
                <Text style={styles.corridorLabel}>OPERATIONAL CORRIDOR</Text>
              </View>
            </View>
            <View style={styles.corridorRight}>
              <Text style={styles.corridorSla}>{reviewData.corridorSla}</Text>
              <Text style={styles.corridorLabel}>SLA ADHERENCE</Text>
            </View>
          </View>
        </View>

        {/* 5. State Versatility Callout */}
        <View style={styles.versatilityCallout}>
          <AppIcon name="dynamic_form" size={20} />
          <View style={styles.versatilityTextGroup}>
            <Text style={styles.versatilityTitle}>
              ADMINISTRATIVE FLOW STATE
            </Text>
            <Text style={styles.versatilityDesc}>
              This view also formats dynamically for{' '}
              <Text style={styles.boldCallout}>
                “Review Approved & Retained”
              </Text>{' '}
              and{' '}
              <Text style={styles.boldCallout}>“Report Dismissed”</Text>{' '}
              moderation outcomes.
            </Text>
          </View>
        </View>

        {/* 6. Action Controls */}
        <View style={styles.actionsContainer}>
          {/* Primary CTA */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleBackToReviews}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              Back to Reviews & Ratings
            </Text>
            <AppIcon name="arrow_forward" size={20} />
          </TouchableOpacity>

          {/* Secondary CTA */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleInspectAuditDossier}
            activeOpacity={0.7}
          >
            <AppIcon name="verified" size={20} />
            <Text style={styles.secondaryButtonText}>
              Inspect Audit Dossier
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Toast Feedback Banner */}
      {showToast && (
        <Animated.View
          style={[
            styles.toastBanner,
            {
              bottom: Math.max(insets.bottom, 20) + 20,
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <AppIcon name="policy" size={20} />
          <View style={styles.toastTextGroup}>
            <Text style={styles.toastTitle}>DOSSIER DISPATCHED</Text>
            <Text style={styles.toastDesc}>
              Cryptographic hash record sent to Super Admin email ledger.
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f7f9fb',
    position: 'relative',
  },

  /* Floating Close Button */
  floatingCloseContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 50,
  },
  floatingCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(236, 238, 240, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  closeIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#45464d',
    includeFontPadding: false,
  },

  /* Scroll container */
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  scrollContentDesktop: {
    paddingHorizontal: 24,
  },

  /* 1. Audit Clearance Status Indicator */
  auditStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  auditLoggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#e6e8ea',
  },
  auditShieldIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#009668',
    includeFontPadding: false,
  },
  auditLoggedText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    fontWeight: '500',
    color: '#45464d',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  ledgerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#dbe1ff',
  },
  ledgerPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0051d5',
  },
  ledgerText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#00174b',
  },

  /* 2. Success Hero Header */
  successHeroContainer: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  emblemWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  emblemPulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6ffbbe',
  },
  emblemCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6ffbbe',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  emblemCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 44,
    color: '#002113',
    includeFontPadding: false,
  },
  successTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 24,
    fontWeight: '700',
    color: '#191c1e',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  successSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#45464d',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
  },

  /* 3. Action Execution Manifest Card */
  manifestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  manifestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    marginHorizontal: -16,
    marginTop: -16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  manifestHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manifestHeaderIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
  },
  manifestHeaderTitle: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#45464d',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  committedBadge: {
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  committedBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#002113',
  },

  /* Reviewer Context Mini Row */
  reviewerMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f2f4f6',
  },
  reviewerAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#316bf3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerAvatarText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewerName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: '#191c1e',
  },
  maskedRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  maskedStarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  maskedRatingText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#ba1a1a',
  },
  chairModelText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
    marginTop: 1,
  },

  /* Structured Data Grid */
  dataGrid: {
    gap: 6,
  },
  dataGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#eceef0',
  },
  dataGridLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  dataGridValueMono: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#191c1e',
  },
  actionExecutedValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionExecutedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#0051d5',
    includeFontPadding: false,
  },
  actionExecutedText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#0051d5',
  },
  dataGridJustificationBlock: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#eceef0',
    gap: 4,
  },
  justificationLabel: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#45464d',
    letterSpacing: 0.5,
  },
  justificationValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  justificationIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#009668',
    includeFontPadding: false,
    marginTop: 1,
  },
  justificationText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#191c1e',
    flex: 1,
    lineHeight: 17,
  },

  /* 4. Fleet Metric Impact Card */
  fleetCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    ...Shadows.level1,
  },
  fleetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  fleetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fleetStatsIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#009668',
    includeFontPadding: false,
  },
  fleetTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: '#191c1e',
  },
  automatedBadge: {
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  automatedBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#002113',
  },

  /* Technician Score Restore */
  techRestoreBox: {
    backgroundColor: '#f2f4f6',
    padding: 10,
    borderRadius: 12,
    gap: 8,
  },
  techProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  techAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#191c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  techAvatarText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  techInfo: {
    flex: 1,
  },
  techNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#191c1e',
  },
  techRoleBadge: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
    textTransform: 'uppercase',
  },
  techStatusSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464d',
  },
  scoreDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    ...Shadows.level1,
  },
  scoreComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreBefore: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 12,
    color: '#76777d',
    textDecorationLine: 'line-through',
  },
  trendingUpIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#009668',
    includeFontPadding: false,
  },
  scoreAfter: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#191c1e',
  },
  deltaBadge: {
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deltaBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#002113',
  },

  /* Corridor Box */
  corridorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f2f4f6',
  },
  corridorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  corridorPinIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
  },
  corridorName: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    fontWeight: '500',
    color: '#191c1e',
  },
  corridorLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9,
    color: '#45464d',
    letterSpacing: 0.5,
  },
  corridorRight: {
    alignItems: 'flex-end',
  },
  corridorSla: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#009668',
  },

  /* 5. Versatility Callout */
  versatilityCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#e6e8ea',
  },
  versatilityIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
    marginTop: 1,
  },
  versatilityTextGroup: {
    flex: 1,
  },
  versatilityTitle: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  versatilityDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
    lineHeight: 17,
  },
  boldCallout: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: '#191c1e',
  },

  /* 6. Action Controls */
  actionsContainer: {
    gap: 8,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  primaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  primaryButtonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },
  secondaryButton: {
    backgroundColor: '#e0e3e5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#191c1e',
  },
  secondaryButtonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
    includeFontPadding: false,
  },

  /* Toast Notification */
  toastBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#131b2e',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 100,
    ...Shadows.level3,
  },
  toastIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#6ffbbe',
    includeFontPadding: false,
  },
  toastTextGroup: {
    flex: 1,
  },
  toastTitle: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#6ffbbe',
    letterSpacing: 0.5,
  },
  toastDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#eff1f3',
    marginTop: 1,
  },
});
