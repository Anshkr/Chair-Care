import { AppIcon } from '../../components/common/AppIcon';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface TechnicianActionConfirmedProps {
  navigation?: any;
  route?: {
    params?: {
      actionType?: 'suspend' | 'reactivate' | 'approve' | 'reject';
      actionTitle?: string;
      actionSubtitle?: string;
      technicianId?: string;
      technician?: any;
    };
  };
}

export const TechnicianActionConfirmedChaircareMobileScreen: React.FC<
  TechnicianActionConfirmedProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const params = route?.params;

  const actionType = params?.actionType || 'suspend';
  const passedTech = params?.technician;
  const techId = params?.technicianId || passedTech?.id || 'tech-01';

  // Selected technician details with graceful fallback to canonical Rahul Sharma reference
  const techName = passedTech?.name || 'Rahul Sharma';
  const techCode = passedTech?.code || '#TECH-884-DL';
  const avatarUrl =
    passedTech?.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop';
  const reasonCited =
    passedTech?.suspensionReason ||
    passedTech?.reactivationReason ||
    (actionType === 'suspend'
      ? 'Customer complaint'
      : actionType === 'reactivate'
      ? 'Audit / Review Cleared'
      : actionType === 'approve'
      ? 'BIFMA Certification & Identity Verified'
      : 'Application Criteria Non-Compliant');

  // Format dynamic timestamp or use reference standard
  const dateFormatted = '12 Oct 2026 • 04:15 PM IST';

  // Dynamic visual configurations based on actionType
  const isSuspended = actionType === 'suspend';
  const isReactivated = actionType === 'reactivate';
  const isApproved = actionType === 'approve';

  const headline =
    params?.actionTitle ||
    (isSuspended
      ? 'Technician Suspended'
      : isReactivated
      ? 'Technician Reactivated'
      : isApproved
      ? 'Technician Verified & Onboarded'
      : 'Technician Application Rejected');

  const description =
    params?.actionSubtitle ||
    (isSuspended
      ? `${techName} has been temporarily suspended and will no longer receive new service requests or auto-dispatch matching.`
      : isReactivated
      ? `${techName} has been restored to active duty and is eligible for auto-dispatch and ticket acceptance.`
      : isApproved
      ? `${techName} has been verified and registered for field operations in the Gurugram & Faridabad corridor.`
      : `${techName}'s application has been rejected and closed in the administrative portal.`);

  const badgePillText = isSuspended
    ? 'STATUS DISPATCH MUTED'
    : isReactivated
    ? 'STATUS DISPATCH RESTORED'
    : isApproved
    ? 'STATUS ONBOARDED & AUDITED'
    : 'STATUS APPLICATION REJECTED';

  const statusLabel = isSuspended
    ? 'Suspended'
    : isReactivated
    ? 'Online & Dispatched'
    : isApproved
    ? 'Active'
    : 'Rejected';

  const handleViewProfile = () => {
    if (navigation) {
      navigation.navigate('TechnicianProfileRahulSharma', {
        technicianId: techId,
        technician: passedTech || {
          id: techId,
          name: techName,
          code: techCode,
          avatarUrl,
          status: isSuspended ? 'suspended' : 'online',
          isVerified: !isSuspended,
        },
      });
    }
  };

  const handleBackToList = () => {
    if (navigation) {
      navigation.navigate('Technicians');
    }
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24) + 16,
            paddingBottom: Math.max(insets.bottom, 24) + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Status Confirmation Hero (Precision State Capsule) */}
        <View style={styles.heroSection}>
          {/* Ambient status halo glow */}
          <View
            style={[
              styles.ambientGlow,
              isSuspended ? styles.glowError : isApproved ? styles.glowSuccess : styles.glowCobalt,
            ]}
          />

          {/* Verified Mechanical Seal Badge */}
          <View
            style={[
              styles.sealBadgeContainer,
              isSuspended
                ? styles.sealContainerError
                : isApproved
                ? styles.sealContainerSuccess
                : styles.sealContainerCobalt,
            ]}
          >
            <View style={styles.sealInner}>
              <AppIcon name={isSuspended ? 'ShieldAlert' : isApproved ? 'CheckCircle2' : 'RefreshCw'} size={20} />
            </View>

            {/* Subtle ring accent marker */}
            <View
              style={[
                styles.ringAccentMarker,
                isSuspended ? styles.accentMarkerError : styles.accentMarkerCobalt,
              ]}
            >
              <AppIcon name={isSuspended ? 'Pause' : 'Check'} size={10} color="#ffffff" />
            </View>
          </View>

          {/* Badge Pill */}
          <View
            style={[
              styles.statusDispatchPill,
              isSuspended
                ? styles.pillError
                : isApproved
                ? styles.pillSuccess
                : styles.pillCobalt,
            ]}
          >
            <View
              style={[
                styles.pulsingDot,
                isSuspended
                  ? styles.dotError
                  : isApproved
                  ? styles.dotSuccess
                  : styles.dotCobalt,
              ]}
            />
            <Text
              style={[
                styles.statusDispatchPillText,
                isSuspended
                  ? styles.pillTextError
                  : isApproved
                  ? styles.pillTextSuccess
                  : styles.pillTextCobalt,
              ]}
            >
              {badgePillText}
            </Text>
          </View>

          {/* Main Title */}
          <Text style={styles.heroTitle}>{headline}</Text>

          {/* Subtitle Description */}
          <Text style={styles.heroDescription}>{description}</Text>
        </View>

        {/* 2. Execution Summary Card (Industrial Spec Sheet Style) */}
        <View style={styles.manifestCard}>
          {/* Header Strip */}
          <View style={styles.manifestHeaderStrip}>
            <View style={styles.manifestHeaderLeft}>
              <View
                style={[
                  styles.headerDot,
                  isSuspended ? styles.headerDotError : styles.headerDotSuccess,
                ]}
              />
              <Text style={styles.manifestHeaderText}>EXECUTION MANIFEST</Text>
            </View>
            <Text style={styles.manifestNodeText}>ZONE: DELHI NCR</Text>
          </View>

          <View style={styles.manifestBody}>
            {/* Technician Core Profile Row */}
            <View style={styles.techProfileRow}>
              <View style={styles.techAvatarBox}>
                <Image source={{ uri: avatarUrl }} style={styles.techAvatarImg} />
              </View>

              <View style={styles.techProfileInfo}>
                <View style={styles.techNameRow}>
                  <Text style={styles.techProfileName} numberOfLines={1}>
                    {techName}
                  </Text>
                  <AppIcon name="ShieldCheck" size={18} />
                </View>
                <Text style={styles.techIdMono}>ID: {techCode}</Text>
              </View>

              <View
                style={[
                  styles.statusTag,
                  isSuspended
                    ? styles.statusTagError
                    : isApproved
                    ? styles.statusTagSuccess
                    : styles.statusTagCobalt,
                ]}
              >
                <View
                  style={[
                    styles.tagDot,
                    isSuspended
                      ? styles.tagDotError
                      : isApproved
                      ? styles.tagDotSuccess
                      : styles.tagDotCobalt,
                  ]}
                />
                <Text
                  style={[
                    styles.statusTagText,
                    isSuspended
                      ? styles.statusTagTextError
                      : isApproved
                      ? styles.statusTagTextSuccess
                      : styles.statusTagTextCobalt,
                  ]}
                >
                  {statusLabel}
                </Text>
              </View>
            </View>

            {/* Key-Value Telemetry Details */}
            <View style={styles.telemetryList}>
              <View style={styles.telemetryItem}>
                <View style={styles.telemetryLabelRow}>
                  <AppIcon name="TriangleAlert" size={18} />
                  <Text style={styles.telemetryLabel}>Reason Cited</Text>
                </View>
                <Text style={styles.telemetryValue} numberOfLines={1}>
                  {reasonCited}
                </Text>
              </View>

              <View style={styles.telemetryItem}>
                <View style={styles.telemetryLabelRow}>
                  <AppIcon name="Clock" size={18} />
                  <Text style={styles.telemetryLabel}>Effective Date & Time</Text>
                </View>
                <Text style={styles.telemetryValueMono}>{dateFormatted}</Text>
              </View>

              <View style={styles.telemetryItem}>
                <View style={styles.telemetryLabelRow}>
                  <AppIcon name="Lock" size={18} />
                  <Text style={styles.telemetryLabel}>Admin Token</Text>
                </View>
                <Text style={styles.telemetryValueMuted}>Signed: Session #8849</Text>
              </View>

              {/* Real-time Queue Isolation Metric */}
              <View style={styles.impactMetricCard}>
                <View style={styles.impactLeft}>
                  <View style={styles.impactIconBox}>
                    <AppIcon name="GitBranch" size={16} color={Colors.secondary} />
                  </View>
                  <View>
                    <Text style={styles.impactTitle}>Live Ticket Impact</Text>
                    <Text style={styles.impactSubtitle}>
                      {isSuspended
                        ? '0 active tickets in jeopardy'
                        : 'Immediate eligibility restored'}
                    </Text>
                  </View>
                </View>
                <View style={styles.impactBadge}>
                  <Text style={styles.impactBadgeText}>
                    {isSuspended ? 'Auto-Rerouted' : 'Auto-Dispatched'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Operational Notice Banner */}
        <View style={styles.noticeBanner}>
          <View style={styles.noticeIconCircle}>
            <AppIcon name="Bell" size={18} />
          </View>
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Automated Dispatch Protocol</Text>
            <Text style={styles.noticeDesc}>
              {isSuspended
                ? 'The technician has been notified via priority SMS & app notification with instructions for re-evaluating their account.'
                : 'The technician has been notified of their verified standing and corridor assignment.'}
            </Text>
          </View>
        </View>

        {/* 4. Reactivation Pattern Note (Dual-State Reversibility Showcase) */}
        <View style={styles.reversibilityCard}>
          <View style={styles.reversibilityHeader}>
            <View style={styles.reversibilityTitleRow}>
              <AppIcon name="RefreshCw" size={18} />
              <Text style={styles.reversibilityTitle}>Status Control Pattern</Text>
            </View>
            <Text style={styles.reversibleMonoTag}>REVERSIBLE</Text>
          </View>

          {/* Dual State Visual Switch Mockup */}
          <View style={styles.dualStateSwitch}>
            <View
              style={[
                styles.switchSide,
                isSuspended ? styles.switchSideActiveError : styles.switchSideInactive,
              ]}
            >
              <View
                style={[
                  styles.switchDot,
                  { backgroundColor: isSuspended ? '#ba1a1a' : '#c6c6cd' },
                ]}
              />
              <Text
                style={[
                  styles.switchText,
                  { color: isSuspended ? '#ba1a1a' : '#76777d' },
                ]}
              >
                Suspended
              </Text>
            </View>

            <View style={styles.switchDivider}>
              <AppIcon name="RefreshCw" size={20} />
            </View>

            <View
              style={[
                styles.switchSide,
                !isSuspended ? styles.switchSideActiveSuccess : styles.switchSideInactive,
              ]}
            >
              <View
                style={[
                  styles.switchDot,
                  { backgroundColor: !isSuspended ? '#009668' : '#c6c6cd' },
                ]}
              />
              <Text
                style={[
                  styles.switchText,
                  { color: !isSuspended ? '#005236' : '#76777d' },
                ]}
              >
                Active Calibrated
              </Text>
            </View>
          </View>

          <Text style={styles.reversibilityDesc}>
            Status Control: This technician can be transitioned to{' '}
            <Text style={styles.boldText}>
              {isSuspended ? 'Active status' : 'Suspended status'}
            </Text>{' '}
            at any time via the Admin Control Center once reviewed.
          </Text>
        </View>

        {/* 5. Bottom Action Controls */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleViewProfile}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>View Technician Profile</Text>
            <Text style={styles.primaryBtnArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleBackToList}
            activeOpacity={0.8}
          >
            <AppIcon name="Users" size={18} />
            <Text style={styles.secondaryBtnText}>Back to All Technicians</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    marginTop: 8,
    marginBottom: 6,
  },
  ambientGlow: {
    position: 'absolute',
    top: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  glowError: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
  },
  glowSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  glowCobalt: {
    backgroundColor: 'rgba(0, 81, 213, 0.08)',
  },
  sealBadgeContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Shadows.level2,
  },
  sealContainerError: {
    backgroundColor: '#ffdad6',
  },
  sealContainerSuccess: {
    backgroundColor: '#d1fae5',
  },
  sealContainerCobalt: {
    backgroundColor: '#dbe1ff',
  },
  sealInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealIcon: {
    fontSize: 34,
  },
  ringAccentMarker: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  accentMarkerError: {
    backgroundColor: '#ba1a1a',
  },
  accentMarkerCobalt: {
    backgroundColor: '#0051d5',
  },
  accentMarkerText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  statusDispatchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 10,
  },
  pillError: {
    backgroundColor: '#ffdad6',
  },
  pillSuccess: {
    backgroundColor: '#d1fae5',
  },
  pillCobalt: {
    backgroundColor: '#dbe1ff',
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotError: {
    backgroundColor: '#ba1a1a',
  },
  dotSuccess: {
    backgroundColor: '#009668',
  },
  dotCobalt: {
    backgroundColor: '#0051d5',
  },
  statusDispatchPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  pillTextError: {
    color: '#93000a',
  },
  pillTextSuccess: {
    color: '#005236',
  },
  pillTextCobalt: {
    color: '#00174b',
  },
  heroTitle: {
    ...Typography.headlineMd,
    fontSize: 26,
    fontWeight: '800',
    color: '#191c1e',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  heroDescription: {
    ...Typography.bodyMd,
    fontSize: 13,
    lineHeight: 19,
    color: '#45464d',
    textAlign: 'center',
    maxWidth: 320,
  },
  manifestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.level1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  manifestHeaderStrip: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manifestHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerDotError: {
    backgroundColor: '#ba1a1a',
  },
  headerDotSuccess: {
    backgroundColor: '#009668',
  },
  manifestHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#45464d',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  manifestNodeText: {
    fontSize: 11,
    color: '#76777d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  manifestBody: {
    padding: 14,
    gap: 12,
  },
  techProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f2f4f6',
    padding: 10,
    borderRadius: 12,
  },
  techAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#e0e3e5',
  },
  techAvatarImg: {
    width: '100%',
    height: '100%',
  },
  techProfileInfo: {
    flex: 1,
    minWidth: 0,
  },
  techNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  techProfileName: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
    flexShrink: 1,
  },
  verifiedIcon: {
    fontSize: 12,
  },
  techIdMono: {
    fontSize: 11,
    color: '#45464d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTagError: {
    backgroundColor: '#ffdad6',
  },
  statusTagSuccess: {
    backgroundColor: '#d1fae5',
  },
  statusTagCobalt: {
    backgroundColor: '#dbe1ff',
  },
  tagDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tagDotError: {
    backgroundColor: '#ba1a1a',
  },
  tagDotSuccess: {
    backgroundColor: '#009668',
  },
  tagDotCobalt: {
    backgroundColor: '#0051d5',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTagTextError: {
    color: '#93000a',
  },
  statusTagTextSuccess: {
    color: '#005236',
  },
  statusTagTextCobalt: {
    color: '#00174b',
  },
  telemetryList: {
    gap: 8,
  },
  telemetryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  telemetryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  telemetryIcon: {
    fontSize: 13,
  },
  telemetryLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#45464d',
  },
  telemetryValue: {
    ...Typography.bodyMd,
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
    maxWidth: '50%',
    textAlign: 'right',
  },
  telemetryValueMono: {
    fontSize: 11,
    fontWeight: '600',
    color: '#191c1e',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  telemetryValueMuted: {
    fontSize: 11,
    color: '#76777d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  impactMetricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  impactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  impactIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactIcon: {
    fontSize: 14,
  },
  impactTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191c1e',
  },
  impactSubtitle: {
    fontSize: 11,
    color: '#45464d',
  },
  impactBadge: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  impactBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#191c1e',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f2f4f6',
    borderRadius: 14,
    padding: 14,
    ...Shadows.level1,
  },
  noticeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dbe1ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  noticeIconText: {
    fontSize: 13,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: 0.3,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  noticeDesc: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#45464d',
    lineHeight: 16,
  },
  reversibilityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    ...Shadows.level1,
    gap: 8,
  },
  reversibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reversibilityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reversibilityIcon: {
    fontSize: 15,
  },
  reversibilityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  reversibleMonoTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#76777d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  dualStateSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eceef0',
    padding: 4,
    borderRadius: 10,
    marginVertical: 4,
  },
  switchSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchSideActiveError: {
    backgroundColor: '#ffffff',
    ...Shadows.level1,
  },
  switchSideActiveSuccess: {
    backgroundColor: '#ffffff',
    ...Shadows.level1,
  },
  switchSideInactive: {
    backgroundColor: 'transparent',
  },
  switchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  switchText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  switchDivider: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchSyncIcon: {
    fontSize: 14,
    color: '#76777d',
  },
  reversibilityDesc: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#45464d',
    lineHeight: 16,
  },
  boldText: {
    fontWeight: '700',
    color: '#191c1e',
  },
  bottomActions: {
    gap: 10,
    marginTop: 6,
  },
  primaryBtn: {
    backgroundColor: '#191c1e',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  primaryBtnText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  primaryBtnArrow: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#e6e8ea',
    paddingVertical: 13,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnIcon: {
    fontSize: 15,
  },
  secondaryBtnText: {
    ...Typography.bodyMd,
    fontSize: 14,
    fontWeight: '600',
    color: '#191c1e',
  },
});
