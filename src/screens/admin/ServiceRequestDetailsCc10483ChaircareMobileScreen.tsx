import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface ServiceRequestDetailsProps {
  navigation?: any;
  route?: {
    params?: {
      requestId?: string;
      requestItem?: any;
    };
  };
}

export const ServiceRequestDetailsCc10483ChaircareMobileScreen: React.FC<ServiceRequestDetailsProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const passedItem = route?.params?.requestItem;
  const passedId = route?.params?.requestId;

  // Selected request details with fallback to canonical CC-10483 Stitch reference
  const trackingCode = passedItem?.trackingCode || (passedId ? `CC-${passedId.replace('req-', '')}` : 'CC-10483');
  const serviceTitle = passedItem?.serviceTitle || 'Hydraulic Replacement';
  const chairModel = passedItem?.chairModel || 'Steelcase Gesture • Heavy Duty Class-4 Cylinder';
  const amount = passedItem?.amount || 749;
  const status = passedItem?.status || 'unassigned';
  const statusLabel = passedItem?.statusLabel || (status === 'unassigned' ? 'Needs Assignment' : 'Assigned');
  const slaText = passedItem?.slaText || '22m SLA';

  const customerName = passedItem?.customerName || 'Priya Sharma';
  const customerRating = passedItem?.customerRating || 4.85;
  const locationText = passedItem?.locationText || 'Flat 602, Tower 4, Oakwood Estate, DLF Phase 2, Gurugram, HR 122002';
  const customerPhone = '+91 98201 44810';

  const scheduleDateText = passedItem?.visitDate 
    ? (passedItem.visitDate.startsWith('Slot:') ? passedItem.visitDate.replace('Slot: ', '') : passedItem.visitDate)
    : (passedItem?.scheduleText ? passedItem.scheduleText.replace('Slot: ', '') : '16 Oct 2026');
  const scheduleSlotText = passedItem?.timeSlot || '03:30 PM – 05:00 PM (IST)';
  const realBookingTime = passedItem?.realTimeText || (passedItem?.scheduleSub ? passedItem.scheduleSub.replace('Booked: ', '') : '');

  const [techSheetVisible, setTechSheetVisible] = useState<boolean>(false);

  const handleCall = () => {
    Linking.openURL(`tel:${customerPhone}`).catch(() => {
      Alert.alert('Phone Call', `Dialing ${customerPhone}`);
    });
  };

  const handleMessage = () => {
    Linking.openURL(`sms:${customerPhone}`).catch(() => {
      Alert.alert('SMS', `Messaging ${customerPhone}`);
    });
  };

  const handleAssignTechnician = (techName?: string) => {
    if (navigation) {
      navigation.navigate('AssignTechnician', {
        requestId: passedId || 'req-10483',
        requestItem: passedItem || {
          id: 'req-10483',
          trackingCode: 'CC-10483',
          serviceTitle: 'Hydraulic Replacement',
          chairModel: 'Steelcase Gesture',
          amount: 749,
          customerName: 'Priya Sharma',
        },
        selectedTech: techName,
      });
    }
  };

  const handleEscalate = () => {
    Alert.alert(
      'Operational Escalation',
      'Ticket #' + trackingCode + ' has been flagged for Senior Operations Dispatch review.'
    );
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Bar */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation?.canGoBack() ? navigation.goBack() : navigation?.navigate('ServiceRequests'))}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.superAdminTag}>SUPER ADMIN • #{trackingCode}</Text>
            <Text style={styles.headerTitle}>Service Request Details</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() =>
              Alert.alert('Request Options', 'Export telemetry log, reassign corridor, or contact support desk.')
            }
            activeOpacity={0.7}
          >
            <AppIcon name="MoreVertical" size={20} />
          </TouchableOpacity>

          <View style={styles.profileAvatarTop}>
            <AppIcon name="User" size={18} />
          </View>
        </View>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Urgency & Status Hero Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.statusBadgePill,
                status === 'unassigned' ? styles.statusBadgeUnassigned : styles.statusBadgeAssigned,
              ]}
            >
              <View
                style={[
                  styles.statusBeaconDot,
                  status === 'unassigned' ? styles.beaconRed : styles.beaconGreen,
                ]}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  status === 'unassigned' ? styles.statusTextUnassigned : styles.statusTextAssigned,
                ]}
              >
                {statusLabel}
              </Text>
            </View>

            <Text style={styles.trackingCodeBadge}>#{trackingCode}</Text>
          </View>

          <View style={styles.heroMainRow}>
            <View style={styles.heroTitleCol}>
              <Text style={styles.heroServiceTitle}>{serviceTitle}</Text>
              <Text style={styles.heroSubText}>Created 18 mins ago via Customer App</Text>
            </View>

            <View style={styles.slaBox}>
              <AppIcon name="Clock" size={18} />
              <Text style={styles.slaTimerText}>{slaText}</Text>
            </View>
          </View>
        </View>

        {/* 3. Customer Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardEyebrow}>CUSTOMER PROFILE</Text>
            <View style={styles.tierBadge}>
              <AppIcon name="Check" size={18} />
              <Text style={styles.tierBadgeText}>Tier-1 Fleet Client</Text>
            </View>
          </View>

          <View style={styles.customerProfileRow}>
            <View style={styles.customerAvatarBox}>
              <Text style={styles.customerAvatarInitial}>PS</Text>
            </View>

            <View style={styles.customerInfoCol}>
              <View style={styles.customerNameRatingRow}>
                <Text style={styles.customerNameTitle} numberOfLines={1}>
                  {customerName}
                </Text>
                <View style={styles.ratingInline}>
                  <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratingValueText}>{customerRating}</Text>
                  <Text style={styles.ratingCountSub}>(6 services)</Text>
                </View>
              </View>
              <Text style={styles.customerPhoneText}>{customerPhone}</Text>
            </View>

            <View style={styles.quickActionGroup}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={handleCall}
                activeOpacity={0.7}
              >
                <AppIcon name="Phone" size={18} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={handleMessage}
                activeOpacity={0.7}
              >
                <AppIcon name="MessageCircle" size={18} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.addressSnippetBox}>
            <AppIcon name="MapPin" size={18} />
            <Text style={styles.addressText}>{locationText}</Text>
          </View>

          <TouchableOpacity
            style={styles.viewProfileBtn}
            onPress={() =>
              navigation?.navigate('CustomerProfileAnshKumar') ||
              Alert.alert('Customer Profile', `Viewing detailed telemetry & service history for ${customerName}.`)
            }
            activeOpacity={0.75}
          >
            <Text style={styles.viewProfileBtnText}>View Full Customer Profile</Text>
            <Text style={styles.chevronSmall}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Service & Mechanical Diagnostic Specification Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardEyebrow}>DIAGNOSTICS & HARDWARE</Text>
            <Text style={styles.tensionSpecBadge}>Tension Spec: Heavy</Text>
          </View>

          <View style={styles.hardwareHeaderRow}>
            <View style={styles.hardwareTitleCol}>
              <Text style={styles.hardwarePrimaryTitle}>{serviceTitle}</Text>
              <Text style={styles.chairTargetSub}>Target: {chairModel}</Text>
            </View>
            <Text style={styles.oemGradeTag}>OEM Grade</Text>
          </View>

          <View style={styles.defectLogBox}>
            <View style={styles.defectLogHeader}>
              <AppIcon name="Activity" size={16} color={Colors.secondaryCobalt} />
              <Text style={styles.defectLogLabel}>REPORTED DEFECT LOG</Text>
            </View>
            <Text style={styles.defectLogText}>
              “Chair is sinking and does not maintain the selected height. Drops approximately 3 inches immediately when seated. Needs OEM heavy-duty Class-4 gas cylinder replacement.”
            </Text>
          </View>

          <View style={styles.chipsRow}>
            <View style={[styles.chipPill, styles.chipError]}>
              <Text style={styles.chipTextError}>Hydraulic Seal Blown</Text>
            </View>
            <View style={[styles.chipPill, styles.chipNeutral]}>
              <Text style={styles.chipTextNeutral}>Height Drift</Text>
            </View>
            <View style={[styles.chipPill, styles.chipAccent]}>
              <Text style={styles.chipTextAccent}>OEM Class-4</Text>
            </View>
          </View>
        </View>

        {/* 5. Customer Photo Evidence */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.evidenceHeaderLeft}>
              <Text style={styles.cardEyebrow}>DIAGNOSTIC EVIDENCE</Text>
              <View style={styles.evidenceCountPill}>
                <Text style={styles.evidenceCountText}>2</Text>
              </View>
            </View>
            <View style={styles.telemetricHdBox}>
              <AppIcon name="Search" size={18} />
              <Text style={styles.telemetricHdText}>Telemetric HD</Text>
            </View>
          </View>

          <View style={styles.photosGrid}>
            {/* Photo 1 */}
            <TouchableOpacity
              style={styles.photoThumbContainer}
              onPress={() =>
                Alert.alert('Diagnostic Telemetry', 'Shaft Oil Seep inspection telemetry: Class-4 Hydro Damaged.')
              }
              activeOpacity={0.85}
            >
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1580481077197-7c706d871a39?q=80&w=600&auto=format&fit=crop',
                }}
                style={styles.photoImg}
                resizeMode="cover"
              />
              <View style={styles.photoGradientOverlay}>
                <Text style={styles.photoOverlayTitle}>Shaft Oil Seep</Text>
                <Text style={styles.photoOverlaySub}>Cylinder Class 4</Text>
              </View>
            </TouchableOpacity>

            {/* Photo 2 */}
            <TouchableOpacity
              style={styles.photoThumbContainer}
              onPress={() =>
                Alert.alert('Diagnostic Telemetry', 'Under-seat Matrix inspection telemetry: Tag SC-GEST-994.')
              }
              activeOpacity={0.85}
            >
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?q=80&w=600&auto=format&fit=crop',
                }}
                style={styles.photoImg}
                resizeMode="cover"
              />
              <View style={styles.photoGradientOverlay}>
                <Text style={styles.photoOverlayTitle}>Under-seat Matrix</Text>
                <Text style={styles.photoOverlaySub}>Tag: SC-GEST-994</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.photoTapHint}>
            Tap thumbnail to view telemetry & sensor metadata
          </Text>
        </View>

        {/* 6. Schedule & Proximity Map Preview */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardEyebrow}>SCHEDULED WINDOW</Text>
            <View style={styles.targetWindowBadge}>
              <Text style={styles.targetWindowText}>Target Window</Text>
            </View>
          </View>

          <View style={styles.scheduleTimeRow}>
            <AppIcon name="CalendarCheck" size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduleDateText}>{scheduleDateText}</Text>
              <Text style={styles.scheduleSlotText}>{scheduleSlotText}</Text>
              {Boolean(realBookingTime) && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <AppIcon name="Clock" size={13} color={Colors.secondaryCobalt} />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: Colors.secondaryCobalt }}>
                    {realBookingTime.startsWith('Booked:') ? realBookingTime : `Booked: ${realBookingTime}`}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Stylized Corridor Map Preview Box */}
          <View style={styles.mapContainer}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800&auto=format&fit=crop',
              }}
              style={styles.mapImage}
              resizeMode="cover"
            />
            <View style={styles.mapCorridorTag}>
              <View style={styles.blueDot} />
              <Text style={styles.mapCorridorText}>DLF Phase 2 Corridor</Text>
            </View>

            <View style={styles.mapBottomBar}>
              <View style={styles.mapBottomLeft}>
                <AppIcon name="MapPin" size={18} />
                <Text style={styles.mapTechsNearText}>3 verified techs within 3.5 km</Text>
              </View>
              <View style={styles.fastestEtaPill}>
                <Text style={styles.fastestEtaText}>Fastest: 8 min</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 7. Technician Assignment State Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardEyebrow}>FIELD ASSIGNMENT</Text>
            <Text style={styles.pendingMatchBadge}>Pending Match</Text>
          </View>

          <View style={styles.unassignedPromptBox}>
            <View style={styles.unassignedIconWrapper}>
              <AppIcon name="User" size={18} />
              <View style={styles.warningMiniDot}>
                <AppIcon name="TriangleAlert" size={14} />
              </View>
            </View>

            <Text style={styles.unassignedTitle}>Currently Unassigned</Text>
            <Text style={styles.unassignedDescription}>
              Customer awaiting technician match notification. Auto-dispatch paused for manual admin routing.
            </Text>

            <TouchableOpacity
              style={styles.selectTechBtn}
              onPress={() => setTechSheetVisible((prev) => !prev)}
              activeOpacity={0.85}
            >
              <AppIcon name="Plus" size={18} />
              <Text style={styles.selectTechBtnText}>
                {techSheetVisible ? 'Hide Recommended Techs' : 'Select & Assign Technician'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Expandable Recommended Technicians List */}
          {techSheetVisible && (
            <View style={styles.techDrawerBox}>
              <Text style={styles.techDrawerTitle}>AVAILABLE RECOMMENDED TECHS</Text>

              {/* Tech 1 */}
              <View style={styles.techRowItem}>
                <View style={styles.techItemLeft}>
                  <View style={styles.techAvatarPlaceholder}>
                    <Text style={styles.techInitials}>VS</Text>
                  </View>
                  <View>
                    <Text style={styles.techNameTitle}>Vikram Sethi</Text>
                    <Text style={styles.techSubMeta}>4.9 ★ • 1.2 km away (6m ETA)</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.assignActionBtn}
                  onPress={() => handleAssignTechnician('Vikram Sethi')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.assignActionBtnText}>Assign</Text>
                </TouchableOpacity>
              </View>

              {/* Tech 2 */}
              <View style={styles.techRowItem}>
                <View style={styles.techItemLeft}>
                  <View style={styles.techAvatarPlaceholder}>
                    <Text style={styles.techInitials}>AR</Text>
                  </View>
                  <View>
                    <Text style={styles.techNameTitle}>Ananya Roy</Text>
                    <Text style={styles.techSubMeta}>4.95 ★ • 2.8 km away (14m ETA)</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.assignActionBtn}
                  onPress={() => handleAssignTechnician('Ananya Roy')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.assignActionBtnText}>Assign</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 8. Dispatch Telemetry Log (Audit Timeline) */}
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>DISPATCH TELEMETRY LOG</Text>

          <View style={styles.timelineSpineBox}>
            <View style={styles.timelineVerticalLine} />

            {/* Step 1: Request Created */}
            <View style={styles.timelineStepRow}>
              <View style={[styles.timelineNode, styles.timelineNodeDone]}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.timelineStepContent}>
                <Text style={styles.timelineStepTitle}>Request Created</Text>
                <Text style={styles.timelineStepSub}>Standard customer self-service intake</Text>
              </View>
              <Text style={styles.timelineTimestamp}>03:12 PM</Text>
            </View>

            {/* Step 2: Customer OTP Verified */}
            <View style={styles.timelineStepRow}>
              <View style={[styles.timelineNode, styles.timelineNodeDone]}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.timelineStepContent}>
                <Text style={styles.timelineStepTitle}>Customer OTP Verified</Text>
                <Text style={styles.timelineStepSub}>Device 2FA signed +91 98201 44810</Text>
              </View>
              <Text style={styles.timelineTimestamp}>03:14 PM</Text>
            </View>

            {/* Step 3: Awaiting Technician Assignment (Current) */}
            <View style={styles.timelineStepRow}>
              <View style={[styles.timelineNode, styles.timelineNodeActive]}>
                <View style={styles.nodeActiveInner} />
              </View>
              <View style={styles.timelineStepContent}>
                <Text style={styles.timelineStepTitleActive}>Awaiting Technician Assignment</Text>
                <Text style={styles.timelineStepSubActive}>Pending operator routing manual override</Text>
              </View>
              <Text style={styles.timelineTimestampActive}>03:30 PM</Text>
            </View>

            {/* Step 4: Technician En Route */}
            <View style={[styles.timelineStepRow, styles.timelineStepPending]}>
              <View style={[styles.timelineNode, styles.timelineNodePending]}>
                <View style={styles.nodePendingInner} />
              </View>
              <View style={styles.timelineStepContent}>
                <Text style={styles.timelineStepTitlePending}>Technician En Route</Text>
                <Text style={styles.timelineStepSubPending}>Live telemetry tracker standby</Text>
              </View>
              <Text style={styles.timelineTimestampPending}>--:--</Text>
            </View>

            {/* Step 5: Service & Digital Sign-off */}
            <View style={[styles.timelineStepRow, styles.timelineStepPending]}>
              <View style={[styles.timelineNode, styles.timelineNodePending]}>
                <View style={styles.nodePendingInner} />
              </View>
              <View style={styles.timelineStepContent}>
                <Text style={styles.timelineStepTitlePending}>Service & Digital Sign-off</Text>
                <Text style={styles.timelineStepSubPending}>Post-calibration pressure gauge audit</Text>
              </View>
              <Text style={styles.timelineTimestampPending}>--:--</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 9. Sticky Bottom Operational Action Bar */}
      <View style={[styles.stickyBottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.stickyBottomInner}>
          <TouchableOpacity
            style={styles.flagEscalateBtn}
            onPress={handleEscalate}
            activeOpacity={0.7}
          >
            <AppIcon name="Flag" size={16} color="#BA1A1A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mainAssignCtaBtn}
            onPress={() => handleAssignTechnician()}
            activeOpacity={0.88}
          >
            <Text style={styles.mainAssignCtaText}>Assign Technician</Text>
            <Text style={styles.mainAssignCtaArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: 12,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        zIndex: 50,
      },
    }),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  superAdminTag: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  profileAvatarTop: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  profileAvatarText: {
    fontSize: 14,
    color: Colors.onPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    gap: 12,
  },
  heroCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    ...Shadows.level1,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusBadgeUnassigned: {
    backgroundColor: '#ffdad6',
  },
  statusBadgeAssigned: {
    backgroundColor: '#6ffbbe',
  },
  statusBeaconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  beaconRed: {
    backgroundColor: '#ba1a1a',
  },
  beaconGreen: {
    backgroundColor: '#005236',
  },
  statusBadgeText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statusTextUnassigned: {
    color: '#93000a',
  },
  statusTextAssigned: {
    color: '#002113',
  },
  trackingCodeBadge: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroTitleCol: {
    flex: 1,
  },
  heroServiceTitle: {
    ...Typography.titleLg,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  heroSubText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  slaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
  },
  slaTimerIcon: {
    fontSize: 13,
  },
  slaTimerText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    ...Shadows.level1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardEyebrow: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  verifiedCheck: {
    fontSize: 11,
    fontWeight: '900',
    color: '#002113',
  },
  tierBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#002113',
  },
  customerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customerAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarInitial: {
    ...Typography.labelMd,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSecondary,
  },
  customerInfoCol: {
    flex: 1,
  },
  customerNameRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  customerNameTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  ratingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starIcon: {
    fontSize: 12,
    color: Colors.secondaryCobalt,
  },
  ratingValueText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  ratingCountSub: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  customerPhoneText: {
    ...Typography.labelMono,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  quickActionGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  quickActionBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: {
    fontSize: 16,
  },
  addressSnippetBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
    marginTop: 10,
  },
  addressPinIcon: {
    fontSize: 15,
    marginTop: 1,
  },
  addressText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurface,
    lineHeight: 17,
    flex: 1,
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    marginTop: 10,
  },
  viewProfileBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  chevronSmall: {
    fontSize: 14,
    color: Colors.onSurface,
  },
  tensionSpecBadge: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
  hardwareHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hardwareTitleCol: {
    flex: 1,
  },
  hardwarePrimaryTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  chairTargetSub: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '500',
    color: Colors.secondaryCobalt,
    marginTop: 2,
  },
  oemGradeTag: {
    ...Typography.labelMono,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
    paddingTop: 2,
  },
  defectLogBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
    marginVertical: 6,
  },
  defectLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  stethoscopeIcon: {
    fontSize: 13,
  },
  defectLogLabel: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  defectLogText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurface,
    lineHeight: 17,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  chipPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  chipError: {
    backgroundColor: '#ffdad6',
  },
  chipTextError: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '600',
    color: '#93000a',
  },
  chipNeutral: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  chipTextNeutral: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  chipAccent: {
    backgroundColor: '#dbe1ff',
  },
  chipTextAccent: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '600',
    color: '#003ea8',
  },
  evidenceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  evidenceCountPill: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evidenceCountText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  telemetricHdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  zoomIcon: {
    fontSize: 12,
  },
  telemetricHdText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  photoThumbContainer: {
    flex: 1,
    height: 120,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainer,
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  photoOverlayTitle: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  photoOverlaySub: {
    fontSize: 9,
    color: '#dae2fd',
  },
  photoTapHint: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
  },
  targetWindowBadge: {
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  targetWindowText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#002113',
  },
  scheduleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  calendarIcon: {
    fontSize: 20,
  },
  scheduleDateText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  scheduleSlotText: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.onSurfaceVariant,
  },
  mapContainer: {
    height: 130,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceContainer,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapCorridorTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    ...Shadows.level1,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  mapCorridorText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  mapBottomBar: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
    ...Shadows.level1,
  },
  mapBottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nearMeIcon: {
    fontSize: 12,
  },
  mapTechsNearText: {
    ...Typography.bodySm,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.onSurface,
  },
  fastestEtaPill: {
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  fastestEtaText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#002113',
  },
  pendingMatchBadge: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  unassignedPromptBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 14,
    alignItems: 'center',
    textAlign: 'center',
  },
  unassignedIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  personOffIcon: {
    fontSize: 24,
    color: Colors.onSurfaceVariant,
  },
  warningMiniDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffdad6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningMiniText: {
    fontSize: 10,
  },
  unassignedTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  unassignedDescription: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 10,
    lineHeight: 16,
  },
  selectTechBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.secondaryCobalt,
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    ...Shadows.level1,
  },
  selectTechIcon: {
    fontSize: 13,
    color: Colors.onSecondary,
  },
  selectTechBtnText: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSecondary,
  },
  techDrawerBox: {
    marginTop: 10,
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainer,
  },
  techDrawerTitle: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  techRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.lg,
    padding: 10,
  },
  techItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  techAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  techInitials: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  techNameTitle: {
    ...Typography.titleLg,
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  techSubMeta: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  assignActionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  assignActionBtnText: {
    ...Typography.labelMd,
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  timelineSpineBox: {
    marginTop: 12,
    position: 'relative',
    paddingLeft: 22,
    gap: 16,
  },
  timelineVerticalLine: {
    position: 'absolute',
    left: 9,
    top: 6,
    bottom: 8,
    width: 2,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  timelineStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
  },
  timelineStepPending: {
    opacity: 0.5,
  },
  timelineNode: {
    position: 'absolute',
    left: -22,
    top: 1,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodeDone: {
    backgroundColor: '#6ffbbe',
  },
  nodeCheck: {
    fontSize: 11,
    fontWeight: '900',
    color: '#002113',
  },
  timelineNodeActive: {
    backgroundColor: Colors.secondaryCobalt,
  },
  nodeActiveInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  timelineNodePending: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  nodePendingInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.outline,
  },
  timelineStepContent: {
    flex: 1,
    paddingRight: 8,
  },
  timelineStepTitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  timelineStepSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  timelineTimestamp: {
    ...Typography.labelMono,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  timelineStepTitleActive: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  timelineStepSubActive: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  timelineTimestampActive: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  timelineStepTitlePending: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurface,
  },
  timelineStepSubPending: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  timelineTimestampPending: {
    ...Typography.labelMono,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    ...Platform.select({
      web: {
        zIndex: 40,
      },
    }),
  },
  stickyBottomInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flagEscalateBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagEscalateIcon: {
    fontSize: 20,
  },
  mainAssignCtaBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  mainAssignCtaText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  mainAssignCtaArrow: {
    fontSize: 18,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
});
