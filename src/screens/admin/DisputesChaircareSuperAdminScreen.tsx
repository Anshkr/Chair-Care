import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { adminApi } from '../../services/api/adminApi';
import { useAdminSync } from '../../services/adminSync';

interface DisputesScreenProps {
  navigation?: any;
}

export type DisputeFilterTab = 'all' | 'open' | 'under_review' | 'escalated' | 'resolved';

export interface DisputeItem {
  id: string;
  code: string;
  priority: 'high' | 'med' | 'low';
  priorityLabel: string;
  status: 'Open' | 'Under Review' | 'Escalated' | 'Resolved';
  customerName: string;
  customerLocation?: string;
  technicianName: string;
  technicianTag?: string;
  serviceTitle: string;
  serviceCode: string;
  amountFormatted?: string;
  escrowStatusText: string;
  isEscrowFrozen?: boolean;
  isGeoMismatch?: boolean;
  quoteSummary: string;
  timestamp: string;
  accentColor: string;
  actionButtonLabel: string;
  actionButtonIcon?: string;
  isFocusCase?: boolean;
  isResolved?: boolean;
  refundSummary?: string;
}

export const DisputesChaircareSuperAdminScreen: React.FC<DisputesScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<DisputeFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pulse animation for operational beacon
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

  const fetchDisputes = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminApi.getDisputes();
      if (res.data && Array.isArray(res.data)) {
        const mapped: DisputeItem[] = res.data.map((item: any, idx: number) => {
          const rawStatus = (item.status || 'open').toLowerCase();
          const mappedStatus: DisputeItem['status'] =
            rawStatus === 'resolved' || rawStatus === 'completed'
              ? 'Resolved'
              : rawStatus === 'escalated' || rawStatus === 'failed'
              ? 'Escalated'
              : rawStatus === 'under review' || rawStatus === 'under_review' || rawStatus === 'processing'
              ? 'Under Review'
              : 'Open';

          const rawPriority = (item.priority || 'med').toLowerCase();
          const mappedPriority: DisputeItem['priority'] =
            rawPriority === 'high' ? 'high' : rawPriority === 'low' ? 'low' : 'med';

          const isResolved = mappedStatus === 'Resolved';
          const numAmount = Number(item.amount || item.amountFormatted?.replace(/[^0-9]/g, '') || 0);

          return {
            id: item.id || `dsp-${idx}`,
            code: item.code || `DSP-${(item.id || '').toString().slice(0, 5).toUpperCase()}`,
            priority: mappedPriority,
            priorityLabel: item.priorityLabel || (mappedPriority === 'high' ? 'High Priority' : mappedPriority === 'low' ? 'Low Priority' : 'Medium Priority'),
            status: mappedStatus,
            customerName: item.customerName || item.customer_name || 'Customer',
            customerLocation: item.customerLocation || 'Gurugram',
            technicianName: item.technicianName || item.technician_name || 'Assigned Specialist',
            serviceTitle: item.serviceTitle || item.service_name || 'Chair Service',
            serviceCode: item.serviceCode || (item.service_request_id ? `#CC-${item.service_request_id.slice(0, 5)}` : '#CC-10482'),
            amountFormatted: item.amountFormatted || `₹${numAmount.toLocaleString('en-IN')}`,
            escrowStatusText: item.escrowStatusText || (isResolved ? 'Refund Processed' : 'Escrow Frozen'),
            isEscrowFrozen: item.isEscrowFrozen !== undefined ? item.isEscrowFrozen : !isResolved,
            quoteSummary: item.quoteSummary || item.reason || 'Customer reported service dispute requiring administrative review.',
            timestamp: item.timestamp || (item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'),
            accentColor: item.accentColor || (isResolved ? '#009668' : mappedPriority === 'high' ? '#ba1a1a' : '#0051d5'),
            actionButtonLabel: item.actionButtonLabel || (isResolved ? 'Inspect Ledger' : 'Investigate Case'),
            actionButtonIcon: item.actionButtonIcon || (isResolved ? 'receipt_long' : 'arrow_forward'),
            isFocusCase: idx === 0 && !isResolved,
            isResolved,
            refundSummary: item.refundSummary || (isResolved ? `Refund of ₹${numAmount} settled` : undefined),
          };
        });
        setDisputes(mapped);
      } else {
        setDisputes([]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to retrieve disputes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  // Real-time synchronization across admin tabs & windows
  useAdminSync(navigation, fetchDisputes);

  // Dynamic KPI counts computed from real dispute data
  const openCount = useMemo(() => disputes.filter((d) => d.status === 'Open').length, [disputes]);
  const underReviewCount = useMemo(() => disputes.filter((d) => d.status === 'Under Review').length, [disputes]);
  const resolvedCount = useMemo(() => disputes.filter((d) => d.status === 'Resolved').length, [disputes]);
  const escalatedCount = useMemo(() => disputes.filter((d) => d.status === 'Escalated').length, [disputes]);

  // Tab definitions with dynamic badge counts
  const tabs = useMemo(() => {
    return [
      { key: 'all' as DisputeFilterTab, label: 'All', count: disputes.length },
      { key: 'open' as DisputeFilterTab, label: 'Open', count: openCount },
      { key: 'under_review' as DisputeFilterTab, label: 'Under Review', count: underReviewCount },
      { key: 'escalated' as DisputeFilterTab, label: 'Escalated', count: escalatedCount },
      { key: 'resolved' as DisputeFilterTab, label: 'Resolved', count: resolvedCount },
    ];
  }, [disputes, openCount, underReviewCount, escalatedCount, resolvedCount]);

  // Filtered dispute list
  const filteredDisputes = useMemo(() => {
    return disputes.filter((item) => {
      // Tab filter
      if (activeTab === 'open' && item.status !== 'Open') return false;
      if (activeTab === 'under_review' && item.status !== 'Under Review') return false;
      if (activeTab === 'escalated' && item.status !== 'Escalated') return false;
      if (activeTab === 'resolved' && item.status !== 'Resolved') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = item.code.toLowerCase().includes(q);
        const matchesCust = item.customerName.toLowerCase().includes(q);
        const matchesTech = item.technicianName.toLowerCase().includes(q);
        const matchesService = item.serviceTitle.toLowerCase().includes(q);
        const matchesQuote = item.quoteSummary.toLowerCase().includes(q);
        return matchesCode || matchesCust || matchesTech || matchesService || matchesQuote;
      }
      return true;
    });
  }, [disputes, activeTab, searchQuery]);

  // Handle dispute selection toward A30 (DisputeDetailsDsp20481)
  const handleSelectDispute = (dispute: DisputeItem) => {
    if (navigation) {
      navigation.navigate('DisputeDetailsDsp20481', {
        disputeId: dispute.id,
        dispute: dispute,
      });
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Bar with Ambient Glass Styling */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={{ padding: 6, marginRight: 8, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => {
              if (navigation?.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation?.navigate('AdminMain');
              }
            }}
            activeOpacity={0.7}
          >
            <AppIcon name="ArrowLeft" size={20} color={Colors.onSurface} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitleText}>Disputes &amp; Claims</Text>
            <Text style={styles.headerSubtitleText}>RESOLUTION CENTER</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => setShowSearchInput(!showSearchInput)}
            accessibilityLabel="Search disputes"
          >
            <AppIcon name="search" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => {
              const keys: DisputeFilterTab[] = [
                'all',
                'open',
                'under_review',
                'escalated',
                'resolved',
              ];
              const nextIndex = (keys.indexOf(activeTab) + 1) % keys.length;
              setActiveTab(keys[nextIndex]);
            }}
            accessibilityLabel="Filter issues"
          >
            <AppIcon name="tune" size={20} />
          </TouchableOpacity>

          <View style={styles.headerAvatarContainer}>
            <AppIcon name="person" size={20} />
          </View>
        </View>
      </View>

      {/* Main Content ScrollView */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Operational Ribbon & Headline */}
        <View style={styles.operationalSection}>
          <View style={styles.arbitrationPill}>
            <Animated.View
              style={[styles.arbitrationPulseDot, { opacity: pulseAnim }]}
            />
            <Text style={styles.arbitrationPillText}>
              ARBITRATION DESK • ESCROW ESCALATIONS
            </Text>
          </View>

          <View style={styles.headingTitleCol}>
            <Text style={styles.mainHeadingTitle}>Disputes</Text>
            <Text style={styles.mainHeadingSubtitle}>
              Resolve customer, technician and payment issues across field
              service dispatches.
            </Text>
          </View>

          {/* Search Bar Input Row */}
          <View style={styles.searchBarRow}>
            <View style={styles.searchInputWrapper}>
              <AppIcon name="search" size={20} />
              <TextInput
                style={styles.searchTextInput}
                placeholder="Search dispute ID, customer, technician, or ticket..."
                placeholderTextColor="#76777d"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearchBtn}
                >
                  <AppIcon name="close" size={20} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.tuneFilterButton}
              onPress={() => {
                setActiveTab((prev) => (prev === 'all' ? 'under_review' : 'all'));
              }}
              activeOpacity={0.7}
              accessibilityLabel="Filter disputes"
            >
              <AppIcon name="tune" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Metric KPI Cards 2x2 Grid */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Open */}
          <TouchableOpacity
            style={[styles.kpiCard, activeTab === 'open' && styles.kpiCardActive]}
            onPress={() => setActiveTab((prev) => (prev === 'open' ? 'all' : 'open'))}
            activeOpacity={0.8}
          >
            <View style={[styles.kpiAccentBar, { backgroundColor: '#ba1a1a' }]} />
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiLabelText}>OPEN</Text>
              <AppIcon name="assignment_late" size={20} color="#ba1a1a" />
            </View>
            <Text style={styles.kpiValueText}>{openCount}</Text>
            <Text style={styles.kpiSubText}>Requires triage</Text>
          </TouchableOpacity>

          {/* Card 2: Under Review */}
          <TouchableOpacity
            style={[styles.kpiCard, activeTab === 'under_review' && styles.kpiCardActive]}
            onPress={() => setActiveTab((prev) => (prev === 'under_review' ? 'all' : 'under_review'))}
            activeOpacity={0.8}
          >
            <View style={[styles.kpiAccentBar, { backgroundColor: '#0051d5' }]} />
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiLabelText}>UNDER REVIEW</Text>
              <AppIcon name="pending_actions" size={20} color="#0051d5" />
            </View>
            <Text style={styles.kpiValueText}>{underReviewCount}</Text>
            <Text style={styles.kpiSubText}>Active arbitration</Text>
          </TouchableOpacity>

          {/* Card 3: Resolved */}
          <TouchableOpacity
            style={[styles.kpiCard, activeTab === 'resolved' && styles.kpiCardActive]}
            onPress={() => setActiveTab((prev) => (prev === 'resolved' ? 'all' : 'resolved'))}
            activeOpacity={0.8}
          >
            <View style={[styles.kpiAccentBar, { backgroundColor: '#4edea3' }]} />
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiLabelText}>RESOLVED</Text>
              <AppIcon name="verified" size={20} color="#009668" />
            </View>
            <Text style={styles.kpiValueText}>{resolvedCount}</Text>
            <Text style={styles.kpiSubText}>SLA target met</Text>
          </TouchableOpacity>

          {/* Card 4: Escalated */}
          <TouchableOpacity
            style={[styles.kpiCard, activeTab === 'escalated' && styles.kpiCardActive]}
            onPress={() => setActiveTab((prev) => (prev === 'escalated' ? 'all' : 'escalated'))}
            activeOpacity={0.8}
          >
            <View style={[styles.kpiAccentBar, { backgroundColor: '#ffdad6' }]} />
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiLabelText}>ESCALATED</Text>
              <AppIcon name="priority_high" size={20} color="#ba1a1a" />
            </View>
            <Text style={styles.kpiValueText}>{escalatedCount}</Text>
            <Text style={styles.kpiSubText}>Admin action req.</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Status Tabs Scrollable Rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScrollView}
          contentContainerStyle={styles.tabsContentContainer}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.statusTabPill, isActive && styles.statusTabPillActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.statusTabLabel,
                    isActive && styles.statusTabLabelActive,
                  ]}
                >
                  {tab.label} ({tab.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 4. Dispute Cards List */}
        <View style={styles.disputeListContainer}>
          {filteredDisputes.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <AppIcon name="gavel" size={20} />
              <Text style={styles.emptyStateTitle}>No disputes found</Text>
              <Text style={styles.emptyStateDesc}>
                No dispute records match the selected status filter or search
                query.
              </Text>
              <TouchableOpacity
                style={styles.emptyResetBtn}
                onPress={() => {
                  setActiveTab('all');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.emptyResetText}>Reset Filter</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredDisputes.map((item) => {
              const isResolved = item.isResolved || item.status === 'Resolved';

              return (
                <View
                  key={item.id}
                  style={[
                    styles.disputeCard,
                    isResolved && styles.disputeCardResolved,
                  ]}
                >
                  {/* Left accent bar */}
                  <View
                    style={[
                      styles.disputeAccentBar,
                      { backgroundColor: item.accentColor },
                    ]}
                  />

                  {/* Card Header: Code & Badges */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.disputeCodeText}>{item.code}</Text>
                    <View style={styles.badgeGroupRow}>
                      {item.priority === 'high' && (
                        <View style={styles.badgeHighPriority}>
                          <Text style={styles.badgeHighPriorityText}>
                            High Priority
                          </Text>
                        </View>
                      )}
                      {item.priority === 'med' && (
                        <View style={styles.badgeMedPriority}>
                          <Text style={styles.badgeMedPriorityText}>
                            Medium Priority
                          </Text>
                        </View>
                      )}
                      {item.priority === 'low' && !isResolved && (
                        <View style={styles.badgeLowPriority}>
                          <Text style={styles.badgeLowPriorityText}>
                            Low Priority
                          </Text>
                        </View>
                      )}

                      <View
                        style={[
                          styles.badgeStatusPill,
                          item.status === 'Under Review' &&
                            styles.badgeStatusUnderReview,
                          item.status === 'Open' && styles.badgeStatusOpen,
                          item.status === 'Escalated' &&
                            styles.badgeStatusEscalated,
                          item.status === 'Resolved' &&
                            styles.badgeStatusResolved,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeStatusText,
                            item.status === 'Under Review' &&
                              styles.badgeTextUnderReview,
                            item.status === 'Open' && styles.badgeTextOpen,
                            item.status === 'Escalated' &&
                              styles.badgeTextEscalated,
                            item.status === 'Resolved' &&
                              styles.badgeTextResolved,
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Parties Involved */}
                  <View style={styles.partiesSection}>
                    <View style={styles.partyRow}>
                      <View style={styles.partyLeft}>
                        <AppIcon name="person" size={20} />
                        <Text style={styles.partyNameBold} numberOfLines={1}>
                          {item.customerName}
                        </Text>
                        {item.customerLocation && (
                          <Text style={styles.partyLocationText}>
                            ({item.customerLocation})
                          </Text>
                        )}
                      </View>
                      <Text style={styles.partyRoleLabel}>Customer</Text>
                    </View>

                    <View style={styles.partyRow}>
                      <View style={styles.partyLeft}>
                        <AppIcon name="engineering" size={20} />
                        <Text style={styles.partyNameMedium} numberOfLines={1}>
                          {item.technicianName}
                        </Text>
                        {item.technicianTag && (
                          <Text style={styles.partyLocationText}>
                            ({item.technicianTag})
                          </Text>
                        )}
                      </View>
                      <Text style={styles.partyRoleLabel}>
                        {item.technicianTag ? 'Master Tech' : 'Technician'}
                      </Text>
                    </View>
                  </View>

                  {/* Meta Bar: Service & Escrow Amount or Refund Summary */}
                  {isResolved && item.refundSummary ? (
                    <View style={styles.resolvedMetaBox}>
                      <Text style={styles.resolvedServiceSub}>
                        {item.serviceTitle} • {item.serviceCode}
                      </Text>
                      <View style={styles.resolvedRefundRow}>
                        <AppIcon name="check_circle" size={20} />
                        <Text style={styles.resolvedRefundText}>
                          {item.refundSummary}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.metaBarBox}>
                      <View style={styles.metaServiceCol}>
                        <Text style={styles.metaServiceCategory}>
                          {item.serviceTitle}
                        </Text>
                        <Text style={styles.metaServiceCode}>
                          {item.serviceCode}
                        </Text>
                      </View>
                      <View style={styles.metaAmountCol}>
                        <Text style={styles.metaAmountText}>
                          {item.amountFormatted}
                        </Text>
                        <View style={styles.escrowStateGroup}>
                          {item.isEscrowFrozen && (
                            <View style={styles.escrowRedDot} />
                          )}
                          <Text
                            style={[
                              styles.escrowStateText,
                              item.isEscrowFrozen && styles.textError,
                              item.isGeoMismatch && styles.textError,
                            ]}
                          >
                            {item.escrowStatusText}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Dispute Summary / Quote */}
                  {item.quoteSummary.length > 0 && (
                    <Text style={styles.quoteSummaryText} numberOfLines={2}>
                      {item.quoteSummary}
                    </Text>
                  )}

                  {/* Card Footer Actions */}
                  <View style={styles.cardFooterRow}>
                    <Text style={styles.timestampText}>{item.timestamp}</Text>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        item.isFocusCase
                          ? styles.actionButtonPrimary
                          : styles.actionButtonSecondary,
                      ]}
                      onPress={() => handleSelectDispute(item)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          item.isFocusCase
                            ? styles.actionButtonTextPrimary
                            : styles.actionButtonTextSecondary,
                        ]}
                      >
                        {item.actionButtonLabel}
                      </Text>
                      <AppIcon name={item.actionButtonIcon || 'arrow_forward'} size={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* 5. Compliance Footer Notice */}
        <View style={styles.complianceFooterCard}>
          <AppIcon name="verified_user" size={20} />
          <Text style={styles.complianceNoticeText}>
            Platform arbitration operates under{' '}
            <Text style={styles.complianceBold}>
              ChairCare Escrow &amp; Dispute Governance Protocol v3.2
            </Text>
            . Customer dispute settlement center.
          </Text>
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

  /* 1. Header Bar */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eceef0',
    zIndex: 10,
  },
  headerLeft: {
    gap: 2,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerShieldIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
  },
  headerTitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.2,
  },
  headerSubtitleText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    lineHeight: 14,
    color: '#45464d',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#45464d',
    includeFontPadding: false,
  },
  headerAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  headerAvatarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },

  /* Scroll container */
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },

  /* Operational Header */
  operationalSection: {
    gap: 8,
  },
  arbitrationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  arbitrationPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0051d5',
  },
  arbitrationPillText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10.5,
    letterSpacing: 0.6,
    color: '#00174b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  headingTitleCol: {
    gap: 2,
  },
  mainHeadingTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.4,
  },
  mainHeadingSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#45464d',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: '#eceef0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchBarLeftIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#45464d',
    marginRight: 8,
    includeFontPadding: false,
  },
  searchTextInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 12.5,
    color: '#191c1e',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#45464d',
    includeFontPadding: false,
  },
  tuneFilterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#eceef0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tuneFilterIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#191c1e',
    includeFontPadding: false,
  },

  /* 2. Metric KPI Cards 2x2 Grid */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  kpiCardActive: {
    borderWidth: 1.5,
    borderColor: Colors.secondaryCobalt,
    backgroundColor: '#f8faff',
  },
  kpiAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 4,
  },
  kpiLabelText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    letterSpacing: 0.4,
    color: '#45464d',
    textTransform: 'uppercase',
  },
  kpiIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    includeFontPadding: false,
  },
  kpiValueText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: '#191c1e',
    paddingLeft: 4,
    marginTop: 6,
  },
  kpiSubText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464d',
    paddingLeft: 4,
    marginTop: 1,
  },

  /* 3. Status Tabs Scrollable Rail */
  tabsScrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  tabsContentContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  statusTabPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#eceef0',
  },
  statusTabPillActive: {
    backgroundColor: '#000000',
    ...Shadows.level1,
  },
  statusTabLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#45464d',
  },
  statusTabLabelActive: {
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    fontWeight: '600',
  },

  /* 4. Dispute Cards List */
  disputeListContainer: {
    gap: 12,
  },
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  emptyStateIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 36,
    color: '#76777d',
    includeFontPadding: false,
  },
  emptyStateTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    color: '#191c1e',
  },
  emptyStateDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyResetBtn: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#eceef0',
  },
  emptyResetText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
    color: '#191c1e',
  },

  disputeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
    gap: 10,
    ...Shadows.level1,
  },
  disputeCardResolved: {
    opacity: 0.95,
  },
  disputeAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 4,
  },
  disputeCodeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#191c1e',
  },
  badgeGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeHighPriority: {
    backgroundColor: '#ffdad6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeHighPriorityText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9.5,
    color: '#93000a',
    textTransform: 'uppercase',
  },
  badgeMedPriority: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeMedPriorityText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9.5,
    color: '#45464d',
    textTransform: 'uppercase',
  },
  badgeLowPriority: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeLowPriorityText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9.5,
    color: '#45464d',
    textTransform: 'uppercase',
  },
  badgeStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeStatusUnderReview: {
    backgroundColor: '#dbe1ff',
  },
  badgeStatusOpen: {
    backgroundColor: '#ffdad6',
  },
  badgeStatusEscalated: {
    backgroundColor: '#ba1a1a',
  },
  badgeStatusResolved: {
    backgroundColor: '#6ffbbe',
  },
  badgeStatusText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9.5,
    textTransform: 'uppercase',
  },
  badgeTextUnderReview: {
    color: '#00174b',
  },
  badgeTextOpen: {
    color: '#93000a',
  },
  badgeTextEscalated: {
    color: '#ffffff',
  },
  badgeTextResolved: {
    color: '#002113',
  },

  /* Parties Section */
  partiesSection: {
    paddingLeft: 4,
    gap: 4,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  partyPersonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#45464d',
    includeFontPadding: false,
  },
  partyTechIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#0051d5',
    includeFontPadding: false,
  },
  partyNameBold: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },
  partyNameMedium: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#191c1e',
  },
  partyLocationText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10.5,
    color: '#45464d',
  },
  partyRoleLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    letterSpacing: 0.4,
    color: '#76777d',
    textTransform: 'uppercase',
  },

  /* Meta Bar */
  metaBarBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 4,
  },
  metaServiceCol: {
    gap: 1,
    flex: 1,
  },
  metaServiceCategory: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
    textTransform: 'uppercase',
  },
  metaServiceCode: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    color: '#0051d5',
  },
  metaAmountCol: {
    alignItems: 'flex-end',
    gap: 1,
  },
  metaAmountText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  escrowStateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  escrowRedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ba1a1a',
  },
  escrowStateText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9.5,
    color: '#45464d',
    textTransform: 'uppercase',
  },
  textError: {
    color: '#ba1a1a',
  },

  /* Resolved Meta Box */
  resolvedMetaBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    marginLeft: 4,
  },
  resolvedServiceSub: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
    textTransform: 'uppercase',
  },
  resolvedRefundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resolvedCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#009668',
    includeFontPadding: false,
  },
  resolvedRefundText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#191c1e',
  },

  /* Quote Summary */
  quoteSummaryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: '#45464d',
    fontStyle: 'italic',
    paddingLeft: 4,
  },

  /* Card Footer Actions */
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 4,
    paddingTop: 2,
  },
  timestampText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10.5,
    color: '#45464d',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionButtonPrimary: {
    backgroundColor: '#000000',
    ...Shadows.level1,
  },
  actionButtonSecondary: {
    backgroundColor: '#eceef0',
  },
  actionButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
    fontWeight: '600',
  },
  actionButtonTextPrimary: {
    color: '#ffffff',
  },
  actionButtonTextSecondary: {
    color: '#191c1e',
  },
  actionButtonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    includeFontPadding: false,
  },

  /* 5. Compliance Footer Notice */
  complianceFooterCard: {
    backgroundColor: '#eceef0',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  complianceShieldIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#45464d',
    marginTop: 1,
    includeFontPadding: false,
  },
  complianceNoticeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    lineHeight: 17,
    color: '#45464d',
    flex: 1,
  },
  complianceBold: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: '#191c1e',
  },

  /* 6. Persistent Bottom Navigation Bar */
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e3e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    zIndex: 20,
  },
  navTab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    height: 48,
  },
  navTabIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#45464d',
    includeFontPadding: false,
  },
  navTabLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#45464d',
    marginTop: 2,
  },
  navTabActive: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    height: 48,
  },
  navTabIconActive: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#0051d5',
    includeFontPadding: false,
  },
  navTabLabelActive: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#0051d5',
    marginTop: 2,
  },
});
