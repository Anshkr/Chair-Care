import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useTechnician } from '../../context/TechnicianContext';
import { ThemeSwitchButton } from '../../components/common/ThemeSwitchButton';
import { TechnicianHeaderAvatar } from '../../components/common/TechnicianHeaderAvatar';

interface EarningDetailsProps {
  navigation?: any;
  route?: {
    params?: {
      earningId?: string;
      earningItem?: any;
      request?: any;
    };
  };
}

export const EarningDetailsChaircareMobileScreen: React.FC<EarningDetailsProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { acceptedRequest } = useTechnician();
  const [copiedTxn, setCopiedTxn] = useState<boolean>(false);

  // Incoming data priority: explicit earningItem > passed request > technician context > default fallback
  const passedItem = route?.params?.earningItem;
  const passedRequest = route?.params?.request || acceptedRequest;

  const earning = React.useMemo(() => {
    if (passedItem) {
      const amount = Number(passedItem.amount) || 599;
      const baseFee = amount;
      const oemParts = 0;
      const idStr = String(passedItem.id || '101');
      return {
        id: idStr,
        ticketNumber: passedItem.ticketNumber || `REQ-${idStr.slice(0, 6)}`,
        serviceTitle: passedItem.serviceTitle || 'Office Chair Repair',
        customerName: passedItem.customerName || 'Verified Client',
        chairModel: passedItem.chairModel || 'Ergonomic Task Chair',
        serviceSub: passedItem.notes || 'Service & Component Inspection',
        address: passedItem.address || 'Service Location',
        durationText: passedItem.durationText || 'Standard Dispatch',
        baseRate: baseFee,
        partsCost: oemParts,
        additionalLabor: 0,
        totalAmount: amount,
        settledTime: passedItem.completedAt || 'Recently Settled',
        utrNumber: passedItem.utrNumber || `UTR-${idStr}`,
        bankInfo: passedItem.bankInfo || 'Registered Payout Account',
        txnId: `TXN-${idStr}`,
        invoiceRef: `INV-${idStr}`,
        warranty: '90-Day Standard Warranty',
      };
    }

    if (passedRequest) {
      const totalAmount = Number(passedRequest.totalAmount) || Number((passedRequest as any).total) || passedRequest.baseRate || 599;
      const partsCost = passedRequest.additionalWork?.totalCost || passedRequest.additionalPartsCost || 0;
      const baseFee = Math.max(0, totalAmount - partsCost);
      const idStr = String(passedRequest.id || 'REQ');
      return {
        id: idStr,
        ticketNumber: passedRequest.ticketNumber || `REQ-${idStr.slice(0, 6)}`,
        serviceTitle: passedRequest.serviceTitle || 'Office Chair Repair',
        customerName: passedRequest.customerName || 'Verified Client',
        chairModel: passedRequest.chairModel || 'Ergonomic Task Chair',
        serviceSub: passedRequest.notes || 'Service & Component Inspection',
        address: passedRequest.address || 'Service Location',
        durationText: passedRequest.durationText || 'Standard Dispatch',
        baseRate: baseFee,
        partsCost: partsCost,
        additionalLabor: 0,
        totalAmount: totalAmount,
        settledTime: passedRequest.completedAt || 'Completed',
        utrNumber: `UTR-${idStr.slice(0, 8)}`,
        bankInfo: 'Registered Payout Account',
        txnId: `TXN-${idStr.slice(0, 8)}`,
        invoiceRef: `INV-${idStr.slice(0, 8)}`,
        warranty: '90-Day Standard Warranty',
      };
    }

    // Default empty record state
    return {
      id: 'earn-default',
      ticketNumber: 'REQ-DISPATCH',
      serviceTitle: 'Chair Service Session',
      customerName: 'Client',
      chairModel: 'Office Chair',
      serviceSub: 'Standard Inspection',
      address: 'Service Location',
      durationText: 'Completed Service',
      baseRate: 0,
      partsCost: 0,
      additionalLabor: 0,
      totalAmount: 0,
      settledTime: 'Pending',
      utrNumber: 'N/A',
      bankInfo: 'Registered Bank Account',
      txnId: 'TXN-PENDING',
      invoiceRef: 'INV-PENDING',
      warranty: 'Standard Warranty',
    };
  }, [passedItem, passedRequest]);

  const handleCopyTxn = () => {
    setCopiedTxn(true);
    setTimeout(() => {
      setCopiedTxn(false);
    }, 2000);
  };

  const handleDownloadInvoice = () => {
    Alert.alert(
      'Tax Invoice Generated',
      `Digital PDF invoice ${earning.invoiceRef} downloaded to your local device.`,
      [{ text: 'OK' }]
    );
  };

  const handleReportIssue = () => {
    Alert.alert(
      'Report Dispute / Query',
      'If you notice any mismatch in your payout split or parts allowance, the audit desk will review it within 4 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit Ticket', onPress: () => Alert.alert('Ticket Logged', 'Ref: #DISPUTE-8492') },
      ]
    );
  };

  return (
    <View style={styles.screenContainer}>
      {/* Top Header */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation?.canGoBack() ? navigation.goBack() : navigation?.navigate('TechnicianMain', { screen: 'EarningsTab' }))}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Earning Details</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ThemeSwitchButton variant="header" />
          <TechnicianHeaderAvatar
            size={38}
            onPress={() => navigation?.navigate?.('TechProfileTab')}
          />
        </View>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Payout Status Hero Card */}
        <View style={styles.payoutStatusCard}>
          <View style={styles.payoutStatusTopRow}>
            <View style={styles.settledPill}>
              <View style={styles.pulseGreenDot} />
              <Text style={styles.settledPillText}>Payment Received & Settled</Text>
            </View>
            <View style={styles.immediateBadge}>
              <Text style={styles.immediateBadgeText}>IMMEDIATE</Text>
            </View>
          </View>

          <View style={styles.netCreditedBlock}>
            <Text style={styles.netCreditedLabel}>NET CREDITED PAYOUT</Text>
            <View style={styles.heroAmountRow}>
              <Text style={styles.heroAmountText}>
                ₹{earning.totalAmount.toFixed(2)}
              </Text>
              <View style={styles.instantSettlePill}>
                <Text style={styles.instantSettleText}>INSTANT SETTLE</Text>
              </View>
            </View>
          </View>

          {/* Shaded Sub-footer */}
          <View style={styles.payoutSubFooter}>
            <View style={styles.settledInfoRow}>
              <AppIcon name="Check" size={18} />
              <Text style={styles.settledTimeText}>
                Settled {earning.settledTime} via UPI Direct Deposit
              </Text>
            </View>
            <View style={styles.utrBankRow}>
              <View style={styles.utrGroup}>
                <AppIcon name="Landmark" size={18} />
                <Text style={styles.utrText}>{earning.utrNumber}</Text>
              </View>
              <Text style={styles.bankAccountText}>{earning.bankInfo}</Text>
            </View>
          </View>
        </View>

        {/* Job Summary Card */}
        <View style={styles.jobSummaryCard}>
          <View style={styles.jobSummaryTopRow}>
            <View style={styles.jobBadgeGroup}>
              <View style={styles.reqBadge}>
                <Text style={styles.reqBadgeText}>#{earning.ticketNumber}</Text>
              </View>
              <View style={styles.servicePill}>
                <Text style={styles.servicePillText}>{earning.serviceTitle}</Text>
              </View>
            </View>
            <View style={styles.durationGroup}>
              <AppIcon name="Clock" size={18} />
              <Text style={styles.durationText}>{earning.durationText}</Text>
            </View>
          </View>

          <View style={styles.customerAssetRow}>
            <View style={styles.chairIconBox}>
              <AppIcon name="Armchair" size={18} />
            </View>
            <View style={styles.customerAssetCol}>
              <View style={styles.customerNameRow}>
                <Text style={styles.customerNameText}>{earning.customerName}</Text>
                <AppIcon name="Check" size={18} />
              </View>
              <Text style={styles.chairModelText}>{earning.chairModel}</Text>
              <Text style={styles.serviceSubText}>{earning.serviceSub}</Text>
            </View>
          </View>

          {/* Address row */}
          <View style={styles.addressBox}>
            <AppIcon name="MapPin" size={18} />
            <Text style={styles.addressText}>{earning.address}</Text>
          </View>
        </View>

        {/* Customer Payment Breakdown Card */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <AppIcon name="Receipt" size={18} color={Colors.onSurfaceVariant} />
              <Text style={styles.cardTitle}>Customer Bill Breakdown</Text>
            </View>
            <Text style={styles.bifmaTag}>BIFMA STANDARD</Text>
          </View>

          <View style={styles.breakdownRowsCol}>
            <View style={styles.breakdownLine}>
              <Text style={styles.breakdownLabel}>Base Diagnostic & Calibration Fee</Text>
              <Text style={styles.breakdownValue}>₹{earning.baseRate.toFixed(2)}</Text>
            </View>

            <View style={styles.breakdownLine}>
              <Text style={styles.breakdownLabel}>OEM Parts (Class-4 Nitrogen Gas Cylinder)</Text>
              <Text style={styles.breakdownValue}>₹{earning.partsCost.toFixed(2)}</Text>
            </View>

            <View style={styles.breakdownLine}>
              <Text style={styles.breakdownLabel}>Additional Approved Work / Labor</Text>
              <Text style={styles.breakdownValue}>₹{earning.additionalLabor.toFixed(2)}</Text>
            </View>

            <View style={styles.breakdownLine}>
              <Text style={styles.breakdownLabel}>Taxes & Cess (Integrated GST 18%)</Text>
              <Text style={styles.includedTaxText}>Included</Text>
            </View>
          </View>

          {/* Total Row */}
          <View style={styles.totalPaidFooter}>
            <Text style={styles.totalPaidLabel}>Total Paid by Client</Text>
            <Text style={styles.totalPaidAmount}>₹{earning.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Technician Share Split Card */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <AppIcon name="Wallet" size={18} />
              <Text style={styles.cardTitle}>Technician Share Split</Text>
            </View>
            <View style={styles.retainedBadge}>
              <Text style={styles.retainedBadgeText}>100% Retained</Text>
            </View>
          </View>

          <View style={styles.splitRowsCol}>
            <View style={styles.splitLine}>
              <Text style={styles.splitGrossLabel}>Gross Booking Value</Text>
              <Text style={styles.splitGrossValue}>₹{earning.totalAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.splitSubLine}>
              <View style={styles.subBulletRow}>
                <View style={styles.blueDot} />
                <Text style={styles.splitSubLabel}>Diagnostic Payout (100%)</Text>
              </View>
              <Text style={styles.splitSubValue}>₹{earning.baseRate.toFixed(2)}</Text>
            </View>

            <View style={styles.splitSubLine}>
              <View style={styles.subBulletRow}>
                <View style={styles.blueDot} />
                <Text style={styles.splitSubLabel}>OEM Replacement Allowance</Text>
              </View>
              <Text style={styles.splitSubValue}>₹{earning.partsCost.toFixed(2)}</Text>
            </View>

            <View style={styles.splitSubLine}>
              <View style={styles.subBulletRow}>
                <View style={styles.greenDot} />
                <Text style={styles.splitSubLabel}>Fleet Fee (Promotional Launch Rate)</Text>
              </View>
              <View style={styles.waivedFeeGroup}>
                <Text style={styles.waivedOldFee}>-₹75.00</Text>
                <Text style={styles.waivedNewFee}>₹0.00</Text>
              </View>
            </View>
          </View>

          {/* Net Take-Home Highlight Banner */}
          <View style={styles.takeHomeBanner}>
            <View style={styles.takeHomeTextCol}>
              <Text style={styles.takeHomeTitle}>NET TAKE-HOME EARNINGS</Text>
              <Text style={styles.takeHomeSub}>Deposited instantly with zero deductions</Text>
            </View>
            <Text style={styles.takeHomeAmount}>₹{earning.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Audit & Dispatch Trace Card */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Audit & Dispatch Trace</Text>
            <AppIcon name="ShieldCheck" size={18} />
          </View>

          <View style={styles.auditRowsCol}>
            <View style={styles.auditLine}>
              <Text style={styles.auditLabel}>Transaction ID</Text>
              <View style={styles.copyableTxnGroup}>
                <Text style={styles.txnIdText}>{earning.txnId}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyTxn}
                  activeOpacity={0.7}
                >
                  <AppIcon name={copiedTxn ? 'Check' : 'ClipboardList'} size={14} color={Colors.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.auditLine}>
              <Text style={styles.auditLabel}>Invoice Reference</Text>
              <Text style={styles.auditValueMono}>{earning.invoiceRef}</Text>
            </View>

            <View style={styles.auditLine}>
              <Text style={styles.auditLabel}>Digital Sign-off</Text>
              <View style={styles.otpSignoffGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><AppIcon name="CheckCircle" size={14} color="#059669" /><Text style={styles.otpSignoffText}>Verified via Customer OTP</Text></View>
              </View>
            </View>

            <View style={styles.auditLine}>
              <Text style={styles.auditLabel}>Ergonomic Warranty</Text>
              <View style={styles.warrantyPill}>
                <Text style={styles.warrantyPillText}>{earning.warranty}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryDownloadBtn}
            onPress={handleDownloadInvoice}
            activeOpacity={0.88}
          >
            <AppIcon name="Download" size={18} />
            <Text style={styles.primaryDownloadBtnText}>
              View Receipt / Tax Invoice PDF
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryDisputeBtn}
            onPress={handleReportIssue}
            activeOpacity={0.7}
          >
            <AppIcon name="Flag" size={16} color="#DC2626" />
            <Text style={styles.secondaryDisputeBtnText}>
              Dispute or Report Issue
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
  headerTitle: {
    ...Typography.headlineSm,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 14,
    color: Colors.onPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    gap: 14,
  },
  payoutStatusCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.level1,
  },
  payoutStatusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 12,
  },
  settledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 135, 90, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  pulseGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00875a',
  },
  settledPillText: {
    ...Typography.labelMd,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#00875a',
  },
  immediateBadge: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  immediateBadgeText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '600',
    color: Colors.outline,
  },
  netCreditedBlock: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  netCreditedLabel: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  heroAmountText: {
    ...Typography.displayHeroMobile,
    fontSize: 32,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.8,
  },
  instantSettlePill: {
    backgroundColor: 'rgba(0, 135, 90, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  instantSettleText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#00875a',
  },
  payoutSubFooter: {
    backgroundColor: 'rgba(242, 244, 246, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.04)',
  },
  settledInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkIcon: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.secondaryCobalt,
  },
  settledTimeText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurface,
    fontWeight: '500',
  },
  utrBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  utrGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bankIcon: {
    fontSize: 12,
  },
  utrText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  bankAccountText: {
    ...Typography.labelMd,
    fontSize: 11.5,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  jobSummaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  jobSummaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reqBadge: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  reqBadgeText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  servicePill: {
    backgroundColor: 'rgba(219, 225, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  servicePillText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
  durationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerIcon: {
    fontSize: 12,
  },
  durationText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#00875a',
  },
  customerAssetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chairIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chairIcon: {
    fontSize: 20,
  },
  customerAssetCol: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  customerNameText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  verifiedCheck: {
    fontSize: 12,
    color: Colors.secondaryCobalt,
    fontWeight: '900',
  },
  chairModelText: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
    marginTop: 1,
  },
  serviceSubText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.outline,
    marginTop: 1,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 10,
    borderRadius: BorderRadius.md,
  },
  pinIcon: {
    fontSize: 13,
    marginTop: 1,
  },
  addressText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 16,
  },
  cardContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.level1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptIcon: {
    fontSize: 16,
  },
  savingsIcon: {
    fontSize: 16,
  },
  shieldIcon: {
    fontSize: 16,
  },
  cardTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  bifmaTag: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '600',
    color: Colors.outline,
    letterSpacing: 0.6,
  },
  breakdownRowsCol: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  breakdownLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  breakdownValue: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  includedTaxText: {
    ...Typography.labelMd,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#00875a',
  },
  totalPaidFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.04)',
  },
  totalPaidLabel: {
    ...Typography.titleLg,
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  totalPaidAmount: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  retainedBadge: {
    backgroundColor: 'rgba(0, 135, 90, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  retainedBadgeText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#00875a',
  },
  splitRowsCol: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  splitLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  splitGrossLabel: {
    ...Typography.bodySm,
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  splitGrossValue: {
    ...Typography.labelMono,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  splitSubLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  subBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  blueDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.secondaryCobalt,
  },
  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00875a',
  },
  splitSubLabel: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
  },
  splitSubValue: {
    ...Typography.labelMono,
    fontSize: 11.5,
    color: Colors.onSurface,
  },
  waivedFeeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waivedOldFee: {
    ...Typography.labelMono,
    fontSize: 10.5,
    color: Colors.outline,
    textDecorationLine: 'line-through',
  },
  waivedNewFee: {
    ...Typography.labelMono,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#00875a',
  },
  takeHomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 135, 90, 0.08)',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: BorderRadius.lg,
  },
  takeHomeTextCol: {
    flex: 1,
  },
  takeHomeTitle: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: '#00875a',
    letterSpacing: 0.5,
  },
  takeHomeSub: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.outlineVariant,
    marginTop: 1,
  },
  takeHomeAmount: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    color: '#00875a',
  },
  auditRowsCol: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
  },
  auditLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  auditLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  copyableTxnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txnIdText: {
    ...Typography.labelMono,
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  copyButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyIcon: {
    fontSize: 11,
  },
  auditValueMono: {
    ...Typography.labelMono,
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  otpSignoffGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  otpSignoffText: {
    ...Typography.labelMd,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#00875a',
  },
  warrantyPill: {
    backgroundColor: 'rgba(219, 225, 255, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  warrantyPillText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
  actionsContainer: {
    gap: 8,
    marginTop: 4,
  },
  primaryDownloadBtn: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  downloadIcon: {
    fontSize: 16,
    color: Colors.onPrimary,
  },
  primaryDownloadBtnText: {
    ...Typography.labelMd,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onPrimary,
    letterSpacing: 0.4,
  },
  secondaryDisputeBtn: {
    height: 44,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  flagIcon: {
    fontSize: 14,
  },
  secondaryDisputeBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
});
