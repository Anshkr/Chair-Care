import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { BrandLogo } from '../../components/common/BrandLogo';
import { adminApi } from '../../services/api/adminApi';
import { useAdminSync } from '../../services/adminSync';

interface TechniciansScreenProps {
  navigation?: any;
}

type TabFilter = 'all' | 'online' | 'doing_job' | 'offline' | 'pending' | 'suspended';

interface TechRosterItem {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  isVerified?: boolean;
  isNew?: boolean;
  corridorLocation: string;
  rating?: number;
  completedJobsCount?: number;
  appliedTime?: string;
  experienceYears?: number;
  status: TabFilter;
  statusLabel: string;
  statusBadgeVariant: 'online' | 'busy' | 'pending' | 'suspended';
  accentColor: string;
  indicatorDotColor: string;
  metaTags: string[];
  skills: string[];
  reviewCountText?: string;
  suspensionReason?: string;
  suspensionCaseId?: string;
  actionLabel: string;
  actionDestination: 'profile' | 'verify' | 'suspend';
}

export const TechniciansChaircareMobileScreen: React.FC<TechniciansScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [technicians, setTechnicians] = useState<TechRosterItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<TabFilter>('all');
  const [searchVisible, setSearchVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Technician Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [techName, setTechName] = useState<string>('');
  const [techPhone, setTechPhone] = useState<string>('');
  const [techEmail, setTechEmail] = useState<string>('');
  const [techPassword, setTechPassword] = useState<string>('');
  const [techZone, setTechZone] = useState<string>('Delhi NCR');
  const [showTechPassword, setShowTechPassword] = useState<boolean>(false);
  const [isSubmittingTech, setIsSubmittingTech] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  const loadTechnicians = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getAllTechnicians();
      if (res.success && Array.isArray(res.data)) {
        const mapped: TechRosterItem[] = res.data.map((t: any) => {
          const initials = (t.name || 'TC')
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

          let status: TabFilter = 'online';
          let statusLabel = 'Online & Available';
          let statusBadgeVariant: 'online' | 'busy' | 'pending' | 'suspended' = 'online';
          let accentColor = '#4edea3';
          let indicatorDotColor = '#005236';
          let actionLabel = 'View Profile';
          let actionDestination: 'profile' | 'verify' | 'suspend' = 'profile';

          if (t.verificationStatus === 'pending') {
            status = 'pending';
            statusLabel = 'Pending Verification';
            statusBadgeVariant = 'pending';
            accentColor = Colors.secondaryCobalt;
            indicatorDotColor = Colors.secondaryCobalt;
            actionLabel = 'Review Application';
            actionDestination = 'verify';
          } else if (t.verificationStatus === 'suspended') {
            status = 'suspended';
            statusLabel = 'Access Suspended';
            statusBadgeVariant = 'suspended';
            accentColor = '#ba1a1a';
            indicatorDotColor = '#ba1a1a';
            actionLabel = 'Manage Status';
            actionDestination = 'suspend';
          } else if (!t.isOnline) {
            status = 'offline';
            statusLabel = 'Offline (Off Duty)';
            statusBadgeVariant = 'busy';
            accentColor = '#64748b';
            indicatorDotColor = '#94a3b8';
            actionLabel = 'View Profile';
            actionDestination = 'profile';
          } else if (t.activeJobsCount > 0 || t.dutyState === 'doing_job') {
            status = 'doing_job';
            statusLabel = t.activeJobCode ? `Doing Job (${t.activeJobCode})` : 'Doing Job (In Service)';
            statusBadgeVariant = 'busy';
            accentColor = Colors.secondaryCobalt;
            indicatorDotColor = Colors.secondaryCobalt;
            actionLabel = 'View Profile';
            actionDestination = 'profile';
          } else {
            status = 'online';
            statusLabel = 'Online & Available';
            statusBadgeVariant = 'online';
            accentColor = '#4edea3';
            indicatorDotColor = '#005236';
            actionLabel = 'View Profile';
            actionDestination = 'profile';
          }

          return {
            id: t.id,
            name: t.name,
            initials,
            isVerified: t.verificationStatus === 'verified',
            corridorLocation: t.zone || 'Central Delhi / NCR',
            rating: t.rating || 5.0,
            completedJobsCount: t.completedJobs || 0,
            status,
            statusLabel,
            statusBadgeVariant,
            accentColor,
            indicatorDotColor,
            metaTags: [t.vehicleInfo || 'Mobile Van', `${t.completedJobs || 0} Jobs`],
            skills: ['Repair', 'Maintenance', 'Hydraulics'],
            reviewCountText: `${t.completedJobs || 0} completed orders`,
            actionLabel,
            actionDestination,
          };
        });
        setTechnicians(mapped);
      }
    } catch (err) {
      console.warn('Failed to load real technicians:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTechnicians();
  }, [loadTechnicians]);

  // Real-time synchronization across admin tabs & windows
  useAdminSync(navigation, loadTechnicians);

  const handleCreateTechnician = async () => {
    setFormError('');
    if (!techName.trim() || !techPhone.trim() || !techEmail.trim() || !techPassword.trim()) {
      setFormError('Name, email, phone number, and password are required.');
      return;
    }
    if (techPassword.trim().length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsSubmittingTech(true);
      const res = await adminApi.createTechnician({
        name: techName.trim(),
        email: techEmail.trim(),
        phone: techPhone.trim(),
        password: techPassword.trim(),
        zone: techZone.trim() || 'Delhi NCR',
      });

      if (res.error) {
        setFormError(res.error || 'Failed to create technician account.');
        setIsSubmittingTech(false);
        return;
      }

      setIsSubmittingTech(false);
      setIsAddModalOpen(false);
      setTechName('');
      setTechPhone('');
      setTechEmail('');
      setTechPassword('');
      setToastMessage(`Technician ${techName.trim()} created successfully!`);
      setTimeout(() => setToastMessage(''), 3000);
      loadTechnicians();
    } catch (err: any) {
      setIsSubmittingTech(false);
      setFormError(err.message || 'Error communicating with backend.');
    }
  };


  const totalFleet = technicians.length;
  const onlineCount = technicians.filter((t) => t.status === 'online').length;
  const doingJobCount = technicians.filter((t) => t.status === 'doing_job').length;
  const offlineCount = technicians.filter((t) => t.status === 'offline').length;
  const pendingCount = technicians.filter((t) => t.status === 'pending').length;
  const suspendedCount = technicians.filter((t) => t.status === 'suspended').length;

  const filteredTechnicians = useMemo(() => {
    return technicians.filter((tech) => {
      const matchesTab = selectedTab === 'all' || tech.status === selectedTab;
      if (!matchesTab) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        tech.name.toLowerCase().includes(q) ||
        tech.corridorLocation.toLowerCase().includes(q) ||
        tech.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [technicians, selectedTab, searchQuery]);

  const handleActionClick = (tech: TechRosterItem) => {
    if (!navigation) return;

    if (tech.actionDestination === 'profile') {
      navigation.navigate('TechnicianProfileRahulSharma', {
        technicianId: tech.id,
        technician: tech,
      });
    } else if (tech.actionDestination === 'verify') {
      navigation.navigate('VerifyTechnicianVikramSingh', {
        technicianId: tech.id,
        technician: tech,
      });
    } else if (tech.actionDestination === 'suspend') {
      navigation.navigate('SuspendReactivateTechnician', {
        technicianId: tech.id,
        technician: tech,
      });
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Top Header */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <BrandLogo size={32} containerStyle={{ marginRight: 6 }} />
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitleText}>ChairCare</Text>
              <View style={styles.adminTagBadge}>
                <Text style={styles.adminTagText}>ADMIN</Text>
              </View>
            </View>
            <Text style={styles.screenEyebrow}>TECHNICIANS</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation?.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <AppIcon name="Bell" size={18} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileAvatarTop}
            onPress={() => navigation?.navigate('AdminSettingsTab')}
            activeOpacity={0.7}
          >
            <AppIcon name="User" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 20, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Management Header & Quick Utility Strip */}
        <View style={styles.managementUtilityRow}>
          <View style={styles.managementTitleCol}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.managementHeadline}>Technicians</Text>
              <View style={styles.fleetNcrBadge}>
                <Text style={styles.fleetNcrText}>FLEET-NCR</Text>
              </View>
            </View>
            <Text style={styles.managementSubText}>
              {onlineCount} online • {doingJobCount} doing job • {offlineCount} offline • {totalFleet} total registered
            </Text>
          </View>

          <View style={styles.quickUtilityActions}>
            <TouchableOpacity
              style={styles.utilityBtn}
              onPress={() => setSearchVisible((prev) => !prev)}
              activeOpacity={0.7}
            >
              <AppIcon name="Search" size={18} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.utilityBtn}
              onPress={() => Alert.alert('Filter', 'Filter by corridor zone, BIFMA rating, or availability.')}
              activeOpacity={0.7}
            >
              <AppIcon name="Sliders" size={18} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addTechPrimaryBtn}
              onPress={() => {
                setFormError('');
                setIsAddModalOpen(true);
              }}
              activeOpacity={0.88}
            >
              <AppIcon name="Plus" size={18} />
              <Text style={styles.addTechBtnText}>Add Tech</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar Input (Collapsible) */}
        {searchVisible && (
          <View style={styles.searchBarBox}>
            <AppIcon name="Search" size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, skill, corridor..."
              placeholderTextColor={Colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 3. Summary Stats 4-Grid */}
        <View style={styles.summaryStatsGrid}>
          {/* Total Fleet */}
          <View style={styles.statCard}>
            <View style={styles.statCardTop}>
              <Text style={styles.statLabelMono}>TOTAL FLEET</Text>
              <View style={styles.statIconBox}>
                <AppIcon name="Users" size={14} />
              </View>
            </View>
            <View style={styles.statCardBottom}>
              <Text style={styles.statNumberHero}>{totalFleet}</Text>
              <Text style={styles.statSubText}>All registered units</Text>
            </View>
          </View>

          {/* Online Now */}
          <View style={styles.statCard}>
            <View style={styles.statCardTop}>
              <Text style={styles.statLabelGreen}>ONLINE NOW</Text>
              <View style={[styles.statIconBox, styles.statIconBoxGreen]}>
                <AppIcon name="Zap" size={14} />
              </View>
            </View>
            <View style={styles.statCardBottom}>
              <View style={styles.onlineCountRow}>
                <Text style={styles.statNumberHero}>{onlineCount}</Text>
                <View style={styles.onlinePulseDot} />
              </View>
              <Text style={styles.statSubTextGreen}>Available for jobs</Text>
            </View>
          </View>

          {/* Doing Job */}
          <View style={styles.statCard}>
            <View style={styles.statCardTop}>
              <Text style={[styles.statLabelMono, { color: Colors.secondaryCobalt }]}>DOING JOB</Text>
              <View style={[styles.statIconBox, { backgroundColor: '#eff6ff' }]}>
                <AppIcon name="Wrench" size={14} color={Colors.secondaryCobalt} />
              </View>
            </View>
            <View style={styles.statCardBottom}>
              <Text style={[styles.statNumberHero, { color: Colors.secondaryCobalt }]}>{doingJobCount}</Text>
              <Text style={[styles.statSubText, { color: Colors.secondaryCobalt }]}>Active in field</Text>
            </View>
          </View>

          {/* Offline Units */}
          <View style={styles.statCard}>
            <View style={styles.statCardTop}>
              <Text style={styles.statLabelMono}>OFFLINE</Text>
              <View style={[styles.statIconBox, { backgroundColor: '#f1f5f9' }]}>
                <AppIcon name="Clock" size={14} color="#64748b" />
              </View>
            </View>
            <View style={styles.statCardBottom}>
              <Text style={[styles.statNumberHero, { color: '#64748b' }]}>{offlineCount}</Text>
              <Text style={styles.statSubText}>Duty paused</Text>
            </View>
          </View>
        </View>

        {/* 4. Filter Segment Horizontal Scroll Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsScroll}
        >
          <TouchableOpacity
            style={[styles.filterTabPill, selectedTab === 'all' && styles.filterTabPillActive]}
            onPress={() => setSelectedTab('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.filterTabText, selectedTab === 'all' && styles.filterTabTextActive]}
            >
              All ({totalFleet})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTabPill, selectedTab === 'online' && styles.filterTabPillActive]}
            onPress={() => setSelectedTab('online')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedTab === 'online' && styles.filterTabTextActive,
              ]}
            >
              Online ({onlineCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTabPill, selectedTab === 'doing_job' && styles.filterTabPillActive]}
            onPress={() => setSelectedTab('doing_job')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedTab === 'doing_job' && styles.filterTabTextActive,
              ]}
            >
              Doing Job ({doingJobCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTabPill, selectedTab === 'offline' && styles.filterTabPillActive]}
            onPress={() => setSelectedTab('offline')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedTab === 'offline' && styles.filterTabTextActive,
              ]}
            >
              Offline ({offlineCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTabPill, selectedTab === 'pending' && styles.filterTabPillActive]}
            onPress={() => setSelectedTab('pending')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedTab === 'pending' && styles.filterTabTextActive,
              ]}
            >
              Pending ({pendingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTabPill,
              selectedTab === 'suspended' && styles.filterTabPillActive,
            ]}
            onPress={() => setSelectedTab('suspended')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedTab === 'suspended' && styles.filterTabTextActive,
              ]}
            >
              Suspended ({suspendedCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 5. Technician Fleet List Cards */}
        <View style={styles.technicianRosterCol}>
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.secondaryCobalt} style={{ marginVertical: 32 }} />
          ) : filteredTechnicians.length === 0 ? (
            <View style={styles.emptyCard}>
              <AppIcon name="User" size={24} color={Colors.outline} />
              <Text style={styles.emptyTitle}>No technicians found</Text>
              <Text style={styles.emptySub}>
                {selectedTab === 'all'
                  ? 'No technicians registered in the database fleet yet.'
                  : `No technicians matching status "${selectedTab}".`}
              </Text>
            </View>
          ) : (
            filteredTechnicians.map((tech) => (
              <View key={tech.id} style={styles.technicianCard}>
                {/* Left accent bar */}
                <View
                  style={[styles.cardAccentBar, { backgroundColor: tech.accentColor }]}
                />

                {/* Header Info */}
                <TouchableOpacity
                  style={styles.cardHeaderInfo}
                  onPress={() => handleActionClick(tech)}
                  activeOpacity={0.7}
                >
                  <View style={styles.profileLeftGroup}>
                    {tech.avatarUrl ? (
                      <View style={styles.avatarWrapper}>
                        <Image
                          source={{ uri: tech.avatarUrl }}
                          style={styles.avatarImage}
                          resizeMode="cover"
                        />
                        <View
                          style={[
                            styles.statusBeaconDot,
                            { backgroundColor: tech.indicatorDotColor },
                          ]}
                        />
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.initialsAvatarBox,
                          tech.status === 'suspended' && styles.initialsAvatarBoxRed,
                          tech.status === 'pending' && styles.initialsAvatarBoxGray,
                        ]}
                      >
                        <Text
                          style={[
                            styles.initialsAvatarText,
                            tech.status === 'suspended' && styles.initialsTextRed,
                          ]}
                        >
                          {tech.initials}
                        </Text>
                        <View
                          style={[
                            styles.statusBeaconDot,
                            { backgroundColor: tech.indicatorDotColor },
                          ]}
                        />
                      </View>
                    )}

                    <View style={styles.nameMetaCol}>
                      <View style={styles.nameRow}>
                        <Text style={styles.technicianNameTitle}>{tech.name}</Text>
                        {tech.isVerified && (
                          <AppIcon name="Check" size={18} />
                        )}
                        {tech.isNew && (
                          <View style={styles.newBadgePill}>
                            <Text style={styles.newBadgeText}>NEW</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.corridorLocationRow}>
                        <AppIcon name="MapPin" size={18} />
                        <Text style={styles.corridorLocationText} numberOfLines={1}>
                          {tech.corridorLocation}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Rating / Jobs / Applied Meta */}
                  <View style={styles.ratingMetaRight}>
                    {tech.rating ? (
                      <View style={styles.ratingBox}>
                        <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.ratingMono}>{tech.rating}</Text>
                      </View>
                    ) : (
                      <View style={styles.appliedTimeBox}>
                        <Text style={styles.appliedTimeText}>{tech.appliedTime}</Text>
                      </View>
                    )}

                    <Text style={styles.jobCountSubText}>
                      {tech.completedJobsCount
                        ? `${tech.completedJobsCount} jobs`
                        : `Exp: ${tech.experienceYears} yrs`}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Quick Status Badges */}
                <View style={styles.statusBadgesRow}>
                  <View
                    style={[
                      styles.statusPill,
                      tech.statusBadgeVariant === 'online' && styles.statusPillOnline,
                      tech.statusBadgeVariant === 'busy' && styles.statusPillBusy,
                      tech.statusBadgeVariant === 'pending' && styles.statusPillPending,
                      tech.statusBadgeVariant === 'suspended' && styles.statusPillSuspended,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusInnerDot,
                        { backgroundColor: tech.indicatorDotColor },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        tech.statusBadgeVariant === 'online' && styles.statusTextOnline,
                        tech.statusBadgeVariant === 'busy' && styles.statusTextBusy,
                        tech.statusBadgeVariant === 'pending' && styles.statusTextPending,
                        tech.statusBadgeVariant === 'suspended' && styles.statusTextSuspended,
                      ]}
                    >
                      {tech.statusLabel}
                    </Text>
                  </View>

                  {tech.metaTags.map((tag, idx) => (
                    <View key={idx} style={styles.metaTagPill}>
                      <Text style={styles.metaTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                {/* Specialty Skills Chips */}
                <View style={styles.skillsContainer}>
                  {tech.skills.map((skill, idx) => (
                    <View key={idx} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{skill}</Text>
                    </View>
                  ))}
                </View>

                {/* Suspension Detail Box if suspended */}
                {tech.suspensionReason && (
                  <View style={styles.suspensionBox}>
                    <View style={styles.suspensionHeader}>
                      <AppIcon name="TriangleAlert" size={14} />
                      <Text style={styles.suspensionTitle}>Customer SLA Escalation</Text>
                    </View>
                    <Text style={styles.suspensionBody}>{tech.suspensionReason}</Text>
                  </View>
                )}

                {/* Action Footer */}
                <View style={styles.cardActionFooter}>
                  <View style={styles.actionFooterLeft}>
                    {tech.reviewCountText ? (
                      <>
                        <AppIcon name="Clock" size={18} />
                        <Text style={styles.reviewCountText}>{tech.reviewCountText}</Text>
                      </>
                    ) : (
                      <Text style={styles.caseIdMono}>{tech.suspensionCaseId}</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.cardActionBtn,
                      tech.actionDestination === 'verify' && styles.cardActionBtnPrimary,
                      tech.actionDestination === 'suspend' && styles.cardActionBtnRed,
                    ]}
                    onPress={() => handleActionClick(tech)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.cardActionBtnText,
                        tech.actionDestination === 'verify' && styles.cardActionBtnTextWhite,
                        tech.actionDestination === 'suspend' && styles.cardActionBtnTextRed,
                      ]}
                    >
                      {tech.actionLabel}
                    </Text>
                    <Text
                      style={[
                        styles.cardActionArrow,
                        tech.actionDestination === 'verify' && styles.cardActionBtnTextWhite,
                        tech.actionDestination === 'suspend' && styles.cardActionBtnTextRed,
                      ]}
                    >
                      {tech.actionDestination === 'suspend' ? 'REVIEW' : '→'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 6. Synchronized Fleet Telemetry Live Indicator Footer */}
        <View style={styles.fleetSyncFooterCard}>
          <View style={styles.fleetSyncLeft}>
            <View style={styles.fleetBeaconDotWrapper}>
              <View style={styles.fleetBeaconDot} />
            </View>
            <View style={styles.fleetSyncTextCol}>
              <Text style={styles.fleetSyncTitle}>Live Technician Status</Text>
              <Text style={styles.fleetSyncSub}>
                Delhi NCR & Gurgaon • Live Fleet Active
              </Text>
            </View>
          </View>

          <View style={styles.liveSensorPill}>
            <AppIcon name="Radio" size={14} />
            <Text style={styles.liveSensorText}>LIVE</Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Toast Notification */}
      {!!toastMessage && (
        <View style={styles.toastCard}>
          <AppIcon name="CheckCircle2" size={16} color="#005236" />
          <Text style={styles.toastCardText}>{toastMessage}</Text>
        </View>
      )}

      {/* Add Technician Modal */}
      <Modal
        visible={isAddModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Add New Technician</Text>
                <Text style={styles.modalSubtitle}>Register credential & activate field technician</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAddModalOpen(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <AppIcon name="X" size={18} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {!!formError && (
              <View style={styles.modalErrorBox}>
                <AppIcon name="AlertCircle" size={15} color="#ba1a1a" />
                <Text style={styles.modalErrorText}>{formError}</Text>
              </View>
            )}

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              {/* Full Name */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Full Name *</Text>
                <View style={styles.modalInputWrapper}>
                  <AppIcon name="User" size={16} color={Colors.onSurfaceVariant} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor="#94a3b8"
                    value={techName}
                    onChangeText={setTechName}
                  />
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Phone Number *</Text>
                <View style={styles.modalInputWrapper}>
                  <AppIcon name="Phone" size={16} color={Colors.onSurfaceVariant} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="+91 98765 43210"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={techPhone}
                    onChangeText={setTechPhone}
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Email Address *</Text>
                <View style={styles.modalInputWrapper}>
                  <AppIcon name="Mail" size={16} color={Colors.onSurfaceVariant} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="technician@chaircare.in"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={techEmail}
                    onChangeText={setTechEmail}
                  />
                </View>
              </View>

              {/* Create Password */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Create Password *</Text>
                <View style={styles.modalInputWrapper}>
                  <AppIcon name="Lock" size={16} color={Colors.onSurfaceVariant} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Min. 6 characters"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showTechPassword}
                    value={techPassword}
                    onChangeText={setTechPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowTechPassword((p) => !p)}
                    activeOpacity={0.7}
                    style={styles.modalEyeBtn}
                  >
                    <AppIcon
                      name={showTechPassword ? "EyeOff" : "Eye"}
                      size={16}
                      color={Colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Service Zone */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Service Zone</Text>
                <View style={styles.modalInputWrapper}>
                  <AppIcon name="MapPin" size={16} color={Colors.onSurfaceVariant} />
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="e.g. Central Delhi / NCR"
                    placeholderTextColor="#94a3b8"
                    value={techZone}
                    onChangeText={setTechZone}
                  />
                </View>
              </View>

              {/* Actions */}
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setIsAddModalOpen(false)}
                  disabled={isSubmittingTech}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, isSubmittingTech && styles.btnDisabled]}
                  onPress={handleCreateTechnician}
                  disabled={isSubmittingTech}
                  activeOpacity={0.88}
                >
                  {isSubmittingTech ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <AppIcon name="UserPlus" size={16} color="#ffffff" />
                      <Text style={styles.modalSubmitBtnText}>Create Technician</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    gap: 10,
  },
  headerBrandBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrandIcon: {
    fontSize: 18,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitleText: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  adminTagBadge: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  adminTagText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  screenEyebrow: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionIcon: {
    fontSize: 18,
  },
  profileAvatarTop: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 14,
    color: Colors.onPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    gap: 12,
  },
  managementUtilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  managementTitleCol: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  managementHeadline: {
    ...Typography.headlineSm,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.4,
  },
  fleetNcrBadge: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  fleetNcrText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  managementSubText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  quickUtilityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  utilityBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  utilityIcon: {
    fontSize: 16,
  },
  addTechPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: BorderRadius.lg,
    ...Shadows.level1,
  },
  addTechIcon: {
    fontSize: 12,
    color: Colors.onPrimary,
  },
  addTechBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onPrimary,
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
  summaryStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 12,
    justifyContent: 'space-between',
    ...Shadows.level1,
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statLabelMono: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  statLabelGreen: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#005236',
    letterSpacing: 0.6,
  },
  statIconBox: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconBoxGreen: {
    backgroundColor: 'rgba(111, 251, 190, 0.4)',
  },
  statIconBoxBlue: {
    backgroundColor: '#dbe1ff',
  },
  statIconBoxRed: {
    backgroundColor: '#ffdad6',
  },
  statIconMini: {
    fontSize: 13,
  },
  statCardBottom: {},
  statNumberHero: {
    ...Typography.headlineSm,
    fontSize: 26,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  statNumberMedium: {
    ...Typography.headlineSm,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  statNumberRed: {
    ...Typography.headlineSm,
    fontSize: 22,
    fontWeight: '800',
    color: '#ba1a1a',
  },
  onlineCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlinePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#009668',
  },
  statSubText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  statSubTextGreen: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#005236',
    marginTop: 1,
  },
  filterTabsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterTabPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  filterTabPillActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  filterTabTextActive: {
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  technicianRosterCol: {
    gap: 12,
  },
  technicianCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  cardAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  profileLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  statusBeaconDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  initialsAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#dbe1ff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  initialsAvatarBoxGray: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  initialsAvatarBoxRed: {
    backgroundColor: '#ffdad6',
  },
  initialsAvatarText: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  initialsTextRed: {
    color: '#93000a',
  },
  nameMetaCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  technicianNameTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  verifiedCheck: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.secondaryCobalt,
  },
  newBadgePill: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
  },
  newBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
  },
  corridorLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locPinIcon: {
    fontSize: 11,
  },
  corridorLocationText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  ratingMetaRight: {
    alignItems: 'flex-end',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.md,
  },
  starIcon: {
    fontSize: 11,
    color: '#f59e0b',
  },
  ratingMono: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  appliedTimeBox: {
    backgroundColor: 'rgba(219, 225, 255, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.md,
  },
  appliedTimeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
  jobCountSubText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  statusBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusPillOnline: {
    backgroundColor: 'rgba(111, 251, 190, 0.3)',
  },
  statusPillBusy: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  statusPillPending: {
    backgroundColor: '#dbe1ff',
  },
  statusPillSuspended: {
    backgroundColor: '#ffdad6',
  },
  statusInnerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusPillText: {
    ...Typography.labelMd,
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusTextOnline: {
    color: '#005236',
  },
  statusTextBusy: {
    color: '#92400e',
  },
  statusTextPending: {
    color: Colors.secondaryCobalt,
  },
  statusTextSuspended: {
    color: '#93000a',
  },
  metaTagPill: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  metaTagText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 8,
    marginBottom: 10,
  },
  skillChip: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
  },
  skillChipText: {
    ...Typography.bodySm,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.onSurfaceVariant,
  },
  suspensionBox: {
    backgroundColor: 'rgba(255, 218, 214, 0.5)',
    borderRadius: BorderRadius.lg,
    padding: 10,
    marginBottom: 10,
    gap: 2,
  },
  suspensionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warningMiniIcon: {
    fontSize: 12,
  },
  suspensionTitle: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  suspensionBody: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
  },
  cardActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  actionFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  historyIcon: {
    fontSize: 12,
  },
  reviewCountText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  caseIdMono: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
  },
  cardActionBtnPrimary: {
    backgroundColor: Colors.secondaryCobalt,
  },
  cardActionBtnRed: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  cardActionBtnText: {
    ...Typography.labelMd,
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  cardActionBtnTextWhite: {
    color: Colors.onSecondary,
  },
  cardActionBtnTextRed: {
    color: '#ba1a1a',
  },
  cardActionArrow: {
    fontSize: 13,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  fleetSyncFooterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 12,
    ...Shadows.level1,
  },
  fleetSyncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  fleetBeaconDotWrapper: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fleetBeaconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#009668',
  },
  fleetSyncTextCol: {
    flex: 1,
  },
  fleetSyncTitle: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  fleetSyncSub: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  liveSensorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
  },
  sensorIconMini: {
    fontSize: 11,
  },
  liveSensorText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
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
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    ...Platform.select({
      web: {
        zIndex: 50,
      },
    }),
  },
  navTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  navTabIcon: {
    fontSize: 20,
    color: Colors.onSurfaceVariant,
  },
  navTabIconActive: {
    color: Colors.secondaryCobalt,
  },
  navTabLabel: {
    ...Typography.labelMd,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  navTabLabelActive: {
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  toastCard: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 9999,
    ...Shadows.medium,
  },
  toastCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065f46',
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    ...Platform.select({
      web: {
        zIndex: 9999,
      },
    }),
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 460,
    maxHeight: '90%',
    padding: 20,
    ...Shadows.large,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  modalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  modalErrorText: {
    color: '#ba1a1a',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  modalFormScroll: {
    maxHeight: 400,
  },
  modalInputGroup: {
    marginBottom: 14,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    gap: 10,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 0,
  },
  modalEyeBtn: {
    padding: 6,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  modalCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modalSubmitBtn: {
    flex: 2,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.secondaryCobalt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
