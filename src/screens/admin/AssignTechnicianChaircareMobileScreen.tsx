import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { AdminHeaderAvatar } from '../../components/common/AdminHeaderAvatar';

interface AssignTechnicianProps {
  navigation?: any;
  route?: {
    params?: {
      requestId?: string;
      requestItem?: any;
      selectedTech?: string;
    };
  };
}

type FilterTag = 'all' | 'nearest' | 'hydraulic' | 'rating';

interface TechCandidate {
  id: string;
  name: string;
  designation: string;
  avatarUrl?: string;
  initials: string;
  rating: number;
  reviewsCount?: number;
  completedJobsCount: number;
  distanceKm: number;
  hubLocation: string;
  isAvailable: boolean;
  busyUntil?: string;
  isMasterCertified?: boolean;
  skillsText: string;
  inventoryLoaded?: string;
  tags: FilterTag[];
}

import { adminApi } from '../../services/api/adminApi';

const DEFAULT_TECH_CANDIDATES: TechCandidate[] = [];

export const AssignTechnicianChaircareMobileScreen: React.FC<AssignTechnicianProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const passedItem = route?.params?.requestItem;
  const passedId = route?.params?.requestId;

  // Selected request details with fallback to canonical CC-10483 Stitch reference
  const trackingCode = passedItem?.trackingCode || (passedId ? `CC-${passedId.replace('req-', '')}` : 'CC-10483');
  const serviceTitle = passedItem?.serviceTitle || 'Hydraulic Replacement';
  const customerName = passedItem?.customerName || 'Priya Sharma';
  const locationText = passedItem?.locationText || 'DLF Phase 2, Gurugram';
  const scheduleText = passedItem?.scheduleText || 'Today • 4:00 PM';
  const rawStatus = String(passedItem?.rawStatus || passedItem?.status || '').toLowerCase().trim();
  const isLocked = rawStatus === 'in_progress' || rawStatus === 'completed' || rawStatus === 'active' || rawStatus === 'cancelled';

  const [activeFilter, setActiveFilter] = useState<FilterTag>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [technicians, setTechnicians] = useState<TechCandidate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  React.useEffect(() => {
    const fetchTechs = async () => {
      setIsLoading(true);
      try {
        const res = await adminApi.getAllTechnicians();
        if (res.data && Array.isArray(res.data)) {
          const mapped: TechCandidate[] = res.data.map((t: any, idx: number) => {
            const isAvail = t.is_online !== false && t.verification_status !== 'suspended';
            const nameParts = (t.name || 'Technician').split(' ');
            const initials = (nameParts[0]?.[0] || 'T') + (nameParts[1]?.[0] || '');
            return {
              id: t.id,
              name: t.name || 'Ergonomic Specialist',
              designation: t.service_tier ? `${t.service_tier.toUpperCase()} Specialist` : 'Ergo Assembly Specialist',
              initials,
              rating: parseFloat(t.rating) || 4.8,
              reviewsCount: parseInt(t.total_reviews) || 0,
              completedJobsCount: parseInt(t.total_jobs_completed) || 0,
              distanceKm: parseFloat((2.0 + idx * 0.8).toFixed(1)),
              hubLocation: 'Gurugram Hub',
              isAvailable: isAvail,
              busyUntil: !isAvail ? 'Offline / Reserved' : undefined,
              isMasterCertified: t.service_tier === 'master' || t.experience_years >= 3,
              skillsText: Array.isArray(t.skills) ? t.skills.join(' • ') : (t.skills || 'Repair • Hydraulic • Maintenance'),
              tags: ['all', 'nearest', 'hydraulic', 'rating'] as FilterTag[],
            };
          });
          setTechnicians(mapped);
        }
      } catch (err) {
        console.warn('Failed to load technician candidates:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTechs();
  }, []);

  const filteredCandidates = useMemo(() => {
    return technicians.filter((candidate) => {
      const matchesFilter =
        activeFilter === 'all' || candidate.tags.includes(activeFilter);
      if (!matchesFilter) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        candidate.name.toLowerCase().includes(q) ||
        candidate.designation.toLowerCase().includes(q) ||
        candidate.hubLocation.toLowerCase().includes(q) ||
        candidate.skillsText.toLowerCase().includes(q)
      );
    });
  }, [technicians, activeFilter, searchQuery]);

  const handleProceedToConfirmation = (candidate: TechCandidate) => {
    if (isLocked) {
      Alert.alert(
        'Action Not Allowed',
        `Technicians cannot be assigned to jobs that are ${rawStatus === 'completed' ? 'completed' : rawStatus === 'cancelled' ? 'cancelled' : 'already in progress'}.`
      );
      return;
    }

    if (!candidate.isAvailable) {
      Alert.alert(
        'Technician Unavailable',
        `${candidate.name} is currently completing another job (${candidate.busyUntil || 'Busy'}). Please select an available technician.`
      );
      return;
    }

    if (navigation) {
      navigation.navigate('AssignmentConfirmation', {
        requestId: passedId || 'req-10483',
        requestItem: passedItem || {
          id: 'req-10483',
          trackingCode,
          serviceTitle,
          customerName,
          locationText,
          scheduleText,
        },
        selectedTechnician: candidate,
      });
    }
  };

  const handleAutoDispatchBestMatch = () => {
    if (isLocked) {
      Alert.alert(
        'Action Not Allowed',
        `Technicians cannot be assigned to jobs that are ${rawStatus === 'completed' ? 'completed' : rawStatus === 'cancelled' ? 'cancelled' : 'already in progress'}.`
      );
      return;
    }

    const bestMatch = technicians.find((t) => t.isAvailable) || technicians[0];
    if (bestMatch) {
      handleProceedToConfirmation(bestMatch);
    } else {
      Alert.alert('No Technicians', 'No technicians available for assignment.');
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Bar */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation?.canGoBack() ? navigation.goBack() : navigation?.navigate('ServiceRequestDetails'))}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.superAdminTag}>SUPER ADMIN • DISPATCH</Text>
            <Text style={styles.headerTitle}>Assign Technician</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => Alert.alert('Dispatch Options', 'Corridor routing rules & auto-dispatch threshold settings.')}
            activeOpacity={0.7}
          >
            <AppIcon name="MoreVertical" size={20} />
          </TouchableOpacity>

          <AdminHeaderAvatar size={34} />
        </View>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Compact Target Request Summary Card */}
        <View style={styles.requestSummaryCard}>
          <View style={styles.summaryAccentBar} />

          <View style={styles.summaryTopRow}>
            <View style={styles.summaryCodeServiceRow}>
              <View style={styles.trackingCodePill}>
                <Text style={styles.trackingCodePillText}>#{trackingCode}</Text>
              </View>
              <Text style={styles.serviceHeadlineTitle} numberOfLines={1}>
                {serviceTitle}
              </Text>
            </View>
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>Urgent</Text>
            </View>
          </View>

          <View style={styles.summaryMetaCol}>
            <View style={styles.metaRow}>
              <AppIcon name="User" size={18} />
              <Text style={styles.metaBoldText}>{customerName}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaRegularText} numberOfLines={1}>
                {locationText}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <AppIcon name="Clock" size={18} />
              <Text style={styles.metaBoldText}>{scheduleText}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaRegularText}>Est. Duration: 45 min</Text>
            </View>
          </View>
        </View>

        {/* 3. Smart Recommendation Callout (AI Matching Radar) */}
        <View style={styles.radarCard}>
          <View style={styles.radarAmbientGlow} />

          <View style={styles.radarTopRow}>
            <View style={styles.matchScoreBadge}>
              <AppIcon name="Zap" size={18} />
              <Text style={styles.matchScoreText}>Recommended Match (98%)</Text>
            </View>
            <Text style={styles.aiRadarTag}>AI RADAR</Text>
          </View>

          <View style={styles.radarTechRow}>
            <View style={styles.radarAvatarWrapper}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
                }}
                style={styles.radarAvatarImg}
                resizeMode="cover"
              />
              <View style={styles.radarOnlineDot} />
            </View>

            <View style={styles.radarTechMetaCol}>
              <View style={styles.radarNameVerifiedRow}>
                <Text style={styles.radarTechName}>Rahul Sharma</Text>
                <AppIcon name="Check" size={18} />
              </View>
              <Text style={styles.radarTechSub}>
                Master Certified • <Text style={styles.ratingBold}>4.9 ★</Text> (320+ jobs)
              </Text>
            </View>
          </View>

          {/* Match Criteria Chips */}
          <View style={styles.criteriaChipsRow}>
            <View style={styles.criteriaChip}>
              <AppIcon name="Compass" size={16} color={Colors.secondary} />
              <Text style={styles.criteriaText}>2.4 km (7m transit)</Text>
            </View>

            <View style={styles.criteriaChip}>
              <AppIcon name="Package" size={18} />
              <Text style={styles.criteriaText}>Class-4 OEM in Van</Text>
            </View>

            <View style={styles.criteriaChip}>
              <AppIcon name="Check" size={18} />
              <Text style={styles.criteriaText}>Ready Now</Text>
            </View>
          </View>

          {/* Quick Action */}
          <TouchableOpacity
            style={styles.quickAssignBtn}
            onPress={() => {
              if (technicians[0]) {
                handleProceedToConfirmation(technicians[0]);
              } else {
                Alert.alert('No Technicians', 'No technicians registered.');
              }
            }}
            activeOpacity={0.88}
          >
            <Text style={styles.quickAssignBtnText}>
              {technicians[0] ? `Assign ${technicians[0].name}` : 'Assign Technician'}
            </Text>
            <Text style={styles.quickAssignArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Search & Filter Bar */}
        <View style={styles.searchFilterBlock}>
          <View style={styles.searchBarBox}>
            <AppIcon name="Search" size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search technicians by name, skill, corridor..."
              placeholderTextColor={Colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            )}
          </View>

          {/* Horizontal Scrollable Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsScroll}
          >
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
              onPress={() => setActiveFilter('all')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
                All Available (6)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'nearest' && styles.filterChipActive]}
              onPress={() => setActiveFilter('nearest')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, activeFilter === 'nearest' && styles.filterChipTextActive]}>
                Nearest (&lt;5km)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'hydraulic' && styles.filterChipActive]}
              onPress={() => setActiveFilter('hydraulic')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, activeFilter === 'hydraulic' && styles.filterChipTextActive]}>
                Hydraulic Certified
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'rating' && styles.filterChipActive]}
              onPress={() => setActiveFilter('rating')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, activeFilter === 'rating' && styles.filterChipTextActive]}>
                High Rated (4.8+)
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 5. Technician Candidates List */}
        <View style={styles.candidatesCol}>
          {filteredCandidates.length === 0 ? (
            <View style={styles.emptyCard}>
              <AppIcon name="User" size={18} />
              <Text style={styles.emptyTitle}>No available technicians match</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search criteria or switching filter tags.
              </Text>
            </View>
          ) : (
            filteredCandidates.map((tech) => {
              const isSelected = selectedTechId === tech.id;

              return (
                <View
                  key={tech.id}
                  style={[
                    styles.candidateCard,
                    !tech.isAvailable && styles.candidateCardBusy,
                    isSelected && styles.candidateCardSelected,
                  ]}
                >
                  <View style={styles.candidateTopRow}>
                    <View style={styles.candidateProfileLeft}>
                      {tech.avatarUrl ? (
                        <View style={styles.candidateAvatarWrapper}>
                          <Image
                            source={{ uri: tech.avatarUrl }}
                            style={styles.candidateAvatarImg}
                            resizeMode="cover"
                          />
                          <View
                            style={[
                              styles.candidateStatusDot,
                              tech.isAvailable ? styles.dotGreen : styles.dotGray,
                            ]}
                          />
                        </View>
                      ) : (
                        <View style={styles.candidateInitialBox}>
                          <Text style={styles.candidateInitialText}>{tech.initials}</Text>
                          <View
                            style={[
                              styles.candidateStatusDot,
                              tech.isAvailable ? styles.dotGreen : styles.dotGray,
                            ]}
                          />
                        </View>
                      )}

                      <View style={styles.candidateNameCol}>
                        <View style={styles.candidateNameRow}>
                          <Text style={styles.candidateNameTitle}>{tech.name}</Text>
                          {tech.isMasterCertified && (
                            <AppIcon name="Check" size={18} />
                          )}
                        </View>
                        <Text style={styles.candidateDesignation}>{tech.designation}</Text>
                      </View>
                    </View>

                    {tech.isAvailable ? (
                      <View style={styles.availableBadge}>
                        <View style={styles.greenMiniDot} />
                        <Text style={styles.availableBadgeText}>Available</Text>
                      </View>
                    ) : (
                      <View style={styles.busyBadge}>
                        <View style={styles.grayMiniDot} />
                        <Text style={styles.busyBadgeText} numberOfLines={1}>
                          {tech.busyUntil}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Stat Cells */}
                  <View style={styles.candidateStatsGrid}>
                    <View style={styles.candidateStatCell}>
                      <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.statCellText}>
                        {tech.rating}
                        {tech.reviewsCount ? ` (${tech.reviewsCount})` : ''} • {tech.completedJobsCount}+ jobs
                      </Text>
                    </View>

                    <View style={styles.candidateStatCell}>
                      <AppIcon name="MapPin" size={18} />
                      <Text style={styles.statCellText}>
                        {tech.distanceKm} km • {tech.hubLocation}
                      </Text>
                    </View>
                  </View>

                  {/* Skills / Inventory rows */}
                  <View style={styles.skillsInventoryCol}>
                    <View style={styles.skillRow}>
                      <AppIcon name="Wrench" size={14} />
                      <Text style={styles.skillsText} numberOfLines={1}>
                        {tech.skillsText}
                      </Text>
                    </View>

                    {tech.inventoryLoaded && (
                      <View style={styles.inventoryRow}>
                        <AppIcon name="Truck" size={14} />
                        <Text style={styles.inventoryText} numberOfLines={1}>
                          {tech.inventoryLoaded}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action CTA */}
                  {tech.isAvailable ? (
                    <TouchableOpacity
                      style={styles.assignCandidateBtn}
                      onPress={() => {
                        setSelectedTechId(tech.id);
                        handleProceedToConfirmation(tech);
                      }}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.assignCandidateBtnText}>Assign Tech</Text>
                      <AppIcon name="ChevronRight" size={20} />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.busyDisabledBtn}>
                      <AppIcon name="Lock" size={18} />
                      <Text style={styles.busyDisabledBtnText}>Busy (Completing Ticket)</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 6. Sticky Bottom Dispatch Bar */}
      <View style={[styles.stickyBottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomSlaRow}>
          <AppIcon name="Clock" size={18} />
          <Text style={styles.bottomSlaText}>
            Auto-notifies technician • 5-min acceptance SLA
          </Text>
        </View>

        <TouchableOpacity
          style={styles.autoDispatchMainBtn}
          onPress={handleAutoDispatchBestMatch}
          activeOpacity={0.88}
        >
          <AppIcon name="Zap" size={18} />
          <Text style={styles.autoDispatchBtnText}>Auto-Dispatch Best Match</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: 12,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        zIndex: 50,
      },
    }),
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
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  superAdminTag: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  profileAvatarTop: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  profileAvatarText: {
    fontSize: 14,
    color: Colors.onPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    gap: 12,
  },
  requestSummaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  summaryAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.secondaryCobalt,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryCodeServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  trackingCodePill: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  trackingCodePillText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  serviceHeadlineTitle: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
    flex: 1,
  },
  urgentBadge: {
    backgroundColor: '#ffdad6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  urgentBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#93000a',
  },
  summaryMetaCol: {
    gap: 4,
    paddingLeft: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 13,
  },
  metaBoldText: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  metaDot: {
    fontSize: 10,
    color: Colors.outline,
  },
  metaRegularText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  radarCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 81, 213, 0.12)',
    ...Shadows.level2,
  },
  radarAmbientGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 81, 213, 0.08)',
  },
  radarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  matchScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  boltIcon: {
    fontSize: 12,
  },
  matchScoreText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#002113',
  },
  aiRadarTag: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  radarTechRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  radarAvatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
  },
  radarAvatarImg: {
    width: '100%',
    height: '100%',
  },
  radarOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4edea3',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  radarTechMetaCol: {
    flex: 1,
  },
  radarNameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  radarTechName: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  verifiedIcon: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.secondaryCobalt,
  },
  radarTechSub: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  ratingBold: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  criteriaChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  criteriaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
  },
  criteriaIcon: {
    fontSize: 11,
  },
  criteriaIconGreen: {
    fontSize: 11,
    fontWeight: '900',
    color: '#005236',
  },
  criteriaText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  quickAssignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondaryCobalt,
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    ...Shadows.level1,
  },
  quickAssignBtnText: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSecondary,
  },
  quickAssignArrow: {
    fontSize: 16,
    color: Colors.onSecondary,
    fontWeight: '700',
  },
  searchFilterBlock: {
    gap: 8,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    ...Shadows.level1,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurface,
  },
  clearSearchIcon: {
    fontSize: 14,
    color: Colors.outline,
    paddingHorizontal: 4,
  },
  filterChipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    ...Shadows.level1,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.labelMd,
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  candidatesCol: {
    gap: 10,
  },
  candidateCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    ...Shadows.level1,
  },
  candidateCardBusy: {
    opacity: 0.8,
  },
  candidateCardSelected: {
    borderWidth: 1.5,
    borderColor: Colors.secondaryCobalt,
  },
  candidateTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  candidateProfileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  candidateAvatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  candidateAvatarImg: {
    width: '100%',
    height: '100%',
  },
  candidateInitialBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dbe1ff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  candidateInitialText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  candidateStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  dotGreen: {
    backgroundColor: '#4edea3',
  },
  dotGray: {
    backgroundColor: Colors.outline,
  },
  candidateNameCol: {
    flex: 1,
  },
  candidateNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  candidateNameTitle: {
    ...Typography.titleLg,
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  verifiedSmallIcon: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.secondaryCobalt,
  },
  candidateDesignation: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(111, 251, 190, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  greenMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#005236',
  },
  availableBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#005236',
  },
  busyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    maxWidth: 140,
  },
  grayMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.outline,
  },
  busyBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  candidateStatsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  candidateStatCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  statStarIcon: {
    fontSize: 12,
    color: Colors.secondaryCobalt,
  },
  statPinIcon: {
    fontSize: 11,
  },
  statCellText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurface,
  },
  skillsInventoryCol: {
    gap: 4,
    marginBottom: 12,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wrenchMiniIcon: {
    fontSize: 12,
  },
  skillsText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  inventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  truckMiniIcon: {
    fontSize: 12,
  },
  inventoryText: {
    ...Typography.bodySm,
    fontSize: 11,
    fontWeight: '500',
    color: '#005236',
    flex: 1,
  },
  assignCandidateBtn: {
    height: 38,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  assignCandidateBtnText: {
    ...Typography.labelMd,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  assignChevronIcon: {
    fontSize: 15,
    color: Colors.onPrimary,
  },
  busyDisabledBtn: {
    height: 38,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  lockIcon: {
    fontSize: 12,
  },
  busyDisabledBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.outline,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 24,
    alignItems: 'center',
    ...Shadows.level1,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  emptySub: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: Spacing.md,
    paddingTop: 8,
    ...Shadows.level2,
    ...Platform.select({
      web: {
        zIndex: 40,
      },
    }),
  },
  bottomSlaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 6,
  },
  timerPulseIcon: {
    fontSize: 13,
  },
  bottomSlaText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
  },
  autoDispatchMainBtn: {
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.secondaryCobalt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  autoDispatchBolt: {
    fontSize: 16,
  },
  autoDispatchBtnText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSecondary,
  },
});
