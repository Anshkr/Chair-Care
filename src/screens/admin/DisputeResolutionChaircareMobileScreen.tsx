import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface DisputeResolutionScreenProps {
  navigation?: any;
  route?: {
    params?: {
      disputeId?: string;
      dispute?: any;
    };
  };
}

type ResolutionOptionKey =
  | 'partial'
  | 'full-refund'
  | 'release-tech'
  | 'redispatch'
  | 'escalate';

interface ReasonOption {
  code: string;
  label: string;
}

const REASON_OPTIONS: ReasonOption[] = [
  {
    code: 'incomplete',
    label: 'Incomplete service / Unverified supplementary charge',
  },
  { code: 'not_completed', label: 'Service not completed' },
  { code: 'poor_quality', label: 'Poor service quality' },
  { code: 'incorrect_charge', label: 'Incorrect charge' },
  { code: 'tech_issue', label: 'Technician issue' },
  { code: 'customer_issue', label: 'Customer issue' },
  { code: 'cancellation', label: 'Cancellation discrepancy' },
  { code: 'other', label: 'Other' },
];

export const DisputeResolutionChaircareMobileScreen: React.FC<
  DisputeResolutionScreenProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const passedDispute = route?.params?.dispute;

  // Pulse animation for Active Escrow indicator
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

  // Fallback / Selected dispute context
  const disputeData = {
    id: passedDispute?.id || 'dsp-20481',
    code: passedDispute?.code || 'DSP-20481',
    priority: passedDispute?.priority || 'high',
    priorityLabel: passedDispute?.priorityLabel || 'High Priority',
    status: passedDispute?.status || 'Under Review',
    customerName: passedDispute?.customerName || 'Rahul Mehta',
    technicianName: passedDispute?.technicianName || 'Rahul Sharma',
    serviceTitle: passedDispute?.serviceTitle || 'Office Chair Repair',
    serviceCode: passedDispute?.serviceCode || '#CC-10482',
    amountFormatted: passedDispute?.amountFormatted || '₹1,850.00',
    totalEscrow: 1850,
    originalTechPayout: 1665,
  };

  // Form State
  const [selectedOption, setSelectedOption] =
    useState<ResolutionOptionKey>('partial');
  const [refundAmount, setRefundAmount] = useState<string>('900.00');
  const [selectedReason, setSelectedReason] = useState<string>('incomplete');
  const [showReasonPicker, setShowReasonPicker] = useState<boolean>(false);
  const [adminNotes, setAdminNotes] = useState<string>(
    'Field review confirms dynamic tension tuning was billed without signed customer work-order amendment. Recommending ₹900 partial refund (₹100 charge + ₹800 diagnostic compromise). Technician will retain ₹765 for travel and bushing hardware install.'
  );
  const [customerMessage, setCustomerMessage] = useState<string>(
    'Dear Rahul, ChairCare has reviewed your dispute on ticket #CC-10482. We have approved a ₹900.00 partial refund to your original UPI account for the unverified calibration work. The funds will reflect in 2–4 hours.'
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // Dynamic calculations
  const parsedRefund = parseFloat(refundAmount) || 0;
  const calculatedTechPayout = Math.max(
    0,
    disputeData.originalTechPayout - parsedRefund
  );

  // Handle amount update
  const handleAmountChange = (val: string) => {
    // allow only numbers and decimal
    const sanitized = val.replace(/[^0-9.]/g, '');
    setRefundAmount(sanitized);

    const num = parseFloat(sanitized) || 0;
    // Auto-sync customer message template
    setCustomerMessage(
      `Dear Rahul, ChairCare has reviewed your dispute on ticket ${
        disputeData.serviceCode
      }. We have approved a ₹${num.toFixed(
        2
      )} partial refund to your original UPI account for the unverified calibration work. The funds will reflect in 2–4 hours.`
    );
  };

  const handleSetPreset = (amt: string) => {
    setRefundAmount(amt);
    const num = parseFloat(amt) || 0;
    setCustomerMessage(
      `Dear Rahul, ChairCare has reviewed your dispute on ticket ${
        disputeData.serviceCode
      }. We have approved a ₹${num.toFixed(
        2
      )} partial refund to your original UPI account for the unverified calibration work. The funds will reflect in 2–4 hours.`
    );
  };

  const selectedReasonObj =
    REASON_OPTIONS.find((r) => r.code === selectedReason) || REASON_OPTIONS[0];

  const handleContinue = () => {
    // Validation
    if (!adminNotes.trim()) {
      setValidationError('Internal resolution notes are mandatory.');
      return;
    }

    if (selectedOption === 'partial') {
      const num = parseFloat(refundAmount);
      if (isNaN(num) || num <= 0) {
        setValidationError('Please enter a valid refund amount greater than 0.');
        return;
      }
      if (num > disputeData.totalEscrow) {
        setValidationError(
          `Refund amount cannot exceed total escrow of ₹${disputeData.totalEscrow}.00.`
        );
        return;
      }
    }

    setValidationError(null);

    const resolutionPayload = {
      disputeId: disputeData.id,
      disputeCode: disputeData.code,
      option: selectedOption,
      refundAmount:
        selectedOption === 'partial'
          ? parsedRefund
          : selectedOption === 'full-refund'
          ? disputeData.totalEscrow
          : 0,
      techPayout:
        selectedOption === 'partial'
          ? calculatedTechPayout
          : selectedOption === 'release-tech'
          ? disputeData.originalTechPayout
          : 0,
      reasonCode: selectedReason,
      reasonLabel: selectedReasonObj.label,
      adminNotes: adminNotes.trim(),
      customerMessage: customerMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    if (navigation) {
      navigation.navigate('ResolutionConfirmation', {
        disputeId: disputeData.id,
        dispute: disputeData,
        resolutionData: resolutionPayload,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screenContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
                navigation?.navigate('DisputeDetailsDsp20481', {
                  disputeId: disputeData.id,
                });
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Dispute Resolution
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
        keyboardShouldPersistTaps="handled"
      >
        {/* 2. Target Summary Card */}
        <View style={styles.summaryCard}>
          {/* Top Row */}
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryCodeGroup}>
              <Text style={styles.summaryCodeText}>{disputeData.code}</Text>
              <View style={styles.codeDot} />
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityBadgeText}>
                  {disputeData.priorityLabel}
                </Text>
              </View>
            </View>
            <View style={styles.activeEscrowBadge}>
              <Animated.View
                style={[styles.escrowPulseDot, { opacity: pulseAnim }]}
              />
              <Text style={styles.activeEscrowText}>Active Escrow</Text>
            </View>
          </View>

          {/* Parties & Subject Subcard */}
          <View style={styles.partiesSubCard}>
            <View style={styles.partiesRow}>
              <View style={styles.partyItem}>
                <AppIcon name="person" size={20} />
                <Text style={styles.partyLabel}>Customer:</Text>
                <Text style={styles.partyName} numberOfLines={1}>
                  {disputeData.customerName}
                </Text>
              </View>
              <Text style={styles.vsDivider}>vs</Text>
              <View style={styles.partyItem}>
                <AppIcon name="engineering" size={20} />
                <Text style={styles.partyLabel}>Tech:</Text>
                <Text style={styles.partyName} numberOfLines={1}>
                  {disputeData.technicianName}
                </Text>
              </View>
            </View>

            <View style={styles.subjectRow}>
              <AppIcon name="chair" size={20} />
              <Text style={styles.subjectText}>
                {disputeData.serviceTitle}{' '}
                <Text style={styles.subjectCode}>
                  ({disputeData.serviceCode})
                </Text>
              </Text>
            </View>
          </View>

          {/* Escrow Lock Banner */}
          <View style={styles.escrowBanner}>
            <View style={styles.escrowBannerLeft}>
              <View style={styles.escrowWalletIconBox}>
                <AppIcon name="account_balance_wallet" size={20} />
              </View>
              <View>
                <Text style={styles.escrowTitle}>Escrow Lock Amount</Text>
                <Text style={styles.escrowSubtitle}>
                  Razorpay Escrow Gateway
                </Text>
              </View>
            </View>
            <View style={styles.escrowBannerRight}>
              <Text style={styles.escrowAmountText}>
                {disputeData.amountFormatted}
              </Text>
              <Text style={styles.escrowVaultTag}>SECURED VAULT</Text>
            </View>
          </View>
        </View>

        {/* 3. Resolution Outcome Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <AppIcon name="gavel" size={20} />
            <Text style={styles.sectionTitleText}>
              Select Resolution Outcome
            </Text>
            <Text style={styles.requiredStar}>*</Text>
          </View>
          <Text style={styles.sectionSubtitleText}>
            Only one primary resolution can be executed per case. All adjustments
            log directly to the immutable financial ledger.
          </Text>
        </View>

        {/* 4. Interactive Resolution Cards Matrix */}
        <View style={styles.resolutionMatrix}>
          {/* Option 1: Partial Refund */}
          <TouchableOpacity
            style={[
              styles.resolutionCard,
              selectedOption === 'partial' && styles.resolutionCardSelected,
            ]}
            onPress={() => setSelectedOption('partial')}
            activeOpacity={0.85}
          >
            {selectedOption === 'partial' && (
              <View style={styles.selectedLeftPill} />
            )}
            <View style={styles.optionRow}>
              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radioOuter,
                    selectedOption === 'partial' && styles.radioOuterSelected,
                  ]}
                >
                  {selectedOption === 'partial' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
              <View style={styles.optionContent}>
                <View style={styles.optionHeaderRow}>
                  <Text style={styles.optionTitle}>
                    Partial Refund to Customer
                  </Text>
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>
                      RECOMMENDED BY ARBITRATION
                    </Text>
                  </View>
                </View>
                <Text style={styles.optionDescription}>
                  Refund the disputed additional tension tuning and service
                  defect allowance (₹900.00). Retain core diagnostic fee for
                  technician.
                </Text>

                {/* Sub-inputs for Partial Option */}
                {selectedOption === 'partial' && (
                  <View style={styles.partialSettingsContainer}>
                    <View style={styles.partialAmountHeader}>
                      <Text style={styles.partialAmountLabel}>
                        Refund Amount (INR)
                      </Text>
                      <Text style={styles.partialMaxLabel}>
                        Max: ₹1,850.00
                      </Text>
                    </View>

                    {/* Currency Input Box */}
                    <View style={styles.currencyInputBox}>
                      <Text style={styles.currencySymbol}>₹</Text>
                      <TextInput
                        style={styles.amountTextInput}
                        value={refundAmount}
                        onChangeText={handleAmountChange}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor="#76777d"
                      />
                      <View style={styles.inrBadge}>
                        <Text style={styles.inrBadgeText}>INR</Text>
                      </View>
                    </View>

                    {/* Presets Row */}
                    <View style={styles.presetsRow}>
                      <TouchableOpacity
                        style={[
                          styles.presetBtn,
                          refundAmount === '500.00' && styles.presetBtnActive,
                        ]}
                        onPress={() => handleSetPreset('500.00')}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.presetBtnText,
                            refundAmount === '500.00' &&
                              styles.presetBtnTextActive,
                          ]}
                        >
                          ₹500
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.presetBtn,
                          refundAmount === '900.00' && styles.presetBtnActive,
                        ]}
                        onPress={() => handleSetPreset('900.00')}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.presetBtnText,
                            refundAmount === '900.00' &&
                              styles.presetBtnTextActive,
                          ]}
                        >
                          ₹900 (Recommended)
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.presetBtn,
                          refundAmount === '1200.00' && styles.presetBtnActive,
                        ]}
                        onPress={() => handleSetPreset('1200.00')}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.presetBtnText,
                            refundAmount === '1200.00' &&
                              styles.presetBtnTextActive,
                          ]}
                        >
                          ₹1,200
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.presetBtn,
                          !['500.00', '900.00', '1200.00'].includes(
                            refundAmount
                          ) && styles.presetBtnActive,
                        ]}
                        onPress={() => handleSetPreset('')}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.presetBtnText,
                            !['500.00', '900.00', '1200.00'].includes(
                              refundAmount
                            ) && styles.presetBtnTextActive,
                          ]}
                        >
                          Custom
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Ledger Impact Note */}
                    <View style={styles.ledgerImpactBox}>
                      <AppIcon name="calculate" size={20} />
                      <Text style={styles.ledgerImpactText}>
                        Technician payout adjusted:{' '}
                        <Text style={styles.strikethroughText}>₹1,665</Text> →{' '}
                        <Text style={styles.highlightText}>
                          ₹{calculatedTechPayout.toFixed(0)}
                        </Text>
                        . Customer refunded:{' '}
                        <Text style={styles.refundHighlightText}>
                          ₹{parsedRefund.toFixed(2)}
                        </Text>
                        .
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Option 2: Full Refund */}
          <TouchableOpacity
            style={[
              styles.resolutionCard,
              selectedOption === 'full-refund' && styles.resolutionCardSelected,
            ]}
            onPress={() => setSelectedOption('full-refund')}
            activeOpacity={0.85}
          >
            {selectedOption === 'full-refund' && (
              <View style={styles.selectedLeftPill} />
            )}
            <View style={styles.optionRow}>
              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radioOuter,
                    selectedOption === 'full-refund' &&
                      styles.radioOuterSelected,
                  ]}
                >
                  {selectedOption === 'full-refund' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
              <View style={styles.optionContent}>
                <View style={styles.optionHeaderRow}>
                  <Text style={styles.optionTitle}>
                    Full 100% Refund to Customer
                  </Text>
                  <Text style={styles.errorAmountTag}>₹1,850.00</Text>
                </View>
                <Text style={styles.optionDescription}>
                  Reverse complete payment of ₹1,850 to customer. Zero
                  technician payout and platform fee waived.
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Option 3: Release Full Payment */}
          <TouchableOpacity
            style={[
              styles.resolutionCard,
              selectedOption === 'release-tech' &&
                styles.resolutionCardSelected,
            ]}
            onPress={() => setSelectedOption('release-tech')}
            activeOpacity={0.85}
          >
            {selectedOption === 'release-tech' && (
              <View style={styles.selectedLeftPill} />
            )}
            <View style={styles.optionRow}>
              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radioOuter,
                    selectedOption === 'release-tech' &&
                      styles.radioOuterSelected,
                  ]}
                >
                  {selectedOption === 'release-tech' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
              <View style={styles.optionContent}>
                <View style={styles.optionHeaderRow}>
                  <Text style={styles.optionTitle}>
                    Release Full Payment to Technician
                  </Text>
                  <Text style={styles.successPayoutTag}>Payout: ₹1,665.00</Text>
                </View>
                <Text style={styles.optionDescription}>
                  Customer claim rejected. Release pending ₹1,665 escrow to
                  Rahul Sharma. No refund issued.
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Option 4: Re-Dispatch Rectification */}
          <TouchableOpacity
            style={[
              styles.resolutionCard,
              selectedOption === 'redispatch' && styles.resolutionCardSelected,
            ]}
            onPress={() => setSelectedOption('redispatch')}
            activeOpacity={0.85}
          >
            {selectedOption === 'redispatch' && (
              <View style={styles.selectedLeftPill} />
            )}
            <View style={styles.optionRow}>
              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radioOuter,
                    selectedOption === 'redispatch' &&
                      styles.radioOuterSelected,
                  ]}
                >
                  {selectedOption === 'redispatch' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
              <View style={styles.optionContent}>
                <View style={styles.optionHeaderRow}>
                  <Text style={styles.optionTitle}>
                    Re-Dispatch Free Rectification Visit
                  </Text>
                  <View style={styles.tier1Badge}>
                    <Text style={styles.tier1BadgeText}>Tier-1 Tech</Text>
                  </View>
                </View>
                <Text style={styles.optionDescription}>
                  Assign Tier-1 Senior Tech to inspect and fix cylinder sinking
                  at zero cost to customer.
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Option 5: Escalate */}
          <TouchableOpacity
            style={[
              styles.resolutionCard,
              selectedOption === 'escalate' && styles.resolutionCardSelected,
            ]}
            onPress={() => setSelectedOption('escalate')}
            activeOpacity={0.85}
          >
            {selectedOption === 'escalate' && (
              <View style={styles.selectedLeftPill} />
            )}
            <View style={styles.optionRow}>
              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radioOuter,
                    selectedOption === 'escalate' && styles.radioOuterSelected,
                  ]}
                >
                  {selectedOption === 'escalate' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
              <View style={styles.optionContent}>
                <View style={styles.optionHeaderRow}>
                  <Text style={styles.optionTitle}>
                    Escalate to Executive Review Panel
                  </Text>
                  <AppIcon name="shield_person" size={20} />
                </View>
                <Text style={styles.optionDescription}>
                  Forward to Legal & Quality Operations desk for formal warranty
                  clause assessment.
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* 5. Mandatory Reason Dropdown Card */}
        <View style={styles.formSectionCard}>
          <View style={styles.formSectionHeader}>
            <Text style={styles.formSectionTitle}>
              Formal Regulatory Reason <Text style={styles.requiredStar}>*</Text>
            </Text>
            <Text style={styles.formSectionSubtitle}>
              Selected code is stamped onto compliance & tax reversal records.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowReasonPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownSelectedText} numberOfLines={1}>
              {selectedReasonObj.label}
            </Text>
            <Text style={styles.dropdownChevron}>expand_more</Text>
          </TouchableOpacity>
        </View>

        {/* 6. Internal Administrative Audit Notes */}
        <View style={styles.formSectionCard}>
          <View style={styles.notesHeaderRow}>
            <View style={styles.notesLabelGroup}>
              <AppIcon name="lock" size={20} />
              <Text style={styles.formSectionTitle}>
                Internal Resolution Notes{' '}
                <Text style={styles.requiredStar}>*</Text>
              </Text>
            </View>
            <View style={styles.confidentialBadge}>
              <Text style={styles.confidentialBadgeText}>CONFIDENTIAL</Text>
            </View>
          </View>

          <TextInput
            style={styles.multilineTextInput}
            value={adminNotes}
            onChangeText={setAdminNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholder="Enter administrative notes for audit record..."
            placeholderTextColor="#76777d"
          />

          <View style={styles.auditFooterRow}>
            <Text style={styles.auditFooterText}>
              Logged by: SuperAdmin (Auth ID: ADM-094)
            </Text>
            <Text style={styles.encryptedLogTag}>Encrypted Log</Text>
          </View>
        </View>

        {/* 7. Customer-Facing Notice */}
        <View style={styles.formSectionCard}>
          <View style={styles.notesHeaderRow}>
            <View style={styles.notesLabelGroup}>
              <AppIcon name="mail" size={20} />
              <Text style={styles.formSectionTitle}>
                Customer-Facing Message
              </Text>
            </View>
            <Text style={styles.optionalTag}>Optional</Text>
          </View>

          <TextInput
            style={styles.multilineTextInput}
            value={customerMessage}
            onChangeText={setCustomerMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholder="Enter message that will be dispatched to customer..."
            placeholderTextColor="#76777d"
          />

          <Text style={styles.dispatchNoticeText}>
            This SMS and WhatsApp notification will dispatch instantly upon
            decision execution.
          </Text>
        </View>

        {/* Validation Error Banner */}
        {validationError && (
          <View style={styles.validationErrorCard}>
            <AppIcon name="error" size={20} />
            <Text style={styles.validationErrorText}>{validationError}</Text>
          </View>
        )}

        {/* 8. Bottom Action Container */}
        <View style={styles.bottomActionsArea}>
          <TouchableOpacity
            style={styles.primaryContinueBtn}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryContinueBtnText}>
              Continue to Confirmation
            </Text>
            <AppIcon name="arrow_forward" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelReturnBtn}
            onPress={() => {
              if (navigation?.canGoBack()) {
                navigation.goBack();
              } else {
                navigation?.navigate('DisputeDetailsDsp20481');
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelReturnBtnText}>
              Cancel & Return to Details
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Reason Picker Modal */}
      <Modal
        visible={showReasonPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReasonPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReasonPicker(false)}
        >
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Regulatory Reason</Text>
              <TouchableOpacity
                onPress={() => setShowReasonPicker(false)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
            >
              {REASON_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.reasonOptionItem,
                    selectedReason === item.code &&
                      styles.reasonOptionItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedReason(item.code);
                    setShowReasonPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.reasonOptionLabel,
                      selectedReason === item.code &&
                        styles.reasonOptionLabelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {selectedReason === item.code && (
                    <AppIcon name="check" size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
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

  /* Scrollable Content */
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },

  /* Target Summary Card */
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryCodeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryCodeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    fontWeight: '500',
    color: '#45464d',
    letterSpacing: 0.8,
  },
  codeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#c6c6cd',
  },
  priorityBadge: {
    backgroundColor: '#ffdad6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#93000a',
  },
  activeEscrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(111, 251, 190, 0.28)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  escrowPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#009668',
  },
  activeEscrowText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#009668',
  },

  /* Parties & Subject Subcard */
  partiesSubCard: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  partiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  partyIconCustomer: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#0051d5',
    includeFontPadding: false,
  },
  partyIconTech: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#45464d',
    includeFontPadding: false,
  },
  partyLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  partyName: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
    flexShrink: 1,
  },
  vsDivider: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
    paddingHorizontal: 4,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e3e5',
  },
  subjectIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#45464d',
    includeFontPadding: false,
  },
  subjectText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#191c1e',
  },
  subjectCode: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },

  /* Escrow Lock Banner */
  escrowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131b2e',
    borderRadius: 12,
    padding: 12,
  },
  escrowBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  escrowWalletIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(49, 107, 243, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  escrowWalletIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#dbe1ff',
    includeFontPadding: false,
  },
  escrowTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#bec6e0',
  },
  escrowSubtitle: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#c6c6cd',
  },
  escrowBannerRight: {
    alignItems: 'flex-end',
  },
  escrowAmountText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#fefcff',
    letterSpacing: -0.3,
  },
  escrowVaultTag: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 9,
    color: '#4edea3',
    letterSpacing: 0.8,
  },

  /* Section Header */
  sectionHeader: {
    paddingHorizontal: 4,
    gap: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gavelIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#0051d5',
    includeFontPadding: false,
  },
  sectionTitleText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 18,
    fontWeight: '600',
    color: '#191c1e',
    letterSpacing: -0.2,
  },
  requiredStar: {
    color: '#ba1a1a',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#45464d',
  },

  /* Resolution Cards Matrix */
  resolutionMatrix: {
    gap: 12,
  },
  resolutionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    ...Shadows.level1,
    position: 'relative',
    overflow: 'hidden',
  },
  resolutionCardSelected: {
    borderWidth: 1,
    borderColor: 'rgba(0, 81, 213, 0.25)',
  },
  selectedLeftPill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#0051d5',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingLeft: 4,
  },
  radioContainer: {
    marginTop: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e0e3e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    backgroundColor: '#0051d5',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  optionContent: {
    flex: 1,
    gap: 6,
  },
  optionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  optionTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: '#191c1e',
  },
  recommendedBadge: {
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  recommendedBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    fontWeight: '600',
    color: '#002113',
    letterSpacing: 0.3,
  },
  errorAmountTag: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#ba1a1a',
  },
  successPayoutTag: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#009668',
  },
  tier1Badge: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tier1BadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    fontWeight: '600',
    color: '#00174b',
  },
  escalateIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#45464d',
    includeFontPadding: false,
  },
  optionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#45464d',
  },

  /* Nested Partial Settings */
  partialSettingsContainer: {
    marginTop: 10,
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  partialAmountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partialAmountLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  partialMaxLabel: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#0051d5',
  },
  currencyInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    ...Shadows.level1,
  },
  currencySymbol: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 16,
    color: '#45464d',
    marginRight: 6,
  },
  amountTextInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: '#191c1e',
    padding: 0,
  },
  inrBadge: {
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  inrBadgeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
    fontWeight: '500',
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  presetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    ...Shadows.level1,
  },
  presetBtnActive: {
    backgroundColor: '#000000',
  },
  presetBtnText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#191c1e',
  },
  presetBtnTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  ledgerImpactBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(230, 232, 234, 0.7)',
    borderRadius: 8,
    padding: 10,
  },
  ledgerImpactIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
    marginTop: 1,
  },
  ledgerImpactText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#45464d',
  },
  strikethroughText: {
    textDecorationLine: 'line-through',
    color: '#76777d',
  },
  highlightText: {
    fontWeight: '600',
    color: '#191c1e',
  },
  refundHighlightText: {
    fontWeight: '600',
    color: '#0051d5',
  },

  /* Form Section Cards */
  formSectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    ...Shadows.level1,
  },
  formSectionHeader: {
    gap: 2,
  },
  formSectionTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: '#191c1e',
  },
  formSectionSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  dropdownButton: {
    height: 44,
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownSelectedText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#191c1e',
  },
  dropdownChevron: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#45464d',
    includeFontPadding: false,
  },

  /* Notes & Message Area */
  notesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notesLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#000000',
    includeFontPadding: false,
  },
  mailIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
  },
  confidentialBadge: {
    backgroundColor: '#e0e3e5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidentialBadgeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9,
    color: '#45464d',
    letterSpacing: 0.5,
  },
  optionalTag: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#76777d',
  },
  multilineTextInput: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#191c1e',
    minHeight: 88,
  },
  auditFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  auditFooterText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
  },
  encryptedLogTag: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10,
    color: '#009668',
  },
  dispatchNoticeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#76777d',
    lineHeight: 16,
  },

  /* Error Banner */
  validationErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffdad6',
    borderRadius: 12,
    padding: 12,
  },
  errorAlertIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  validationErrorText: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#93000a',
  },

  /* Bottom Actions */
  bottomActionsArea: {
    paddingTop: 8,
    gap: 8,
  },
  primaryContinueBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  primaryContinueBtnText: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  continueArrowIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ffffff',
    includeFontPadding: false,
  },
  cancelReturnBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  cancelReturnBtnText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#45464d',
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    ...Shadows.level3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e3e5',
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: '#191c1e',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#45464d',
    includeFontPadding: false,
  },
  modalList: {
    maxHeight: 320,
  },
  reasonOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f2f4f6',
  },
  reasonOptionItemSelected: {
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
  },
  reasonOptionLabel: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#191c1e',
    marginRight: 8,
  },
  reasonOptionLabelSelected: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: '#0051d5',
  },
  checkIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
  },
});
