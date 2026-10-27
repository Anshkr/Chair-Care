import { AppIcon } from '../../components/common/AppIcon';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useBooking } from '../../context/BookingContext';
import { DisputeTicketModal } from '../../components/customer/DisputeTicketModal';

/**
 * Screen ID: C14
 * Title: Service Completed
 * Reference: design-reference/customer/service_completed_chaircare_mobile
 */
export const ServiceCompletedChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { draft } = useBooking();
  const [isDisputeModalOpen, setIsDisputeModalOpen] = React.useState(false);

  const technician = {
    name: 'Certified Partner Specialist',
    rating: 4.95,
    completedJobsCount: 140,
    phone: '+91 800 555 0199',
  };

  const serviceTitle = draft?.serviceTitle || 'Office Chair Calibration & Overhaul';
  const serviceTotal = draft?.estimatedTotal ? `₹${draft.estimatedTotal}` : '₹599';

  const handleReviewAndPay = () => {
    navigation.navigate('PaymentInvoice');
  };

  return (
    <ScreenContainer hasPadding={false}>
      {/* Fixed Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.brandSubtitle}>ErgoFix Pro</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Service Completed
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('CustomerProfileTab')}
          activeOpacity={0.7}
          accessibilityLabel="Customer Profile"
        >
          <AppIcon name="User" size={18} color="#FFFFFF" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration / Ready Header Section */}
        <View style={styles.celebrationSection}>
          <View style={styles.concentricGlowWrap}>
            <View style={styles.concentricPulseRing} />
            <View style={styles.concentricGlowCircle} />
            <View style={styles.concentricCore}>
              <View style={styles.concentricInnerRing}>
                <AppIcon name="Check" size={28} />
              </View>
            </View>
          </View>

          <View style={styles.testedPill}>
            <View style={styles.testedDot} />
            <Text style={styles.testedPillText}>SERVICE DONE • 100% TESTED</Text>
          </View>

          <Text style={styles.celebrationHeading}>Your chair is ready!</Text>
          <Text style={styles.celebrationSub}>
            The technician has completed the service. Please review the work
            before making your payment.
          </Text>

          <View style={styles.timeTagBadge}>
            <AppIcon name="Clock" size={18} />
            <Text style={styles.timeTagText}>Completed: Today, 04:15 PM</Text>
          </View>
        </View>

        {/* Technician Summary Card */}
        <View style={styles.techCard}>
          <View style={styles.techAvatarWrap}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              }}
              style={styles.techAvatar}
            />
            <View style={styles.verifiedMiniBadge}>
              <AppIcon name="Check" size={14} />
            </View>
          </View>

          <View style={styles.techMeta}>
            <View style={styles.techNameRow}>
              <Text style={styles.techNameText}>{technician.name}</Text>
              <View style={styles.bifmaBadge}>
                <Text style={styles.bifmaBadgeText}>BIFMA Master</Text>
              </View>
            </View>
            <Text style={styles.techSpecialty}>
              Office Chair Calibration & Mechanics
            </Text>
            <View style={styles.techMetricsRow}>
              <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingNumber}>
                {technician.rating.toFixed(1)}
              </Text>
              <Text style={styles.reviewsCount}>(420 reviews)</Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.completedCount}>
                {technician.completedJobsCount}+ completed
              </Text>
            </View>
          </View>
        </View>

        {/* Work Completed Card */}
        <View style={styles.workCard}>
          <View style={styles.workHeader}>
            <View style={styles.workHeaderLeft}>
              <View style={styles.workHeaderIconBox}>
                <AppIcon name="FileText" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.workHeading}>Work completed</Text>
            </View>
            <View style={styles.passedBadge}>
              <Text style={styles.passedBadgeText}>4/4 passed</Text>
            </View>
          </View>

          <View style={styles.workItemsList}>
            {/* Item 1 */}
            <View style={styles.workItemRow}>
              <View style={styles.checkCircleBox}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.workItemContent}>
                <Text style={styles.workItemTitle}>Chair mechanism repaired</Text>
                <Text style={styles.workItemDesc}>
                  Synchron-tilt recalibrated and lock play removed. Smooth
                  4-position locking restored.
                </Text>
              </View>
            </View>

            {/* Item 2 */}
            <View style={styles.workItemRow}>
              <View style={styles.checkCircleBox}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.workItemContent}>
                <Text style={styles.workItemTitle}>Hydraulic system checked</Text>
                <Text style={styles.workItemDesc}>
                  Class-4 nitrogen gas strut holding stable load with zero drift
                  under continuous weight.
                </Text>
              </View>
            </View>

            {/* Item 3 */}
            <View style={styles.workItemRow}>
              <View style={styles.checkCircleBox}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.workItemContent}>
                <Text style={styles.workItemTitle}>Wheels inspected</Text>
                <Text style={styles.workItemDesc}>
                  5-spoke caster housing cleared of fiber debris, degreased, and
                  lubricated with PTFE.
                </Text>
              </View>
            </View>

            {/* Item 4 */}
            <View style={styles.workItemRow}>
              <View style={styles.checkCircleBox}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.workItemContent}>
                <Text style={styles.workItemTitle}>Chair movement tested</Text>
                <Text style={styles.workItemDesc}>
                  Multi-angle 110kg dynamic posture stress test passed with
                  silence and zero tilt shake.
                </Text>
              </View>
            </View>
          </View>

          {/* Post-Service Inspection Evidence Photos */}
          <View style={styles.evidenceSection}>
            <Text style={styles.evidenceSectionTitle}>
              POST-SERVICE INSPECTION EVIDENCE
            </Text>
            <View style={styles.evidenceGrid}>
              <View style={styles.evidenceImageBox}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
                  }}
                  style={styles.evidenceImg}
                />
                <View style={styles.evidenceOverlayTag}>
                  <Text style={styles.evidenceTagText}>Piston Clean</Text>
                </View>
              </View>

              <View style={styles.evidenceImageBox}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400&auto=format&fit=crop&q=80',
                  }}
                  style={styles.evidenceImg}
                />
                <View style={styles.evidenceOverlayTag}>
                  <Text style={styles.evidenceTagText}>Casters Lubed</Text>
                </View>
              </View>
            </View>

            <View style={styles.isoCheckStrip}>
              <View style={styles.isoLeft}>
                <AppIcon name="ShieldCheck" size={18} />
                <Text style={styles.isoCheckText}>
                  Passed 14-Point Mechanical Check
                </Text>
              </View>
              <Text style={styles.isoStandardText}>ISO 9241</Text>
            </View>
          </View>
        </View>

        {/* Service Summary & 90-Day Warranty Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>SERVICE SUMMARY</Text>
            <Text style={styles.bookingIdText}>
              Booking ID: <Text style={styles.bookingIdBold}>#CC-8492</Text>
            </Text>
          </View>

          <View style={styles.servicePriceRow}>
            <Text style={styles.serviceNameText}>{serviceTitle}</Text>
            <Text style={styles.serviceAmountText}>{serviceTotal}</Text>
          </View>

          {/* 90-Day Digital Warranty Pill */}
          <View style={styles.warrantyBox}>
            <AppIcon name="ShieldCheck" size={18} />
            <View style={styles.warrantyContent}>
              <Text style={styles.warrantyTitle}>90-Day Digital Warranty</Text>
              <Text style={styles.warrantyDesc}>
                Activates automatically upon invoice payment. Covers strut
                stability, parts, and hardware alignment.
              </Text>
            </View>
          </View>

          {/* Quick Sit-Test Tip */}
          <View style={styles.tipBox}>
            <AppIcon name="Armchair" size={18} />
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Tip: </Text>
              Take a quick sit-test now! Confirm your preferred tilt tension and
              smooth 360° swivel before completing checkout.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Panel */}
      <View
        style={[
          styles.stickyBottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) + 6 },
        ]}
      >
        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity
            style={styles.rateExperienceBtn}
            onPress={() =>
              navigation.navigate('RateExperience', {
                requestId: draft?.id,
                technicianName: technician.name,
                technicianRating: technician.rating,
                serviceTitle,
              })
            }
            activeOpacity={0.88}
          >
            <AppIcon name="Star" size={16} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.rateExperienceBtnText}>Rate Experience</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reviewAndPayBtn}
            onPress={handleReviewAndPay}
            activeOpacity={0.88}
          >
            <Text style={styles.reviewAndPayBtnText}>Review & Pay</Text>
            <Text style={styles.reviewAndPayBtnArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.raiseDisputeLink}
          onPress={() => setIsDisputeModalOpen(true)}
          activeOpacity={0.75}
        >
          <AppIcon name="AlertTriangle" size={13} color="#ba1a1a" />
          <Text style={styles.raiseDisputeLinkText}>Have an issue with this service? Raise a dispute ticket</Text>
        </TouchableOpacity>

        <View style={styles.approvedByNoticeRow}>
          <AppIcon name="ShieldCheck" size={15} />
          <Text style={styles.approvedNoticeText}>
            Inspected & approved by certified technician
          </Text>
        </View>
      </View>

      <DisputeTicketModal
        visible={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        requestId={draft?.id || 'req-8492'}
        trackingCode={(draft as any)?.trackingCode || 'CC-8492'}
        chairModel={draft?.chairType || 'Office Chair'}
        technicianName={technician.name}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  headerTitleGroup: {
    flex: 1,
  },
  brandSubtitle: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
  celebrationSection: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  concentricGlowWrap: {
    position: 'relative',
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  concentricPulseRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(78, 222, 163, 0.18)',
  },
  concentricGlowCircle: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(219, 225, 255, 0.4)',
  },
  concentricCore: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: Colors.tertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  concentricInnerRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 150, 104, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLargeIcon: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.tertiaryFixed,
  },
  testedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: 8,
    ...Shadows.level1,
  },
  testedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.onTertiaryContainer,
  },
  testedPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  celebrationHeading: {
    ...Typography.headlineMd,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.onSurface,
    textAlign: 'center',
    marginBottom: 4,
  },
  celebrationSub: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
    marginBottom: 10,
  },
  timeTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
  },
  timeIcon: {
    fontSize: 12,
  },
  timeTagText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  techCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  techAvatarWrap: {
    position: 'relative',
  },
  techAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  verifiedMiniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedMiniCheck: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onPrimary,
  },
  techMeta: {
    flex: 1,
    gap: 2,
  },
  techNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  techNameText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  bifmaBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  bifmaBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onTertiaryContainer,
    fontWeight: '700',
  },
  techSpecialty: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  techMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  starIcon: {
    fontSize: 11,
  },
  ratingNumber: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  reviewsCount: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  dotSeparator: {
    fontSize: 10,
    color: Colors.outline,
  },
  completedCount: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  workCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  workHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workHeaderIconBox: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workHeaderIcon: {
    fontSize: 14,
  },
  workHeading: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  passedBadge: {
    backgroundColor: Colors.tertiaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  passedBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.tertiaryFixed,
  },
  workItemsList: {
    gap: 8,
  },
  workItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  checkCircleBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.tertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkItemIcon: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.tertiaryFixed,
  },
  workItemContent: {
    flex: 1,
    gap: 2,
  },
  workItemTitle: {
    ...Typography.bodyMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  workItemDesc: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 15,
  },
  evidenceSection: {
    gap: 8,
    marginTop: 4,
  },
  evidenceSectionTitle: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  evidenceGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  evidenceImageBox: {
    flex: 1,
    height: 90,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  evidenceImg: {
    width: '100%',
    height: '100%',
  },
  evidenceOverlayTag: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  evidenceTagText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  isoCheckStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainer,
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  isoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  isoShieldIcon: {
    fontSize: 13,
  },
  isoCheckText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  isoStandardText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
  },
  summaryTitle: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  bookingIdText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  bookingIdBold: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  servicePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceNameText: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
    flex: 1,
  },
  serviceAmountText: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  warrantyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  warrantyIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  warrantyContent: {
    flex: 1,
    gap: 2,
  },
  warrantyTitle: {
    ...Typography.bodyMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  warrantyDesc: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 15,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(219, 225, 255, 0.35)',
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  tipIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  tipText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSecondaryFixedVariant,
    flex: 1,
    lineHeight: 15,
  },
  tipBold: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  stickyBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 6,
    alignItems: 'center',
    ...Shadows.level3,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  rateExperienceBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#d97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  rateExperienceBtnText: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewAndPayBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  reviewAndPayBtnText: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  reviewAndPayBtnArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  raiseDisputeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  raiseDisputeLinkText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#ba1a1a',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  approvedByNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  approvedShieldIcon: {
    fontSize: 11,
  },
  approvedNoticeText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
});
