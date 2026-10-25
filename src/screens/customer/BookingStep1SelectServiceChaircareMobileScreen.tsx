import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { PrecisionButton } from '../../components/common/PrecisionButton';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { serviceApi, ServiceItem } from '../../services/api/serviceApi';
import { useAdminSync } from '../../services/adminSync';

interface ServiceOption {
  id: string;
  title: string;
  code?: string;
  badge?: string;
  badgeType?: 'primary' | 'neutral';
  description: string;
  priceDisplay: string;
  priceNum: number;
  icon: string;
}

const SERVICE_OPTIONS: ServiceOption[] = [
  {
    id: 'svc-repair',
    title: 'Chair Repair',
    badge: 'Most Common',
    badgeType: 'primary',
    description: 'Fix broken mechanisms, tilt lock, loose frames',
    priceDisplay: 'Starts ₹599',
    priceNum: 599,
    icon: 'Wrench',
  },
  {
    id: 'svc-install',
    title: 'Chair Installation',
    description: 'Professional assembly with zero tilt drift',
    priceDisplay: 'Starts ₹799',
    priceNum: 799,
    icon: 'Settings',
  },
  {
    id: 'svc-maintenance',
    title: 'Chair Maintenance',
    description: 'Complete lubrication, tightening & noise suppression',
    priceDisplay: 'Starts ₹499',
    priceNum: 499,
    icon: 'SlidersHorizontal',
  },
  {
    id: 'svc-wheels',
    title: 'Wheel Replacement',
    description: 'Floor-safe polyurethane rollerblade casters',
    priceDisplay: 'Starts ₹449',
    priceNum: 449,
    icon: 'Disc',
  },
  {
    id: 'svc-hydraulic',
    title: 'Hydraulic Replacement',
    badge: 'Class-4',
    badgeType: 'neutral',
    description: 'Class-4 heavy duty nitrogen cylinder rebuild',
    priceDisplay: 'Starts ₹899',
    priceNum: 899,
    icon: 'ArrowUp',
  },
  {
    id: 'svc-armrest',
    title: 'Armrest Replacement',
    description: '3D/4D multi-directional pads and pivot brackets',
    priceDisplay: 'Starts ₹549',
    priceNum: 549,
    icon: 'MoveHorizontal',
  },
  {
    id: 'svc-cleaning',
    title: 'Cleaning & Steam',
    description: 'High-temperature deep antimicrobial extraction',
    priceDisplay: 'Starts ₹399',
    priceNum: 399,
    icon: 'Sparkles',
  },
  {
    id: 'svc-inspection',
    title: 'Full Inspection',
    description: '12-point health audit & torque check',
    priceDisplay: 'Starts ₹299',
    priceNum: 299,
    icon: 'ClipboardList',
  },
  {
    id: 'svc-custom',
    title: 'Other Custom Service',
    description: 'Custom ergonomic fittings & bespoke consultation',
    priceDisplay: 'Quote after check',
    priceNum: 599,
    icon: 'Ruler',
  },
];

/**
 * Screen ID: C04
 * Title: Booking Step 1: Select Service / Chair & Issue
 * Reference: design-reference/customer/booking_step_1_select_service_chaircare_mobile
 */
export const BookingStep1SelectServiceChaircareMobileScreen: React.FC<{
  navigation: any;
  route?: any;
}> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { draft, updateDraft } = useBooking();

  const [liveServices, setLiveServices] = useState<ServiceItem[]>([]);
  const lastHandledRouteParam = React.useRef<string | null>(null);

  // Find preselected service from route params or draft context
  const getInitialSelectedId = (): string => {
    if (route?.params?.serviceId) return route.params.serviceId;
    if (route?.params?.serviceCode) return route.params.serviceCode;
    if (draft?.serviceId) return draft.serviceId;
    if (draft?.serviceCode) return draft.serviceCode;
    return 'svc-repair';
  };

  const [selectedId, setSelectedId] = useState<string>(getInitialSelectedId);

  const fetchLiveServices = useCallback(async () => {
    try {
      const res = await serviceApi.getAll();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setLiveServices(res.data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchLiveServices();
  }, [fetchLiveServices]);

  // Synchronize live prices and options from admin panel updates
  useAdminSync(navigation, fetchLiveServices);

  // Consume route params ONCE on initial navigation arrival so user clicks are not reset
  useEffect(() => {
    const routeTarget = route?.params?.serviceId || route?.params?.serviceCode;
    if (routeTarget && lastHandledRouteParam.current !== routeTarget) {
      lastHandledRouteParam.current = routeTarget;
      setSelectedId(routeTarget);
      if (route?.params?.serviceTitle) {
        updateDraft({
          serviceId: route?.params?.serviceId || routeTarget,
          serviceCode: route?.params?.serviceCode,
          serviceTitle: route.params.serviceTitle,
          estimatedTotal: route?.params?.estimatedPrice ? Number(route.params.estimatedPrice) : undefined,
        });
      }
    }
  }, [route?.params?.serviceId, route?.params?.serviceCode, route?.params?.serviceTitle, route?.params?.estimatedPrice]);

  const availableOptions: ServiceOption[] = React.useMemo(() => {
    if (liveServices.length > 0) {
      return liveServices.map((svc) => {
        let icon = svc.icon || 'Wrench';
        if (!svc.icon) {
          const t = (svc.title || '').toLowerCase();
          if (t.includes('hydraulic') || t.includes('gas lift')) icon = 'ArrowUp';
          else if (t.includes('wheel') || t.includes('castor')) icon = 'Disc';
          else if (t.includes('tilt') || t.includes('recline')) icon = 'Settings';
          else if (t.includes('armrest')) icon = 'Armchair';
          else if (t.includes('clean') || t.includes('spa')) icon = 'Sparkles';
          else if (t.includes('inspect')) icon = 'Search';
        }

        return {
          id: svc.id,
          title: svc.title,
          code: svc.code,
          badge: svc.badge,
          badgeType: (svc.badge ? 'primary' : undefined) as any,
          description: svc.description,
          priceDisplay: `Starts ₹${svc.estimatedPrice}`,
          priceNum: Number(svc.estimatedPrice),
          icon,
        };
      });
    }
    return SERVICE_OPTIONS;
  }, [liveServices]);

  const selectedOption: ServiceOption = React.useMemo(() => {
    const matchByIdOrCode = availableOptions.find(
      (s) => s.id === selectedId || (s.code && s.code === selectedId)
    );
    if (matchByIdOrCode) return matchByIdOrCode;

    const matchByTitle = availableOptions.find(
      (s) =>
        s.title.toLowerCase() === selectedId.toLowerCase() ||
        (draft?.serviceTitle && s.title.toLowerCase() === draft.serviceTitle.toLowerCase())
    );
    if (matchByTitle) return matchByTitle;

    return availableOptions[0] || SERVICE_OPTIONS[0];
  }, [availableOptions, selectedId, draft?.serviceTitle]);

  const handleSelectService = (option: ServiceOption) => {
    setSelectedId(option.id);
    updateDraft({
      serviceId: option.id,
      serviceCode: option.code,
      serviceTitle: option.title,
      estimatedTotal: option.priceNum,
    });
  };

  const handleContinue = () => {
    // Save selection to context with exact price
    updateDraft({
      serviceId: selectedOption.id,
      serviceCode: selectedOption.code,
      serviceTitle: selectedOption.title,
      estimatedTotal: selectedOption.priceNum,
    });

    // Navigate to Step 2
    navigation.navigate('BookingStep2');
  };

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
            <Text style={styles.headerTitle}>Select Chair & Issue</Text>
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
        {/* Step & Progress Tracker */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.stepCounterText}>STEP 1 OF 5</Text>
            <Text style={styles.percentText}>20% Completed</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '20%' }]} />
          </View>
        </View>

        {/* Screen Heading & Subtext */}
        <View style={styles.headingSection}>
          <Text style={styles.mainHeading}>Book a Service</Text>
          <Text style={styles.subHeading}>
            Choose what your chair needs to restore peak ergonomic alignment.
          </Text>
        </View>

        {/* Diagnostic Guarantee Micro-Banner */}
        <View style={styles.guaranteeBanner}>
          <View style={styles.guaranteeIconBox}>
            <AppIcon name="ShieldCheck" size={18} />
          </View>
          <View style={styles.guaranteeInfo}>
            <Text style={styles.guaranteeTitle}>Certified Techs & Genuine Spares</Text>
            <Text style={styles.guaranteeSub}>
              All repairs backed by a 90-day mechanical warranty
            </Text>
          </View>
        </View>

        {/* Service Selection Cards List */}
        <View style={styles.optionsList}>
          {availableOptions.map((option) => {
            const isSelected = option.id === selectedOption.id;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.serviceCard,
                  isSelected ? styles.serviceCardSelected : styles.serviceCardUnselected,
                ]}
                onPress={() => handleSelectService(option)}
                activeOpacity={0.85}
              >
                {/* Service Icon Tile */}
                <View
                  style={[
                    styles.iconBox,
                    isSelected ? styles.iconBoxSelected : styles.iconBoxUnselected,
                  ]}
                >
                  <AppIcon name={option.icon} size={20} />
                </View>

                {/* Service Details */}
                <View style={styles.serviceContent}>
                  <View style={styles.titleRow}>
                    <Text style={styles.serviceTitleText} numberOfLines={1}>
                      {option.title}
                    </Text>
                    {option.badge && (
                      <View
                        style={
                          option.badgeType === 'primary'
                            ? styles.badgePrimary
                            : styles.badgeNeutral
                        }
                      >
                        <Text
                          style={
                            option.badgeType === 'primary'
                              ? styles.badgePrimaryText
                              : styles.badgeNeutralText
                          }
                        >
                          {option.badge}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.serviceDescText} numberOfLines={2}>
                    {option.description}
                  </Text>

                  <Text
                    style={[
                      styles.servicePriceText,
                      isSelected && styles.servicePriceSelected,
                    ]}
                  >
                    {option.priceDisplay}
                  </Text>
                </View>

                {/* Selection Radio / Check Indicator */}
                <View
                  style={[
                    styles.selectionIndicator,
                    isSelected
                      ? styles.indicatorSelected
                      : styles.indicatorUnselected,
                  ]}
                >
                  {isSelected && <AppIcon name="Check" size={18} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Drawer */}
      <View
        style={[
          styles.bottomDrawer,
          { paddingBottom: Math.max(insets.bottom, 14) + 6 },
        ]}
      >
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>ESTIMATED STARTING COST</Text>
          <View style={styles.summaryValueRow}>
            <Text style={styles.summaryServiceName}>{selectedOption.title}</Text>
            <Text style={styles.summaryDot}>•</Text>
            <Text style={styles.summaryPrice}>{selectedOption.priceDisplay}</Text>
          </View>
        </View>

        <PrecisionButton
          title="Continue to Problem Details →"
          size="lg"
          variant="primary"
          onPress={handleContinue}
          style={styles.continueBtn}
        />
      </View>
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
    paddingBottom: 120,
    gap: 16,
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
  guaranteeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 12,
    gap: 12,
    ...Shadows.level1,
  },
  guaranteeIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guaranteeIcon: {
    fontSize: 16,
  },
  guaranteeInfo: {
    flex: 1,
    gap: 2,
  },
  guaranteeTitle: {
    ...Typography.bodySm,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  guaranteeSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  optionsList: {
    gap: 12,
  },
  serviceCard: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: BorderRadius.xl,
    gap: 12,
  },
  serviceCardSelected: {
    backgroundColor: 'rgba(219, 225, 255, 0.4)',
    borderWidth: 1.5,
    borderColor: Colors.secondaryCobalt,
    ...Shadows.level2,
  },
  serviceCardUnselected: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    backgroundColor: Colors.secondaryCobalt,
  },
  iconBoxUnselected: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  serviceIconText: {
    fontSize: 20,
  },
  serviceContent: {
    flex: 1,
    paddingRight: 24,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceTitleText: {
    ...Typography.titleLg,
    fontSize: 16,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  badgePrimary: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgePrimaryText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  badgeNeutral: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeNeutralText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  serviceDescText: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  servicePriceText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurface,
    fontWeight: '600',
    marginTop: 2,
  },
  servicePriceSelected: {
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorSelected: {
    backgroundColor: Colors.secondaryCobalt,
    ...Shadows.level1,
  },
  indicatorUnselected: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  checkIcon: {
    fontSize: 12,
    color: Colors.onSecondary,
    fontWeight: '800',
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  summaryLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryServiceName: {
    ...Typography.bodySm,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  summaryDot: {
    color: Colors.outline,
  },
  summaryPrice: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  continueBtn: {
    marginTop: 2,
  },
});
