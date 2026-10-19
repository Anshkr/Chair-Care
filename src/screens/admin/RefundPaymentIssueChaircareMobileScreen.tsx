import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../components/common/AppIcon';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface RefundPaymentIssueProps {
  navigation?: any;
  route?: {
    params?: {
      txnId?: string;
      transaction?: any;
    };
  };
}

export type IssueOptionKey =
  | 'refund'
  | 'duplicate'
  | 'failed'
  | 'incorrect'
  | 'cancelled'
  | 'other';

interface IssueOption {
  id: IssueOptionKey;
  title: string;
  subtitle: string;
  icon: string;
}

const ISSUE_OPTIONS: IssueOption[] = [
  {
    id: 'refund',
    title: 'Customer Refund',
    subtitle: 'Return funds to source via banking gateway switch',
    icon: 'currency_rupee',
  },
  {
    id: 'duplicate',
    title: 'Duplicate Payment',
    subtitle: 'Reconcile multiple debit spikes on order #CC-10482',
    icon: 'content_copy',
  },
  {
    id: 'failed',
    title: 'Failed Payment / Debited without Booking',
    subtitle: 'Trace drop-off during webhook reconciliation',
    icon: 'sync_problem',
  },
  {
    id: 'incorrect',
    title: 'Incorrect Amount Billed',
    subtitle: 'Parts rate tariff mismatch or excessive technician fee',
    icon: 'pin_invoke',
  },
  {
    id: 'cancelled',
    title: 'Service Cancelled by Customer',
    subtitle: 'Chair overhaul halted prior to hydraulic replacement',
    icon: 'event_busy',
  },
  {
    id: 'other',
    title: 'Other Operational Discrepancy',
    subtitle: 'Flag manual review ticket for finance audit',
    icon: 'more_horiz',
  },
];

const REGULATORY_REASONS = [
  'Service Cancelled / Customer Request',
  'Dissatisfied with service / Defective gas lift',
  'Duplicate charge detected on VPA',
  'Technician unavailable in service territory',
  'Parts defective upon unpackaging',
];

export const RefundPaymentIssueChaircareMobileScreen: React.FC<
  RefundPaymentIssueProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const params = route?.params;

  const passedTxn = params?.transaction;
  const txnId = params?.txnId || passedTxn?.id || 'txn-84291';

  // Transaction details with fallback to canonical Stitch reference data
  const code = passedTxn?.code || 'TXN-84291';
  const customerName = passedTxn?.customerName || 'Rahul Mehta';
  const ticketCode = passedTxn?.serviceId || '#CC-10482';
  const serviceName = 'Office Chair Repair';
  const amountNumber = passedTxn?.amountNumber || 1850;
  const amountFormatted = passedTxn?.amountFormatted || '₹1,850';
  const methodText = 'UPI (Google Pay)';
  const vpaHandle = 'rahul.mehta@oksbi';
  const dispatchUnit = 'Hyd-South Hub #04';
  const capturedStamp = '14 Oct, 11:28 AM';
  const gatewayLabel = 'Gate: Razorpay_UPI';

  // Form states
  const [selectedIssue, setSelectedIssue] = useState<IssueOptionKey>('refund');
  const [preset, setPreset] = useState<'full' | 'half' | 'custom'>('full');
  const [refundAmount, setRefundAmount] = useState<number>(amountNumber);
  const [amountInputText, setAmountInputText] = useState<string>(
    amountNumber.toString()
  );
  const [selectedReason, setSelectedReason] = useState<string>(
    REGULATORY_REASONS[0]
  );
  const [showReasonPicker, setShowReasonPicker] = useState<boolean>(false);
  const [adminNotes, setAdminNotes] = useState<string>(
    'Customer requested cancellation after initial assessment; approved by supervisory desk #SA-01.'
  );

  // Animation for pulse dot
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

  // Preset handlers
  const handleSelectFull = () => {
    setPreset('full');
    setRefundAmount(amountNumber);
    setAmountInputText(amountNumber.toString());
  };

  const handleSelectHalf = () => {
    const half = Math.round(amountNumber / 2);
    setPreset('half');
    setRefundAmount(half);
    setAmountInputText(half.toString());
  };

  const handleSelectCustom = () => {
    setPreset('custom');
  };

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setAmountInputText(cleaned);
    const num = parseInt(cleaned, 10);
    if (!isNaN(num)) {
      setRefundAmount(Math.min(num, amountNumber));
    } else {
      setRefundAmount(0);
    }
    setPreset('custom');
  };

  // Continue to Confirmation (A22)
  const handleContinue = () => {
    if (refundAmount <= 0) return;

    if (navigation) {
      navigation.navigate('RefundConfirmation', {
        txnId,
        transaction: {
          ...passedTxn,
          code,
          customerName,
          amountNumber,
          amountFormatted,
          refundAmount,
          refundAmountFormatted: `₹${refundAmount.toLocaleString('en-IN')}`,
          issueType: selectedIssue,
          reason: selectedReason,
          adminNotes,
          vpaHandle,
        },
        refundAmount,
        issueType: selectedIssue,
        reason: selectedReason,
        adminNotes,
      });
    }
  };

  const isFormValid = refundAmount > 0 && adminNotes.trim().length > 0;

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
                navigation.navigate('PaymentDetailsTxn84291', { txnId });
              }
            }}
            activeOpacity={0.7}
          >
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Refund Payment Issue
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
          { paddingBottom: Math.max(insets.bottom, 24) + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Top Meta Strip */}
        <View style={styles.metaStripRow}>
          <View style={styles.metaStripLeft}>
            <View style={styles.txnBadge}>
              <Text style={styles.txnBadgeText}>{code}</Text>
            </View>
            <View style={styles.rbiBadge}>
              <AppIcon name="lock" size={20} />
              <Text style={styles.rbiBadgeText}>RBI Switch VPA</Text>
            </View>
          </View>
          <Text style={styles.gatewayLabelText}>{gatewayLabel}</Text>
        </View>

        {/* 3. Hero Status / Transaction Summary Bento Card */}
        <View style={styles.bentoSummaryCard}>
          <View style={styles.bentoTopRow}>
            <View style={styles.bentoCustomerLeft}>
              <View style={styles.walletIconBox}>
                <AppIcon name="account_balance_wallet" size={20} />
                <View style={styles.walletDotContainer}>
                  <Animated.View
                    style={[styles.walletDot, { opacity: pulseAnim }]}
                  />
                </View>
              </View>

              <View style={styles.customerMetaCol}>
                <Text style={styles.customerNameText} numberOfLines={1}>
                  {customerName}
                </Text>
                <View style={styles.serviceTicketRow}>
                  <Text style={styles.ticketCodeText}>{ticketCode}</Text>
                  <View style={styles.ticketDot} />
                  <Text style={styles.serviceNameText} numberOfLines={1}>
                    {serviceName}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.bentoAmountRight}>
              <Text style={styles.amountTotalText}>{amountFormatted}</Text>
              <View style={styles.settledBadge}>
                <View style={styles.settledDot} />
                <Text style={styles.settledText}>Settled</Text>
              </View>
            </View>
          </View>

          {/* Diagnostic Details Grid */}
          <View style={styles.diagnosticGrid}>
            <View style={styles.diagnosticCol}>
              <Text style={styles.diagnosticLabel}>METHOD</Text>
              <View style={styles.diagnosticValueRow}>
                <AppIcon name="qr_code_2" size={20} />
                <Text style={styles.diagnosticValueBold} numberOfLines={1}>
                  {methodText}
                </Text>
              </View>
            </View>

            <View style={styles.diagnosticCol}>
              <Text style={styles.diagnosticLabel}>VPA HANDLE</Text>
              <Text style={styles.diagnosticValueMono} numberOfLines={1}>
                {vpaHandle}
              </Text>
            </View>

            <View style={styles.diagnosticCol}>
              <Text style={styles.diagnosticLabel}>DISPATCH UNIT</Text>
              <Text style={styles.diagnosticValueRegular} numberOfLines={1}>
                {dispatchUnit}
              </Text>
            </View>

            <View style={styles.diagnosticCol}>
              <Text style={styles.diagnosticLabel}>CAPTURED STAMP</Text>
              <Text style={styles.diagnosticValueMonoMuted} numberOfLines={1}>
                {capturedStamp}
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Issue Type Selector */}
        <View style={styles.issueSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeadingText}>
              Investigation / Issue Type
            </Text>
            <Text style={styles.stepIndicatorText}>Step 1 of 2</Text>
          </View>

          <View style={styles.issueOptionsList}>
            {ISSUE_OPTIONS.map((opt) => {
              const isSelected = selectedIssue === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.issueOptionCard,
                    isSelected && styles.issueOptionCardSelected,
                  ]}
                  onPress={() => setSelectedIssue(opt.id)}
                  activeOpacity={0.82}
                >
                  <View style={styles.issueOptionLeft}>
                    <View
                      style={[
                        styles.issueIconContainer,
                        isSelected && styles.issueIconContainerSelected,
                      ]}
                    >
                      <AppIcon
                        name={opt.icon}
                        size={20}
                        color={isSelected ? Colors.secondary : Colors.onSurfaceVariant}
                        strokeWidth={1.8}
                      />
                    </View>

                    <View style={styles.issueTextCol}>
                      <Text
                        style={[
                          styles.issueTitleText,
                          isSelected && styles.issueTitleTextSelected,
                        ]}
                      >
                        {opt.title}
                      </Text>
                      <Text
                        style={[
                          styles.issueSubtitleText,
                          isSelected && styles.issueSubtitleTextSelected,
                        ]}
                      >
                        {opt.subtitle}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && (
                      <AppIcon name="check" size={20} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. Refund Configuration Section */}
        <View style={styles.configSectionCard}>
          <View style={styles.configHeaderRow}>
            <View style={styles.configHeaderLeft}>
              <AppIcon name="tune" size={20} />
              <Text style={styles.configHeadingText}>Refund Configuration</Text>
            </View>
            <View style={styles.escrowHeldBadge}>
              <Text style={styles.escrowHeldText}>Escrow Held</Text>
            </View>
          </View>

          {/* Quick Preset Buttons */}
          <View style={styles.presetsRow}>
            <TouchableOpacity
              style={[
                styles.presetBtn,
                preset === 'full' && styles.presetBtnActive,
              ]}
              onPress={handleSelectFull}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.presetBtnText,
                  preset === 'full' && styles.presetBtnTextActive,
                ]}
              >
                Full ({amountFormatted})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetBtn,
                preset === 'half' && styles.presetBtnActive,
              ]}
              onPress={handleSelectHalf}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.presetBtnText,
                  preset === 'half' && styles.presetBtnTextActive,
                ]}
              >
                50% (₹{Math.round(amountNumber / 2).toLocaleString('en-IN')})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetBtn,
                preset === 'custom' && styles.presetBtnActive,
              ]}
              onPress={handleSelectCustom}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.presetBtnText,
                  preset === 'custom' && styles.presetBtnTextActive,
                ]}
              >
                Custom
              </Text>
            </TouchableOpacity>
          </View>

          {/* Total Payout Amount Input */}
          <View style={styles.amountInputGroup}>
            <Text style={styles.inputGroupLabel}>TOTAL PAYOUT AMOUNT</Text>
            <View style={styles.amountInputWrapper}>
              <Text style={styles.amountRupeePrefix}>₹</Text>
              <TextInput
                style={styles.amountTextInput}
                keyboardType="numeric"
                value={amountInputText}
                onChangeText={handleAmountChange}
                maxLength={7}
              />
              <Text style={styles.amountInrSuffix}>INR</Text>
            </View>
            <View style={styles.amountFootnoteRow}>
              <Text style={styles.maxEligibleText}>
                Max eligible refund: {amountFormatted}
              </Text>
              <Text style={styles.penaltyText}>0% gateway penalty</Text>
            </View>
          </View>

          {/* Standard Regulatory Reason Dropdown */}
          <View style={styles.reasonInputGroup}>
            <Text style={styles.inputGroupLabel}>STANDARD REGULATORY REASON</Text>
            <TouchableOpacity
              style={styles.reasonSelectBox}
              onPress={() => setShowReasonPicker(!showReasonPicker)}
              activeOpacity={0.8}
            >
              <Text style={styles.reasonSelectedText} numberOfLines={1}>
                {selectedReason}
              </Text>
              <Text style={styles.dropdownChevron}>
                {showReasonPicker ? 'expand_less' : 'expand_more'}
              </Text>
            </TouchableOpacity>

            {showReasonPicker && (
              <View style={styles.dropdownOptionsContainer}>
                {REGULATORY_REASONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.dropdownOptionItem,
                      selectedReason === r && styles.dropdownOptionItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedReason(r);
                      setShowReasonPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        selectedReason === r && styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Internal Supervisory Audit Notes */}
          <View style={styles.notesInputGroup}>
            <View style={styles.notesLabelRow}>
              <Text style={styles.inputGroupLabel}>
                INTERNAL SUPERVISORY AUDIT NOTES
              </Text>
              <Text style={styles.requiredTag}>Required</Text>
            </View>
            <TextInput
              style={styles.notesTextInput}
              multiline
              numberOfLines={3}
              value={adminNotes}
              onChangeText={setAdminNotes}
              placeholder="Provide reason for audit compliance..."
              placeholderTextColor="#76777d"
            />
            <Text style={styles.auditLoggedFootnote}>
              Logged to audit trail: SuperAdmin_Operator_04
            </Text>
          </View>
        </View>

        {/* 6. Critical Warning Callout Card */}
        <View style={styles.warningCalloutCard}>
          <View style={styles.warningIconBox}>
            <AppIcon name="gavel" size={20} />
          </View>
          <View style={styles.warningContentCol}>
            <Text style={styles.warningTitleText}>
              Irreversible Financial Operation
            </Text>
            <Text style={styles.warningBodyText}>
              Refunds cannot be reversed once processed through the UPI banking
              switch. Verify the transaction amount (
              <Text style={styles.warningAmountBold}>
                ₹{refundAmount.toLocaleString('en-IN')}
              </Text>
              ) and recipient credentials (
              <Text style={styles.warningVpaMono}>{vpaHandle}</Text>) before
              proceeding.
            </Text>
          </View>
        </View>

        {/* 7. Technician & Hub Diagnostic Snapshot */}
        <View style={styles.assignedContextCard}>
          <Text style={styles.assignedContextHeading}>
            ASSIGNED TELEMETRY CONTEXT
          </Text>
          <View style={styles.assignedContextRow}>
            <View style={styles.techAvatarLeft}>
              <View style={styles.techAvatarCircle}>
                <AppIcon name="engineering" size={20} />
              </View>
              <View style={styles.techMetaCol}>
                <Text style={styles.techNameText}>S. Ramakrishnan</Text>
                <Text style={styles.techIdText}>
                  Tech ID #T-4402 • Mobile Van 12
                </Text>
              </View>
            </View>

            <View style={styles.jobAbortedRight}>
              <View style={styles.jobAbortedBadge}>
                <Text style={styles.jobAbortedText}>Job Aborted</Text>
              </View>
              <Text style={styles.jobAbortedTime}>11:15 AM today</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 8. Sticky Bottom Drawer / Action Bar */}
      <View
        style={[
          styles.bottomActionBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.continuePrimaryBtn,
            !isFormValid && styles.continuePrimaryBtnDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isFormValid}
          activeOpacity={0.88}
        >
          <Text style={styles.continueBtnText}>Continue to Confirmation</Text>
          <AppIcon name="arrow_forward" size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => {
            if (navigation && navigation.canGoBack()) {
              navigation.goBack();
            } else if (navigation) {
              navigation.navigate('PaymentDetailsTxn84291', { txnId });
            }
          }}
          activeOpacity={0.75}
        >
          <Text style={styles.cancelBtnText}>Cancel &amp; Return</Text>
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

  /* 2. Top Meta Strip */
  metaStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metaStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txnBadge: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  txnBadgeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#00174b',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rbiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  rbiLockIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    color: '#009668',
    includeFontPadding: false,
  },
  rbiBadgeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#45464d',
  },
  gatewayLabelText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#45464d',
  },

  /* 3. Hero Bento Card */
  bentoSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 14,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  bentoTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  bentoCustomerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  walletIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  walletIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 26,
    color: '#0051d5',
    includeFontPadding: false,
  },
  walletDotContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4edea3',
  },
  customerMetaCol: {
    flex: 1,
  },
  customerNameText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 17,
    fontWeight: '700',
    color: '#191c1e',
  },
  serviceTicketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  ticketCodeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#0051d5',
    fontWeight: '600',
  },
  ticketDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c6c6cd',
  },
  serviceNameText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: '#45464d',
    flex: 1,
  },
  bentoAmountRight: {
    alignItems: 'flex-end',
  },
  amountTotalText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#191c1e',
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
    marginTop: 2,
  },
  settledDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#009668',
  },
  settledText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#45464d',
  },

  diagnosticGrid: {
    backgroundColor: '#f2f4f6',
    borderRadius: BorderRadius.lg,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  diagnosticCol: {
    width: '48%',
    gap: 2,
  },
  diagnosticLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#76777d',
    textTransform: 'uppercase',
  },
  diagnosticValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qrIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#191c1e',
    includeFontPadding: false,
  },
  diagnosticValueBold: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  diagnosticValueMono: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11.5,
    color: '#191c1e',
  },
  diagnosticValueRegular: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#191c1e',
  },
  diagnosticValueMonoMuted: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#45464d',
  },

  /* 4. Issue Type Selector */
  issueSection: {
    gap: 8,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionHeadingText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  stepIndicatorText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
  },
  issueOptionsList: {
    gap: 8,
  },
  issueOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: 12,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  issueOptionCardSelected: {
    backgroundColor: '#dbe1ff',
    borderColor: '#b4c5ff',
  },
  issueOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  issueIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  issueIconContainerSelected: {
    backgroundColor: '#ffffff',
    ...Shadows.level1,
  },
  issueOptionIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    includeFontPadding: false,
  },
  issueTextCol: {
    flex: 1,
  },
  issueTitleText: {
    ...Typography.bodyMd,
    fontSize: 13.5,
    fontWeight: '500',
    color: '#191c1e',
  },
  issueTitleTextSelected: {
    fontWeight: '700',
    color: '#00174b',
  },
  issueSubtitleText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: '#45464d',
    marginTop: 1,
  },
  issueSubtitleTextSelected: {
    color: '#003ea8',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e0e3e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioCircleSelected: {
    backgroundColor: '#0051d5',
  },
  radioCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#ffffff',
    includeFontPadding: false,
  },

  /* 5. Refund Configuration Section */
  configSectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 14,
    marginTop: 4,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  configHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  configHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tuneIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#0051d5',
    includeFontPadding: false,
  },
  configHeadingText: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  escrowHeldBadge: {
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  escrowHeldText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#45464d',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnActive: {
    backgroundColor: '#0051d5',
  },
  presetBtnText: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  presetBtnTextActive: {
    color: '#ffffff',
  },

  amountInputGroup: {
    gap: 6,
  },
  inputGroupLabel: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#76777d',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f4f6',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    height: 48,
  },
  amountRupeePrefix: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    color: '#191c1e',
    marginRight: 6,
  },
  amountTextInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 20,
    color: '#191c1e',
    paddingVertical: 0,
  },
  amountInrSuffix: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#76777d',
  },
  amountFootnoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  maxEligibleText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: '#45464d',
  },
  penaltyText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#009668',
  },

  reasonInputGroup: {
    gap: 6,
  },
  reasonSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    height: 44,
  },
  reasonSelectedText: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: '#191c1e',
    flex: 1,
  },
  dropdownChevron: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#45464d',
    includeFontPadding: false,
  },
  dropdownOptionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#e0e3e5',
    marginTop: 4,
    ...Shadows.level2,
    overflow: 'hidden',
  },
  dropdownOptionItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eceef0',
  },
  dropdownOptionItemSelected: {
    backgroundColor: '#dbe1ff',
  },
  dropdownOptionText: {
    ...Typography.bodySm,
    fontSize: 12.5,
    color: '#191c1e',
  },
  dropdownOptionTextSelected: {
    fontWeight: '700',
    color: '#00174b',
  },

  notesInputGroup: {
    gap: 6,
  },
  notesLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requiredTag: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#76777d',
  },
  notesTextInput: {
    backgroundColor: '#f2f4f6',
    borderRadius: BorderRadius.lg,
    padding: 12,
    minHeight: 70,
    textAlignVertical: 'top',
    ...Typography.bodySm,
    fontSize: 12.5,
    color: '#191c1e',
  },
  auditLoggedFootnote: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10.5,
    color: '#76777d',
    marginTop: 2,
  },

  /* 6. Critical Warning Callout */
  warningCalloutCard: {
    backgroundColor: '#ffdad6',
    borderRadius: BorderRadius.xl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
  },
  warningIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  gavelIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  warningContentCol: {
    flex: 1,
    gap: 2,
  },
  warningTitleText: {
    ...Typography.titleLg,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#93000a',
  },
  warningBodyText: {
    ...Typography.bodySm,
    fontSize: 12,
    lineHeight: 17,
    color: '#93000a',
  },
  warningAmountBold: {
    fontWeight: '700',
  },
  warningVpaMono: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
  },

  /* 7. Assigned Telemetry Context */
  assignedContextCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 10,
    marginTop: 4,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  assignedContextHeading: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  assignedContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techAvatarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  techAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  techAvatarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#191c1e',
    includeFontPadding: false,
  },
  techMetaCol: {
    flex: 1,
  },
  techNameText: {
    ...Typography.bodyMd,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#191c1e',
  },
  techIdText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#45464d',
    marginTop: 1,
  },
  jobAbortedRight: {
    alignItems: 'flex-end',
  },
  jobAbortedBadge: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  jobAbortedText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#45464d',
  },
  jobAbortedTime: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#76777d',
    marginTop: 2,
  },

  /* 8. Sticky Bottom Drawer */
  bottomActionBar: {
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
  continuePrimaryBtn: {
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  continuePrimaryBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnText: {
    fontFamily: Typography.titleLg.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  continueBtnIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },
  cancelBtn: {
    height: 38,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...Typography.bodyMd,
    fontSize: 13.5,
    color: '#45464d',
    fontWeight: '500',
  },

  /* Color utilities */
  textSecondary: {
    color: '#0051d5',
  },
  textMuted: {
    color: '#76777d',
  },
});
