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
  Linking,
} from 'react-native';
import { AppIcon } from '../common/AppIcon';
import { Shadows } from '../../constants/theme';
import { paymentApi } from '../../services/api/paymentApi';

let WebViewComponent: any = null;
let IntentLauncherComponent: any = null;
if (Platform.OS !== 'web') {
  try {
    WebViewComponent = require('react-native-webview').WebView;
  } catch (e) {
    console.warn('react-native-webview is not available:', e);
  }
  if (Platform.OS === 'android') {
    try {
      IntentLauncherComponent = require('expo-intent-launcher');
    } catch (e) {
      console.warn('expo-intent-launcher is not available:', e);
    }
  }
}

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

type SectionType = 'cards' | 'upi' | 'amazon_pay' | 'mobikwik' | null;

/**
 * Ensure official Razorpay Checkout SDK script is loaded in the browser
 */
const ensureRazorpayLoaded = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.getElementById('razorpay-checkout-sdk-script') as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).Razorpay) {
        resolve(true);
      } else {
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', () => resolve(false));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-sdk-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Could not load Razorpay checkout script');
      resolve(false);
    };
    document.head.appendChild(script);
  });
};

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  visible,
  checkoutData,
  onClose,
  onSuccess,
  onError,
}) => {
  const [expandedSection, setExpandedSection] = useState<SectionType>('upi');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [upiId, setUpiId] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');

  // Native mobile in-app WebView state
  const [nativeWebViewVisible, setNativeWebViewVisible] = useState<boolean>(false);
  const [nativeHtml, setNativeHtml] = useState<string>('');
  const [activePaymentMethod, setActivePaymentMethod] = useState<string>('Razorpay Gateway');

  useEffect(() => {
    if (visible) {
      if (Platform.OS === 'web') {
        ensureRazorpayLoaded();
      }
      setIsProcessing(false);
      setNativeWebViewVisible(false);
      setNativeHtml('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
    }
  }, [visible]);

  if (!checkoutData) return null;

  const totalAmount = checkoutData.amountInRupees || 299;
  const liveKeyId =
    checkoutData.keyId && checkoutData.keyId.startsWith('rzp_') && checkoutData.keyId !== 'rzp_test_chaircare_mock_id'
      ? checkoutData.keyId
      : process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';

  /**
   * Handle incoming messages from the in-app Razorpay WebView (Native mobile)
   */
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SUCCESS') {
        setNativeWebViewVisible(false);
        setIsProcessing(false);
        console.log('✅ [Razorpay Native Payment Succeeded]:', data.response);
        onSuccess({
          razorpay_order_id: data.response?.razorpay_order_id || checkoutData.orderId,
          razorpay_payment_id: data.response?.razorpay_payment_id || `pay_${Date.now()}`,
          razorpay_signature: data.response?.razorpay_signature || '',
          payment_method: activePaymentMethod || 'Razorpay Mobile Gateway',
        });
      } else if (data.type === 'DISMISSED') {
        setNativeWebViewVisible(false);
        setIsProcessing(false);
        console.log('Razorpay native checkout dismissed by customer.');
      } else if (data.type === 'FAILED') {
        setNativeWebViewVisible(false);
        setIsProcessing(false);
        console.warn('❌ [Razorpay Native Payment Failed]:', data.error);
        Alert.alert(
          'Payment Incomplete',
          data.error?.description || 'Your payment was not completed. Please try again.'
        );
      } else if (data.type === 'ERROR') {
        setNativeWebViewVisible(false);
        setIsProcessing(false);
        console.error('❌ [Razorpay Native Error]:', data.message);
        Alert.alert('Payment Error', data.message || 'Could not launch payment gateway.');
      }
    } catch (err) {
      console.error('Error handling WebView message:', err);
    }
  };

  /**
   * Launch external UPI app (Google Pay, PhonePe, Paytm, etc.) from WebView redirect
   */
  const handlePaymentAppRedirect = async (url: string) => {
    try {
      let targetData = url;
      let targetPackage: string | undefined = undefined;

      if (url.startsWith('intent://') || url.startsWith('intent:')) {
        // 1. Check for data= param inside intent (e.g. data=upi%3A%2F%2Fpay...)
        const dataMatch = url.match(/data=([^;]+)/);
        if (dataMatch) {
          targetData = decodeURIComponent(dataMatch[1]);
        } else {
          // Extract scheme (defaulting to 'upi') and path before '#Intent'
          const schemeMatch = url.match(/scheme=([^;]+)/);
          const scheme = schemeMatch ? schemeMatch[1] : 'upi';
          const parts = url.split('#Intent');
          const rawPath = parts[0].replace(/^intent:\/\//, '').replace(/^intent:/, '');
          targetData = `${scheme}://${rawPath}`;
        }

        // Extract target package name if specified
        const packageMatch = url.match(/package=([^;]+)/);
        if (packageMatch) {
          targetPackage = packageMatch[1];
        }
      }

      console.log('🚀 [Launching UPI Payment App]:', { targetData, targetPackage });

      if (Platform.OS === 'android') {
        try {
          if (IntentLauncherComponent && IntentLauncherComponent.startActivityAsync) {
            const activityParams: any = {
              data: targetData,
            };
            if (targetPackage) {
              activityParams.packageName = targetPackage;
            }
            await IntentLauncherComponent.startActivityAsync('android.intent.action.VIEW', activityParams);
            return;
          }
        } catch (launcherErr) {
          console.warn('IntentLauncher failed, falling back to Linking:', launcherErr);
        }
      }

      // Fallback: standard Linking
      const canOpen = await Linking.canOpenURL(targetData).catch(() => false);
      if (canOpen) {
        await Linking.openURL(targetData);
      } else {
        await Linking.openURL(targetData);
      }
    } catch (err) {
      console.warn('Could not launch payment application:', err);
      Alert.alert(
        'Payment App Not Opened',
        'Could not automatically launch the selected UPI app. Please ensure it is installed or use the UPI QR Code scanner.'
      );
    }
  };

  /**
   * Launch Real Razorpay Live Gateway (Web or Native Mobile WebView)
   */
  const handleLaunchRealRazorpay = async (prefilledVpa?: string, preferredMethod?: string) => {
    setIsProcessing(true);

    try {
      const methodLabel = preferredMethod || (prefilledVpa ? `UPI (${prefilledVpa})` : 'Razorpay Live Gateway');
      setActivePaymentMethod(methodLabel);

      let resolvedOrderId = checkoutData.orderId;
      const isAuthenticOrderId =
        Boolean(
          resolvedOrderId &&
          resolvedOrderId.startsWith('order_') &&
          !resolvedOrderId.includes('local') &&
          !resolvedOrderId.includes('fallback') &&
          !resolvedOrderId.includes('test')
        );

      if (!isAuthenticOrderId) {
        try {
          const freshOrder = await paymentApi.createOrder(
            checkoutData.serviceDetails?.requestId || 'NEW_BOOKING',
            totalAmount
          );
          if (freshOrder.success && freshOrder.data?.orderId) {
            resolvedOrderId = freshOrder.data.orderId;
          }
        } catch (fetchErr) {
          console.warn('Could not auto-generate live order:', fetchErr);
        }
      }

      const options: any = {
        key: liveKeyId,
        amount: Math.round(totalAmount * 100), // In paise (e.g. ₹299 -> 29900)
        currency: checkoutData.currency || 'INR',
        name: 'ChairCare Services',
        description: `Chair Service #${checkoutData.serviceDetails?.trackingCode || 'CC-JOB'}`,
        image: 'https://cdn-icons-png.flaticon.com/512/2662/2662503.png',
        order_id:
          resolvedOrderId &&
          resolvedOrderId.startsWith('order_') &&
          !resolvedOrderId.includes('local') &&
          !resolvedOrderId.includes('fallback')
            ? resolvedOrderId
            : undefined,
        prefill: {
          name: checkoutData.prefill?.name || 'Customer',
          email: checkoutData.prefill?.email || 'customer@chaircare.in',
          contact: checkoutData.prefill?.contact || '9876543210',
          vpa: prefilledVpa || undefined,
        },
        theme: {
          color: '#0F172A',
        },
      };

      // Focus on the specific method selected by the user cleanly
      if (preferredMethod === 'Card' || preferredMethod === 'Credit/Debit Card' || preferredMethod === 'Saved Card') {
        options.config = {
          display: {
            blocks: {
              card: {
                name: 'Pay with Card',
                instruments: [{ method: 'card' }],
              },
            },
            sequence: ['block.card'],
            preferences: { show_default_blocks: true },
          },
        };
      } else if (prefilledVpa) {
        options.prefill.vpa = prefilledVpa;
        options.config = {
          display: {
            blocks: {
              upi: {
                name: `Pay with UPI (${prefilledVpa})`,
                instruments: [
                  {
                    method: 'upi',
                  },
                ],
              },
            },
            sequence: ['block.upi'],
            preferences: { show_default_blocks: true },
          },
        };
      } else if (preferredMethod === 'UPI QR') {
        options.config = {
          display: {
            blocks: {
              upi_qr: {
                name: 'Scan Real UPI QR Code',
                instruments: [
                  {
                    method: 'upi',
                    flows: ['qr'],
                  },
                ],
              },
            },
            sequence: ['block.upi_qr'],
            preferences: { show_default_blocks: true },
          },
        };
      } else if (preferredMethod === 'Amazon Pay' || preferredMethod === 'Mobikwik') {
        options.config = {
          display: {
            blocks: {
              wallets: {
                name: 'Pay with Wallet',
                instruments: [
                  {
                    method: 'wallet',
                    wallets: [preferredMethod === 'Amazon Pay' ? 'amazonpay' : 'mobikwik'],
                  },
                ],
              },
            },
            sequence: ['block.wallets'],
            preferences: { show_default_blocks: true },
          },
        };
      }

      // --- 1. WEB CHECKOUT (DESKTOP/MOBILE BROWSER) ---
      if (Platform.OS === 'web') {
        const isLoaded = await ensureRazorpayLoaded();

        if (typeof window !== 'undefined' && (window as any).Razorpay && isLoaded) {
          options.handler = function (response: any) {
            setIsProcessing(false);
            console.log('✅ [Razorpay Real Payment Succeeded]:', response);
            onSuccess({
              razorpay_order_id: response.razorpay_order_id || checkoutData.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || '',
              payment_method: methodLabel,
            });
          };

          options.modal = {
            ondismiss: function () {
              setIsProcessing(false);
              console.log('Razorpay modal dismissed by customer.');
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', function (resp: any) {
            setIsProcessing(false);
            console.warn('❌ [Razorpay Payment Failed]:', resp.error);
            Alert.alert(
              'Payment Incomplete',
              resp.error?.description || 'Your payment was not completed. Please try again.'
            );
          });

          setIsProcessing(false);
          rzp.open();
          return;
        }

        setIsProcessing(false);
        Alert.alert(
          'Razorpay Live Connection',
          'Unable to load Razorpay payment network. Please check your internet connection and try again.'
        );
        return;
      }

      // --- 2. NATIVE MOBILE CHECKOUT (ANDROID / IOS VIA IN-APP WEBVIEW) ---
      if (!WebViewComponent) {
        setIsProcessing(false);
        Alert.alert(
          'Payment Browser Initializing',
          'In-app checkout module is not ready on this device. Please check your connection and retry.'
        );
        return;
      }

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body, html {
      background-color: #0F172A;
      width: 100%;
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #FFFFFF;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 4px solid rgba(255, 255, 255, 0.15);
      border-top-color: #38BDF8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 18px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .text {
      font-size: 15px;
      font-weight: 600;
      color: #E2E8F0;
      text-align: center;
      padding: 0 24px;
    }
    .subtext {
      font-size: 12px;
      color: #94A3B8;
      margin-top: 6px;
    }
  </style>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <div class="spinner"></div>
  <div class="text">Connecting to Razorpay Live Gateway...</div>
  <div class="subtext">Please complete your payment securely</div>

  <script>
    function sendBack(data) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    window.onload = function() {
      try {
        var options = ${JSON.stringify(options)};
        options.handler = function(response) {
          sendBack({ type: 'SUCCESS', response: response });
        };
        options.modal = {
          ondismiss: function() {
            sendBack({ type: 'DISMISSED' });
          }
        };
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function(resp) {
          sendBack({ type: 'FAILED', error: resp.error });
        });
        rzp.open();
      } catch (err) {
        sendBack({ type: 'ERROR', message: err.message || 'Error launching Razorpay' });
      }
    };
  </script>
</body>
</html>`;

      setNativeHtml(html);
      setNativeWebViewVisible(true);
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      console.error('Error opening Razorpay checkout:', err);
      Alert.alert('Payment Error', err?.message || 'Could not launch payment gateway.');
    }
  };

  const handleUpiSubmit = () => {
    const trimmed = upiId.trim();
    if (!trimmed || !trimmed.includes('@') || trimmed.length < 5) {
      Alert.alert(
        'Valid UPI ID Required',
        'Please enter a valid UPI address (e.g. random@okicici, mobile@paytm) to receive the payment request.'
      );
      return;
    }
    // Launch Razorpay's live collect engine with customer's UPI ID
    handleLaunchRealRazorpay(trimmed, `UPI (${trimmed})`);
  };

  const toggleSection = (section: SectionType) => {
    if (isProcessing) return;
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const handleAppendSuffix = (suffix: string) => {
    const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId;
    setUpiId(`${prefix}${suffix}`);
  };

  return (
    <Modal
      visible={visible}
      transparent={!nativeWebViewVisible}
      animationType="slide"
      onRequestClose={() => {
        if (nativeWebViewVisible) {
          setNativeWebViewVisible(false);
          setIsProcessing(false);
        } else if (!isProcessing) {
          onClose();
        }
      }}
    >
      {nativeWebViewVisible ? (
        <View style={styles.nativeWebViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              style={styles.webViewCloseBtn}
              onPress={() => {
                setNativeWebViewVisible(false);
                setIsProcessing(false);
              }}
              activeOpacity={0.7}
              accessibilityLabel="Close payment gateway"
            >
              <AppIcon name="X" size={20} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.webViewHeaderTitleBox}>
              <Text style={styles.webViewHeaderTitle}>Razorpay Secure Checkout</Text>
              <Text style={styles.webViewHeaderSub}>₹{totalAmount} • Live 256-bit Encrypted</Text>
            </View>

            <View style={{ width: 38 }} />
          </View>

          {WebViewComponent ? (
            <WebViewComponent
              source={{
                html: nativeHtml,
                baseUrl: 'https://api.razorpay.com',
              }}
              style={styles.webViewStyle}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              thirdPartyCookiesEnabled={true}
              sharedCookiesEnabled={true}
              mixedContentMode="always"
              originWhitelist={['*']}
              onMessage={handleWebViewMessage}
              onShouldStartLoadWithRequest={(request: any) => {
                const url = request.url || '';
                const isPaymentAppScheme =
                  url.startsWith('upi://') ||
                  url.startsWith('phonepe://') ||
                  url.startsWith('tez://') ||
                  url.startsWith('paytmmp://') ||
                  url.startsWith('bhim://') ||
                  url.startsWith('gpay://') ||
                  url.startsWith('credpay://') ||
                  url.startsWith('intent://') ||
                  url.startsWith('intent:');

                if (isPaymentAppScheme) {
                  handlePaymentAppRedirect(url);
                  return false;
                }
                return true;
              }}
            />
          ) : (
            <View style={styles.webViewFallback}>
              <ActivityIndicator size="large" color="#0F172A" />
              <Text style={styles.webViewFallbackText}>
                In-app checkout module is not available on this device.
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.modalBackdrop}>
          <View style={styles.sheetContainer}>
          {/* Top Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onClose}
              disabled={isProcessing}
              activeOpacity={0.7}
              accessibilityLabel="Dismiss payment"
            >
              <AppIcon name="ChevronDown" size={24} color="#1E293B" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Select Payment Method</Text>

            <View style={styles.amountPill}>
              <Text style={styles.amountPillText}>₹{totalAmount}</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Primary Action Button: Real Razorpay Live Gateway (UPI, QR, Cards) */}
            <TouchableOpacity
              style={styles.heroGatewayBtn}
              onPress={() => handleLaunchRealRazorpay(undefined, 'Razorpay Live')}
              disabled={isProcessing}
              activeOpacity={0.88}
            >
              <View style={styles.heroGatewayLeft}>
                <View style={styles.rzpLogoCircle}>
                  <Text style={styles.rzpLogoSymbol}>₹</Text>
                </View>
                <View>
                  <Text style={styles.heroGatewayTitle}>Open Razorpay Live Gateway</Text>
                  <Text style={styles.heroGatewaySub}>
                    Live Google Pay, PhonePe, Real QR Code & Cards
                  </Text>
                </View>
              </View>
              <View style={styles.payNowBadge}>
                <Text style={styles.payNowBadgeText}>Pay ₹{totalAmount}</Text>
              </View>
            </TouchableOpacity>

            {/* 2. CARDS SECTION */}
            <Text style={styles.sectionHeading}>CARDS</Text>
            <View style={styles.cardBox}>
              <TouchableOpacity
                style={styles.itemRow}
                onPress={() => toggleSection('cards')}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconSquare}>
                    <AppIcon name="CreditCard" size={18} color="#334155" />
                  </View>
                  <Text style={styles.itemTitle}>Add credit or debit cards</Text>
                </View>
                <Text style={styles.coralPlus}>
                  {expandedSection === 'cards' ? '−' : '+'}
                </Text>
              </TouchableOpacity>

              {expandedSection === 'cards' && (
                <View style={styles.expandedContent}>
                  <Text style={styles.formLabel}>Card Number</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="4111 2222 3333 4444"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={19}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                  />

                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.formLabel}>Expiry Date</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="MM / YY"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        maxLength={5}
                        value={cardExpiry}
                        onChangeText={setCardExpiry}
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.formLabel}>CVV</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="123"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        maxLength={4}
                        secureTextEntry
                        value={cardCvv}
                        onChangeText={setCardCvv}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.fullPayBtn}
                    onPress={() => handleLaunchRealRazorpay(undefined, 'Credit/Debit Card')}
                    disabled={isProcessing}
                    activeOpacity={0.85}
                  >
                    <AppIcon name="Lock" size={15} color="#FFFFFF" />
                    <Text style={styles.fullPayBtnText}>Pay ₹{totalAmount} with Card</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 3. PAY BY ANY UPI APP SECTION */}
            <Text style={styles.sectionHeading}>PAY BY ANY UPI APP</Text>
            <View style={styles.cardBox}>
              {/* Option A: Quick Live QR Code Scanner */}
              <TouchableOpacity
                style={styles.itemRow}
                onPress={() => handleLaunchRealRazorpay(undefined, 'UPI QR')}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconSquare}>
                    <AppIcon name="QrCode" size={18} color="#0284C7" />
                  </View>
                  <View style={styles.itemTextCol}>
                    <Text style={styles.itemTitle}>Scan Real Razorpay UPI QR</Text>
                    <Text style={styles.itemSubtitle}>
                      Google Pay, PhonePe, Paytm registered live QR
                    </Text>
                  </View>
                </View>
                <AppIcon name="ChevronRight" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Option B: Enter UPI ID to send real collect request */}
              <TouchableOpacity
                style={styles.itemRow}
                onPress={() => toggleSection('upi')}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.upiBadge}>
                    <Text style={styles.upiText}>UPI</Text>
                  </View>
                  <Text style={styles.itemTitle}>Add new UPI ID</Text>
                </View>
                <Text style={styles.coralPlus}>
                  {expandedSection === 'upi' ? '−' : '+'}
                </Text>
              </TouchableOpacity>

              {expandedSection === 'upi' && (
                <View style={styles.expandedContent}>
                  <Text style={styles.inputPrompt}>
                    Enter your UPI ID to trigger payment in your UPI app:
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="random@okicici"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    value={upiId}
                    onChangeText={setUpiId}
                  />

                  {/* Suffix chips */}
                  <View style={styles.suffixRow}>
                    {['@okicici', '@okhdfcbank', '@okaxis', '@paytm', '@ybl'].map((suf) => (
                      <TouchableOpacity
                        key={suf}
                        style={styles.suffixChip}
                        onPress={() => handleAppendSuffix(suf)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.suffixChipText}>{suf}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.fullPayBtn,
                      (!upiId.includes('@') || isProcessing) && styles.payActionBtnDisabled,
                    ]}
                    onPress={handleUpiSubmit}
                    disabled={!upiId.includes('@') || isProcessing}
                    activeOpacity={0.85}
                  >
                    <AppIcon name="ArrowRight" size={16} color="#FFFFFF" />
                    <Text style={styles.fullPayBtnText}>
                      Click to Proceed
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.secureHelperText}>
                    A secure payment request of ₹{totalAmount} will be sent to {upiId || 'your UPI ID'}. Open your UPI app to approve with MPIN.
                  </Text>
                </View>
              )}
            </View>

            {/* 4. WALLETS SECTION */}
            <Text style={styles.sectionHeading}>WALLETS</Text>
            <View style={styles.cardBox}>
              <TouchableOpacity
                style={styles.itemRow}
                onPress={() => handleLaunchRealRazorpay(undefined, 'Amazon Pay')}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.amazonBadge}>
                    <Text style={styles.amazonText}>pay</Text>
                  </View>
                  <Text style={styles.itemTitle}>Amazon Pay Balance</Text>
                </View>
                <AppIcon name="ChevronRight" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.itemRow}
                onPress={() => handleLaunchRealRazorpay(undefined, 'Mobikwik')}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.mobikwikBadge}>
                    <Text style={styles.mobikwikText}>M</Text>
                  </View>
                  <Text style={styles.itemTitle}>Mobikwik</Text>
                </View>
                <AppIcon name="ChevronRight" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Security Guarantee Strip */}
            <View style={styles.securityStrip}>
              <AppIcon name="ShieldCheck" size={16} color="#10B981" />
              <Text style={styles.securityText}>
                Secured by Razorpay • 256-bit Bank Grade Encryption
              </Text>
            </View>
          </ScrollView>

          {/* Processing Loading Indicator */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <View style={styles.processingModalCard}>
                <ActivityIndicator size="large" color="#0F172A" />
                <Text style={styles.processingCardTitle}>Connecting to Razorpay...</Text>
                <Text style={styles.processingStatusText}>
                  Opening official secure payment gateway
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  nativeWebViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 28 : 44,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  webViewCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewHeaderTitleBox: {
    alignItems: 'center',
    flex: 1,
  },
  webViewHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  webViewHeaderSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 2,
  },
  webViewStyle: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  webViewFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  webViewFallbackText: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#F8F9FD',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: 24,
    ...Shadows.level2,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  amountPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  amountPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  scrollArea: {
    maxHeight: 560,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 32,
  },

  /* Primary Gateway Launcher Card */
  heroGatewayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    ...Shadows.level2,
  },
  heroGatewayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rzpLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rzpLogoSymbol: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  heroGatewayTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroGatewaySub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  payNowBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  payNowBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8F9CAE',
    letterSpacing: 0.9,
    marginBottom: 8,
    marginTop: 14,
    textTransform: 'uppercase',
  },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 12,
  },
  itemSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  coralPlus: {
    fontSize: 22,
    fontWeight: '600',
    color: '#EB4B5C',
    marginRight: 4,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 16,
  },

  /* Badges & Icons */
  visaBadge: {
    width: 44,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visaText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1A1F71',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  iconSquare: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiBadge: {
    width: 36,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  amazonBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#131921',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amazonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FF9900',
  },
  mobikwikBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobikwikText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  /* Expanded Forms */
  expandedContent: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  inputPrompt: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 8,
  },
  savedCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cvvInput: {
    width: 80,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  payActionBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payActionBtnDisabled: {
    opacity: 0.5,
  },
  payActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secureHelperText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },

  /* Card Inputs */
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
  },
  formInput: {
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formCol: {
    flex: 1,
  },
  fullPayBtn: {
    height: 46,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  fullPayBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Suffix Chips */
  suffixRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    marginBottom: 6,
  },
  suffixChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  suffixChipText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },

  /* Footers */
  securityStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },

  /* Processing Overlay */
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  processingModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    ...Shadows.level2,
  },
  processingCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  processingStatusText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
});
