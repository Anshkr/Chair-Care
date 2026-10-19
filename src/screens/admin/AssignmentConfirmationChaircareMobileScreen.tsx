import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useTechnician } from '../../context/TechnicianContext';
import { adminApi } from '../../services/api/adminApi';

interface AssignmentConfirmationProps {
  navigation?: any;
  route?: {
    params?: {
      requestId?: string;
      requestItem?: any;
      selectedTechnician?: any;
    };
  };
}

export const AssignmentConfirmationChaircareMobileScreen: React.FC<AssignmentConfirmationProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const techContext = useTechnician();

  const passedItem = route?.params?.requestItem;
  const passedId = route?.params?.requestId;
  const passedTech = route?.params?.selectedTechnician;

  // Selected request details with fallback to canonical CC-10483
  const trackingCode =
    passedItem?.trackingCode || (passedId ? `CC-${passedId.replace('req-', '')}` : 'CC-10483');
  const serviceTitle = passedItem?.serviceTitle || 'Hydraulic Replacement';
  const chairModel = passedItem?.chairModel || 'Steelcase Gesture';
  const customerName = passedItem?.customerName || 'Priya Sharma';
  const customerRating = passedItem?.customerRating || 4.85;
  const locationText = passedItem?.locationText || 'Oakwood Estate, DLF Phase 2, Gurugram';
  const windowText = passedItem?.scheduleText || 'Today, 12 Oct • 04:00 PM – 05:30 PM';

  // Selected technician details with fallback to Rahul Sharma
  const techName = passedTech?.name || 'Rahul Sharma';
  const techRating = passedTech?.rating || 4.9;
  const techDistance = passedTech?.distanceKm || 2.4;
  const techAvatarUrl =
    passedTech?.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop';
  const isMasterCertified = passedTech?.isMasterCertified !== false;

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleConfirmAssignment = async () => {
    setIsSubmitting(true);
    const targetRequestId = passedId || passedItem?.id || 'req-10483';
    const targetTechId = passedTech?.id || 'tech-01';

    try {
      const res = await adminApi.assignTechnician(targetRequestId, targetTechId);
      if (res.error) {
        Alert.alert('Assignment Error', res.error || 'Failed to assign technician to request.');
        setIsSubmitting(false);
        return;
      }

      // Commit the assignment into technician context / local state
      if (techContext?.setAcceptedRequest) {
        techContext.setAcceptedRequest({
          id: targetRequestId,
          trackingCode,
          serviceTitle,
          chairModel,
          customerName,
          locationText,
          technicianName: techName,
          technicianRating: techRating,
          status: 'assigned',
          assignedAt: new Date().toISOString(),
        });
      }

      setIsSubmitting(false);

      if (navigation) {
        navigation.navigate('AssignmentSuccess', {
          requestId: targetRequestId,
          requestItem: {
            ...passedItem,
            id: targetRequestId,
            trackingCode,
            serviceTitle,
            chairModel,
            customerName,
            locationText,
            status: 'assigned',
          },
          assignedTechnician: {
            name: techName,
            rating: techRating,
            distanceKm: techDistance,
            avatarUrl: techAvatarUrl,
          },
        });
      }
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Connection Error', err.message || 'Unable to communicate with assignment service.');
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Bar */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation?.canGoBack() ? navigation.goBack() : navigation?.navigate('AssignTechnician'))}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.superAdminTag}>SUPER ADMIN • DISPATCH</Text>
            <Text style={styles.headerTitle}>Assignment Confirmation</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => Alert.alert('Assignment Details', 'Manual dispatcher routing audit protocol #DISP-9921.')}
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
          { paddingBottom: Math.max(insets.bottom + 30, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Interactive Modal Indicator Handle */}
        <View style={styles.modalHandleWrapper}>
          <View style={styles.modalHandle} />
        </View>

        {/* 2. Modal Header & Identity */}
        <View style={styles.modalHeaderBlock}>
          <View style={styles.badgeHeroWrapper}>
            <View style={styles.badgeHeroCircle}>
              <AppIcon name="Truck" size={28} />
            </View>
            <View style={styles.heroVerifiedMini}>
              <AppIcon name="Check" size={28} />
            </View>
          </View>

          <View style={styles.ticketPillHeader}>
            <View style={styles.ticketPillDot} />
            <Text style={styles.ticketPillText}>TICKET #{trackingCode}</Text>
          </View>

          <Text style={styles.modalHeadline}>Assign Technician?</Text>
          <Text style={styles.modalSubHeadline}>
            Confirm manual dispatch routing for ticket{' '}
            <Text style={styles.modalSubTicketBold}>#{trackingCode}</Text>. The technician will
            receive an instant priority push prompt.
          </Text>
        </View>

        {/* 3. Target Service Card */}
        <View style={styles.card}>
          <View style={styles.serviceHeaderRow}>
            <View style={styles.serviceTitleLeft}>
              <View style={styles.serviceIconSquare}>
                <AppIcon name="Settings" size={18} />
              </View>
              <View>
                <Text style={styles.serviceTargetLabel}>TARGET SERVICE</Text>
                <Text style={styles.servicePrimaryTitle}>{serviceTitle}</Text>
              </View>
            </View>

            <View style={styles.chairTagPill}>
              <AppIcon name="Armchair" size={18} />
              <Text style={styles.chairTagText}>Gesture</Text>
            </View>
          </View>

          {/* Diagnostic Details Pill */}
          <View style={styles.diagnosticPillBox}>
            <AppIcon name="TriangleAlert" size={18} />
            <Text style={styles.diagnosticPillText} numberOfLines={1}>
              Diagnostic: <Text style={styles.boldWhiteText}>{chairModel}</Text> • Sinking Class-4 Cylinder
            </Text>
          </View>

          {/* Customer and Timing Details Grid */}
          <View style={styles.detailsGrid}>
            {/* Customer */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabelCol}>
                <AppIcon name="User" size={18} />
                <Text style={styles.detailLabelText}>Customer:</Text>
              </View>
              <View style={styles.customerValueRow}>
                <Text style={styles.customerNameBold}>{customerName}</Text>
                <View style={styles.customerRatingMiniPill}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" /><Text style={styles.customerRatingMiniText}>{customerRating}</Text></View>
                </View>
              </View>
            </View>

            {/* Location */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabelCol}>
                <AppIcon name="MapPin" size={18} />
                <Text style={styles.detailLabelText}>Location:</Text>
              </View>
              <Text style={styles.detailValueRight} numberOfLines={2}>
                {locationText}
              </Text>
            </View>

            {/* Window */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabelCol}>
                <AppIcon name="Clock" size={18} />
                <Text style={styles.detailLabelText}>Window:</Text>
              </View>
              <Text style={styles.windowValueMono}>{windowText}</Text>
            </View>
          </View>
        </View>

        {/* 4. Assigned Field Specialist Card */}
        <View style={styles.card}>
          <View style={styles.specialistCardHeader}>
            <Text style={styles.candidateMatchEyebrow}>CANDIDATE MATCH #1</Text>
            <View style={styles.autoRankPill}>
              <Text style={styles.autoRankText}>Auto-Rank 98.4%</Text>
            </View>
          </View>

          {/* Specialist Identity Header */}
          <View style={styles.specialistIdentityBox}>
            <View style={styles.specialistAvatarWrapper}>
              <Image
                source={{ uri: techAvatarUrl }}
                style={styles.specialistAvatarImg}
                resizeMode="cover"
              />
              <View style={styles.specialistOnlineBeacon} />
            </View>

            <View style={styles.specialistNameCol}>
              <View style={styles.specialistNameRow}>
                <Text style={styles.specialistNameBold}>{techName}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" /><Text style={styles.starRatingBadge}>{techRating}</Text></View>
              </View>

              {isMasterCertified && (
                <View style={styles.bifmaBadge}>
                  <AppIcon name="Check" size={18} />
                  <Text style={styles.bifmaText}>BIFMA Level-3 Verified</Text>
                </View>
              )}
            </View>
          </View>

          {/* Specialist Metrics Cluster */}
          <View style={styles.metricsClusterGrid}>
            <View style={styles.metricClusterCell}>
              <View style={styles.metricCellHeader}>
                <AppIcon name="MapPin" size={18} />
                <Text style={styles.metricLabelMono}>DISTANCE</Text>
              </View>
              <Text style={styles.metricValuePrimary}>{techDistance} km</Text>
              <Text style={styles.metricSubText}>via Golf Course Rd</Text>
            </View>

            <View style={styles.metricClusterCell}>
              <View style={styles.metricCellHeader}>
                <AppIcon name="Clock" size={18} />
                <Text style={styles.metricLabelMono}>ETA ARRIVAL</Text>
              </View>
              <Text style={styles.metricValueCobalt}>~14 mins</Text>
              <Text style={styles.metricSubText}>Live route active</Text>
            </View>
          </View>

          {/* Status Breakdown Checklist */}
          <View style={styles.checklistCol}>
            <View style={styles.checklistItem}>
              <View style={styles.checkItemLeft}>
                <AppIcon name="Package" size={18} />
                <Text style={styles.checkItemLabel}>Van Inventory Check</Text>
              </View>
              <Text style={styles.checkItemGreen}>Class-4 Strut in Stock</Text>
            </View>

            <View style={styles.checklistItem}>
              <View style={styles.checkItemLeft}>
                <AppIcon name="Clock" size={18} />
                <Text style={styles.checkItemLabel}>Acceptance SLA Window</Text>
              </View>
              <Text style={styles.checkItemCobalt}>5 mins before fallback</Text>
            </View>
          </View>
        </View>

        {/* 5. Dispatch Protocol & SLA Notice Box */}
        <View style={styles.overrideNoticeBox}>
          <View style={styles.shieldIconWrapper}>
            <AppIcon name="ShieldCheck" size={18} />
          </View>
          <View style={styles.overrideNoticeContent}>
            <View style={styles.overrideNoticeHeader}>
              <Text style={styles.overrideTitle}>Manual Admin Override</Text>
              <View style={styles.bypassTag}>
                <Text style={styles.bypassText}>BYPASS</Text>
              </View>
            </View>
            <Text style={styles.overrideBody}>
              Assigning this technician bypasses the algorithmic round-robin.{' '}
              <Text style={styles.overrideTechName}>{techName}</Text> has 0 active tickets and is
              flagged as optimal route candidate.
            </Text>
          </View>
        </View>

        {/* 6. Action Controls (Dual Stack) */}
        <View style={styles.actionsDualStack}>
          <TouchableOpacity
            style={styles.confirmMainBtn}
            onPress={handleConfirmAssignment}
            disabled={isSubmitting}
            activeOpacity={0.88}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.onPrimary} size="small" />
            ) : (
              <>
                <Text style={styles.confirmMainBtnText}>Confirm Assignment</Text>
                <Text style={styles.confirmMainArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelSecondaryBtn}
            onPress={() => (navigation?.canGoBack() ? navigation.goBack() : navigation?.navigate('AssignTechnician'))}
            disabled={isSubmitting}
            activeOpacity={0.75}
          >
            <Text style={styles.cancelSecondaryBtnText}>Choose Another Technician</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingTop: 8,
    gap: 12,
  },
  modalHandleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  modalHandle: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  modalHeaderBlock: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: 6,
  },
  badgeHeroWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  badgeHeroCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#dbe1ff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  heroTruckIcon: {
    fontSize: 32,
  },
  heroVerifiedMini: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4edea3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  heroVerifiedCheck: {
    fontSize: 12,
    fontWeight: '900',
    color: '#002113',
  },
  ticketPillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: 8,
  },
  ticketPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  ticketPillText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  modalHeadline: {
    ...Typography.headlineSm,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  modalSubHeadline: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  modalSubTicketBold: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    ...Shadows.level1,
  },
  serviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  serviceTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  serviceIconSquare: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTuneIcon: {
    fontSize: 18,
  },
  serviceTargetLabel: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  servicePrimaryTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  chairTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  chairIcon: {
    fontSize: 12,
  },
  chairTagText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  diagnosticPillBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    marginBottom: 10,
  },
  warningIcon: {
    fontSize: 14,
  },
  diagnosticPillText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  boldWhiteText: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  detailsGrid: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  detailLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 90,
  },
  detailIcon: {
    fontSize: 13,
  },
  detailLabelText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  customerValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerNameBold: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  customerRatingMiniPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  customerRatingMiniText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  detailValueRight: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurface,
    textAlign: 'right',
    flex: 1,
    lineHeight: 16,
  },
  windowValueMono: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
    textAlign: 'right',
  },
  specialistCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  candidateMatchEyebrow: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    letterSpacing: 0.8,
  },
  autoRankPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  autoRankText: {
    ...Typography.labelMd,
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  specialistIdentityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    padding: 10,
    marginBottom: 10,
  },
  specialistAvatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  specialistAvatarImg: {
    width: '100%',
    height: '100%',
  },
  specialistOnlineBeacon: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4edea3',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  specialistNameCol: {
    flex: 1,
  },
  specialistNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specialistNameBold: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  starRatingBadge: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: '#005236',
  },
  bifmaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  bifmaCheck: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.secondaryCobalt,
  },
  bifmaText: {
    ...Typography.labelMd,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  metricsClusterGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  metricClusterCell: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
  },
  metricCellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  metricIcon: {
    fontSize: 12,
  },
  metricLabelMono: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  metricValuePrimary: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  metricValueCobalt: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  metricSubText: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  checklistCol: {
    gap: 6,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  checkItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  packageIcon: {
    fontSize: 13,
  },
  hourglassIcon: {
    fontSize: 13,
  },
  checkItemLabel: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurface,
  },
  checkItemGreen: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: '#005236',
  },
  checkItemCobalt: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  overrideNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.xl,
    padding: 12,
    ...Shadows.level1,
  },
  shieldIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  shieldIcon: {
    fontSize: 16,
  },
  overrideNoticeContent: {
    flex: 1,
  },
  overrideNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  overrideTitle: {
    ...Typography.titleLg,
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  bypassTag: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  bypassText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  overrideBody: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  overrideTechName: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  actionsDualStack: {
    gap: 8,
    marginTop: 4,
  },
  confirmMainBtn: {
    height: 52,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  confirmMainBtnText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  confirmMainArrow: {
    fontSize: 18,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  cancelSecondaryBtn: {
    height: 46,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelSecondaryBtnText: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
});
