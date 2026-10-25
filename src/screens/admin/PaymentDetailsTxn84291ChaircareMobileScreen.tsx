import { AppIcon } from '../../components/common/AppIcon';
import { AdminHeaderAvatar } from '../../components/common/AdminHeaderAvatar';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface PaymentDetailsProps {
  navigation?: any;
  route?: {
    params?: {
      txnId?: string;
      transaction?: any;
    };
  };
}

export const PaymentDetailsTxn84291ChaircareMobileScreen: React.FC<
  PaymentDetailsProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const params = route?.params;

  const passedTxn = params?.transaction;
  const txnId = params?.txnId || passedTxn?.id || 'txn-84291';

  // Transaction details with fallback to canonical Stitch reference data
  const code = passedTxn?.code || 'TXN-84291';
  const status = passedTxn?.status || 'successful';
  const isSuccessful = status === 'successful';
  const isPending = status === 'pending';
  const isFailed = status === 'failed';
  const isRefunded = status === 'refunded';

  const statusLabel =
    passedTxn?.statusLabel ||
    (isSuccessful
      ? 'Payment Successful'
      : isPending
      ? 'Pending Escrow'
      : isFailed
      ? 'Failed (Retry Allowed)'
      : 'Refunded');

  const amountFormatted = passedTxn?.amountFormatted || '₹1,850';
  const customerName = passedTxn?.customerName || 'Rahul Mehta';
  const customerCode = '#CUST-8812';
  const customerLocation = passedTxn?.customerLocation || 'Sector 54, Gurugram';
  const technicianName = passedTxn?.technicianName || 'Rahul Sharma';
  const technicianRole = passedTxn?.technicianRoleOrService || 'Master • Van #04';
  const serviceTitle = 'Herman Miller Aeron';
  const serviceSub = 'Class-4 Hydraulic Replacement';
  const ticketCode = passedTxn?.serviceId || '#CC-10482';
  const paymentMethodTitle = passedTxn?.paymentMethodType === 'card' ? 'Credit Card' : passedTxn?.paymentMethodType === 'netbanking' ? 'NetBanking (HDFC)' : 'Google Pay (UPI)';
  const paymentVpa = 'rahul@okaxis';
  const timestamp = passedTxn?.paymentTimestamp || '05 Oct 2026, 05:42 PM IST';
  const utr = 'UTR: 429188402910';
  const escrowStatus = isSuccessful ? 'Settled to Escrow' : isPending ? 'Escrow Locked' : isRefunded ? 'Reversed from Escrow' : 'Gateway Aborted';

  // UI state
  const [showAuditDetails, setShowAuditDetails] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refundModalVisible, setRefundModalVisible] = useState(false);

  // Animations
  const toastAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastMessage(null);
    });
  };

  const handleCopy = (text: string, label: string) => {
    showToast(`${label} copied`);
  };

  const handleDownloadInvoice = () => {
    showToast(`Downloading Invoice PDF for ${code}...`);
  };

  const handleOpenRefundModal = () => {
    // If navigation to A21 is directly requested or via modal
    setRefundModalVisible(true);
  };

  const handleConfirmRefund = () => {
    setRefundModalVisible(false);
    setTimeout(() => {
      showToast(`Reversal authorized: ${amountFormatted} credited to source`);
      if (navigation) {
        navigation.navigate('RefundPaymentIssue', {
          txnId,
          transaction: {
            ...passedTxn,
            code,
            amountFormatted,
            customerName,
            technicianName,
            status: 'refund_processing',
          },
        });
      }
    }, 300);
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Fixed Header Bar */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation && navigation.canGoBack()) {
                navigation.goBack();
              } else if (navigation) {
                navigation.navigate('PaymentsTab');
              }
            }}
            activeOpacity={0.7}
          >
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Payment Details
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.moreOptionsBtn}
            onPress={() => showToast('Payment audit logs exported')}
            activeOpacity={0.7}
          >
            <AppIcon name="more_vert" size={20} />
          </TouchableOpacity>
          <AdminHeaderAvatar size={34} />
        </View>
      </View>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.toastPill,
            {
              top: Math.max(insets.top, 12) + 56,
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <AppIcon name="check_circle" size={20} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* Main Content ScrollView */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Hero Transaction Status Banner */}
        <View style={styles.heroBannerCard}>
          {/* Subtle Ambient Backdrop Blurs */}
          <View style={styles.heroGlowTopRight} />
          <View style={styles.heroGlowBottomLeft} />

          {/* Verified Circular Badge */}
          <View
            style={[
              styles.verifiedOuterCircle,
              isFailed && styles.verifiedOuterCircleError,
              isPending && styles.verifiedOuterCircleAmber,
              isRefunded && styles.verifiedOuterCirclePurple,
            ]}
          >
            <View
              style={[
                styles.verifiedInnerCircle,
                isFailed && styles.verifiedInnerCircleError,
                isPending && styles.verifiedInnerCircleAmber,
                isRefunded && styles.verifiedInnerCirclePurple,
              ]}
            >
              <AppIcon name={isFailed ? 'close' : isPending ? 'lock_clock' : isRefunded ? 'replay' : 'check'} size={20} />
            </View>
          </View>

          {/* Status Title Pill */}
          <View
            style={[
              styles.statusTitlePill,
              isFailed && styles.statusTitlePillError,
              isPending && styles.statusTitlePillAmber,
              isRefunded && styles.statusTitlePillPurple,
            ]}
          >
            <Animated.View
              style={[
                styles.statusPillDot,
                isFailed && styles.statusPillDotError,
                isPending && styles.statusPillDotAmber,
                isRefunded && styles.statusPillDotPurple,
                { opacity: pulseAnim },
              ]}
            />
            <Text
              style={[
                styles.statusTitleText,
                isFailed && styles.textError,
                isPending && styles.textAmberDark,
                isRefunded && styles.textPurpleDark,
              ]}
            >
              {statusLabel}
            </Text>
          </View>

          {/* Prominent Amount */}
          <View style={styles.amountDisplayRow}>
            <Text style={styles.amountHeroText}>{amountFormatted}</Text>
            <Text style={styles.amountDecimalsText}>.00</Text>
          </View>

          {/* Transaction Code Badge with Tap to Copy */}
          <TouchableOpacity
            style={styles.txnCodeBadge}
            onPress={() => handleCopy(code, 'Transaction ID')}
            activeOpacity={0.7}
          >
            <Text style={styles.txnCodeText}>{code}</Text>
            <AppIcon name="content_copy" size={20} />
          </TouchableOpacity>

          {/* Gateway Reference & Escrow Info */}
          <View style={styles.escrowInfoRow}>
            <AppIcon name="verified_user" size={20} />
            <Text style={styles.escrowUtrText}>{utr}</Text>
            <Text style={styles.escrowDivider}>•</Text>
            <Text style={styles.escrowStatusText}>{escrowStatus}</Text>
          </View>
        </View>

        {/* 3. Operational Context Card: Technician & Asset Snippet */}
        <View style={styles.operationalCard}>
          <View style={styles.operationalCardHead}>
            <View style={styles.operationalHeadLeft}>
              <AppIcon name="engineering" size={20} />
              <Text style={styles.operationalHeadTitle}>
                ERGONOMIC SERVICE DISPATCH
              </Text>
            </View>
            <View style={styles.activeFileBadge}>
              <Text style={styles.activeFileText}>Active File</Text>
            </View>
          </View>

          {/* Chair Visual & Service Details */}
          <View style={styles.serviceAssetSnippet}>
            <Image
              style={styles.chairThumbnail}
              source={{
                uri: 'https://images.unsplash.com/photo-1580481077197-8c381f9a0c02?q=80&w=400&auto=format&fit=crop',
              }}
            />
            <View style={styles.serviceAssetDetailsCol}>
              <Text style={styles.serviceAssetName} numberOfLines={1}>
                {serviceTitle}
              </Text>
              <Text style={styles.serviceAssetType} numberOfLines={1}>
                {serviceSub}
              </Text>
              <View style={styles.serviceAssetTicketRow}>
                <Text style={styles.serviceTicketCode}>{ticketCode}</Text>
                <Text style={styles.serviceDeskPod}>• Desk Pod 4B</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.ticketOpenBtn}
              onPress={() => handleCopy(ticketCode, 'Service Request ID')}
              activeOpacity={0.7}
            >
              <AppIcon name="open_in_new" size={20} />
            </TouchableOpacity>
          </View>

          {/* Tech & Customer Dual Columns */}
          <View style={styles.techCustomerGrid}>
            {/* Customer Block */}
            <View style={styles.dualInfoBlock}>
              <View>
                <Text style={styles.dualInfoLabel}>CUSTOMER</Text>
                <Text style={styles.dualInfoName} numberOfLines={1}>
                  {customerName}
                </Text>
                <Text style={styles.dualInfoCode}>{customerCode}</Text>
              </View>
              <TouchableOpacity
                style={styles.contactLinkRow}
                onPress={() => showToast(`Calling customer ${customerName}...`)}
                activeOpacity={0.7}
              >
                <AppIcon name="call" size={20} />
                <Text style={styles.contactText}>Contact</Text>
              </TouchableOpacity>
            </View>

            {/* Technician Block */}
            <View style={styles.dualInfoBlock}>
              <View>
                <Text style={styles.dualInfoLabel}>TECHNICIAN</Text>
                <Text style={styles.dualInfoName} numberOfLines={1}>
                  {technicianName}
                </Text>
                <Text style={styles.dualInfoCode}>{technicianRole}</Text>
              </View>
              <View style={styles.calibratedRow}>
                <AppIcon name="verified" size={20} />
                <Text style={styles.calibratedText}>Calibrated</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4. Payment Metadata & Method Card (Channel & Timeline) */}
        <View style={styles.metadataCard}>
          <View style={styles.metadataCardHead}>
            <Text style={styles.metadataHeadTitle}>CHANNEL &amp; TIMELINE</Text>
            <View style={styles.instantPill}>
              <AppIcon name="bolt" size={20} />
              <Text style={styles.instantText}>Instant UPI</Text>
            </View>
          </View>

          <View style={styles.methodDetailsRow}>
            <View style={styles.methodLeftInfo}>
              <View style={styles.methodIconBox}>
                <AppIcon name="account_balance_wallet" size={20} />
              </View>
              <View style={styles.methodTextCol}>
                <Text style={styles.methodTitle}>{paymentMethodTitle}</Text>
                <Text style={styles.methodVpa}>{paymentVpa}</Text>
              </View>
            </View>
            <View style={styles.autopayBadge}>
              <Text style={styles.autopayText}>Autopay Clear</Text>
            </View>
          </View>

          <View style={styles.timestampBox}>
            <View style={styles.timestampLeft}>
              <AppIcon name="schedule" size={20} />
              <Text style={styles.timestampLabel}>Timestamp</Text>
            </View>
            <Text style={styles.timestampValue}>{timestamp}</Text>
          </View>
        </View>

        {/* 5. Financial Itemized Breakdown (Itemized Ledger) */}
        <View style={styles.ledgerCard}>
          <View style={styles.ledgerCardHead}>
            <Text style={styles.ledgerHeadTitle}>ITEMIZED LEDGER</Text>
            <Text style={styles.ledgerCurrencyText}>Currency: INR (₹)</Text>
          </View>

          <View style={styles.ledgerRowsContainer}>
            {/* Line 1 */}
            <View style={styles.ledgerLineItem}>
              <View style={styles.ledgerLineCol}>
                <Text style={styles.ledgerLineTitle}>
                  Office Chair Repair Service Charge
                </Text>
                <Text style={styles.ledgerLineSub}>
                  Standard ergonomic diagnostics &amp; labor
                </Text>
              </View>
              <Text style={styles.ledgerLineAmount}>₹1,500.00</Text>
            </View>

            {/* Line 2 */}
            <View style={styles.ledgerLineItem}>
              <View style={styles.ledgerLineCol}>
                <Text style={styles.ledgerLineTitle}>
                  OEM Hydraulic Bushing Kit
                </Text>
                <Text style={styles.ledgerLineSub}>
                  Class-4 gas cylinder rebuild seal
                </Text>
              </View>
              <Text style={styles.ledgerLineAmount}>₹250.00</Text>
            </View>

            {/* Line 3 */}
            <View style={styles.ledgerLineItem}>
              <View style={styles.ledgerLineCol}>
                <Text style={styles.ledgerLineTitle}>
                  On-site Dynamic Tension Tuning
                </Text>
                <Text style={styles.ledgerLineSub}>
                  Tilt mechanism recalibration
                </Text>
              </View>
              <Text style={styles.ledgerLineAmount}>₹100.00</Text>
            </View>

            {/* Gross Subtotal Pill */}
            <View style={styles.grossSubtotalRow}>
              <Text style={styles.grossSubtotalLabel}>
                Gross Invoiced Subtotal
              </Text>
              <Text style={styles.grossSubtotalValue}>₹1,850.00</Text>
            </View>

            {/* Commission Deduction */}
            <View style={styles.platformFeeRow}>
              <View style={styles.feeLeft}>
                <AppIcon name="pie_chart" size={20} />
                <Text style={styles.feeLabel}>ChairCare Platform Fee (10%)</Text>
              </View>
              <Text style={styles.feeValue}>-₹185.00</Text>
            </View>

            {/* Technician Payout */}
            <View style={styles.disbursedRow}>
              <View style={styles.disbursedLeft}>
                <AppIcon name="move_to_inbox" size={20} />
                <Text style={styles.disbursedLabel}>
                  Net Disbursed to Technician
                </Text>
              </View>
              <Text style={styles.disbursedValue}>₹1,665.00</Text>
            </View>

            {/* Total Customer Paid Final Highlight Card */}
            <View style={styles.finalPaidCard}>
              <View style={styles.finalPaidLeft}>
                <Text style={styles.finalPaidLabel}>TOTAL CUSTOMER PAID</Text>
                <Text style={styles.finalPaidSub}>
                  Fully cleared via Payment Gateway
                </Text>
              </View>
              <View style={styles.finalPaidRight}>
                <Text style={styles.finalPaidAmount}>₹1,850.00</Text>
                <Text style={styles.finalTaxLabel}>TAX INCL.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 6. Expandable Audit Trail & Compliance */}
        <View style={styles.auditCard}>
          <TouchableOpacity
            style={styles.auditHeaderBtn}
            onPress={() => setShowAuditDetails(!showAuditDetails)}
            activeOpacity={0.7}
          >
            <View style={styles.auditHeadLeft}>
              <AppIcon name="fingerprint" size={20} />
              <Text style={styles.auditHeadTitle}>
                AUDIT TRAIL &amp; COMPLIANCE
              </Text>
            </View>
            <Text
              style={[
                styles.auditChevron,
                showAuditDetails && styles.auditChevronOpen,
              ]}
            >
              expand_more
            </Text>
          </TouchableOpacity>

          {showAuditDetails && (
            <View style={styles.auditBodyContainer}>
              {/* Gateway Line */}
              <View style={styles.auditRowItem}>
                <View style={styles.auditRowLeft}>
                  <AppIcon name="dns" size={20} />
                  <Text style={styles.auditRowLabel}>Gateway Protocol</Text>
                </View>
                <Text style={styles.auditRowValue}>
                  Razorpay Smart Route v4.2
                </Text>
              </View>

              {/* Geofence Line */}
              <View style={styles.auditRowItem}>
                <View style={styles.auditRowLeft}>
                  <AppIcon name="near_me" size={20} />
                  <Text style={styles.auditRowLabel}>Geofence Proximity</Text>
                </View>
                <View style={styles.auditGeofenceCol}>
                  <Text style={styles.auditRowValue}>
                    {customerLocation}
                  </Text>
                  <Text style={styles.auditVerifiedSub}>
                    Verified (0.02km variance)
                  </Text>
                </View>
              </View>

              {/* OTP Confirmation */}
              <View style={styles.auditRowItem}>
                <View style={styles.auditRowLeft}>
                  <AppIcon name="password" size={20} />
                  <Text style={styles.auditRowLabel}>
                    Customer OTP Sign-off
                  </Text>
                </View>
                <Text style={styles.auditOtpValue}>Verified (#OTP-9482)</Text>
              </View>

              {/* Payment Terminal */}
              <View style={styles.auditRowItem}>
                <View style={styles.auditRowLeft}>
                  <AppIcon name="hub" size={20} />
                  <Text style={styles.auditRowLabel}>Payment Terminal</Text>
                </View>
                <Text style={styles.auditRowValue}>POS-MUM-DLF-084</Text>
              </View>
            </View>
          )}
        </View>

        {/* 7. Action Sheet / Operational Buttons */}
        <View style={styles.actionButtonsContainer}>
          {/* Download Invoice Button */}
          <TouchableOpacity
            style={styles.downloadInvoiceBtn}
            onPress={handleDownloadInvoice}
            activeOpacity={0.88}
          >
            <AppIcon name="download" size={20} />
            <Text style={styles.downloadInvoiceText}>
              Download Tax Invoice (PDF)
            </Text>
          </TouchableOpacity>

          {/* Initiate Refund Button */}
          <TouchableOpacity
            style={styles.initiateRefundBtn}
            onPress={handleOpenRefundModal}
            activeOpacity={0.85}
          >
            <AppIcon name="history" size={20} />
            <Text style={styles.initiateRefundText}>
              Initiate Refund Process
            </Text>
          </TouchableOpacity>

          {/* Contact Gateway Escrow Tertiary Link */}
          <TouchableOpacity
            style={styles.gatewaySupportLink}
            onPress={() =>
              showToast('Routing ticket to Razorpay Gateway Concierge...')
            }
            activeOpacity={0.7}
          >
            <AppIcon name="headset_mic" size={20} />
            <Text style={styles.gatewaySupportText}>
              Contact Gateway Support Escrow
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 8. Refund Confirmation Modal */}
      <Modal
        visible={refundModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRefundModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardBox}>
            <View style={styles.modalWarningIconContainer}>
              <AppIcon name="warning" size={20} />
            </View>

            <View style={styles.modalTextCol}>
              <Text style={styles.modalTitle}>Initiate Full Refund?</Text>
              <Text style={styles.modalDescription}>
                This will debit {amountFormatted}.00 from Escrow and reverse the
                ₹165.00 technician commission for {code}.
              </Text>
            </View>

            <View style={styles.modalDestinationBox}>
              <Text style={styles.modalDestinationLabel}>
                Refund Destination:
              </Text>
              <Text style={styles.modalDestinationValue}>
                {paymentVpa} (UPI)
              </Text>
            </View>

            <View style={styles.modalActionsCol}>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmRefund}
                activeOpacity={0.88}
              >
                <Text style={styles.modalConfirmBtnText}>
                  Confirm Instant Reversal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRefundModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  /* Toast Pill */
  toastPill: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d3133',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    gap: 8,
    zIndex: 999,
    ...Shadows.level2,
  },
  toastIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#6ffbbe',
    includeFontPadding: false,
  },
  toastText: {
    fontFamily: Typography.bodySm.fontFamily,
    fontSize: 13,
    color: '#eff1f3',
    fontWeight: '500',
  },

  scrollContainer: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },

  /* 2. Hero Transaction Status Banner */
  heroBannerCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 18,
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  heroGlowTopRight: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(111, 251, 190, 0.18)',
  },
  heroGlowBottomLeft: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(219, 225, 255, 0.25)',
  },
  verifiedOuterCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(111, 251, 190, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  verifiedOuterCircleError: {
    backgroundColor: 'rgba(255, 218, 214, 0.6)',
  },
  verifiedOuterCircleAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  verifiedOuterCirclePurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  verifiedInnerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6ffbbe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedInnerCircleError: {
    backgroundColor: '#ffdad6',
  },
  verifiedInnerCircleAmber: {
    backgroundColor: '#fde68a',
  },
  verifiedInnerCirclePurple: {
    backgroundColor: '#e9d5ff',
  },
  verifiedCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 28,
    color: '#002113',
    includeFontPadding: false,
  },

  statusTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: '#eceef0',
    gap: 6,
    marginBottom: 4,
  },
  statusTitlePillError: {
    backgroundColor: '#ffdad6',
  },
  statusTitlePillAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusTitlePillPurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  statusPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#009668',
  },
  statusPillDotError: {
    backgroundColor: '#ba1a1a',
  },
  statusPillDotAmber: {
    backgroundColor: '#d97706',
  },
  statusPillDotPurple: {
    backgroundColor: '#9333ea',
  },
  statusTitleText: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#009668',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: 4,
  },
  amountHeroText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.8,
  },
  amountDecimalsText: {
    ...Typography.titleLg,
    fontSize: 18,
    color: '#45464d',
    fontWeight: '500',
  },

  txnCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginBottom: 8,
  },
  txnCodeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#45464d',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  copyIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#0051d5',
    includeFontPadding: false,
  },

  escrowInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  escrowShieldIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#009668',
    includeFontPadding: false,
  },
  escrowUtrText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  escrowDivider: {
    color: '#c6c6cd',
  },
  escrowStatusText: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },

  /* 3. Operational Context Card */
  operationalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  operationalCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  operationalHeadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engineeringIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#0051d5',
    includeFontPadding: false,
  },
  operationalHeadTitle: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#45464d',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  activeFileBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#dbe1ff',
  },
  activeFileText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#00174b',
    fontWeight: '700',
  },

  serviceAssetSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f4f6',
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 12,
  },
  chairThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#e6e8ea',
  },
  serviceAssetDetailsCol: {
    flex: 1,
    gap: 1,
  },
  serviceAssetName: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '600',
    color: '#191c1e',
  },
  serviceAssetType: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: '#45464d',
  },
  serviceAssetTicketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  serviceTicketCode: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#0051d5',
    fontWeight: '600',
  },
  serviceDeskPod: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#45464d',
  },
  ticketOpenBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketOpenIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#45464d',
    includeFontPadding: false,
  },

  techCustomerGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  dualInfoBlock: {
    flex: 1,
    backgroundColor: '#f2f4f6',
    borderRadius: BorderRadius.lg,
    padding: 12,
    justifyContent: 'space-between',
    minHeight: 96,
  },
  dualInfoLabel: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#76777d',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dualInfoName: {
    ...Typography.bodyMd,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#191c1e',
    marginTop: 2,
  },
  dualInfoCode: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#45464d',
    marginTop: 1,
  },
  contactLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  contactIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#0051d5',
    includeFontPadding: false,
  },
  contactText: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#0051d5',
  },
  calibratedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  calibratedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#009668',
    includeFontPadding: false,
  },
  calibratedText: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#009668',
  },

  /* 4. Payment Metadata & Method Card */
  metadataCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  metadataCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metadataHeadTitle: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#45464d',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  instantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  boltIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#0051d5',
    includeFontPadding: false,
  },
  instantText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#191c1e',
    fontWeight: '600',
  },
  methodDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  methodIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0e3e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#191c1e',
    includeFontPadding: false,
  },
  methodTextCol: {
    gap: 1,
  },
  methodTitle: {
    ...Typography.bodyMd,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#191c1e',
  },
  methodVpa: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#45464d',
  },
  autopayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(111, 251, 190, 0.2)',
  },
  autopayText: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: '#009668',
  },
  timestampBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timestampLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#45464d',
    includeFontPadding: false,
  },
  timestampLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#45464d',
  },
  timestampValue: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11.5,
    color: '#191c1e',
    fontWeight: '500',
  },

  /* 5. Itemized Ledger */
  ledgerCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 16,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  ledgerCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ledgerHeadTitle: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#45464d',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  ledgerCurrencyText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#76777d',
  },
  ledgerRowsContainer: {
    gap: 10,
  },
  ledgerLineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  ledgerLineCol: {
    flex: 1,
    paddingRight: 12,
    gap: 1,
  },
  ledgerLineTitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '500',
    color: '#191c1e',
  },
  ledgerLineSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#76777d',
  },
  ledgerLineAmount: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 13,
    color: '#191c1e',
    fontWeight: '600',
  },
  grossSubtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 2,
  },
  grossSubtotalLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '500',
    color: '#191c1e',
  },
  grossSubtotalValue: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 13,
    fontWeight: '700',
    color: '#191c1e',
  },
  platformFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  feeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pieChartIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  feeLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#ba1a1a',
  },
  feeValue: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#ba1a1a',
    fontWeight: '600',
  },
  disbursedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingBottom: 4,
  },
  disbursedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inboxIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#009668',
    includeFontPadding: false,
  },
  disbursedLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#009668',
  },
  disbursedValue: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#009668',
    fontWeight: '700',
  },
  finalPaidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131b2e',
    borderRadius: BorderRadius.lg,
    padding: 14,
    marginTop: 4,
  },
  finalPaidLeft: {
    gap: 2,
  },
  finalPaidLabel: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#dbe1ff',
    letterSpacing: 0.6,
  },
  finalPaidSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#bec6e0',
  },
  finalPaidRight: {
    alignItems: 'flex-end',
  },
  finalPaidAmount: {
    ...Typography.titleLg,
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  finalTaxLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#6ffbbe',
    fontWeight: '600',
  },

  /* 6. Audit Card */
  auditCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 16,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  auditHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  auditHeadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fingerprintIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#45464d',
    includeFontPadding: false,
  },
  auditHeadTitle: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  auditChevron: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#45464d',
    includeFontPadding: false,
  },
  auditChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  auditBodyContainer: {
    paddingTop: 12,
    gap: 8,
  },
  auditRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  auditRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dnsIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#0051d5',
    includeFontPadding: false,
  },
  nearMeIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#009668',
    includeFontPadding: false,
  },
  passwordIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#45464d',
    includeFontPadding: false,
  },
  hubIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#45464d',
    includeFontPadding: false,
  },
  auditRowLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#191c1e',
    fontWeight: '500',
  },
  auditRowValue: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11.5,
    color: '#45464d',
  },
  auditGeofenceCol: {
    alignItems: 'flex-end',
  },
  auditVerifiedSub: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#009668',
  },
  auditOtpValue: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11.5,
    color: '#191c1e',
    fontWeight: '600',
  },

  /* 7. Action Buttons */
  actionButtonsContainer: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  downloadInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0051d5',
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    gap: 8,
    ...Shadows.level1,
  },
  downloadIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ffffff',
    includeFontPadding: false,
  },
  downloadInvoiceText: {
    fontFamily: Typography.titleLg.fontFamily,
    fontSize: 15.5,
    fontWeight: '600',
    color: '#ffffff',
  },
  initiateRefundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffdad6',
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    gap: 8,
  },
  refundIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  initiateRefundText: {
    fontFamily: Typography.titleLg.fontFamily,
    fontSize: 15.5,
    fontWeight: '600',
    color: '#ba1a1a',
  },
  gatewaySupportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  headsetMicIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#45464d',
    includeFontPadding: false,
  },
  gatewaySupportText: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 12,
    color: '#45464d',
    fontWeight: '500',
  },

  /* 8. Refund Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCardBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    ...Shadows.level3,
  },
  modalWarningIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ffdad6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalWarningIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 26,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  modalTextCol: {
    gap: 4,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#191c1e',
  },
  modalDescription: {
    ...Typography.bodySm,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#45464d',
  },
  modalDestinationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalDestinationLabel: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: '#76777d',
  },
  modalDestinationValue: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#191c1e',
    fontWeight: '600',
  },
  modalActionsCol: {
    gap: 8,
    marginTop: 4,
  },
  modalConfirmBtn: {
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#ba1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    fontFamily: Typography.titleLg.fontFamily,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalCancelBtn: {
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontFamily: Typography.titleLg.fontFamily,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#191c1e',
  },

  /* Color utilities */
  textError: {
    color: '#ba1a1a',
  },
  textAmber: {
    color: '#d97706',
  },
  textAmberDark: {
    color: '#92400e',
  },
  textPurple: {
    color: '#9333ea',
  },
  textPurpleDark: {
    color: '#7e22ce',
  },
});
