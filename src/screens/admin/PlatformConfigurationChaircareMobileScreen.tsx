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
  Platform,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface PlatformConfigurationProps {
  navigation?: any;
}

const TIME_ZONE_OPTIONS = [
  'Asia/Kolkata (IST • UTC+05:30)',
  'Asia/Dubai (GST • UTC+04:00)',
  'Asia/Singapore (SGT • UTC+08:00)',
  'UTC (Coordinated Universal Time)',
];

export const PlatformConfigurationChaircareMobileScreen: React.FC<
  PlatformConfigurationProps
> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Pulse animation for live sync ribbon
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

  // Form State
  const [masterSwitch, setMasterSwitch] = useState<boolean>(true);
  const [platformName, setPlatformName] = useState<string>('ChairCare');
  const [supportEmail, setSupportEmail] = useState<string>('admin.support@chaircare.in');
  const [supportPhone, setSupportPhone] = useState<string>('+91 80 4920 1800');
  const [settlementCurrency, setSettlementCurrency] = useState<'INR' | 'USD' | 'AED'>('INR');
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>(TIME_ZONE_OPTIONS[0]);
  const [timeZoneModalVisible, setTimeZoneModalVisible] = useState<boolean>(false);

  // Booking & Dispatch Rules State
  const [enableCustomerBookings, setEnableCustomerBookings] = useState<boolean>(true);
  const [allowSameDayBooking, setAllowSameDayBooking] = useState<boolean>(true);
  const [minDispatchNotice, setMinDispatchNotice] = useState<number>(30); // in minutes
  const [advanceDays, setAdvanceDays] = useState<number>(30);

  // Operating Schedule Modal
  const [scheduleModalVisible, setScheduleModalVisible] = useState<boolean>(false);

  // Toast Notification State
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
    }, 2500);
  };

  const handleAdjustDays = (delta: number) => {
    const nextVal = Math.max(7, Math.min(90, advanceDays + delta));
    setAdvanceDays(nextVal);
  };

  const handleCommitChanges = () => {
    if (masterSwitch) {
      displayToast('Platform changes successfully deployed live.');
    } else {
      displayToast('Platform paused. Emergency protocols active.');
    }
  };

  const formatNoticeText = (minutes: number) => {
    if (minutes >= 60) {
      return `${minutes / 60}h`;
    }
    return `${minutes} min`;
  };

  return (
    <View style={styles.screenContainer}>
      {/* Top Header Bar */}
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
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Ergonomic Calibration Rules
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            onPress={() => displayToast('Configuration menu options')}
            accessibilityLabel="More actions"
          >
            <AppIcon name="more_vert" size={20} />
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
        {/* System Scope Badge & Ribbon */}
        <View style={styles.ribbonContainer}>
          <View style={styles.ribbonLeft}>
            <Animated.View
              style={[styles.pulseDot, { opacity: pulseAnim }]}
            />
            <Text style={styles.ribbonCodeText}>
              CORE ENGINE RULES // REV v2.4
            </Text>
          </View>
          <View style={styles.realtimeBadge}>
            <Text style={styles.realtimeBadgeText}>REALTIME SYNC</Text>
          </View>
        </View>

        {/* Service Availability Master Switch Card */}
        <View style={styles.masterSwitchCard}>
          <View style={styles.masterSwitchTopRow}>
            <View style={styles.masterSwitchInfo}>
              <View style={styles.masterSwitchHeadingRow}>
                <AppIcon name="power_settings_new" size={20} />
                <Text style={styles.masterSwitchTitle}>Accept Service Requests</Text>
              </View>
              <Text style={styles.masterSwitchDescription}>
                Turning this off temporarily halts customer booking initiation across all clusters. In-flight tasks continue as scheduled.
              </Text>
            </View>

            {/* Custom Toggle Switch */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                const nextState = !masterSwitch;
                setMasterSwitch(nextState);
                displayToast(
                  nextState
                    ? 'Service request acceptance enabled'
                    : 'Service request acceptance paused platform-wide'
                );
              }}
              style={[
                styles.toggleTrack,
                masterSwitch ? styles.toggleTrackActive : styles.toggleTrackInactive,
              ]}
              accessibilityRole="switch"
              accessibilityState={{ checked: masterSwitch }}
            >
              <View
                style={[
                  styles.toggleThumb,
                  masterSwitch ? styles.toggleThumbActive : styles.toggleThumbInactive,
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Active Status Footer Indicator */}
          <View style={styles.masterStatusIndicatorRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: masterSwitch ? '#4edea3' : '#ba1a1a' },
              ]}
            />
            <Text style={styles.masterStatusText}>
              {masterSwitch
                ? '84 active field requests progressing normally'
                : 'Booking reception paused • Active field tasks unaffected'}
            </Text>
          </View>
        </View>

        {/* General Settings Card */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <AppIcon name="tune" size={20} />
              <Text style={styles.cardTitle}>General Settings</Text>
            </View>
            <Text style={styles.cardHeaderRightTag}>GLOBAL PARAMETERS</Text>
          </View>

          {/* Platform Legal Name */}
          <View style={styles.formFieldGroup}>
            <Text style={styles.fieldLabel}>Platform Legal Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={platformName}
                onChangeText={setPlatformName}
                placeholder="Enter platform legal name"
                placeholderTextColor={Colors.onSurfaceVariant}
              />
            </View>
          </View>

          {/* Super Admin Support Email */}
          <View style={styles.formFieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Super Admin Support Email</Text>
              <View style={styles.verifiedBadge}>
                <AppIcon name="verified" size={20} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={supportEmail}
                onChangeText={setSupportEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="admin.support@chaircare.in"
                placeholderTextColor={Colors.onSurfaceVariant}
              />
            </View>
          </View>

          {/* Central Operations Line */}
          <View style={styles.formFieldGroup}>
            <Text style={styles.fieldLabel}>Central Operations Line</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.countryCodeText}>IND</Text>
              <TextInput
                style={[styles.textInput, styles.monoInputText]}
                value={supportPhone}
                onChangeText={setSupportPhone}
                keyboardType="phone-pad"
                placeholder="+91 80 4920 1800"
                placeholderTextColor={Colors.onSurfaceVariant}
              />
            </View>
          </View>

          {/* Settlement Currency */}
          <View style={styles.formFieldGroup}>
            <Text style={styles.fieldLabel}>Settlement Currency</Text>
            <View style={styles.currencyPillsContainer}>
              <TouchableOpacity
                style={[
                  styles.currencyPill,
                  settlementCurrency === 'INR' && styles.currencyPillActive,
                ]}
                onPress={() => {
                  setSettlementCurrency('INR');
                  displayToast('Settlement currency adjusted to INR');
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.currencyPillText,
                    settlementCurrency === 'INR' && styles.currencyPillTextActive,
                  ]}
                >
                  INR (₹)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.currencyPill,
                  settlementCurrency === 'USD' && styles.currencyPillActive,
                ]}
                onPress={() => {
                  setSettlementCurrency('USD');
                  displayToast('Settlement currency adjusted to USD');
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.currencyPillText,
                    settlementCurrency === 'USD' && styles.currencyPillTextActive,
                  ]}
                >
                  USD ($)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.currencyPill,
                  settlementCurrency === 'AED' && styles.currencyPillActive,
                ]}
                onPress={() => {
                  setSettlementCurrency('AED');
                  displayToast('Settlement currency adjusted to AED');
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.currencyPillText,
                    settlementCurrency === 'AED' && styles.currencyPillTextActive,
                  ]}
                >
                  AED (د.إ)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Primary Operational Time Zone */}
          <View style={styles.formFieldGroup}>
            <Text style={styles.fieldLabel}>Primary Operational Time Zone</Text>
            <TouchableOpacity
              style={styles.selectDropdown}
              onPress={() => setTimeZoneModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.selectDropdownText} numberOfLines={1}>
                {selectedTimeZone}
              </Text>
              <AppIcon name="expand_more" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Booking & Dispatch Rules Card */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <AppIcon name="dynamic_feed" size={20} />
              <Text style={styles.cardTitle}>Booking & Dispatch</Text>
            </View>
            <Text style={styles.cardHeaderAutomatedTag}>AUTOMATED</Text>
          </View>

          {/* Toggle 1: Enable Customer Bookings */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Enable Customer Bookings</Text>
              <Text style={styles.toggleSubtitle}>
                Permit end-user web and mobile app booking checkouts
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                const nextState = !enableCustomerBookings;
                setEnableCustomerBookings(nextState);
                displayToast(
                  nextState
                    ? 'Customer checkout enabled'
                    : 'Customer checkout paused'
                );
              }}
              style={[
                styles.smallToggleTrack,
                enableCustomerBookings
                  ? styles.smallToggleTrackActive
                  : styles.smallToggleTrackInactive,
              ]}
              accessibilityRole="switch"
              accessibilityState={{ checked: enableCustomerBookings }}
            >
              <View
                style={[
                  styles.smallToggleThumb,
                  enableCustomerBookings
                    ? styles.smallToggleThumbActive
                    : styles.smallToggleThumbInactive,
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Toggle 2: Same-day Booking */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Allow Same-Day Booking</Text>
              <Text style={styles.toggleSubtitle}>
                Instant technician routing for urgent ergonomic fixes
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                const nextState = !allowSameDayBooking;
                setAllowSameDayBooking(nextState);
                displayToast(
                  nextState
                    ? 'Same-day booking dispatch enabled'
                    : 'Same-day booking dispatch disabled'
                );
              }}
              style={[
                styles.smallToggleTrack,
                allowSameDayBooking
                  ? styles.smallToggleTrackActive
                  : styles.smallToggleTrackInactive,
              ]}
              accessibilityRole="switch"
              accessibilityState={{ checked: allowSameDayBooking }}
            >
              <View
                style={[
                  styles.smallToggleThumb,
                  allowSameDayBooking
                    ? styles.smallToggleThumbActive
                    : styles.smallToggleThumbInactive,
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Stepper 1: Minimum Booking Notice */}
          <View style={styles.stepperGroup}>
            <View style={styles.stepperHeaderRow}>
              <Text style={styles.stepperLabel}>Minimum Dispatch Notice</Text>
              <Text style={styles.stepperValueBadge}>
                {formatNoticeText(minDispatchNotice)}
              </Text>
            </View>
            <View style={styles.noticePillsGrid}>
              {[15, 30, 60, 120].map((mins) => {
                const isSelected = minDispatchNotice === mins;
                const label = mins >= 60 ? `${mins / 60}h` : `${mins}m`;
                return (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.noticePill,
                      isSelected && styles.noticePillActive,
                    ]}
                    onPress={() => {
                      setMinDispatchNotice(mins);
                      displayToast(
                        `Dispatch notice threshold updated to ${formatNoticeText(
                          mins
                        )}`
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.noticePillText,
                        isSelected && styles.noticePillTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Stepper 2: Maximum Advance Booking */}
          <View style={styles.maxAdvanceRow}>
            <View style={styles.maxAdvanceInfo}>
              <Text style={styles.stepperLabel}>Max Advance Booking</Text>
              <Text style={styles.toggleSubtitle}>
                Prevent calendar bloat beyond window
              </Text>
            </View>
            <View style={styles.advanceStepperControl}>
              <TouchableOpacity
                style={styles.advanceStepperBtn}
                onPress={() => handleAdjustDays(-5)}
                activeOpacity={0.7}
                accessibilityLabel="Decrease advance days"
              >
                <AppIcon name="remove" size={20} />
              </TouchableOpacity>
              <Text style={styles.advanceDaysText}>{advanceDays} days</Text>
              <TouchableOpacity
                style={styles.advanceStepperBtn}
                onPress={() => handleAdjustDays(5)}
                activeOpacity={0.7}
                accessibilityLabel="Increase advance days"
              >
                <AppIcon name="add" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Operating Windows Card */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <AppIcon name="calendar_today" size={20} />
              <Text style={styles.cardTitle}>Operating Windows</Text>
            </View>
            <View style={styles.operatingActiveBadge}>
              <View style={styles.operatingGreenDot} />
              <Text style={styles.operatingActiveText}>ACTIVE</Text>
            </View>
          </View>

          <View style={styles.operatingWindowsList}>
            {/* Monday - Saturday */}
            <View style={styles.operatingWindowItem}>
              <View style={styles.operatingWindowLeft}>
                <Text style={styles.operatingWindowDay}>Monday – Saturday</Text>
                <Text style={styles.operatingWindowServiceTag}>
                  Active Field Dispatch Window
                </Text>
              </View>
              <View style={styles.operatingWindowRight}>
                <Text style={styles.operatingWindowHours}>10:00 AM – 7:00 PM</Text>
                <Text style={styles.operatingWindowCoverage}>9h daily coverage</Text>
              </View>
            </View>

            {/* Sunday */}
            <View style={styles.operatingWindowItem}>
              <View style={styles.operatingWindowLeft}>
                <Text style={styles.operatingWindowDay}>Sunday</Text>
                <Text style={styles.operatingWindowClosedTag}>
                  Closed for routine dispatch
                </Text>
              </View>
              <View style={styles.emergencyTag}>
                <Text style={styles.emergencyTagText}>Emergency Tier-1 Only</Text>
              </View>
            </View>
          </View>

          {/* Edit Operating Schedule Trigger */}
          <TouchableOpacity
            style={styles.editScheduleButton}
            onPress={() => {
              setScheduleModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <AppIcon name="edit_calendar" size={20} />
            <Text style={styles.editScheduleText}>
              Edit Operating Hours Schedule
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Realtime Confirmation Toast Container */}
      {toastVisible && (
        <View
          style={[
            styles.toastContainer,
            { bottom: Math.max(insets.bottom, 20) + 75 },
          ]}
        >
          <View style={styles.toastLeft}>
            <AppIcon name="check_circle" size={20} />
            <Text style={styles.toastMessageText} numberOfLines={2}>
              {toastMessage}
            </Text>
          </View>
          <Text style={styles.toastNowTag}>NOW</Text>
        </View>
      )}

      {/* Sticky Bottom Commit Bar */}
      <View
        style={[
          styles.bottomCommitBar,
          { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
      >
        <View style={styles.bottomCommitBarContent}>
          <TouchableOpacity
            style={styles.commitButton}
            onPress={handleCommitChanges}
            activeOpacity={0.85}
          >
            <AppIcon name="save" size={20} />
            <Text style={styles.commitButtonText}>
              Save Changes (Confirm Update)
            </Text>
          </TouchableOpacity>
          <Text style={styles.commitSubtext}>
            Changes take effect platform-wide immediately upon commit
          </Text>
        </View>
      </View>

      {/* Timezone Selection Modal */}
      <Modal
        visible={timeZoneModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimeZoneModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTimeZoneModalVisible(false)}
        >
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Operational Time Zone</Text>
              <TouchableOpacity
                onPress={() => setTimeZoneModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalList}>
              {TIME_ZONE_OPTIONS.map((tz) => {
                const isSelected = selectedTimeZone === tz;
                return (
                  <TouchableOpacity
                    key={tz}
                    style={[
                      styles.modalOptionItem,
                      isSelected && styles.modalOptionItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedTimeZone(tz);
                      setTimeZoneModalVisible(false);
                      displayToast(`Time zone updated to ${tz.split(' ')[0]}`);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {tz}
                    </Text>
                    {isSelected && (
                      <AppIcon name="check" size={20} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Operating Schedule Modal / Drawer */}
      <Modal
        visible={scheduleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setScheduleModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setScheduleModalVisible(false)}
        >
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Operating Hours Matrix</Text>
              <TouchableOpacity
                onPress={() => setScheduleModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>
            <View style={styles.scheduleMatrixContent}>
              <View style={styles.scheduleMatrixRow}>
                <Text style={styles.matrixDayLabel}>Mon - Fri Shift</Text>
                <Text style={styles.matrixTimeLabel}>09:00 AM - 08:00 PM</Text>
              </View>
              <View style={styles.scheduleMatrixRow}>
                <Text style={styles.matrixDayLabel}>Saturday Shift</Text>
                <Text style={styles.matrixTimeLabel}>10:00 AM - 07:00 PM</Text>
              </View>
              <View style={styles.scheduleMatrixRow}>
                <Text style={styles.matrixDayLabel}>Sunday Protocol</Text>
                <Text style={styles.matrixTimeLabel}>On-Call Emergency Dispatch</Text>
              </View>

              <TouchableOpacity
                style={styles.matrixSaveButton}
                onPress={() => {
                  setScheduleModalVisible(false);
                  displayToast('Operating schedule matrix updated');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.matrixSaveButtonText}>Apply Schedule Windows</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    marginLeft: -4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  materialIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 24,
    color: '#191c1e',
  },
  headerTitleText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 20,
    lineHeight: 28,
    color: '#191c1e',
    marginLeft: 4,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  actionIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#45464d',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#bec6e0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#131b2e',
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  scrollContentDesktop: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },

  /* System Scope Badge & Ribbon */
  ribbonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#eceef0',
    borderRadius: 12,
  },
  ribbonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4edea3',
  },
  ribbonCodeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    lineHeight: 14,
    color: '#45464d',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  realtimeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: '#dbe1ff',
  },
  realtimeBadgeText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10,
    lineHeight: 13,
    color: '#00174b',
    fontWeight: '600',
  },

  /* Master Switch Card */
  masterSwitchCard: {
    padding: 16,
    backgroundColor: 'rgba(219, 225, 255, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 81, 213, 0.12)',
    gap: 14,
  },
  masterSwitchTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  masterSwitchInfo: {
    flex: 1,
    gap: 4,
  },
  masterSwitchHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  powerIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#0051d5',
  },
  masterSwitchTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    lineHeight: 24,
    color: '#191c1e',
  },
  masterSwitchDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#45464d',
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
    marginTop: 2,
  },
  toggleTrackActive: {
    backgroundColor: '#0051d5',
  },
  toggleTrackInactive: {
    backgroundColor: '#e0e3e5',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleThumbInactive: {
    alignSelf: 'flex-start',
  },

  masterStatusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  masterStatusText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    lineHeight: 15,
    color: '#45464d',
  },

  /* Card General Styles */
  cardContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#0051d5',
  },
  cardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    lineHeight: 24,
    color: '#191c1e',
  },
  cardHeaderRightTag: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    lineHeight: 14,
    color: '#76777d',
    textTransform: 'uppercase',
  },
  cardHeaderAutomatedTag: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    lineHeight: 14,
    color: '#0051d5',
  },

  /* Form Fields */
  formFieldGroup: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: '#45464d',
    letterSpacing: 0.2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#009668',
  },
  verifiedText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#009668',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#191c1e',
    paddingVertical: 0,
  },
  monoInputText: {
    fontFamily: 'JetBrainsMono-Medium',
  },
  countryCodeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#76777d',
    marginRight: 8,
  },

  /* Currency Pills */
  currencyPillsContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
  },
  currencyPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPillActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  currencyPillText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#45464d',
  },
  currencyPillTextActive: {
    fontFamily: 'JetBrainsMono-SemiBold',
    color: '#191c1e',
    fontWeight: '600',
  },

  /* Timezone Dropdown */
  selectDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
  },
  selectDropdownText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#191c1e',
    flex: 1,
    marginRight: 8,
  },
  selectDropdownIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#45464d',
  },

  /* Booking & Dispatch Rules */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  toggleInfo: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: '#191c1e',
  },
  toggleSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: '#76777d',
  },
  smallToggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  smallToggleTrackActive: {
    backgroundColor: '#0051d5',
  },
  smallToggleTrackInactive: {
    backgroundColor: '#e0e3e5',
  },
  smallToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 1,
  },
  smallToggleThumbActive: {
    alignSelf: 'flex-end',
  },
  smallToggleThumbInactive: {
    alignSelf: 'flex-start',
  },

  /* Steppers */
  stepperGroup: {
    gap: 8,
  },
  stepperHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#191c1e',
  },
  stepperValueBadge: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 12,
    color: '#0051d5',
  },
  noticePillsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  noticePill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#f2f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticePillActive: {
    backgroundColor: '#0051d5',
  },
  noticePillText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#45464d',
  },
  noticePillTextActive: {
    fontFamily: 'JetBrainsMono-SemiBold',
    color: '#ffffff',
  },

  maxAdvanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  maxAdvanceInfo: {
    flex: 1,
    gap: 2,
    marginRight: 12,
  },
  advanceStepperControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f2f4f6',
    padding: 4,
    borderRadius: 8,
  },
  advanceStepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1.5,
    elevation: 1,
  },
  advanceStepperBtnIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
  },
  advanceDaysText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 12,
    color: '#191c1e',
    minWidth: 58,
    textAlign: 'center',
  },

  /* Operating Windows */
  operatingActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  operatingGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4edea3',
  },
  operatingActiveText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    color: '#009668',
  },
  operatingWindowsList: {
    gap: 8,
  },
  operatingWindowItem: {
    padding: 12,
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  operatingWindowLeft: {
    flex: 1,
    gap: 2,
  },
  operatingWindowDay: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: '#191c1e',
  },
  operatingWindowServiceTag: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#0051d5',
  },
  operatingWindowClosedTag: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#76777d',
  },
  operatingWindowRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  operatingWindowHours: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 12,
    color: '#191c1e',
  },
  operatingWindowCoverage: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#76777d',
  },
  emergencyTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#eceef0',
  },
  emergencyTagText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#ba1a1a',
  },
  editScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#e6e8ea',
  },
  editScheduleIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
  },
  editScheduleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#191c1e',
  },

  /* Toast Notification */
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#131b2e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  toastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  toastIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#6ffbbe',
  },
  toastMessageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#ffffff',
    flex: 1,
  },
  toastNowTag: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#7c839b',
  },

  /* Sticky Bottom Commit Bar */
  bottomCommitBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  bottomCommitBarContent: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
    gap: 6,
  },
  commitButton: {
    height: 48,
    backgroundColor: '#000000',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  commitButtonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ffffff',
  },
  commitButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  commitSubtext: {
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 14,
    color: '#76777d',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '75%',
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 17,
    color: '#191c1e',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f2f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
  },
  modalList: {
    gap: 8,
  },
  modalOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#f7f9fb',
  },
  modalOptionItemSelected: {
    backgroundColor: '#dbe1ff',
  },
  modalOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#191c1e',
    flex: 1,
  },
  modalOptionTextSelected: {
    fontFamily: 'Inter-SemiBold',
    color: '#00174b',
  },
  modalOptionCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
  },

  /* Schedule Matrix Content in Modal */
  scheduleMatrixContent: {
    gap: 12,
  },
  scheduleMatrixRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f7f9fb',
    borderRadius: 8,
  },
  matrixDayLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#191c1e',
  },
  matrixTimeLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#0051d5',
  },
  matrixSaveButton: {
    marginTop: 8,
    height: 44,
    backgroundColor: '#0051d5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matrixSaveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
});
