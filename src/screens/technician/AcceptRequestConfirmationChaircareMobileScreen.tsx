import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useTechnician } from '../../context/TechnicianContext';
import { technicianApi } from '../../services/api/technicianApi';
import { sanitizeUserErrorMessage } from '../../services/api/apiClient';

interface AcceptRequestConfirmationProps {
  navigation?: any;
  route?: {
    params?: {
      requestId?: string;
      jobId?: string;
      request?: any;
    };
  };
}

export const AcceptRequestConfirmationChaircareMobileScreen: React.FC<
  AcceptRequestConfirmationProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { acceptRequest } = useTechnician();

  const passedRequest = route?.params?.request;
  const passedId = route?.params?.requestId || route?.params?.jobId;

  // Normalized ticket context from live request
  const ticket = passedRequest || {
    id: passedId || '',
    ticketNumber: passedId?.includes('REQ') ? passedId : (passedId ? `REQ-${passedId.slice(0, 4)}` : 'DISPATCH'),
    serviceTitle: 'Office Chair Repair',
    customerName: 'Customer',
    customerRating: 5.0,
    isVerifiedCustomer: true,
    scheduleTime: 'Scheduled Slot',
    arriveByNote: 'Prompt arrival recommended',
    chairModel: 'Ergonomic Task Chair',
    chairSize: 'Standard',
    locationArea: 'Designated Service Zone',
    distanceNote: 'Within dispatch radius',
    payoutRange: '₹499 – ₹799',
    symptom: 'Mechanical diagnosis & repair',
  };

  // Interaction State: 'idle' | 'assigning' | 'confirmed'
  const [confirmState, setConfirmState] = useState<'idle' | 'assigning' | 'confirmed'>('idle');

  const handleConfirmAccept = async () => {
    if (confirmState !== 'idle') return;

    if (!ticket.id) {
      Alert.alert('Error', 'No valid job identifier found to accept.');
      return;
    }

    setConfirmState('assigning');

    try {
      const res = await technicianApi.acceptJob(ticket.id);
      if (res.success) {
        setConfirmState('confirmed');

        // Update technician context with accepted request
        acceptRequest({
          ...ticket,
          status: 'assigned',
        });

        setTimeout(() => {
          navigation.navigate('RequestAccepted', {
            requestId: ticket.id || ticket.ticketNumber,
            request: {
              ...ticket,
              status: 'assigned',
            },
          });
        }, 500);
      } else {
        setConfirmState('idle');
        Alert.alert(
          'Cannot Accept Job',
          sanitizeUserErrorMessage(res.error) || 'This job is already assigned to another technician or is no longer available.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err: any) {
      setConfirmState('idle');
      Alert.alert(
        'Unable to Accept Job',
        sanitizeUserErrorMessage(err) || 'Unable to accept job right now. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDismiss = () => {
    if (confirmState !== 'idle') return;
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('JobRequests');
    }
  };

  return (
    <View style={styles.screenOverlay}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20) + 8,
            paddingBottom: Math.max(insets.bottom, 20) + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Modal Card Wrapper */}
        <View style={styles.modalCard}>
          {/* Top Dismiss & Drag Handle Bar */}
          <View style={styles.topHandleBar}>
            <View style={styles.emptySpacer} />
            <View style={styles.dragHandle} />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleDismiss}
              activeOpacity={0.7}
              accessibilityLabel="Cancel and close confirmation"
            >
              <AppIcon name="X" size={18} />
            </TouchableOpacity>
          </View>

          {/* Prominent Dynamic Icon & Header */}
          <View style={styles.headerSection}>
            <View style={styles.iconBadgeWrapper}>
              <View style={styles.calendarClockBadge}>
                <AppIcon name="Clock" size={18} />
              </View>
              <View style={styles.checkBadge}>
                <AppIcon name="Check" size={18} />
              </View>
            </View>

            <Text style={styles.headlineTitle}>Accept this service request?</Text>
            <Text style={styles.subheadlineDesc}>
              You are agreeing to arrive at the client's site promptly. The
              client will be notified immediately of your dispatch
              confirmation.
            </Text>
          </View>

          {/* Main Content Section */}
          <View style={styles.contentBody}>
            {/* Request Summary Card */}
            <View style={styles.summaryCard}>
              {/* Header: Service Title & Payout */}
              <View style={styles.summaryHeaderRow}>
                <View style={styles.serviceTitleCol}>
                  <Text style={styles.serviceTitleText}>
                    {ticket.serviceTitle || 'Office Chair Repair'}
                  </Text>
                  <Text style={styles.ticketNumberTag}>
                    TICKET #{ticket.ticketNumber || 'REQ-8492'}
                  </Text>
                </View>
                <View style={styles.payoutCol}>
                  <Text style={styles.payoutAmountText}>
                    ₹{ticket.totalAmount || (ticket as any).total || 599}
                  </Text>
                  <Text style={styles.payoutEstLabel}>Booked Price</Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              {/* Spec Data Rows */}
              <View style={styles.specRowsContainer}>
                {/* Client Profile */}
                <View style={styles.specRow}>
                  <View style={styles.specRowLeft}>
                    <AppIcon name="User" size={18} />
                    <Text style={styles.specMainText}>
                      {ticket.customerName || 'Ansh Kumar'}
                    </Text>
                  </View>
                  <View style={styles.verifiedPill}>
                    <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.verifiedText}>
                      {ticket.customerRating ? ticket.customerRating.toFixed(1) : '4.9'} Verified
                    </Text>
                  </View>
                </View>

                {/* Schedule */}
                <View style={styles.specRow}>
                  <View style={styles.specRowLeft}>
                    <AppIcon name="Clock" size={18} />
                    <View style={styles.specTextCol}>
                      <Text style={styles.specMainText}>
                        {ticket.scheduleTime || 'Today • 2:30 PM'}
                      </Text>
                      <Text style={styles.specWarningSub}>
                        {ticket.arriveByNote || 'Arrive by 2:25 PM sharp'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Chair Model */}
                <View style={styles.specRow}>
                  <View style={styles.specRowLeft}>
                    <AppIcon name="Armchair" size={18} />
                    <View style={styles.chairModelRow}>
                      <Text style={styles.specMainText}>
                        {ticket.chairModel || 'Herman Miller Aeron'}
                      </Text>
                      <View style={styles.chairSizeBadge}>
                        <Text style={styles.chairSizeText}>
                          {ticket.chairSize || 'Size B'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Geo Location */}
                <View style={styles.specRow}>
                  <View style={styles.specRowLeft}>
                    <AppIcon name="MapPin" size={18} />
                    <View style={styles.specTextCol}>
                      <Text style={styles.specMainText}>
                        {ticket.locationArea || 'Palm Springs Residences, Sector 54'}
                      </Text>
                      <Text style={styles.specSubText}>
                        {ticket.distanceNote || '2.4 km from your live radius'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Critical Dispatch Protocol Notice Box */}
            <View style={styles.protocolNoticeBox}>
              <View style={styles.protocolIconPod}>
                <AppIcon name="ShieldCheck" size={18} />
              </View>
              <View style={styles.protocolTextCol}>
                <Text style={styles.protocolTitle}>Important Dispatch Protocol</Text>
                <Text style={styles.protocolBody}>
                  Ensure you can reach the customer at the scheduled time before
                  accepting. Late arrivals or unexcused cancellations impact
                  your verified technician dispatch tier and acceptance score.
                </Text>
              </View>
            </View>

            {/* Pre-Assignment Checklist */}
            <View style={styles.checklistCard}>
              <Text style={styles.checklistHeader}>Pre-Assignment Checklist</Text>
              <View style={styles.checklistItem}>
                <View style={styles.checkCircle}>
                  <AppIcon name="Check" size={18} />
                </View>
                <Text style={styles.checklistText}>
                  Diagnostic repair kit & Class-4 cylinders stocked in van
                </Text>
              </View>
              <View style={styles.checklistItem}>
                <View style={styles.checkCircle}>
                  <AppIcon name="Check" size={18} />
                </View>
                <Text style={styles.checklistText}>
                  Direct in-app route navigation unlocks upon acceptance
                </Text>
              </View>
              <View style={styles.checklistItem}>
                <View style={styles.checkCircle}>
                  <AppIcon name="Check" size={18} />
                </View>
                <Text style={styles.checklistText}>
                  Direct customer chat and phone bridge activated
                </Text>
              </View>
            </View>

            {/* Interactive Actions Area */}
            <View style={styles.actionsArea}>
              {/* Primary Confirm Button */}
              <TouchableOpacity
                style={[
                  styles.primaryConfirmBtn,
                  confirmState === 'assigning' && styles.primaryBtnAssigning,
                  confirmState === 'confirmed' && styles.primaryBtnConfirmed,
                ]}
                onPress={handleConfirmAccept}
                disabled={confirmState !== 'idle'}
                activeOpacity={0.88}
              >
                {confirmState === 'idle' && (
                  <>
                    <Text style={styles.primaryBtnText}>
                      Accept Request (Confirm)
                    </Text>
                    <Text style={styles.primaryBtnArrow}>→</Text>
                  </>
                )}

                {confirmState === 'assigning' && (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={Colors.onPrimary} />
                    <Text style={styles.primaryBtnText}>
                      Assigning Ticket #{ticket.ticketNumber || 'REQ-8492'}...
                    </Text>
                  </View>
                )}

                {confirmState === 'confirmed' && (
                  <View style={styles.loadingRow}>
                    <AppIcon name="Check" size={18} />
                    <Text style={styles.primaryBtnText}>
                      Ticket Confirmed! Navigating...
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Secondary Dismiss Button */}
              <TouchableOpacity
                style={styles.secondaryBackBtn}
                onPress={handleDismiss}
                disabled={confirmState !== 'idle'}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryBackText}>Go Back</Text>
              </TouchableOpacity>
            </View>

            {/* Protocol Micro-Copy */}
            <View style={styles.protocolFooter}>
              <Text style={styles.protocolFooterText}>
                ChairCare Fleet Dispatch Protocol v4.2 • Instant Ticket Assignment
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // Sleek darkened backdrop
  },
  scrollContent: {
    paddingHorizontal: 12,
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.level3,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  topHandleBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  emptySpacer: {
    width: 32,
  },
  dragHandle: {
    width: 48,
    height: 5,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: BorderRadius.full,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnIcon: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  headerSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    alignItems: 'center',
    textAlign: 'center',
  },
  iconBadgeWrapper: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.level1,
  },
  calendarClockBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarClockIcon: {
    fontSize: 30,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  checkIcon: {
    color: Colors.onSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  headlineTitle: {
    ...Typography.headlineMd,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.onSurface,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subheadlineDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 310,
    lineHeight: 18,
  },
  contentBody: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainer,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceTitleCol: {
    flex: 1,
  },
  serviceTitleText: {
    ...Typography.titleLg,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  ticketNumberTag: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  payoutCol: {
    alignItems: 'flex-end',
  },
  payoutAmountText: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
  },
  payoutEstLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    marginVertical: 10,
  },
  specRowsContainer: {
    gap: 10,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specRowLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  specIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  specMainText: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  specTextCol: {
    flex: 1,
  },
  specWarningSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.error,
    fontWeight: '600',
    marginTop: 1,
  },
  specSubText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  verifiedPill: {
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedStar: {
    fontSize: 10,
  },
  verifiedText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  chairModelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  chairSizeBadge: {
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chairSizeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  protocolNoticeBox: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  protocolIconPod: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolShieldIcon: {
    fontSize: 16,
  },
  protocolTextCol: {
    flex: 1,
  },
  protocolTitle: {
    ...Typography.titleLg,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: 2,
  },
  protocolBody: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  checklistCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceContainer,
  },
  checklistHeader: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#009668',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  checklistText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurface,
    flex: 1,
    lineHeight: 16,
  },
  actionsArea: {
    gap: 8,
    paddingTop: 4,
  },
  primaryConfirmBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  primaryBtnAssigning: {
    opacity: 0.9,
    backgroundColor: Colors.primaryContainer,
  },
  primaryBtnConfirmed: {
    backgroundColor: Colors.secondaryCobalt,
  },
  primaryBtnText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  primaryBtnArrow: {
    fontSize: 16,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmedIcon: {
    fontSize: 16,
    color: Colors.onPrimary,
    fontWeight: '800',
  },
  secondaryBackBtn: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerHigh,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBackText: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  protocolFooter: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  protocolFooterText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
    textAlign: 'center',
  },
});
