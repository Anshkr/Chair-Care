import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface AssignSupportTicketScreenProps {
  navigation?: any;
  route?: {
    params?: {
      ticketId?: string;
      ticket?: any;
    };
  };
}

export type AdminFilterChip =
  | 'all'
  | 'available'
  | 'support'
  | 'operations'
  | 'finance'
  | 'super_admin';

export interface AdminStaffMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: 'support' | 'operations' | 'finance' | 'super_admin';
  status: 'available' | 'busy';
  openTickets: number;
  sla: string;
  specialization: string;
  location?: string;
  isRecommended?: boolean;
}

const ADMIN_STAFF_DATA: AdminStaffMember[] = [
  {
    id: 'admin-ps',
    name: 'Priya Sharma',
    initials: 'PS',
    role: 'Support Admin',
    department: 'support',
    status: 'available',
    openTickets: 8,
    sla: 'SLA 99.2%',
    specialization: 'Customer Care, Escalated Disputes, Service Rectification',
    location: 'Gurugram Operations Hub',
    isRecommended: true,
  },
  {
    id: 'admin-av',
    name: 'Aman Verma',
    initials: 'AV',
    role: 'Operations Admin',
    department: 'operations',
    status: 'available',
    openTickets: 5,
    sla: 'SLA 98.4%',
    specialization: 'Technician Dispatch, Hardware Replacement, Fleet Coordination',
    location: 'Delhi Central Desk',
  },
  {
    id: 'admin-ng',
    name: 'Neha Gupta',
    initials: 'NG',
    role: 'Finance Admin',
    department: 'finance',
    status: 'busy',
    openTickets: 11,
    sla: 'SLA 97.8%',
    specialization: 'Escrow Reversals, UPI Gateway Inquiries, Refunds',
    location: 'BLR Finance Desk',
  },
  {
    id: 'admin-rk',
    name: 'Rohit Kumar',
    initials: 'RK',
    role: 'Support Admin',
    department: 'support',
    status: 'available',
    openTickets: 6,
    sla: 'SLA 99.0%',
    specialization: 'Customer Satisfaction, Warranty Claims',
  },
];

export const AssignSupportTicketSup10482ChaircareMobileScreen: React.FC<
  AssignSupportTicketScreenProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const passedTicket = route?.params?.ticket;

  // Selected ticket context with graceful fallback
  const ticketData = {
    id: passedTicket?.id || 'sup-10482',
    code: passedTicket?.code || 'SUP-10482',
    priority: passedTicket?.priority || 'high',
    priorityLabel: passedTicket?.priorityLabel || 'High Priority',
    title: passedTicket?.title || passedTicket?.subject || 'Technician did not complete service',
    customerName: passedTicket?.userName || passedTicket?.customerName || 'Rahul Mehta',
    category: 'Service Issue / Mechanical',
    linkedOrder: '#CR-10482 (Office Chair Repair)',
    currentState: 'Unassigned • Escalated to Super Admin',
  };

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<AdminFilterChip>('available');
  const [selectedAdminId, setSelectedAdminId] = useState<string>('admin-ps');
  const [handoverNote, setHandoverNote] = useState(
    'Priority case: Customer requested morning reschedule (10 AM - 12 PM). Re-dispatch Tier-1 tech with Class-4 cylinder extractor.'
  );
  const [isPriorityNotification, setIsPriorityNotification] = useState(true);

  // Filter chips configuration
  const filterChips: { key: AdminFilterChip; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: 8 },
    { key: 'available', label: 'Available', count: 5 },
    { key: 'support', label: 'Support', count: 3 },
    { key: 'operations', label: 'Operations', count: 2 },
    { key: 'finance', label: 'Finance', count: 2 },
    { key: 'super_admin', label: 'Super Admin', count: 1 },
  ];

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return ADMIN_STAFF_DATA.filter((admin) => {
      // Filter chip
      if (selectedFilter === 'available' && admin.status !== 'available') {
        return false;
      }
      if (
        selectedFilter !== 'all' &&
        selectedFilter !== 'available' &&
        admin.department !== selectedFilter
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = admin.name.toLowerCase().includes(q);
        const matchesRole = admin.role.toLowerCase().includes(q);
        const matchesSpec = admin.specialization.toLowerCase().includes(q);
        return matchesName || matchesRole || matchesSpec;
      }
      return true;
    });
  }, [selectedFilter, searchQuery]);

  // Currently selected admin
  const selectedAdmin = ADMIN_STAFF_DATA.find((a) => a.id === selectedAdminId) || ADMIN_STAFF_DATA[0];

  const handleAssignTicket = () => {
    if (navigation) {
      navigation.navigate('SupportConversation', {
        ticketId: ticketData.id,
        ticket: {
          ...ticketData,
          assignedTo: selectedAdmin.name,
          handoverNote,
          priorityNotification: isPriorityNotification,
        },
      });
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Bar */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation?.canGoBack()) {
                navigation.goBack();
              } else {
                navigation?.navigate('Support');
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Assign Support Ticket
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            accessibilityLabel="More ticket actions"
          >
            <AppIcon name="more_vert" size={20} />
          </TouchableOpacity>
          <View style={styles.headerAvatarContainer}>
            <AppIcon name="person" size={20} />
          </View>
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Target Ticket Summary Card */}
        <View style={styles.targetTicketCard}>
          <View style={styles.errorAccentBar} />

          <View style={styles.targetTopRow}>
            <Text style={styles.targetLabelText}>TARGET TICKET</Text>
            <View style={styles.targetBadgePill}>
              <View style={styles.redDot} />
              <Text style={styles.targetBadgeText}>
                {ticketData.code} • {ticketData.priorityLabel}
              </Text>
            </View>
          </View>

          <Text style={styles.targetTitleText}>{ticketData.title}</Text>

          <View style={styles.targetDetailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Customer</Text>
              <Text style={styles.detailValueBold}>
                {ticketData.customerName}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValueMedium}>
                {ticketData.category}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Linked Order</Text>
              <Text style={styles.detailValueBlue}>
                {ticketData.linkedOrder}
              </Text>
            </View>

            <View style={[styles.detailRow, { paddingTop: 2 }]}>
              <Text style={styles.detailLabel}>Current State</Text>
              <View style={styles.stateValueGroup}>
                <AppIcon name="error" size={20} />
                <Text style={styles.stateErrorText}>
                  {ticketData.currentState}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. Admin Search Bar */}
        <View style={styles.searchBarContainer}>
          <AppIcon name="search" size={20} />
          <TextInput
            style={styles.searchTextInput}
            placeholder="Search admin by name, role or skill..."
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
              accessibilityLabel="Clear search"
            >
              <AppIcon name="close" size={20} />
            </TouchableOpacity>
          )}
        </View>

        {/* 3. Filter Chips Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterChipsScrollView}
          contentContainerStyle={styles.filterChipsContainer}
        >
          {filterChips.map((chip) => {
            const isActive = selectedFilter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
                onPress={() => setSelectedFilter(chip.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {chip.label} ({chip.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 4. Admin Selection List */}
        <View style={styles.adminListContainer}>
          {filteredStaff.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <AppIcon name="group_off" size={20} />
              <Text style={styles.emptyTitle}>No admin members found</Text>
              <Text style={styles.emptyDesc}>
                No support or operations admin matches the search or filter
                criteria.
              </Text>
              <TouchableOpacity
                style={styles.emptyResetBtn}
                onPress={() => {
                  setSelectedFilter('all');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.emptyResetText}>Reset Filter</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredStaff.map((admin) => {
              const isSelected = selectedAdminId === admin.id;
              const isAvail = admin.status === 'available';

              return (
                <TouchableOpacity
                  key={admin.id}
                  style={[
                    styles.adminCard,
                    isSelected && styles.adminCardSelected,
                  ]}
                  onPress={() => setSelectedAdminId(admin.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardContentRow}>
                    {/* Radio Indicator */}
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected ? (
                        <AppIcon name="check" size={20} />
                      ) : null}
                    </View>

                    {/* Admin Details */}
                    <View style={styles.adminDetailsCol}>
                      {/* Top status & badge row */}
                      <View style={styles.adminStatusRow}>
                        {admin.isRecommended ? (
                          <View style={styles.recommendedBadge}>
                            <Text style={styles.recommendedBadgeText}>
                              RECOMMENDED SPECIALIST
                            </Text>
                          </View>
                        ) : (
                          <View />
                        )}

                        <View style={styles.availabilityPill}>
                          <View
                            style={[
                              styles.availDot,
                              isAvail
                                ? styles.availDotGreen
                                : styles.availDotAmber,
                            ]}
                          />
                          <Text
                            style={[
                              styles.availText,
                              isAvail
                                ? styles.availTextGreen
                                : styles.availTextAmber,
                            ]}
                          >
                            {isAvail ? 'Available' : 'Busy'}
                          </Text>
                        </View>
                      </View>

                      {/* Profile info row */}
                      <View style={styles.profileInfoRow}>
                        <View
                          style={[
                            styles.avatarCircle,
                            admin.isRecommended
                              ? styles.avatarRecommended
                              : styles.avatarStandard,
                          ]}
                        >
                          <Text
                            style={[
                              styles.avatarText,
                              admin.isRecommended
                                ? styles.avatarTextRec
                                : styles.avatarTextStd,
                            ]}
                          >
                            {admin.initials}
                          </Text>
                        </View>
                        <View style={styles.profileTextCol}>
                          <Text style={styles.adminNameText} numberOfLines={1}>
                            {admin.name}
                          </Text>
                          <Text style={styles.adminRoleText}>
                            {admin.role}
                          </Text>
                        </View>
                      </View>

                      {/* Metrics & Details */}
                      <View style={styles.metricsDetailsSection}>
                        <View style={styles.metricRow}>
                          <AppIcon name="inbox" size={20} />
                          <Text style={styles.metricText}>
                            {admin.openTickets} open tickets
                          </Text>
                          <Text style={styles.metricDot}>•</Text>
                          <Text
                            style={[
                              styles.slaText,
                              isAvail
                                ? styles.slaTextGreen
                                : styles.slaTextAmber,
                            ]}
                          >
                            {admin.sla}
                          </Text>
                        </View>

                        <Text
                          style={styles.specializationText}
                          numberOfLines={2}
                        >
                          <Text style={styles.specBold}>Specialization: </Text>
                          {admin.specialization}
                        </Text>

                        {admin.location && (
                          <View style={styles.locationRow}>
                            <AppIcon name="location_on" size={20} />
                            <Text style={styles.locationText}>
                              {admin.location}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* 5. Handover Note */}
        <View style={styles.handoverNoteCard}>
          <Text style={styles.handoverLabel}>
            Handover Note for Assignee (Optional)
          </Text>
          <TextInput
            style={styles.handoverTextInput}
            value={handoverNote}
            onChangeText={setHandoverNote}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* 6. Notification Toggle */}
        <View style={styles.notificationToggleCard}>
          <View style={styles.notifLeft}>
            <View style={styles.notifIconBox}>
              <AppIcon name="notifications_active" size={20} />
            </View>
            <View style={styles.notifTextCol}>
              <Text style={styles.notifTitle}>Priority Notification</Text>
              <Text style={styles.notifSubtitle}>
                Notify assignee via Push &amp; Work SMS
              </Text>
            </View>
          </View>

          <Switch
            value={isPriorityNotification}
            onValueChange={setIsPriorityNotification}
            trackColor={{ false: '#e0e3e5', true: '#0051d5' }}
            thumbColor={'#ffffff'}
          />
        </View>
      </ScrollView>

      {/* 7. Sticky Bottom Actions */}
      <View
        style={[
          styles.bottomControlsBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <TouchableOpacity
          style={styles.assignPrimaryButton}
          onPress={handleAssignTicket}
          activeOpacity={0.85}
        >
          <Text style={styles.assignPrimaryBtnText}>
            Assign Ticket to {selectedAdmin.name}
          </Text>
          <AppIcon name="arrow_forward" size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            if (navigation?.canGoBack()) {
              navigation.goBack();
            } else {
              navigation?.navigate('Support');
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>Cancel &amp; Return</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 10,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eceef0',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#191c1e',
    includeFontPadding: false,
  },
  headerTitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.2,
    flex: 1,
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

  /* Scroll Content */
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },

  /* 1. Target Ticket Summary Card */
  targetTicketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
    gap: 8,
    ...Shadows.level1,
  },
  errorAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: '#ba1a1a',
  },
  targetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 4,
  },
  targetLabelText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: '#45464d',
    textTransform: 'uppercase',
  },
  targetBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffdad6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ba1a1a',
  },
  targetBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#93000a',
  },
  targetTitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: '#191c1e',
    paddingLeft: 4,
  },
  targetDetailsBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    padding: 10,
    gap: 6,
    marginLeft: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  detailValueBold: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  detailValueMedium: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#191c1e',
  },
  detailValueBlue: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#0051d5',
  },
  stateValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stateErrorIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  stateErrorText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#ba1a1a',
  },

  /* 2. Admin Search Bar */
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    ...Shadows.level1,
  },
  searchIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#45464d',
    marginRight: 8,
    includeFontPadding: false,
  },
  searchTextInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#191c1e',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#45464d',
    includeFontPadding: false,
  },

  /* 3. Filter Chips Carousel */
  filterChipsScrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#ffffff',
    ...Shadows.level1,
  },
  filterChipActive: {
    backgroundColor: '#0051d5',
  },
  filterChipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
    fontWeight: '600',
    color: '#45464d',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },

  /* 4. Admin Selection List */
  adminListContainer: {
    gap: 10,
  },
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  emptyIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 36,
    color: '#76777d',
    includeFontPadding: false,
  },
  emptyTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    color: '#191c1e',
  },
  emptyDesc: {
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

  adminCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    ...Shadows.level1,
  },
  adminCardSelected: {
    backgroundColor: 'rgba(219, 225, 255, 0.4)',
    borderWidth: 1,
    borderColor: '#0051d5',
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e0e3e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioCircleSelected: {
    backgroundColor: '#0051d5',
  },
  radioCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    includeFontPadding: false,
  },
  adminDetailsCol: {
    flex: 1,
    gap: 6,
  },
  adminStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recommendedBadge: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  recommendedBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9.5,
    fontWeight: '700',
    color: '#003ea8',
    letterSpacing: 0.4,
  },
  availabilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availDotGreen: {
    backgroundColor: '#009668',
  },
  availDotAmber: {
    backgroundColor: '#f59e0b',
  },
  availText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
  },
  availTextGreen: {
    color: '#009668',
  },
  availTextAmber: {
    color: '#b45309',
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRecommended: {
    backgroundColor: '#131b2e',
  },
  avatarStandard: {
    backgroundColor: '#eceef0',
  },
  avatarText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    fontWeight: '700',
  },
  avatarTextRec: {
    color: '#bec6e0',
  },
  avatarTextStd: {
    color: '#45464d',
  },
  profileTextCol: {
    flex: 1,
    gap: 1,
  },
  adminNameText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  adminRoleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  metricsDetailsSection: {
    gap: 4,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inboxIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#0051d5',
    includeFontPadding: false,
  },
  metricText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#191c1e',
  },
  metricDot: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#c6c6cd',
  },
  slaText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
  },
  slaTextGreen: {
    color: '#009668',
  },
  slaTextAmber: {
    color: '#b45309',
  },
  specializationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: '#45464d',
  },
  specBold: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: '#191c1e',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationPinIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    color: '#76777d',
    includeFontPadding: false,
  },
  locationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464d',
  },

  /* 5. Handover Note */
  handoverNoteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    ...Shadows.level1,
  },
  handoverLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  handoverTextInput: {
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    padding: 10,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#191c1e',
    minHeight: 70,
  },

  /* 6. Notification Toggle */
  notificationToggleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.level1,
  },
  notifLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  notifIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifActiveIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
    includeFontPadding: false,
  },
  notifTextCol: {
    gap: 1,
    flex: 1,
  },
  notifTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13.5,
    fontWeight: '700',
    color: '#191c1e',
  },
  notifSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464d',
  },

  /* 7. Sticky Bottom Actions */
  bottomControlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e3e5',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 6,
    ...Shadows.level2,
    zIndex: 30,
  },
  assignPrimaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#000000',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  assignPrimaryBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13.5,
    fontWeight: '600',
    color: '#ffffff',
  },
  arrowIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 19,
    color: '#ffffff',
    includeFontPadding: false,
  },
  cancelButton: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#45464d',
  },
});
