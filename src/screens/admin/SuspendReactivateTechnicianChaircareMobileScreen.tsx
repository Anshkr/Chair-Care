import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useTechnician } from '../../context/TechnicianContext';
import { adminApi } from '../../services/api/adminApi';

interface SuspendReactivateScreenProps {
  navigation?: any;
  route?: {
    params?: {
      technicianId?: string;
      technician?: any;
      initialMode?: 'suspend' | 'reactivate';
    };
  };
}

interface SuspensionReasonOption {
  id: string;
  title: string;
  description: string;
}

const SUSPENSION_REASONS: SuspensionReasonOption[] = [
  {
    id: 'complaint',
    title: 'Customer complaint',
    description: 'Reported conduct, quality dispute, or escalation ticket',
  },
  {
    id: 'sla_breach',
    title: 'Performance issue / SLA breach',
    description: 'Repeated delayed arrivals or sub-threshold diagnostic score',
  },
  {
    id: 'doc_expiry',
    title: 'Verification / Document expiry',
    description: 'Driving license, background check, or certification out of date',
  },
  {
    id: 'policy_violation',
    title: 'Policy violation / Code of conduct',
    description: 'Non-compliance with safety gear, direct billing bypass, or fraud',
  },
  {
    id: 'leave',
    title: 'Temporary unavailability / Leave of absence',
    description: 'Technician requested medical, personal, or travel leave',
  },
  {
    id: 'other',
    title: 'Other operational discrepancy',
    description: 'Inventory reconciliation, audit hold, or vehicle repair downtime',
  },
];

const REACTIVATION_REASONS: SuspensionReasonOption[] = [
  {
    id: 'audit_cleared',
    title: 'Audit / Review Cleared',
    description: 'Supervisory investigation completed and compliance verified',
  },
  {
    id: 'leave_ended',
    title: 'Leave / Downtime Ended',
    description: 'Technician returned from requested absence or vehicle repair',
  },
  {
    id: 'doc_updated',
    title: 'Document Updated',
    description: 'Refreshed KYC, driving license, or certifications approved',
  },
  {
    id: 'admin_exception',
    title: 'Administrative Exception',
    description: 'Platform director discretion or regional override',
  },
];

export const SuspendReactivateTechnicianChaircareMobileScreen: React.FC<SuspendReactivateScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const techContext = useTechnician();

  const passedTech = route?.params?.technician;
  const passedId = route?.params?.technicianId || passedTech?.id || 'tech-01';

  // Technician details with graceful fallback to Rahul Sharma reference data
  const techName = passedTech?.name || 'Rahul Sharma';
  const techCode = passedTech?.code || '#TECH-884-DL';
  const avatarUrl =
    passedTech?.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop';
  const fleetTier = passedTech?.fleetTier || 'Ergonomic Systems • Tier 1';
  const corridor = passedTech?.corridorLocation || 'Gurugram corridor';

  // Determine current technician status (active vs suspended)
  const isCurrentlySuspended =
    route?.params?.initialMode === 'reactivate' ||
    passedTech?.status === 'suspended' ||
    passedTech?.statusBadgeVariant === 'suspended';

  const [mode, setMode] = useState<'suspend' | 'reactivate'>(
    isCurrentlySuspended ? 'reactivate' : 'suspend'
  );

  const [selectedReason, setSelectedReason] = useState<string>(
    mode === 'suspend' ? 'complaint' : 'audit_cleared'
  );
  const [adminNotes, setAdminNotes] = useState<string>(
    mode === 'suspend'
      ? 'Customer reported delayed response on warranty recall. Cooling-off period enforced pending operational review.'
      : 'Compliance review completed. Corrective coaching conducted. Re-enabling platform access.'
  );
  const [safetyChecked, setSafetyChecked] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleToggleMode = () => {
    const nextMode = mode === 'suspend' ? 'reactivate' : 'suspend';
    setMode(nextMode);
    setSelectedReason(nextMode === 'suspend' ? 'complaint' : 'audit_cleared');
    setAdminNotes(
      nextMode === 'suspend'
        ? 'Customer reported delayed response on warranty recall. Cooling-off period enforced pending operational review.'
        : 'Compliance review completed. Corrective coaching conducted. Re-enabling platform access.'
    );
    setSafetyChecked(false);
    setValidationError(null);
  };

  const handleAction = async () => {
    if (!safetyChecked) {
      setValidationError(
        mode === 'suspend'
          ? 'Please acknowledge the dispatch notice checkbox to proceed with suspension.'
          : 'Please acknowledge the reactivation clearance checkbox to proceed.'
      );
      setTimeout(() => setValidationError(null), 3500);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await adminApi.verifyTechnician(
        passedId,
        mode === 'suspend' ? 'suspended' : 'verified',
        adminNotes
      );

      if (res.error) {
        setIsSubmitting(false);
        Alert.alert('Operation Failed', res.error || 'Failed to update technician status.');
        return;
      }

      setIsSubmitting(false);

      if (mode === 'suspend') {
        // Update local technician context if current active tech is selected
        if (passedId === 'tech-01' || !passedId) {
          techContext.setIsOnline(false);
          techContext.setAvailabilityStatus('offline');
        }

        const updatedTech = {
          ...passedTech,
          id: passedId,
          name: techName,
          code: techCode,
          avatarUrl,
          status: 'suspended',
          statusBadgeVariant: 'suspended',
          statusLabel: 'Access Suspended',
          suspendedAt: new Date().toISOString(),
          suspensionReason: SUSPENSION_REASONS.find((r) => r.id === selectedReason)?.title,
          adminNotes,
        };

        if (navigation) {
          navigation.navigate('TechnicianActionConfirmed', {
            actionType: 'suspend',
            actionTitle: 'Technician Access Suspended',
            actionSubtitle: `${techName}'s auto-dispatch privileges and platform access have been revoked.`,
            technicianId: passedId,
            technician: updatedTech,
          });
        }
      } else {
        // Reactivate
        if (passedId === 'tech-01' || !passedId) {
          techContext.setIsOnline(true);
          techContext.setAvailabilityStatus('available');
        }

        const updatedTech = {
          ...passedTech,
          id: passedId,
          name: techName,
          code: techCode,
          avatarUrl,
          status: 'online',
          statusBadgeVariant: 'online',
          statusLabel: 'Online & Dispatched',
          reactivatedAt: new Date().toISOString(),
          reactivationReason: REACTIVATION_REASONS.find((r) => r.id === selectedReason)?.title,
          adminNotes,
        };

        if (navigation) {
          navigation.navigate('TechnicianActionConfirmed', {
            actionType: 'reactivate',
            actionTitle: 'Technician Reactivated',
            actionSubtitle: `${techName} has been restored to active duty and is eligible for auto-dispatch.`,
            technicianId: passedId,
            technician: updatedTech,
          });
        }
      }
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Connection Error', err.message || 'Unable to communicate with technician management backend.');
    }
  };

  const currentReasonsList = mode === 'suspend' ? SUSPENSION_REASONS : REACTIVATION_REASONS;

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Bar */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation && navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="ArrowLeft" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Suspend / Reactivate Technician
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => showToast('Super Admin options panel')}
            activeOpacity={0.7}
            accessibilityLabel="More options"
          >
            <AppIcon name="MoreVertical" size={20} />
          </TouchableOpacity>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
            }}
            style={styles.adminAvatar}
          />
        </View>
      </View>

      {/* 2. Floating Toast Notification */}
      {toastMessage && (
        <View style={[styles.toastContainer, { top: Math.max(insets.top, 12) + 56 }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* 3. Main Scrollable Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Technician Snapshot Card */}
        <View style={styles.card}>
          <View style={styles.snapshotTopRow}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: avatarUrl }} style={styles.techAvatar} />
              <View
                style={[
                  styles.avatarBadge,
                  {
                    backgroundColor: mode === 'suspend' ? '#4edea3' : '#ba1a1a',
                  },
                ]}
              >
                <AppIcon name={mode === 'suspend' ? 'Check' : 'AlertTriangle'} size={10} color="#ffffff" />
              </View>
            </View>

            <View style={styles.snapshotInfo}>
              <View style={styles.snapshotNameRow}>
                <Text style={styles.techName} numberOfLines={1}>
                  {techName}
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    mode === 'suspend'
                      ? styles.statusPillActive
                      : styles.statusPillSuspended,
                  ]}
                >
                  <View
                    style={[
                      styles.pulsingDot,
                      mode === 'suspend'
                        ? styles.pulsingDotActive
                        : styles.pulsingDotSuspended,
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      mode === 'suspend'
                        ? styles.statusPillTextActive
                        : styles.statusPillTextSuspended,
                    ]}
                  >
                    {mode === 'suspend' ? 'Active' : 'Suspended'}
                  </Text>
                </View>
              </View>

              <View style={styles.subBadgesRow}>
                <View style={styles.specialistBadge}>
                  <AppIcon name="ShieldCheck" size={18} />
                  <Text style={styles.specialistBadgeText}>Verified Specialist</Text>
                </View>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeBadgeText}>{techCode}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.fleetRow}>
            <View style={styles.fleetLeft}>
              <AppIcon name="Wrench" size={18} />
              <Text style={styles.fleetLabel}>Fleet Assignment</Text>
            </View>
            <Text style={styles.fleetValue}>{fleetTier}</Text>
          </View>
        </View>

        {/* Account Status Overview Card */}
        <View style={styles.card}>
          <View style={styles.statusOverviewHeader}>
            <View
              style={[
                styles.statusIconBox,
                mode === 'suspend'
                  ? styles.statusIconBoxActive
                  : styles.statusIconBoxSuspended,
              ]}
            >
              <AppIcon name={mode === 'suspend' ? 'ShieldAlert' : 'CheckCircle2'} size={20} />
            </View>
            <View style={styles.statusOverviewInfo}>
              <View style={styles.statusOverviewTitleRow}>
                <Text style={styles.statusOverviewTitle}>
                  {mode === 'suspend' ? 'Account Active' : 'Account Suspended'}
                </Text>
                <View
                  style={[
                    styles.dispatchBadge,
                    mode === 'suspend'
                      ? styles.dispatchBadgeActive
                      : styles.dispatchBadgeSuspended,
                  ]}
                >
                  <Text
                    style={[
                      styles.dispatchBadgeText,
                      mode === 'suspend'
                        ? styles.dispatchBadgeTextActive
                        : styles.dispatchBadgeTextSuspended,
                    ]}
                  >
                    {mode === 'suspend' ? 'Live Dispatch' : 'Dispatch Blocked'}
                  </Text>
                </View>
              </View>
              <Text style={styles.statusOverviewDesc}>
                {mode === 'suspend'
                  ? `This technician is currently eligible to receive, bid, and auto-dispatch to incoming customer service requests in the ${corridor}.`
                  : `This technician is currently restricted from platform dispatch, ticket bidding, and automatic job matching in the ${corridor}.`}
              </Text>
            </View>
          </View>

          {/* Live Job Warning Chip */}
          {mode === 'suspend' ? (
            <View style={styles.liveJobChip}>
              <View style={styles.liveJobLeft}>
                <AppIcon name="Settings" size={18} />
                <Text style={styles.liveJobText} numberOfLines={1}>
                  1 active ticket in progress (#CC-10483)
                </Text>
              </View>
              <View style={styles.inTransitBadge}>
                <Text style={styles.inTransitText}>In Transit</Text>
              </View>
            </View>
          ) : (
            <View style={styles.liveJobChip}>
              <View style={styles.liveJobLeft}>
                <AppIcon name="Lock" size={18} />
                <Text style={styles.liveJobText} numberOfLines={1}>
                  Platform access paused on administrative review
                </Text>
              </View>
              <View style={[styles.inTransitBadge, { backgroundColor: '#fee2e2' }]}>
                <Text style={[styles.inTransitText, { color: '#ba1a1a' }]}>Inactive</Text>
              </View>
            </View>
          )}
        </View>

        {/* Platform Access Control Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Platform Access Control</Text>
            <View style={styles.adminOverrideBadge}>
              <AppIcon name="Lock" size={18} />
              <Text style={styles.adminOverrideText}>Admin Override</Text>
            </View>
          </View>

          {/* Action Mode Card */}
          <View style={styles.card}>
            <View style={styles.accessControlHeader}>
              <View style={styles.accessControlLeft}>
                <View
                  style={[
                    styles.actionIconBox,
                    mode === 'suspend'
                      ? styles.actionIconBoxError
                      : styles.actionIconBoxSuccess,
                  ]}
                >
                  <AppIcon name={mode === 'suspend' ? 'ClipboardCheck' : 'RefreshCw'} size={20} />
                </View>
                <View style={styles.actionTextWrapper}>
                  <Text style={styles.actionTitle}>
                    {mode === 'suspend' ? 'Suspend Technician' : 'Reactivate Technician'}
                  </Text>
                  <Text style={styles.actionSubtitle}>
                    {mode === 'suspend'
                      ? 'Revoke dispatch matching and prevent receiving new tickets.'
                      : 'Restore dispatch matching and allow receiving new tickets.'}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.priorityBadge,
                  mode === 'suspend'
                    ? styles.priorityBadgeError
                    : styles.priorityBadgeSuccess,
                ]}
              >
                <AppIcon name={mode === 'suspend' ? 'AlertTriangle' : 'Check'} size={10} color="#ffffff" />
              </View>
            </View>

            <View
              style={[
                styles.warningBanner,
                mode === 'suspend'
                  ? styles.warningBannerError
                  : styles.warningBannerSuccess,
              ]}
            >
              <AppIcon name={mode === 'suspend' ? 'AlertTriangle' : 'Info'} size={20} />
              <Text
                style={[
                  styles.warningBannerText,
                  mode === 'suspend'
                    ? styles.warningBannerTextError
                    : styles.warningBannerTextSuccess,
                ]}
              >
                {mode === 'suspend'
                  ? 'Suspending will immediately pause auto-routing. Active job #CC-10483 will require supervisory re-assignment or manual override.'
                  : 'Reactivating will immediately restore platform auto-routing and allow the technician to accept new service tickets.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Reason Selection Form */}
        <View style={styles.card}>
          <View style={styles.formHeaderRow}>
            <Text style={styles.formTitle}>
              {mode === 'suspend'
                ? 'Select Reason for Suspension'
                : 'Select Reason for Reactivation'}{' '}
              <Text style={styles.requiredStar}>*</Text>
            </Text>
            <Text style={styles.mandatoryBadge}>Mandatory</Text>
          </View>

          <View style={styles.reasonsList}>
            {currentReasonsList.map((reason) => {
              const isSelected = selectedReason === reason.id;
              return (
                <TouchableOpacity
                  key={reason.id}
                  style={[
                    styles.reasonItem,
                    isSelected && styles.reasonItemSelected,
                  ]}
                  onPress={() => setSelectedReason(reason.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radioOuter,
                        isSelected &&
                          (mode === 'suspend'
                            ? styles.radioOuterSelectedError
                            : styles.radioOuterSelectedCobalt),
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={[
                            styles.radioInner,
                            {
                              backgroundColor:
                                mode === 'suspend'
                                  ? Colors.error
                                  : Colors.secondaryCobalt,
                            },
                          ]}
                        />
                      )}
                    </View>
                  </View>
                  <View style={styles.reasonTextContent}>
                    <Text
                      style={[
                        styles.reasonTitle,
                        isSelected && styles.reasonTitleSelected,
                      ]}
                    >
                      {reason.title}
                    </Text>
                    <Text style={styles.reasonDescription}>{reason.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Internal Administrative Notes */}
          <View style={styles.notesSection}>
            <View style={styles.notesHeaderRow}>
              <Text style={styles.notesLabel}>
                Additional administrative notes <Text style={styles.requiredStar}>*</Text>
              </Text>
              <Text style={styles.internalTag}>Internal Only</Text>
            </View>

            <TextInput
              style={styles.notesInput}
              value={adminNotes}
              onChangeText={setAdminNotes}
              multiline
              numberOfLines={3}
              placeholder="Provide context for dispatch auditing..."
              placeholderTextColor={Colors.onSurfaceVariant}
              textAlignVertical="top"
            />

            <Text style={styles.notesHelperText}>
              Visible to tier-3 ops administrators and regional audit logs. Not visible to
              technician app.
            </Text>
          </View>
        </View>

        {/* Workflow Switch Notice */}
        <TouchableOpacity
          style={styles.workflowNoticeCard}
          onPress={handleToggleMode}
          activeOpacity={0.8}
        >
          <View style={styles.workflowNoticeIconBox}>
            <AppIcon name="RefreshCw" size={18} />
          </View>
          <View style={styles.workflowNoticeInfo}>
            <View style={styles.workflowNoticeTitleRow}>
              <Text style={styles.workflowNoticeTitle}>
                {mode === 'suspend'
                  ? 'Switch to Reactivation workflow'
                  : 'Switch to Suspension workflow'}
              </Text>
              <Text style={styles.workflowNoticeLink}>Switch ↗</Text>
            </View>
            <Text style={styles.workflowNoticeDesc}>
              {mode === 'suspend'
                ? 'Tap here if technician is already suspended to switch to one-tap status restoration.'
                : 'Tap here if you want to revoke platform dispatch access and apply cooling-off.'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Safety Confirmation Protocol */}
        <TouchableOpacity
          style={[
            styles.safetyCard,
            validationError ? styles.safetyCardError : null,
          ]}
          onPress={() => setSafetyChecked(!safetyChecked)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkboxCustom,
              safetyChecked ? styles.checkboxChecked : styles.checkboxUnchecked,
            ]}
          >
            {safetyChecked && <AppIcon name="Check" size={18} />}
          </View>
          <Text style={styles.safetyText}>
            {mode === 'suspend'
              ? 'I acknowledge this will immediately recall pending bids and notify Gurugram regional dispatch leads.'
              : 'I acknowledge this will restore live automatic routing and notify the technician of account reinstatement.'}
          </Text>
        </TouchableOpacity>

        {/* Validation Error Message */}
        {validationError && (
          <View style={styles.errorBanner}>
            <AppIcon name="TriangleAlert" size={18} />
            <Text style={styles.errorBannerText}>{validationError}</Text>
          </View>
        )}
      </ScrollView>

      {/* 4. Sticky Bottom Action Controls */}
      <View
        style={[
          styles.bottomBarContainer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.primaryActionBtn,
            mode === 'suspend'
              ? styles.primaryActionBtnError
              : styles.primaryActionBtnCobalt,
            isSubmitting && styles.btnDisabled,
          ]}
          onPress={handleAction}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <View style={styles.btnContentRow}>
              <Text style={styles.btnIcon}>
                
              </Text>
              <Text style={styles.primaryBtnText}>
                {mode === 'suspend'
                  ? 'Suspend Technician (Confirm)'
                  : 'Reactivate Technician (Confirm)'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionBtn}
          onPress={() => {
            if (navigation && navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryBtnText}>Cancel & Return</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    zIndex: 50,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: '#191c1e',
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '700',
    color: '#191c1e',
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMoreIcon: {
    fontSize: 20,
    color: '#45464d',
    fontWeight: '700',
  },
  adminAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#191c1e',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 999,
    ...Shadows.level2,
  },
  toastText: {
    ...Typography.bodySm,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    ...Shadows.level1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.04)',
    gap: 14,
  },
  snapshotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  techAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
  },
  snapshotInfo: {
    flex: 1,
    minWidth: 0,
  },
  snapshotNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 4,
  },
  techName: {
    ...Typography.headlineSm,
    fontSize: 19,
    fontWeight: '700',
    color: '#191c1e',
    flexShrink: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillActive: {
    backgroundColor: 'rgba(78, 222, 163, 0.2)',
  },
  statusPillSuspended: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pulsingDotActive: {
    backgroundColor: '#009668',
  },
  pulsingDotSuspended: {
    backgroundColor: '#ba1a1a',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusPillTextActive: {
    color: '#005236',
  },
  statusPillTextSuspended: {
    color: '#ba1a1a',
  },
  subBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  specialistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  specialistBadgeIcon: {
    fontSize: 11,
  },
  specialistBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#191c1e',
  },
  codeBadge: {
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  codeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#45464d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fleetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    padding: 10,
    borderRadius: 8,
  },
  fleetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fleetIcon: {
    fontSize: 14,
  },
  fleetLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#45464d',
  },
  fleetValue: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '700',
    color: '#191c1e',
  },
  statusOverviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconBoxActive: {
    backgroundColor: 'rgba(78, 222, 163, 0.25)',
  },
  statusIconBoxSuspended: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusIconBoxText: {
    fontSize: 20,
  },
  statusOverviewInfo: {
    flex: 1,
    minWidth: 0,
  },
  statusOverviewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statusOverviewTitle: {
    ...Typography.titleLg,
    fontSize: 17,
    fontWeight: '700',
    color: '#191c1e',
  },
  dispatchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dispatchBadgeActive: {
    backgroundColor: 'rgba(78, 222, 163, 0.25)',
  },
  dispatchBadgeSuspended: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  dispatchBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dispatchBadgeTextActive: {
    color: '#005236',
  },
  dispatchBadgeTextSuspended: {
    color: '#ba1a1a',
  },
  statusOverviewDesc: {
    ...Typography.bodySm,
    fontSize: 13,
    lineHeight: 18,
    color: '#45464d',
  },
  liveJobChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e6e8ea',
    padding: 10,
    borderRadius: 8,
  },
  liveJobLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  liveJobIcon: {
    fontSize: 16,
  },
  liveJobText: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
    flexShrink: 1,
  },
  inTransitBadge: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inTransitText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00174b',
  },
  sectionContainer: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    ...Typography.headlineSm,
    fontSize: 17,
    fontWeight: '700',
    color: '#191c1e',
  },
  adminOverrideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adminOverrideIcon: {
    fontSize: 11,
  },
  adminOverrideText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ba1a1a',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  accessControlHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  accessControlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBoxError: {
    backgroundColor: '#ffdad6',
  },
  actionIconBoxSuccess: {
    backgroundColor: '#dbe1ff',
  },
  actionIconBoxEmoji: {
    fontSize: 18,
  },
  actionTextWrapper: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  actionSubtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#45464d',
    marginTop: 2,
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityBadgeError: {
    backgroundColor: '#ba1a1a',
  },
  priorityBadgeSuccess: {
    backgroundColor: '#0051d5',
  },
  priorityBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  warningBannerError: {
    backgroundColor: 'rgba(255, 218, 214, 0.45)',
  },
  warningBannerSuccess: {
    backgroundColor: 'rgba(219, 225, 255, 0.45)',
  },
  warningBannerIcon: {
    fontSize: 15,
    marginTop: 1,
  },
  warningBannerText: {
    ...Typography.bodySm,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  warningBannerTextError: {
    color: '#93000a',
  },
  warningBannerTextSuccess: {
    color: '#00174b',
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  requiredStar: {
    color: '#ba1a1a',
  },
  mandatoryBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#45464d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  reasonsList: {
    gap: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  reasonItemSelected: {
    backgroundColor: '#f2f4f6',
    borderColor: '#c6c6cd',
  },
  radioContainer: {
    paddingTop: 2,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#c6c6cd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelectedError: {
    borderColor: '#ba1a1a',
  },
  radioOuterSelectedCobalt: {
    borderColor: Colors.secondaryCobalt,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reasonTextContent: {
    flex: 1,
  },
  reasonTitle: {
    ...Typography.bodyMd,
    fontSize: 14,
    fontWeight: '500',
    color: '#191c1e',
  },
  reasonTitleSelected: {
    fontWeight: '700',
  },
  reasonDescription: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#45464d',
    marginTop: 2,
  },
  notesSection: {
    gap: 6,
    marginTop: 6,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notesLabel: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: '#191c1e',
  },
  internalTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#45464d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  notesInput: {
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    padding: 10,
    ...Typography.bodyMd,
    fontSize: 13,
    color: '#191c1e',
    minHeight: 70,
  },
  notesHelperText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#76777d',
    lineHeight: 15,
  },
  workflowNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 14,
  },
  workflowNoticeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e3e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workflowNoticeIcon: {
    fontSize: 16,
  },
  workflowNoticeInfo: {
    flex: 1,
  },
  workflowNoticeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workflowNoticeTitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: '#191c1e',
  },
  workflowNoticeLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  workflowNoticeDesc: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#45464d',
    marginTop: 2,
    lineHeight: 15,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  safetyCardError: {
    borderColor: '#ba1a1a',
    backgroundColor: '#fff5f5',
  },
  checkboxCustom: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#191c1e',
    borderColor: '#191c1e',
  },
  checkboxUnchecked: {
    borderColor: '#76777d',
    backgroundColor: '#ffffff',
  },
  checkboxCheckmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  safetyText: {
    ...Typography.bodySm,
    fontSize: 12,
    lineHeight: 17,
    color: '#191c1e',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffdad6',
    padding: 10,
    borderRadius: 8,
  },
  errorBannerIcon: {
    fontSize: 14,
  },
  errorBannerText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#93000a',
    fontWeight: '600',
    flex: 1,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    gap: 8,
    zIndex: 60,
  },
  primaryActionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  primaryActionBtnError: {
    backgroundColor: '#ba1a1a',
  },
  primaryActionBtnCobalt: {
    backgroundColor: Colors.secondaryCobalt,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnIcon: {
    fontSize: 16,
  },
  primaryBtnText: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryActionBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6e8ea',
  },
  secondaryBtnText: {
    ...Typography.bodyLg,
    fontSize: 14,
    fontWeight: '600',
    color: '#191c1e',
  },
});
