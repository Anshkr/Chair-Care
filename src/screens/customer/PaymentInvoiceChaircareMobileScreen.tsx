import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useBooking } from '../../context/BookingContext';

type PaymentMethodType = 'upi' | 'card' | 'netbanking';

/**
 * Screen ID: C15
 * Title: Payment Invoice
 * Reference: design-reference/customer/payment_invoice_chaircare_mobile
 */
export const PaymentInvoiceChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { draft } = useBooking();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('upi');
  const [upiId, setUpiId] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const technician = {
    name: 'Certified Partner Specialist',
    rating: 4.95,
    completedJobsCount: 140,
    phone: '+91 800 555 0199',
  };

  const serviceTitle = draft?.serviceTitle || 'Office Chair Repair';
  const chairModel = draft?.chairType || 'ErgoFlex 360 Task Chair';
  const totalAmount = draft?.estimatedTotal || 749;

  const handleVerifyUpi = () => {
    if (!upiId.trim()) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
    }, 600);
  };

  const handleSelectSuffix = (suffix: string) => {
    const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId;
    setUpiId(`${prefix}${suffix}`);
  };

  const handlePayNow = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      navigation.navigate('PaymentSuccess');
    }, 800);
  };

  return (
    <ScreenContainer hasPadding={false}>
      {/* Fixed Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.brandSubtitle}>ErgoFix Pro</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Payment Invoice
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('CustomerProfileTab')}
          activeOpacity={0.7}
        >
          <AppIcon name="User" size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 130 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Briefing Context */}
        <View style={styles.briefingSection}>
          <View style={styles.requestTagPill}>
            <AppIcon name="ShieldCheck" size={18} />
            <Text style={styles.requestTagText} numberOfLines={1}>
              Request #CC-8492 • {serviceTitle}
            </Text>
          </View>
          <Text style={styles.briefingHeading}>Review your invoice</Text>
          <Text style={styles.briefingSub}>
            Please review the certified service charges before completing your
            payment.
          </Text>
        </View>

        {/* Precision Diagnostic Asset Card */}
        <View style={styles.assetCard}>
          <View style={styles.assetImgWrap}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80',
              }}
              style={styles.assetImg}
            />
          </View>
          <View style={styles.assetMeta}>
            <View style={styles.assetTitleRow}>
              <Text style={styles.assetTitleText} numberOfLines={1}>
                {chairModel}
              </Text>
              <View style={styles.calibratedTag}>
                <Text style={styles.calibratedTagText}>CALIBRATED</Text>
              </View>
            </View>
            <Text style={styles.assetSerialText} numberOfLines={1}>
              Serial: EF-90812-P • Tech: {technician.name}
            </Text>
          </View>
        </View>

        {/* Itemized Invoice Card */}
        <View style={styles.invoiceCard}>
          <View style={styles.invoiceAccentBar} />

          <View style={styles.invoiceCardHeader}>
            <View style={styles.invoiceTitleRow}>
              <View style={styles.invoiceIconBox}>
                <AppIcon name="Wrench" size={18} />
              </View>
              <View style={styles.invoiceHeaderTextGroup}>
                <Text style={styles.invoiceHeading}>{serviceTitle}</Text>
                <Text style={styles.invoiceMetaTag}>
                  COMPLETED • 42 MIN SESSION
                </Text>
              </View>
            </View>
            <AppIcon name="Receipt" size={18} color={Colors.onSurfaceVariant} />
          </View>

          {/* Itemized Breakdown List */}
          <View style={styles.breakdownList}>
            {/* Item 1 */}
            <View style={styles.breakdownRow}>
              <View style={styles.itemTextGroup}>
                <Text style={styles.itemMainTitle}>
                  Base Diagnostic & Calibration
                </Text>
                <Text style={styles.itemSubDesc}>
                  Class-4 cylinder safety inspection & base torque check
                </Text>
              </View>
              <Text style={styles.itemPriceText}>₹499</Text>
            </View>

            {/* Item 2 */}
            <View style={styles.breakdownRow}>
              <View style={styles.itemTextGroup}>
                <Text style={styles.itemMainTitle}>
                  OEM Gas Cylinder Ring & Shims
                </Text>
                <Text style={styles.itemSubDesc}>
                  Authorized replacement spare part set
                </Text>
              </View>
              <Text style={styles.itemPriceText}>₹250</Text>
            </View>

            {/* Item 3 - Complimentary */}
            <View style={styles.breakdownRow}>
              <View style={styles.itemTextGroup}>
                <View style={styles.itemComplimentaryRow}>
                  <Text style={styles.itemMainTitle}>
                    Specialized Synthetic PTFE Lubrication
                  </Text>
                  <View style={styles.complimentaryBadge}>
                    <Text style={styles.complimentaryText}>Complimentary</Text>
                  </View>
                </View>
                <Text style={styles.itemSubDesc}>
                  Multi-angle pivot joints & recline damper
                </Text>
              </View>
              <View style={styles.priceDiscountGroup}>
                <Text style={styles.strikePrice}>₹120</Text>
                <Text style={styles.freePrice}>₹0</Text>
              </View>
            </View>

            {/* Item 4 - Safety Fee Waived */}
            <View style={styles.breakdownRow}>
              <View style={styles.itemTextGroup}>
                <Text style={styles.itemMainTitle}>
                  Platform & Safety Assurance Fee
                </Text>
                <Text style={styles.itemSubDesc}>
                  COVID sanitized gear & 30-day service warranty
                </Text>
              </View>
              <Text style={styles.freePrice}>₹0</Text>
            </View>
          </View>

          {/* Separator Line */}
          <View style={styles.dividerLine} />

          {/* Subtotal & Taxes */}
          <View style={styles.subtotalGroup}>
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
              <Text style={styles.subtotalValue}>₹{totalAmount}</Text>
            </View>
            <View style={styles.subtotalRow}>
              <View style={styles.taxLabelGroup}>
                <Text style={styles.subtotalLabel}>GST & Technical Cess</Text>
                <AppIcon name="Info" size={14} />
              </View>
              <Text style={styles.includedTagText}>INCLUDED</Text>
            </View>
          </View>

          {/* Total Amount Highlight Block */}
          <View style={styles.totalHighlightBlock}>
            <View style={styles.totalAmountRow}>
              <Text style={styles.totalLabelText}>Total Amount</Text>
              <View style={styles.totalValueWrap}>
                <Text style={styles.currencyTag}>INR</Text>
                <Text style={styles.totalAmountNumber}>₹{totalAmount}</Text>
              </View>
            </View>
            <View style={styles.finalBillingNoticeRow}>
              <View style={styles.greenDot} />
              <Text style={styles.finalBillingNoticeText}>
                Dynamic final billing based on confirmed parts
              </Text>
            </View>
          </View>
        </View>

        {/* Transparency Guarantee Callout */}
        <View style={styles.guaranteeCard}>
          <View style={styles.guaranteeIconBox}>
            <AppIcon name="ShieldCheck" size={18} />
          </View>
          <View style={styles.guaranteeContent}>
            <Text style={styles.guaranteeTitle}>
              ErgoFix Precision Assurance
            </Text>
            <Text style={styles.guaranteeText}>
              Any additional work or parts were confirmed and authorized with
              you before being added to this invoice. No surprise extras.
            </Text>
          </View>
        </View>

        {/* Payment Method Selector Section */}
        <View style={styles.paymentMethodSection}>
          <View style={styles.paymentMethodHeader}>
            <Text style={styles.paymentMethodTitle}>Payment method</Text>
            <Text style={styles.encryptedTag}>ENCRYPTED 256-BIT</Text>
          </View>

          <View style={styles.paymentOptionsList}>
            {/* Option 1: UPI */}
            <TouchableOpacity
              style={[
                styles.paymentOptionCard,
                selectedMethod === 'upi' && styles.paymentOptionCardSelected,
              ]}
              onPress={() => setSelectedMethod('upi')}
              activeOpacity={0.85}
            >
              <View style={styles.optionTopRow}>
                <View style={styles.optionLeftGroup}>
                  <View
                    style={[
                      styles.radioCircle,
                      selectedMethod === 'upi' && styles.radioCircleSelected,
                    ]}
                  >
                    {selectedMethod === 'upi' && (
                      <View style={styles.radioInnerDot} />
                    )}
                  </View>
                  <View style={styles.optionLabelGroup}>
                    <Text style={styles.optionTitle}>UPI Instant Transfer</Text>
                    <Text style={styles.optionSub}>
                      Google Pay, PhonePe, Paytm, BHIM
                    </Text>
                  </View>
                </View>
                <View style={styles.upiBadge}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Text style={styles.upiBadgeText}>UPI</Text><AppIcon name="Zap" size={12} color="#059669" /></View>
                </View>
              </View>

              {/* UPI ID Input Section (Only if selected) */}
              {selectedMethod === 'upi' && (
                <View style={styles.upiInputBox}>
                  <Text style={styles.upiInputLabel}>
                    ENTER UPI ID OR NUMBER
                  </Text>
                  <View style={styles.upiInputRow}>
                    <TextInput
                      style={styles.upiTextInput}
                      value={upiId}
                      onChangeText={(text) => {
                        setUpiId(text);
                        setIsVerified(false);
                      }}
                      placeholder="e.g. mobile@upi"
                      placeholderTextColor={Colors.outline}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={[
                        styles.verifyBtn,
                        isVerified && styles.verifyBtnSuccess,
                      ]}
                      onPress={handleVerifyUpi}
                      disabled={isVerifying}
                    >
                      {isVerifying ? (
                        <ActivityIndicator
                          size="small"
                          color={Colors.onSurface}
                        />
                      ) : (
                        <Text style={styles.verifyBtnText}>
                          {isVerified ? '✓ Verified' : 'Verify'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Suffix Quick Selector Chips */}
                  <View style={styles.suffixChipsRow}>
                    {['@okhdfcbank', '@ybl', '@paytm', '@okaxis'].map(
                      (sfx, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.suffixChip}
                          onPress={() => handleSelectSuffix(sfx)}
                        >
                          <Text style={styles.suffixChipText}>{sfx}</Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Option 2: Credit / Debit Card */}
            <TouchableOpacity
              style={[
                styles.paymentOptionCard,
                selectedMethod === 'card' && styles.paymentOptionCardSelected,
              ]}
              onPress={() => setSelectedMethod('card')}
              activeOpacity={0.85}
            >
              <View style={styles.optionTopRow}>
                <View style={styles.optionLeftGroup}>
                  <View
                    style={[
                      styles.radioCircle,
                      selectedMethod === 'card' && styles.radioCircleSelected,
                    ]}
                  >
                    {selectedMethod === 'card' && (
                      <View style={styles.radioInnerDot} />
                    )}
                  </View>
                  <View style={styles.optionLabelGroup}>
                    <Text style={styles.optionTitle}>Credit or Debit Card</Text>
                    <Text style={styles.optionSub}>
                      Visa, Mastercard, RuPay
                    </Text>
                  </View>
                </View>
                <AppIcon name="CreditCard" size={18} />
              </View>
            </TouchableOpacity>

            {/* Option 3: Net Banking / Digital Wallet */}
            <TouchableOpacity
              style={[
                styles.paymentOptionCard,
                selectedMethod === 'netbanking' &&
                  styles.paymentOptionCardSelected,
              ]}
              onPress={() => setSelectedMethod('netbanking')}
              activeOpacity={0.85}
            >
              <View style={styles.optionTopRow}>
                <View style={styles.optionLeftGroup}>
                  <View
                    style={[
                      styles.radioCircle,
                      selectedMethod === 'netbanking' &&
                        styles.radioCircleSelected,
                    ]}
                  >
                    {selectedMethod === 'netbanking' && (
                      <View style={styles.radioInnerDot} />
                    )}
                  </View>
                  <View style={styles.optionLabelGroup}>
                    <Text style={styles.optionTitle}>
                      Net Banking / Digital Wallet
                    </Text>
                    <Text style={styles.optionSub}>
                      All major banks & Amazon Pay
                    </Text>
                  </View>
                </View>
                <AppIcon name="Landmark" size={18} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar with 256-Bit Footer */}
      <View
        style={[
          styles.stickyBottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) + 6 },
        ]}
      >
        <View style={styles.dueAmountHeaderRow}>
          <View style={styles.dueAmountGroup}>
            <Text style={styles.dueAmountLabel}>DUE AMOUNT</Text>
            <Text style={styles.dueAmountValue}>₹{totalAmount}</Text>
          </View>
          <View style={styles.instantReceiptBadge}>
            <AppIcon name="Lock" size={18} />
            <Text style={styles.instantReceiptText}>Instant Receipt</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.payNowBtn, isProcessing && styles.payNowBtnProcessing]}
          onPress={handlePayNow}
          disabled={isProcessing}
          activeOpacity={0.88}
        >
          {isProcessing ? (
            <View style={styles.processingRow}>
              <ActivityIndicator size="small" color={Colors.onPrimary} />
              <Text style={styles.payNowBtnText}>Securing Session...</Text>
            </View>
          ) : (
            <View style={styles.payNowContentRow}>
              <Text style={styles.payNowBtnText}>Pay ₹{totalAmount}</Text>
              <Text style={styles.payNowBtnArrow}>→</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.encryptionFootnote}>
          <AppIcon name="ShieldCheck" size={14} />
          <Text style={styles.encryptionText}>
            256-Bit Bank Grade Encryption • RBI Compliant Gateway
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  headerTitleGroup: {
    flex: 1,
  },
  brandSubtitle: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  profileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
  briefingSection: {
    gap: 4,
  },
  requestTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  tagShieldIcon: {
    fontSize: 11,
  },
  requestTagText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  briefingHeading: {
    ...Typography.headlineMd,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: 4,
  },
  briefingSub: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  assetCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  assetImgWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainer,
  },
  assetImg: {
    width: '100%',
    height: '100%',
  },
  assetMeta: {
    flex: 1,
    gap: 2,
  },
  assetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  assetTitleText: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
    flex: 1,
  },
  calibratedTag: {
    backgroundColor: Colors.tertiaryFixed,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  calibratedTagText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.tertiaryContainer,
  },
  assetSerialText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  invoiceCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  invoiceAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  invoiceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  invoiceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  invoiceIconBox: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceIcon: {
    fontSize: 14,
  },
  invoiceHeaderTextGroup: {
    gap: 1,
  },
  invoiceHeading: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  invoiceMetaTag: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  receiptIcon: {
    fontSize: 18,
  },
  breakdownList: {
    gap: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemTextGroup: {
    flex: 1,
    gap: 2,
  },
  itemMainTitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  itemSubDesc: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  itemPriceText: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  itemComplimentaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  complimentaryBadge: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  complimentaryText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSecondaryFixedVariant,
    fontWeight: '700',
  },
  priceDiscountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  strikePrice: {
    ...Typography.bodySm,
    fontSize: 11,
    textDecorationLine: 'line-through',
    color: Colors.outline,
  },
  freePrice: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  dividerLine: {
    height: 1,
    backgroundColor: Colors.outlineHairline,
    marginVertical: 2,
  },
  subtotalGroup: {
    gap: 6,
  },
  subtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtotalLabel: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  subtotalValue: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  taxLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoMiniIcon: {
    fontSize: 11,
  },
  includedTagText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  totalHighlightBlock: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 12,
    gap: 6,
    marginTop: 4,
  },
  totalAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  totalLabelText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  totalValueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  currencyTag: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  totalAmountNumber: {
    ...Typography.headlineMd,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  finalBillingNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiaryFixedDim,
  },
  finalBillingNoticeText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  guaranteeCard: {
    backgroundColor: 'rgba(219, 225, 255, 0.4)',
    borderRadius: BorderRadius.xl,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  guaranteeIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  guaranteeShieldIcon: {
    fontSize: 12,
  },
  guaranteeContent: {
    flex: 1,
    gap: 2,
  },
  guaranteeTitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  guaranteeText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 15,
  },
  paymentMethodSection: {
    gap: 10,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentMethodTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  encryptedTag: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  paymentOptionsList: {
    gap: 10,
  },
  paymentOptionCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  paymentOptionCardSelected: {
    borderColor: Colors.secondaryCobalt,
  },
  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    backgroundColor: Colors.secondaryCobalt,
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.onPrimary,
  },
  optionLabelGroup: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  optionSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  upiBadge: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  upiBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  cardIcon: {
    fontSize: 20,
  },
  upiInputBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 8,
  },
  upiInputLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  upiInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  upiTextInput: {
    flex: 1,
    height: 38,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    fontSize: 13,
    color: Colors.onSurface,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  verifyBtn: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnSuccess: {
    backgroundColor: Colors.tertiaryFixed,
  },
  verifyBtnText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  suffixChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suffixChip: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  suffixChipText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  stickyBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
    ...Shadows.level3,
  },
  dueAmountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dueAmountGroup: {
    gap: 1,
  },
  dueAmountLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  dueAmountValue: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  instantReceiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockIcon: {
    fontSize: 12,
  },
  instantReceiptText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onTertiaryContainer,
    fontWeight: '700',
  },
  payNowBtn: {
    width: '100%',
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  payNowBtnProcessing: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  payNowContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payNowBtnText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  payNowBtnArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  encryptionFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  verifiedMiniIcon: {
    fontSize: 11,
  },
  encryptionText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
});
