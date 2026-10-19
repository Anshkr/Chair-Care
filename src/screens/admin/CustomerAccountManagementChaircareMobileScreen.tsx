import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface CustomerAccountManagementProps {
  navigation?: any;
  route?: {
    params?: {
      customerId?: string;
      customer?: any;
      initialMode?: 'block' | 'unblock';
    };
  };
}

interface ModerationReasonOption {
  id: string;
  title: string;
  description: string;
}

const BLOCK_REASONS: ModerationReasonOption[] = [
  {
    id: 'repeated_cancellations',
    title: 'Repeated cancellations',
    description:
      'Excessive cancellations outside free window causing technician loss of earnings.',
  },
  {
    id: 'payment_chargeback',
    title: 'Payment issue / chargeback dispute',
    description: 'Unsettled diagnostic fees or contested gateway transactions.',
  },
  {
    id: 'abusive_behavior',
    title: 'Abusive behavior towards field technicians',
    description:
      'Zero-tolerance violations reported during on-site ergonomic calibration.',
  },
  {
    id: 'fraud_identity',
    title: 'Fraud concern / fake address or identity',
    description:
      'Inconsistent dispatch geofence, spoofed phone numbers, or unverified locations.',
  },
  {
    id: 'policy_violation',
    title: 'Policy violation / terms of service breach',
    description: 'Commercial sub-leasing of personal ergonomic warranties.',
  },
  {
    id: 'other_operational',
    title: 'Other operational discrepancy',
    description: 'Manual dispatch hold initiated by regional central console.',
  },
];

const UNBLOCK_REASONS: ModerationReasonOption[] = [
  {
    id: 'cooling_off_cleared',
    title: 'Review / Cooling-off Cleared',
    description: 'Supervisory audit complete and dispute settled.',
  },
  {
    id: 'payment_resolved',
    title: 'Payment Resolved',
    description: 'Outstanding invoices or dispute charges settled in full.',
  },
  {
    id: 'identity_verified',
    title: 'Address / Identity Verified',
    description: 'KYC location check verified onsite by regional dispatch.',
  },
  {
    id: 'admin_exception',
    title: 'Administrative Exception',
    description: 'Platform director discretion or executive override.',
  },
];

export const CustomerAccountManagementChaircareMobileScreen: React.FC<
  CustomerAccountManagementProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const passedCust = route?.params?.customer;
  const passedId = route?.params?.customerId || passedCust?.id || 'cust-01';

  // Customer details with fallback to canonical Ansh Kumar record
  const custName = passedCust?.name || 'Ansh Kumar';
  const custInitials = passedCust?.initials || 'AK';
  const custCode = passedCust?.code || '#CUST-7741';
  const phone = passedCust?.phone || '+91 98201 44810';
  const location =
    passedCust?.location || 'Sector 54, Gurugram • DLF Phase 5';
  const isCurrentlyBlocked =
    route?.params?.initialMode === 'unblock' ||
    passedCust?.status === 'blocked' ||
    passedCust?.isHold === true;

  const [mode, setMode] = useState<'block' | 'unblock'>(
    isCurrentlyBlocked ? 'unblock' : 'block'
  );

  const [selectedReason, setSelectedReason] = useState<string>(
    mode === 'block' ? 'repeated_cancellations' : 'cooling_off_cleared'
  );
  const [adminNotes, setAdminNotes] = useState<string>(
    mode === 'block'
      ? 'Customer recorded 3 consecutive last-minute cancellations after technician arrived in corridor. Enforcing cooling-off review.'
      : 'Dispute resolved and cancellation grace re-calibrated. Re-enabling standard auto-dispatch.'
  );
  const [legalConfirmed, setLegalConfirmed] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleToggleMode = () => {
    const nextMode = mode === 'block' ? 'unblock' : 'block';
    setMode(nextMode);
    setSelectedReason(
      nextMode === 'block' ? 'repeated_cancellations' : 'cooling_off_cleared'
    );
    setAdminNotes(
      nextMode === 'block'
        ? 'Customer recorded 3 consecutive last-minute cancellations after technician arrived in corridor. Enforcing cooling-off review.'
        : 'Dispute resolved and cancellation grace re-calibrated. Re-enabling standard auto-dispatch.'
    );
  };

  const handleActionConfirm = () => {
    if (!legalConfirmed) {
      showToast('Please check the governance compliance confirmation to proceed.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      const isBlockAction = mode === 'block';
      const updatedCustomer = {
        ...passedCust,
        id: passedId,
        name: custName,
        code: custCode,
        phone,
        status: isBlockAction ? 'blocked' : 'active',
        statusLabel: isBlockAction ? 'Blocked' : 'Active',
        isHold: isBlockAction,
        holdReason: isBlockAction
          ? BLOCK_REASONS.find((r) => r.id === selectedReason)?.title
          : undefined,
        adminNotes,
      };

      if (navigation) {
        navigation.navigate('CustomerActionConfirmed', {
          actionType: isBlockAction ? 'block' : 'unblock',
          actionTitle: isBlockAction
            ? 'Customer Account Blocked'
            : 'Customer Account Re-activated',
          actionSubtitle: isBlockAction
            ? `${custName}'s booking privileges have been suspended. Non-started requests paused.`
            : `${custName}'s account has been restored and auto-dispatch matching re-enabled.`,
          customerId: passedId,
          customer: updatedCustomer,
        });
      }
    }, 850);
  };

  const currentReasonsList = mode === 'block' ? BLOCK_REASONS : UNBLOCK_REASONS;

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
            Manage Customer
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => showToast('Super Admin customer moderation options')}
            activeOpacity={0.7}
            accessibilityLabel="More options"
          >
            <AppIcon name="MoreVertical" size={20} />
          </TouchableOpacity>
          <View style={styles.adminAvatarCircle}>
            <AppIcon name="User" size={18} />
          </View>
        </View>
      </View>

      {/* 2. Floating Toast Banner Notification */}
      {toastMessage && (
        <View style={[styles.toastContainer, { top: Math.max(insets.top, 12) + 56 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><AppIcon name="Check" size={14} /><Text style={styles.toastText}>{toastMessage}</Text></View>
        </View>
      )}

      {/* 3. Main Scrollable Container */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Target Customer Snapshot Card */}
        <View style={styles.card}>
          <View style={styles.custSnapshotTopRow}>
            <View style={styles.custAvatarBox}>
              <Text style={styles.custAvatarInitials}>{custInitials}</Text>
            </View>

            <View style={styles.custSnapshotInfo}>
              <View style={styles.custNameVerifiedRow}>
                <Text style={styles.custSnapshotName} numberOfLines={1}>
                  {custName}
                </Text>
                <AppIcon name="ShieldCheck" size={18} />
              </View>

              <View style={styles.custMetaSubRow}>
                <Text style={styles.custCodeMono}>{custCode}</Text>
                <View style={styles.dotDivider} />
                <Text style={styles.custPhoneText}>{phone}</Text>
              </View>
            </View>

            <View
              style={[
                styles.statusPill,
                mode === 'block' ? styles.statusPillActive : styles.statusPillBlocked,
              ]}
            >
              <View
                style={[
                  styles.pulsingDot,
                  mode === 'block' ? styles.pulsingDotActive : styles.pulsingDotBlocked,
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  mode === 'block' ? styles.statusTextActive : styles.statusTextBlocked,
                ]}
              >
                {mode === 'block' ? 'Active' : 'Blocked'}
              </Text>
            </View>
          </View>

          <View style={styles.custSnapshotBottomRow}>
            <View style={styles.locationGroup}>
              <AppIcon name="Building2" size={18} />
              <Text style={styles.locLabel} numberOfLines={1}>
                {location.split('•')[0] || 'Gurugram'}
              </Text>
            </View>
            <View style={styles.dotDivider} />
            <View style={styles.tierGroup}>
              <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.tierText}>Tier-1 Enterprise Client</Text>
            </View>
          </View>
        </View>

        {/* 2. Current Account Status Banner */}
        <View
          style={[
            styles.card,
            mode === 'block' ? styles.statusCardActive : styles.statusCardBlocked,
          ]}
        >
          <View style={styles.statusBannerTop}>
            <View
              style={[
                styles.statusIconBox,
                mode === 'block'
                  ? styles.statusIconBoxActive
                  : styles.statusIconBoxBlocked,
              ]}
            >
              <AppIcon name={mode === 'block' ? 'Shield' : 'Clock'} size={20} />
            </View>

            <View style={styles.statusBannerContent}>
              <Text
                style={[
                  styles.stateEyebrow,
                  mode === 'block' ? styles.stateEyebrowActive : styles.stateEyebrowBlocked,
                ]}
              >
                {mode === 'block'
                  ? 'STATE: CALIBRATED & NORMAL'
                  : 'STATE: RESTRICTED / DISPATCH MUTED'}
              </Text>
              <Text style={styles.stateTitle}>
                {mode === 'block' ? 'Account Active' : 'Account Blocked'}
              </Text>
              <Text style={styles.stateDescription}>
                {mode === 'block'
                  ? 'This customer can request services, access billing invoices, and utilize platform auto-dispatch normally without field restriction.'
                  : 'This customer is currently restricted from creating new service requests, booking dispatch appointments, or initiating live matching.'}
              </Text>
            </View>
          </View>

          {/* Active Ticket Note Chip */}
          <View style={styles.activeTicketChip}>
            <View style={styles.activeTicketLeft}>
              <AppIcon name="Settings" size={18} />
              <Text style={styles.activeTicketText} numberOfLines={1}>
                {mode === 'block'
                  ? '1 active service ticket currently in progress'
                  : 'Hold placed on new ticket matching'}
              </Text>
            </View>
            <View style={styles.ticketTagPill}>
              <Text style={styles.ticketTagText}>#CC-10499</Text>
            </View>
          </View>
        </View>

        {/* 3. Platform Access & Moderation Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <AppIcon name="ShieldCheck" size={18} />
              <Text style={styles.sectionHeaderTitle}>Platform Access Control</Text>
            </View>
            <View style={styles.superAdminTag}>
              <Text style={styles.superAdminTagText}>SUPER-ADMIN</Text>
            </View>
          </View>

          {/* Mode Info Box */}
          <View style={styles.modeInfoBox}>
            <View style={styles.modeTitleRow}>
              <View
                style={[
                  styles.modeIconBox,
                  mode === 'block'
                    ? styles.modeIconBoxError
                    : styles.modeIconBoxSuccess,
                ]}
              >
                <AppIcon name={mode === 'block' ? 'ClipboardCheck' : 'RefreshCw'} size={20} />
              </View>

              <View style={styles.modeTitleCol}>
                <Text
                  style={[
                    styles.modeMainTitle,
                    mode === 'block' ? styles.textError : styles.textCobalt,
                  ]}
                >
                  {mode === 'block' ? 'Block Customer Account' : 'Unblock Customer Account'}
                </Text>
                <Text style={styles.modeSubtitle}>
                  {mode === 'block'
                    ? 'Prevent this customer from creating new service requests, booking dispatch appointments, or initiating live matching.'
                    : 'Restore platform access, enabling this customer to create new service requests and access live dispatch.'}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.warningBanner,
                mode === 'block'
                  ? styles.warningBannerError
                  : styles.warningBannerSuccess,
              ]}
            >
              <AppIcon name={mode === 'block' ? 'AlertTriangle' : 'Info'} size={20} />
              <Text
                style={[
                  styles.warningBannerText,
                  mode === 'block'
                    ? styles.warningTextError
                    : styles.warningTextSuccess,
                ]}
              >
                {mode === 'block'
                  ? 'Blocking will immediately restrict account access and pause any non-started bookings. Existing technician dispatch is preserved for supervisory review.'
                  : 'Unblocking will immediately re-enable account access and restore active booking privileges.'}
              </Text>
            </View>
          </View>

          {/* 4. Reason Selection Form */}
          <View style={styles.formSection}>
            <View style={styles.formLabelRow}>
              <Text style={styles.formLabelTitle}>
                {mode === 'block'
                  ? 'Select Reason for Blocking'
                  : 'Select Reason for Unblocking'}{' '}
                <Text style={styles.requiredStar}>*</Text>
              </Text>
              <Text style={styles.requiredMonoBadge}>REQUIRED</Text>
            </View>

            <View style={styles.reasonsList}>
              {currentReasonsList.map((reason) => {
                const isSelected = selectedReason === reason.id;
                return (
                  <TouchableOpacity
                    key={reason.id}
                    style={[
                      styles.reasonOptionItem,
                      isSelected && styles.reasonOptionSelected,
                    ]}
                    onPress={() => setSelectedReason(reason.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioOuter}>
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected &&
                            (mode === 'block'
                              ? styles.radioCircleError
                              : styles.radioCircleCobalt),
                        ]}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </View>
                    <View style={styles.reasonTextCol}>
                      <Text
                        style={[
                          styles.reasonTitle,
                          isSelected && styles.reasonTitleSelected,
                        ]}
                      >
                        {reason.title}
                      </Text>
                      <Text style={styles.reasonDesc}>{reason.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 5. Internal Administrative Notes */}
          <View style={styles.notesSection}>
            <View style={styles.notesLabelRow}>
              <Text style={styles.notesLabelText}>
                Additional administrative notes <Text style={styles.requiredStar}>*</Text>{' '}
                (Internal Only)
              </Text>
              <Text style={styles.confidentialTag}>CONFIDENTIAL</Text>
            </View>

            <TextInput
              style={styles.notesTextInput}
              value={adminNotes}
              onChangeText={setAdminNotes}
              multiline
              numberOfLines={3}
              placeholder="Record supervisory rationale for dispatch audit logs..."
              placeholderTextColor={Colors.onSurfaceVariant}
              textAlignVertical="top"
            />

            <View style={styles.notesDisclaimerRow}>
              <AppIcon name="Eye" size={18} />
              <Text style={styles.disclaimerText}>
                Visible to Super Admin & Tier-3 auditors. Never shown in customer app.
              </Text>
            </View>
          </View>
        </View>

        {/* 6. Alternative State Explanatory Banner (Workflow Switch) */}
        <TouchableOpacity
          style={styles.workflowSwitchBanner}
          onPress={handleToggleMode}
          activeOpacity={0.8}
        >
          <View style={styles.workflowIconBox}>
            <AppIcon name="RefreshCw" size={18} />
          </View>
          <View style={styles.workflowContent}>
            <View style={styles.workflowTitleRow}>
              <Text style={styles.workflowTitle}>
                {mode === 'block'
                  ? 'Switch to Unblock Workflow'
                  : 'Switch to Block Workflow'}
              </Text>
              <Text style={styles.workflowSwitchLink}>Switch ↗</Text>
            </View>
            <Text style={styles.workflowDesc}>
              {mode === 'block'
                ? 'If this customer is already blocked, this control panel transforms into "Unblock Customer" with one-tap instant status restoration.'
                : 'Tap here to switch to the account suspension & booking freeze workflow.'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* 7. Legal & Audit Checkbox */}
        <TouchableOpacity
          style={styles.legalCheckboxCard}
          onPress={() => setLegalConfirmed(!legalConfirmed)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkboxSquare,
              legalConfirmed ? styles.checkboxSquareChecked : styles.checkboxSquareUnchecked,
            ]}
          >
            {legalConfirmed && <AppIcon name="Check" size={18} />}
          </View>
          <View style={styles.legalTextCol}>
            <Text style={styles.legalLabelText}>
              I confirm this moderation action complies with ChairCare customer service
              governance guidelines and regional dispatch policy.
            </Text>
            <Text style={styles.auditLogIdMono}>AUDIT_LOG_ID: #MOD-2024-88914-A</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* 8. Sticky Action Buttons */}
      <View
        style={[
          styles.stickyBottomBar,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.primaryActionBtn,
            mode === 'block' ? styles.btnError : styles.btnCobalt,
            isSubmitting && styles.btnDisabled,
          ]}
          onPress={handleActionConfirm}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <View style={styles.btnContentRow}>
              <AppIcon name={mode === 'block' ? 'CircleX' : 'CheckCircle'} size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>
                {mode === 'block'
                  ? 'Block Customer (Confirm)'
                  : 'Unblock Customer (Confirm)'}
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
          <Text style={styles.secondaryBtnText}>Cancel & Return to Profile</Text>
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
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: '#191c1e',
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '800',
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
  adminAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#191c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatarIcon: {
    fontSize: 14,
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
    paddingTop: 14,
    gap: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    ...Shadows.level1,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  custSnapshotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  custAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#131b2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  custAvatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: '#dae2fd',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  custSnapshotInfo: {
    flex: 1,
    minWidth: 0,
  },
  custNameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  custSnapshotName: {
    ...Typography.headlineSm,
    fontSize: 17,
    fontWeight: '800',
    color: '#191c1e',
    flexShrink: 1,
  },
  verifiedShield: {
    fontSize: 14,
  },
  custMetaSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  custCodeMono: {
    fontSize: 11,
    fontWeight: '600',
    color: '#76777d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  dotDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c6c6cd',
  },
  custPhoneText: {
    fontSize: 11,
    color: '#76777d',
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
    backgroundColor: 'rgba(78, 222, 163, 0.25)',
  },
  statusPillBlocked: {
    backgroundColor: '#ffdad6',
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pulsingDotActive: {
    backgroundColor: '#009668',
  },
  pulsingDotBlocked: {
    backgroundColor: '#ba1a1a',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#005236',
  },
  statusTextBlocked: {
    color: '#93000a',
  },
  custSnapshotBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f2f4f6',
    padding: 10,
    borderRadius: 10,
  },
  locationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locIcon: {
    fontSize: 12,
  },
  locLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  tierGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tierStarIcon: {
    fontSize: 12,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191c1e',
  },
  statusCardActive: {
    borderLeftWidth: 5,
    borderLeftColor: '#009668',
  },
  statusCardBlocked: {
    borderLeftWidth: 5,
    borderLeftColor: '#ba1a1a',
  },
  statusBannerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconBoxActive: {
    backgroundColor: 'rgba(78, 222, 163, 0.25)',
  },
  statusIconBoxBlocked: {
    backgroundColor: '#ffdad6',
  },
  statusIconBoxEmoji: {
    fontSize: 20,
  },
  statusBannerContent: {
    flex: 1,
  },
  stateEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  stateEyebrowActive: {
    color: '#009668',
  },
  stateEyebrowBlocked: {
    color: '#ba1a1a',
  },
  stateTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '800',
    color: '#191c1e',
    marginTop: 2,
  },
  stateDescription: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#45464d',
    lineHeight: 17,
    marginTop: 4,
  },
  activeTicketChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    padding: 10,
    borderRadius: 10,
  },
  activeTicketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 6,
  },
  activeTicketIcon: {
    fontSize: 14,
  },
  activeTicketText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
    flexShrink: 1,
  },
  ticketTagPill: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ticketTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#191c1e',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderIcon: {
    fontSize: 16,
  },
  sectionHeaderTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  superAdminTag: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  superAdminTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#45464d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modeInfoBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  modeTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  modeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconBoxError: {
    backgroundColor: '#ffdad6',
  },
  modeIconBoxSuccess: {
    backgroundColor: '#dbe1ff',
  },
  modeIconEmoji: {
    fontSize: 16,
  },
  modeTitleCol: {
    flex: 1,
  },
  modeMainTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  textError: {
    color: '#ba1a1a',
  },
  textCobalt: {
    color: Colors.secondaryCobalt,
  },
  modeSubtitle: {
    fontSize: 11,
    color: '#45464d',
    lineHeight: 15,
    marginTop: 2,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  warningBannerError: {
    backgroundColor: 'rgba(255, 218, 214, 0.6)',
  },
  warningBannerSuccess: {
    backgroundColor: 'rgba(219, 225, 255, 0.6)',
  },
  warningBannerIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  warningBannerText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  warningTextError: {
    color: '#93000a',
    fontWeight: '500',
  },
  warningTextSuccess: {
    color: '#00174b',
    fontWeight: '500',
  },
  formSection: {
    gap: 8,
  },
  formLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formLabelTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191c1e',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  requiredStar: {
    color: '#ba1a1a',
  },
  requiredMonoBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#76777d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  reasonsList: {
    gap: 6,
  },
  reasonOptionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  reasonOptionSelected: {
    backgroundColor: '#f2f4f6',
    borderColor: '#c6c6cd',
  },
  radioOuter: {
    paddingTop: 2,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#c6c6cd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleError: {
    borderColor: '#ba1a1a',
  },
  radioCircleCobalt: {
    borderColor: Colors.secondaryCobalt,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#191c1e',
  },
  reasonTextCol: {
    flex: 1,
  },
  reasonTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },
  reasonTitleSelected: {
    fontWeight: '800',
  },
  reasonDesc: {
    fontSize: 11,
    color: '#45464d',
    lineHeight: 15,
    marginTop: 2,
  },
  notesSection: {
    gap: 6,
  },
  notesLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notesLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191c1e',
  },
  confidentialTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#76777d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  notesTextInput: {
    backgroundColor: '#f2f4f6',
    borderRadius: 10,
    padding: 10,
    ...Typography.bodySm,
    fontSize: 12,
    color: '#191c1e',
    minHeight: 68,
  },
  notesDisclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  disclaimerIcon: {
    fontSize: 11,
  },
  disclaimerText: {
    fontSize: 10,
    color: '#76777d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  workflowSwitchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f2f4f6',
    borderRadius: 14,
    padding: 12,
  },
  workflowIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e6e8ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workflowIcon: {
    fontSize: 16,
  },
  workflowContent: {
    flex: 1,
  },
  workflowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workflowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191c1e',
  },
  workflowSwitchLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  workflowDesc: {
    fontSize: 11,
    color: '#45464d',
    lineHeight: 15,
    marginTop: 2,
  },
  legalCheckboxCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    ...Shadows.level1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxSquareChecked: {
    backgroundColor: '#191c1e',
    borderColor: '#191c1e',
  },
  checkboxSquareUnchecked: {
    borderColor: '#76777d',
    backgroundColor: '#ffffff',
  },
  checkmarkSymbol: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  legalTextCol: {
    flex: 1,
  },
  legalLabelText: {
    fontSize: 12,
    color: '#191c1e',
    lineHeight: 16,
    fontWeight: '500',
  },
  auditLogIdMono: {
    fontSize: 10,
    color: '#76777d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 4,
  },
  stickyBottomBar: {
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
  btnError: {
    backgroundColor: '#ba1a1a',
  },
  btnCobalt: {
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
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryActionBtn: {
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6e8ea',
  },
  secondaryBtnText: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },
});
