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
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { PrecisionCard } from '../../components/common/PrecisionCard';
import { PrecisionButton } from '../../components/common/PrecisionButton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MonoMetric } from '../../components/common/MonoMetric';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';

export const ServiceDetailsOfficeChairRepairChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const { isAuthenticated, setPendingReturnRoute } = useAuth();
  const { updateDraft } = useBooking();

  const handleRequestService = () => {
    // 1. Preserve selected service in booking context
    updateDraft({
      serviceId: 'svc-repair',
      serviceTitle: 'Office Chair Repair',
      estimatedTotal: 599,
    });

    // 2. Navigate to Step 1 to browse options and configure service
    navigation.navigate('BookingStep1');
  };

  const commonIssues = [
    {
      title: 'Broken chair mechanism',
      desc: 'Cracked housings, stripped gears, and sheared bolts',
    },
    {
      title: 'Tilt problems & lock slippage',
      desc: 'Recline tension failure, forward-tilt and recline-lock freeze',
    },
    {
      title: 'Loose components & wobbly frames',
      desc: 'Armrest shake, backrest play, and chassis re-torquing',
    },
    {
      title: 'Damaged wheels & caster drag',
      desc: 'Hardwood-safe replacements and high-load wheel stems',
    },
    {
      title: 'Height adjustment & cylinder sink',
      desc: 'Slow pressure loss, gas spring rebuilds, or Class 4 replacement',
    },
    {
      title: 'Unusual squeaks & metallic noise',
      desc: 'Ultrasonic mechanical cleaning and synthetic lubrication',
    },
    {
      title: 'Other mechanical problems',
      desc: 'Custom ergonomic fittings and bespoke legacy hardware repair',
    },
  ];

  return (
    <ScreenContainer hasPadding={false}>
      {/* Top Header Navigation */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSub}>CHAIRCARE</Text>
            <Text style={styles.headerTitle}>Service Detail</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <AppIcon name="Search" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('CustomerProfileTab')}
            activeOpacity={0.7}
            accessibilityLabel="Customer Profile"
          >
            <AppIcon name="User" size={18} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Visual Showcase Hero */}
        <View style={styles.heroContainer}>
          <View style={styles.heroImagePlaceholder}>
            {/* Visual workshop representation */}
            <View style={styles.heroOverlayContent}>
              <View style={styles.heroTopActions}>
                <TouchableOpacity style={styles.heroActionBtn} activeOpacity={0.8}>
                  <Text style={styles.heroActionIcon}>↗️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroActionBtn} activeOpacity={0.8}>
                  <AppIcon name="Info" size={28} />
                </TouchableOpacity>
              </View>

              <View style={styles.heroBadgesRow}>
                <View style={styles.glassBadge}>
                  <AppIcon name="ShieldCheck" size={18} />
                  <Text style={styles.glassBadgeText}>Verified Techs</Text>
                </View>
                <View style={styles.glassBadge}>
                  <AppIcon name="Clock" size={18} />
                  <Text style={styles.glassBadgeText}>30–90 Min Fix</Text>
                </View>
                <View style={styles.glassBadge}>
                  <AppIcon name="Settings" size={18} />
                  <Text style={styles.glassBadgeText}>OEM Parts</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Service Title & Ergonomic Summary */}
        <View style={styles.titleSection}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>FIELD DIAGNOSTIC & OVERHAUL</Text>
            <View style={styles.dotSeparator} />
            <Text style={styles.classLabel}>Class-4 Rated</Text>
          </View>

          <Text style={styles.serviceTitle}>Office Chair Repair</Text>
          <Text style={styles.serviceDesc}>
            Get your office chair repaired by a verified technician at your location.
            Rapid diagnostic, genuine replacement hardware, and precision
            biomechanical calibration.
          </Text>

          {/* Satisfaction Metric Micro-Strip */}
          <View style={styles.satisfactionStrip}>
            <View style={styles.ratingBox}>
              <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingNumber}>4.94</Text>
              <Text style={styles.ratingCount}>(1,480+ fixes)</Text>
            </View>
            <View style={styles.stripDivider} />
            <View style={styles.warrantyBox}>
              <AppIcon name="ShieldCheck" size={18} />
              <Text style={styles.warrantyText}>90-Day Warranty</Text>
            </View>
          </View>
        </View>

        {/* Service Spec 2x2 Grid */}
        <View style={styles.specGrid}>
          <PrecisionCard style={styles.specCard}>
            <View style={styles.specHeader}>
              <Text style={styles.specLabel}>TIME REQUIRED</Text>
              <AppIcon name="Clock" size={18} />
            </View>
            <Text style={styles.specValue}>30–90 mins</Text>
            <Text style={styles.specSub}>Average fix duration</Text>
          </PrecisionCard>

          <PrecisionCard style={styles.specCard}>
            <View style={styles.specHeader}>
              <Text style={styles.specLabel}>TECHNICIAN</Text>
              <AppIcon name="Wrench" size={18} color="#2563EB" />
            </View>
            <Text style={styles.specValue}>BIFMA Certified</Text>
            <Text style={styles.specSub}>Vetted master tech</Text>
          </PrecisionCard>

          <PrecisionCard style={styles.specCard}>
            <View style={styles.specHeader}>
              <Text style={styles.specLabel}>LOCATION</Text>
              <AppIcon name="Building2" size={18} />
            </View>
            <Text style={styles.specValue}>Home or Office</Text>
            <Text style={styles.specSub}>Zero hauling hassle</Text>
          </PrecisionCard>

          <PrecisionCard style={styles.specCard}>
            <View style={styles.specHeader}>
              <Text style={styles.specLabel}>STARTING PRICE</Text>
              <AppIcon name="CreditCard" size={18} />
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.specPrice}>₹599</Text>
              <Text style={styles.specBaseTag}>base</Text>
            </View>
            <Text style={styles.specSub}>Diagnostic included</Text>
          </PrecisionCard>
        </View>

        {/* What We Can Help With Checklist */}
        <PrecisionCard style={styles.checklistCard}>
          <View style={styles.checklistHeader}>
            <View>
              <Text style={styles.scopeLabel}>PRECISION SCOPE</Text>
              <Text style={styles.checklistTitle}>What We Can Help With</Text>
            </View>
            <View style={styles.issuesBadge}>
              <Text style={styles.issuesBadgeText}>7 Common Issues</Text>
            </View>
          </View>

          <View style={styles.issuesList}>
            {commonIssues.map((issue, idx) => (
              <View key={idx} style={styles.issueRow}>
                <View style={styles.checkCircle}>
                  <AppIcon name="Check" size={18} />
                </View>
                <View style={styles.issueDetails}>
                  <Text style={styles.issueTitle}>{issue.title}</Text>
                  <Text style={styles.issueDesc}>{issue.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </PrecisionCard>

        {/* Diagnostics Matrix / Spec Calibration */}
        <PrecisionCard style={styles.matrixCard}>
          <View style={styles.matrixHeader}>
            <View>
              <Text style={styles.matrixSub}>DIAGNOSTICS MATRIX</Text>
              <Text style={styles.matrixTitle}>Digital Spec Calibration</Text>
            </View>
            <View style={styles.liveSyncBadge}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveSyncText}>Live Sync</Text>
            </View>
          </View>

          <View style={styles.calibrationList}>
            <View style={styles.calibrationItem}>
              <View style={styles.calibHeaderRow}>
                <Text style={styles.calibName}>Tilt Resistance Valve</Text>
                <Text style={styles.calibTarget}>18.4 Nm Target</Text>
              </View>
              <View style={styles.calibTrack}>
                <View style={[styles.calibBar, { width: '75%' }]} />
              </View>
            </View>

            <View style={styles.calibrationItem}>
              <View style={styles.calibHeaderRow}>
                <Text style={styles.calibName}>Hydraulic Lift Seal</Text>
                <Text style={styles.calibTarget}>Grade Class 4</Text>
              </View>
              <View style={styles.calibTrack}>
                <View style={[styles.calibBar, { width: '92%' }]} />
              </View>
            </View>
          </View>
        </PrecisionCard>

        {/* How It Works 3-Step Flow */}
        <View style={styles.howItWorksSection}>
          <View style={styles.howHeader}>
            <Text style={styles.howSub}>FAST TURNAROUND</Text>
            <Text style={styles.howTitle}>How It Works</Text>
          </View>

          <View style={styles.stepsList}>
            {/* Step 1 */}
            <PrecisionCard style={styles.stepCard}>
              <View style={styles.stepNumBadge1}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepHeading}>Request Service</Text>
                <Text style={styles.stepDesc}>
                  Pick a convenient date, time slot, and provide your home or office address in under 60 seconds.
                </Text>
              </View>
            </PrecisionCard>

            {/* Step 2 */}
            <PrecisionCard style={styles.stepCard}>
              <View style={styles.stepNumBadge2}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepHeading}>Get Matched</Text>
                <Text style={styles.stepDesc}>
                  A certified BIFMA technician arrives on schedule fully equipped with universal cylinders, casters, and calibration tools.
                </Text>
              </View>
            </PrecisionCard>

            {/* Step 3 */}
            <PrecisionCard style={styles.stepCard}>
              <View style={styles.stepNumBadge3}>
                <Text style={styles.stepNumText}>3</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepHeading}>Chair Fixed & Tested</Text>
                <Text style={styles.stepDesc}>
                  Your chair undergoes a multi-point stress test and comes secured with our comprehensive 90-day peace of mind warranty.
                </Text>
              </View>
            </PrecisionCard>
          </View>
        </View>

        {/* Zero Upfront Risk Guarantee Note */}
        <View style={styles.guaranteeCard}>
          <AppIcon name="ShieldCheck" size={18} />
          <View style={styles.guaranteeDetails}>
            <Text style={styles.guaranteeTitle}>Zero Upfront Risk</Text>
            <Text style={styles.guaranteeDesc}>
              Pay only after diagnosis is completed and your chair is restored.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA Bar */}
      <View style={styles.bottomCtaBar}>
        <PrecisionButton
          title="Request This Service →"
          size="lg"
          variant="primary"
          onPress={handleRequestService}
          style={styles.requestBtn}
        />
        <Text style={styles.ctaSubtext}>
          Sign in required to request • No payment taken now
        </Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    height: 60,
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
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  headerSub: {
    ...Typography.labelMono,
    color: Colors.secondaryCobalt,
    letterSpacing: 1,
  },
  headerTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
  },
  iconBtnText: {
    fontSize: 16,
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
  profileBtnText: {
    fontSize: 15,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
    gap: 18,
  },
  heroContainer: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.level2,
  },
  heroImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#1E293B',
    borderRadius: BorderRadius.xl,
    justifyContent: 'flex-end',
  },
  heroOverlayContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  heroTopActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  heroActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActionIcon: {
    fontSize: 14,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  glassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  glassBadgeIcon: {
    fontSize: 11,
  },
  glassBadgeText: {
    ...Typography.labelMd,
    fontSize: 11,
    color: Colors.onSurface,
  },
  titleSection: {
    gap: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryLabel: {
    ...Typography.labelMono,
    color: Colors.secondaryCobalt,
    letterSpacing: 0.8,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outline,
  },
  classLabel: {
    ...Typography.labelMono,
    color: Colors.onSurfaceVariant,
  },
  serviceTitle: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  serviceDesc: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 22,
  },
  satisfactionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    marginTop: 6,
    gap: 12,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starIcon: {
    fontSize: 14,
  },
  ratingNumber: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  ratingCount: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  stripDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.outlineHairline,
  },
  warrantyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warrantyIcon: {
    fontSize: 14,
  },
  warrantyText: {
    ...Typography.bodySm,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  specCard: {
    width: '48%',
    padding: 12,
    gap: 4,
  },
  specHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  specIcon: {
    fontSize: 14,
  },
  specValue: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  specSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  specPrice: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  specBaseTag: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.secondaryCobalt,
  },
  checklistCard: {
    padding: 16,
    gap: 12,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scopeLabel: {
    ...Typography.labelMono,
    color: Colors.secondaryCobalt,
    letterSpacing: 0.8,
  },
  checklistTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  issuesBadge: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  issuesBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  issuesList: {
    gap: 10,
    marginTop: 4,
  },
  issueRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 81, 213, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkMark: {
    fontSize: 11,
    color: Colors.secondaryCobalt,
    fontWeight: 'bold',
  },
  issueDetails: {
    flex: 1,
    gap: 2,
  },
  issueTitle: {
    ...Typography.bodyMd,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  issueDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  matrixCard: {
    padding: 16,
    gap: 12,
    backgroundColor: Colors.surfaceContainerLow,
  },
  matrixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matrixSub: {
    ...Typography.labelMono,
    color: Colors.outline,
    letterSpacing: 0.8,
  },
  matrixTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 81, 213, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  liveSyncText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  calibrationList: {
    gap: 10,
  },
  calibrationItem: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    padding: 10,
    gap: 6,
  },
  calibHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calibName: {
    ...Typography.bodyMd,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  calibTarget: {
    ...Typography.labelMono,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  calibTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  calibBar: {
    height: '100%',
    backgroundColor: Colors.secondaryCobalt,
    borderRadius: 3,
  },
  howItWorksSection: {
    gap: 10,
  },
  howHeader: {
    gap: 2,
  },
  howSub: {
    ...Typography.labelMono,
    color: Colors.secondaryCobalt,
    letterSpacing: 0.8,
  },
  howTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  stepsList: {
    gap: 10,
  },
  stepCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    padding: 14,
  },
  stepNumBadge1: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumBadge2: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumBadge3: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    ...Typography.labelMono,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepInfo: {
    flex: 1,
    gap: 4,
  },
  stepHeading: {
    ...Typography.titleLg,
    fontSize: 15,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  stepDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  guaranteeCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    padding: 14,
    borderRadius: BorderRadius.xl,
  },
  guaranteeIcon: {
    fontSize: 24,
  },
  guaranteeDetails: {
    flex: 1,
    gap: 2,
  },
  guaranteeTitle: {
    ...Typography.bodyMd,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  guaranteeDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  bottomCtaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 6,
    ...Shadows.level3,
  },
  requestBtn: {
    width: '100%',
  },
  ctaSubtext: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
});
