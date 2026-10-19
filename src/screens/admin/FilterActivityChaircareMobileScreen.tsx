import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../components/common/AppIcon';
import { Colors, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface FilterActivityProps {
  navigation?: any;
  route?: {
    params?: {
      currentFilters?: any;
      onApplyFilters?: (filters: any) => void;
    };
  };
}

type DateRangeOption = 'Today' | 'Yesterday' | 'Last 7 Days' | 'Last 30 Days' | 'Custom';
type ActorOption = 'all' | 'superadmin' | 'ops' | 'support' | 'finance' | 'bot';
type ExecutionStatusOption = 'successful' | 'failed' | 'blocked';

interface CategoryItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconColor?: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'operations',
    name: 'Operations',
    description: 'Dispatch, reassignments, scheduling',
    icon: 'local_shipping',
    iconColor: '#0051D5',
  },
  {
    id: 'people',
    name: 'People',
    description: 'Technician onboard, suspension, profiles',
    icon: 'badge',
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Escrow, refunds, payouts, gateway sync',
    icon: 'payments',
  },
  {
    id: 'support',
    name: 'Support',
    description: 'Ticket resolution, critical escalations',
    icon: 'headset_mic',
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Permissions, 2FA, token revocations',
    icon: 'security',
    iconColor: '#BA1A1A',
  },
  {
    id: 'system',
    name: 'System',
    description: 'API telemetry, webhooks, uptime nodes',
    icon: 'dns',
    iconColor: '#0051D5',
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Global tariffs, commission updates',
    icon: 'tune',
  },
];

const ACTION_TYPES = [
  'Created',
  'Updated',
  'Assigned',
  'Suspended',
  'Approved',
  'Refunded',
  'Deleted',
  'Login / Auth',
  'Permission Changed',
];

export const FilterActivityChaircareMobileScreen: React.FC<
  FilterActivityProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // State Management
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeOption>('Today');
  const [selectedActor, setSelectedActor] = useState<ActorOption>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedActionTypes, setSelectedActionTypes] = useState<string[]>([
    'Suspended',
    'Refunded',
  ]);
  const [selectedStatuses, setSelectedStatuses] = useState<ExecutionStatusOption[]>([]);

  // Toast State
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

  // Toggle category
  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle action type
  const toggleActionType = (type: string) => {
    setSelectedActionTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  // Toggle status
  const toggleStatus = (status: ExecutionStatusOption) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status]
    );
  };

  // Clear / Reset to Defaults
  const handleResetToDefaults = () => {
    setSelectedDateRange('Today');
    setSelectedActor('all');
    setSelectedCategories([]);
    setSelectedActionTypes([]);
    setSelectedStatuses([]);
    displayToast('Default filter configuration restored');
  };

  // Active filters count
  const activeFiltersSummary = useMemo(() => {
    const activeList: string[] = [];
    if (selectedDateRange !== 'Today') activeList.push('Date');
    if (selectedActor !== 'all') activeList.push('Actor');
    if (selectedCategories.length > 0) activeList.push('Category');
    if (selectedActionTypes.length > 0) activeList.push('Action');
    if (selectedStatuses.length > 0) activeList.push('Status');

    if (activeList.length === 0) {
      return '3 filters active: Date, Actor, Action';
    }
    return `${activeList.length} filter${activeList.length > 1 ? 's' : ''} active: ${activeList.join(', ')}`;
  }, [
    selectedDateRange,
    selectedActor,
    selectedCategories,
    selectedActionTypes,
    selectedStatuses,
  ]);

  // Estimated result count based on active selections
  const estimatedResultsCount = useMemo(() => {
    let count = 248;
    if (selectedDateRange === 'Yesterday') count = 192;
    if (selectedDateRange === 'Last 7 Days') count = 890;
    if (selectedDateRange === 'Last 30 Days') count = 2430;
    if (selectedCategories.length > 0) count = Math.max(34, count - selectedCategories.length * 28);
    if (selectedActionTypes.length > 0) count = Math.max(18, count - (9 - selectedActionTypes.length) * 15);
    if (selectedStatuses.length > 0) count = Math.max(12, Math.round(count * 0.6));
    return count;
  }, [selectedDateRange, selectedCategories, selectedActionTypes, selectedStatuses]);

  // Apply filters
  const handleApplyFilters = () => {
    const filtersPayload = {
      dateRange: selectedDateRange,
      actor: selectedActor,
      categories: selectedCategories,
      actionTypes: selectedActionTypes,
      statuses: selectedStatuses,
    };

    if (route?.params?.onApplyFilters) {
      route.params.onApplyFilters(filtersPayload);
    }

    displayToast(`Applied filters (${estimatedResultsCount} records found)`);

    setTimeout(() => {
      if (navigation?.canGoBack()) {
        navigation.goBack();
      }
    }, 400);
  };

  const handleShare = () => {
    displayToast('Filter query copied as reproducible telemetry link');
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
            Activity Filters
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            onPress={handleShare}
            accessibilityLabel="Share filters"
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
          { paddingBottom: Math.max(insets.bottom, 20) + 130 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Interactive Filter Summary Pill Bar */}
        <View style={styles.summaryPillBar}>
          <View style={styles.summaryPillLeft}>
            <View style={styles.pulseDot} />
            <Text style={styles.summaryPillText} numberOfLines={1}>
              {activeFiltersSummary}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleResetToDefaults}
            activeOpacity={0.7}
            style={styles.clearAllBtn}
          >
            <Text style={styles.clearAllBtnText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 1: Date Range */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTitleGroup}>
              <AppIcon name="calendar_today" size={20} />
              <Text style={styles.cardTitle}>Date Range</Text>
            </View>
            <View style={styles.telemetryBadge}>
              <Text style={styles.telemetryBadgeText}>IST Telemetry</Text>
            </View>
          </View>

          {/* Segmented Radio Pills */}
          <View style={styles.pillsWrap}>
            {(['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Custom'] as DateRangeOption[]).map(
              (option) => {
                const isActive = selectedDateRange === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterPill,
                      isActive && styles.filterPillActive,
                    ]}
                    onPress={() => setSelectedDateRange(option)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        isActive && styles.filterPillTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                    {option === 'Custom' && (
                      <AppIcon name="tune" size={20} />
                    )}
                  </TouchableOpacity>
                );
              }
            )}
          </View>

          {/* Active Range Scope Metric Box */}
          <View style={styles.scopeMetricBox}>
            <AppIcon name="schedule" size={20} />
            <View style={styles.scopeTextCol}>
              <Text style={styles.scopePrimaryText} numberOfLines={1}>
                {selectedDateRange === 'Today' && '05 Oct 2026 (00:00 - 23:59 IST)'}
                {selectedDateRange === 'Yesterday' && '04 Oct 2026 (00:00 - 23:59 IST)'}
                {selectedDateRange === 'Last 7 Days' && '28 Sep 2026 - 05 Oct 2026 (IST)'}
                {selectedDateRange === 'Last 30 Days' && '05 Sep 2026 - 05 Oct 2026 (IST)'}
                {selectedDateRange === 'Custom' && 'Custom Date Interval (Locked)'}
              </Text>
              <Text style={styles.scopeSubtitleText}>
                Real-time sync lock: UTC+05:30
              </Text>
            </View>
            <AppIcon name="lock_clock" size={20} />
          </View>
        </View>

        {/* SECTION 2: Actor / Administrator */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTitleGroup}>
              <AppIcon name="engineering" size={20} />
              <Text style={styles.cardTitle}>Actor / Administrator</Text>
            </View>
            <Text style={styles.cardHeaderMetaText}>Auth Level 3</Text>
          </View>

          {/* Admin Chips Pool */}
          <View style={styles.adminChipsWrap}>
            {/* All Admins */}
            <TouchableOpacity
              style={[
                styles.adminChip,
                selectedActor === 'all' && styles.adminChipActive,
              ]}
              onPress={() => setSelectedActor('all')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.adminChipIconCircle,
                  selectedActor === 'all' && styles.adminChipIconCircleActive,
                ]}
              >
                <AppIcon name="group" size={20} />
              </View>
              <Text
                style={[
                  styles.adminChipText,
                  selectedActor === 'all' && styles.adminChipTextActive,
                ]}
              >
                All Admins
              </Text>
            </TouchableOpacity>

            {/* Super Admin */}
            <TouchableOpacity
              style={[
                styles.adminChip,
                selectedActor === 'superadmin' && styles.adminChipActive,
              ]}
              onPress={() => setSelectedActor('superadmin')}
              activeOpacity={0.7}
            >
              <View style={styles.adminAvatarSmall}>
                <Image
                  source={{
                    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAw_ffgt3JcfL4I1pCbjlEHxSs-UTrS3wfi4ehxzKM43pMDXVeuY1GYvA4cQsF1NoFcVSCgp7bXzW0-s2ti7nKKPm6-HCktVl-L4aW-hNomp0mOTSJN4OaTb5bWyOnJQzN7BJZH58xDY0zVFLD00nyB0cNfKRz7lUGHlR5_gzac0WIavNXyGI1JM-Fh9sCCEFaJCdGx8ZQHgw6eD0FelWuV7kXxfguG8bHR7zyfJwsnYVAJ8tb9kHM',
                  }}
                  style={styles.avatarImg}
                />
              </View>
              <View style={styles.adminChipTextCol}>
                <Text
                  style={[
                    styles.adminChipText,
                    selectedActor === 'superadmin' && styles.adminChipTextActive,
                  ]}
                >
                  Super Admin
                </Text>
                <Text style={styles.adminChipCodeText}>#SA-01</Text>
              </View>
            </TouchableOpacity>

            {/* Operations Admin */}
            <TouchableOpacity
              style={[
                styles.adminChip,
                selectedActor === 'ops' && styles.adminChipActive,
              ]}
              onPress={() => setSelectedActor('ops')}
              activeOpacity={0.7}
            >
              <View style={styles.adminAvatarSmall}>
                <Image
                  source={{
                    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeRE8kVJvVXEuxYqrx02gpBg8lSVC5zgSI8tuv8iaUbydTQjMIF8G7NdCzOIDA6n8trCjhwgbLp13TB4GZv0X8HuLPgH9t5QecPVMJ2LsQnI9k5tjtdR6QJYd7M1xvJ8gbJRnutB2IX3zopPzDMid3LgdhuZHeexk474oX2_ppY5n8tVFPhN0mLioCIDMFmx2mp1Yf3-00kdO6y3ECbKhyRzzehdV0ntA2F6NLvw5ZK_GerbpicLc',
                  }}
                  style={styles.avatarImg}
                />
              </View>
              <Text
                style={[
                  styles.adminChipText,
                  selectedActor === 'ops' && styles.adminChipTextActive,
                ]}
              >
                Operations Admin
              </Text>
            </TouchableOpacity>

            {/* Support Admin */}
            <TouchableOpacity
              style={[
                styles.adminChip,
                selectedActor === 'support' && styles.adminChipActive,
              ]}
              onPress={() => setSelectedActor('support')}
              activeOpacity={0.7}
            >
              <View style={styles.adminAvatarSmall}>
                <Image
                  source={{
                    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqLLuKOj-iXPE077CQ7d057OFKzyilEUMVIvfnyOhucPC-vUy6Bl8KXfrxa2fqlRcT1r2ctxO9RLsZy2ByMGymCMkvKAmGyO6l6KCdsfCc-eGpGKV5YSBgkCF8wArbrCwIoH1c5fbWzPSkdSCd7ydPAsT9y8p6e5po5qwt3Q5Ra__WROROo6xkUUzC8yVxPyIpy00KN6dpYmiHZE-uc2L27lALycqazyALZWsJqXLt0OZtBzLvScY',
                  }}
                  style={styles.avatarImg}
                />
              </View>
              <Text
                style={[
                  styles.adminChipText,
                  selectedActor === 'support' && styles.adminChipTextActive,
                ]}
              >
                Support Admin
              </Text>
            </TouchableOpacity>

            {/* Finance Admin */}
            <TouchableOpacity
              style={[
                styles.adminChip,
                selectedActor === 'finance' && styles.adminChipActive,
              ]}
              onPress={() => setSelectedActor('finance')}
              activeOpacity={0.7}
            >
              <View style={styles.adminChipIconCircleMuted}>
                <AppIcon name="account_balance" size={20} />
              </View>
              <Text
                style={[
                  styles.adminChipText,
                  selectedActor === 'finance' && styles.adminChipTextActive,
                ]}
              >
                Finance Admin
              </Text>
            </TouchableOpacity>

            {/* System Bot */}
            <TouchableOpacity
              style={[
                styles.adminChip,
                selectedActor === 'bot' && styles.adminChipActive,
              ]}
              onPress={() => setSelectedActor('bot')}
              activeOpacity={0.7}
            >
              <View style={styles.adminChipIconCircleMuted}>
                <AppIcon name="smart_toy" size={20} />
              </View>
              <Text
                style={[
                  styles.adminChipText,
                  selectedActor === 'bot' && styles.adminChipTextActive,
                ]}
              >
                System Automated Bot
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 3: Activity Category */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTitleGroup}>
              <AppIcon name="category" size={20} />
              <Text style={styles.cardTitle}>Activity Category</Text>
            </View>
            <Text style={styles.cardHeaderMetaText}>7 Modules</Text>
          </View>

          {/* Category Cards Bento Stack */}
          <View style={styles.categoriesStack}>
            {CATEGORIES.map((cat) => {
              const isChecked = selectedCategories.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    isChecked && styles.categoryCardChecked,
                  ]}
                  onPress={() => toggleCategory(cat.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryCardLeft}>
                    <View style={styles.categoryIconBox}>
                      <AppIcon
                        name={cat.icon}
                        size={20}
                        color={cat.iconColor || '#191C1E'}
                        strokeWidth={1.8}
                      />
                    </View>

                    <View style={styles.categoryInfoCol}>
                      <Text style={styles.categoryNameText} numberOfLines={1}>
                        {cat.name}
                      </Text>
                      <Text style={styles.categoryDescText} numberOfLines={1}>
                        {cat.description}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.categoryCheckbox,
                      isChecked && styles.categoryCheckboxChecked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryCheckmark,
                        isChecked && styles.categoryCheckmarkVisible,
                      ]}
                    >
                      check
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 4: Action Type */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTitleGroup}>
              <AppIcon name="bolt" size={20} />
              <Text style={styles.cardTitle}>Action Type</Text>
            </View>
            <Text style={styles.cardHeaderMetaText}>
              {selectedActionTypes.length} Active
            </Text>
          </View>

          {/* Multi-select Action Chip Pool */}
          <View style={styles.actionChipsWrap}>
            {ACTION_TYPES.map((type) => {
              const isSelected = selectedActionTypes.includes(type);
              const isSuspended = type === 'Suspended';
              const isRefunded = type === 'Refunded';

              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.actionChip,
                    isSelected && styles.actionChipSelected,
                    isSelected && isSuspended && styles.actionChipSuspended,
                    isSelected && isRefunded && styles.actionChipRefunded,
                  ]}
                  onPress={() => toggleActionType(type)}
                  activeOpacity={0.7}
                >
                  {isSelected && isSuspended && (
                    <AppIcon name="close" size={20} />
                  )}
                  {isSelected && !isSuspended && (
                    <AppIcon name="check" size={20} />
                  )}
                  <Text
                    style={[
                      styles.actionChipText,
                      isSelected && styles.actionChipTextSelected,
                      isSelected && isSuspended && styles.actionChipTextSuspended,
                      isSelected && isRefunded && styles.actionChipTextRefunded,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 5: Execution Status */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTitleGroup}>
              <AppIcon name="verified_user" size={20} />
              <Text style={styles.cardTitle}>Execution Status</Text>
            </View>
            <Text style={styles.cardHeaderMetaText}>Diagnostics</Text>
          </View>

          {/* 3 Status Cards Grid */}
          <View style={styles.statusCardsGrid}>
            {/* Successful */}
            <TouchableOpacity
              style={[
                styles.statusCard,
                selectedStatuses.includes('successful') && styles.statusCardSelected,
              ]}
              onPress={() => toggleStatus('successful')}
              activeOpacity={0.7}
            >
              <View style={[styles.statusIndicatorDot, { backgroundColor: '#6FFBBE' }]} />
              <Text style={styles.statusCardTitle}>Successful</Text>
              <Text style={styles.statusCardHttp}>HTTP 200</Text>
            </TouchableOpacity>

            {/* Failed */}
            <TouchableOpacity
              style={[
                styles.statusCard,
                selectedStatuses.includes('failed') && styles.statusCardSelected,
              ]}
              onPress={() => toggleStatus('failed')}
              activeOpacity={0.7}
            >
              <View style={[styles.statusIndicatorDot, { backgroundColor: '#BA1A1A' }]} />
              <Text style={styles.statusCardTitle}>Failed</Text>
              <Text style={styles.statusCardHttp}>HTTP 5xx</Text>
            </TouchableOpacity>

            {/* Blocked */}
            <TouchableOpacity
              style={[
                styles.statusCard,
                selectedStatuses.includes('blocked') && styles.statusCardSelected,
              ]}
              onPress={() => toggleStatus('blocked')}
              activeOpacity={0.7}
            >
              <View style={[styles.statusIndicatorDot, { backgroundColor: '#316BF3' }]} />
              <Text style={styles.statusCardTitle}>Blocked</Text>
              <Text style={styles.statusCardHttp}>HTTP 403</Text>
            </TouchableOpacity>
          </View>
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

      {/* Sticky Bottom Floating Action Bar */}
      <View
        style={[
          styles.bottomActionBar,
          { paddingBottom: Math.max(insets.bottom, 10) + 8 },
        ]}
      >
        <TouchableOpacity
          style={styles.primaryApplyButton}
          onPress={handleApplyFilters}
          activeOpacity={0.88}
        >
          <Text style={styles.applyScopeLabel}>Verified Scope</Text>
          <Text style={styles.applyButtonTitle}>
            Apply Filters ({estimatedResultsCount} Results)
          </Text>
          <AppIcon name="arrow_forward" size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetDefaultsLink}
          onPress={handleResetToDefaults}
          activeOpacity={0.7}
        >
          <AppIcon name="restart_alt" size={20} />
          <Text style={styles.resetLinkText}>Reset to Default View</Text>
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
    paddingTop: 12,
    gap: 14,
  },
  scrollContentDesktop: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },

  // Summary Pill Bar
  summaryPillBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E6E8EA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    ...Shadows.level1,
  },
  summaryPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#316BF3',
  },
  summaryPillText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#191C1E',
    flex: 1,
  },
  clearAllBtn: {
    paddingLeft: 8,
  },
  clearAllBtnText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    color: '#0051D5',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
  cardHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconSecondary: {
    fontFamily: 'Material Icons',
    fontSize: 18,
    color: '#0051D5',
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 16,
    color: '#191C1E',
    letterSpacing: -0.2,
  },
  telemetryBadge: {
    backgroundColor: '#DAE2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  telemetryBadgeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#0051D5',
  },
  cardHeaderMetaText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#45464D',
  },

  // Date Pills
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ECEEF0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterPillActive: {
    backgroundColor: '#131B2E',
    ...Shadows.level1,
  },
  filterPillText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#45464D',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  customPillIcon: {
    fontFamily: 'Material Icons',
    fontSize: 14,
    color: '#45464D',
  },
  customPillIconActive: {
    color: '#FFFFFF',
  },

  // Scope Metric Box
  scopeMetricBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 12,
  },
  scopeScheduleIcon: {
    fontFamily: 'Material Icons',
    fontSize: 18,
    color: '#45464D',
  },
  scopeTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  scopePrimaryText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 12,
    color: '#191C1E',
  },
  scopeSubtitleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464D',
  },
  scopeLockIcon: {
    fontFamily: 'Material Icons',
    fontSize: 16,
    color: '#009668',
  },

  // Admin Chips
  adminChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  adminChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ECEEF0',
  },
  adminChipActive: {
    backgroundColor: '#131B2E',
    ...Shadows.level1,
  },
  adminChipIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#316BF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminChipIconCircleActive: {
    backgroundColor: '#0051D5',
  },
  adminChipGroupIcon: {
    fontFamily: 'Material Icons',
    fontSize: 12,
    color: '#FFFFFF',
  },
  adminChipGroupIconActive: {
    color: '#FFFFFF',
  },
  adminAvatarSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E0E3E5',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  adminChipTextCol: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  adminChipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#191C1E',
  },
  adminChipTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  adminChipCodeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9,
    color: '#BEC6E0',
  },
  adminChipIconCircleMuted: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E0E3E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminIconMuted: {
    fontFamily: 'Material Icons',
    fontSize: 13,
    color: '#45464D',
  },
  adminIconBot: {
    fontFamily: 'Material Icons',
    fontSize: 13,
    color: '#0051D5',
  },

  // Category Bento Stack
  categoriesStack: {
    gap: 8,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryCardChecked: {
    backgroundColor: '#DAE2FD',
    borderColor: '#BEC6E0',
    ...Shadows.level1,
  },
  categoryCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  categoryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E6E8EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontFamily: 'Material Icons',
    fontSize: 20,
  },
  categoryInfoCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  categoryNameText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#191C1E',
  },
  categoryDescText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    color: '#45464D',
  },
  categoryCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#E0E3E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCheckboxChecked: {
    backgroundColor: '#0F172A',
  },
  categoryCheckmark: {
    fontFamily: 'Material Icons',
    fontSize: 15,
    color: 'transparent',
  },
  categoryCheckmarkVisible: {
    color: '#FFFFFF',
  },

  // Action Chips Wrap
  actionChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ECEEF0',
  },
  actionChipSelected: {
    backgroundColor: '#131B2E',
    ...Shadows.level1,
  },
  actionChipSuspended: {
    backgroundColor: '#FFDAD6',
  },
  actionChipRefunded: {
    backgroundColor: '#316BF3',
  },
  actionChipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#191C1E',
  },
  actionChipTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  actionChipTextSuspended: {
    color: '#93000A',
    fontFamily: 'Inter-SemiBold',
  },
  actionChipTextRefunded: {
    color: '#FEFCFF',
    fontFamily: 'Inter-SemiBold',
  },
  actionSuspendedIcon: {
    fontFamily: 'Material Icons',
    fontSize: 14,
    color: '#93000A',
  },
  actionCheckIcon: {
    fontFamily: 'Material Icons',
    fontSize: 14,
    color: '#FFFFFF',
  },

  // Execution Status Cards
  statusCardsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#ECEEF0',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  statusCardSelected: {
    borderColor: '#0051D5',
    backgroundColor: '#FFFFFF',
    ...Shadows.level1,
  },
  statusIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 2,
  },
  statusCardTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#191C1E',
  },
  statusCardHttp: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
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
  primaryApplyButton: {
    backgroundColor: '#131B2E',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    ...Shadows.level1,
  },
  applyScopeLabel: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10.5,
    color: '#7C839B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  applyButtonTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  applyArrowIcon: {
    fontFamily: 'Material Icons',
    fontSize: 18,
    color: '#FFFFFF',
  },
  resetDefaultsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  resetIcon: {
    fontFamily: 'Material Icons',
    fontSize: 16,
    color: '#45464D',
  },
  resetLinkText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#45464D',
  },
});
