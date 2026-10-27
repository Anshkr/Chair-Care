import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { PrecisionButton } from '../../components/common/PrecisionButton';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';

import { customerApi } from '../../services/api/customerApi';
import { sanitizeUserErrorMessage } from '../../services/api/apiClient';
import {
  RazorpayCheckoutModal,
  RazorpayCheckoutData,
  RazorpaySuccessResult,
} from '../../components/customer/RazorpayCheckoutModal';
import { paymentApi } from '../../services/api/paymentApi';

/**
 * Screen ID: C08
 * Title: Booking Step 5: Review & Confirm Request
 * Reference: design-reference/customer/booking_step_5_confirm_request_chaircare_mobile
 */
export const BookingStep5ConfirmRequestChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isCustomerAuthorized, setPendingReturnRoute, currentUser } = useAuth();
  const { draft } = useBooking();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState<boolean>(false);
  const [checkoutData, setCheckoutData] = useState<RazorpayCheckoutData | null>(null);
  const [platformFeePercent, setPlatformFeePercent] = useState<number>(10);

  React.useEffect(() => {
    let isMounted = true;
    const fetchPlatformRules = async () => {
      try {
        const res = await customerApi.getPlatformConfig();
        if (res.success && res.data?.platformFeePercent !== undefined && isMounted) {
          setPlatformFeePercent(Number(res.data.platformFeePercent));
        }
      } catch {
        // Fallback to default 10%
      }
    };
    fetchPlatformRules();
    return () => {
      isMounted = false;
    };
  }, []);

  // Read dynamically from BookingContext draft with clean empty fallbacks
  const serviceTitle = draft?.serviceTitle || 'Office Chair Repair';
  const baseServiceFee = Number(draft?.estimatedTotal) || 599;
  const platformFeeAmount = Math.round((baseServiceFee * platformFeePercent) / 100);
  const grandTotalAmount = baseServiceFee + platformFeeAmount;
  const estimatedCost = `₹${grandTotalAmount}`;

  const symptoms = draft?.symptoms || [];
  const problemDescription =
    draft?.problemDescription || 'No description provided';
  const unitFloor = draft?.unitOrFloor || '';
  const serviceAddress =
    draft?.serviceAddress || 'No address specified';
  const visitDate = draft?.visitDate || 'Standard visit';
  const timeSlot = draft?.timeSlot || 'Scheduled slot';
  const photos = draft?.photoUris || [];
  const [chosenPaymentMethod, setChosenPaymentMethod] = useState<'pay_on_delivery' | 'razorpay'>(
    (draft as any)?.paymentMethod || 'pay_on_delivery'
  );

  const isBookingReady = !!(
    draft?.serviceAddress &&
    draft.serviceAddress.trim() &&
    draft.serviceAddress !== 'No address specified'
  );

  const handleConfirmRequest = async () => {
    if (!isBookingReady) {
      return;
    }

    if (!isCustomerAuthorized) {
      setPendingReturnRoute('BookingStep5');
      navigation.navigate('AuthenticationGate', { returnTo: 'BookingStep5' });
      return;
    }

    // Option 1: Pay on Delivery -> Simply place the booking request directly
    if (chosenPaymentMethod === 'pay_on_delivery') {
      setIsSubmitting(true);
      try {
        const res = await customerApi.createBooking({
          serviceId: draft?.serviceId,
          chairModel: draft?.chairType || 'Office Ergonomic Chair',
          issueDescription: problemDescription,
          address: serviceAddress,
          unitFloor: unitFloor,
          timeSlot: timeSlot,
          visitDate: visitDate,
          totalAmount: grandTotalAmount,
          paymentMethod: 'pay_on_delivery',
          latitude: draft?.latitude,
          longitude: draft?.longitude,
        });

        setIsSubmitting(false);
        if (res.success && res.data) {
          navigation.navigate('FindingTechnician', {
            requestId: res.data.id,
            trackingCode: res.data.trackingCode,
          });
        } else {
          if (res.error?.includes('sign in') || res.error?.includes('login') || res.error?.includes('Authentication')) {
            setPendingReturnRoute('BookingStep5');
            navigation.navigate('AuthenticationGate', { returnTo: 'BookingStep5' });
          } else {
            Alert.alert('Booking Error', sanitizeUserErrorMessage(res.error) || 'Could not place service booking. Please check your information and try again.');
          }
        }
      } catch (err: any) {
        setIsSubmitting(false);
        Alert.alert('Booking Error', sanitizeUserErrorMessage(err) || 'An unexpected error occurred while placing your booking. Please try again.');
      }
      return;
    }

    // Option 2: Razorpay Online -> Show Razorpay payment gateway
    setIsSubmitting(true);
    try {
      const totalNum = grandTotalAmount;
      const orderRes = await paymentApi.createOrder('NEW_BOOKING', totalNum);

      if (orderRes.success && orderRes.data?.orderId) {
        const preparedCheckout: RazorpayCheckoutData = {
          orderId: orderRes.data.orderId,
          amountInRupees: orderRes.data.amountInRupees || totalNum,
          currency: orderRes.data.currency || 'INR',
          keyId:
            orderRes.data.keyId ||
            process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ||
            '',
          isTestMode: Boolean(orderRes.data.isTestMode),
          isSimulator: Boolean(orderRes.data.isSimulator),
          prefill: {
            name: currentUser?.name || orderRes.data.prefill?.name || 'Valued Customer',
            email: currentUser?.email || orderRes.data.prefill?.email || '',
            contact: currentUser?.phone || orderRes.data.prefill?.contact || '',
          },
          serviceDetails: {
            requestId: 'NEW_BOOKING',
            trackingCode: orderRes.data.serviceDetails?.trackingCode || 'CC-ONLINE',
            chairModel: draft?.chairType || 'Office Ergonomic Chair',
            address: serviceAddress,
          },
        };

        setCheckoutData(preparedCheckout);
        setIsSubmitting(false);
        setIsCheckoutModalVisible(true);
      } else {
        throw new Error(orderRes.error || 'Failed to create payment order.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert(
        'Payment Gateway Error',
        err.message || 'Could not initialize Razorpay payment gateway. Please try again or select Pay on Delivery.'
      );
    }
  };

  const handlePaymentSuccess = async (result: RazorpaySuccessResult) => {
    setIsCheckoutModalVisible(false);
    setIsSubmitting(true);

    try {
      const res = await customerApi.createBooking({
        serviceId: draft?.serviceId,
        chairModel: draft?.chairType || 'Office Ergonomic Chair',
        issueDescription: problemDescription,
        address: serviceAddress,
        unitFloor: unitFloor,
        timeSlot: timeSlot,
        visitDate: visitDate,
        totalAmount: draft?.estimatedTotal || 599,
        paymentMethod: 'razorpay',
        latitude: draft?.latitude,
        longitude: draft?.longitude,
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
      });

      setIsSubmitting(false);
      if (res.success && res.data) {
        navigation.navigate('FindingTechnician', {
          requestId: res.data.id,
          trackingCode: res.data.trackingCode,
        });
      } else {
        Alert.alert(
          'Booking Confirmation',
          `Payment authorized (${result.razorpay_payment_id}). ${sanitizeUserErrorMessage(res.error) || 'We are dispatching your technician.'}`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (res.data?.id) {
                  navigation.navigate('FindingTechnician', {
                    requestId: res.data.id,
                    trackingCode: res.data.trackingCode,
                  });
                }
              },
            },
          ]
        );
      }
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert(
        'Booking Confirmation Error',
        `Payment was successful (${result.razorpay_payment_id}), but booking confirmation encountered a network issue. Please check your bookings tab.`
      );
    }
  };

  const handlePaymentError = (errorMsg: string) => {
    setIsCheckoutModalVisible(false);
    Alert.alert(
      'Payment Incomplete',
      errorMsg || 'Online payment was not completed. You can try again or select Pay on Delivery.'
    );
  };

  return (
    <ScreenContainer hasPadding={false}>
      {/* Top Progress & Navigation Header */}
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
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>STEP 05 / 05</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => {
            if (isAuthenticated) {
              navigation.navigate('CustomerProfileTab');
            } else {
              navigation.navigate('AuthenticationGate', { returnTo: 'BookingStep5' });
            }
          }}
          activeOpacity={0.7}
          accessibilityLabel="Customer Profile"
        >
          <AppIcon name="User" size={18} color="#FFFFFF" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 100% Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: '100%' }]} />
        </View>

        {/* Title and Subtitle */}
        <View style={styles.headingSection}>
          <Text style={styles.mainHeading}>Review Your Request</Text>
          <Text style={styles.subHeading}>
            Make sure everything looks correct before requesting a technician.
          </Text>
        </View>

        {/* Editable Review Cards Matrix */}
        <View style={styles.cardsMatrix}>
          {/* 1. Selected Service Card */}
          <View style={styles.reviewCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.cardIconBox}>
                  <AppIcon name="Settings" size={18} />
                </View>
                <View style={styles.cardTitleGroup}>
                  <Text style={styles.cardCategoryTag}>SERVICE TYPE</Text>
                  <Text style={styles.cardMainTitle}>{serviceTitle}</Text>
                  <Text style={styles.cardSubText}>
                    Complete precision diagnostic assessment & recalibration
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('BookingStep1')}
                activeOpacity={0.7}
              >
                <AppIcon name="Edit" size={18} />
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.feeStrip}>
              <Text style={styles.feeStripLabel}>Base Service Fee</Text>
              <Text style={styles.feeStripValue}>Starts at ₹{baseServiceFee}</Text>
            </View>
          </View>

          {/* 2. Problem & Media Card */}
          <View style={styles.reviewCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.cardIconBox}>
                  <AppIcon name="Armchair" size={18} />
                </View>
                <View style={styles.cardTitleGroup}>
                  <Text style={styles.cardCategoryTag}>SYMPTOM DIAGNOSTIC</Text>
                  <Text style={styles.cardMainTitle} numberOfLines={1}>
                    {symptoms[0] || 'Ergonomic check requested'}
                  </Text>
                  <Text style={styles.cardSubText} numberOfLines={2}>
                    {problemDescription}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('BookingStep2')}
                activeOpacity={0.7}
              >
                <AppIcon name="Edit" size={18} />
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Diagnostic Symptom Tags */}
            {symptoms.length > 0 && (
              <View style={styles.tagsRow}>
                {symptoms.map((symptom, idx) => (
                  <View
                    key={idx}
                    style={idx === 0 ? styles.tagPrimary : styles.tagNeutral}
                  >
                    {idx === 0 && <View style={styles.tagPrimaryDot} />}
                    <Text
                      style={
                        idx === 0 ? styles.tagPrimaryText : styles.tagNeutralText
                      }
                    >
                      {symptom}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Uploaded Diagnostic Thumbnails Grid */}
            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                {photos.slice(0, 4).map((uri, idx) => (
                  <View key={idx} style={styles.photoGridItem}>
                    <Image source={{ uri }} style={styles.photoGridImage} />
                    <View style={styles.photoTag}>
                      <Text style={styles.photoTagText}>Photo {idx + 1}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 3. Service Location Card */}
          <View style={styles.reviewCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.cardIconBox}>
                  <AppIcon name="MapPin" size={18} />
                </View>
                <View style={styles.cardTitleGroup}>
                  <Text style={styles.cardCategoryTag}>SERVICE LOCATION</Text>
                  {unitFloor ? <Text style={styles.cardMainTitle}>{unitFloor}</Text> : null}
                  <Text style={styles.cardAddressBold} numberOfLines={2}>
                    {serviceAddress}
                  </Text>
                  <View style={styles.locationNoteBox}>
                    <AppIcon name="Info" size={18} />
                    <Text style={styles.locationNoteText}>
                      Please ensure clear access to the work area on technician arrival.
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('BookingStep3')}
                activeOpacity={0.7}
              >
                <AppIcon name="Edit" size={18} />
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4. Time Window Card */}
          <View style={styles.reviewCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.cardIconBox}>
                  <AppIcon name="CalendarCheck" size={18} />
                </View>
                <View style={styles.cardTitleGroup}>
                  <Text style={styles.cardCategoryTag}>ARRIVAL SLOT</Text>
                  <Text style={styles.cardMainTitle}>{visitDate}</Text>
                  <View style={styles.timeSlotRow}>
                    <AppIcon name="Clock" size={18} />
                    <Text style={styles.timeSlotText}>{timeSlot}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('BookingStep4')}
                activeOpacity={0.7}
              >
                <AppIcon name="Edit" size={18} />
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 5. Payment Method Card */}
          <View style={styles.reviewCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.cardIconBox}>
                  <AppIcon name="CreditCard" size={18} color={Colors.secondaryCobalt} />
                </View>
                <View style={styles.cardTitleGroup}>
                  <Text style={styles.cardCategoryTag}>PAYMENT PREFERENCE</Text>
                  <Text style={styles.cardMainTitle}>
                    {chosenPaymentMethod === 'razorpay' ? 'Razorpay Online' : 'Pay on Delivery'}
                  </Text>
                  <Text style={styles.cardSubText}>
                    Select how you would like to pay for your service:
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.paymentSelectRow}>
              {/* Option 1: Pay on Delivery */}
              <TouchableOpacity
                style={[
                  styles.paymentOptionBox,
                  chosenPaymentMethod === 'pay_on_delivery' && styles.paymentOptionBoxActive,
                ]}
                onPress={() => setChosenPaymentMethod('pay_on_delivery')}
                activeOpacity={0.85}
              >
                <View style={styles.paymentOptionTop}>
                  <View
                    style={[
                      styles.paymentRadio,
                      chosenPaymentMethod === 'pay_on_delivery' && styles.paymentRadioActive,
                    ]}
                  >
                    {chosenPaymentMethod === 'pay_on_delivery' && <View style={styles.paymentRadioDot} />}
                  </View>
                  <View style={styles.popularTag}>
                    <Text style={styles.popularTagText}>NO ADVANCE</Text>
                  </View>
                </View>

                <View style={styles.paymentOptionBody}>
                  <AppIcon
                    name="Truck"
                    size={20}
                    color={chosenPaymentMethod === 'pay_on_delivery' ? Colors.secondaryCobalt : Colors.onSurfaceVariant}
                  />
                  <Text style={styles.paymentOptionTitle}>Pay on Delivery</Text>
                  <Text style={styles.paymentOptionDesc}>Cash or UPI after inspection</Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: Razorpay Online */}
              <TouchableOpacity
                style={[
                  styles.paymentOptionBox,
                  chosenPaymentMethod === 'razorpay' && styles.paymentOptionBoxActive,
                ]}
                onPress={() => setChosenPaymentMethod('razorpay')}
                activeOpacity={0.85}
              >
                <View style={styles.paymentOptionTop}>
                  <View
                    style={[
                      styles.paymentRadio,
                      chosenPaymentMethod === 'razorpay' && styles.paymentRadioActive,
                    ]}
                  >
                    {chosenPaymentMethod === 'razorpay' && <View style={styles.paymentRadioDot} />}
                  </View>
                  <View style={styles.razorpayTag}>
                    <Text style={styles.razorpayTagText}>INSTANT</Text>
                  </View>
                </View>

                <View style={styles.paymentOptionBody}>
                  <AppIcon
                    name="Zap"
                    size={20}
                    color={chosenPaymentMethod === 'razorpay' ? '#0284c7' : Colors.onSurfaceVariant}
                  />
                  <Text style={styles.paymentOptionTitle}>Razorpay Online</Text>
                  <Text style={styles.paymentOptionDesc}>UPI, Cards & NetBanking</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Cost Breakdown Component */}
        <View style={styles.costBreakdownCard}>
          <View style={styles.costHeader}>
            <Text style={styles.costHeaderTitle}>Estimated Cost Breakdown</Text>
            <View style={styles.invoicePreviewBadge}>
              <Text style={styles.invoicePreviewText}>INVOICE PREVIEW</Text>
            </View>
          </View>

          <View style={styles.costRowsList}>
            <View style={styles.costRow}>
              <Text style={styles.costRowLabel}>
                Callout & Mechanical Diagnostic
              </Text>
              <Text style={styles.costRowValue}>₹{baseServiceFee}</Text>
            </View>

            {/* Platform Service Fee Row */}
            <View style={styles.costRow}>
              <View>
                <Text style={styles.costRowLabel}>
                  Platform Fee ({platformFeePercent}%)
                </Text>
                <Text style={styles.costAssessedItalic}>
                  Platform operations & verified dispatch fee
                </Text>
              </View>
              <Text style={[styles.costRowValue, { color: Colors.primary, fontWeight: '700' }]}>
                ₹{platformFeeAmount}
              </Text>
            </View>

            <View style={styles.costRow}>
              <Text style={styles.costRowLabel}>
                Initial 14-Point Hardware Check
              </Text>
              <Text style={styles.costIncludedValue}>Included</Text>
            </View>

            <View style={styles.costRow}>
              <Text style={styles.costRowLabel}>Precision Spare Parts</Text>
              <Text style={styles.costAssessedItalic}>
                Assessed post-inspection
              </Text>
            </View>

            {/* Total Highlight Row */}
            <View style={styles.totalBox}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.totalTitle}>Estimated Grand Total</Text>
                <Text style={styles.totalSubtitle}>
                  Includes ₹{baseServiceFee} base fee + ₹{platformFeeAmount} ({platformFeePercent}%) platform fee
                </Text>
              </View>
              <Text style={styles.totalAmount}>₹{grandTotalAmount}</Text>
            </View>
          </View>

          {/* Trust Notice Strip */}
          <View style={styles.trustStrip}>
            <AppIcon name="ShieldCheck" size={18} />
            <Text style={styles.trustStripText}>
              <Text style={styles.trustStripBold}>
                {chosenPaymentMethod === 'razorpay'
                  ? 'Protected by Razorpay & 90-Day Warranty. '
                  : 'Zero advance payment required. '}
              </Text>
              {chosenPaymentMethod === 'razorpay'
                ? 'Your payment is safely held in escrow until technician completes the inspection.'
                : 'Inspect the chair, test tilt resistance, and pay safely via UPI or card only when completely satisfied.'}
            </Text>
          </View>
        </View>

        {/* Three Reassurance Badges */}
        <View style={styles.reassuranceGrid}>
          <View style={styles.reassuranceCard}>
            <View style={styles.reassuranceIconCircle}>
              <AppIcon name="ShieldCheck" size={18} />
            </View>
            <Text style={styles.reassuranceTitle}>90-Day</Text>
            <Text style={styles.reassuranceSub}>Guarantee</Text>
          </View>

          <View style={styles.reassuranceCard}>
            <View style={styles.reassuranceIconCircle}>
              <AppIcon name="Wrench" size={18} color="#2563EB" />
            </View>
            <Text style={styles.reassuranceTitle}>Certified</Text>
            <Text style={styles.reassuranceSub}>Master Techs</Text>
          </View>

          <View style={styles.reassuranceCard}>
            <View style={styles.reassuranceIconCircle}>
              <AppIcon name="CalendarCheck" size={18} />
            </View>
            <Text style={styles.reassuranceTitle}>Free</Text>
            <Text style={styles.reassuranceSub}>Cancellation</Text>
          </View>
        </View>

        {/* Bottom Confirm Action Section */}
        <View style={styles.bottomActionSection}>
          <TouchableOpacity
            style={[styles.confirmBtn, (!isBookingReady || isSubmitting) && { opacity: 0.5 }]}
            onPress={handleConfirmRequest}
            disabled={isSubmitting || !isBookingReady}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.onPrimary} size="small" />
            ) : !isBookingReady ? (
              <Text style={styles.confirmBtnText}>Complete Required Booking Steps *</Text>
            ) : (
              <>
                <Text style={styles.confirmBtnText}>
                  {chosenPaymentMethod === 'razorpay'
                    ? `Confirm & Pay ₹${grandTotalAmount} Online`
                    : `Confirm Request • ₹${grandTotalAmount} (Pay on Delivery)`}
                </Text>
                <Text style={styles.confirmBtnArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.termsNote}>
            {chosenPaymentMethod === 'razorpay'
              ? 'Secured with 256-bit encryption. 100% money-back guarantee.'
              : 'By continuing, you agree to ChairCare terms. No advance deposit needed.'}
          </Text>
        </View>
      </ScrollView>

      {/* Razorpay Gateway Modal */}
      <RazorpayCheckoutModal
        visible={isCheckoutModalVisible}
        checkoutData={checkoutData}
        onClose={() => setIsCheckoutModalVisible(false)}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    height: 60,
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
    gap: 12,
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
  stepBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  stepBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 15,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceVariant,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.secondaryCobalt,
    borderRadius: 3,
  },
  headingSection: {
    gap: 4,
  },
  mainHeading: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  subHeading: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  cardsMatrix: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 20,
  },
  cardTitleGroup: {
    flex: 1,
    gap: 2,
  },
  cardCategoryTag: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  cardMainTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  cardSubText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  cardAddressBold: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurface,
    fontWeight: '600',
    lineHeight: 16,
  },
  locationNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 6,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  locationNoteIcon: {
    fontSize: 12,
  },
  locationNoteText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  alarmIcon: {
    fontSize: 12,
  },
  timeSlotText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  editIcon: {
    fontSize: 11,
  },
  editText: {
    ...Typography.labelMd,
    fontSize: 11,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  feeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  feeStripLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  feeStripValue: {
    ...Typography.labelMono,
    fontSize: 12,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  tagPrimaryDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.secondaryCobalt,
  },
  tagPrimaryText: {
    ...Typography.labelMd,
    fontSize: 11,
    color: Colors.onSecondaryFixed,
    fontWeight: '700',
  },
  tagNeutral: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  tagNeutralText: {
    ...Typography.labelMd,
    fontSize: 11,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  photoGridItem: {
    flex: 1,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
  },
  photoTag: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  photoTagText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  costBreakdownCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  costHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costHeaderTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  invoicePreviewBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  invoicePreviewText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  costRowsList: {
    gap: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costRowLabel: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  costRowValue: {
    ...Typography.labelMono,
    fontSize: 13,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  costIncludedValue: {
    ...Typography.labelMono,
    fontSize: 12,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  costAssessedItalic: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    padding: 12,
    borderRadius: BorderRadius.lg,
    marginTop: 4,
  },
  totalTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  totalSubtitle: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.secondaryCobalt,
    fontWeight: '600',
  },
  totalAmount: {
    ...Typography.headlineMd,
    fontSize: 22,
    color: Colors.onSurface,
    fontWeight: '800',
  },
  trustStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(219, 225, 255, 0.35)',
    padding: 10,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  trustShieldIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  trustStripText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurface,
    flex: 1,
    lineHeight: 16,
  },
  trustStripBold: {
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  reassuranceGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  reassuranceCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 10,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  reassuranceIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  reassuranceIcon: {
    fontSize: 14,
  },
  reassuranceTitle: {
    ...Typography.labelMd,
    fontSize: 11,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  reassuranceSub: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  bottomActionSection: {
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  confirmBtn: {
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  confirmBtnText: {
    ...Typography.titleLg,
    fontSize: 16,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  confirmBtnArrow: {
    fontSize: 18,
    color: Colors.onPrimary,
    fontWeight: 'bold',
  },
  termsNote: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  paymentSelectRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  paymentOptionBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
    justifyContent: 'space-between',
  },
  paymentOptionBoxActive: {
    borderColor: Colors.secondaryCobalt,
    backgroundColor: '#F0F9FF',
  },
  paymentOptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentRadioActive: {
    borderColor: Colors.secondaryCobalt,
  },
  paymentRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondaryCobalt,
  },
  popularTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: 0.4,
  },
  razorpayTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  razorpayTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0369A1',
    letterSpacing: 0.4,
  },
  paymentOptionBody: {
    gap: 4,
  },
  paymentOptionTitle: {
    ...Typography.titleSm,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  paymentOptionDesc: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    lineHeight: 14,
  },
});
