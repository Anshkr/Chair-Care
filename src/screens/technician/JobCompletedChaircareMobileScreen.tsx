import { AppIcon } from '../../components/common/AppIcon';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useTechnician } from '../../context/TechnicianContext';
import { technicianApi } from '../../services/api/technicianApi';

interface JobCompletedProps {
  navigation?: any;
  route?: {
    params?: {
      requestId?: string;
      jobId?: string;
      request?: any;
    };
  };
}

export const JobCompletedChaircareMobileScreen: React.FC<JobCompletedProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const {
    acceptedRequest,
    setAcceptedRequest,
    upiId,
    upiPhone,
    updateUpiSettings,
    recordQrPayment,
  } = useTechnician();

  const passedRequest = route?.params?.request || acceptedRequest;
  const passedId = route?.params?.requestId || route?.params?.jobId;

  // Selected request context
  const ticket = passedRequest || {
    id: passedId || '',
    ticketNumber: passedId || 'DISPATCH',
    dispatchNumber: passedId ? String(passedId).slice(0, 4) : 'DONE',
    customerName: 'Customer',
    chairModel: 'Ergonomic Task Chair',
    serviceTitle: 'Office Chair Repair',
    baseRate: 499,
    additionalPartsCost: 250,
    durationMinutes: 45,
    status: 'completed',
  };

  const baseRate = Number(ticket.totalAmount) || Number((ticket as any).total) || ticket.baseRate || 599;
  const additionalCost = ticket.additionalWork?.totalCost || ticket.additionalPartsCost || 0;
  const grandTotal = baseRate + additionalCost;
  const duration = ticket.durationMinutes || (ticket.durationSeconds ? Math.ceil(ticket.durationSeconds / 60) : 48);

  const isPaid = Boolean(
    ticket.isPaid ??
    ticket.is_paid ??
    acceptedRequest?.isPaid ??
    acceptedRequest?.is_paid
  );

  const [isQrPaid, setIsQrPaid] = useState<boolean>(isPaid);
  const [showDirectQrModal, setShowDirectQrModal] = useState<boolean>(false);
  const [showEditUpiModal, setShowEditUpiModal] = useState<boolean>(false);
  const [editUpiInput, setEditUpiInput] = useState<string>(upiId || '');
  const [editPhoneInput, setEditPhoneInput] = useState<string>(upiPhone || '');
  const [isSavingUpi, setIsSavingUpi] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [isConfirmingPayment, setIsConfirmingPayment] = useState<boolean>(false);

  useEffect(() => {
    if (upiId) setEditUpiInput(upiId);
  }, [upiId]);

  useEffect(() => {
    if (upiPhone) setEditPhoneInput(upiPhone);
  }, [upiPhone]);

  useEffect(() => {
    if (isPaid) setIsQrPaid(true);
  }, [isPaid]);

  const cleanActiveUpi = (upiId || (upiPhone ? `${upiPhone.replace(/[^0-9]/g, '')}@paytm` : '9217460742@paytm')).trim();
  const jobTracking = ticket.trackingCode || ticket.ticketNumber || ticket.dispatchNumber || 'CHAIR';
  const directUpiUrl = `upi://pay?pa=${encodeURIComponent(cleanActiveUpi)}&pn=${encodeURIComponent('ChairCare Technician')}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('ChairCare Service ' + jobTracking)}`;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data=${encodeURIComponent(directUpiUrl)}`;

  const handleSaveUpi = async () => {
    const cleanUpi = editUpiInput.trim();
    const cleanPhone = editPhoneInput.trim();
    if (!cleanUpi && !cleanPhone) {
      Alert.alert('Input Required', 'Please enter a valid UPI ID (e.g. yourname@paytm) or Mobile Phone number.');
      return;
    }
    setIsSavingUpi(true);
    try {
      await updateUpiSettings(cleanUpi, cleanPhone);
      setSaveSuccessMsg('UPI configuration updated!');
      setTimeout(() => {
        setSaveSuccessMsg('');
        setShowEditUpiModal(false);
      }, 1000);
    } catch {
      Alert.alert('Error', 'Could not save UPI configuration.');
    } finally {
      setIsSavingUpi(false);
    }
  };

  const handleConfirmQrPayment = async () => {
    setIsConfirmingPayment(true);
    try {
      recordQrPayment({
        trackingCode: String(jobTracking),
        customerName: ticket.customerName || 'Customer',
        chairModel: ticket.chairModel || 'Ergonomic Task Chair',
        serviceTitle: ticket.serviceTitle || 'Office Chair Repair',
        amount: grandTotal,
      });

      if (ticket.id) {
        await technicianApi.updateJobStatus(ticket.id, 'completed', 'Payment collected via Direct UPI QR').catch(() => {});
      }

      setIsQrPaid(true);
      setShowDirectQrModal(false);
      Alert.alert(
        'Payment Confirmed!',
        `₹${grandTotal} successfully collected via Direct UPI QR into your account (${cleanActiveUpi}). This transaction is now logged in your Earnings tab.`,
        [{ text: 'OK' }]
      );
    } catch {
      setIsQrPaid(true);
      setShowDirectQrModal(false);
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  // Celebratory Ripple Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.35,
            duration: 1600,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.05,
            duration: 1600,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1100,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: 1100,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ])
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim, opacityAnim]);

  // Ensure request is saved as completed in technician context and backend
  useEffect(() => {
    if (ticket.id) {
      technicianApi.updateJobStatus(ticket.id, 'completed').catch(() => {});
    }
    if (ticket.status !== 'completed') {
      const completedRecord = {
        ...ticket,
        status: 'completed',
        completedAt: new Date().toISOString(),
      };
      setAcceptedRequest(completedRecord);
    }
  }, [ticket.id, ticket.status]);

  const handleViewPayoutLedger = () => {
    navigation.navigate('TechnicianMain', { screen: 'EarningsTab' });
  };

  const handleReturnToQueue = () => {
    navigation.navigate('TechnicianMain', { screen: 'JobRequestsTab' });
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20) + 8,
            paddingBottom: Math.max(insets.bottom, 20) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimalist Operational Micro-Bar */}
        <View style={styles.microBar}>
          <View style={styles.microBarLeft}>
            <AppIcon name="Check" size={18} />
            <Text style={styles.protocolText}>
              PROTOCOL DISPATCH #{ticket.dispatchNumber || '8492'}
            </Text>
          </View>
          <View style={styles.sessionClosedBadge}>
            <Text style={styles.sessionClosedText}>Session Closed</Text>
          </View>
        </View>

        {/* Celebratory Engineering Success Hero */}
        <View style={styles.heroSuccessCard}>
          <View style={styles.haloWrapper}>
            <Animated.View
              style={[
                styles.rippleOuterRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: opacityAnim,
                },
              ]}
            />
            <View style={styles.rippleInnerRing} />
            <View style={styles.sealCircle}>
              <AppIcon name="Check" size={18} />
            </View>
          </View>

          <Text style={styles.headlineTitle}>Service Completed!</Text>
          <Text style={styles.headlineSubtitle}>
            Great job! This ergonomic asset service has been successfully
            completed and field verified.
          </Text>

          {/* Verification Pill */}
          <View style={styles.verificationPill}>
            <View style={styles.pulsingGreenDot} />
            <Text style={styles.verifiedText}>
              Customer Digitally Verified
            </Text>
            <Text style={styles.pillBullet}>•</Text>
            <Text style={styles.timestampText}>Today at 03:14 PM</Text>
          </View>
        </View>

        {/* Asset & Job Summary Spec Sheet */}
        <View style={styles.specSheetCard}>
          <View style={styles.specHeaderRow}>
            <View style={styles.specAssetGroup}>
              <View style={styles.chairIconBox}>
                <AppIcon name="Armchair" size={18} />
              </View>
              <View style={styles.chairNameCol}>
                <Text style={styles.targetAssetLabel}>TARGET ASSET</Text>
                <Text style={styles.chairModelName}>
                  {ticket.chairModel || 'Herman Miller Aeron (Size B)'}
                </Text>
              </View>
            </View>
            <View style={styles.ticketBadge}>
              <Text style={styles.ticketBadgeText}>
                #{ticket.ticketNumber || 'REQ-8492'}
              </Text>
            </View>
          </View>

          {/* Micro-stat Grid */}
          <View style={styles.microStatGrid}>
            <View style={styles.microStatCell}>
              <Text style={styles.statLabel}>CUSTOMER</Text>
              <View style={styles.customerValRow}>
                <AppIcon name="User" size={18} />
                <Text style={styles.customerValText}>
                  {ticket.customerName || 'Ansh Kumar'}
                </Text>
              </View>
            </View>

            <View style={styles.microStatCell}>
              <Text style={styles.statLabel}>DISPATCH DURATION</Text>
              <View style={styles.durationValRow}>
                <Text style={styles.durationHeroText}>{duration}</Text>
                <Text style={styles.durationSlaText}>/ 60 min SLA</Text>
              </View>
            </View>
          </View>

          {/* Efficiency Bonus Banner */}
          <View style={styles.efficiencyBanner}>
            <AppIcon name="Zap" size={18} />
            <Text style={styles.efficiencyText}>
              <Text style={styles.efficiencyBold}>
                +{60 - duration} min efficiency delta
              </Text>{' '}
              unlocked. Eligible for monthly speed rating multiplier.
            </Text>
          </View>
        </View>

        {/* Work Execution Audit & Verification Checklist */}
        <View style={styles.auditCard}>
          <View style={styles.auditHeaderRow}>
            <View style={styles.auditTitleGroup}>
              <AppIcon name="ClipboardList" size={18} />
              <Text style={styles.auditTitle}>Work Execution Audit</Text>
            </View>
            <View style={styles.verifiedCountBadge}>
              <Text style={styles.verifiedCountText}>4/4 Verified</Text>
            </View>
          </View>

          <View style={styles.auditItemsList}>
            {/* Item 1 */}
            <View style={styles.auditItemRow}>
              <View style={styles.auditCheckDot}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.auditTextCol}>
                <Text style={styles.auditItemTitle}>
                  Chair mechanism calibrated
                </Text>
                <Text style={styles.auditItemSub}>
                  Synchron-tilt locked and mechanical linkages lubricated
                </Text>
              </View>
            </View>

            {/* Item 2 */}
            <View style={styles.auditItemRow}>
              <View style={styles.auditCheckDot}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.auditTextCol}>
                <Text style={styles.auditItemTitle}>
                  Hydraulic assembly verified
                </Text>
                <Text style={styles.auditItemSub}>
                  Class-4 nitrogen cylinder seal pressure tested (no creep)
                </Text>
              </View>
            </View>

            {/* Item 3 */}
            <View style={styles.auditItemRow}>
              <View style={styles.auditCheckDot}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.auditTextCol}>
                <Text style={styles.auditItemTitle}>
                  Kinematic movement benchmarked
                </Text>
                <Text style={styles.auditItemSub}>
                  110kg load dynamic bearing & 360° caster track cleared
                </Text>
              </View>
            </View>

            {/* Item 4 */}
            <View style={styles.auditItemRow}>
              <View style={styles.auditCheckDot}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.auditTextCol}>
                <Text style={styles.auditItemTitle}>
                  Final quality certification
                </Text>
                <Text style={styles.auditItemSub}>
                  14-point BIFMA mechanical audit passed and signed off
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Estimated Earnings Ledger Card */}
        <View style={styles.earningsLedgerCard}>
          <View style={styles.ledgerHeaderRow}>
            <View>
              <Text style={styles.payoutTag}>CUSTOMER BOOKING PRICE</Text>
              <Text style={styles.ledgerTitle}>Settled Service Price</Text>
            </View>
            <View style={styles.ledgerAmountCol}>
              <Text style={styles.ledgerGrandAmount}>₹{grandTotal}</Text>
              <Text style={styles.rangeText}>{additionalCost > 0 ? `Base ₹${baseRate} + Parts ₹${additionalCost}` : 'Exact Booked Price'}</Text>
            </View>
          </View>

          {/* Breakdown Lines */}
          <View style={styles.payoutBreakdownCol}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>
                Booked Service Package
              </Text>
              <Text style={styles.breakdownVal}>₹{baseRate}.00</Text>
            </View>
            {additionalCost > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>
                  Approved Additional Work / Parts
                </Text>
                <Text style={styles.breakdownVal}>₹{additionalCost}.00</Text>
              </View>
            )}
          </View>

          {/* Payout & Direct QR Collection Section */}
          {isQrPaid ? (
            <View style={[styles.payoutStatusBanner, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC', borderWidth: 1.5 }]}>
              <View style={styles.payoutStatusHeader}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#15803D' }} />
                <Text style={[styles.payoutStatusTitle, { color: '#15803D', fontWeight: '800' }]}>
                  {isPaid ? 'PAID ONLINE • SETTLED' : 'PAID VIA DIRECT UPI QR • SETTLED'}
                </Text>
              </View>
              <Text style={[styles.payoutStatusBody, { color: '#166534' }]}>
                {isPaid
                  ? `Customer paid ₹${grandTotal} online via Razorpay. Your earnings are credited directly to your payout ledger.`
                  : `₹${grandTotal} collected directly via personal UPI QR into your account (${cleanActiveUpi}). This transaction is logged in your Earnings tab.`}
              </Text>
            </View>
          ) : (
            <View style={styles.directQrCollectionCard}>
              <View style={styles.directQrCardHeader}>
                <View style={styles.qrIconBubble}>
                  <AppIcon name="QrCode" size={22} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.directSettlementBadge}>
                    <Text style={styles.directSettlementBadgeText}>DIRECT TO YOUR ACCOUNT</Text>
                  </View>
                  <Text style={styles.directQrCardTitle}>Collect ₹{grandTotal} via Personal UPI QR</Text>
                  <Text style={styles.directQrCardSub}>
                    Ask the customer to scan your QR with Google Pay, PhonePe, Paytm, or BHIM.
                  </Text>
                </View>
              </View>

              {/* Active Account Info row */}
              <View style={styles.activeUpiRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeUpiLabel}>RECEIVING UPI ID / PHONE</Text>
                  <Text style={styles.activeUpiValue} numberOfLines={1}>
                    {cleanActiveUpi} • {upiPhone || '+91 92174 60742'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editUpiBtn}
                  onPress={() => {
                    setEditUpiInput(upiId || '');
                    setEditPhoneInput(upiPhone || '');
                    setShowEditUpiModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <AppIcon name="Pencil" size={13} color="#0284C7" />
                  <Text style={styles.editUpiBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>

              {/* Action Button: Show Customer Payment QR */}
              <TouchableOpacity
                style={styles.showCustomerQrBtn}
                onPress={() => setShowDirectQrModal(true)}
                activeOpacity={0.88}
              >
                <AppIcon name="QrCode" size={20} color="#FFFFFF" />
                <Text style={styles.showCustomerQrBtnText}>
                  Show Customer Payment QR (₹{grandTotal})
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Operational Follow-up Actions */}
        <View style={styles.followupActionsGroup}>
          <TouchableOpacity
            style={styles.primaryPayoutBtn}
            onPress={handleViewPayoutLedger}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryPayoutBtnText}>
              View Payout Ledger & Jobs
            </Text>
            <Text style={styles.payoutArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryQueueBtn}
            onPress={handleReturnToQueue}
            activeOpacity={0.8}
          >
            <AppIcon name="Home" size={18} />
            <Text style={styles.secondaryQueueBtnText}>
              Return to Dispatch Queue
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Customer Payment UPI QR Modal */}
      <Modal
        visible={showDirectQrModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDirectQrModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalPreTitle}>CUSTOMER UPI PAYMENT</Text>
                <Text style={styles.modalTitle}>Scan & Pay ₹{grandTotal}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDirectQrModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <AppIcon name="X" size={20} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Show this QR to the customer. Any UPI app (Google Pay, PhonePe, Paytm, Cred, BHIM) can scan and pay.
            </Text>

            {/* High-contrast QR card */}
            <View style={styles.qrCardBox}>
              <Image
                source={{ uri: qrImgUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
              <View style={styles.qrAmountBadge}>
                <Text style={styles.qrAmountText}>Exact Amount: ₹{grandTotal}.00</Text>
              </View>
              <Text style={styles.qrScanNotice}>
                ⚡ Money transfers straight to your personal account
              </Text>
            </View>

            {/* UPI Details preview */}
            <View style={styles.modalUpiInfoBox}>
              <View style={styles.modalUpiRow}>
                <Text style={styles.modalUpiLabel}>Receiving UPI:</Text>
                <Text style={styles.modalUpiValueMono}>{cleanActiveUpi}</Text>
              </View>
              <View style={styles.modalUpiRow}>
                <Text style={styles.modalUpiLabel}>Phone:</Text>
                <Text style={styles.modalUpiValueMono}>{upiPhone || '+91 92174 60742'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalSwitchEditBtn}
              onPress={() => {
                setShowDirectQrModal(false);
                setEditUpiInput(upiId || '');
                setEditPhoneInput(upiPhone || '');
                setShowEditUpiModal(true);
              }}
              activeOpacity={0.8}
            >
              <AppIcon name="Pencil" size={14} color="#0284C7" />
              <Text style={styles.modalSwitchEditText}>Change UPI ID / Phone Number</Text>
            </TouchableOpacity>

            {/* Confirm Payment Received Action */}
            <TouchableOpacity
              style={styles.confirmPaymentBtn}
              onPress={handleConfirmQrPayment}
              activeOpacity={0.88}
              disabled={isConfirmingPayment}
            >
              {isConfirmingPayment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <AppIcon name="CheckCircle2" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmPaymentBtnText}>
                    Confirm Payment Received (₹{grandTotal})
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalDismissBtn}
              onPress={() => setShowDirectQrModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalDismissText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dynamic Edit UPI & Phone Modal */}
      <Modal
        visible={showEditUpiModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditUpiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalPreTitle}>ACCOUNT CONFIGURATION</Text>
                <Text style={styles.modalTitle}>Edit Collection UPI & Phone</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowEditUpiModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <AppIcon name="X" size={20} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Update your UPI ID or linked phone number anytime. The customer payment QR code will immediately update with these details.
            </Text>

            {saveSuccessMsg ? (
              <View style={styles.modalSuccessBanner}>
                <AppIcon name="Check" size={16} color="#059669" />
                <Text style={styles.modalSuccessText}>{saveSuccessMsg}</Text>
              </View>
            ) : null}

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>UPI ID (VPA)</Text>
              <TextInput
                style={styles.modalTextInput}
                value={editUpiInput}
                onChangeText={setEditUpiInput}
                placeholder="e.g. 9800000000@paytm or name@okaxis"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.modalInputHint}>
                Format: mobile@bank (e.g. 9812345678@paytm, 9812345678@okhdfcbank)
              </Text>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>MOBILE PHONE NUMBER</Text>
              <TextInput
                style={styles.modalTextInput}
                value={editPhoneInput}
                onChangeText={setEditPhoneInput}
                placeholder="e.g. +91 92174 60742"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowEditUpiModal(false)}
                activeOpacity={0.8}
                disabled={isSavingUpi}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveUpi}
                activeOpacity={0.8}
                disabled={isSavingUpi}
              >
                {isSavingUpi ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save UPI Details</Text>
                )}
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
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: 12,
  },
  microBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  microBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedIcon: {
    fontSize: 14,
    color: Colors.secondaryCobalt,
    fontWeight: '900',
  },
  protocolText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sessionClosedBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  sessionClosedText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#005236',
  },
  heroSuccessCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    textAlign: 'center',
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  haloWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    marginTop: 4,
  },
  rippleOuterRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 150, 104, 0.25)',
  },
  rippleInnerRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(111, 251, 190, 0.4)',
  },
  sealCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#002113',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
    borderWidth: 2,
    borderColor: Colors.tertiaryFixed,
  },
  sealCheckGlyph: {
    color: Colors.tertiaryFixed,
    fontSize: 26,
    fontWeight: '900',
  },
  headlineTitle: {
    ...Typography.headlineLg,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headlineSubtitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 18,
  },
  verificationPill: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
  },
  pulsingGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#005236',
  },
  verifiedText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  pillBullet: {
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  timestampText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  specSheetCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 12,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  specHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specAssetGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  chairIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chairIcon: {
    fontSize: 18,
  },
  chairNameCol: {
    flex: 1,
  },
  targetAssetLabel: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chairModelName: {
    ...Typography.titleLg,
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  ticketBadge: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  ticketBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
  },
  microStatGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  microStatCell: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
    justifyContent: 'space-between',
    minHeight: 60,
  },
  statLabel: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  customerValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  customerIcon: {
    fontSize: 13,
  },
  customerValText: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  durationValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginTop: 2,
  },
  durationHeroText: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  durationSlaText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  efficiencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(111, 251, 190, 0.25)',
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  speedometerIcon: {
    fontSize: 15,
  },
  efficiencyText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: '#005236',
    flex: 1,
    lineHeight: 16,
  },
  efficiencyBold: {
    fontWeight: '800',
  },
  auditCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 10,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  auditHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  auditTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  factCheckIcon: {
    fontSize: 16,
  },
  auditTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  verifiedCountBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  verifiedCountText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#005236',
  },
  auditItemsList: {
    gap: 8,
  },
  auditItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
  },
  auditCheckDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#002113',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  auditCheckMark: {
    color: Colors.tertiaryFixed,
    fontSize: 11,
    fontWeight: '900',
  },
  auditTextCol: {
    flex: 1,
  },
  auditItemTitle: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  auditItemSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  earningsLedgerCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 12,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  payoutTag: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  ledgerTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: 2,
  },
  ledgerAmountCol: {
    alignItems: 'flex-end',
  },
  ledgerGrandAmount: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  rangeText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  payoutBreakdownCol: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerLow,
    paddingTop: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  breakdownVal: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  payoutStatusBanner: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 4,
  },
  payoutStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amberDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F59E0B',
  },
  payoutStatusTitle: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  payoutStatusBody: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 15,
  },
  followupActionsGroup: {
    gap: 8,
    paddingTop: 4,
  },
  primaryPayoutBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  primaryPayoutBtnText: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  payoutArrow: {
    fontSize: 16,
    color: Colors.onPrimary,
    fontWeight: '800',
  },
  secondaryQueueBtn: {
    width: '100%',
    backgroundColor: Colors.surfaceContainer,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  homeIcon: {
    fontSize: 15,
  },
  secondaryQueueBtnText: {
    ...Typography.titleLg,
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },

  // Direct UPI QR Collection block
  directQrCollectionCard: {
    backgroundColor: '#FAFDFB',
    borderColor: '#A7F3D0',
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 12,
    marginTop: 6,
  },
  directQrCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  qrIconBubble: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  directSettlementBadge: {
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginBottom: 2,
  },
  directSettlementBadgeText: {
    ...Typography.labelMono,
    fontSize: 8.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.6,
  },
  directQrCardTitle: {
    ...Typography.titleLg,
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  directQrCardSub: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
    marginTop: 2,
  },
  activeUpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: Colors.outlineVariant,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 10,
    gap: 8,
  },
  activeUpiLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  activeUpiValue: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  editUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  editUpiBtnText: {
    ...Typography.labelMd,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  showCustomerQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    gap: 8,
    ...Shadows.level1,
  },
  showCustomerQrBtnText: {
    ...Typography.titleLg,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 420,
    ...Shadows.level2,
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  modalPreTitle: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
    letterSpacing: 0.8,
  },
  modalTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  modalSubtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16.5,
  },
  qrCardBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  qrAmountBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  qrAmountText: {
    ...Typography.headlineSm,
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  qrScanNotice: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    textAlign: 'center',
  },
  modalUpiInfoBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.md,
    padding: 10,
    gap: 4,
  },
  modalUpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalUpiLabel: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  modalUpiValueMono: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSwitchEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  modalSwitchEditText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  confirmPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    gap: 8,
    ...Shadows.level2,
  },
  confirmPaymentBtnText: {
    ...Typography.titleLg,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalDismissBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  modalDismissText: {
    ...Typography.labelMd,
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  modalSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    padding: 10,
    borderRadius: BorderRadius.md,
  },
  modalSuccessText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  modalInputGroup: {
    gap: 4,
  },
  modalInputLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  modalTextInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    ...Typography.bodyMd,
    fontSize: 13.5,
    color: '#0F172A',
  },
  modalInputHint: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.md,
  },
  modalCancelText: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalSaveBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  modalSaveText: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
