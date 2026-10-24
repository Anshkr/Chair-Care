import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface RefundCompletedProps {
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

export const RefundCompletedChaircareMobileScreen: React.FC<
  RefundCompletedProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const params = route?.params;

  const passedTxn = params?.transaction;
  const txnId = params?.txnId || passedTxn?.id || 'txn-84291';

  // Refund and transaction details with fallback to canonical Stitch reference data
  const refundId = 'RF-39281';
  const code = passedTxn?.code || 'TXN-84291';
  const customerName = passedTxn?.customerName || 'Rahul Mehta';
  const customerUid = 'UID-9418';
  const vpaHandle = passedTxn?.vpaHandle || 'rahul@okaxis';
  const paymentMethodText = `UPI (${vpaHandle})`;

  const refundAmount = params?.refundAmount || passedTxn?.refundAmount || 1850;
  const refundAmountFormatted = `₹${refundAmount.toLocaleString('en-IN')}.00`;
  const clawbackAmount = Math.round(refundAmount * 0.9);
  const clawbackAmountFormatted = `-₹${clawbackAmount.toLocaleString('en-IN')}.00`;

  const timestamp = passedTxn?.refundTimestamp || '05 Oct 2026 • 05:58 PM IST';
  const utr = passedTxn?.utr || 'REF-UPI-984210948';
  const authorizingAdmin = 'Super Admin (#SA-01)';

  // Animation & UI states
  const [copied, setCopied] = useState<boolean>(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 65,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation
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
  }, [pulseAnim, fadeAnim, scaleAnim]);

  const handleCopyRefundId = () => {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleViewPaymentRecord = () => {
    if (navigation) {
      navigation.navigate('PaymentDetailsTxn84291', {
        txnId,
        transaction: {
          ...passedTxn,
          code,
          customerName,
          refundAmount,
          status: 'refunded',
          statusLabel: 'Refunded',
          isRefunded: true,
        },
      });
    }
  };

  const handleDoneBackToPayments = () => {
    if (navigation) {
      navigation.navigate('PaymentsTab');
    }
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20) + 10,
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            width: '100%',
          }}
        >
          {/* 1. Top Bar */}
          <View style={styles.topBarRow}>
            <View style={styles.bankingSwitchPill}>
              <Animated.View
                style={[styles.pulsingDot, { opacity: pulseAnim }]}
              />
              <Text style={styles.bankingSwitchText}>
                BANKING SWITCH CONFIRMED • ID: {refundId}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeCircleBtn}
              onPress={handleDoneBackToPayments}
              activeOpacity={0.7}
            >
              <AppIcon name="close" size={20} />
            </TouchableOpacity>
          </View>

          {/* 2. Hero Section: Refund Processed */}
          <View style={styles.heroSection}>
            <View style={styles.heroIconContainer}>
              <View style={styles.heroOuterHalo} />
              <View style={styles.heroInnerHalo} />
              <View style={styles.heroMainCircle}>
                <AppIcon name="check_circle" size={20} />
              </View>
            </View>

            <Text style={styles.heroHeadingText}>Refund Processed</Text>
            <Text style={styles.heroSubText}>
              The refund has been successfully initiated and logged in the
              immutable platform ledger.
            </Text>

            {/* Disbursed Reversal Amount Capsule */}
            <View style={styles.amountCapsuleCard}>
              <Text style={styles.amountCapsuleLabel}>
                DISBURSED REVERSAL AMOUNT
              </Text>
              <Text style={styles.amountHeroValue}>{refundAmountFormatted}</Text>
              <View style={styles.gatewayClearedRow}>
                <AppIcon name="verified" size={20} />
                <Text style={styles.gatewayClearedText}>
                  Gateway Cleared • 100% Volume
                </Text>
              </View>
            </View>
          </View>

          {/* 3. Execution Audit Manifest Card */}
          <View style={styles.manifestCard}>
            <View style={styles.manifestHeaderRow}>
              <View style={styles.manifestHeaderLeft}>
                <AppIcon name="receipt_long" size={20} />
                <Text style={styles.manifestHeading}>
                  EXECUTION AUDIT MANIFEST
                </Text>
              </View>
              <View style={styles.versionBadge}>
                <Text style={styles.versionBadgeText}>V-4.8.2</Text>
              </View>
            </View>

            <View style={styles.manifestDataGrid}>
              {/* Row: Refund ID */}
              <View style={styles.manifestRow}>
                <Text style={styles.manifestRowLabel}>Refund ID</Text>
                <View style={styles.manifestRowRight}>
                  <Text style={styles.refundIdText}>{refundId}</Text>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={handleCopyRefundId}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="content_copy" size={20} />
                  </TouchableOpacity>
                  {copied && <Text style={styles.copiedTag}>Copied!</Text>}
                </View>
              </View>

              {/* Row: Original Txn ID */}
              <View style={styles.manifestRow}>
                <Text style={styles.manifestRowLabel}>Original Txn ID</Text>
                <Text style={styles.manifestRowValueMono}>{code}</Text>
              </View>

              {/* Row: Customer Account */}
              <View style={styles.manifestRow}>
                <Text style={styles.manifestRowLabel}>Customer Account</Text>
                <View style={styles.customerAccountRow}>
                  <Text style={styles.customerNameBold}>{customerName}</Text>
                  <View style={styles.accountDot} />
                  <Text style={styles.accountUidText}>{customerUid}</Text>
                </View>
              </View>

              {/* Row: Payment Method */}
              <View style={styles.manifestRow}>
                <Text style={styles.manifestRowLabel}>Payment Method</Text>
                <View style={styles.paymentMethodRow}>
                  <AppIcon name="account_balance_wallet" size={20} />
                  <Text style={styles.paymentMethodValue}>
                    {paymentMethodText}
                  </Text>
                </View>
              </View>

              {/* Row: Payout Status */}
              <View style={styles.manifestRow}>
                <Text style={styles.manifestRowLabel}>Payout Status</Text>
                <View style={styles.payoutStatusPill}>
                  <View style={styles.payoutStatusDot} />
                  <Text style={styles.payoutStatusText}>
                    Refund Initiated (Ack)
                  </Text>
                </View>
              </View>

              {/* Row: Execution Timestamp */}
              <View style={styles.manifestRow}>
                <Text style={styles.manifestRowLabel}>
                  Execution Timestamp
                </Text>
                <Text style={styles.manifestRowValueMono}>{timestamp}</Text>
              </View>

              {/* Row: Authorizing Admin */}
              <View style={styles.manifestRow}>
                <Text style={styles.manifestRowLabel}>Authorizing Admin</Text>
                <Text style={styles.authorizingAdminText}>
                  Super Admin <Text style={styles.adminTag}>(#SA-01)</Text>
                </Text>
              </View>

              {/* Row: UTR Reference */}
              <View style={styles.utrRow}>
                <Text style={styles.manifestRowLabel}>UTR Reference</Text>
                <Text style={styles.utrValueText}>{utr}</Text>
              </View>
            </View>
          </View>

          {/* 4. Customer Payout Timeline Banner */}
          <View style={styles.timelineBannerCard}>
            <View style={styles.timelineIconBox}>
              <AppIcon name="schedule" size={20} />
            </View>
            <View style={styles.timelineContentCol}>
              <Text style={styles.timelineTitle}>
                Customer Payout Timeline
              </Text>
              <Text style={styles.timelineBody}>
                The customer will receive the refunded amount according to their
                payment provider's processing time. UPI reversals are typically
                credited instantly or within 2–4 hours (maximum 3 business days
                per NPCI guidelines).
              </Text>
            </View>
          </View>

          {/* 5. Ledger Clawback Rebalance Card */}
          <View style={styles.clawbackCard}>
            <View style={styles.clawbackHeaderRow}>
              <View style={styles.clawbackHeaderLeft}>
                <View style={styles.clawbackDot} />
                <Text style={styles.clawbackHeading}>
                  LEDGER CLAWBACK REBALANCE
                </Text>
              </View>
              <Text style={styles.reconciledTag}>RECONCILED</Text>
            </View>

            <View style={styles.clawbackInnerBox}>
              <View style={styles.clawbackInnerLeft}>
                <View style={styles.handymanBox}>
                  <AppIcon name="handyman" size={20} />
                </View>
                <View style={styles.clawbackMetaCol}>
                  <Text style={styles.clawbackLedgerTitle}>
                    Technician Payout Ledger
                  </Text>
                  <Text style={styles.clawbackCycleText}>
                    CYCLE: WEEK-40-DISBURSEMENT
                  </Text>
                </View>
              </View>

              <View style={styles.clawbackInnerRight}>
                <Text style={styles.clawbackAmountText}>
                  {clawbackAmountFormatted}
                </Text>
                <Text style={styles.heldBackText}>Held back</Text>
              </View>
            </View>

            <Text style={styles.clawbackFootnote}>
              Automated clawback deducted from vendor payout pool to prevent
              balance deficit.
            </Text>
          </View>

          {/* 6. Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleViewPaymentRecord}
              activeOpacity={0.88}
            >
              <AppIcon name="open_in_new" size={20} />
              <Text style={styles.primaryActionText}>
                View Payment Record
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={handleDoneBackToPayments}
              activeOpacity={0.82}
            >
              <Text style={styles.secondaryActionText}>
                Done (Back to Payments)
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
    backgroundColor: '#f7f9fb',
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },

  /* 1. Top Bar */
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    marginBottom: 8,
  },
  bankingSwitchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 6,
    ...Shadows.level1,
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#009668',
  },
  bankingSwitchText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#45464d',
    letterSpacing: 0.4,
  },
  closeCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  closeIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#191c1e',
    includeFontPadding: false,
  },

  /* 2. Hero Section */
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  heroIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  heroOuterHalo: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(78, 222, 163, 0.18)',
  },
  heroInnerHalo: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(78, 222, 163, 0.3)',
  },
  heroMainCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#4edea3',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  checkCircleIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 44,
    color: '#002113',
    includeFontPadding: false,
  },
  heroHeadingText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroSubText: {
    ...Typography.bodySm,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#45464d',
    textAlign: 'center',
    maxWidth: 290,
    marginBottom: 14,
  },
  amountCapsuleCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  amountCapsuleLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#76777d',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  amountHeroValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 32,
    lineHeight: 40,
    color: '#191c1e',
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  gatewayClearedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#009668',
    includeFontPadding: false,
  },
  gatewayClearedText: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#009668',
  },

  /* 3. Execution Audit Manifest */
  manifestCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 16,
    marginTop: 14,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  manifestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e3e5',
  },
  manifestHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#45464d',
    includeFontPadding: false,
  },
  manifestHeading: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#45464d',
    fontWeight: '600',
  },
  versionBadge: {
    backgroundColor: '#eceef0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  versionBadgeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
  },
  manifestDataGrid: {
    gap: 10,
  },
  manifestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  manifestRowLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#45464d',
  },
  manifestRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refundIdText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12.5,
    fontWeight: '700',
    color: '#191c1e',
  },
  copyBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#45464d',
    includeFontPadding: false,
  },
  copiedTag: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#009668',
  },
  manifestRowValueMono: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 12,
    color: '#191c1e',
  },
  customerAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerNameBold: {
    ...Typography.bodySm,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#191c1e',
  },
  accountDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c6c6cd',
  },
  accountUidText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#76777d',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walletIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#0051d5',
    includeFontPadding: false,
  },
  paymentMethodValue: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#191c1e',
  },
  payoutStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 222, 163, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  payoutStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#009668',
  },
  payoutStatusText: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: '#009668',
  },
  authorizingAdminText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#191c1e',
  },
  adminTag: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#76777d',
  },
  utrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e3e5',
  },
  utrValueText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11.5,
    color: '#0051d5',
    fontWeight: '700',
  },

  /* 4. Customer Payout Timeline Banner */
  timelineBannerCard: {
    width: '100%',
    backgroundColor: 'rgba(219, 225, 255, 0.35)',
    borderRadius: BorderRadius.xl,
    padding: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#dbe1ff',
  },
  timelineIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0051d5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  timelineScheduleIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },
  timelineContentCol: {
    flex: 1,
    gap: 2,
  },
  timelineTitle: {
    ...Typography.titleLg,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#191c1e',
  },
  timelineBody: {
    ...Typography.bodySm,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#45464d',
  },

  /* 5. Ledger Clawback Rebalance Card */
  clawbackCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 16,
    marginTop: 12,
    gap: 10,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  clawbackHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clawbackHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clawbackDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0051d5',
  },
  clawbackHeading: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#45464d',
    fontWeight: '600',
  },
  reconciledTag: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#009668',
    fontWeight: '700',
  },
  clawbackInnerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    borderRadius: BorderRadius.lg,
    padding: 12,
  },
  clawbackInnerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  handymanBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handymanIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#45464d',
    includeFontPadding: false,
  },
  clawbackMetaCol: {
    flex: 1,
  },
  clawbackLedgerTitle: {
    ...Typography.bodySm,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#191c1e',
  },
  clawbackCycleText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: '#76777d',
    marginTop: 1,
  },
  clawbackInnerRight: {
    alignItems: 'flex-end',
  },
  clawbackAmountText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 13,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  heldBackText: {
    ...Typography.bodySm,
    fontSize: 10,
    color: '#76777d',
    marginTop: 1,
  },
  clawbackFootnote: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#76777d',
    paddingHorizontal: 2,
  },

  /* 6. Action Buttons */
  actionButtonsContainer: {
    width: '100%',
    gap: 10,
    marginTop: 16,
  },
  primaryActionButton: {
    width: '100%',
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  primaryActionIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },
  primaryActionText: {
    fontFamily: Typography.titleLg.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryActionButton: {
    width: '100%',
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontFamily: Typography.titleLg.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#191c1e',
  },
});
