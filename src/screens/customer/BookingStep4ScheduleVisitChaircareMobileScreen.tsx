import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { PrecisionButton } from '../../components/common/PrecisionButton';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';

interface DateOption {
  id: string;
  tag: string;
  dayNum: string;
  dayOfWeek: string;
  fullDate: string;
  monthYear: string;
  isToday: boolean;
}

const generateDynamicDateOptions = (daysCount = 14): DateOption[] => {
  const options: DateOption[] = [];
  const now = new Date();
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthFullNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const dayNum = String(d.getDate()).padStart(2, '0');
    const dayOfWeek = dayNames[d.getDay()];
    const monthShort = monthShortNames[d.getMonth()];
    const monthFull = monthFullNames[d.getMonth()];
    const year = d.getFullYear();

    let tag = dayOfWeek;
    let fullDate = `${dayOfWeek}, ${d.getDate()} ${monthShort}`;

    if (i === 0) {
      tag = 'Today';
      fullDate = `Today, ${d.getDate()} ${monthShort}`;
    } else if (i === 1) {
      tag = 'Tmrw';
      fullDate = `Tomorrow, ${d.getDate()} ${monthShort}`;
    } else if (d.getDay() === 0 || d.getDay() === 6) {
      tag = 'Wknd';
      fullDate = `${dayOfWeek}, ${d.getDate()} ${monthShort}`;
    } else if (i === 2) {
      tag = 'Day 3';
    }

    options.push({
      id: `date_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`,
      tag,
      dayNum,
      dayOfWeek,
      fullDate,
      monthYear: `${monthFull} ${year}`,
      isToday: i === 0,
    });
  }
  return options;
};

interface TimeSlot {
  id: string;
  period: 'morning' | 'afternoon' | 'evening';
  timeDisplay: string;
  subtext: string;
  badge?: string;
  isBooked?: boolean;
}

const TIME_SLOTS: TimeSlot[] = [
  {
    id: 't-0930',
    period: 'morning',
    timeDisplay: '09:30 AM – 11:00 AM',
    subtext: 'Fast Morning Dispatch',
  },
  {
    id: 't-1100',
    period: 'morning',
    timeDisplay: '11:00 AM – 12:30 PM',
    subtext: 'Standard Dispatch',
  },
  {
    id: 't-1330',
    period: 'afternoon',
    timeDisplay: '01:30 PM – 03:00 PM',
    subtext: 'Available',
  },
  {
    id: 't-1530',
    period: 'afternoon',
    timeDisplay: '03:30 PM – 05:00 PM',
    subtext: 'Optimal Traffic Route',
    badge: 'Best Match',
  },
  {
    id: 't-1700',
    period: 'afternoon',
    timeDisplay: '05:00 PM – 06:30 PM',
    subtext: 'Available',
  },
  {
    id: 't-1830',
    period: 'evening',
    timeDisplay: '06:30 PM – 08:00 PM',
    subtext: 'Available (Quiet Hours)',
  },
];

/**
 * Screen ID: C07
 * Title: Booking Step 4: Schedule Visit & Slot
 * Reference: design-reference/customer/booking_step_4_schedule_visit_chaircare_mobile
 */
export const BookingStep4ScheduleVisitChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { draft, updateDraft } = useBooking();

  // Dynamic real-date options for the next 14 days
  const dateOptions = React.useMemo(() => generateDynamicDateOptions(14), []);

  const [isExpress, setIsExpress] = useState<boolean>(false);
  const [selectedDateId, setSelectedDateId] = useState<string>(() => {
    if (draft?.visitDate) {
      const match = dateOptions.find((d) => d.fullDate === draft.visitDate);
      if (match) return match.id;
    }
    return dateOptions[0]?.id || 'date_today';
  });
  const [selectedTimeId, setSelectedTimeId] = useState<string>('t-1530');

  const selectedDateObj =
    dateOptions.find((d) => d.id === selectedDateId) || dateOptions[0];
  const selectedTimeObj =
    TIME_SLOTS.find((t) => t.id === selectedTimeId) || TIME_SLOTS[3];

  const handleToggleExpress = (value: boolean) => {
    setIsExpress(value);
  };

  const handleSelectDate = (dateId: string) => {
    setSelectedDateId(dateId);
    if (isExpress) setIsExpress(false);
  };

  const handleSelectTime = (slot: TimeSlot) => {
    if (slot.isBooked) return;
    setSelectedTimeId(slot.id);
    if (isExpress) setIsExpress(false);
  };

  const handleContinue = () => {
    const finalVisitDate = isExpress
      ? 'Today (Express Dispatch)'
      : selectedDateObj.fullDate;
    const finalTimeSlot = isExpress
      ? 'Under 45 Mins (Express Dispatch)'
      : selectedTimeObj.timeDisplay;

    updateDraft({
      visitDate: finalVisitDate,
      timeSlot: finalTimeSlot,
    });

    navigation.navigate('BookingStep5');
  };

  const morningSlots = TIME_SLOTS.filter((s) => s.period === 'morning');
  const afternoonSlots = TIME_SLOTS.filter((s) => s.period === 'afternoon');
  const eveningSlots = TIME_SLOTS.filter((s) => s.period === 'evening');

  return (
    <ScreenContainer hasPadding={false}>
      {/* Top Header Bar */}
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
          <View>
            <Text style={styles.flowLabel}>CHAIRCARE FLOW</Text>
            <Text style={styles.headerTitle}>Review & Authorization</Text>
          </View>
        </View>

        {isAuthenticated && (
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('CustomerProfileTab')}
            activeOpacity={0.7}
          >
            <AppIcon name="User" size={18} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Tracker */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.stepCounterText}>STEP 4 OF 5</Text>
            <Text style={styles.percentText}>80% COMPLETE</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '80%' }]} />
          </View>
        </View>

        {/* Screen Heading */}
        <View style={styles.headingSection}>
          <Text style={styles.mainHeading}>When should we visit?</Text>
          <Text style={styles.subHeading}>
            Choose a convenient date and precision calibration slot.
          </Text>
        </View>

        {/* Express Dispatch Card (ASAP Option) */}
        <TouchableOpacity
          style={[
            styles.expressCard,
            isExpress ? styles.expressCardActive : styles.expressCardInactive,
          ]}
          onPress={() => handleToggleExpress(!isExpress)}
          activeOpacity={0.85}
        >
          <View style={styles.expressLeft}>
            <View
              style={[
                styles.expressIconBox,
                isExpress
                  ? styles.expressIconBoxActive
                  : styles.expressIconBoxInactive,
              ]}
            >
              <AppIcon name="Zap" size={18} />
            </View>
            <View style={styles.expressInfo}>
              <View style={styles.expressTitleRow}>
                <Text
                  style={[
                    styles.expressTitle,
                    isExpress && styles.expressTextActive,
                  ]}
                >
                  Express Dispatch
                </Text>
                <View style={styles.fastestBadge}>
                  <Text style={styles.fastestBadgeText}>FASTEST</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.expressSub,
                  isExpress && styles.expressSubActive,
                ]}
              >
                Technician on standby nearby • In ~45 mins
              </Text>
              <View style={styles.expressMetaRow}>
                <Text
                  style={[
                    styles.expressFeeTag,
                    isExpress && styles.expressFeeTagActive,
                  ]}
                >
                  +₹150 Priority fee
                </Text>
                <Text
                  style={[
                    styles.expressDot,
                    isExpress && styles.expressSubActive,
                  ]}
                >
                  •
                </Text>
                <Text
                  style={[
                    styles.expressDedicated,
                    isExpress && styles.expressSubActive,
                  ]}
                >
                  Dedicated tooling van
                </Text>
              </View>
            </View>
          </View>

          <Switch
            value={isExpress}
            onValueChange={handleToggleExpress}
            trackColor={{
              false: Colors.surfaceContainerHighest,
              true: Colors.secondaryCobalt,
            }}
            thumbColor={Colors.onPrimary}
          />
        </TouchableOpacity>

        {/* Select Calendar Date Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitleCaps}>SELECT CALENDAR DATE</Text>
            <Text style={styles.monthLabel}>{selectedDateObj.monthYear}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateSelectorRow}
          >
            {dateOptions.map((dateOpt) => {
              const isSelected = dateOpt.id === selectedDateId && !isExpress;

              return (
                <TouchableOpacity
                  key={dateOpt.id}
                  style={[
                    styles.dateChip,
                    isSelected ? styles.dateChipSelected : styles.dateChipUnselected,
                  ]}
                  onPress={() => handleSelectDate(dateOpt.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dateTagText,
                      isSelected && styles.dateTextSelected,
                    ]}
                  >
                    {dateOpt.tag}
                  </Text>
                  <Text
                    style={[
                      styles.dateDayNum,
                      isSelected && styles.dateTextSelected,
                    ]}
                  >
                    {dateOpt.dayNum}
                  </Text>
                  <Text
                    style={[
                      styles.dateDayOfWeek,
                      isSelected && styles.dateTextSelected,
                    ]}
                  >
                    {dateOpt.dayOfWeek}
                  </Text>
                  <View
                    style={[
                      styles.dateIndicatorDot,
                      isSelected && styles.dateIndicatorDotActive,
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Available Time Slots Section */}
        <View style={styles.slotsSection}>
          {/* Morning Group */}
          <View style={styles.periodGroup}>
            <View style={styles.periodHeader}>
              <AppIcon name="Sun" size={18} color="#D97706" />
              <Text style={styles.periodTitle}>Morning</Text>
              <Text style={styles.periodHours}>09:00 - 12:30</Text>
            </View>
            <View style={styles.slotsList}>
              {morningSlots.map((slot) => (
                <SlotButton
                  key={slot.id}
                  slot={slot}
                  isSelected={slot.id === selectedTimeId && !isExpress}
                  onPress={() => handleSelectTime(slot)}
                />
              ))}
            </View>
          </View>

          {/* Afternoon Group */}
          <View style={styles.periodGroup}>
            <View style={styles.periodHeader}>
              <AppIcon name="Sun" size={18} color="#2563EB" />
              <Text style={styles.periodTitle}>Afternoon</Text>
              <Text style={styles.periodHours}>12:30 - 18:30</Text>
            </View>
            <View style={styles.slotsList}>
              {afternoonSlots.map((slot) => (
                <SlotButton
                  key={slot.id}
                  slot={slot}
                  isSelected={slot.id === selectedTimeId && !isExpress}
                  onPress={() => handleSelectTime(slot)}
                />
              ))}
            </View>
          </View>

          {/* Evening Group */}
          <View style={styles.periodGroup}>
            <View style={styles.periodHeader}>
              <AppIcon name="Moon" size={18} color="#4F46E5" />
              <Text style={styles.periodTitle}>Evening</Text>
              <Text style={styles.periodHours}>18:30 - 20:00</Text>
            </View>
            <View style={styles.slotsList}>
              {eveningSlots.map((slot) => (
                <SlotButton
                  key={slot.id}
                  slot={slot}
                  isSelected={slot.id === selectedTimeId && !isExpress}
                  onPress={() => handleSelectTime(slot)}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Guarantees & Protocol Micro-Card */}
        <View style={styles.guaranteeCard}>
          <View style={styles.guaranteeRow}>
            <View style={styles.guaranteeIconBox}>
              <AppIcon name="ShieldCheck" size={18} />
            </View>
            <View style={styles.guaranteeTextGroup}>
              <Text style={styles.guaranteeTitle}>PRECISION PROTOCOL GUARANTEED</Text>
              <Text style={styles.guaranteeSub}>
                Certified BIFMA technician will call 15 minutes before arrival.
              </Text>
            </View>
          </View>

          <View style={styles.guaranteeRow}>
            <View style={styles.guaranteeIconBox}>
              <AppIcon name="RefreshCw" size={18} />
            </View>
            <View style={styles.guaranteeTextGroup}>
              <Text style={styles.guaranteeTitle}>FLEXIBLE RESCHEDULING</Text>
              <Text style={styles.guaranteeSub}>
                Free reschedule up to 1 hour before scheduled appointment.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        style={[
          styles.bottomDrawer,
          { paddingBottom: Math.max(insets.bottom, 14) + 6 },
        ]}
      >
        <View style={styles.slotSummaryRow}>
          <View style={styles.slotSummaryLeft}>
            <Text style={styles.slotSummaryTag}>CONFIRMED BOOKING SLOT</Text>
            <View style={styles.slotValueRow}>
              <View style={styles.slotDot} />
              <Text style={styles.slotTitleText} numberOfLines={1}>
                {isExpress
                  ? 'Today, Express • Under 45 Mins'
                  : `${selectedDateObj.fullDate} • ${selectedTimeObj.timeDisplay.split('–')[0].trim()}`}
              </Text>
            </View>
          </View>

          <View style={styles.etaGroup}>
            <Text style={styles.etaTag}>CALIBRATED ETA</Text>
            <Text style={styles.etaValue}>
              {isExpress ? '~45 min ETA' : 'Standard'}
            </Text>
          </View>
        </View>

        <PrecisionButton
          title="Continue to Review →"
          size="lg"
          variant="primary"
          onPress={handleContinue}
          style={styles.continueBtn}
        />
      </View>
    </ScreenContainer>
  );
};

interface SlotButtonProps {
  slot: TimeSlot;
  isSelected: boolean;
  onPress: () => void;
}

const SlotButton: React.FC<SlotButtonProps> = ({
  slot,
  isSelected,
  onPress,
}) => {
  if (slot.isBooked) {
    return (
      <View style={styles.slotBooked}>
        <View style={styles.slotDetails}>
          <Text style={styles.slotTimeBooked}>{slot.timeDisplay}</Text>
          <Text style={styles.slotSubtextBooked}>{slot.subtext}</Text>
        </View>
        <View style={styles.bookedBadge}>
          <Text style={styles.bookedBadgeText}>Booked</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.slotAvailable,
        isSelected ? styles.slotSelected : styles.slotUnselected,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.slotDetails}>
        <View style={styles.slotTitleRow}>
          <Text
            style={[
              styles.slotTimeAvailable,
              isSelected && styles.slotTimeSelected,
            ]}
          >
            {slot.timeDisplay}
          </Text>
        </View>
        <Text
          style={[
            styles.slotSubtextAvailable,
            isSelected && styles.slotSubtextSelected,
          ]}
        >
          {slot.subtext}
        </Text>
      </View>

      <View style={styles.slotRight}>
        {slot.badge && (
          <View
            style={[
              styles.slotBadge,
              isSelected ? styles.slotBadgeActive : styles.slotBadgeDefault,
            ]}
          >
            <Text
              style={[
                styles.slotBadgeText,
                isSelected && styles.slotBadgeTextActive,
              ]}
            >
              {slot.badge}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.slotCheckCircle,
            isSelected
              ? styles.slotCheckCircleActive
              : styles.slotCheckCircleDefault,
          ]}
        >
          <Text
            style={[
              styles.slotCheckIcon,
              isSelected
                ? styles.slotCheckIconActive
                : styles.slotCheckIconDefault,
            ]}
          >
            <AppIcon name={isSelected ? 'Check' : 'Clock'} size={14} color={isSelected ? '#FFFFFF' : Colors.onSurfaceVariant} />
          </Text>
        </View>
      </View>
    </TouchableOpacity>
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
  flowLabel: {
    ...Typography.labelMono,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  profileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 15,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 130,
    gap: 18,
  },
  progressSection: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepCounterText: {
    ...Typography.labelMono,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  percentText: {
    ...Typography.labelMono,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceContainerHighest,
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
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  subHeading: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  expressCard: {
    borderRadius: BorderRadius.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.level2,
  },
  expressCardActive: {
    backgroundColor: Colors.primary,
  },
  expressCardInactive: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  expressLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  expressIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expressIconBoxActive: {
    backgroundColor: Colors.secondaryCobalt,
  },
  expressIconBoxInactive: {
    backgroundColor: Colors.secondaryFixed,
  },
  expressIcon: {
    fontSize: 20,
  },
  expressInfo: {
    flex: 1,
    gap: 2,
  },
  expressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expressTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  expressTextActive: {
    color: Colors.onPrimary,
  },
  fastestBadge: {
    backgroundColor: Colors.tertiaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  fastestBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.tertiaryContainer,
    letterSpacing: 0.5,
  },
  expressSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  expressSubActive: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  expressMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  expressFeeTag: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  expressFeeTagActive: {
    color: Colors.secondaryFixed,
  },
  expressDot: {
    color: Colors.outline,
    fontSize: 10,
  },
  expressDedicated: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.outline,
  },
  sectionContainer: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleCaps: {
    ...Typography.labelMono,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  monthLabel: {
    ...Typography.labelMono,
    color: Colors.onSurfaceVariant,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  dateChip: {
    minWidth: 72,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    ...Shadows.level1,
  },
  dateChipSelected: {
    backgroundColor: Colors.primary,
  },
  dateChipUnselected: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  dateTagText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  dateDayNum: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
    marginVertical: 1,
  },
  dateDayOfWeek: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  dateTextSelected: {
    color: Colors.onPrimary,
  },
  dateIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'transparent',
    marginTop: 2,
  },
  dateIndicatorDotActive: {
    backgroundColor: Colors.secondaryFixed,
  },
  slotsSection: {
    gap: 16,
  },
  periodGroup: {
    gap: 8,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  periodIcon: {
    fontSize: 14,
  },
  periodTitle: {
    ...Typography.titleLg,
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  periodHours: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginLeft: 'auto',
  },
  slotsList: {
    gap: 8,
  },
  slotAvailable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BorderRadius.lg,
    ...Shadows.level1,
  },
  slotSelected: {
    backgroundColor: Colors.secondaryContainer,
  },
  slotUnselected: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  slotBooked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainer,
    opacity: 0.6,
  },
  slotDetails: {
    flex: 1,
    gap: 2,
  },
  slotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotTimeAvailable: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  slotTimeSelected: {
    color: Colors.onSecondaryContainer,
    fontWeight: '700',
  },
  slotTimeBooked: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  slotSubtextAvailable: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  slotSubtextSelected: {
    color: Colors.secondaryFixedDim,
  },
  slotSubtextBooked: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  bookedBadge: {
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  bookedBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  slotRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  slotBadgeDefault: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  slotBadgeActive: {
    backgroundColor: 'rgba(254, 252, 255, 0.2)',
  },
  slotBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    textTransform: 'uppercase',
  },
  slotBadgeTextActive: {
    color: Colors.onSecondaryContainer,
  },
  slotCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotCheckCircleDefault: {
    backgroundColor: Colors.surfaceContainer,
  },
  slotCheckCircleActive: {
    backgroundColor: Colors.onSecondaryContainer,
  },
  slotCheckIcon: {
    fontSize: 11,
  },
  slotCheckIconDefault: {
    color: Colors.onSurfaceVariant,
  },
  slotCheckIconActive: {
    color: Colors.secondary,
    fontWeight: '800',
  },
  guaranteeCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 12,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  guaranteeIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guaranteeIconText: {
    fontSize: 16,
  },
  guaranteeTextGroup: {
    flex: 1,
    gap: 2,
  },
  guaranteeTitle: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurface,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  guaranteeSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 15,
  },
  bottomDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    gap: 8,
    ...Shadows.level3,
  },
  slotSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  slotSummaryLeft: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  slotSummaryTag: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  slotValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  slotTitleText: {
    ...Typography.titleLg,
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  etaGroup: {
    alignItems: 'flex-end',
    gap: 2,
  },
  etaTag: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  etaValue: {
    ...Typography.bodyMd,
    fontSize: 12,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  continueBtn: {
    marginTop: 2,
  },
});
