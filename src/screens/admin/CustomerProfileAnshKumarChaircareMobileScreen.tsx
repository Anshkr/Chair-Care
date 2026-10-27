import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { phoneCallService } from '../../services/phone/phoneCallService';
import { adminApi } from '../../services/api/adminApi';

interface CustomerProfileProps {
  navigation?: any;
  route?: {
    params?: {
      customerId?: string;
      customer?: any;
    };
  };
}

export const CustomerProfileAnshKumarChaircareMobileScreen: React.FC<CustomerProfileProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const passedCust = route?.params?.customer;
  const passedId = route?.params?.customerId || passedCust?.id || 'cust-01';

  // Selected customer details with fallback to canonical Ansh Kumar Stitch reference data
  const custName = passedCust?.name || 'Ansh Kumar';
  const custInitials = passedCust?.initials || 'AK';
  const custCode = passedCust?.code || '#CUST-7741';
  const phone = passedCust?.phone || '+91 98201 44810';
  const email = passedCust?.email || 'ansh.kumar@skyline.in';
  const location =
    passedCust?.locationFull ||
    passedCust?.location ||
    'Flat 402, Palm Springs Residences, Sector 54, Gurugram, HR 122002';
  const requestsCount = passedCust?.requestsCount || 24;
  const completedCount = passedCust?.completedCount || 21;
  const cancelledCount = passedCust?.cancelledCount || 2;
  const totalSpentFormatted = passedCust?.totalSpentFormatted || '₹18,450';
  const rating = passedCust?.rating || 4.8;
  const isHold = passedCust?.isHold || passedCust?.status === 'blocked';
  const statusLabel = isHold ? 'Blocked' : 'Active Account';

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  const handleCall = () => {
    phoneCallService.callNumber(phone, custName);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Email', `Composing email to ${email}`);
    });
  };

  const handleCopy = (text: string, label: string) => {
    showToast(`${label} copied to clipboard`);
  };

  const handleManageAccount = () => {
    if (navigation) {
      navigation.navigate('CustomerAccountManagement', {
        customerId: passedId,
        customer: passedCust || {
          id: passedId,
          name: custName,
          code: custCode,
          phone,
          email,
          location,
          requestsCount,
          totalSpentFormatted,
          rating,
          isHold,
        },
      });
    }
  };

  const handleServiceHistory = () => {
    if (navigation) {
      navigation.navigate('CustomerServiceHistory', {
        customerId: passedId,
        customer: passedCust || {
          id: passedId,
          name: custName,
          code: custCode,
          requestsCount,
        },
      });
    }
  };

  const handleReviews = () => {
    if (navigation) {
      navigation.navigate('ReviewsRatings', {
        customerId: passedId,
      });
    }
  };

  const handleOpenTicketDetails = (ticketCode: string) => {
    if (navigation) {
      navigation.navigate('ServiceRequestDetails', {
        requestId: ticketCode,
      });
    }
  };

  const handleIssueTemporaryPassword = () => {
    Alert.alert(
      'Issue Temporary Password',
      `Generate a secure temporary password for ${custName}? An in-app notification with the temporary password will be sent to the customer immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate & Issue',
          onPress: async () => {
            try {
              const res = await adminApi.setUserTemporaryPassword(passedId);
              if (res.success && res.data) {
                Alert.alert(
                  'Temporary Password Issued',
                  `Temporary password: '${res.data.temporaryPassword}'\n\nThis has been sent to ${custName} via in-app notification.`
                );
                showToast(`Temporary password issued for ${custName}`);
              } else {
                Alert.alert('Failed', res.error || 'Could not issue temporary password.');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Something went wrong.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Top Header */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation && navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="ArrowLeft" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Customer Profile
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => showToast('Super Admin customer options')}
            activeOpacity={0.7}
            accessibilityLabel="More options"
          >
            <AppIcon name="MoreVertical" size={20} />
          </TouchableOpacity>
          <View style={styles.adminAvatarCircle}>
            <AppIcon name="User" size={18} />
          </View>
        </View>
      </View>

      {/* 2. Floating Toast Notification */}
      {toastMessage && (
        <View style={[styles.toastContainer, { top: Math.max(insets.top, 12) + 56 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><AppIcon name="Check" size={14} /><Text style={styles.toastText}>{toastMessage}</Text></View>
        </View>
      )}

      {/* 3. Main Scrollable Container */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Customer Profile Identity Card */}
        <View style={styles.identityCard}>
          {/* Top Gradient Accent Strip */}
          <View style={styles.gradientAccentBar} />

          <View style={styles.identityCardBody}>
            {/* Identity Header Row */}
            <View style={styles.identityHeaderRow}>
              <View style={styles.avatarWrapper}>
                <View
                  style={[
                    styles.avatarBox,
                    isHold ? styles.avatarBoxBlocked : styles.avatarBoxNormal,
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarInitialsText,
                      isHold ? styles.avatarInitialsBlocked : styles.avatarInitialsNormal,
                    ]}
                  >
                    {custInitials}
                  </Text>
                </View>
                <View
                  style={[
                    styles.verifiedShieldBadge,
                    isHold ? styles.shieldBadgeBlocked : styles.shieldBadgeActive,
                  ]}
                >
                  <AppIcon name={isHold ? 'AlertTriangle' : 'Check'} size={10} color="#ffffff" />
                </View>
              </View>

              <View style={styles.identityInfoCol}>
                <View style={styles.nameIdRow}>
                  <Text style={styles.customerName} numberOfLines={1}>
                    {custName}
                  </Text>
                  <View style={styles.custIdTag}>
                    <Text style={styles.custIdTagText}>{custCode}</Text>
                  </View>
                </View>

                {/* Badges Bar */}
                <View style={styles.badgesBarRow}>
                  <View
                    style={[
                      styles.accountStatusBadge,
                      isHold ? styles.badgeBlocked : styles.badgeActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        isHold ? styles.dotBlocked : styles.dotActive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.accountStatusText,
                        isHold ? styles.textBlocked : styles.textActive,
                      ]}
                    >
                      {statusLabel}
                    </Text>
                  </View>

                  <View style={styles.tierBadge}>
                    <AppIcon name="Award" size={18} />
                    <Text style={styles.tierBadgeText}>Tier-1 Preferred Client</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Contact Micro-actions list */}
            <View style={styles.contactActionsBox}>
              {/* Phone Row */}
              <View style={styles.contactRow}>
                <View style={styles.contactLeft}>
                  <View style={styles.contactIconBox}>
                    <AppIcon name="Phone" size={18} />
                  </View>
                  <View style={styles.contactMeta}>
                    <Text style={styles.contactLabel}>CONTACT PHONE</Text>
                    <Text style={styles.contactValue} numberOfLines={1}>
                      {phone}
                    </Text>
                  </View>
                </View>

                <View style={styles.contactButtonsRow}>
                  <TouchableOpacity
                    style={styles.microActionBtn}
                    onPress={() => handleCopy(phone, 'Phone number')}
                    activeOpacity={0.7}
                    accessibilityLabel="Copy phone number"
                  >
                    <AppIcon name="ClipboardList" size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.callDirectBtn}
                    onPress={handleCall}
                    activeOpacity={0.75}
                    accessibilityLabel="Call customer"
                  >
                    <AppIcon name="Phone" size={16} color={Colors.secondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Email Row */}
              <View style={styles.contactRow}>
                <View style={styles.contactLeft}>
                  <View style={styles.contactIconBox}>
                    <AppIcon name="Mail" size={18} />
                  </View>
                  <View style={styles.contactMeta}>
                    <Text style={styles.contactLabel}>EMAIL ADDRESS</Text>
                    <Text style={styles.contactValue} numberOfLines={1}>
                      {email}
                    </Text>
                  </View>
                </View>

                <View style={styles.contactButtonsRow}>
                  <TouchableOpacity
                    style={styles.microActionBtn}
                    onPress={() => handleCopy(email, 'Email address')}
                    activeOpacity={0.7}
                    accessibilityLabel="Copy email address"
                  >
                    <AppIcon name="ClipboardList" size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.microActionBtn}
                    onPress={handleEmail}
                    activeOpacity={0.7}
                    accessibilityLabel="Send email"
                  >
                    <AppIcon name="Upload" size={18} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Location Row */}
              <View style={styles.contactRow}>
                <View style={styles.contactLeft}>
                  <View style={styles.contactIconBox}>
                    <AppIcon name="MapPin" size={18} />
                  </View>
                  <View style={styles.contactMeta}>
                    <Text style={styles.contactLabel}>PRIMARY LOCATION</Text>
                    <Text style={styles.locationDetailText} numberOfLines={2}>
                      {location}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.microActionBtn}
                  onPress={() => handleCopy(location, 'Address')}
                  activeOpacity={0.7}
                  accessibilityLabel="Copy location"
                >
                  <AppIcon name="ClipboardList" size={18} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* 2. Customer Statistics KPI Grid (2x2) */}
        <View style={styles.kpiGrid}>
          {/* Total Requests */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiLabel}>REQUESTS</Text>
              <View style={styles.kpiIconBox}>
                <AppIcon name="ClipboardList" size={18} />
              </View>
            </View>
            <View style={styles.kpiBottomCol}>
              <Text style={styles.kpiValue}>{requestsCount}</Text>
              <Text style={styles.kpiSubtext}>Lifetime created</Text>
            </View>
          </View>

          {/* Completed */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiLabel}>COMPLETED</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(78, 222, 163, 0.2)' }]}>
                <AppIcon name="CheckCircle" size={18} />
              </View>
            </View>
            <View style={styles.kpiBottomCol}>
              <Text style={[styles.kpiValue, { color: '#009668' }]}>{completedCount}</Text>
              <Text style={[styles.kpiSubtext, { color: '#009668', fontWeight: '600' }]}>
                87.5% success rate
              </Text>
            </View>
          </View>

          {/* Cancelled */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiLabel}>CANCELLED</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: '#ffdad6' }]}>
                <AppIcon name="CircleAlert" size={16} color="#BA1A1A" />
              </View>
            </View>
            <View style={styles.kpiBottomCol}>
              <Text style={[styles.kpiValue, { color: '#ba1a1a' }]}>{cancelledCount}</Text>
              <Text style={[styles.kpiSubtext, { color: '#ba1a1a', fontWeight: '600' }]}>
                Pre-dispatch drops
              </Text>
            </View>
          </View>

          {/* Total Spent */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiLabel}>TOTAL SPENT</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: '#dbe1ff' }]}>
                <AppIcon name="CreditCard" size={18} />
              </View>
            </View>
            <View style={styles.kpiBottomCol}>
              <Text style={[styles.kpiValue, { color: Colors.secondaryCobalt }]}>
                {totalSpentFormatted}
              </Text>
              <Text style={[styles.kpiSubtext, { color: Colors.secondaryCobalt, fontWeight: '600' }]}>
                Avg ₹878 / ticket
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Customer Trust & Rating Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <AppIcon name="ShieldCheck" size={18} />
              <Text style={styles.cardHeaderTitle}>Customer Rating & Behavior</Text>
            </View>
            <View style={styles.opsIndexTag}>
              <Text style={styles.opsIndexText}>OPS INDEX</Text>
            </View>
          </View>

          <View style={styles.ratingOverviewRow}>
            <View style={styles.ratingScoreCol}>
              <View style={styles.starValueRow}>
                <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingScoreNumber}>{rating}</Text>
              </View>
              <Text style={styles.outOfText}>out of 5.0</Text>
            </View>

            <View style={styles.ratingProgressCol}>
              <Text style={styles.ratingExplanation}>
                Based on <Text style={styles.boldSpan}>21 verified technician</Text> ratings
                across North NCR clusters.
              </Text>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${(rating / 5) * 100}%` }]} />
              </View>
            </View>
          </View>

          {/* Behavioral Tags */}
          <View style={styles.behavioralTagsSection}>
            <Text style={styles.behavioralSectionLabel}>VERIFIED BEHAVIORAL TRAITS</Text>
            <View style={styles.behavioralTagsWrap}>
              <View style={styles.traitPillSuccess}>
                <AppIcon name="CreditCard" size={18} />
                <Text style={styles.traitTextSuccess}>Prompt Payment</Text>
              </View>

              <View style={styles.traitPillCobalt}>
                <AppIcon name="Settings" size={18} />
                <Text style={styles.traitTextCobalt}>Accurate Defect Description</Text>
              </View>

              <View style={styles.traitPillNeutral}>
                <AppIcon name="Users" size={16} color={Colors.secondary} />
                <Text style={styles.traitTextNeutral}>Zero On-site Disputes</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4. Recent Service Requests Stream */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardHeaderTitle}>Recent Service Requests</Text>
              <Text style={styles.cardHeaderSubtitle}>Telemetry from technician dispatch logs</Text>
            </View>
            <Text style={styles.streamBadge}>STREAM (3)</Text>
          </View>

          <View style={styles.streamList}>
            {/* Stream Ticket 1 */}
            <TouchableOpacity
              style={styles.streamItem}
              onPress={() => handleOpenTicketDetails('CC-10482')}
              activeOpacity={0.75}
            >
              <View style={styles.streamTopRow}>
                <View style={styles.streamTitleRow}>
                  <View style={[styles.streamDot, { backgroundColor: '#009668' }]} />
                  <Text style={styles.streamServiceTitle} numberOfLines={1}>
                    Office Chair Repair
                  </Text>
                </View>
                <Text style={styles.streamPriceText}>₹749</Text>
              </View>

              <View style={styles.streamMetaRow}>
                <View style={styles.ticketIdRow}>
                  <Text style={styles.ticketLabel}>Ticket</Text>
                  <Text style={styles.ticketCode}>#CC-10482</Text>
                </View>
                <View style={styles.completedPill}>
                  <Text style={styles.completedPillText}>Completed Today</Text>
                </View>
              </View>

              <View style={styles.streamFooterRow}>
                <View style={styles.techAssignedRow}>
                  <AppIcon name="Wrench" size={18} />
                  <Text style={styles.techAssignedText}>
                    Tech: <Text style={styles.boldSpan}>Rahul Sharma</Text>
                  </Text>
                </View>
                <Text style={styles.streamChevron}>›</Text>
              </View>
            </TouchableOpacity>

            {/* Stream Ticket 2 */}
            <TouchableOpacity
              style={styles.streamItem}
              onPress={() => handleOpenTicketDetails('CC-10421')}
              activeOpacity={0.75}
            >
              <View style={styles.streamTopRow}>
                <View style={styles.streamTitleRow}>
                  <View style={[styles.streamDot, { backgroundColor: '#009668' }]} />
                  <Text style={styles.streamServiceTitle} numberOfLines={1}>
                    Hydraulic Replacement
                  </Text>
                </View>
                <Text style={styles.streamPriceText}>₹1,249</Text>
              </View>

              <View style={styles.streamMetaRow}>
                <View style={styles.ticketIdRow}>
                  <Text style={styles.ticketLabel}>Ticket</Text>
                  <Text style={styles.ticketCode}>#CC-10421</Text>
                </View>
                <View style={styles.completedPill}>
                  <Text style={styles.completedPillText}>Completed 2 days ago</Text>
                </View>
              </View>

              <View style={styles.streamFooterRow}>
                <View style={styles.techAssignedRow}>
                  <AppIcon name="Wrench" size={18} />
                  <Text style={styles.techAssignedText}>
                    Tech: <Text style={styles.boldSpan}>Amit Kumar</Text>
                  </Text>
                </View>
                <Text style={styles.streamChevron}>›</Text>
              </View>
            </TouchableOpacity>

            {/* Stream Ticket 3 */}
            <TouchableOpacity
              style={styles.streamItem}
              onPress={() => handleOpenTicketDetails('CC-10388')}
              activeOpacity={0.75}
            >
              <View style={styles.streamTopRow}>
                <View style={styles.streamTitleRow}>
                  <View style={[styles.streamDot, { backgroundColor: '#ba1a1a' }]} />
                  <Text style={styles.streamServiceTitle} numberOfLines={1}>
                    Chair Cleaning & Sanitization
                  </Text>
                </View>
                <Text style={[styles.streamPriceText, { color: '#76777d' }]}>₹0</Text>
              </View>

              <View style={styles.streamMetaRow}>
                <View style={styles.ticketIdRow}>
                  <Text style={styles.ticketLabel}>Ticket</Text>
                  <Text style={styles.ticketCode}>#CC-10388</Text>
                </View>
                <View style={styles.cancelledBadgesRow}>
                  <View style={styles.cancelledPill}>
                    <Text style={styles.cancelledPillText}>Cancelled 1 week ago</Text>
                  </View>
                  <View style={styles.refundedPill}>
                    <Text style={styles.refundedPillText}>Refunded</Text>
                  </View>
                </View>
              </View>

              <View style={styles.streamFooterRow}>
                <View style={styles.techAssignedRow}>
                  <AppIcon name="RefreshCw" size={18} />
                  <Text style={styles.techAssignedText}>System automated resolution</Text>
                </View>
                <Text style={styles.streamChevron}>›</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Account Notes / Admin Memo */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <AppIcon name="FileText" size={18} />
              <Text style={styles.cardHeaderTitle}>Account Memo</Text>
            </View>
            <View style={styles.internalTagBadge}>
              <Text style={styles.internalTagText}>Internal Ops Note</Text>
            </View>
          </View>

          <View style={styles.memoBox}>
            <Text style={styles.memoText}>
              Corporate desk seating contract client. Priority routing enabled for Gurugram Sector
              54 corridor. Dispatched engineers should carry Grade-4 gas lift replacement parts.
            </Text>
            <View style={styles.memoMetaRow}>
              <Text style={styles.memoMetaText}>Author: Dispatch Desk #3</Text>
              <Text style={styles.memoMetaText}>Updated: Yesterday, 18:40</Text>
            </View>
          </View>
        </View>

        {/* 6. Action Buttons & Sticky-style Footer Container */}
        <View style={styles.actionControlsSection}>
          {/* Primary Action Full Width */}
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={handleManageAccount}
            activeOpacity={0.88}
          >
            <AppIcon name="ShieldCheck" size={18} />
            <Text style={styles.primaryActionText}>Manage Customer Account & Access</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: '#005236', marginTop: 8 }]}
            onPress={handleIssueTemporaryPassword}
            activeOpacity={0.88}
          >
            <AppIcon name="Key" size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Issue Temporary Password</Text>
          </TouchableOpacity>

          {/* Secondary Dual-Button Row */}
          <View style={styles.dualButtonRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleServiceHistory}
              activeOpacity={0.8}
            >
              <AppIcon name="ClipboardList" size={18} />
              <Text style={styles.secondaryBtnText} numberOfLines={1}>
                Service History ({requestsCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleReviews}
              activeOpacity={0.8}
            >
              <AppIcon name="MessageCircle" size={18} />
              <Text style={styles.secondaryBtnText} numberOfLines={1}>
                Reviews & Feedback
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    zIndex: 50,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: '#191c1e',
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '800',
    color: '#191c1e',
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMoreIcon: {
    fontSize: 20,
    color: '#45464d',
    fontWeight: '700',
  },
  adminAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#191c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatarIcon: {
    fontSize: 14,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#191c1e',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 999,
    ...Shadows.level2,
  },
  toastText: {
    ...Typography.bodySm,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },
  identityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.level1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  gradientAccentBar: {
    height: 6,
    backgroundColor: Colors.secondaryCobalt,
  },
  identityCardBody: {
    padding: 16,
    gap: 14,
  },
  identityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBoxNormal: {
    backgroundColor: '#131b2e',
  },
  avatarBoxBlocked: {
    backgroundColor: '#ffdad6',
  },
  avatarInitialsText: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  avatarInitialsNormal: {
    color: '#dae2fd',
  },
  avatarInitialsBlocked: {
    color: '#ba1a1a',
  },
  verifiedShieldBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  shieldBadgeActive: {
    backgroundColor: '#0051d5',
  },
  shieldBadgeBlocked: {
    backgroundColor: '#ba1a1a',
  },
  shieldBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  identityInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  nameIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  customerName: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '800',
    color: '#191c1e',
  },
  custIdTag: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  custIdTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#45464d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  badgesBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  accountStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeActive: {
    backgroundColor: 'rgba(78, 222, 163, 0.25)',
  },
  badgeBlocked: {
    backgroundColor: '#ffdad6',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#009668',
  },
  dotBlocked: {
    backgroundColor: '#ba1a1a',
  },
  accountStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textActive: {
    color: '#005236',
  },
  textBlocked: {
    color: '#93000a',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tierBadgeIcon: {
    fontSize: 11,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00174b',
  },
  contactActionsBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  contactIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f2f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactIcon: {
    fontSize: 15,
  },
  contactMeta: {
    flex: 1,
    minWidth: 0,
  },
  contactLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#76777d',
    letterSpacing: 0.4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  contactValue: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: '#191c1e',
    marginTop: 1,
  },
  locationDetailText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#191c1e',
    lineHeight: 16,
    marginTop: 1,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  microActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f2f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  microActionIcon: {
    fontSize: 14,
  },
  callDirectBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callDirectIcon: {
    fontSize: 14,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    ...Shadows.level1,
    justifyContent: 'space-between',
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#76777d',
    letterSpacing: 0.4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  kpiIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiEmoji: {
    fontSize: 13,
  },
  kpiBottomCol: {
    marginTop: 8,
  },
  kpiValue: {
    ...Typography.headlineSm,
    fontSize: 22,
    fontWeight: '800',
    color: '#191c1e',
    letterSpacing: -0.5,
  },
  kpiSubtext: {
    fontSize: 11,
    color: '#76777d',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    ...Shadows.level1,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardHeaderIcon: {
    fontSize: 16,
  },
  cardHeaderTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  cardHeaderSubtitle: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#76777d',
    marginTop: 1,
  },
  opsIndexTag: {
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  opsIndexText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#45464d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ratingOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f2f4f6',
    padding: 12,
    borderRadius: 12,
  },
  ratingScoreCol: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  starValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starEmoji: {
    fontSize: 20,
    color: Colors.secondaryCobalt,
  },
  ratingScoreNumber: {
    ...Typography.headlineSm,
    fontSize: 22,
    fontWeight: '800',
    color: '#191c1e',
  },
  outOfText: {
    fontSize: 11,
    color: '#76777d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ratingProgressCol: {
    flex: 1,
    minWidth: 0,
  },
  ratingExplanation: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#191c1e',
    lineHeight: 16,
  },
  boldSpan: {
    fontWeight: '700',
    color: '#191c1e',
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#e0e3e5',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.secondaryCobalt,
    borderRadius: 3,
  },
  behavioralTagsSection: {
    gap: 6,
  },
  behavioralSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#76777d',
    letterSpacing: 0.4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  behavioralTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  traitPillSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(78, 222, 163, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  traitIcon: {
    fontSize: 12,
  },
  traitTextSuccess: {
    fontSize: 11,
    fontWeight: '700',
    color: '#005236',
  },
  traitPillCobalt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  traitTextCobalt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00174b',
  },
  traitPillNeutral: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  traitTextNeutral: {
    fontSize: 11,
    fontWeight: '700',
    color: '#191c1e',
  },
  streamBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  streamList: {
    gap: 8,
  },
  streamItem: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  streamTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  streamTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  streamDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  streamServiceTitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: '#191c1e',
    flexShrink: 1,
  },
  streamPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191c1e',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  streamMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    flexWrap: 'wrap',
  },
  ticketIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketLabel: {
    fontSize: 11,
    color: '#76777d',
  },
  ticketCode: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  completedPill: {
    backgroundColor: 'rgba(78, 222, 163, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  completedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#005236',
  },
  cancelledBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelledPill: {
    backgroundColor: '#ffdad6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cancelledPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93000a',
  },
  refundedPill: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  refundedPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#45464d',
  },
  streamFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  techAssignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  techIcon: {
    fontSize: 12,
  },
  techAssignedText: {
    fontSize: 11,
    color: '#45464d',
  },
  streamChevron: {
    fontSize: 16,
    color: '#76777d',
    fontWeight: '700',
  },
  internalTagBadge: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  internalTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00174b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  memoBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  memoText: {
    ...Typography.bodyMd,
    fontSize: 12,
    lineHeight: 18,
    color: '#191c1e',
  },
  memoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 6,
  },
  memoMetaText: {
    fontSize: 10,
    color: '#76777d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actionControlsSection: {
    gap: 8,
    marginTop: 4,
  },
  primaryActionBtn: {
    backgroundColor: '#191c1e',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  primaryActionIcon: {
    fontSize: 16,
  },
  primaryActionText: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  dualButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#e6e8ea',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  secondaryBtnIcon: {
    fontSize: 14,
  },
  secondaryBtnText: {
    ...Typography.bodyMd,
    fontSize: 12,
    fontWeight: '700',
    color: '#191c1e',
    flexShrink: 1,
  },
});
