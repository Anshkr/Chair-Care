import { AppIcon } from '../../components/common/AppIcon';
import { customerApi } from '../../services/api';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { CustomerHeaderAvatar } from '../../components/common/CustomerHeaderAvatar';
import { PrecisionButton } from '../../components/common/PrecisionButton';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useBooking } from '../../context/BookingContext';
import { FadeIn } from '../../animations/FadeIn';
import { VoiceCallModal } from '../../components/common/VoiceCallModal';
import { phoneCallService } from '../../services/phone/phoneCallService';

export const TechnicianAssignedChaircareMobileScreen: React.FC<{
  navigation: any;
  route?: any;
}> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { draft } = useBooking();

  const [assignedReq, setAssignedReq] = useState<any>(route?.params?.request || null);
  const [callModalVisible, setCallModalVisible] = useState<boolean>(false);

  useEffect(() => {
    if (!assignedReq) {
      customerApi.getMyRequests().then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const req = res.data.find(
            (r: any) =>
              r.status === 'assigned' ||
              r.status === 'in_route' ||
              r.status === 'arrived' ||
              r.status === 'in_progress'
          );
          if (req) setAssignedReq(req);
        }
      });
    }
  }, [assignedReq]);

  const technician = {
    name:
      assignedReq?.technician?.name ||
      assignedReq?.technician_name ||
      route?.params?.technician?.name ||
      'Rajesh Kumar',
    rating: Number(
      assignedReq?.technician?.rating ||
      assignedReq?.technician_rating ||
      route?.params?.technician?.rating ||
      4.92
    ),
    completedJobsCount: Number(
      assignedReq?.technician?.completedJobsCount ||
      assignedReq?.technician?.completed_jobs_count ||
      184
    ),
    reviewsCount: Number(
      assignedReq?.technician?.reviewsCount ||
      184
    ),
    experienceYears: Number(
      assignedReq?.technician?.experienceYears ||
      8
    ),
    specializations: (
      assignedReq?.technician?.specializations
        ? String(assignedReq.technician.specializations).split(',')
        : ['Chair Repair', 'Installation', 'Hydraulics & Tilts', 'Mesh Tension']
    ).map((s: string) => s.trim()),
    phone:
      assignedReq?.technician?.phone ||
      assignedReq?.technician_phone ||
      route?.params?.technician?.phone ||
      '+91 99887 76655',
    vehicleInfo:
      assignedReq?.technician?.vehicleInfo ||
      assignedReq?.technician_vehicle ||
      route?.params?.technician?.vehicleInfo ||
      'Hero Splendor (DL-04-AB-1234)',
  };

  const serviceTitle =
    assignedReq?.service_title ||
    draft?.serviceTitle ||
    'Office Chair Repair';
  const chairModel =
    assignedReq?.chair_model ||
    draft?.chairType ||
    (draft as any)?.customChairType ||
    'Ergonomic Chair';
  const trackingCode =
    assignedReq?.tracking_code ||
    (draft as any)?.trackingCode ||
    'CC-LIVE';

  const getDynamicDateFallback = () => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `Today, ${now.getDate()} ${months[now.getMonth()]}`;
  };
  const visitDate = assignedReq?.visit_date || draft?.visitDate || getDynamicDateFallback();
  const timeSlot = assignedReq?.time_slot
    ? assignedReq.time_slot.split('–')[0].trim()
    : draft?.timeSlot
    ? draft.timeSlot.split('–')[0].trim()
    : '03:30 PM';
  const serviceLocation =
    assignedReq?.address ||
    (draft?.unitOrFloor && draft?.serviceAddress
      ? `${draft.unitOrFloor}, ${draft.serviceAddress.split(',')[0]}`
      : draft?.serviceAddress || 'Customer Service Location');

  const handleTrackTechnician = () => {
    navigation.navigate('LiveTechnicianTracking', {
      requestId: assignedReq?.id,
      trackingCode: assignedReq?.tracking_code,
    });
  };

  const handleCall = () => {
    phoneCallService.callNumber(technician.phone, technician.name);
  };

  const handleMessage = () => {
    navigation.navigate('ChatWithTechnician', {
      requestId: assignedReq?.id || assignedReq?.tracking_code,
      recipientName: technician.name,
      technicianPhone: technician.phone,
    });
  };

  const handleGoDashboard = () => {
    navigation.navigate('CustomerMain', { screen: 'ServicesAvailableTab' });
  };

  const handleViewDetails = () => {
    navigation.navigate('RequestDetails', {
      requestId: assignedReq?.id || assignedReq?.tracking_code,
    });
  };

  return (
    <ScreenContainer hasPadding={false}>
      {/* Header Bar */}
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
          <Text style={styles.headerTitle}>Technician Live Tracker</Text>
        </View>

        <CustomerHeaderAvatar
          onPress={() => navigation.navigate('CustomerProfileTab')}
          size={36}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Announcement Banner */}
        <FadeIn delay={40}>
          <View style={styles.announcementSection}>
            <View style={styles.confirmedPill}>
              <AppIcon name="Check" size={18} />
              <Text style={styles.confirmedText}>Match Confirmed</Text>
            </View>
            <Text style={styles.announcementHeading}>
              We found a technician for you!
            </Text>
            <Text style={styles.announcementSub}>
              Your service request has been assigned to a verified ergonomic specialist.
            </Text>
          </View>
        </FadeIn>

        {/* Prominent Technician Card */}
        <FadeIn delay={120}>
          <View style={styles.techCard}>
            {/* Decorative mechanical calibration accent */}
            <View style={[styles.cardCornerAccent, { pointerEvents: 'none' }]} />

            <View style={styles.techProfileRow}>
              {/* Avatar & Verification Badge */}
              <View style={styles.avatarContainer}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                  }}
                  style={styles.techAvatar}
                />
                <View style={styles.verifiedAvatarBadge}>
                  <AppIcon name="Check" size={18} />
                </View>
              </View>

              {/* Technician Details */}
              <View style={styles.techDetails}>
                <View style={styles.techNameRow}>
                  <Text style={styles.techNameText} numberOfLines={1}>
                    {technician.name}
                  </Text>
                  <View style={styles.verifiedTag}>
                    <AppIcon name="ShieldCheck" size={18} />
                    <Text style={styles.verifiedTagText}>VERIFIED</Text>
                  </View>
                </View>

                <View style={styles.ratingStrip}>
                  <View style={styles.starBox}>
                    <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.ratingNumber}>
                      {technician.rating.toFixed(1)}
                    </Text>
                  </View>
                  <Text style={styles.servicedCount}>
                    ({technician.reviewsCount} reviews)
                  </Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.servicedCount}>
                    {technician.completedJobsCount}+ repairs
                  </Text>
                </View>

                <Text style={styles.expTag}>BIFMA CERTIFIED MASTER</Text>
              </View>
            </View>

            {/* Calibrated Capabilities */}
            <View style={styles.capabilitiesContainer}>
              <Text style={styles.capabilitiesTitle}>CALIBRATED CAPABILITIES</Text>
              <View style={styles.capabilitiesChipsRow}>
                {technician.specializations.map(
                  (skill: string, idx: number) => (
                    <View key={idx} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{skill}</Text>
                    </View>
                  )
                )}
              </View>
            </View>
          </View>
        </FadeIn>

        {/* Work Completion Security PIN Card */}
        <FadeIn delay={150}>
          <View style={styles.pinNoticeCard}>
            <View style={styles.pinNoticeHeaderRow}>
              <View style={styles.pinPill}>
                <AppIcon name="ShieldCheck" size={14} color="#15803D" />
                <Text style={styles.pinPillText}>COMPLETION PIN</Text>
              </View>
              <Text style={styles.pinCodeText}>
                {assignedReq?.securityPin || assignedReq?.security_pin || '----'}
              </Text>
            </View>
            <Text style={styles.pinNoticeSub}>
              Keep this 4-digit PIN ready to share with {technician.name.split(' ')[0]} once they finish repairing your chair.
            </Text>
          </View>
        </FadeIn>

        {/* Metric Telemetry Cards (2-column Grid) */}
        <FadeIn delay={180}>
          <View style={styles.telemetryGrid}>
            {/* ETA Card */}
            <View style={styles.telemetryCard}>
              <View style={styles.telemetryHeader}>
                <Text style={styles.telemetryLabel}>ETA</Text>
                <View style={styles.telemetryIconBox}>
                  <AppIcon name="Clock" size={18} />
                </View>
              </View>
              <View style={styles.telemetryValueGroup}>
                <Text style={styles.telemetryMainValue}>25–35 min</Text>
                <View style={styles.telemetryStatusRow}>
                  <View style={styles.statusDotEmerald} />
                  <Text style={styles.telemetrySubtext}>Traffic optimized</Text>
                </View>
              </View>
            </View>

            {/* Distance Card */}
            <View style={styles.telemetryCard}>
              <View style={styles.telemetryHeader}>
                <Text style={styles.telemetryLabel}>DISTANCE</Text>
                <View style={styles.telemetryIconBox}>
                  <AppIcon name="Compass" size={16} color={Colors.secondary} />
                </View>
              </View>
              <View style={styles.telemetryValueGroup}>
                <Text style={styles.telemetryMainValue}>2.4 km away</Text>
                <View style={styles.telemetryStatusRow}>
                  <View style={styles.statusDotCobalt} />
                  <Text style={styles.telemetrySubtext}>Mobile van unit</Text>
                </View>
              </View>
            </View>
          </View>
        </FadeIn>

        {/* Direct Communication Actions (2-column Grid) */}
        <FadeIn delay={240}>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconCircle}>
                <AppIcon name="Phone" size={18} />
              </View>
              <Text style={styles.actionBtnLabel}>Call Tech</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMessage}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconCircle}>
                <AppIcon name="MessageCircle" size={18} />
              </View>
              <Text style={styles.actionBtnLabel}>Message</Text>
            </TouchableOpacity>
          </View>
        </FadeIn>

        {/* Dispatch Status Live Pill */}
        <FadeIn delay={280}>
          <View style={styles.dispatchPhaseCard}>
            <View style={styles.dispatchIconBox}>
              <AppIcon name="Settings" size={18} />
              <View style={styles.dispatchPingRing} />
            </View>
            <View style={styles.dispatchInfo}>
              <Text style={styles.dispatchPhaseLabel}>CURRENT DISPATCH PHASE</Text>
              <Text style={styles.dispatchPhaseValue} numberOfLines={1}>
                Technician preparing tools & Class-4 parts
              </Text>
            </View>
          </View>
        </FadeIn>

        {/* Service Request Summary Card */}
        <FadeIn delay={320}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryHeaderLeft}>
                <AppIcon name="Receipt" size={18} color={Colors.onSurfaceVariant} />
                <Text style={styles.requestNumText}>Request #{trackingCode}</Text>
              </View>
              <TouchableOpacity onPress={handleViewDetails} activeOpacity={0.7}>
                <Text style={styles.viewDetailsText}>View Details ›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.summaryList}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Service</Text>
                <Text style={styles.summaryRowValue}>{serviceTitle}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Scheduled</Text>
                <Text style={styles.summaryRowValue}>
                  {visitDate} • {timeSlot}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Location</Text>
                <Text
                  style={[styles.summaryRowValue, { maxWidth: '65%' }]}
                  numberOfLines={1}
                >
                  {serviceLocation}
                </Text>
              </View>
            </View>
          </View>
        </FadeIn>

        {/* Bottom CTA Action Area */}
        <View style={styles.bottomCtaSection}>
          <PrecisionButton
            title="Track Technician →"
            size="lg"
            variant="primary"
            onPress={handleTrackTechnician}
            style={styles.trackBtn}
          />

          <TouchableOpacity
            style={styles.dashboardReturnBtn}
            onPress={handleGoDashboard}
            activeOpacity={0.8}
          >
            <Text style={styles.dashboardReturnBtnText}>Dashboard</Text>
          </TouchableOpacity>

          <View style={styles.telemetryNoticeRow}>
            <AppIcon name="Radio" size={16} color={Colors.secondary} />
            <Text style={styles.telemetryNoticeText}>
              Live telemetry activates once van starts motion
            </Text>
          </View>
        </View>
      </ScrollView>

      <VoiceCallModal
        visible={callModalVisible}
        onClose={() => setCallModalVisible(false)}
        contactName={technician.name}
        contactRole="Certified Specialist"
        phoneNumber={technician.phone}
      />
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
  headerTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  profileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 15,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },
  announcementSection: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  confirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tertiaryFixed,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 5,
    ...Shadows.level1,
  },
  confirmedCheckIcon: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.tertiaryContainer,
  },
  confirmedText: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.tertiaryContainer,
    fontWeight: '700',
  },
  announcementHeading: {
    ...Typography.headlineMd,
    fontSize: 22,
    color: Colors.onSurface,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  announcementSub: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  techCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  cardCornerAccent: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(219, 225, 255, 0.4)',
  },
  pinNoticeCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: BorderRadius.xl,
    padding: 12,
    gap: 6,
  },
  pinNoticeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  pinPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  pinCodeText: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '900',
    color: '#166534',
    letterSpacing: 2,
  },
  pinNoticeSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#166534',
    lineHeight: 15,
  },
  techProfileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
  },
  techAvatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  verifiedAvatarBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.tertiaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.surfaceContainerLowest,
  },
  verifiedBadgeIcon: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.tertiaryContainer,
  },
  techDetails: {
    flex: 1,
    gap: 3,
  },
  techNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  techNameText: {
    ...Typography.titleLg,
    fontSize: 16,
    color: Colors.onSurface,
    fontWeight: '700',
    flex: 1,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  verifiedShieldIcon: {
    fontSize: 10,
  },
  verifiedTagText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
    letterSpacing: 0.5,
  },
  ratingStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starIcon: {
    fontSize: 12,
  },
  ratingNumber: {
    ...Typography.bodySm,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  dotSeparator: {
    color: Colors.outline,
    fontSize: 10,
  },
  servicedCount: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  expTag: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  capabilitiesContainer: {
    backgroundColor: 'rgba(242, 244, 246, 0.7)',
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 8,
  },
  capabilitiesTitle: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  capabilitiesChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillChip: {
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  skillChipText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurface,
    fontWeight: '500',
  },
  telemetryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  telemetryCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  telemetryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  telemetryIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryIcon: {
    fontSize: 13,
  },
  telemetryValueGroup: {
    gap: 2,
  },
  telemetryMainValue: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  telemetryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDotEmerald: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiaryEmerald,
  },
  statusDotCobalt: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  telemetrySubtext: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  actionIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnIcon: {
    fontSize: 12,
  },
  actionBtnLabel: {
    ...Typography.titleLg,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  dispatchPhaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    padding: 12,
    gap: 12,
  },
  dispatchIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dispatchIcon: {
    fontSize: 16,
  },
  dispatchPingRing: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondaryCobalt,
  },
  dispatchInfo: {
    flex: 1,
    gap: 2,
  },
  dispatchPhaseLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  dispatchPhaseValue: {
    ...Typography.bodyMd,
    fontSize: 12,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
  },
  summaryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptIcon: {
    fontSize: 14,
  },
  requestNumText: {
    ...Typography.titleLg,
    fontSize: 13,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  viewDetailsText: {
    ...Typography.labelMd,
    fontSize: 11,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  summaryList: {
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRowLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  summaryRowValue: {
    ...Typography.bodyMd,
    fontSize: 12,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  bottomCtaSection: {
    gap: 8,
    marginTop: 4,
  },
  trackBtn: {
    marginTop: 2,
  },
  dashboardReturnBtn: {
    backgroundColor: Colors.surfaceContainerHigh,
    width: '100%',
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  dashboardReturnBtnText: {
    ...Typography.labelMd,
    fontSize: 13,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  telemetryNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  satelliteIcon: {
    fontSize: 12,
  },
  telemetryNoticeText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
});
