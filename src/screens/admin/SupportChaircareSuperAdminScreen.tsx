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

interface SupportScreenProps {
  navigation?: any;
}

export type SupportCategoryFilter = 'all' | 'customers' | 'technicians' | 'payments' | 'services';

export interface SupportTicketItem {
  id: string;
  code: string;
  isClosed?: boolean;
  priority: 'high' | 'med' | 'low' | 'resolved';
  priorityLabel: string;
  status: 'Open' | 'Waiting' | 'In Progress' | 'Closed';
  userType: 'Customer' | 'Technician';
  userName: string;
  title: string;
  description: string;
  category: 'customers' | 'technicians' | 'payments' | 'services';
  categoryLabel: string;
  timeLabel: string;
  assignedTo?: string;
  isUnassigned?: boolean;
  resolvedBy?: string;
  diagnosticSnippet?: {
    model: string;
    subAssembly: string;
    statusTag: string;
  };
  accentColor: string;
  primaryActionLabel?: string;
  primaryActionIcon?: string;
  isPrimaryCard?: boolean;
}

const DEFAULT_SUPPORT_TICKETS: SupportTicketItem[] = [];

export const SupportChaircareSuperAdminScreen: React.FC<SupportScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  const [activeCategory, setActiveCategory] = useState<SupportCategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pulse animation for live telemetry dot and high-priority badge
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

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminApi.getSupportTickets();
      if (res.data && Array.isArray(res.data)) {
        const mapped: SupportTicketItem[] = res.data.map((item: any, idx: number) => {
          const priority = (item.priority || 'med').toLowerCase();
          const status = (item.status || 'open').toLowerCase();
          const mappedStatus: SupportTicketItem['status'] =
            status === 'resolved' || status === 'closed'
              ? 'Closed'
              : status === 'in_progress'
              ? 'In Progress'
              : status === 'waiting'
              ? 'Waiting'
              : 'Open';

          const mappedPriority: SupportTicketItem['priority'] =
            mappedStatus === 'Closed'
              ? 'resolved'
              : priority === 'urgent' || priority === 'high'
              ? 'high'
              : priority === 'medium' || priority === 'med'
              ? 'med'
              : 'low';

          return {
            id: item.id || `sup-${idx}`,
            code: item.code || `SUP-${(item.id || '').toString().slice(0, 6).toUpperCase()}`,
            isClosed: mappedStatus === 'Closed',
            priority: mappedPriority,
            priorityLabel:
              mappedPriority === 'high'
                ? 'High Priority'
                : mappedPriority === 'med'
                ? 'Med Priority'
                : mappedPriority === 'resolved'
                ? 'Resolved'
                : 'Low Priority',
            status: mappedStatus,
            userType: item.user_role === 'technician' ? 'Technician' : 'Customer',
            userName: item.user_name || item.userName || 'ChairCare User',
            title: item.subject || item.title || 'Support ticket inquiry',
            description: item.description || 'No description provided.',
            category: (item.category as any) || 'services',
            categoryLabel: item.categoryLabel || 'Service Issue',
            timeLabel: item.created_at
              ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Recent',
            assignedTo: item.assignee || undefined,
            isUnassigned: !item.assignee,
            accentColor:
              mappedPriority === 'high'
                ? '#ba1a1a'
                : mappedStatus === 'Closed'
                ? '#009668'
                : '#316bf3',
            primaryActionLabel: 'Investigate Ticket',
            primaryActionIcon: 'arrow_forward',
            isPrimaryCard: idx === 0,
          };
        });
        setTickets(mapped);
      } else {
        setTickets([]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to support telemetry.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Real-time synchronization across admin tabs & windows
  useAdminSync(navigation, fetchTickets);

  // Compute live KPIs
  const openCount = useMemo(() => tickets.filter((t) => t.status === 'Open').length, [tickets]);
  const waitingCount = useMemo(() => tickets.filter((t) => t.status === 'Waiting').length, [tickets]);
  const urgentCount = useMemo(() => tickets.filter((t) => t.priority === 'high' && t.status !== 'Closed').length, [tickets]);
  const resolvedCount = useMemo(() => tickets.filter((t) => t.status === 'Closed').length, [tickets]);

  // Tab count metrics
  const categoryTabs = useMemo(() => {
    return [
      { key: 'all' as SupportCategoryFilter, label: 'All', count: tickets.length },
      { key: 'customers' as SupportCategoryFilter, label: 'Customers', count: tickets.filter((t) => t.userType === 'Customer').length },
      { key: 'technicians' as SupportCategoryFilter, label: 'Technicians', count: tickets.filter((t) => t.userType === 'Technician').length },
      { key: 'payments' as SupportCategoryFilter, label: 'Payments', count: tickets.filter((t) => t.category === 'payments').length },
      { key: 'services' as SupportCategoryFilter, label: 'Services', count: tickets.filter((t) => t.category === 'services').length },
    ];
  }, [tickets]);

  // Filtered support tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((item) => {
      // Category filter
      if (activeCategory === 'customers' && item.userType !== 'Customer') return false;
      if (activeCategory === 'technicians' && item.userType !== 'Technician') return false;
      if (activeCategory !== 'all' && activeCategory !== 'customers' && activeCategory !== 'technicians' && item.category !== activeCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCode = item.code.toLowerCase().includes(query);
        const matchesUser = item.userName.toLowerCase().includes(query);
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesCat = item.categoryLabel.toLowerCase().includes(query);
        return matchesCode || matchesUser || matchesTitle || matchesDesc || matchesCat;
      }
      return true;
    });
  }, [tickets, activeCategory, searchQuery]);

  // Navigate to ticket detail (A25 target is SupportTicketDetailsSup10482)
  const handleSelectTicket = (ticket: SupportTicketItem) => {
    if (navigation) {
      navigation.navigate('SupportTicketDetailsSup10482', {
        ticketId: ticket.id,
        ticket: ticket,
      });
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Fixed Top Header Bar */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
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
            <Text style={styles.headerTitleText}>Customer Support</Text>
            <Text style={styles.headerSubtitleText}>HELP DESK INQUIRIES</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => setShowSearchInput(!showSearchInput)}
            accessibilityLabel="Search tickets"
          >
            <AppIcon name="search" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => {
              // Cycle through categories
              const keys: SupportCategoryFilter[] = [
                'all',
                'customers',
                'technicians',
                'payments',
                'services',
              ];
              const nextIndex = (keys.indexOf(activeCategory) + 1) % keys.length;
              setActiveCategory(keys[nextIndex]);
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

      {/* Main ScrollView Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Live Telemetry Ribbon */}
        <View style={styles.telemetryRibbon}>
          <View style={styles.telemetryLeft}>
            <View style={styles.pingContainer}>
              <Animated.View style={[styles.pingDotOuter, { opacity: pulseAnim }]} />
              <View style={styles.pingDotInner} />
            </View>
            <Text style={styles.telemetryTitleText}>SUPPORT DESK</Text>
            <Text style={styles.telemetryDotDivider}>•</Text>
            <Text style={styles.telemetrySlaText}>SLA 99.4%</Text>
          </View>

          <View style={styles.escalationQueueBadge}>
            <AppIcon name="priority_high" size={20} />
            <Text style={styles.escalationText}>ESCALATION QUEUE</Text>
          </View>
        </View>

        {/* 2. Header & Search Control */}
        <View style={styles.headingSection}>
          <Text style={styles.headingTitle}>Support</Text>
          <Text style={styles.headingSubtitle}>
            Manage customer and ergonomic technician dispatch inquiries
          </Text>

          {/* Search Input Bar */}
          <View style={styles.searchBarRow}>
            <View style={styles.searchInputWrapper}>
              <AppIcon name="search" size={20} />
              <TextInput
                style={styles.searchTextInput}
                placeholder="Search ticket ID, user, or issue..."
                placeholderTextColor="#76777d"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.searchClearBtn}
                >
                  <AppIcon name="close" size={20} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.filterIconButton}
              onPress={() => {
                setActiveCategory((prev) => (prev === 'all' ? 'customers' : 'all'));
              }}
              activeOpacity={0.7}
              accessibilityLabel="Filter parameters"
            >
              <AppIcon name="tune" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. KPI Telemetry Matrix (2x2 Grid) */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Open Queue */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiLeftBar, { backgroundColor: '#ba1a1a' }]} />
            <View style={styles.kpiCardInner}>
              <View style={styles.kpiTopRow}>
                <Text style={styles.kpiLabel}>OPEN QUEUE</Text>
                <View style={[styles.kpiIconCircle, { backgroundColor: 'rgba(255, 218, 214, 0.6)' }]}>
                  <AppIcon name="error_outline" size={20} color="#ba1a1a" />
                </View>
              </View>
              <Text style={styles.kpiValueText}>{isLoading ? '...' : openCount}</Text>
              <Text style={[styles.kpiSubText, { color: '#ba1a1a' }]}>Requires triage</Text>
            </View>
          </View>

          {/* Card 2: Waiting */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiLeftBar, { backgroundColor: '#0051d5' }]} />
            <View style={styles.kpiCardInner}>
              <View style={styles.kpiTopRow}>
                <Text style={styles.kpiLabel}>WAITING</Text>
                <View style={[styles.kpiIconCircle, { backgroundColor: '#dbe1ff' }]}>
                  <AppIcon name="hourglass_top" size={20} color="#003ea8" />
                </View>
              </View>
              <Text style={styles.kpiValueText}>{isLoading ? '...' : waitingCount}</Text>
              <Text style={[styles.kpiSubText, { color: '#0051d5' }]}>Pending response</Text>
            </View>
          </View>

          {/* Card 3: Urgent SLA */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiLeftBar, { backgroundColor: '#93000a' }]} />
            <View style={styles.kpiCardInner}>
              <View style={styles.kpiTopRow}>
                <Text style={styles.kpiLabel}>URGENT SLA</Text>
                <View style={[styles.kpiIconCircle, { backgroundColor: '#ffdad6' }]}>
                  <AppIcon name="local_fire_department" size={20} color="#93000a" />
                </View>
              </View>
              <Text style={styles.kpiValueText}>{isLoading ? '...' : urgentCount}</Text>
              <Text style={[styles.kpiSubText, { color: '#93000a' }]}>SLA risk &lt; 30m</Text>
            </View>
          </View>

          {/* Card 4: Resolved */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiLeftBar, { backgroundColor: '#009668' }]} />
            <View style={styles.kpiCardInner}>
              <View style={styles.kpiTopRow}>
                <Text style={styles.kpiLabel}>RESOLVED</Text>
                <View style={[styles.kpiIconCircle, { backgroundColor: '#6ffbbe' }]}>
                  <AppIcon name="task_alt" size={20} color="#009668" />
                </View>
              </View>
              <Text style={styles.kpiValueText}>{isLoading ? '...' : resolvedCount}</Text>
              <Text style={[styles.kpiSubText, { color: '#009668' }]}>SLA target met</Text>
            </View>
          </View>
        </View>

        {/* 4. Category Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScrollView}
          contentContainerStyle={styles.tabsContentContainer}
        >
          {categoryTabs.map((tab) => {
            const isActive = activeCategory === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setActiveCategory(tab.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive,
                  ]}
                >
                  {tab.label} ({tab.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 5. Support Ticket Dispatch List */}
        <View style={styles.ticketListContainer}>
          {filteredTickets.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <AppIcon name="search_off" size={20} />
              <Text style={styles.emptyStateTitle}>No support tickets found</Text>
              <Text style={styles.emptyStateDesc}>
                No ticket records match the selected category filter or search criteria.
              </Text>
              <TouchableOpacity
                style={styles.emptyResetBtn}
                onPress={() => {
                  setActiveCategory('all');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.emptyResetText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredTickets.map((item) => {
              const isClosed = item.isClosed || item.status === 'Closed';
              const isTech = item.userType === 'Technician';

              return (
                <View
                  key={item.id}
                  style={[styles.ticketCard, isClosed && styles.ticketCardClosed]}
                >
                  {/* Left accent indicator */}
                  <View
                    style={[
                      styles.ticketAccentBar,
                      { backgroundColor: item.accentColor },
                    ]}
                  />

                  {/* Micro Header */}
                  <View style={styles.ticketMicroHeader}>
                    <View style={styles.ticketCodeRow}>
                      <Text
                        style={[
                          styles.ticketCodeText,
                          isClosed && styles.ticketCodeTextClosed,
                        ]}
                      >
                        {item.code}
                      </Text>

                      {/* Priority / Resolved Badge */}
                      {item.priority === 'high' && (
                        <View style={styles.badgeHighPriority}>
                          <Animated.View
                            style={[
                              styles.badgeHighDot,
                              { opacity: pulseAnim },
                            ]}
                          />
                          <Text style={styles.badgeHighText}>High Priority</Text>
                        </View>
                      )}

                      {item.priority === 'med' && (
                        <View style={styles.badgeMedPriority}>
                          <View style={styles.badgeMedDot} />
                          <Text style={styles.badgeMedText}>Med Priority</Text>
                        </View>
                      )}

                      {item.priority === 'low' && (
                        <View style={styles.badgeLowPriority}>
                          <Text style={styles.badgeLowText}>Low Priority</Text>
                        </View>
                      )}

                      {item.priority === 'resolved' && (
                        <View style={styles.badgeResolved}>
                          <AppIcon name="check" size={20} />
                          <Text style={styles.badgeResolvedText}>Resolved</Text>
                        </View>
                      )}
                    </View>

                    {/* Status Pill Badge */}
                    <View
                      style={[
                        styles.statusPill,
                        item.status === 'Open' && styles.statusPillOpen,
                        item.status === 'Waiting' && styles.statusPillWaiting,
                        item.status === 'In Progress' && styles.statusPillProgress,
                        item.status === 'Closed' && styles.statusPillClosed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          item.status === 'Open' && styles.statusTextOpen,
                          item.status === 'Waiting' && styles.statusTextWaiting,
                          item.status === 'In Progress' && styles.statusTextProgress,
                          item.status === 'Closed' && styles.statusTextClosed,
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  {/* User Row with Entity Badge */}
                  <View style={styles.ticketUserRow}>
                    <View
                      style={[
                        styles.userAvatarBox,
                        isTech && styles.userAvatarBoxTech,
                      ]}
                    >
                      <AppIcon name={isTech ? 'build' : 'person'} size={20} />
                    </View>
                    <Text
                      style={[
                        styles.userNameText,
                        isClosed && styles.userNameTextClosed,
                      ]}
                    >
                      {item.userName}
                    </Text>
                    <View
                      style={[
                        styles.entityBadge,
                        isTech && styles.entityBadgeTech,
                      ]}
                    >
                      <Text
                        style={[
                          styles.entityBadgeText,
                          isTech && styles.entityBadgeTextTech,
                        ]}
                      >
                        {item.userType}
                      </Text>
                    </View>
                  </View>

                  {/* Issue Details Title & Description */}
                  <View style={styles.ticketDetailsSection}>
                    <Text
                      style={[
                        styles.ticketTitleText,
                        isClosed && styles.ticketTitleTextClosed,
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.ticketDescText,
                        isClosed && styles.ticketDescTextClosed,
                      ]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  </View>

                  {/* Optional Diagnostic Snippet Box (e.g. Ticket 1) */}
                  {item.diagnosticSnippet && (
                    <View style={styles.diagnosticBox}>
                      <View style={styles.diagnosticLeft}>
                        <AppIcon name="precision_manufacturing" size={20} />
                        <Text style={styles.diagnosticModelText}>
                          {item.diagnosticSnippet.model} •{' '}
                          {item.diagnosticSnippet.subAssembly}
                        </Text>
                      </View>
                      <Text style={styles.diagnosticStatusText}>
                        {item.diagnosticSnippet.statusTag}
                      </Text>
                    </View>
                  )}

                  {/* Footer Meta */}
                  <View style={styles.ticketFooterMetaRow}>
                    {item.resolvedBy ? (
                      <View style={styles.resolvedMetaContainer}>
                        <AppIcon name="verified" size={20} />
                        <Text style={styles.resolvedMetaText}>
                          {item.categoryLabel} • {item.timeLabel} • {item.resolvedBy}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.metaTextGroup}>
                        <Text style={styles.metaMutedText}>
                          {item.categoryLabel}
                        </Text>
                        <Text style={styles.metaMutedDot}>•</Text>
                        <Text style={styles.metaMutedText}>
                          {item.timeLabel}
                        </Text>
                        <Text style={styles.metaMutedDot}>•</Text>
                        {item.isUnassigned ? (
                          <Text style={styles.metaUnassignedText}>Unassigned</Text>
                        ) : (
                          <Text style={styles.metaAssignedText}>
                            {item.assignedTo}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Action Button */}
                  {item.primaryActionLabel && (
                    <View style={styles.actionBtnContainer}>
                      {item.isPrimaryCard ? (
                        <TouchableOpacity
                          style={styles.primaryActionButton}
                          onPress={() => handleSelectTicket(item)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.primaryActionBtnText}>
                            {item.primaryActionLabel}
                          </Text>
                          <AppIcon name={item.primaryActionIcon || 'arrow_forward'} size={20} />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.secondaryActionButton}
                          onPress={() => handleSelectTicket(item)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.secondaryActionBtnText}>
                            {item.primaryActionLabel}
                          </Text>
                          <AppIcon name={item.primaryActionIcon || 'chevron_right'} size={20} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* 6. Governance & Security Footer */}
        <View style={styles.securityFooter}>
          <View style={styles.securityLockRow}>
            <AppIcon name="lock" size={20} />
            <Text style={styles.securityLockTitle}>
              END-TO-END ENCRYPTED OPS
            </Text>
          </View>
          <Text style={styles.securitySubtitle}>
            ChairCare 24/7 Customer Help Desk • Active
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogoContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#000000',
    includeFontPadding: false,
  },
  headerTitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    lineHeight: 22,
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
    color: '#191c1e',
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
    backgroundColor: '#f7f9fb',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },

  /* 1. Live Telemetry Ribbon */
  telemetryRibbon: {
    width: '100%',
    backgroundColor: '#e6e8ea',
    borderRadius: BorderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.level1,
  },
  telemetryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pingContainer: {
    width: 8,
    height: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingDotOuter: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#009668',
  },
  pingDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#009668',
  },
  telemetryTitleText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#191c1e',
    fontWeight: '700',
  },
  telemetryDotDivider: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },
  telemetrySlaText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },
  escalationQueueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    ...Shadows.level1,
  },
  escalationIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 12,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  escalationText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    fontWeight: '600',
    color: '#ba1a1a',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  /* 2. Heading & Search Section */
  headingSection: {
    gap: 6,
  },
  headingTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.4,
  },
  headingSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
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
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    ...Shadows.level1,
  },
  searchBarLeftIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#76777d',
    marginRight: 6,
    includeFontPadding: false,
  },
  searchTextInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#191c1e',
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  searchClearIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#76777d',
    includeFontPadding: false,
  },
  filterIconButton: {
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  filterIconText: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#191c1e',
    includeFontPadding: false,
  },

  /* 3. KPI Telemetry Matrix (2x2 Grid) */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  kpiLeftBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  kpiCardInner: {
    paddingLeft: 4,
    gap: 4,
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#45464d',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  kpiIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconText: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    includeFontPadding: false,
  },
  kpiValueText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: '#191c1e',
    marginTop: 2,
  },
  kpiSubText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },

  /* 4. Category Filter Tabs */
  tabsScrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  tabsContentContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#eceef0',
  },
  categoryPillActive: {
    backgroundColor: '#000000',
    ...Shadows.level1,
  },
  categoryPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  categoryPillTextActive: {
    color: '#ffffff',
  },

  /* 5. Support Ticket Dispatch List */
  ticketListContainer: {
    gap: 12,
  },
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
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
    fontSize: 16,
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
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#eceef0',
  },
  emptyResetText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#191c1e',
  },

  /* Ticket Card */
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
    gap: 8,
    ...Shadows.level1,
  },
  ticketCardClosed: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  ticketAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },

  /* Micro Header */
  ticketMicroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 4,
  },
  ticketCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketCodeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11.5,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: 0.2,
  },
  ticketCodeTextClosed: {
    color: '#45464d',
    textDecorationLine: 'line-through',
  },

  /* Badges */
  badgeHighPriority: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: '#ffdad6',
  },
  badgeHighDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ba1a1a',
  },
  badgeHighText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#93000a',
  },

  badgeMedPriority: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: '#dbe1ff',
  },
  badgeMedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0051d5',
  },
  badgeMedText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#00174b',
  },

  badgeLowPriority: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: '#eceef0',
  },
  badgeLowText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#45464d',
  },

  badgeResolved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: '#6ffbbe',
  },
  badgeResolvedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 12,
    color: '#009668',
    includeFontPadding: false,
  },
  badgeResolvedText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#009668',
  },

  /* Status Pill */
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusPillOpen: {
    backgroundColor: 'rgba(255, 218, 214, 0.4)',
  },
  statusPillWaiting: {
    backgroundColor: 'rgba(180, 197, 255, 0.4)',
  },
  statusPillProgress: {
    backgroundColor: '#dae2fd',
  },
  statusPillClosed: {
    backgroundColor: 'transparent',
  },
  statusPillText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    fontWeight: '500',
  },
  statusTextOpen: {
    color: '#ba1a1a',
  },
  statusTextWaiting: {
    color: '#003ea8',
  },
  statusTextProgress: {
    color: '#131b2e',
  },
  statusTextClosed: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },

  /* User Row */
  ticketUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
  },
  userAvatarBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e6e8ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarBoxTech: {
    backgroundColor: '#002113',
  },
  userAvatarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#191c1e',
    includeFontPadding: false,
  },
  userAvatarIconTech: {
    color: '#6ffbbe',
  },
  userNameText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },
  userNameTextClosed: {
    color: '#191c1e',
  },
  entityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: BorderRadius.full,
    backgroundColor: '#dbe1ff',
  },
  entityBadgeTech: {
    backgroundColor: '#6ffbbe',
  },
  entityBadgeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    fontWeight: '500',
    color: '#003ea8',
  },
  entityBadgeTextTech: {
    color: '#002113',
  },

  /* Ticket Details */
  ticketDetailsSection: {
    paddingLeft: 4,
    gap: 3,
  },
  ticketTitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: '#191c1e',
  },
  ticketTitleTextClosed: {
    color: '#45464d',
  },
  ticketDescText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#45464d',
  },
  ticketDescTextClosed: {
    color: 'rgba(69, 70, 77, 0.8)',
  },

  /* Diagnostic Snippet Box */
  diagnosticBox: {
    marginLeft: 4,
    padding: 8,
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diagnosticLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  diagnosticIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#0051d5',
    includeFontPadding: false,
  },
  diagnosticModelText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#45464d',
    flex: 1,
  },
  diagnosticStatusText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10.5,
    fontWeight: '700',
    color: '#ba1a1a',
  },

  /* Footer Meta */
  ticketFooterMetaRow: {
    paddingLeft: 4,
    paddingTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaTextGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  metaMutedText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#45464d',
  },
  metaMutedDot: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#45464d',
  },
  metaUnassignedText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10.5,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  metaAssignedText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    fontWeight: '600',
    color: '#191c1e',
  },
  resolvedMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#009668',
    includeFontPadding: false,
  },
  resolvedMetaText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#45464d',
  },

  /* Action Buttons */
  actionBtnContainer: {
    paddingLeft: 4,
    paddingTop: 2,
  },
  primaryActionButton: {
    height: 36,
    backgroundColor: '#000000',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    ...Shadows.level1,
  },
  primaryActionBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  primaryActionBtnIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },
  secondaryActionButton: {
    height: 32,
    backgroundColor: '#eceef0',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  secondaryActionBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
    fontWeight: '600',
    color: '#191c1e',
  },
  secondaryActionBtnIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#191c1e',
    includeFontPadding: false,
  },

  /* 6. Governance & Security Footer */
  securityFooter: {
    paddingTop: 8,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 4,
  },
  securityLockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  securityLockIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#45464d',
    includeFontPadding: false,
  },
  securityLockTitle: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    letterSpacing: 0.6,
    color: '#45464d',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  securitySubtitle: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: 'rgba(69, 70, 77, 0.7)',
    textAlign: 'center',
  },

  /* 7. Bottom Navigation Bar */
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
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
