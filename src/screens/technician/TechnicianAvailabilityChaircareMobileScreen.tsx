import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Platform,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import {
  useTechnician,
  AvailabilityStatus,
} from '../../context/TechnicianContext';
import { technicianApi } from '../../services/api/technicianApi';

/**
 * Screen ID: T04
 * Title: Technician Availability & Schedule
 * Reference: design-reference/technician/technician_availability_chaircare_mobile
 */
export const TechnicianAvailabilityChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    isOnline,
    setIsOnline,
    availabilityStatus,
    setAvailabilityStatus,
    serviceRadius,
    setServiceRadius,
    activeZone,
    schedules,
    updateDaySchedule,
    blockedSlots,
    addBlockedSlot,
    removeBlockedSlot,
  } = useTechnician();

  // Save button animation & feedback state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'syncing' | 'saved'>(
    'idle'
  );
  const btnScale = useRef(new Animated.Value(1)).current;

  // Edit Day Schedule Modal State
  const [editingDay, setEditingDay] = useState<{
    day: string;
    label: string;
    hours: string;
  } | null>(null);
  const [customHours, setCustomHours] = useState<string>('');

  // Add Blocked Time Modal State
  const [isAddBlockModalVisible, setIsAddBlockModalVisible] = useState(false);
  const [newBlockTime, setNewBlockTime] = useState('Today, 3:00 PM – 4:00 PM');
  const [newBlockReason, setNewBlockReason] = useState(
    'Inventory Pickup & Restock'
  );

  const handleSave = () => {
    Animated.sequence([
      Animated.timing(btnScale, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(btnScale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    setSaveStatus('syncing');
    technicianApi
      .updateAvailability(isOnline, activeZone)
      .then(() => {
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus('idle');
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }, 800);
      })
      .catch((err) => {
        setSaveStatus('idle');
        Alert.alert(
          'Sync Failed',
          'Could not synchronize availability status with the server. Please check your connection.'
        );
      });
  };

  const handleEditHours = (day: string, label: string, currentHours: string) => {
    setEditingDay({ day, label, hours: currentHours });
    setCustomHours(currentHours === 'Off Duty' ? '9:00 AM – 7:00 PM' : currentHours);
  };

  const saveEditedHours = () => {
    if (editingDay) {
      updateDaySchedule(editingDay.day, true, customHours.trim());
      setEditingDay(null);
    }
  };

  const handleAddBlockSubmit = () => {
    if (!newBlockTime.trim() || !newBlockReason.trim()) {
      Alert.alert('Missing Info', 'Please provide both a time range and reason.');
      return;
    }
    addBlockedSlot(newBlockTime.trim(), newBlockReason.trim());
    setIsAddBlockModalVisible(false);
  };

  const cycleRadius = () => {
    const nextRadius = serviceRadius === 15 ? 25 : serviceRadius === 25 ? 10 : 15;
    setServiceRadius(nextRadius);
  };

  return (
    <ScreenContainer hasPadding={false}>
      {/* Top Header */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Math.max(insets.top, 12) + 4 },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerMonoCategory}>OPERATIONS</Text>
            <Text style={styles.headerMainTitle}>Technician Availability</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <BrandLogo size={34} rounded={true} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top App Sub-Bar & Coverage Indicator */}
        <View style={styles.telemetryBar}>
          <View style={styles.telemetryLeft}>
            <View
              style={[
                styles.telemetryDot,
                {
                  backgroundColor:
                    availabilityStatus === 'available'
                      ? Colors.tertiaryEmerald
                      : availabilityStatus === 'busy'
                      ? Colors.secondaryContainer
                      : Colors.outline,
                },
              ]}
            />
            <Text style={styles.telemetryText}>Telemetry Synchronized</Text>
          </View>

          <TouchableOpacity
            style={styles.infoBtn}
            onPress={() =>
              Alert.alert(
                'Dispatch Protocol Info',
                'Your real-time availability controls instant algorithmic job allocation within your verified coverage corridor.'
              )
            }
            activeOpacity={0.7}
            accessibilityLabel="Availability protocol info"
          >
            <AppIcon name="Info" size={18} />
          </TouchableOpacity>
        </View>

        {/* Main Availability Toggle Card */}
        <View style={styles.mainToggleCard}>
          <View style={styles.glowAura} />
          <View style={styles.toggleCardTop}>
            <View style={styles.toggleTextGroup}>
              <View style={styles.statusLiveRow}>
                <View
                  style={[
                    styles.pingDot,
                    {
                      backgroundColor:
                        isOnline && availabilityStatus === 'available'
                          ? Colors.tertiaryEmerald
                          : isOnline && availabilityStatus === 'busy'
                          ? Colors.secondaryContainer
                          : Colors.outline,
                    },
                  ]}
                />
                <Text style={styles.mainStatusTitle}>
                  {availabilityStatus === 'available'
                    ? "You're Available"
                    : availabilityStatus === 'busy'
                    ? "You're On Job / Transit"
                    : "You're Offline"}
                </Text>
              </View>
              <Text style={styles.mainStatusDesc}>
                {availabilityStatus === 'available'
                  ? 'You are currently accepting new service requests in your designated coverage zones.'
                  : availabilityStatus === 'busy'
                  ? 'Active in route or on a customer diagnostic. Incoming requests are queued.'
                  : 'You are off duty. Switch online to receive instant dispatch requests.'}
              </Text>
            </View>

            {/* Master Switch */}
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{
                false: Colors.surfaceVariant,
                true: Colors.secondaryContainer,
              }}
              thumbColor="#FFFFFF"
              style={styles.masterSwitch}
            />
          </View>

          {/* Proximity Radius & Zone */}
          <View style={styles.radiusRow}>
            <TouchableOpacity
              style={styles.radiusPill}
              onPress={cycleRadius}
              activeOpacity={0.8}
            >
              <AppIcon name="Radio" size={18} />
              <Text style={styles.radiusText}>
                Active Corridor: {serviceRadius} km Radius
              </Text>
            </TouchableOpacity>

            <View style={styles.zoneTag}>
              <Text style={styles.zoneTagText}>{activeZone}</Text>
            </View>
          </View>
        </View>

        {/* Quick Status Selector */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionMonoHeader}>QUICK STATUS OVERRIDE</Text>
            <Text style={styles.gpsModeText}>Real-time GPS Mode</Text>
          </View>

          <View style={styles.quickStatusGrid}>
            {/* Option 1: Available */}
            <TouchableOpacity
              style={[
                styles.statusBtn,
                availabilityStatus === 'available'
                  ? styles.statusBtnActive
                  : styles.statusBtnInactive,
              ]}
              onPress={() => setAvailabilityStatus('available')}
              activeOpacity={0.8}
            >
              <View style={styles.statusOptionHeader}>
                <View
                  style={[
                    styles.statusOptionDot,
                    { backgroundColor: Colors.tertiaryEmerald },
                  ]}
                />
                <Text
                  style={[
                    styles.statusOptionLabel,
                    availabilityStatus === 'available' &&
                      styles.statusOptionLabelActive,
                  ]}
                >
                  Available
                </Text>
              </View>
              <Text
                style={[
                  styles.statusOptionSub,
                  availabilityStatus === 'available' &&
                    styles.statusOptionSubActive,
                ]}
              >
                Accepting jobs
              </Text>
            </TouchableOpacity>

            {/* Option 2: Busy */}
            <TouchableOpacity
              style={[
                styles.statusBtn,
                availabilityStatus === 'busy'
                  ? styles.statusBtnActive
                  : styles.statusBtnInactive,
              ]}
              onPress={() => setAvailabilityStatus('busy')}
              activeOpacity={0.8}
            >
              <View style={styles.statusOptionHeader}>
                <View
                  style={[
                    styles.statusOptionDot,
                    { backgroundColor: Colors.secondaryContainer },
                  ]}
                />
                <Text
                  style={[
                    styles.statusOptionLabel,
                    availabilityStatus === 'busy' &&
                      styles.statusOptionLabelActive,
                  ]}
                >
                  Busy
                </Text>
              </View>
              <Text
                style={[
                  styles.statusOptionSub,
                  availabilityStatus === 'busy' && styles.statusOptionSubActive,
                ]}
              >
                Transit / Job
              </Text>
            </TouchableOpacity>

            {/* Option 3: Offline */}
            <TouchableOpacity
              style={[
                styles.statusBtn,
                availabilityStatus === 'offline'
                  ? styles.statusBtnActive
                  : styles.statusBtnInactive,
              ]}
              onPress={() => setAvailabilityStatus('offline')}
              activeOpacity={0.8}
            >
              <View style={styles.statusOptionHeader}>
                <View
                  style={[
                    styles.statusOptionDot,
                    { backgroundColor: Colors.outline },
                  ]}
                />
                <Text
                  style={[
                    styles.statusOptionLabel,
                    availabilityStatus === 'offline' &&
                      styles.statusOptionLabelActive,
                  ]}
                >
                  Offline
                </Text>
              </View>
              <Text
                style={[
                  styles.statusOptionSub,
                  availabilityStatus === 'offline' &&
                    styles.statusOptionSubActive,
                ]}
              >
                Off duty
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Route & Deployment Micro-Card */}
        <View style={styles.deploymentCard}>
          <View style={styles.deploymentThumb}>
            <AppIcon name="Armchair" size={18} />
          </View>
          <View style={styles.deploymentDetails}>
            <View style={styles.deploymentTopRow}>
              <Text style={styles.deploymentMonoTag}>CURRENT DEPLOYMENT</Text>
              <Text style={styles.deploymentTimeTag}>Next: 2:30 PM</Text>
            </View>
            <Text style={styles.deploymentTitle} numberOfLines={1}>
              Aeron Cylinder & Casters Overhaul
            </Text>
            <Text style={styles.deploymentLocation} numberOfLines={1}>
              OmniCorp Tower • Floor 14
            </Text>
          </View>
        </View>

        {/* Working Hours Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.workingHoursHeader}>
            <Text style={styles.sectionTitle}>Working Hours</Text>
            <Text style={styles.sectionSub}>Set your recurring weekly schedule</Text>
          </View>

          <View style={styles.daysList}>
            {schedules.map((item) => (
              <View
                key={item.day}
                style={[
                  styles.dayRow,
                  !item.active && styles.dayRowDisabled,
                ]}
              >
                <View style={styles.dayInfoLeft}>
                  <Text
                    style={[
                      styles.dayMonoCode,
                      !item.active && styles.dayMonoCodeDisabled,
                    ]}
                  >
                    {item.day}
                  </Text>
                  <Text
                    style={[
                      styles.dayHoursText,
                      !item.active && styles.dayHoursTextDisabled,
                    ]}
                  >
                    {item.active ? item.hours : 'Off Duty'}
                  </Text>
                </View>

                <View style={styles.dayControlsRight}>
                  <TouchableOpacity
                    style={styles.editHourBtn}
                    onPress={() =>
                      handleEditHours(item.day, item.label, item.hours)
                    }
                    disabled={!item.active}
                    activeOpacity={0.7}
                    accessibilityLabel={`Edit ${item.label} hours`}
                  >
                    <AppIcon name="Edit" size={18} />
                  </TouchableOpacity>

                  <Switch
                    value={item.active}
                    onValueChange={(active) =>
                      updateDaySchedule(item.day, active)
                    }
                    trackColor={{
                      false: Colors.surfaceVariant,
                      true: Colors.secondaryContainer,
                    }}
                    thumbColor="#FFFFFF"
                    style={styles.daySwitch}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Block Time Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.workingHoursHeader}>
            <Text style={styles.sectionTitle}>Block Time</Text>
            <Text style={styles.sectionSub}>
              Prevent new bookings during personal or unavailable hours.
            </Text>
          </View>

          {/* Action Button to Add */}
          <TouchableOpacity
            style={styles.addBlockBtn}
            onPress={() => setIsAddBlockModalVisible(true)}
            activeOpacity={0.8}
          >
            <AppIcon name="Plus" size={18} />
            <Text style={styles.addBlockBtnText}>Add unavailable time</Text>
          </TouchableOpacity>

          {/* Existing Blocked Slots */}
          {blockedSlots.map((slot) => (
            <View key={slot.id} style={styles.blockedSlotCard}>
              <View style={styles.blockedSlotLeft}>
                <View style={styles.blockedRedDot} />
                <View style={styles.blockedSlotTextCol}>
                  <Text style={styles.blockedTimeText}>{slot.timeRange}</Text>
                  <Text style={styles.blockedReasonText}>{slot.reason}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.removeBlockBtn}
                onPress={() => removeBlockedSlot(slot.id)}
                activeOpacity={0.7}
                accessibilityLabel="Remove blocked time"
              >
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Zone Optimization Mini Insight */}
        <View style={styles.insightCard}>
          <View style={styles.insightIconPod}>
            <AppIcon name="Zap" size={18} />
          </View>
          <View style={styles.insightTextCol}>
            <Text style={styles.insightTitle}>Peak Demand Window</Text>
            <Text style={styles.insightBody}>
              Demand for lumbar & cylinder tuning is +35% in Metro Central between
              2 PM and 5 PM.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Save Area */}
      <View
        style={[
          styles.stickyFooter,
          { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              saveStatus === 'saved' && styles.saveBtnSuccess,
            ]}
            onPress={handleSave}
            disabled={saveStatus !== 'idle'}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnIcon}>
              {saveStatus === 'syncing'
                ? 'Syncing'
                : saveStatus === 'saved'
                ? '✓'
                : '✓'}
            </Text>
            <Text style={styles.saveBtnText}>
              {saveStatus === 'syncing'
                ? 'Syncing Radar...'
                : saveStatus === 'saved'
                ? 'Saved & Live'
                : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.footerHelpText}>
          Schedule changes reflect immediately in the customer dispatch radar.
        </Text>
      </View>

      {/* Edit Day Hours Modal */}
      <Modal
        visible={!!editingDay}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingDay(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Edit {editingDay?.label} Working Hours
            </Text>
            <Text style={styles.modalSub}>
              Enter standard operating time for this day.
            </Text>

            <TextInput
              style={styles.modalInput}
              value={customHours}
              onChangeText={setCustomHours}
              placeholder="e.g. 9:00 AM – 7:00 PM"
              placeholderTextColor={Colors.outline}
            />

            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetPill}
                onPress={() => setCustomHours('9:00 AM – 6:00 PM')}
              >
                <Text style={styles.presetPillText}>9 AM – 6 PM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetPill}
                onPress={() => setCustomHours('9:00 AM – 7:00 PM')}
              >
                <Text style={styles.presetPillText}>9 AM – 7 PM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetPill}
                onPress={() => setCustomHours('10:00 AM – 5:00 PM')}
              >
                <Text style={styles.presetPillText}>10 AM – 5 PM</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditingDay(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={saveEditedHours}
              >
                <Text style={styles.modalConfirmText}>Save Hours</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Block Time Modal */}
      <Modal
        visible={isAddBlockModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAddBlockModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Unavailable Block</Text>
            <Text style={styles.modalSub}>
              Set a temporary blackout window to pause incoming requests.
            </Text>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>TIME WINDOW</Text>
              <TextInput
                style={styles.modalInput}
                value={newBlockTime}
                onChangeText={setNewBlockTime}
                placeholder="e.g. Today, 3:00 PM – 4:30 PM"
                placeholderTextColor={Colors.outline}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>REASON</Text>
              <TextInput
                style={styles.modalInput}
                value={newBlockReason}
                onChangeText={setNewBlockReason}
                placeholder="e.g. Lunch Break / Inventory Restock"
                placeholderTextColor={Colors.outline}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsAddBlockModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleAddBlockSubmit}
              >
                <Text style={styles.modalConfirmText}>Add Block</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    backgroundColor: 'rgba(247, 249, 251, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
    paddingHorizontal: 16,
    paddingBottom: 10,
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerMonoCategory: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  headerMainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  headerRight: {
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  telemetryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  telemetryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  telemetryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  telemetryText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 14,
  },
  mainToggleCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    gap: 14,
    ...Shadows.level1,
  },
  glowAura: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(219, 225, 255, 0.4)',
  },
  toggleCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleTextGroup: {
    flex: 1,
    gap: 6,
  },
  statusLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  mainStatusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.4,
  },
  mainStatusDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  masterSwitch: {
    marginTop: 2,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingTop: 10,
  },
  radiusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  radarIcon: {
    fontSize: 13,
  },
  radiusText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  zoneTag: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  zoneTagText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.outline,
    fontWeight: '600',
  },
  sectionContainer: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionMonoHeader: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.outline,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  gpsModeText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.secondaryContainer,
    fontWeight: '600',
  },
  quickStatusGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    padding: 12,
    borderRadius: BorderRadius.xl,
    gap: 4,
    ...Shadows.level1,
  },
  statusBtnActive: {
    backgroundColor: Colors.primaryContainer,
  },
  statusBtnInactive: {
    backgroundColor: Colors.surfaceContainerLowest,
  },
  statusOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusOptionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOptionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  statusOptionLabelActive: {
    color: '#FFFFFF',
  },
  statusOptionSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  statusOptionSubActive: {
    color: Colors.inversePrimary,
  },
  deploymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 12,
    ...Shadows.level1,
  },
  deploymentThumb: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deploymentThumbIcon: {
    fontSize: 24,
  },
  deploymentDetails: {
    flex: 1,
    gap: 2,
  },
  deploymentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deploymentMonoTag: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryContainer,
  },
  deploymentTimeTag: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
    fontWeight: '600',
  },
  deploymentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  deploymentLocation: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  workingHoursHeader: {
    gap: 2,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  daysList: {
    gap: 8,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...Shadows.level1,
  },
  dayRowDisabled: {
    backgroundColor: Colors.surfaceContainerLow,
    opacity: 0.65,
  },
  dayInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  dayMonoCode: {
    ...Typography.labelMono,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.onSurface,
    width: 38,
  },
  dayMonoCodeDisabled: {
    color: Colors.outline,
  },
  dayHoursText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  dayHoursTextDisabled: {
    color: Colors.outline,
  },
  dayControlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editHourBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 14,
  },
  editIconDisabled: {
    opacity: 0.4,
  },
  daySwitch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  addBlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceContainer,
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
  },
  addBlockIcon: {
    fontSize: 14,
    color: Colors.secondaryContainer,
  },
  addBlockBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  blockedSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 12,
    ...Shadows.level1,
  },
  blockedSlotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  blockedRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  blockedSlotTextCol: {
    flex: 1,
    gap: 1,
  },
  blockedTimeText: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  blockedReasonText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  removeBlockBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBlockIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.outline,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceContainer,
    padding: 12,
    borderRadius: BorderRadius.xl,
  },
  insightIconPod: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightBoltIcon: {
    fontSize: 18,
  },
  insightTextCol: {
    flex: 1,
    gap: 2,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  insightBody: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 15,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 50,
    gap: 4,
    ...Shadows.level3,
  },
  saveBtn: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  saveBtnSuccess: {
    backgroundColor: Colors.tertiaryEmerald,
  },
  saveBtnIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerHelpText: {
    fontSize: 11,
    color: Colors.outline,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxl,
    padding: 20,
    gap: 14,
    ...Shadows.level3,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: -8,
  },
  modalInputGroup: {
    gap: 4,
  },
  modalInputLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.outline,
  },
  modalInput: {
    height: 44,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
  },
  presetPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  modalConfirmBtn: {
    flex: 1,
    height: 42,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
