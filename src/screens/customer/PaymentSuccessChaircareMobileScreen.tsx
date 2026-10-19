import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useBooking } from '../../context/BookingContext';
import { SuccessCheckmark } from '../../animations/SuccessCheckmark';
import { FadeIn } from '../../animations/FadeIn';
import { PressableScale } from '../../animations/PressableScale';
import { downloadInvoice } from '../../services/invoiceService';

/**
 * Screen ID: C16
 * Title: Payment Success & Warranty Certificate
 * Reference: design-reference/customer/payment_success_chaircare_mobile
 */
export const PaymentSuccessChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { draft } = useBooking();

  const [copiedTxn, setCopiedTxn] = useState<boolean>(false);
  const [downloadStatus, setDownloadStatus] = useState<string>('Download Invoice PDF');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const technician = {
    name: 'Certified Partner Specialist',
    rating: 4.95,
    completedJobsCount: 140,
    phone: '+91 800 555 0199',
  };

  const serviceTitle = draft?.serviceTitle || 'Office Chair Repair';
  const totalAmount = draft?.estimatedTotal ? `₹${draft.estimatedTotal}.00` : '₹749.00';

  const handleCopyTxn = () => {
    setCopiedTxn(true);
    setTimeout(() => {
      setCopiedTxn(false);
    }, 2000);
  };

  const handleDownloadInvoice = async () => {
    setIsDownloading(true);
    setDownloadStatus('Preparing PDF...');
    try {
      const draftAny = (draft || {}) as any;
      await downloadInvoice({
        ticketNumber: draftAny.serviceRequestId ? `#${draftAny.serviceRequestId.substring(0, 8)}` : '#CC-7842',
        serviceTitle: draft?.serviceTitle || 'Office Chair Repair',
        chairModel: draft?.chairType || 'Office Ergonomic Chair',
        issueDescription: draft?.problemDescription || draftAny.issueDescription || 'Hydraulic inspection & general repair',
        amount: draft?.estimatedTotal || 749,
        isPaid: true,
        customerName: draftAny.customerName || 'Verified Customer',
        customerPhone: draftAny.contactPhone || '+91 800 555 0199',
        locationInfo: draft?.serviceAddress,
        technicianName: technician.name,
      });
      setDownloadStatus('Invoice Downloaded');
      setTimeout(() => {
        setDownloadStatus('Download Invoice PDF');
      }, 2500);
    } catch {
      setDownloadStatus('Download Invoice PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRateExperience = () => {
    navigation.navigate('RateExperience');
  };

  return (
    <ScreenContainer hasPadding={false}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 16,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebratory Status Hero */}
        <View style={styles.heroSection}>
          <SuccessCheckmark size={68} badgeColor="#009668" />
          <Text style={styles.heroHeading}>Payment Successful</Text>
          <Text style={styles.heroSub}>
            Your payment has been received and verified by ChairCare.
          </Text>
        </View>

        {/* Primary Transaction Card */}
        <FadeIn delay={120}>
          <View style={styles.transactionCard}>
            <View style={styles.emeraldLeftStripe} />

            {/* Total Paid & Status Badge */}
            <View style={styles.amountStatusRow}>
              <View style={styles.amountGroup}>
                <Text style={styles.amountLabel}>TOTAL AMOUNT PAID</Text>
                <Text style={styles.amountValue}>{totalAmount}</Text>
              </View>
              <View style={styles.paidPillBadge}>
                <View style={styles.paidDot} />
                <Text style={styles.paidPillText}>PAID</Text>
              </View>
            </View>

            {/* Micro-Data Segment Matrix */}
            <View style={styles.matrixContainer}>
              {/* Payment Method */}
              <View style={styles.matrixRow}>
                <View style={styles.matrixLeft}>
                  <View style={styles.matrixIconBox}>
                    <AppIcon name="Wallet" size={20} color="#059669" />
                  </View>
                  <View style={styles.matrixTextGroup}>
                    <Text style={styles.matrixLabel}>Payment Method</Text>
                    <Text style={styles.matrixMainText}>
                      UPI (GPay • tech@okhdfcbank)
                    </Text>
                  </View>
                </View>
                <View style={styles.instantTag}>
                  <Text style={styles.instantTagText}>INSTANT</Text>
                </View>
              </View>

              {/* Transaction ID with Copy Button */}
              <View style={styles.matrixRow}>
                <View style={styles.matrixTextGroup}>
                  <Text style={styles.matrixLabel}>Transaction ID</Text>
                  <Text style={styles.txnIdText}>TXN-89420185920</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.copyBtn,
                    copiedTxn && styles.copyBtnSuccess,
                  ]}
                  onPress={handleCopyTxn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.copyBtnText}>
                    {copiedTxn ? '✓ Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Reference & Timestamp */}
              <View style={styles.gridTimestampRow}>
                <View style={styles.gridCell}>
                  <Text style={styles.matrixLabel}>Date & Time</Text>
                  <Text style={styles.gridCellText}>
                    {draft?.visitDate || `Today, ${new Date().getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][new Date().getMonth()]}`} • {draft?.timeSlot ? draft.timeSlot.split('–')[0].trim() : '04:20 PM'}
                  </Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.matrixLabel}>Bank Ref (UTR)</Text>
                  <Text style={styles.gridCellMono}>UTR-9920148201</Text>
                </View>
              </View>
            </View>
          </View>
        </FadeIn>

        {/* Service & 90-Day Warranty Summary Card */}
        <FadeIn delay={200}>
          <View style={styles.warrantyCard}>
            <View style={styles.warrantyHeaderRow}>
              <Text style={styles.warrantyCardTitle}>SERVICE CALIBRATION LOG</Text>
              <Text style={styles.ticketTagText}>TICKET #EF-4102</Text>
            </View>

            {/* Service Spec Block */}
            <View style={styles.serviceSpecBlock}>
              <View style={styles.chairIconBox}>
                <AppIcon name="Armchair" size={18} />
              </View>
              <View style={styles.serviceSpecTextGroup}>
                <Text style={styles.serviceSpecTitle} numberOfLines={1}>
                  {serviceTitle}
                </Text>
                <Text style={styles.serviceSpecDesc}>
                  Tilt recalibration & pneumatic Class 4 cylinder overhaul
                </Text>
              </View>
            </View>

            {/* Technician In-Charge */}
            <View style={styles.techInChargeBox}>
              <View style={styles.techLeftWrap}>
                <View style={styles.avatarWrap}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                    }}
                    style={styles.techSmallAvatar}
                  />
                  <View style={styles.techOnlineDot} />
                </View>
                <View style={styles.techDetailsTextGroup}>
                  <Text style={styles.techSmallName}>{technician.name}</Text>
                  <Text style={styles.techSmallRole}>Lead Ergo Specialist</Text>
                </View>
              </View>
              <View style={styles.techRatingBadge}>
                <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingNumber}>4.96</Text>
              </View>
            </View>

            {/* Active 90-Day Warranty Shield Banner */}
            <View style={styles.ergoShieldBanner}>
              <View style={styles.shieldIconBox}>
                <AppIcon name="ShieldCheck" size={18} />
              </View>
              <View style={styles.ergoShieldTextGroup}>
                <Text style={styles.ergoShieldTitle}>
                  90-Day ErgoShield™ Coverage
                </Text>
                <Text style={styles.ergoShieldMeta}>
                  Active through 21 Jan 2025 • Parts & Calibrations
                </Text>
              </View>
            </View>
          </View>
        </FadeIn>

        {/* Bottom CTA Actions */}
        <FadeIn delay={260}>
          <View style={styles.bottomActionsGroup}>
            <PressableScale
              style={styles.rateExperienceBtn}
              onPress={handleRateExperience}
            >
              <Text style={styles.rateExperienceBtnText}>Rate Your Experience</Text>
              <Text style={styles.rateExperienceBtnArrow}>→</Text>
            </PressableScale>

            <TouchableOpacity
              style={[
                styles.downloadPdfBtn,
                isDownloading && styles.downloadPdfBtnLoading,
              ]}
              onPress={handleDownloadInvoice}
              disabled={isDownloading}
              activeOpacity={0.8}
            >
              <AppIcon name="Receipt" size={18} color={Colors.onSurfaceVariant} />
              <Text style={styles.downloadPdfBtnText}>{downloadStatus}</Text>
            </TouchableOpacity>
          </View>
        </FadeIn>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  ambientGlowWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlowBg: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(78, 222, 163, 0.12)',
  },
  sparkleStar1: {
    position: 'absolute',
    top: 10,
    left: 40,
    fontSize: 16,
  },
  sparkleStar2: {
    position: 'absolute',
    top: 20,
    right: 50,
    fontSize: 14,
  },
  checkBadgeWrap: {
    position: 'relative',
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  checkPulseRing: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(78, 222, 163, 0.25)',
  },
  checkGlowRing: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(78, 222, 163, 0.45)',
  },
  checkBadgeCore: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.tertiaryEmerald,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  checkBadgeIcon: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.onPrimary,
  },
  verifiedMiniBadge: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surfaceContainerLowest,
  },
  verifiedMiniIcon: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onPrimary,
  },
  heroHeading: {
    ...Typography.headlineMd,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.onSurface,
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSub: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  transactionCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxl,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  emeraldLeftStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: Colors.tertiaryFixedDim,
  },
  amountStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 4,
  },
  amountGroup: {
    gap: 2,
  },
  amountLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.outline,
    letterSpacing: 0.6,
  },
  amountValue: {
    ...Typography.headlineMd,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  paidPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(78, 222, 163, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  paidDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.onTertiaryContainer,
  },
  paidPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onTertiaryContainer,
    letterSpacing: 0.5,
  },
  matrixContainer: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    padding: 12,
    gap: 10,
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matrixLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  matrixIconBox: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  matrixIcon: {
    fontSize: 14,
  },
  matrixTextGroup: {
    gap: 1,
  },
  matrixLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  matrixMainText: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  instantTag: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  instantTagText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.tertiaryFixedDim,
  },
  txnIdText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  copyBtn: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  copyBtnSuccess: {
    backgroundColor: Colors.tertiaryFixed,
  },
  copyBtnText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  gridTimestampRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
  },
  gridCell: {
    flex: 1,
    gap: 2,
  },
  gridCellText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurface,
  },
  gridCellMono: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurface,
  },
  warrantyCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxl,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  warrantyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warrantyCardTitle: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
    letterSpacing: 0.6,
  },
  ticketTagText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  serviceSpecBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chairIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chairIcon: {
    fontSize: 18,
  },
  serviceSpecTextGroup: {
    flex: 1,
    gap: 1,
  },
  serviceSpecTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  serviceSpecDesc: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  techInChargeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
  },
  techLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarWrap: {
    position: 'relative',
  },
  techSmallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  techOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.tertiaryFixedDim,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerLowest,
  },
  techDetailsTextGroup: {
    gap: 1,
  },
  techSmallName: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  techSmallRole: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  techRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starIcon: {
    fontSize: 12,
  },
  ratingNumber: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  ergoShieldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.lg,
    padding: 10,
  },
  shieldIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.tertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIcon: {
    fontSize: 16,
  },
  ergoShieldTextGroup: {
    flex: 1,
    gap: 1,
  },
  ergoShieldTitle: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  ergoShieldMeta: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  bottomActionsGroup: {
    gap: 8,
    marginTop: 4,
  },
  rateExperienceBtn: {
    width: '100%',
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  rateExperienceBtnText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  rateExperienceBtnArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  downloadPdfBtn: {
    width: '100%',
    height: 44,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceContainerHigh,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  downloadPdfBtnLoading: {
    opacity: 0.75,
  },
  receiptDocIcon: {
    fontSize: 15,
  },
  downloadPdfBtnText: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
});
