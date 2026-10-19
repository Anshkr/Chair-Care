import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface ResolutionConfirmationScreenProps {
  navigation?: any;
  route?: {
    params?: {
      disputeId?: string;
      dispute?: any;
      resolutionData?: any;
    };
  };
}

export const ResolutionConfirmationChaircareMobileScreen: React.FC<
  ResolutionConfirmationScreenProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const passedDispute = route?.params?.dispute;
  const resolutionData = route?.params?.resolutionData;

  // Pulse animation for step indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isCertified, setIsCertified] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Context resolution & dispute parameters
  const disputeCode = resolutionData?.disputeCode || passedDispute?.code || 'DSP-20481';
  const disputeId = resolutionData?.disputeId || passedDispute?.id || 'dsp-20481';
  const customerName = passedDispute?.customerName || 'Rahul Mehta';
  const customerUpi = 'rahul@okaxis';
  const technicianName = passedDispute?.technicianName || 'Rahul Sharma';
  const technicianLedger = '#TECH-884';
  const linkedOrder = `${passedDispute?.serviceCode || '#CC-10482'} • ${passedDispute?.serviceTitle || 'Office Chair'}`;

  const totalEscrow = 1850;
  const refundAmount =
    resolutionData?.refundAmount !== undefined
      ? resolutionData.refundAmount
      : 900;
  const techPayout =
    resolutionData?.techPayout !== undefined
      ? resolutionData.techPayout
      : 765;
  const platformTariff = 185;

  const resolutionModeLabel =
    resolutionData?.option === 'full-refund'
      ? 'Full 100% Refund'
      : resolutionData?.option === 'release-tech'
      ? 'Release Full Payment to Technician'
      : resolutionData?.option === 'redispatch'
      ? 'Re-Dispatch Free Rectification'
      : resolutionData?.option === 'escalate'
      ? 'Escalation to Executive Panel'
      : 'Partial Refund & Adjustment';

  const reasonLabel =
    resolutionData?.reasonLabel ||
    'Incomplete service / Unverified supplementary charge';

  const adminAttestation =
    resolutionData?.adminNotes ||
    '“Field review confirms dynamic tension tuning was billed without signed customer work-order amendment. Approved partial refund of ₹900.00. Case closed with supervisory waiver.”';

  // Ratios for financial reconciliation indicator
  const refundPercent = Math.min(100, (refundAmount / totalEscrow) * 100);
  const payoutPercent = Math.min(100, (techPayout / totalEscrow) * 100);
  const platformPercent = Math.max(0, 100 - refundPercent - payoutPercent);

  const handleConfirmResolution = () => {
    if (!isCertified || isSubmitting || isSuccess) return;

    setIsSubmitting(true);

    // Simulate finalization transition
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        if (navigation) {
          navigation.navigate('DisputeResolved', {
            disputeId,
            dispute: {
              ...passedDispute,
              status: 'Resolved',
              resolution: resolutionData,
            },
            resolutionData,
          });
        }
      }, 700);
    }, 1000);
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Bar */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation?.canGoBack()) {
                navigation.goBack();
              } else {
                navigation?.navigate('DisputeResolution', {
                  disputeId,
                  dispute: passedDispute,
                });
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Resolution Confirmation
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            accessibilityLabel="Context actions"
          >
            <AppIcon name="more_vert" size={20} />
          </TouchableOpacity>
          <View style={styles.headerAvatarContainer}>
            <AppIcon name="person" size={20} />
          </View>
        </View>
      </View>

      {/* Main Content ScrollView */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Step Progression & Legal Clearance Warning Banner */}
        <View style={styles.stepHeaderContainer}>
          <View style={styles.stepBadgeRow}>
            <View style={styles.stepProgressBadge}>
              <Animated.View
                style={[styles.stepPulseDot, { opacity: pulseAnim }]}
              />
              <Text style={styles.stepProgressText}>
                Step 2 of 2 • Final Step
              </Text>
            </View>
            <View style={styles.disputeCodeTag}>
              <Text style={styles.disputeCodeTagText}>{disputeCode}</Text>
            </View>
          </View>

          {/* Legal Clearance Warning Banner */}
          <View style={styles.legalClearanceBanner}>
            <View style={styles.legalHeaderRow}>
              <AppIcon name="gavel" size={20} />
              <Text style={styles.legalLabelText}>
                LEGAL & FISCAL CLEARANCE REQUIRED
              </Text>
            </View>
            <Text style={styles.legalTitleText}>
              Authorize Dispute Settlement
            </Text>
            <Text style={styles.legalSubtitleText}>
              Review the financial clawback and customer refund terms before
              cryptographic execution.
            </Text>
          </View>
        </View>

        {/* 3. Resolution Manifest Card */}
        <View style={styles.manifestCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>RESOLUTION MANIFEST</Text>
            <View style={styles.escrowActionBadge}>
              <Text style={styles.escrowActionBadgeText}>Escrow Action</Text>
            </View>
          </View>

          <View style={styles.manifestList}>
            <View style={styles.manifestRow}>
              <Text style={styles.manifestLabel}>Resolution Mode</Text>
              <Text style={styles.manifestValueBold}>
                {resolutionModeLabel}
              </Text>
            </View>

            <View style={styles.manifestRow}>
              <Text style={styles.manifestLabel}>Customer Recipient</Text>
              <View style={styles.manifestRightAligned}>
                <Text style={styles.manifestValueBold}>{customerName}</Text>
                <Text style={styles.manifestSubValue}>
                  UPI: {customerUpi}
                </Text>
              </View>
            </View>

            <View style={styles.manifestRow}>
              <Text style={styles.manifestLabel}>Technician Debited</Text>
              <View style={styles.manifestRightAligned}>
                <Text style={styles.manifestValueBold}>{technicianName}</Text>
                <Text style={styles.manifestSubValue}>
                  Ledger: {technicianLedger}
                </Text>
              </View>
            </View>

            <View style={styles.manifestRow}>
              <Text style={styles.manifestLabel}>Linked Service Order</Text>
              <Text style={styles.manifestOrderValue}>{linkedOrder}</Text>
            </View>
          </View>
        </View>

        {/* 4. Financial Reconciliation Breakdown Card */}
        <View style={styles.financialCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>FINANCIAL RECONCILIATION</Text>
            <AppIcon name="account_balance_wallet" size={20} />
          </View>

          {/* Visual Ledger Ratio Indicator */}
          <View style={styles.ratioBarContainer}>
            <View
              style={[
                styles.ratioBarSegmentRefund,
                { width: `${refundPercent}%` },
              ]}
            />
            <View
              style={[
                styles.ratioBarSegmentTech,
                { width: `${payoutPercent}%` },
              ]}
            />
            <View
              style={[
                styles.ratioBarSegmentPlatform,
                { width: `${platformPercent}%` },
              ]}
            />
          </View>

          {/* Ratio Legend Row */}
          <View style={styles.ratioLegendRow}>
            <View style={styles.legendItem}>
              <View style={styles.legendDotRefund} />
              <Text style={styles.legendText}>
                Reversal {refundPercent.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendDotTech} />
              <Text style={styles.legendText}>
                Payout {payoutPercent.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendDotPlatform} />
              <Text style={styles.legendText}>Platform 10%</Text>
            </View>
          </View>

          {/* Invoiced Escrow Subcard */}
          <View style={styles.financialSubcard}>
            <View style={styles.subcardRow}>
              <Text style={styles.subcardLabel}>Disputed Escrow Invoiced</Text>
              <Text style={styles.subcardEscrowAmount}>
                ₹{totalEscrow.toFixed(2)}
              </Text>
            </View>

            <View style={styles.subcardRow}>
              <View>
                <Text style={styles.subcardHighlightRefund}>
                  Customer Refund Disbursed
                </Text>
                <Text style={styles.subcardSubtext}>
                  Razorpay Smart Route
                </Text>
              </View>
              <Text style={styles.subcardRefundAmount}>
                +₹{refundAmount.toFixed(2)}
              </Text>
            </View>

            <View style={styles.subcardRow}>
              <View>
                <Text style={styles.subcardHighlightError}>
                  Technician Payout Clawback
                </Text>
                <Text style={styles.subcardSubtext}>
                  Escrow cycle deduction
                </Text>
              </View>
              <Text style={styles.subcardClawbackAmount}>
                -₹{refundAmount.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Bottom Totals Breakdown */}
          <View style={styles.financialTotalsList}>
            <View style={styles.manifestRow}>
              <Text style={styles.manifestLabel}>Revised Technician Payout</Text>
              <Text style={styles.totalsValueBold}>
                ₹{techPayout.toFixed(2)}
              </Text>
            </View>
            <View style={styles.manifestRow}>
              <Text style={styles.manifestLabel}>Platform Mediation Tariff</Text>
              <Text style={styles.totalsValueBold}>
                ₹{platformTariff.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Logged Justification & Notes Card */}
        <View style={styles.justificationCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>LOGGED JUSTIFICATION</Text>
            <AppIcon name="verified" size={20} />
          </View>

          <View style={styles.reasonBadgeBox}>
            <Text style={styles.reasonBadgeText}>{reasonLabel}</Text>
          </View>

          <View style={styles.attestationBox}>
            <Text style={styles.attestationLabel}>
              ADMINISTRATIVE ATTESTATION
            </Text>
            <Text style={styles.attestationText}>{adminAttestation}</Text>
          </View>
        </View>

        {/* 6. Irreversible Fiscal Action Warning Box */}
        <View style={styles.irreversibleWarningBox}>
          <AppIcon name="shield_with_heart" size={20} />
          <View style={styles.irreversibleContent}>
            <Text style={styles.irreversibleTitle}>
              Irreversible Fiscal Action
            </Text>
            <Text style={styles.irreversibleDescription}>
              Executing this settlement will immediately trigger the banking
              switch to disburse{' '}
              <Text style={styles.irreversibleHighlightAmount}>
                ₹{refundAmount.toFixed(2)}
              </Text>{' '}
              to the customer’s UPI, debit the technician’s weekly cycle
              escrow, and notify both parties via priority SMS and email.
            </Text>
          </View>
        </View>

        {/* 7. Mandatory Supervisory Certification Checkbox */}
        <View style={styles.certificationCard}>
          <TouchableOpacity
            style={styles.checkboxTouchRow}
            onPress={() => setIsCertified(!isCertified)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.checkboxBox,
                isCertified && styles.checkboxBoxChecked,
              ]}
            >
              {isCertified && <AppIcon name="check" size={20} />}
            </View>
            <View style={styles.checkboxLabelContent}>
              <Text style={styles.certificationStatementText}>
                I formally certify this resolution. I have reviewed all photo
                evidence, digital worksheets, and technician response logs, and
                authorize the{' '}
                <Text style={styles.certificationBoldText}>
                  ₹{refundAmount.toFixed(2)}
                </Text>{' '}
                partial refund.
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.authStampRow}>
            <View style={styles.authStampLeft}>
              <AppIcon name="verified_user" size={20} />
              <Text style={styles.authStampText}>
                Authorized: Super Admin (#SA-01)
              </Text>
            </View>
            <Text style={styles.nodeTag}>Zone: South Hub</Text>
          </View>
        </View>

        {/* 8. Actions Area */}
        <View style={styles.actionsArea}>
          <TouchableOpacity
            style={[
              styles.primaryConfirmBtn,
              (!isCertified || isSubmitting) && styles.primaryConfirmBtnDisabled,
              isSuccess && styles.primaryConfirmBtnSuccess,
            ]}
            onPress={handleConfirmResolution}
            disabled={!isCertified || isSubmitting || isSuccess}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <>
                <AppIcon name="sync" size={20} />
                <Text style={styles.primaryConfirmBtnText}>
                  Broadcasting Settlement...
                </Text>
              </>
            ) : isSuccess ? (
              <>
                <AppIcon name="check_circle" size={20} />
                <Text style={styles.primaryConfirmBtnText}>
                  Settlement Executed Successfully
                </Text>
              </>
            ) : (
              <>
                <AppIcon name="lock_reset" size={20} />
                <Text style={styles.primaryConfirmBtnText}>
                  Confirm Resolution (₹{refundAmount.toFixed(2)})
                </Text>
                <AppIcon name="arrow_forward" size={20} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modifyTermsBtn}
            onPress={() => {
              if (navigation?.canGoBack()) {
                navigation.goBack();
              } else {
                navigation?.navigate('DisputeResolution', {
                  disputeId,
                  dispute: passedDispute,
                });
              }
            }}
            activeOpacity={0.7}
          >
            <AppIcon name="edit" size={20} />
            <Text style={styles.modifyTermsBtnText}>
              Go Back & Modify Terms
            </Text>
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

  /* Header */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(247, 249, 251, 0.94)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e3e5',
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    marginLeft: -8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  backIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 24,
    color: '#191c1e',
    includeFontPadding: false,
  },
  headerTitleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: '#191c1e',
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  headerIconText: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#45464d',
    includeFontPadding: false,
  },
  headerAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    ...Shadows.level1,
  },
  headerAvatarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },

  /* Content Scroll */
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },

  /* Step Header & Legal Banner */
  stepHeaderContainer: {
    gap: 12,
  },
  stepBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0051d5',
  },
  stepProgressText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#0051d5',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  disputeCodeTag: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  disputeCodeTagText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#45464d',
  },

  /* Legal Clearance Banner */
  legalClearanceBanner: {
    backgroundColor: 'rgba(255, 218, 214, 0.4)',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    ...Shadows.level1,
  },
  legalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gavelIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  legalLabelText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#ba1a1a',
    letterSpacing: 0.8,
  },
  legalTitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.3,
  },
  legalSubtitleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#45464d',
  },

  /* Manifest Card */
  manifestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  cardHeaderTitle: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#45464d',
    letterSpacing: 0.8,
  },
  escrowActionBadge: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  escrowActionBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#00174b',
  },
  manifestList: {
    gap: 10,
  },
  manifestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manifestLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  manifestValueBold: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
    textAlign: 'right',
  },
  manifestSubValue: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
    textAlign: 'right',
  },
  manifestRightAligned: {
    alignItems: 'flex-end',
  },
  manifestOrderValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#0051d5',
  },

  /* Financial Card */
  financialCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  walletIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#0051d5',
    includeFontPadding: false,
  },
  ratioBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e6e8ea',
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  ratioBarSegmentRefund: {
    height: '100%',
    backgroundColor: '#316bf3',
  },
  ratioBarSegmentTech: {
    height: '100%',
    backgroundColor: '#131b2e',
  },
  ratioBarSegmentPlatform: {
    height: '100%',
    backgroundColor: '#4edea3',
  },
  ratioLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDotRefund: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#316bf3',
  },
  legendDotTech: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#131b2e',
  },
  legendDotPlatform: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4edea3',
  },
  legendText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
  },
  financialSubcard: {
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  subcardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subcardLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  subcardEscrowAmount: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },
  subcardHighlightRefund: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#0051d5',
  },
  subcardSubtext: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
  },
  subcardRefundAmount: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#0051d5',
  },
  subcardHighlightError: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#ba1a1a',
  },
  subcardClawbackAmount: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  financialTotalsList: {
    gap: 8,
    paddingTop: 4,
  },
  totalsValueBold: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },

  /* Justification Card */
  justificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    ...Shadows.level1,
  },
  verifiedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#45464d',
    includeFontPadding: false,
  },
  reasonBadgeBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reasonBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  attestationBox: {
    backgroundColor: 'rgba(230, 232, 234, 0.4)',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  attestationLabel: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#45464d',
    letterSpacing: 0.6,
  },
  attestationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#191c1e',
    fontStyle: 'italic',
  },

  /* Irreversible Warning Box */
  irreversibleWarningBox: {
    backgroundColor: 'rgba(255, 218, 214, 0.6)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    ...Shadows.level1,
  },
  shieldHeartIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 24,
    color: '#ba1a1a',
    includeFontPadding: false,
    marginTop: 2,
  },
  irreversibleContent: {
    flex: 1,
    gap: 4,
  },
  irreversibleTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#ba1a1a',
    letterSpacing: -0.2,
  },
  irreversibleDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#191c1e',
  },
  irreversibleHighlightAmount: {
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: '#ba1a1a',
  },

  /* Mandatory Supervisory Certification */
  certificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  checkboxTouchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#b4c5ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: '#0051d5',
  },
  checkMarkIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    includeFontPadding: false,
  },
  checkboxLabelContent: {
    flex: 1,
  },
  certificationStatementText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 18,
    color: '#191c1e',
  },
  certificationBoldText: {
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: '#191c1e',
  },
  authStampRow: {
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authStampLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedUserIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#009668',
    includeFontPadding: false,
  },
  authStampText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },
  nodeTag: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },

  /* Actions */
  actionsArea: {
    gap: 10,
    paddingTop: 4,
  },
  primaryConfirmBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#131b2e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    ...Shadows.level2,
  },
  primaryConfirmBtnDisabled: {
    opacity: 0.4,
  },
  primaryConfirmBtnSuccess: {
    backgroundColor: '#009668',
  },
  primaryConfirmBtnText: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  primaryBtnIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ffffff',
    includeFontPadding: false,
  },
  loadingSpinnerIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ffffff',
    includeFontPadding: false,
  },
  modifyTermsBtn: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#eceef0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  editIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
    includeFontPadding: false,
  },
  modifyTermsBtnText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    fontWeight: '500',
    color: '#191c1e',
  },
});
