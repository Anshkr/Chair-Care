import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { CustomerHeaderAvatar } from '../../components/common/CustomerHeaderAvatar';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useBooking } from '../../context/BookingContext';
import { customerApi } from '../../services/api';
import { useAdminSync } from '../../services/adminSync';

import { VoiceCallModal } from '../../components/common/VoiceCallModal';
import { phoneCallService } from '../../services/phone/phoneCallService';

/**
 * Screen ID: C12
 * Title: Technician Arrived
 * Reference: design-reference/customer/technician_arrived_chaircare_mobile
 */
export const TechnicianArrivedChaircareMobileScreen: React.FC<{
  navigation: any;
  route?: any;
}> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { draft } = useBooking();
  const requestId = route?.params?.requestId;

  const [liveData, setLiveData] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [spaceChecked, setSpaceChecked] = useState<boolean>(false);
  const [petsChecked, setPetsChecked] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [callModalVisible, setCallModalVisible] = useState<boolean>(false);

  const fetchLiveInfo = async () => {
    try {
      if (requestId) {
        const res = await customerApi.getRequestById(requestId);
        if (res.success && res.data) {
          setLiveData(res.data);
        }
      } else {
        const res = await customerApi.getMyRequests();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const active = res.data.find(
            (r: any) => ['arrived', 'in_route', 'in_progress'].includes(r.status)
          );
          if (active) setLiveData(active);
        }
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchLiveInfo();
  }, [requestId]);

  useAdminSync(navigation, fetchLiveInfo);

  const securityPin = String(liveData?.securityPin || liveData?.security_pin || '----');

  const technician = {
    name:
      liveData?.technician?.name ||
      liveData?.technician_name ||
      liveData?.technicianName ||
      route?.params?.technicianName ||
      'Rajesh Kumar',
    rating: Number(liveData?.technician?.rating || 4.92),
    completedJobsCount: Number(liveData?.technician?.completedJobsCount || liveData?.technician?.completed_jobs_count || 184),
    reviewsCount: Number(liveData?.technician?.reviewsCount || 184),
    experienceYears: Number(liveData?.technician?.experienceYears || 8),
    specializations: (liveData?.technician?.specializations
      ? String(liveData.technician.specializations).split(',')
      : ['Hydraulic Tuning', 'Multi-Angle Tilt Lock', 'Herman Miller & Steelcase']
    ).map((s: string) => s.trim()),
    phone:
      liveData?.technician?.phone ||
      liveData?.technician_phone ||
      liveData?.technicianPhone ||
      route?.params?.technicianPhone ||
      '+91 99887 76655',
    vehicleInfo:
      liveData?.technician?.vehicleInfo ||
      liveData?.technician_vehicle ||
      'Hero Splendor (DL-04-AB-1234)',
  };

  const serviceTitle =
    liveData?.service_title ||
    liveData?.serviceTitle ||
    liveData?.service?.title ||
    draft?.serviceTitle ||
    'Office Chair Full Diagnostic & Overhaul';
  const serviceLocation =
    liveData?.address ||
    (draft?.unitOrFloor && draft?.serviceAddress
      ? `${draft.unitOrFloor}, ${draft.serviceAddress}`
      : draft?.serviceAddress || 'Customer Service Location');

  const readyCount = (spaceChecked ? 1 : 0) + (petsChecked ? 1 : 0);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCopyPasscode = () => {
    if (Platform.OS === 'web') {
      navigator?.clipboard?.writeText(securityPin);
      triggerToast(`Completion PIN ${securityPin} copied to clipboard`);
    } else {
      triggerToast(`Completion PIN ${securityPin} copied to clipboard`);
    }
  };

  const handleCall = () => {
    phoneCallService.callNumber(technician.phone, technician.name);
  };

  const handleMessage = () => {
    navigation.navigate('ChatWithTechnician', {
      requestId: route?.params?.requestId || (draft as any)?.id || 'ACTIVE',
      recipientName: technician.name,
      technicianPhone: technician.phone,
    });
  };

  const handleGrantEntryAndStart = () => {
    setIsStarting(true);
    triggerToast('Session Started: Diagnostic timer active');
    setTimeout(() => {
      setIsStarting(false);
      navigation.navigate('ActiveService');
    }, 600);
  };

  return (
    <ScreenContainer hasPadding={false}>
      {/* Fixed Header Bar matching reference */}
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            Live Technician Tracking
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.activePill}>
            <View style={styles.activePulseDot} />
            <Text style={styles.activePillText}>ACTIVE</Text>
          </View>
          <CustomerHeaderAvatar
            onPress={() => navigation.navigate('CustomerProfileTab')}
            size={36}
          />
        </View>
      </View>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <View style={[styles.toastContainer, { pointerEvents: 'none' }]}>
          <View style={styles.toastCard}>
            <AppIcon name="Check" size={18} />
            <Text style={styles.toastText} numberOfLines={1}>
              {toastMessage}
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Celebratory / Success Status Header */}
        <View style={styles.celebrationSection}>
          <View style={styles.anchorRingOuter}>
            <View style={styles.anchorRingPulse} />
            <View style={styles.anchorRingGlow} />
            <View style={styles.anchorRingCore}>
              <View style={styles.anchorIconBadge}>
                <AppIcon name="Check" size={18} />
              </View>
            </View>
            <View style={styles.verifiedMiniBadge}>
              <AppIcon name="Check" size={14} />
            </View>
          </View>

          <Text style={styles.celebrationHeading}>
            Your technician has arrived!
          </Text>
          <Text style={styles.celebrationSub}>
            {technician.name} is outside your door with certified diagnostic calibrators and factory-spec replacement parts.
          </Text>

          {/* Work Completion Security PIN Card */}
          <View style={styles.completionPinCard}>
            <View style={styles.pinHeaderRow}>
              <View style={styles.pinIconPill}>
                <AppIcon name="ShieldCheck" size={16} color="#15803D" />
                <Text style={styles.pinBadgeLabel}>WORK COMPLETION SECURITY PIN</Text>
              </View>
              <TouchableOpacity
                style={styles.copyPinBtn}
                onPress={handleCopyPasscode}
                activeOpacity={0.8}
              >
                <AppIcon name="ClipboardList" size={14} color={Colors.secondaryCobalt} />
                <Text style={styles.copyPinText}>Copy PIN</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pinDigitRow}>
              {securityPin.split('').map((digit: string, idx: number) => (
                <View key={idx} style={styles.pinDigitTile}>
                  <Text style={styles.pinDigitNum}>{digit}</Text>
                </View>
              ))}
            </View>

            <View style={styles.pinExplanationBox}>
              <Text style={styles.pinExplanationText}>
                ⚠️ <Text style={{ fontWeight: '700' }}>Customer Security Note:</Text> Share this 4-digit PIN with {technician.name.split(' ')[0]} ONLY AFTER they have completely finished repairing your chair and you have verified the work.
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Arrival Highlight Card */}
        <View style={styles.arrivalCard}>
          <View style={styles.arrivalAccentBar} />
          <View style={styles.arrivalHeaderRow}>
            <View style={styles.pinIconBox}>
              <AppIcon name="MapPin" size={18} />
            </View>
            <View style={styles.arrivalHeaderTextGroup}>
              <View style={styles.arrivalTitleRow}>
                <Text style={styles.arrivalTitle}>Arrived at your location</Text>
                <View style={styles.timeTag}>
                  <Text style={styles.timeTagText}>03:32 PM</Text>
                </View>
              </View>
              <Text style={styles.geofenceSubtext}>
                Verified by GPS Geofence (Within 12m)
              </Text>
            </View>
          </View>

          <View style={styles.idSubBox}>
            <Text style={styles.idBadgeIcon}>🪪</Text>
            <Text style={styles.idSubText}>
              Technician is wearing official{' '}
              <Text style={styles.idHighlight}>ChairCare ID #CC-7049</Text> and
              carrying factory-grade Class-4 nitrogen gas struts & ultrasonic
              tension testers.
            </Text>
          </View>
        </View>

        {/* 3. Technician Profile Card */}
        <View style={styles.techProfileCard}>
          <View style={styles.techTopRow}>
            <View style={styles.avatarWrap}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                }}
                style={styles.techAvatar}
              />
              <View style={styles.engineerBadge}>
                <AppIcon name="Settings" size={18} />
              </View>
            </View>

            <View style={styles.techMeta}>
              <View style={styles.techNameRow}>
                <Text style={styles.techNameText}>{technician.name}</Text>
                <AppIcon name="ShieldCheck" size={18} />
              </View>
              <Text style={styles.techRoleText}>Senior Ergonomic Technician</Text>

              <View style={styles.certChipsRow}>
                <View style={styles.certChip}>
                  <Text style={styles.certChipText}>BIFMA Level 3</Text>
                </View>
                <View style={styles.certChip}>
                  <Text style={styles.certChipText}>Class-4 Gas Certified</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCell}>
              <View style={styles.metricRatingRow}>
                <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.metricRatingValue}>
                  {technician.rating.toFixed(1)}
                </Text>
              </View>
              <Text style={styles.metricSublabel}>{technician.reviewsCount} Reviews</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricCell}>
              <Text style={styles.metricMainValue}>
                {technician.completedJobsCount}+
              </Text>
              <Text style={styles.metricSublabel}>Repairs</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricCell}>
              <Text style={styles.metricMainValue}>{technician.experienceYears} Yrs</Text>
              <Text style={styles.metricSublabel}>Experience</Text>
            </View>
          </View>

          {/* Specializations */}
          <View style={styles.specSection}>
            <Text style={styles.specLabel}>SPECIALIZATIONS</Text>
            <View style={styles.specChipsRow}>
              {technician.specializations.map(
                (skill: string, idx: number) => (
                  <View key={idx} style={styles.specChip}>
                    <View style={styles.specDot} />
                    <Text style={styles.specChipText}>{skill}</Text>
                  </View>
                )
              )}
            </View>
          </View>
        </View>

        {/* 4. Dispatch Order Details Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>DISPATCH ORDER DETAILS</Text>
            <View style={styles.orderCodeBadge}>
              <Text style={styles.orderCodeText}>#CC-8942-NY</Text>
            </View>
          </View>

          <View style={styles.summaryItemList}>
            {/* Service Item */}
            <View style={styles.summaryItemRow}>
              <View style={styles.itemIconBox}>
                <AppIcon name="Wrench" size={18} />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{serviceTitle}</Text>
                <Text style={styles.itemDesc}>
                  Synchro-tilt re-centering, piston nitrogen check, urethane
                  roller servicing.
                </Text>
              </View>
            </View>

            {/* Location Item */}
            <View style={styles.summaryItemRow}>
              <View style={styles.itemIconBox}>
                <AppIcon name="Home" size={18} />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Service Location</Text>
                <Text style={styles.itemDesc}>{serviceLocation}</Text>
              </View>
            </View>

            {/* Technician Verification Confirmed */}
            <View style={styles.gateApprovedBox}>
              <View style={styles.gateIconBox}>
                <AppIcon name="ShieldCheck" size={18} />
              </View>
              <View style={styles.gateContent}>
                <View style={styles.gateStatusRow}>
                  <View style={styles.gateDot} />
                  <Text style={styles.gateStatusTitle}>
                    Technician Verification Confirmed
                  </Text>
                </View>
                <Text style={styles.gateDesc}>
                  Wearing official ChairCare badge #CC-7049 with calibrated diagnosis tools.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Workspace Readiness Checklist */}
        <View style={styles.readinessCard}>
          <View style={styles.readinessHeader}>
            <View style={styles.readinessTitleGroup}>
              <AppIcon name="ClipboardList" size={18} />
              <Text style={styles.readinessHeading}>Workspace Readiness</Text>
            </View>
            <View
              style={[
                styles.readinessProgressBadge,
                readyCount === 2 && styles.readinessProgressBadgeDone,
              ]}
            >
              <Text
                style={[
                  styles.readinessProgressText,
                  readyCount === 2 && styles.readinessProgressTextDone,
                ]}
              >
                {readyCount}/2 Ready
              </Text>
            </View>
          </View>

          <Text style={styles.readinessInstructions}>
            Please ensure a ~2m × 2m clear space near your desk for the
            technician's portable hydraulic clamp and alignment laser.
          </Text>

          <View style={styles.checklistGroup}>
            <TouchableOpacity
              style={[
                styles.checklistItem,
                spaceChecked && styles.checklistItemActive,
              ]}
              onPress={() => setSpaceChecked(!spaceChecked)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkboxBox,
                  spaceChecked && styles.checkboxBoxActive,
                ]}
              >
                {spaceChecked && <AppIcon name="Check" size={18} />}
              </View>
              <Text style={styles.checklistLabel}>
                Cleared 2m × 2m floor space for repair pad
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.checklistItem,
                petsChecked && styles.checklistItemActive,
              ]}
              onPress={() => setPetsChecked(!petsChecked)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkboxBox,
                  petsChecked && styles.checkboxBoxActive,
                ]}
              >
                {petsChecked && <AppIcon name="Check" size={18} />}
              </View>
              <Text style={styles.checklistLabel}>
                Pets & sensitive equipment placed safely aside
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. Sanitized & Clean Protocol Peek */}
        <View style={styles.safetyProtocolCard}>
          <View style={styles.safetyLeft}>
            <View style={styles.sanitizerIconBox}>
              <AppIcon name="Sparkles" size={16} color="#059669" />
            </View>
            <View style={styles.safetyTextGroup}>
              <Text style={styles.safetyTitle}>Sanitized & Clean Workspace</Text>
              <Text style={styles.safetySub}>
                Protective floor tarp & rubber boots deployed
              </Text>
            </View>
          </View>
          <View style={styles.safeTag}>
            <Text style={styles.safeTagText}>100% SAFE</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Contact Panel (Confirm & Start Service removed per requirements) */}
      <View
        style={[
          styles.bottomStickyBar,
          { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
      >
        <View style={styles.pinReadyBannerRow}>
          <View style={styles.pinReadyDot} />
          <Text style={styles.pinReadyBannerText}>
            Work Completion PIN: <Text style={{ fontWeight: '900', color: '#15803D' }}>{securityPin}</Text> (Give to tech after completion)
          </Text>
        </View>

        {/* Primary Call & Message Actions */}
        <View style={styles.secondaryActionsRow}>
          <TouchableOpacity
            style={styles.primaryCallActionBtn}
            onPress={handleCall}
            activeOpacity={0.88}
          >
            <AppIcon name="Phone" size={18} color="#FFFFFF" />
            <Text style={styles.primaryCallActionLabel}>
              Call {technician.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={handleMessage}
            activeOpacity={0.8}
          >
            <AppIcon name="MessageCircle" size={18} color={Colors.secondaryCobalt} />
            <Text style={styles.secondaryActionLabel}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>

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
    gap: 12,
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
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  activePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  activePillText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
    letterSpacing: 0.5,
  },
  profileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 14,
  },
  toastContainer: {
    position: 'absolute',
    top: 66,
    left: 16,
    right: 16,
    zIndex: 99,
    alignItems: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.inverseSurface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    ...Shadows.level3,
  },
  toastIcon: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.tertiaryFixedDim,
  },
  toastText: {
    ...Typography.bodySm,
    color: Colors.inverseOnSurface,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
  celebrationSection: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: 8,
  },
  anchorRingOuter: {
    position: 'relative',
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  anchorRingPulse: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(78, 222, 163, 0.18)',
  },
  anchorRingGlow: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(219, 225, 255, 0.5)',
  },
  anchorRingCore: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  anchorIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anchorCheckmark: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.onPrimary,
  },
  verifiedMiniBadge: {
    position: 'absolute',
    bottom: 2,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  verifiedMiniIcon: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.tertiaryEmerald,
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
  },
  passcodePill: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    ...Shadows.level1,
  },
  passcodeLabel: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  passcodeValue: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.primary,
  },
  copyIconBox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyIcon: {
    fontSize: 12,
  },
  arrivalCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  arrivalAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.secondaryCobalt,
  },
  arrivalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingLeft: 4,
  },
  pinIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinIcon: {
    fontSize: 16,
  },
  arrivalHeaderTextGroup: {
    flex: 1,
    gap: 2,
  },
  arrivalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  arrivalTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  timeTag: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  timeTagText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  geofenceSubtext: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.secondaryCobalt,
    fontWeight: '600',
  },
  idSubBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  idBadgeIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  idSubText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 16,
  },
  idHighlight: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  techProfileCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  techTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  techAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  engineerBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  engineerBadgeIcon: {
    fontSize: 10,
  },
  techMeta: {
    flex: 1,
    gap: 3,
  },
  techNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  techNameText: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  verifiedShield: {
    fontSize: 13,
  },
  techRoleText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  certChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  certChip: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  certChipText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metricStar: {
    fontSize: 12,
  },
  metricRatingValue: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  metricMainValue: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  metricSublabel: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.outlineHairline,
  },
  specSection: {
    gap: 6,
  },
  specLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  specChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  specDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.secondaryCobalt,
  },
  specChipText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurface,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 12,
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
  summaryTitle: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  orderCodeBadge: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  orderCodeText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  summaryItemList: {
    gap: 10,
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  itemIconBox: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIcon: {
    fontSize: 13,
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  itemDesc: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 15,
  },
  gateApprovedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  gateIconBox: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateIcon: {
    fontSize: 13,
  },
  gateContent: {
    flex: 1,
    gap: 2,
  },
  gateStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  gateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  gateStatusTitle: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  gateDesc: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 15,
  },
  readinessCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  readinessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readinessTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readinessIcon: {
    fontSize: 15,
  },
  readinessHeading: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  readinessProgressBadge: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  readinessProgressBadgeDone: {
    backgroundColor: Colors.secondaryFixed,
  },
  readinessProgressText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  readinessProgressTextDone: {
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  readinessInstructions: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  checklistGroup: {
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  checklistItemActive: {
    backgroundColor: 'rgba(219, 225, 255, 0.4)',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.outline,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxActive: {
    borderColor: Colors.secondaryCobalt,
    backgroundColor: Colors.secondaryCobalt,
  },
  checkboxCheck: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.onPrimary,
  },
  checklistLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
    flex: 1,
  },
  safetyProtocolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.xl,
    padding: 12,
    gap: 10,
  },
  safetyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sanitizerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sanitizerIcon: {
    fontSize: 14,
  },
  safetyTextGroup: {
    flex: 1,
    gap: 2,
  },
  safetyTitle: {
    ...Typography.bodyMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  safetySub: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  safeTag: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    ...Shadows.level1,
  },
  safeTagText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  bottomStickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
    ...Shadows.level3,
  },
  primaryActionBtn: {
    height: 50,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  primaryActionBtnActive: {
    backgroundColor: Colors.secondaryCobalt,
  },
  primaryActionBtnText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  primaryActionBtnArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadows.level1,
  },
  secondaryActionIcon: {
    fontSize: 14,
  },
  secondaryActionLabel: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  completionPinCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 10,
    marginTop: 12,
    width: '100%',
    ...Shadows.level1,
  },
  pinHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pinIconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  pinBadgeLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  copyPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  copyPinText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  pinDigitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  pinDigitTile: {
    width: 48,
    height: 52,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  pinDigitNum: {
    ...Typography.titleLg,
    fontSize: 24,
    fontWeight: '900',
    color: '#166534',
  },
  pinExplanationBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: BorderRadius.md,
    padding: 8,
  },
  pinExplanationText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 16,
  },
  pinReadyBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
  },
  pinReadyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  pinReadyBannerText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
  },
  primaryCallActionBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  primaryCallActionLabel: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
