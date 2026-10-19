import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface RefundConfirmationProps {
  navigation?: any;
  route?: {
    params?: {
      txnId?: string;
      transaction?: any;
      refundAmount?: number;
      refundAmountFormatted?: string;
      issueType?: string;
      reason?: string;
      adminNotes?: string;
    };
  };
}

export const RefundConfirmationChaircareMobileScreen: React.FC<
  RefundConfirmationProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const params = route?.params;

  const passedTxn = params?.transaction;
  const txnId = params?.txnId || passedTxn?.id || 'txn-84291';

  // Transaction & Refund parameters with fallback to canonical Stitch reference data
  const code = passedTxn?.code || 'TXN-84291';
  const customerName = passedTxn?.customerName || 'Rahul Mehta';
  const customerCode = '#CUST-8812';
  const serviceName = 'Office Chair Repair';
  const ticketCode = passedTxn?.serviceId || '#CC-10482';
  const originalTender = 'UPI Settled via Razorpay';
  const originalAmountFormatted = passedTxn?.amountFormatted || '₹1,850.00';
  const vpaHandle = passedTxn?.vpaHandle || 'rahul@okaxis';

  const refundAmount = params?.refundAmount || passedTxn?.refundAmount || 1850;
  const isFullReversal = refundAmount >= (passedTxn?.amountNumber || 1850);
  const refundAmountFormatted = `₹${refundAmount.toLocaleString('en-IN')}.00`;
  const clawbackAmount = Math.round(refundAmount * 0.9);
  const clawbackAmountFormatted = `₹${clawbackAmount.toLocaleString('en-IN')}.00`;

  const reason =
    params?.reason ||
    passedTxn?.reason ||
    'Service Cancelled / Supervisory Executive Waiver';
  const issueType = params?.issueType || passedTxn?.issueType || 'refund';
  const initialAdminNotes =
    params?.adminNotes ||
    passedTxn?.adminNotes ||
    'Approved by Lead Ops Admin per ticket #CC-10482 cancellation agreement.';

  // Form State
  const [certified, setCertified] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>(initialAdminNotes);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const toggleCertification = () => {
    const nextVal = !certified;
    setCertified(nextVal);
    Animated.timing(checkAnim, {
      toValue: nextVal ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const handleConfirmRefund = () => {
    if (!certified || isProcessing) return;

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      if (navigation) {
        navigation.navigate('RefundCompleted', {
          txnId,
          transaction: {
            ...passedTxn,
            code,
            customerName,
            customerCode,
            serviceName,
            ticketCode,
            refundAmount,
            refundAmountFormatted,
            reason,
            issueType,
            adminNotes: notes,
            vpaHandle,
            status: 'refunded',
            statusLabel: 'Refunded',
            refundTimestamp: '14 Oct 2026 • 11:35 AM',
            utr: 'UTR: 429188402910',
          },
          refundAmount,
          refundAmountFormatted,
          issueType,
          reason,
          adminNotes: notes,
        });
      }
    }, 1200);
  };

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
              } else if (navigation) {
                navigation.navigate('RefundPaymentIssue', { txnId });
              }
            }}
            activeOpacity={0.7}
          >
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Refund Confirmation
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.moreOptionsBtn}
            onPress={() => {}}
            activeOpacity={0.7}
          >
            <AppIcon name="more_vert" size={20} />
          </TouchableOpacity>
          <View style={styles.adminAvatarContainer}>
            <AppIcon name="person" size={20} />
          </View>
        </View>
      </View>

      {/* Main Content ScrollView */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Clearance Level & Status Strip */}
        <View style={styles.clearanceStripRow}>
          <View style={styles.clearanceLeft}>
            <Animated.View
              style={[styles.redPulsingDot, { opacity: pulseAnim }]}
            />
            <Text style={styles.clearanceText}>
              SUPER ADMIN CLEARANCE REQUIRED
            </Text>
          </View>
          <View style={styles.authGateBadge}>
            <Text style={styles.authGateText}>AUTH-GATE #4</Text>
          </View>
        </View>

        {/* 3. Verification Hero Visual Banner */}
        <View style={styles.heroBannerCard}>
          <View style={styles.heroBackdropGlow} />

          <View style={styles.heroGavelCircle}>
            <AppIcon name="gavel" size={20} />
          </View>

          <Text style={styles.heroStepSubtitle}>FINAL VERIFICATION STEP</Text>
          <Text style={styles.heroActionTitle}>
            Authorize Refund Disbursement
          </Text>

          <View style={styles.heroAmountRow}>
            <Text style={styles.heroRupeeSymbol}>₹</Text>
            <Text style={styles.heroAmountValue}>
              {refundAmount.toLocaleString('en-IN')}.00
            </Text>
          </View>

          <View style={styles.reversalPill}>
            <AppIcon name="verified" size={20} />
            <Text style={styles.reversalPillText}>
              {isFullReversal
                ? '100% Full Payment Reversal'
                : 'Partial Escrow Reversal'}
            </Text>
          </View>
        </View>

        {/* 4. Detailed Confirmation Manifest Card (Audit Manifest) */}
        <View style={styles.manifestCard}>
          {/* Manifest Head Bar */}
          <View style={styles.manifestHeadBar}>
            <View style={styles.manifestHeadLeft}>
              <AppIcon name="receipt_long" size={20} />
              <Text style={styles.manifestHeadTitle}>Audit Manifest</Text>
            </View>
            <View style={styles.txnChip}>
              <Text style={styles.txnChipText}>{code}</Text>
            </View>
          </View>

          {/* Data Spec Rows */}
          <View style={styles.specRowsContainer}>
            {/* Customer Row */}
            <View style={styles.specRow}>
              <View style={styles.specColLeft}>
                <Text style={styles.specLabel}>Customer Entity</Text>
                <Text style={styles.specValueBold}>{customerName}</Text>
              </View>
              <View style={styles.custCodeBadge}>
                <Text style={styles.custCodeText}>{customerCode}</Text>
              </View>
            </View>

            {/* Service Order Reference */}
            <View style={styles.specRow}>
              <View style={styles.specColLeft}>
                <Text style={styles.specLabel}>Service Order Reference</Text>
                <Text style={styles.specValueBold}>{serviceName}</Text>
              </View>
              <View style={styles.ticketCodeBadge}>
                <Text style={styles.ticketCodeText}>{ticketCode}</Text>
              </View>
            </View>

            {/* Original Tender */}
            <View style={styles.specRow}>
              <View style={styles.specColLeft}>
                <Text style={styles.specLabel}>Original Tender</Text>
                <Text style={styles.specValueRegular}>{originalTender}</Text>
              </View>
              <Text style={styles.originalAmountMono}>
                {originalAmountFormatted}
              </Text>
            </View>

            {/* Remittance Destination */}
            <View style={styles.destinationBox}>
              <Text style={styles.specLabel}>Remittance Destination</Text>
              <View style={styles.destinationValueRow}>
                <Text style={styles.vpaMonoText} numberOfLines={1}>
                  {vpaHandle}
                </Text>
                <View style={styles.routingTag}>
                  <Text style={styles.routingTagText}>Razorpay Routing</Text>
                </View>
              </View>
            </View>

            {/* Discharge Reason */}
            <View style={styles.dischargeReasonBox}>
              <Text style={styles.specLabel}>Discharge Reason</Text>
              <Text style={styles.dischargeReasonText}>{reason}</Text>
            </View>

            {/* Escrow Clawback Pill Container */}
            <View style={styles.clawbackContainer}>
              <AppIcon name="account_balance_wallet" size={20} />
              <View style={styles.clawbackContentCol}>
                <View style={styles.clawbackHeadRow}>
                  <Text style={styles.clawbackTitle}>
                    Technician Escrow Clawback
                  </Text>
                  <Text style={styles.clawbackAmount}>
                    {clawbackAmountFormatted}
                  </Text>
                </View>
                <Text style={styles.clawbackDescription}>
                  Auto-recalled from Rahul Sharma pending payout balance ledger
                  (Account #TECH-591).
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Safety Warning Card */}
        <View style={styles.safetyWarningCard}>
          <View style={styles.warningCircleIcon}>
            <AppIcon name="warning" size={20} />
          </View>
          <View style={styles.safetyContentCol}>
            <Text style={styles.safetyHeading}>Irreversible Fiscal Action</Text>
            <Text style={styles.safetyBody}>
              You are about to execute an automated refund of{' '}
              <Text style={styles.safetyBodyBold}>{refundAmountFormatted}</Text>.
              This instantly resets ledger entries, triggers API gateway
              settlement reversal, and notifies the consumer and service
              technician via automated SMS and mobile push notification.
            </Text>
          </View>
        </View>

        {/* 6. Operational Field Context Images (Diagnostic Case Evidence) */}
        <View style={styles.evidenceCard}>
          <Text style={styles.evidenceHeading}>DIAGNOSTIC CASE EVIDENCE</Text>
          <View style={styles.evidenceGrid}>
            <View style={styles.evidenceItemCol}>
              <Image
                style={styles.evidenceImage}
                source={{
                  uri: 'https://images.unsplash.com/photo-1580481077197-8c381f9a0c02?q=80&w=400&auto=format&fit=crop',
                }}
              />
              <Text style={styles.evidenceCaption} numberOfLines={1}>
                Cylinder Assessment #1
              </Text>
            </View>

            <View style={styles.evidenceItemCol}>
              <Image
                style={styles.evidenceImage}
                source={{
                  uri: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=400&auto=format&fit=crop',
                }}
              />
              <Text style={styles.evidenceCaption} numberOfLines={1}>
                Dispatch Cancellation Sign-off
              </Text>
            </View>
          </View>
        </View>

        {/* 7. Admin Attestation Form Section */}
        <View style={styles.attestationCard}>
          <Text style={styles.attestationTitle}>Supervisory Attestation</Text>

          {/* Interactive Checkbox Card */}
          <TouchableOpacity
            style={[
              styles.checkboxCard,
              certified && styles.checkboxCardActive,
            ]}
            onPress={toggleCertification}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.customCheckboxBox,
                certified && styles.customCheckboxBoxChecked,
              ]}
            >
              {certified && <AppIcon name="check" size={20} />}
            </View>
            <View style={styles.checkboxTextCol}>
              <Text style={styles.checkboxHeading}>
                I formally certify this audit.
              </Text>
              <Text style={styles.checkboxSubtext}>
                I have verified transaction validity, customer justification
                log, and the exact refund sum of {refundAmountFormatted}.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Clearance Manifest Notes */}
          <View style={styles.manifestNotesGroup}>
            <View style={styles.notesHeaderRow}>
              <Text style={styles.notesLabel}>Clearance Manifest Notes</Text>
              <Text style={styles.immutableTag}>Logged to immutable trail</Text>
            </View>
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={2}
              value={notes}
              onChangeText={setNotes}
              placeholder="Provide reason for audit compliance..."
              placeholderTextColor="#76777d"
            />
          </View>
        </View>
      </ScrollView>

      {/* 8. Sticky Execution Footer */}
      <View
        style={[
          styles.bottomExecutionFooter,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.submitConfirmationBtn,
            certified && styles.submitConfirmationBtnActive,
          ]}
          onPress={handleConfirmRefund}
          disabled={!certified || isProcessing}
          activeOpacity={0.88}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <AppIcon name={certified ? 'verified_user' : 'lock'} size={20} />
          )}
          <Text
            style={[
              styles.submitBtnText,
              certified && styles.submitBtnTextActive,
            ]}
          >
            {isProcessing
              ? 'Processing Gateway Clearance...'
              : `Confirm & Process Refund (${refundAmountFormatted.replace('.00', '')})`}
          </Text>
          {!isProcessing && (
            <AppIcon name="arrow_forward" size={20} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.goBackSafeBtn}
          onPress={() => {
            if (navigation && navigation.canGoBack()) {
              navigation.goBack();
            } else if (navigation) {
              navigation.navigate('RefundPaymentIssue', { txnId });
            }
          }}
          activeOpacity={0.75}
        >
          <AppIcon name="undo" size={20} />
          <Text style={styles.goBackText}>Go Back &amp; Edit Details</Text>
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

  /* 1. Header */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eceef0',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  backButtonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 24,
    color: '#191c1e',
    includeFontPadding: false,
  },
  headerTitleText: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '600',
    color: '#191c1e',
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreOptionsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreOptionsIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#45464d',
    includeFontPadding: false,
  },
  adminAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },

  scrollContainer: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },

  /* 2. Clearance Strip */
  clearanceStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  clearanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  redPulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ba1a1a',
  },
  clearanceText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#ba1a1a',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  authGateBadge: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  authGateText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#45464d',
    fontWeight: '600',
  },

  /* 3. Hero Visual Banner */
  heroBannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  heroBackdropGlow: {
    position: 'absolute',
    bottom: -24,
    right: -24,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 218, 214, 0.45)',
  },
  heroGavelCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffdad6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...Shadows.level1,
  },
  gavelIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 30,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  heroStepSubtitle: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#76777d',
    fontWeight: '700',
    marginBottom: 4,
  },
  heroActionTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 19,
    fontWeight: '700',
    color: '#191c1e',
    textAlign: 'center',
    marginBottom: 6,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: 4,
    gap: 2,
  },
  heroRupeeSymbol: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 24,
    color: '#191c1e',
  },
  heroAmountValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 36,
    lineHeight: 44,
    color: '#191c1e',
    letterSpacing: -0.8,
    fontWeight: '700',
  },
  reversalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(111, 251, 190, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginTop: 6,
  },
  verifiedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#009668',
    includeFontPadding: false,
  },
  reversalPillText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#009668',
    fontWeight: '600',
  },

  /* 4. Audit Manifest Card */
  manifestCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  manifestHeadBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  manifestHeadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptLongIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#0051d5',
    includeFontPadding: false,
  },
  manifestHeadTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  txnChip: {
    backgroundColor: '#e0e3e5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  txnChipText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#191c1e',
    fontWeight: '600',
  },

  specRowsContainer: {
    gap: 8,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(242, 244, 246, 0.7)',
    borderRadius: BorderRadius.lg,
    padding: 10,
  },
  specColLeft: {
    gap: 1,
  },
  specLabel: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 10.5,
    color: '#76777d',
    fontWeight: '500',
  },
  specValueBold: {
    ...Typography.bodyMd,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#191c1e',
  },
  specValueRegular: {
    ...Typography.bodySm,
    fontSize: 12.5,
    color: '#191c1e',
  },
  custCodeBadge: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  custCodeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#45464d',
  },
  ticketCodeBadge: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ticketCodeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#0051d5',
    fontWeight: '700',
  },
  originalAmountMono: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12.5,
    color: '#191c1e',
    fontWeight: '600',
  },

  destinationBox: {
    backgroundColor: 'rgba(242, 244, 246, 0.7)',
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 2,
  },
  destinationValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  vpaMonoText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#191c1e',
    fontWeight: '700',
    flex: 1,
  },
  routingTag: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  routingTagText: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 10.5,
    color: '#45464d',
  },

  dischargeReasonBox: {
    backgroundColor: 'rgba(242, 244, 246, 0.7)',
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 2,
  },
  dischargeReasonText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#191c1e',
    fontWeight: '500',
  },

  clawbackContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 218, 214, 0.45)',
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 10,
  },
  clawbackWalletIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ba1a1a',
    marginTop: 2,
    includeFontPadding: false,
  },
  clawbackContentCol: {
    flex: 1,
    gap: 2,
  },
  clawbackHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clawbackTitle: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#93000a',
  },
  clawbackAmount: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  clawbackDescription: {
    ...Typography.bodySm,
    fontSize: 11,
    lineHeight: 15,
    color: '#93000a',
  },

  /* 5. Safety Warning Card */
  safetyWarningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#131b2e',
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 12,
  },
  warningCircleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ba1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  warningIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },
  safetyContentCol: {
    flex: 1,
    gap: 3,
  },
  safetyHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  safetyBody: {
    ...Typography.bodySm,
    fontSize: 12,
    lineHeight: 17,
    color: '#bec6e0',
  },
  safetyBodyBold: {
    color: '#ffffff',
    fontWeight: '700',
  },

  /* 6. Diagnostic Case Evidence */
  evidenceCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 10,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  evidenceHeading: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  evidenceGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  evidenceItemCol: {
    flex: 1,
    gap: 4,
  },
  evidenceImage: {
    width: '100%',
    height: 96,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#e6e8ea',
  },
  evidenceCaption: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#45464d',
  },

  /* 7. Attestation Card */
  attestationCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  attestationTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  checkboxCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f2f4f6',
    borderRadius: BorderRadius.lg,
    padding: 12,
    gap: 10,
  },
  checkboxCardActive: {
    backgroundColor: '#f2f4f6',
  },
  customCheckboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#e0e3e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  customCheckboxBoxChecked: {
    backgroundColor: '#0051d5',
  },
  checkIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#ffffff',
    includeFontPadding: false,
  },
  checkboxTextCol: {
    flex: 1,
    gap: 2,
  },
  checkboxHeading: {
    ...Typography.bodyMd,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#191c1e',
  },
  checkboxSubtext: {
    ...Typography.bodySm,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#45464d',
  },

  manifestNotesGroup: {
    gap: 6,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notesLabel: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: '#191c1e',
  },
  immutableTag: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: '#76777d',
  },
  notesInput: {
    backgroundColor: '#f2f4f6',
    borderRadius: BorderRadius.lg,
    padding: 10,
    minHeight: 56,
    textAlignVertical: 'top',
    ...Typography.bodySm,
    fontSize: 12,
    color: '#191c1e',
  },

  /* 8. Sticky Execution Footer */
  bottomExecutionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.94)',
    borderTopWidth: 1,
    borderTopColor: '#eceef0',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 6,
    ...Shadows.level2,
  },
  submitConfirmationBtn: {
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#e0e3e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.65,
  },
  submitConfirmationBtnActive: {
    backgroundColor: '#ba1a1a',
    opacity: 1,
    ...Shadows.level1,
  },
  submitLockIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#45464d',
    includeFontPadding: false,
  },
  submitBtnText: {
    fontFamily: Typography.titleLg.fontFamily,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#45464d',
  },
  submitBtnTextActive: {
    color: '#ffffff',
  },
  submitArrowIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#45464d',
    includeFontPadding: false,
  },
  submitArrowIconActive: {
    color: '#ffffff',
  },
  goBackSafeBtn: {
    height: 38,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#f2f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  undoIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#191c1e',
    includeFontPadding: false,
  },
  goBackText: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: '#191c1e',
    fontWeight: '500',
  },
});
