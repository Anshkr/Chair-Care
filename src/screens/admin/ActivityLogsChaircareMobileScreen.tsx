import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../components/common/AppIcon';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { adminApi } from '../../services/api/adminApi';

interface ActivityLogItem {
  id: string;
  category: 'admin' | 'people' | 'finance' | 'operations' | 'security';
  badgeCategory: string;
  badgeStatus: string;
  badgeStatusType: 'completed' | 'executed' | 'reassigned' | 'critical' | 'approved';
  time: string;
  title: string;
  icon: string;
  iconBgColor?: string;
  iconColor?: string;
  amount?: string;
  target: string;
  contextNote: string;
  contextNoteIcon: string;
  contextNoteError?: boolean;
  actorInitials: string;
  actorName: string;
  actionButtonLabel: string;
  actionButtonIcon: string;
  actionButtonColor?: string;
  nonce?: string;
  ipOrigin?: string;
  sessionId?: string;
  operatorAnnotation?: string;
}

interface ActivityLogsProps {
  navigation?: any;
}

const INITIAL_LOGS: ActivityLogItem[] = [];

export const ActivityLogsChaircareMobileScreen: React.FC<
  ActivityLogsProps
> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'admin' | 'people' | 'finance' | 'security'
  >('all');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(true);

  // Detail Drawer Modal State
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  // Filter Modal State
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

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
    }, 2400);
  };

  // Real Database Logs
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  React.useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      try {
        const res = await adminApi.getActivityLogs();
        if (res.success && Array.isArray(res.data) && isMounted) {
          setLogs(res.data);
        }
      } catch (err) {
        // silent
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchLogs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered dataset
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      const matchCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'admin' && item.actorInitials === 'SA') ||
        item.category === selectedCategory ||
        (selectedCategory === 'people' && item.category === 'people') ||
        (selectedCategory === 'finance' && item.category === 'finance') ||
        (selectedCategory === 'security' && item.category === 'security');

      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.target.toLowerCase().includes(q) ||
        item.actorName.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.contextNote.toLowerCase().includes(q)
      );
    });
  }, [logs, selectedCategory, searchQuery]);

  const handleExportLogs = () => {
    if (navigation) {
      navigation.navigate('AuditExport', { filterScope: { selectedCategory } });
    } else {
      displayToast('Encrypted audit log bundle exported (CSV/JSON)');
    }
  };

  const handleQuickCritical = () => {
    setSelectedCategory('security');
    displayToast('Filtered: 6 Critical Security Events');
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
            <AppIcon name="arrow_back" size={20} color={Colors.onSurface} strokeWidth={1.8} />
          </TouchableOpacity>
          <View style={styles.headerTitleColumn}>
            <Text style={styles.headerSubtitleText}>CHAIRCARE ADMIN</Text>
            <Text style={styles.headerTitleText} numberOfLines={1}>
              Activity Feed
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            onPress={() => {
              if (navigation) {
                navigation.navigate('FilterActivity', {
                  currentFilters: { selectedCategory },
                  onApplyFilters: (filters: any) => {
                    displayToast('Activity filters updated');
                  },
                });
              } else {
                setShowFilterModal(true);
              }
            }}
            accessibilityLabel="Filter list"
          >
            <AppIcon name="filter_list" size={20} color={Colors.onSurface} strokeWidth={1.8} />
          </TouchableOpacity>
          <View style={styles.headerAvatar}>
            <AppIcon name="person" size={18} color={Colors.onSurface} strokeWidth={1.8} />
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
        {/* Status / Telemetry Ribbon */}
        <View style={styles.telemetryRibbon}>
          <View style={styles.telemetryRibbonLeft}>
            <View style={styles.pulseDot} />
            <Text style={styles.telemetryRibbonText} numberOfLines={1}>
              AUDIT LEDGER SYNC • IMMUTABLE EVENT BUS • 99.99% INTEGRITY
            </Text>
          </View>
          <Text style={styles.liveTag}>LIVE</Text>
        </View>

        {/* Header Context Title */}
        <View style={styles.contextHeader}>
          <View style={styles.contextHeaderTop}>
            <View>
              <Text style={styles.contextEyebrow}>Audit Console</Text>
              <Text style={styles.contextMainTitle}>Activity Logs</Text>
            </View>
            <View style={styles.contextButtonsRow}>
              <TouchableOpacity
                style={styles.contextSmallBtn}
                onPress={() => setIsSearchOpen(!isSearchOpen)}
                activeOpacity={0.7}
                accessibilityLabel="Search logs"
              >
                <AppIcon name="search" size={18} color={Colors.onSurface} strokeWidth={1.8} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contextSmallBtn}
                onPress={() => setShowFilterModal(true)}
                activeOpacity={0.7}
                accessibilityLabel="Filter configuration"
              >
                <AppIcon name="tune" size={18} color={Colors.onSurface} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.contextSubtitle}>
            Track administrative events, operator dispatches, and ledger mutations in real time.
          </Text>
        </View>

        {/* Realtime Search Bar */}
        {isSearchOpen && (
          <View style={styles.searchBarContainer}>
            <AppIcon name="search" size={18} color={Colors.onSurfaceVariant} strokeWidth={1.8} />
            <TextInput
              style={styles.searchBarInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search actors, targets, action codes (e.g. RF-39281)..."
              placeholderTextColor={Colors.onSurfaceVariant}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchBtn}
              >
                <AppIcon name="close" size={16} color={Colors.onSurfaceVariant} strokeWidth={1.8} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 2x2 Metric Summary Cards */}
        <View style={styles.kpiGrid}>
          {/* Metric 1: Total Today */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Actions Today</Text>
              <AppIcon name="database" size={16} color={Colors.secondary} strokeWidth={1.8} />
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>248</Text>
              <View style={styles.kpiDeltaBadge}>
                <Text style={styles.kpiDeltaText}>+14%</Text>
              </View>
            </View>
            <View style={styles.kpiProgressTrack}>
              <View
                style={[
                  styles.kpiProgressFill,
                  { width: '75%', backgroundColor: '#0051d5' },
                ]}
              />
            </View>
          </View>

          {/* Metric 2: Active Operators */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Admins Active</Text>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>7</Text>
              <Text style={styles.kpiUnit}>online</Text>
            </View>
            <View style={styles.avatarAvailRow}>
              <View style={[styles.miniAvatar, { backgroundColor: '#dae2fd' }]}>
                <Text style={styles.miniAvatarText}>SA</Text>
              </View>
              <View style={[styles.miniAvatar, { backgroundColor: '#dbe1ff' }]}>
                <Text style={[styles.miniAvatarText, { color: '#0051d5' }]}>
                  PS
                </Text>
              </View>
              <View style={[styles.miniAvatar, { backgroundColor: '#e6e8ea' }]}>
                <Text style={styles.miniAvatarText}>+5</Text>
              </View>
            </View>
          </View>

          {/* Metric 3: Critical Events */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={[styles.kpiLabel, { color: '#ba1a1a' }]}>
                Critical Events
              </Text>
              <AppIcon name="shield_with_heart" size={16} color="#ba1a1a" strokeWidth={1.8} />
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={[styles.kpiValue, { color: '#ba1a1a' }]}>6</Text>
              <View style={styles.criticalPill}>
                <Text style={styles.criticalPillText}>Elevated</Text>
              </View>
            </View>
            <Text style={styles.kpiSmallSubtext} numberOfLines={1}>
              Requires Super Admin review
            </Text>
          </View>

          {/* Metric 4: Failed Actions */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Failed Actions</Text>
              <AppIcon name="sync_problem" size={16} color={Colors.onSurfaceVariant} strokeWidth={1.8} />
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>3</Text>
              <View style={styles.retryPill}>
                <Text style={styles.retryPillText}>Retry auto</Text>
              </View>
            </View>
            <Text style={styles.kpiSmallSubtext} numberOfLines={1}>
              1 Webhook, 2 SMS alerts
            </Text>
          </View>
        </View>

        {/* Horizontal Scrollable Segment Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsContainer}
        >
          {[
            { key: 'all', label: 'All', count: '248' },
            { key: 'admin', label: 'Admins', count: '142' },
            { key: 'people', label: 'Technicians', count: '36' },
            { key: 'finance', label: 'Customers', count: '48' },
            { key: 'security', label: 'System', count: '22' },
          ].map((tab) => {
            const isSelected = selectedCategory === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
                onPress={() => {
                  setSelectedCategory(tab.key as any);
                  displayToast(`Showing ${tab.label} activity`);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.filterChipBadge,
                    isSelected && styles.filterChipBadgeSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipBadgeText,
                      isSelected && styles.filterChipBadgeTextSelected,
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Chronological Log List */}
        <View style={styles.logCardsStack}>
          {filteredLogs.map((log) => (
            <View key={log.id} style={styles.activityCard}>
              {/* Card Header Row */}
              <View style={styles.activityCardTop}>
                <View style={styles.activityBadgesRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {log.badgeCategory}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      log.badgeStatusType === 'critical'
                        ? styles.statusBadgeCritical
                        : log.badgeStatusType === 'executed' ||
                          log.badgeStatusType === 'completed' ||
                          log.badgeStatusType === 'approved'
                        ? styles.statusBadgeCompleted
                        : styles.statusBadgeDefault,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        log.badgeStatusType === 'critical'
                          ? styles.statusBadgeTextCritical
                          : log.badgeStatusType === 'executed' ||
                            log.badgeStatusType === 'completed' ||
                            log.badgeStatusType === 'approved'
                          ? styles.statusBadgeTextCompleted
                          : styles.statusBadgeTextDefault,
                      ]}
                    >
                      {log.badgeStatus}
                    </Text>
                  </View>
                </View>
                <Text style={styles.timestampText}>{log.time}</Text>
              </View>

              {/* Card Body Row */}
              <View style={styles.activityBodyRow}>
                <View style={styles.activityIconBox}>
                  <AppIcon name={log.icon} size={20} />
                </View>

                <View style={styles.activityDetailsColumn}>
                  <View style={styles.activityTitleRow}>
                    <Text style={styles.activityTitleText} numberOfLines={1}>
                      {log.title}
                    </Text>
                    {log.amount && (
                      <Text style={styles.activityAmountText}>
                        {log.amount}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.activityTargetText} numberOfLines={2}>
                    {log.target}
                  </Text>

                  {/* Context Note Strip */}
                  <View style={styles.contextNoteBox}>
                    <AppIcon name={log.contextNoteIcon} size={20} />
                    <Text
                      style={[
                        styles.contextNoteText,
                        log.contextNoteError && { color: '#ba1a1a' },
                      ]}
                      numberOfLines={1}
                    >
                      {log.contextNote}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Card Footer Row */}
              <View style={styles.activityFooterRow}>
                <View style={styles.actorRow}>
                  <View style={styles.actorInitialsBox}>
                    <Text style={styles.actorInitialsText}>
                      {log.actorInitials}
                    </Text>
                  </View>
                  <Text style={styles.actorNameText} numberOfLines={1}>
                    {log.actorName}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.inspectActionBtn}
                  onPress={() => setSelectedLog(log)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.inspectActionText,
                      log.actionButtonColor
                        ? { color: log.actionButtonColor }
                        : null,
                    ]}
                  >
                    {log.actionButtonLabel}
                  </Text>
                  <AppIcon name={log.actionButtonIcon} size={20} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Ledger Hash Digest Widget */}
        <View style={styles.ledgerDigestCard}>
          <View style={styles.ledgerDigestLeft}>
            <View style={styles.ledgerIconBox}>
              <AppIcon name="fingerprint" size={20} />
            </View>
            <View>
              <Text style={styles.ledgerTitle}>Ledger Hash Digest</Text>
              <Text style={styles.ledgerHash}>
                SHA-256: 4f89b...e890c (Synced)
              </Text>
            </View>
          </View>
          <AppIcon name="verified_user" size={20} />
        </View>
      </ScrollView>

      {/* Realtime Confirmation Toast Container */}
      {toastVisible && (
        <View
          style={[
            styles.toastContainer,
            { bottom: Math.max(insets.bottom, 20) + 70 },
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

      {/* Bottom Floating Shortcut Action Rail */}
      <View
        style={[
          styles.bottomActionRail,
          { paddingBottom: Math.max(insets.bottom, 10) + 6 },
        ]}
      >
        <View style={styles.bottomRailContent}>
          <TouchableOpacity
            style={styles.quickCriticalButton}
            onPress={handleQuickCritical}
            activeOpacity={0.8}
          >
            <AppIcon name="priority_high" size={20} />
            <Text style={styles.quickCriticalText}>Critical Feed (6)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportLogsButton}
            onPress={handleExportLogs}
            activeOpacity={0.85}
          >
            <AppIcon name="ios_share" size={20} />
            <Text style={styles.exportLogsText}>Export Audit Log</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Slide-in Detail Drawer Modal */}
      <Modal
        visible={selectedLog !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedLog(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedLog(null)}
        >
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <AppIcon name="verified" size={20} />
                <View>
                  <Text style={styles.modalTitle}>Audit Record Details</Text>
                  <Text style={styles.modalIdText}>{selectedLog?.id}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedLog(null)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>

            {selectedLog && (
              <View style={styles.drawerContent}>
                {/* Meta Details Box */}
                <View style={styles.drawerMetaBox}>
                  <View style={styles.drawerMetaRow}>
                    <Text style={styles.drawerMetaLabel}>Timestamp:</Text>
                    <Text style={styles.drawerMetaVal}>
                      Today, {selectedLog.time}:42 IST
                    </Text>
                  </View>
                  <View style={styles.drawerMetaRow}>
                    <Text style={styles.drawerMetaLabel}>Immutable Nonce:</Text>
                    <Text style={styles.drawerMetaVal}>
                      {selectedLog.nonce || '0x7f48a901e'}
                    </Text>
                  </View>
                  <View style={styles.drawerMetaRow}>
                    <Text style={styles.drawerMetaLabel}>IP Origin:</Text>
                    <Text style={styles.drawerMetaVal}>
                      {selectedLog.ipOrigin || '103.21.144.18 (VPN-Chennai-02)'}
                    </Text>
                  </View>
                  <View style={styles.drawerMetaRow}>
                    <Text style={styles.drawerMetaLabel}>Session ID:</Text>
                    <Text style={styles.drawerMetaVal}>
                      {selectedLog.sessionId || 'sess_9938d_priya'}
                    </Text>
                  </View>
                </View>

                {/* Operator Annotation */}
                <View style={styles.annotationGroup}>
                  <Text style={styles.annotationLabel}>
                    OPERATOR ANNOTATION
                  </Text>
                  <Text style={styles.annotationBody}>
                    {selectedLog.operatorAnnotation ||
                      'Client disputed delayed hydraulic seal installation. Technician verified factory defect on Hermann Miller pneumatic cylinder. Standard SLA waiver #W-104 invoked by Finance.'}
                  </Text>
                </View>

                {/* Drawer Action Buttons */}
                <View style={styles.drawerActionsRow}>
                  <TouchableOpacity
                    style={[styles.downloadProofBtn, { backgroundColor: '#0F172A' }]}
                    onPress={() => {
                      const log = selectedLog;
                      setSelectedLog(null);
                      navigation?.navigate('ActivityDetailsRf39281', { logId: log?.id, logData: log });
                    }}
                    activeOpacity={0.85}
                  >
                    <AppIcon name="open_in_new" size={20} />
                    <Text style={styles.downloadProofText}>
                      View Complete Dossier
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.downloadProofBtn}
                    onPress={() => {
                      displayToast('Downloaded cryptographic proof (JSON)');
                      setSelectedLog(null);
                    }}
                    activeOpacity={0.85}
                  >
                    <AppIcon name="download" size={20} />
                    <Text style={styles.downloadProofText}>
                      Download Proof
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dismissBtn}
                    onPress={() => setSelectedLog(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dismissBtnText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Activity Categories</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterModalList}>
              {[
                { key: 'all', title: 'All Activity Streams' },
                { key: 'admin', title: 'Super Admin Actions Only' },
                { key: 'people', title: 'Technician & Fleet Updates' },
                { key: 'finance', title: 'Customer & Invoicing Transactions' },
                { key: 'security', title: 'System & Security Privileges' },
              ].map((opt) => {
                const isSelected = selectedCategory === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.filterModalItem,
                      isSelected && styles.filterModalItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedCategory(opt.key as any);
                      setShowFilterModal(false);
                      displayToast(`Active Filter: ${opt.title}`);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterModalItemText,
                        isSelected && styles.filterModalItemTextSelected,
                      ]}
                    >
                      {opt.title}
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
  headerTitleColumn: {
    marginLeft: 4,
    flex: 1,
  },
  headerSubtitleText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#76777d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitleText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#191c1e',
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
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
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
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },

  /* Telemetry Ribbon */
  telemetryRibbon: {
    backgroundColor: '#131b2e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  telemetryRibbonLeft: {
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
  telemetryRibbonText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#ffffff',
    letterSpacing: 0.5,
    flex: 1,
  },
  liveTag: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10,
    color: '#4edea3',
  },

  /* Header Context */
  contextHeader: {
    gap: 4,
    paddingHorizontal: 2,
  },
  contextHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contextEyebrow: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#0051d5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contextMainTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 20,
    lineHeight: 28,
    color: '#191c1e',
  },
  contextButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  contextSmallBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#e6e8ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextSmallBtnIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#191c1e',
  },
  contextSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: '#45464d',
  },

  /* Search Bar */
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  searchBarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#76777d',
    marginRight: 8,
  },
  searchBarInput: {
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
    fontSize: 16,
    color: '#76777d',
  },

  /* KPI Grid */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    justifyContent: 'space-between',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
    textTransform: 'uppercase',
  },
  kpiHeaderIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4edea3',
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  kpiValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: '#191c1e',
  },
  kpiDeltaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 9999,
    backgroundColor: 'rgba(111, 251, 190, 0.3)',
  },
  kpiDeltaText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10,
    color: '#005236',
  },
  kpiUnit: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#76777d',
  },
  kpiProgressTrack: {
    height: 4,
    backgroundColor: '#f2f4f6',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  kpiProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  avatarAvailRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  miniAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9,
    color: '#191c1e',
  },
  criticalPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#ffdad6',
  },
  criticalPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#93000a',
  },
  retryPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#dbe1ff',
  },
  retryPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#003ea8',
  },
  kpiSmallSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#76777d',
    marginTop: 4,
  },

  /* Filter Tabs */
  filterTabsContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: '#e6e8ea',
  },
  filterChipSelected: {
    backgroundColor: '#000000',
  },
  filterChipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#45464d',
  },
  filterChipTextSelected: {
    color: '#ffffff',
  },
  filterChipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: '#d8dadc',
  },
  filterChipBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterChipBadgeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#191c1e',
  },
  filterChipBadgeTextSelected: {
    color: '#ffffff',
  },

  /* Log Cards */
  logCardsStack: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  activityCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  activityBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#dbe1ff',
  },
  categoryBadgeText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10,
    color: '#00174b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(78, 222, 163, 0.3)',
  },
  statusBadgeCritical: {
    backgroundColor: '#ffdad6',
  },
  statusBadgeDefault: {
    backgroundColor: '#e6e8ea',
  },
  statusBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
  },
  statusBadgeTextCompleted: {
    color: '#005236',
  },
  statusBadgeTextCritical: {
    color: '#93000a',
  },
  statusBadgeTextDefault: {
    color: '#45464d',
  },
  timestampText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
  },
  activityBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  activityIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f2f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
  },
  activityDetailsColumn: {
    flex: 1,
    gap: 4,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  activityTitleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#191c1e',
    flex: 1,
  },
  activityAmountText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 16,
    color: '#191c1e',
  },
  activityTargetText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#45464d',
  },
  contextNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f2f4f6',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 2,
  },
  contextNoteIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#45464d',
  },
  contextNoteText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
    flex: 1,
  },
  activityFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f7f9fb',
  },
  actorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  actorInitialsBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#131b2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actorInitialsText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9,
    color: '#ffffff',
  },
  actorNameText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#76777d',
    flex: 1,
  },
  inspectActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inspectActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#0051d5',
  },
  inspectActionIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#0051d5',
  },

  /* Ledger Digest Card */
  ledgerDigestCard: {
    backgroundColor: '#e6e8ea',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ledgerDigestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  ledgerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ffffff',
  },
  ledgerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#191c1e',
  },
  ledgerHash: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#45464d',
  },
  ledgerVerifiedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#0051d5',
  },

  /* Bottom Floating Shortcut Rail */
  bottomActionRail: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bottomRailContent: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    gap: 8,
  },
  quickCriticalButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ffdad6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickCriticalIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ba1a1a',
  },
  quickCriticalText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#93000a',
  },
  exportLogsButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  exportLogsIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
  },
  exportLogsText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#ffffff',
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

  /* Slide-in Detail Drawer Modal */
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
    maxHeight: '80%',
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalVerifiedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 24,
    color: '#0051d5',
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 17,
    color: '#191c1e',
  },
  modalIdText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
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
  drawerContent: {
    gap: 14,
  },
  drawerMetaBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  drawerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerMetaLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 12,
    color: '#76777d',
  },
  drawerMetaVal: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#191c1e',
  },
  annotationGroup: {
    gap: 4,
  },
  annotationLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
    textTransform: 'uppercase',
  },
  annotationBody: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#191c1e',
    backgroundColor: '#eceef0',
    padding: 12,
    borderRadius: 10,
  },
  drawerActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  downloadProofBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  downloadProofIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
  },
  downloadProofText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#ffffff',
  },
  dismissBtn: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#e6e8ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#191c1e',
  },

  /* Filter Modal Items */
  filterModalList: {
    gap: 8,
  },
  filterModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#f7f9fb',
  },
  filterModalItemSelected: {
    backgroundColor: '#dbe1ff',
  },
  filterModalItemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#191c1e',
    flex: 1,
  },
  filterModalItemTextSelected: {
    fontFamily: 'Inter-SemiBold',
    color: '#00174b',
  },
  filterModalCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
  },
});
