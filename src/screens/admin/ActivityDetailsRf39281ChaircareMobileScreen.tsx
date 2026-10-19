import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface ActivityDetailsProps {
  navigation?: any;
  route?: {
    params?: {
      logId?: string;
      logData?: any;
    };
  };
}

export const ActivityDetailsRf39281ChaircareMobileScreen: React.FC<
  ActivityDetailsProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const passedLog = route?.params?.logData;

  // Accordion state
  const [isCryptoOpen, setIsCryptoOpen] = useState<boolean>(true);

  // Copy states
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2200);
  };

  const handleCopyRef = () => {
    setCopiedRef(true);
    displayToast('Reference RF-39281 copied to clipboard');
    setTimeout(() => {
      setCopiedRef(false);
    }, 2000);
  };

  const handleCopyHash = () => {
    setCopiedHash(true);
    displayToast('Cryptographic SHA256 digest copied');
    setTimeout(() => {
      setCopiedHash(false);
    }, 2000);
  };

  const handleViewTxn = () => {
    displayToast('Opening Transaction TXN-84291...');
  };

  const handleDownloadCertificate = () => {
    displayToast('Generating Compliance Certificate (PDF)...');
  };

  const handleShare = () => {
    displayToast('Audit link prepared for secure sharing');
  };

  return (
    <View style={styles.screenContainer}>
      {/* Fixed Top Header */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top, 10) },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation?.canGoBack()) {
                navigation.goBack();
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow_back_ios_new" size={20} />
          </TouchableOpacity>

          <View style={styles.headerBrandBadge}>
            <AppIcon name="chair" size={20} />
          </View>

          <Text style={styles.headerTitleText} numberOfLines={1}>
            Log Entry Details
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            onPress={handleShare}
            accessibilityLabel="Share entry"
          >
            <AppIcon name="share" size={20} />
          </TouchableOpacity>
          <View style={styles.headerAvatar}>
            <AppIcon name="person" size={20} />
          </View>
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
          { paddingBottom: Math.max(insets.bottom, 20) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Micro Breadcrumb / Sub-header bar */}
        <View style={styles.breadcrumbBar}>
          <View style={styles.breadcrumbLeft}>
            <View style={styles.pulseDot} />
            <Text style={styles.breadcrumbLabel}>EVENT ID:</Text>
            <Text style={styles.breadcrumbValue}>
              {passedLog?.id ? `#EVT-${passedLog.id.replace(/[^0-9]/g, '') || '90482'}-FIN` : '#EVT-90482-FIN'}
            </Text>
          </View>

          <View style={styles.breadcrumbRight}>
            <TouchableOpacity
              style={styles.hashChipBtn}
              onPress={handleCopyHash}
              activeOpacity={0.7}
            >
              <AppIcon name="tag" size={20} />
              <Text style={styles.hashChipText}>Hash</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.receiptIconBtn}
              onPress={() => displayToast('Receipt payload verified')}
              activeOpacity={0.7}
            >
              <AppIcon name="receipt_long" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Header Hero Card */}
        <View style={styles.heroCard}>
          {/* Ambient Glow Accent */}
          <View style={styles.heroAmbientGlow} />

          <View style={styles.heroTopRow}>
            <View style={styles.heroTitleGroup}>
              <View style={styles.heroIconSquare}>
                <AppIcon name="currency_exchange" size={20} />
              </View>

              <View style={styles.heroTextCol}>
                <Text style={styles.heroTitle}>
                  {passedLog?.title || 'Refund Processed'}
                </Text>
                <Text style={styles.heroTimestamp}>
                  {passedLog?.time ? `5 Oct 2026 • ${passedLog.time} IST` : '5 Oct 2026 • 10:18 AM IST'}
                </Text>
              </View>
            </View>

            <View style={styles.completedBadge}>
              <AppIcon name="verified" size={20} />
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          </View>

          {/* Reference Identifier Pill */}
          <View style={styles.referencePill}>
            <View style={styles.referenceTextCol}>
              <Text style={styles.referenceLabel}>Financial Reference</Text>
              <Text style={styles.referenceValue}>RF-39281</Text>
            </View>

            <TouchableOpacity
              style={styles.copyBtn}
              onPress={handleCopyRef}
              activeOpacity={0.7}
            >
              <AppIcon name={copiedRef ? 'done' : 'content_copy'} size={20} />
              <Text style={styles.copyBtnText}>
                {copiedRef ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Authorized Executant (Actor Dossier Card) */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSectionLabel}>Authorized Executant</Text>
            <View style={styles.hardwareKeyBadge}>
              <AppIcon name="security" size={20} />
              <Text style={styles.hardwareKeyText}>Hardware Key</Text>
            </View>
          </View>

          <View style={styles.actorProfileRow}>
            <View style={styles.actorAvatarBox}>
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDX40xY3TUd-VZpU6UL22j6zCFeDGp9qQv0jYe0zd_TlCUI6UiQgRcnTvDRvT9eFkv972h4vRMN31oV8X7iwOk959YQlzuiMoF7HdpTZiioGl2IyMVHiqKGC3Qg1Ry79OdJxPDiWWNwjoW02rU7rhGImh3TqktTDRU_HRhYvc7jCOr3jdw64axRUz_elCDIV9G8pOgp-DDjB_pS-2LghJ5E508RzXixANbU_zJGMrLMB195wtmAkuY',
                }}
                style={styles.actorAvatarImage}
                defaultSource={{ uri: 'https://via.placeholder.com/48' }}
              />
            </View>

            <View style={styles.actorProfileInfo}>
              <View style={styles.actorNameRow}>
                <Text style={styles.actorNameText} numberOfLines={1}>
                  {passedLog?.actorName ? passedLog.actorName.split('(')[0].trim() : 'Priya Sharma'}
                </Text>
                <Text style={styles.actorSlaText}>99.8% SLA</Text>
              </View>

              <Text style={styles.actorRoleText}>
                Finance Admin • <Text style={styles.actorCodeText}>ADM-0082</Text>
              </Text>
            </View>
          </View>

          <View style={styles.metaTilesGrid}>
            <View style={styles.metaTile}>
              <Text style={styles.metaTileLabel}>2FA Method</Text>
              <Text style={styles.metaTileValue}>FIDO2 YubiKey 5C</Text>
            </View>

            <View style={styles.metaTile}>
              <Text style={styles.metaTileLabel}>Clearance</Text>
              <Text style={styles.metaTileValue}>Tier 3 Supervisory</Text>
            </View>
          </View>
        </View>

        {/* Transaction Manifest Card */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSectionLabel}>Transaction Manifest</Text>
            <Text style={styles.manifestBadgeText}>100% UPI REVERSAL</Text>
          </View>

          {/* Amount Banner */}
          <View style={styles.amountBanner}>
            <View>
              <Text style={styles.amountBannerLabel}>Refund Amount</Text>
              <Text style={styles.amountBannerValue}>₹1,850.00</Text>
            </View>

            <View style={styles.amountBannerIconBox}>
              <AppIcon name="account_balance_wallet" size={20} />
            </View>
          </View>

          {/* Detail Rows */}
          <View style={styles.manifestRowsContainer}>
            <View style={styles.manifestRow}>
              <Text style={styles.manifestRowLabel}>Action Type</Text>
              <Text style={styles.manifestRowValueBold}>
                Process Refund (Full Reversal)
              </Text>
            </View>

            <View style={styles.manifestRow}>
              <Text style={styles.manifestRowLabel}>Transaction ID</Text>
              <Text style={styles.manifestRowValueSecondary}>TXN-84291</Text>
            </View>

            <View style={styles.manifestRow}>
              <Text style={styles.manifestRowLabel}>Linked Service Ticket</Text>
              <View style={styles.linkedTicketRow}>
                <AppIcon name="chair" size={20} />
                <Text style={styles.linkedTicketText}>
                  CR-10482 (Aeron Repair)
                </Text>
              </View>
            </View>

            <View style={[styles.manifestRow, styles.manifestRowLast]}>
              <Text style={styles.manifestRowLabel}>Recipient Client</Text>
              <Text style={styles.manifestRowValue}>
                Rahul Mehta (Sec 54, Gurugram)
              </Text>
            </View>
          </View>

          {/* Supervisory Justification Note */}
          <View style={styles.justificationBox}>
            <View style={styles.justificationHeader}>
              <AppIcon name="notes" size={20} />
              <Text style={styles.justificationLabel}>
                Supervisory Justification
              </Text>
            </View>

            <Text style={styles.justificationQuote}>
              "{passedLog?.operatorAnnotation || 'Customer requested cancellation after initial assessment; approved by supervisory desk #SA-01.'}"
            </Text>

            <View style={styles.justificationReasonRow}>
              <AppIcon name="flag" size={20} />
              <Text style={styles.justificationReasonText}>
                Reason: Service Cancelled / Executive Waiver
              </Text>
            </View>
          </View>
        </View>

        {/* Ledger State Migration Matrix */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSectionLabel}>Ledger State Migration</Text>
            <Text style={styles.matrixSubtitle}>2-Phase Atomic Commit</Text>
          </View>

          <View style={styles.matrixContainer}>
            {/* Before State Card */}
            <View style={styles.stateCardBefore}>
              <View style={styles.stateCardHeader}>
                <View style={styles.stateBadgeBefore}>
                  <Text style={styles.stateBadgeBeforeText}>
                    State [T-0] • Pre-Action
                  </Text>
                </View>
                <Text style={styles.stateTimestamp}>09:58 AM</Text>
              </View>

              <View style={styles.stateGrid}>
                <View style={styles.stateGridCol}>
                  <Text style={styles.stateGridLabel}>Payment Status</Text>
                  <Text style={styles.stateGridValueBold}>Successful</Text>
                </View>

                <View style={styles.stateGridCol}>
                  <Text style={styles.stateGridLabel}>Escrow Balance</Text>
                  <Text style={styles.stateGridValueMono}>₹1,850.00 Held</Text>
                </View>

                <View style={styles.stateGridCol}>
                  <Text style={styles.stateGridLabel}>Refund Amount</Text>
                  <Text style={styles.stateGridValueMuted}>₹0.00</Text>
                </View>

                <View style={styles.stateGridCol}>
                  <Text style={styles.stateGridLabel}>Customer Ledger</Text>
                  <Text style={styles.stateGridValueBold}>Settled</Text>
                </View>
              </View>
            </View>

            {/* Transition Connector Indicator */}
            <View style={styles.transitionConnectorRow}>
              <View style={styles.transitionCircle}>
                <AppIcon name="south" size={20} />
              </View>
            </View>

            {/* After State Card */}
            <View style={styles.stateCardAfter}>
              <View style={styles.stateCardHeader}>
                <View style={styles.stateBadgeAfter}>
                  <Text style={styles.stateBadgeAfterText}>
                    State [T-1] • Committed
                  </Text>
                </View>
                <Text style={styles.stateTimestampDark}>10:18 AM</Text>
              </View>

              <View style={styles.stateGrid}>
                <View style={styles.stateGridCol}>
                  <Text style={styles.stateGridLabel}>Payment Status</Text>
                  <Text style={styles.stateGridValueBlue}>Refund Initiated</Text>
                </View>

                <View style={styles.stateGridCol}>
                  <Text style={styles.stateGridLabel}>Escrow Balance</Text>
                  <Text style={styles.stateGridValueMono}>₹0.00</Text>
                </View>

                <View style={styles.stateGridCol}>
                  <Text style={styles.stateGridLabel}>Refund Amount</Text>
                  <Text style={styles.stateGridValueGreen}>
                    ₹1,850.00 Disbursed
                  </Text>
                </View>

                <View style={styles.stateGridCol}>
                  <Text style={styles.stateGridLabel}>Tech Ledger Clawback</Text>
                  <Text style={styles.stateGridValueRed}>
                    -₹1,665.00 deducted
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Security & Cryptographic Metadata Accordion */}
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.accordionHeaderBtn}
            onPress={() => setIsCryptoOpen(!isCryptoOpen)}
            activeOpacity={0.7}
          >
            <View style={styles.accordionHeaderLeft}>
              <AppIcon name="shield_lock" size={20} />
              <Text style={styles.accordionTitle}>Security & Audit Hashes</Text>
            </View>

            <View style={styles.accordionHeaderRight}>
              <View style={styles.verifiedPill}>
                <Text style={styles.verifiedPillText}>VERIFIED</Text>
              </View>
              <Text
                style={[
                  styles.accordionChevron,
                  isCryptoOpen && styles.accordionChevronRotated,
                ]}
              >
                expand_more
              </Text>
            </View>
          </TouchableOpacity>

          {isCryptoOpen && (
            <View style={styles.accordionBody}>
              <View style={styles.cryptoField}>
                <Text style={styles.cryptoFieldLabel}>
                  Device & Runtime Client
                </Text>
                <Text style={styles.cryptoFieldValue}>
                  Web Admin Console (Chrome macOS 14.4.1 ARM64)
                </Text>
              </View>

              <View style={styles.cryptoField}>
                <Text style={styles.cryptoFieldLabel}>Session Identifier</Text>
                <Text style={styles.cryptoFieldMono}>
                  {passedLog?.sessionId || 'SES-984210-SA'}
                </Text>
              </View>

              <View style={styles.cryptoField}>
                <Text style={styles.cryptoFieldLabel}>
                  Network Origin & NOC Node
                </Text>
                <Text style={styles.cryptoFieldMono}>
                  {passedLog?.ipOrigin || '103.21.58.12 • Gurugram Enterprise NOC Hub'}
                </Text>
              </View>

              <View style={styles.cryptoField}>
                <Text style={styles.cryptoFieldLabel}>
                  Digital Signature Hash
                </Text>
                <View style={styles.hashCopyRow}>
                  <Text style={styles.hashDigestText} numberOfLines={1}>
                    SHA256: 8f4ce98a21bf7c98e01048b921
                  </Text>
                  <TouchableOpacity
                    onPress={handleCopyHash}
                    activeOpacity={0.7}
                    style={styles.hashMiniCopyBtn}
                  >
                    <AppIcon name={copiedHash ? 'done' : 'content_copy'} size={20} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.cryptoField, styles.cryptoFieldLast]}>
                <Text style={styles.cryptoFieldLabel}>Event Bus Ingress</Text>
                <Text style={styles.cryptoFieldBusMono}>
                  KAFKA-PARTITION-04-OFFSET-98421
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Toast Notification */}
      {toastVisible && (
        <View
          style={[
            styles.toastNotification,
            { top: Math.max(insets.top, 10) + 64 },
          ]}
        >
          <AppIcon name="check_circle" size={20} />
          <Text style={styles.toastMessageText} numberOfLines={2}>
            {toastMessage}
          </Text>
        </View>
      )}

      {/* Sticky Bottom Action Bar */}
      <View
        style={[
          styles.bottomActionBar,
          { paddingBottom: Math.max(insets.bottom, 10) + 8 },
        ]}
      >
        <TouchableOpacity
          style={styles.primaryActionButton}
          onPress={handleViewTxn}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryActionText}>
            View Original Transaction (TXN-84291)
          </Text>
          <AppIcon name="arrow_forward" size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionButton}
          onPress={handleDownloadCertificate}
          activeOpacity={0.8}
        >
          <AppIcon name="picture_as_pdf" size={20} />
          <Text style={styles.secondaryActionText}>
            Download Audit Certificate (PDF)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  headerContainer: {
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E8EA',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEEF0',
  },
  backIcon: {
    fontFamily: 'Material Icons',
    fontSize: 18,
    color: '#191C1E',
  },
  headerBrandBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrandIcon: {
    fontFamily: 'Material Icons',
    fontSize: 16,
    color: '#FFFFFF',
  },
  headerTitleText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 18,
    color: '#191C1E',
    letterSpacing: -0.2,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEEF0',
  },
  actionIcon: {
    fontFamily: 'Material Icons',
    fontSize: 20,
    color: '#45464D',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontFamily: 'Material Icons',
    fontSize: 18,
    color: '#FFFFFF',
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },
  scrollContentDesktop: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },

  // Breadcrumb Bar
  breadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F4F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E8EA',
  },
  breadcrumbLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4EDEA3',
  },
  breadcrumbLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464D',
    letterSpacing: 0.5,
  },
  breadcrumbValue: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 12,
    color: '#191C1E',
  },
  breadcrumbRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hashChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECEEF0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hashChipIcon: {
    fontFamily: 'Material Icons',
    fontSize: 14,
    color: '#45464D',
  },
  hashChipText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464D',
  },
  receiptIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#ECEEF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptIcon: {
    fontFamily: 'Material Icons',
    fontSize: 15,
    color: '#45464D',
  },

  // Hero Card
  heroCard: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    gap: 14,
    overflow: 'hidden',
    ...Shadows.level1,
  },
  heroAmbientGlow: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(111, 251, 190, 0.18)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  heroIconSquare: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#002113',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    fontFamily: 'Material Icons',
    fontSize: 28,
    color: '#6FFBBE',
  },
  heroTextCol: {
    flex: 1,
  },
  heroTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 19,
    color: '#191C1E',
    letterSpacing: -0.3,
  },
  heroTimestamp: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464D',
    marginTop: 2,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6FFBBE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  completedBadgeIcon: {
    fontFamily: 'Material Icons',
    fontSize: 14,
    color: '#002113',
  },
  completedBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#002113',
  },
  referencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F4F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  referenceTextCol: {
    flex: 1,
  },
  referenceLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  referenceValue: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 14,
    color: '#191C1E',
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECEEF0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyBtnIcon: {
    fontFamily: 'Material Icons',
    fontSize: 14,
    color: '#191C1E',
  },
  copyBtnText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#191C1E',
  },

  // Base Card Container
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    gap: 12,
    ...Shadows.level1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSectionLabel: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    color: '#45464D',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  hardwareKeyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBE1FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  hardwareKeyIcon: {
    fontFamily: 'Material Icons',
    fontSize: 13,
    color: '#00174B',
  },
  hardwareKeyText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#00174B',
  },
  manifestBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    color: '#0051D5',
    letterSpacing: 0.5,
  },

  // Actor Profile
  actorProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actorAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ECEEF0',
    overflow: 'hidden',
  },
  actorAvatarImage: {
    width: '100%',
    height: '100%',
  },
  actorProfileInfo: {
    flex: 1,
  },
  actorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actorNameText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 16,
    color: '#191C1E',
  },
  actorSlaText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    color: '#009668',
  },
  actorRoleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464D',
    marginTop: 2,
  },
  actorCodeText: {
    fontFamily: 'JetBrainsMono-Medium',
    color: '#191C1E',
  },
  metaTilesGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  metaTile: {
    flex: 1,
    backgroundColor: '#F2F4F6',
    borderRadius: 10,
    padding: 10,
  },
  metaTileLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464D',
    textTransform: 'uppercase',
  },
  metaTileValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#191C1E',
    marginTop: 2,
  },

  // Amount Banner
  amountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECEEF0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  amountBannerLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464D',
  },
  amountBannerValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 22,
    color: '#191C1E',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  amountBannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#316BF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBannerIcon: {
    fontFamily: 'Material Icons',
    fontSize: 20,
    color: '#FFFFFF',
  },

  // Manifest Rows
  manifestRowsContainer: {
    gap: 2,
    paddingTop: 4,
  },
  manifestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF0',
  },
  manifestRowLast: {
    borderBottomWidth: 0,
  },
  manifestRowLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#45464D',
  },
  manifestRowValueBold: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#191C1E',
  },
  manifestRowValueSecondary: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 13,
    color: '#0051D5',
  },
  manifestRowValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#191C1E',
    textAlign: 'right',
  },
  linkedTicketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkedTicketIcon: {
    fontFamily: 'Material Icons',
    fontSize: 15,
    color: '#45464D',
  },
  linkedTicketText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 13,
    color: '#191C1E',
  },

  // Supervisory Justification
  justificationBox: {
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  justificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  justificationIcon: {
    fontFamily: 'Material Icons',
    fontSize: 16,
    color: '#45464D',
  },
  justificationLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#45464D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  justificationQuote: {
    fontFamily: 'Inter-Regular',
    fontSize: 12.5,
    color: '#191C1E',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  justificationReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  justificationFlagIcon: {
    fontFamily: 'Material Icons',
    fontSize: 13,
    color: '#003EA8',
  },
  justificationReasonText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#003EA8',
  },

  // Matrix Ledger Migration
  matrixSubtitle: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#45464D',
  },
  matrixContainer: {
    gap: 8,
  },
  stateCardBefore: {
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  stateCardAfter: {
    backgroundColor: 'rgba(218, 226, 253, 0.4)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#BEC6E0',
  },
  stateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stateBadgeBefore: {
    backgroundColor: '#E0E3E5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  stateBadgeBeforeText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10,
    color: '#45464D',
    textTransform: 'uppercase',
  },
  stateBadgeAfter: {
    backgroundColor: '#131B2E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  stateBadgeAfterText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  stateTimestamp: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464D',
  },
  stateTimestampDark: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    color: '#191C1E',
  },
  stateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stateGridCol: {
    width: '48%',
    gap: 2,
  },
  stateGridLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: '#45464D',
  },
  stateGridValueBold: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#191C1E',
  },
  stateGridValueMono: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 12.5,
    color: '#191C1E',
  },
  stateGridValueMuted: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12.5,
    color: '#76777D',
  },
  stateGridValueBlue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#0051D5',
  },
  stateGridValueGreen: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 12.5,
    color: '#009668',
  },
  stateGridValueRed: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 12.5,
    color: '#BA1A1A',
  },
  transitionConnectorRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -8,
    zIndex: 10,
  },
  transitionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  transitionIcon: {
    fontFamily: 'Material Icons',
    fontSize: 16,
    color: '#FFFFFF',
  },

  // Accordion
  accordionHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accordionShieldIcon: {
    fontFamily: 'Material Icons',
    fontSize: 20,
    color: '#191C1E',
  },
  accordionTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 16,
    color: '#191C1E',
  },
  accordionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedPill: {
    backgroundColor: '#6FFBBE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifiedPillText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    color: '#002113',
  },
  accordionChevron: {
    fontFamily: 'Material Icons',
    fontSize: 20,
    color: '#45464D',
  },
  accordionChevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  accordionBody: {
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginTop: 4,
  },
  cryptoField: {
    gap: 2,
  },
  cryptoFieldLast: {
    marginBottom: 0,
  },
  cryptoFieldLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cryptoFieldValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 12.5,
    color: '#191C1E',
  },
  cryptoFieldMono: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#191C1E',
  },
  hashCopyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hashDigestText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11.5,
    color: '#191C1E',
    flex: 1,
    paddingRight: 8,
  },
  hashMiniCopyBtn: {
    padding: 4,
  },
  hashMiniCopyIcon: {
    fontFamily: 'Material Icons',
    fontSize: 16,
    color: '#0051D5',
  },
  cryptoFieldBusMono: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464D',
  },

  // Floating Toast Notification
  toastNotification: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#2D3133',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '90%',
    zIndex: 999,
    ...Shadows.level2,
  },
  toastCheckIcon: {
    fontFamily: 'Material Icons',
    fontSize: 16,
    color: '#6FFBBE',
  },
  toastMessageText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12.5,
    color: '#EFF1F3',
  },

  // Sticky Bottom Action Bar
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E6E8EA',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
    zIndex: 40,
  },
  primaryActionButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  primaryActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12.5,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  primaryActionIcon: {
    fontFamily: 'Material Icons',
    fontSize: 17,
    color: '#FFFFFF',
  },
  secondaryActionButton: {
    backgroundColor: '#E6E8EA',
    borderRadius: 12,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionIcon: {
    fontFamily: 'Material Icons',
    fontSize: 17,
    color: '#191C1E',
  },
  secondaryActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#191C1E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
