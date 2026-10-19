import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { PrecisionCard } from '../../components/common/PrecisionCard';
import { PrecisionButton } from '../../components/common/PrecisionButton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MonoMetric } from '../../components/common/MonoMetric';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { TechnicianHeaderAvatar } from '../../components/common/TechnicianHeaderAvatar';
import { technicianApi } from '../../services/api/technicianApi';
import { useAdminSync } from '../../services/adminSync';

export interface CompletedJobItem {
  id: string;
  trackingCode: string;
  chairModel: string;
  issueDescription: string;
  status: string;
  address: string;
  unitFloor?: string;
  timeSlot?: string;
  visitDate?: string;
  totalAmount: number;
  payoutAmount: number;
  isPaid: boolean;
  paymentMethod: string;
  warrantyValidUntil?: string;
  customerName: string;
  customerPhone?: string;
  serviceTitle: string;
  rating?: number | null;
  reviewComment?: string | null;
  completedAt: string;
  createdAt: string;
}

type FilterOption = 'all' | 'recent' | 'five_star' | 'high_payout';

export const TechnicianJobHistoryChaircareMobileScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [historyJobs, setHistoryJobs] = useState<CompletedJobItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  const fetchHistory = useCallback(async () => {
    try {
      const res = await technicianApi.getJobHistory();
      if (res.success && Array.isArray(res.data)) {
        setHistoryJobs(res.data);
      }
    } catch {
      // Handled cleanly
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useAdminSync(navigation, fetchHistory);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, [fetchHistory]);

  // Aggregate stats
  const totalCompleted = historyJobs.length;
  const totalPayout = useMemo(
    () => historyJobs.reduce((acc, job) => acc + (job.payoutAmount || 0), 0),
    [historyJobs]
  );
  const avgRating = useMemo(() => {
    const ratedJobs = historyJobs.filter((j) => typeof j.rating === 'number' && j.rating! > 0);
    if (ratedJobs.length === 0) return 5.0;
    const sum = ratedJobs.reduce((acc, j) => acc + (j.rating || 5), 0);
    return (sum / ratedJobs.length).toFixed(1);
  }, [historyJobs]);

  // Filtered & searched jobs
  const filteredJobs = useMemo(() => {
    return historyJobs.filter((job) => {
      // Filter tab
      if (activeFilter === 'five_star' && (!job.rating || job.rating < 5)) {
        return false;
      }
      if (activeFilter === 'high_payout' && (job.payoutAmount || 0) < 500) {
        return false;
      }
      if (activeFilter === 'recent') {
        const jobDate = new Date(job.completedAt || job.createdAt).getTime();
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (jobDate < sevenDaysAgo) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = job.trackingCode?.toLowerCase().includes(q);
        const matchCust = job.customerName?.toLowerCase().includes(q);
        const matchModel = job.chairModel?.toLowerCase().includes(q);
        const matchService = job.serviceTitle?.toLowerCase().includes(q);
        const matchAddr = job.address?.toLowerCase().includes(q);
        return matchCode || matchCust || matchModel || matchService || matchAddr;
      }

      return true;
    });
  }, [historyJobs, activeFilter, searchQuery]);

  return (
    <ScreenContainer hasPadding={false}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <AppIcon name="ArrowLeft" size={20} color={Colors.onSurface} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSub}>FIELD COMPLIANCE RECORD</Text>
            <Text style={styles.headerTitle}>Job History</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <AppIcon name="RotateCw" size={18} color={Colors.secondaryCobalt} />
          </TouchableOpacity>
          <TechnicianHeaderAvatar size={36} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.secondaryCobalt} />
        }
      >
        {/* KPI Summary Cards */}
        <View style={styles.kpiContainer}>
          <PrecisionCard style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Jobs Done</Text>
              <AppIcon name="CheckCircle2" size={16} color={Colors.tertiaryEmerald} />
            </View>
            <Text style={styles.kpiValue}>{totalCompleted}</Text>
            <Text style={styles.kpiSub}>100% verified PINs</Text>
          </PrecisionCard>

          <PrecisionCard style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Net Payout</Text>
              <AppIcon name="Wallet" size={16} color={Colors.secondaryCobalt} />
            </View>
            <Text style={[styles.kpiValue, { color: Colors.secondaryCobalt }]}>₹{totalPayout}</Text>
            <Text style={styles.kpiSub}>Settled directly</Text>
          </PrecisionCard>

          <PrecisionCard style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Rating</Text>
              <AppIcon name="Star" size={16} color="#EAB308" />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
              <Text style={styles.kpiValue}>{avgRating}</Text>
              <Text style={{ fontSize: 13, color: '#EAB308', fontWeight: '700' }}>★</Text>
            </View>
            <Text style={styles.kpiSub}>Client verified</Text>
          </PrecisionCard>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBoxContainer}>
          <AppIcon name="Search" size={18} color={Colors.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ticket, model, customer, area..."
            placeholderTextColor={Colors.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <AppIcon name="X" size={16} color={Colors.outline} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
              All Jobs ({historyJobs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'recent' && styles.filterChipActive]}
            onPress={() => setActiveFilter('recent')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, activeFilter === 'recent' && styles.filterChipTextActive]}>
              Past 7 Days
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'five_star' && styles.filterChipActive]}
            onPress={() => setActiveFilter('five_star')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, activeFilter === 'five_star' && styles.filterChipTextActive]}>
              ★ 5.0 Rated Only
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'high_payout' && styles.filterChipActive]}
            onPress={() => setActiveFilter('high_payout')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, activeFilter === 'high_payout' && styles.filterChipTextActive]}>
              Payout &gt; ₹500
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Jobs List Header */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeading}>
            Completed Dispatches ({filteredJobs.length})
          </Text>
          <Text style={styles.listHeaderNote}>Sorted by completion date</Text>
        </View>

        {/* Loading Spinner */}
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.secondaryCobalt} />
            <Text style={styles.loadingText}>Loading completed service history...</Text>
          </View>
        ) : filteredJobs.length === 0 ? (
          /* Empty State */
          <PrecisionCard style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <AppIcon name="FolderClock" size={32} color={Colors.secondaryCobalt} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching history found' : 'No completed jobs yet'}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? `No completed jobs matched "${searchQuery}". Clear your search or change filter.`
                : 'When you accept dispatches and complete work by verifying the customer security PIN, your completed records and settled payouts will appear here.'}
            </Text>
            <PrecisionButton
              title="Go to Live Dispatches →"
              variant="primary"
              size="md"
              style={{ marginTop: 16 }}
              onPress={() => navigation.navigate('TechDashboardTab')}
            />
          </PrecisionCard>
        ) : (
          /* Job Cards */
          filteredJobs.map((job) => {
            const dateStr = job.completedAt
              ? new Date(job.completedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recently completed';

            return (
              <PrecisionCard key={job.id} style={styles.historyCard}>
                {/* Top Badge & Tracking Code */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.ticketBadgeRow}>
                    <View style={styles.completedPill}>
                      <AppIcon name="CheckCircle2" size={13} color={Colors.tertiaryEmerald} />
                      <Text style={styles.completedPillText}>COMPLETED</Text>
                    </View>
                    <Text style={styles.trackingCodeText}>#{job.trackingCode}</Text>
                  </View>
                  <View style={styles.payoutBadge}>
                    <Text style={styles.payoutLabel}>YOU EARNED</Text>
                    <Text style={styles.payoutValue}>₹{job.payoutAmount}</Text>
                  </View>
                </View>

                {/* Service Title & Chair Model */}
                <Text style={styles.cardServiceTitle}>{job.serviceTitle}</Text>
                <View style={styles.modelRow}>
                  <AppIcon name="Wrench" size={14} color={Colors.onSurfaceVariant} />
                  <Text style={styles.cardModelText}>{job.chairModel}</Text>
                </View>

                {/* Customer & Address Details */}
                <View style={styles.detailRow}>
                  <AppIcon name="User" size={14} color={Colors.onSurfaceVariant} />
                  <Text style={styles.cardDetailText}>Customer: {job.customerName}</Text>
                </View>

                <View style={styles.detailRow}>
                  <AppIcon name="MapPin" size={14} color={Colors.onSurfaceVariant} />
                  <Text style={styles.cardDetailText} numberOfLines={2}>
                    {job.address} {job.unitFloor ? `(${job.unitFloor})` : ''}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <AppIcon name="Calendar" size={14} color={Colors.onSurfaceVariant} />
                  <Text style={styles.cardDetailText}>Finished: {dateStr}</Text>
                </View>

                {/* Client Review Section if present */}
                {job.rating ? (
                  <View style={styles.reviewSnippet}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.ratingStars}>
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <AppIcon
                            key={idx}
                            name="Star"
                            size={13}
                            color={idx < Math.floor(job.rating || 5) ? '#EAB308' : Colors.outlineVariant}
                          />
                        ))}
                      </View>
                      <Text style={styles.ratingNumText}>{job.rating}.0 / 5.0</Text>
                    </View>
                    {!!job.reviewComment && (
                      <Text style={styles.reviewCommentText}>"{job.reviewComment}"</Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.warrantyRow}>
                    <AppIcon name="ShieldCheck" size={14} color={Colors.tertiaryEmerald} />
                    <Text style={styles.warrantyText}>90-Day Standard Warranty Active</Text>
                  </View>
                )}

                {/* Card Actions Footer */}
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.actionBtnOutline}
                    onPress={() =>
                      navigation.navigate('JobRequestDetails', {
                        jobId: job.id,
                        request: job,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <AppIcon name="ClipboardList" size={14} color={Colors.secondaryCobalt} />
                    <Text style={styles.actionBtnOutlineText}>Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnOutline}
                    onPress={() =>
                      navigation.navigate('TechnicianChat', {
                        customerName: job.customerName,
                        customerPhone: job.customerPhone,
                        requestId: job.id,
                        request: job,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <AppIcon name="MessageSquare" size={14} color={Colors.secondaryCobalt} />
                    <Text style={styles.actionBtnOutlineText}>Chat Log</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={() =>
                      navigation.navigate('EarningsTab', {
                        request: job,
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <AppIcon name="Receipt" size={14} color="#FFFFFF" />
                    <Text style={styles.actionBtnPrimaryText}>Ledger</Text>
                  </TouchableOpacity>
                </View>
              </PrecisionCard>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  headerSub: {
    ...Typography.labelMono,
    color: Colors.secondaryCobalt,
    letterSpacing: 1,
    fontSize: 10,
  },
  headerTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 18,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(19, 70, 153, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
    borderRadius: BorderRadius.xl,
    gap: 4,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  kpiValue: {
    ...Typography.headlineSm,
    fontWeight: '800',
    color: Colors.onSurface,
    fontSize: 18,
  },
  kpiSub: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.tertiaryEmerald,
    fontWeight: '600',
  },
  searchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.onSurface,
    paddingVertical: 0,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  filterChipActive: {
    backgroundColor: Colors.secondaryCobalt,
    borderColor: Colors.secondaryCobalt,
  },
  filterChipText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 4,
  },
  listHeading: {
    ...Typography.titleSm,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  listHeaderNote: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(19, 70, 153, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    ...Typography.titleMd,
    fontWeight: '700',
    color: Colors.onSurface,
    textAlign: 'center',
  },
  emptyDescription: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  historyCard: {
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  completedPillText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.tertiaryEmerald,
    letterSpacing: 0.5,
  },
  trackingCodeText: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  payoutBadge: {
    alignItems: 'flex-end',
  },
  payoutLabel: {
    ...Typography.labelMono,
    fontSize: 8,
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  payoutValue: {
    ...Typography.titleSm,
    fontWeight: '800',
    color: Colors.tertiaryEmerald,
  },
  cardServiceTitle: {
    ...Typography.titleMd,
    fontWeight: '700',
    color: Colors.onSurface,
    fontSize: 15,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardModelText: {
    ...Typography.bodySm,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardDetailText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  reviewSnippet: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    gap: 4,
    marginTop: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingNumText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#EAB308',
  },
  reviewCommentText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurface,
    fontStyle: 'italic',
  },
  warrantyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  warrantyText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.tertiaryEmerald,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    backgroundColor: Colors.surfaceContainerLow,
  },
  actionBtnOutlineText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondaryCobalt,
  },
  actionBtnPrimaryText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
