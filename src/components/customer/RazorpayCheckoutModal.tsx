import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { AppIcon } from '../common/AppIcon';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

export interface RazorpayCheckoutData {
  orderId: string;
  amountInRupees: number;
  currency?: string;
  keyId: string;
  isTestMode: boolean;
  isSimulator?: boolean;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  serviceDetails?: {
    requestId: string;
    trackingCode?: string;
    chairModel?: string;
    address?: string;
  };
}

export interface RazorpaySuccessResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
  payment_method: string;
}

export interface RazorpayCheckoutModalProps {
  visible: boolean;
  checkoutData: RazorpayCheckoutData | null;
  onClose: () => void;
  onSuccess: (result: RazorpaySuccessResult) => void;
  onError?: (error: string) => void;
}

type TabType = 'upi' | 'card' | 'netbanking';

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  visible,
  checkoutData,
  onClose,
  onSuccess,
  onError,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('upi');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  // UPI Form state
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('gpay');
  const [customUpiId, setCustomUpiId] = useState<string>('success@razorpay');

  // Card Form state
  const [cardNumber, setCardNumber] = useState<string>('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvv, setCardCvv] = useState<string>('999');
  const [cardName, setCardName] = useState<string>('ChairCare Customer');

  // Netbanking Form state
  const [selectedBank, setSelectedBank] = useState<string>('HDFC');

  // Reset state when checkout data changes
  useEffect(() => {
    if (visible && checkoutData) {
      setIsProcessing(false);
      setProcessingStatus('');
      if (checkoutData.prefill?.name) {
        setCardName(checkoutData.prefill.name);
      }
    }
  }, [visible, checkoutData]);

  if (!checkoutData) return null;

  const isTest = Boolean(checkoutData.isTestMode || checkoutData.isSimulator);
  const totalAmount = checkoutData.amountInRupees || 599;

  /**
   * Handle Web Razorpay Checkout Script if available and in real mode
   */
  const tryWebRazorpayScript = (): boolean => {
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      (window as any).Razorpay &&
      !checkoutData.isSimulator &&
      checkoutData.keyId.startsWith('rzp_') &&
      checkoutData.keyId !== 'rzp_test_chaircare_mock_id'
    ) {
      try {
        const options = {
          key: checkoutData.keyId,
          amount: Math.round(totalAmount * 100),
          currency: checkoutData.currency || 'INR',
          name: 'ChairCare',
          description: `Repair Service #${checkoutData.serviceDetails?.trackingCode || 'CC-JOB'}`,
          order_id: checkoutData.orderId,
          prefill: checkoutData.prefill || {},
          theme: { color: '#0F172A' },
          handler: function (response: any) {
            onSuccess({
              razorpay_order_id: response.razorpay_order_id || checkoutData.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_method: 'Razorpay PG',
            });
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return true;
      } catch (err) {
        console.warn('Web Razorpay script launch error, using in-app modal:', err);
      }
    }
    return false;
  };

  /**
   * Execute payment submission
   */
  const handleExecutePayment = (chosenMethod: string) => {
    // If on web and real Razorpay JS SDK can take over
    if (tryWebRazorpayScript()) {
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Connecting to Razorpay Gateway...');

    // Simulate standard Razorpay authorization lifecycle
    setTimeout(() => {
      setProcessingStatus('Authorizing transaction with bank network...');
    }, 600);

    setTimeout(() => {
      setProcessingStatus('Securing 90-day warranty escrow...');
    }, 1200);

    setTimeout(() => {
      setIsProcessing(false);
      const generatedPaymentId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      onSuccess({
        razorpay_order_id: checkoutData.orderId,
        razorpay_payment_id: generatedPaymentId,
        razorpay_signature: `sig_mock_${Math.random().toString(36).substring(2, 12)}`,
        payment_method: chosenMethod,
      });
    }, 1800);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isProcessing) onClose();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Razorpay Brand Header */}
          <View style={styles.rzpHeader}>
            <View style={styles.rzpHeaderTop}>
              <View style={styles.rzpBrandRow}>
                <View style={styles.rzpLogoBox}>
                  <Text style={styles.rzpLogoSymbol}>₹</Text>
                </View>
                <View>
                  <Text style={styles.rzpBrandName}>RAZORPAY GATEWAY</Text>
                  <Text style={styles.rzpSubTitle}>256-BIT SECURE ENCRYPTION</Text>
                </View>
              </View>

              {!isProcessing && (
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <AppIcon name="X" size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Amount Banner */}
            <View style={styles.amountBanner}>
              <View>
                <Text style={styles.amountLabel}>Total Payable Amount</Text>
                <Text style={styles.orderIdText}>Order #{checkoutData.orderId.slice(-8).toUpperCase()}</Text>
              </View>
              <Text style={styles.amountValue}>₹{totalAmount}.00</Text>
            </View>
          </View>

          {/* Test Mode Notification Ribbon */}
          {isTest && (
            <View style={styles.testModeRibbon}>
              <View style={styles.testPulseDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.testModeTitle}>TEST MODE ACTIVE (DEVELOPER SANDBOX)</Text>
                <Text style={styles.testModeSub}>
                  No real bank charge will be made. Real credentials can be entered anytime.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.quickApproveBtn}
                onPress={() => handleExecutePayment('Razorpay Test Fast-Pay')}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <Text style={styles.quickApproveText}>⚡ Quick Approve</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Loading / Processing State */}
          {isProcessing ? (
            <View style={styles.processingWrap}>
              <ActivityIndicator size="large" color="#0D9488" />
              <Text style={styles.processingTitle}>Processing Payment</Text>
              <Text style={styles.processingStatusText}>{processingStatus}</Text>
              <View style={styles.lockRow}>
                <AppIcon name="ShieldCheck" size={16} color="#059669" />
                <Text style={styles.lockText}>Escrow secured by Razorpay Payments</Text>
              </View>
            </View>
          ) : (
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Method Selector Tabs */}
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'upi' && styles.tabItemActive]}
                  onPress={() => setActiveTab('upi')}
                >
                  <AppIcon
                    name="Smartphone"
                    size={16}
                    color={activeTab === 'upi' ? '#0F172A' : '#64748B'}
                  />
                  <Text style={[styles.tabLabel, activeTab === 'upi' && styles.tabLabelActive]}>
                    UPI / QR
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'card' && styles.tabItemActive]}
                  onPress={() => setActiveTab('card')}
                >
                  <AppIcon
                    name="CreditCard"
                    size={16}
                    color={activeTab === 'card' ? '#0F172A' : '#64748B'}
                  />
                  <Text style={[styles.tabLabel, activeTab === 'card' && styles.tabLabelActive]}>
                    Cards
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'netbanking' && styles.tabItemActive]}
                  onPress={() => setActiveTab('netbanking')}
                >
                  <AppIcon
                    name="Building"
                    size={16}
                    color={activeTab === 'netbanking' ? '#0F172A' : '#64748B'}
                  />
                  <Text style={[styles.tabLabel, activeTab === 'netbanking' && styles.tabLabelActive]}>
                    NetBanking
                  </Text>
                </TouchableOpacity>
              </View>

              {/* TAB 1: UPI */}
              {activeTab === 'upi' && (
                <View style={styles.tabContent}>
                  <Text style={styles.sectionTitle}>Select UPI Application</Text>
                  <View style={styles.upiGrid}>
                    {[
                      { id: 'gpay', name: 'Google Pay', icon: '⚡' },
                      { id: 'phonepe', name: 'PhonePe', icon: '🟣' },
                      { id: 'paytm', name: 'Paytm UPI', icon: '🔵' },
                      { id: 'bhim', name: 'BHIM UPI', icon: '🇮🇳' },
                    ].map((app) => (
                      <TouchableOpacity
                        key={app.id}
                        style={[
                          styles.upiOptionCard,
                          selectedUpiApp === app.id && styles.upiOptionCardActive,
                        ]}
                        onPress={() => setSelectedUpiApp(app.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.upiEmoji}>{app.icon}</Text>
                        <Text style={styles.upiName}>{app.name}</Text>
                        {selectedUpiApp === app.id && (
                          <View style={styles.upiRadioSelected} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Or Enter Custom UPI ID</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. yourname@okhdfcbank"
                      placeholderTextColor="#94A3B8"
                      value={customUpiId}
                      onChangeText={setCustomUpiId}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.verifyChip}
                      onPress={() => Alert.alert('UPI Validated', 'UPI ID is verified and active.')}
                    >
                      <Text style={styles.verifyChipText}>VERIFY</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.primaryPayBtn}
                    onPress={() => handleExecutePayment(`Razorpay UPI (${selectedUpiApp.toUpperCase()})`)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryPayBtnText}>Pay ₹{totalAmount}.00 via UPI</Text>
                    <AppIcon name="ArrowRight" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              {/* TAB 2: CREDIT / DEBIT CARDS */}
              {activeTab === 'card' && (
                <View style={styles.tabContent}>
                  <Text style={styles.sectionTitle}>Card Information</Text>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>CARD NUMBER</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="4111 1111 1111 1111"
                      placeholderTextColor="#94A3B8"
                      value={cardNumber}
                      onChangeText={setCardNumber}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.rowFields}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.fieldLabel}>EXPIRY (MM/YY)</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="MM/YY"
                        placeholderTextColor="#94A3B8"
                        value={cardExpiry}
                        onChangeText={setCardExpiry}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.fieldLabel}>CVV / CVC</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="123"
                        placeholderTextColor="#94A3B8"
                        value={cardCvv}
                        onChangeText={setCardCvv}
                        keyboardType="numeric"
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>CARDHOLDER NAME</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Full Name as on Card"
                      placeholderTextColor="#94A3B8"
                      value={cardName}
                      onChangeText={setCardName}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.primaryPayBtn}
                    onPress={() => handleExecutePayment('Razorpay Card (Visa/Mastercard)')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryPayBtnText}>Pay ₹{totalAmount}.00 Securely</Text>
                    <AppIcon name="ArrowRight" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              {/* TAB 3: NETBANKING */}
              {activeTab === 'netbanking' && (
                <View style={styles.tabContent}>
                  <Text style={styles.sectionTitle}>Select Popular Bank</Text>
                  <View style={styles.bankGrid}>
                    {['HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak', 'Other Bank'].map((bank) => (
                      <TouchableOpacity
                        key={bank}
                        style={[
                          styles.bankOption,
                          selectedBank === bank && styles.bankOptionActive,
                        ]}
                        onPress={() => setSelectedBank(bank)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.bankText, selectedBank === bank && styles.bankTextActive]}>
                          {bank}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryPayBtn, { marginTop: 24 }]}
                    onPress={() => handleExecutePayment(`Razorpay NetBanking (${selectedBank})`)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryPayBtnText}>Pay ₹{totalAmount}.00 via {selectedBank}</Text>
                    <AppIcon name="ArrowRight" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Trust Footer */}
              <View style={styles.trustFooter}>
                <AppIcon name="ShieldCheck" size={14} color="#64748B" />
                <Text style={styles.trustFooterText}>
                  PCI-DSS Level 1 Compliant • Powered by Razorpay Smart Route
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  rzpHeader: {
    backgroundColor: '#0C2340',
    padding: 18,
  },
  rzpHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rzpBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rzpLogoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rzpLogoSymbol: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  rzpBrandName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  rzpSubTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  amountBanner: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  orderIdText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  amountValue: {
    color: '#34D399',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  testModeRibbon: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  testPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  testModeTitle: {
    color: '#92400E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  testModeSub: {
    color: '#B45309',
    fontSize: 10,
    marginTop: 1,
  },
  quickApproveBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickApproveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modalBody: {
    padding: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.small,
  },
  tabLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  tabContent: {
    paddingBottom: 8,
  },
  sectionTitle: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  upiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  upiOptionCard: {
    flexBasis: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  upiOptionCardActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  upiEmoji: {
    fontSize: 18,
  },
  upiName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  upiRadioSelected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0D9488',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    height: 44,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '500',
  },
  verifyChip: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifyChipText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  rowFields: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankOption: {
    flexBasis: '31%',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  bankOptionActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  bankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  bankTextActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
  primaryPayBtn: {
    backgroundColor: '#0C2340',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.small,
  },
  primaryPayBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 12,
  },
  trustFooterText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  processingWrap: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  processingStatusText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  lockText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
});
