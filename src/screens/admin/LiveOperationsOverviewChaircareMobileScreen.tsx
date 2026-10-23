import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Linking,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import { ThemeSwitchButton } from '../../components/common/ThemeSwitchButton';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { adminApi } from '../../services/api/adminApi';
import { useAdminSync } from '../../services/adminSync';
import { phoneCallService } from '../../services/phone/phoneCallService';

interface LiveOperationsProps {
  navigation?: any;
}

export const LiveOperationsOverviewChaircareMobileScreen: React.FC<LiveOperationsProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [liveRequests, setLiveRequests] = useState<any[]>([]);
  const [liveTechs, setLiveTechs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoDispatched, setAutoDispatched] = useState<boolean>(false);

  const [filterTab, setFilterTab] = useState<'all' | 'in_field' | 'queued'>('all');
  const [assignModalVisible, setAssignModalVisible] = useState<boolean>(false);
  const [selectedJobToAssign, setSelectedJobToAssign] = useState<any>(null);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [reqRes, techRes] = await Promise.all([
        adminApi.getAllRequests(),
        adminApi.getAllTechnicians(),
      ]);
      if (reqRes.success && Array.isArray(reqRes.data)) {
        setLiveRequests(reqRes.data);
      }
      if (techRes.success && Array.isArray(techRes.data)) {
        setLiveTechs(techRes.data);
      }
    } catch (err) {
      console.warn('Failed to load telemetry:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Real-time synchronization
  useAdminSync(navigation, loadData);

  const activeJobs = liveRequests.filter((r) =>
    ['in_route', 'arrived', 'in_progress', 'assigned'].includes(r.status)
  );
  const waitingJobs = liveRequests.filter((r) =>
    ['finding_technician', 'draft'].includes(r.status)
  );
  const liveAllJobs = liveRequests.filter((r) =>
    ['finding_technician', 'assigned', 'in_route', 'arrived', 'in_progress'].includes(r.status)
  );
  const assignedJobs = liveRequests.filter((r) => r.status === 'assigned');
  const onlineTechs = liveTechs.filter((t) => t.isOnline ?? t.is_online);

  const displayJobs =
    filterTab === 'all'
      ? liveAllJobs
      : filterTab === 'in_field'
      ? activeJobs
      : waitingJobs;

  const activeJobsCount = activeJobs.length;
  const waitingCount = waitingJobs.length;
  const assignedCount = assignedJobs.length;
  const issuesCount = liveRequests.filter((r) => r.status === 'cancelled').length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleAutoDispatch = async () => {
    if (waitingJobs.length === 0) {
      Alert.alert('No Queued Requests', 'All active customer requests currently have assigned specialists.');
      return;
    }
    if (onlineTechs.length === 0) {
      Alert.alert('No Online Techs', 'No technicians are currently online in the corridor.');
      return;
    }
    const targetJob = waitingJobs[0];
    const targetTech = onlineTechs[0];
    setAutoDispatched(true);
    try {
      const res = await adminApi.assignTechnician(targetJob.id, targetTech.id);
      if (res.success) {
        Alert.alert(
          'Technician Dispatched',
          `${targetTech.name} has been assigned to request ${targetJob.trackingCode || targetJob.id}.`
        );
        loadData();
      } else {
        Alert.alert('Assignment Failed', res.error || 'Could not dispatch technician.');
      }
    } catch {
      Alert.alert('Assignment Failed', 'Network error during dispatch.');
    } finally {
      setAutoDispatched(false);
    }
  };

  const handleOpenAssignModal = (job: any) => {
    setSelectedJobToAssign(job);
    setAssignModalVisible(true);
  };

  const handleAssignSpecificTech = async (techId: string, techName: string) => {
    if (!selectedJobToAssign) return;
    setIsAssigning(true);
    try {
      const res = await adminApi.assignTechnician(selectedJobToAssign.id, techId);
      if (res.success) {
        setAssignModalVisible(false);
        Alert.alert('Technician Assigned', `${techName} assigned to request ${selectedJobToAssign.trackingCode || selectedJobToAssign.id}.`);
        loadData();
      } else {
        Alert.alert('Assignment Failed', res.error || 'Could not assign technician.');
      }
    } catch {
      Alert.alert('Assignment Failed', 'Network error during technician assignment.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleInspectJob = (ticketId: string) => {
    if (navigation) {
      navigation.navigate('ServiceRequestDetails', { requestId: ticketId });
    }
  };

  const handleVoiceBridge = () => {
    Alert.alert(
      'Emergency Voice Bridge',
      `Connecting dispatch bridge to ${onlineTechs.length || 2} active field units.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Connect Channel', onPress: () => Alert.alert('Bridge Connected', 'Broadcast line active.') },
      ]
    );
  };

  const handleFleetAlert = () => {
    Alert.alert(
      'Broadcast Fleet Alert',
      'Send priority push notification to all on-duty technicians.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Broadcast', onPress: () => Alert.alert('Alert Broadcasted', 'Fleet push dispatched.') },
      ]
    );
  };

  return (
    <View style={styles.screenContainer}>
      {/* Top Header */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation?.canGoBack() ? navigation.goBack() : navigation?.navigate('AdminMain'))}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Operations</Text>
        </View>

        <View style={styles.headerRight}>
          <ThemeSwitchButton variant="header" style={{ marginRight: 6 }} />
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <AppIcon name="RefreshCw" size={18} />
          </TouchableOpacity>

          <View style={styles.profileAvatarTop}>
            <AppIcon name="User" size={18} />
          </View>
        </View>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Real-Time Ops Telemetry Bar */}
        <View style={styles.telemetryBar}>
          <View style={styles.telemetryNodeGroup}>
            <View style={styles.beaconPingWrapper}>
              <View style={styles.beaconPingDot} />
            </View>
            <Text style={styles.telemetryNodeText}>Delhi NCR Dispatch Hub</Text>
          </View>

          <View style={styles.latencyPill}>
            <AppIcon name="Radio" size={16} color={Colors.secondary} />
            <Text style={styles.latencyText}>Live Operations Active</Text>
          </View>
        </View>

        {/* KPI 2x2 Grid */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Active */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiAccentBar, { backgroundColor: Colors.secondaryCobalt }]} />
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiLabel}>ACTIVE</Text>
              <View style={[styles.kpiDot, { backgroundColor: Colors.secondaryCobalt }]} />
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiNumber}>{activeJobsCount}</Text>
              <Text style={styles.kpiUnit}>jobs</Text>
            </View>
            <Text style={styles.kpiSub}>Real-time in progress</Text>
          </View>

          {/* Card 2: Waiting */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiAccentBar, { backgroundColor: '#565e74' }]} />
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiLabel}>WAITING</Text>
              <View style={[styles.kpiDot, { backgroundColor: '#565e74' }]} />
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiNumber}>{waitingCount}</Text>
              <Text style={styles.kpiUnit}>queued</Text>
            </View>
            <Text style={styles.kpiSub}>Dispatch pending</Text>
          </View>

          {/* Card 3: Assigned */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiAccentBar, { backgroundColor: Colors.primaryContainer }]} />
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiLabel}>ASSIGNED</Text>
              <View style={[styles.kpiDot, { backgroundColor: Colors.primaryContainer }]} />
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiNumber}>{assignedCount}</Text>
              <Text style={styles.kpiUnit}>vans</Text>
            </View>
            <Text style={styles.kpiSub}>En route to site</Text>
          </View>

          {/* Card 4: Issues */}
          <View style={styles.kpiCard}>
            <View style={[styles.kpiAccentBar, { backgroundColor: Colors.error }]} />
            <View style={styles.kpiHeaderRow}>
              <Text style={[styles.kpiLabel, { color: Colors.error }]}>ISSUES</Text>
              <View style={[styles.kpiDot, { backgroundColor: Colors.error }]} />
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={[styles.kpiNumber, { color: Colors.error }]}>{issuesCount}</Text>
              <Text style={[styles.kpiUnit, { color: Colors.error }]}>alerts</Text>
            </View>
            <Text style={[styles.kpiSub, { color: Colors.error }]}>Telemetry / parts lag</Text>
          </View>
        </View>

        {/* Map Preview Spatial Section ("Corridor Tracking") */}
        <View style={styles.mapCard}>
          <View style={styles.mapHeaderRow}>
            <View style={styles.mapTitleGroup}>
              <AppIcon name="MapPin" size={18} />
              <Text style={styles.mapTitle}>Corridor Tracking</Text>
            </View>
            <View style={styles.hubBadge}>
              <Text style={styles.hubBadgeText}>GURUGRAM - DLF HUB</Text>
            </View>
          </View>

          {/* Embedded Spatial Map View */}
          <View style={styles.mapLayerBox}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=80',
              }}
              style={styles.mapBaseImage}
            />

            {/* Radar / Corridor Svg Overlay */}
            <View style={styles.svgOverlay}>
              <Svg height="100%" width="100%">
                <Line
                  x1="28%"
                  y1="36%"
                  x2="52%"
                  y2="58%"
                  stroke={Colors.secondaryCobalt}
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  opacity="0.85"
                />
                <Line
                  x1="52%"
                  y1="58%"
                  x2="78%"
                  y2="40%"
                  stroke={Colors.secondaryCobalt}
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  opacity="0.85"
                />
                <Line
                  x1="52%"
                  y1="58%"
                  x2="38%"
                  y2="82%"
                  stroke={Colors.error}
                  strokeWidth="2"
                  strokeDasharray="2 2"
                  opacity="0.75"
                />
              </Svg>
            </View>

            {/* Pin 1: Primary Online Tech */}
            <View style={[styles.mapNodePin, { top: '30%', left: '24%' }]}>
              <View style={[styles.pinCircle, { backgroundColor: Colors.secondaryCobalt }]}>
                <AppIcon name="Car" size={16} color={Colors.primary} />
              </View>
              <View style={styles.pinLabelBox}>
                <Text style={styles.pinLabelText}>
                  {onlineTechs[0]?.name
                    ? `${onlineTechs[0].name.split(' ')[0]} (${onlineTechs[0].current_zone || onlineTechs[0].currentZone ? (onlineTechs[0].current_zone || onlineTechs[0].currentZone).split('&')[0].trim() : 'DLF Hub'})`
                    : 'Corridor Unit #1'}
                </Text>
              </View>
            </View>

            {/* Pin 2: Secondary Online Tech */}
            <View style={[styles.mapNodePin, { top: '34%', right: '18%' }]}>
              <View style={[styles.pinCircle, { backgroundColor: '#565e74' }]}>
                <AppIcon name="Wrench" size={18} />
              </View>
              <View style={styles.pinLabelBox}>
                <Text style={styles.pinLabelText}>
                  {onlineTechs[1]?.name
                    ? `${onlineTechs[1].name.split(' ')[0]} (${onlineTechs[1].current_zone || onlineTechs[1].currentZone ? (onlineTechs[1].current_zone || onlineTechs[1].currentZone).split('&')[0].trim() : 'Saket'})`
                    : 'Corridor Unit #2'}
                </Text>
              </View>
            </View>

            {/* Pin 3: Customer Job Destination */}
            <View style={[styles.mapNodePin, { top: '56%', left: '50%' }]}>
              <View style={[styles.pinCircle, { backgroundColor: Colors.surfaceContainerLowest }]}>
                <AppIcon name="Armchair" size={18} />
              </View>
              <View style={[styles.pinLabelBox, { backgroundColor: Colors.surfaceContainerLowest }]}>
                <Text style={[styles.pinLabelText, { color: Colors.onSurface }]}>
                  {activeJobs[0]?.trackingCode || waitingJobs[0]?.trackingCode
                    ? `${(activeJobs[0] || waitingJobs[0]).trackingCode} • ${((activeJobs[0] || waitingJobs[0]).chairModel || 'Chair').split(' ')[0]}`
                    : 'Gurugram Hub'}
                </Text>
              </View>
            </View>

            {/* Pin 4: Telemetry Node Status */}
            <View style={[styles.mapNodePin, { bottom: '16%', left: '36%' }]}>
              <View style={[styles.pinCircle, { backgroundColor: waitingCount > 0 ? Colors.error : '#059669' }]}>
                <AppIcon name={waitingCount > 0 ? 'Clock' : 'Check'} size={18} color="#FFFFFF" />
              </View>
              <View style={[styles.pinLabelBox, { backgroundColor: waitingCount > 0 ? Colors.error : '#059669' }]}>
                <Text style={[styles.pinLabelText, { color: '#FFFFFF' }]}>
                  {waitingCount > 0 ? `${waitingCount} Queued` : 'All Assigned'}
                </Text>
              </View>
            </View>

            {/* Floating Telemetry Badge */}
            <View style={styles.floatingTelemetryBadge}>
              <View style={styles.blueDot} />
              <Text style={styles.floatingTelemetryText}>
                {onlineTechs.length} Online Techs • {liveAllJobs.length} Active Services
              </Text>
            </View>

            {/* Zoom Controls */}
            <View style={styles.zoomControlsBox}>
              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={() => Alert.alert('Zoom In', 'Corridor resolution: 1:5,000')}
                activeOpacity={0.7}
              >
                <Text style={styles.zoomBtnText}>＋</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={() => Alert.alert('Zoom Out', 'Corridor resolution: 1:25,000')}
                activeOpacity={0.7}
              >
                <Text style={styles.zoomBtnText}>−</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Launcher Button */}
          <TouchableOpacity
            style={styles.mapActionBtn}
            onPress={() => Alert.alert('Spatial Radar', 'Live NCR Telemetry Map activated with real-time van telemetry.')}
            activeOpacity={0.88}
          >
            <Text style={styles.mapActionBtnText}>Open Live Telemetry Map</Text>
            <Text style={styles.northEastArrow}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* Active In-Field Services Section */}
        <View style={styles.activeServicesSection}>
          <View style={styles.servicesHeaderRow}>
            <View style={styles.servicesHeaderLeft}>
              <Text style={styles.servicesTitle}>Live Operational Queue</Text>
              <View style={styles.activeCountPill}>
                <Text style={styles.activeCountPillText}>{displayJobs.length} Displayed</Text>
              </View>
            </View>
            {waitingCount > 0 && (
              <TouchableOpacity
                style={[styles.autoDispatchBtn, autoDispatched && { opacity: 0.6 }]}
                onPress={handleAutoDispatch}
                disabled={autoDispatched}
                activeOpacity={0.8}
              >
                <AppIcon name="Zap" size={14} color="#FFFFFF" />
                <Text style={styles.autoDispatchBtnText}>Auto-Dispatch</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Real-time Filter Segment Tabs */}
          <View style={styles.tabSegmentsRow}>
            <TouchableOpacity
              style={[styles.tabSegment, filterTab === 'all' && styles.tabSegmentActive]}
              onPress={() => setFilterTab('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabSegmentText, filterTab === 'all' && styles.tabSegmentTextActive]}>
                ALL ACTIVE ({liveAllJobs.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabSegment, filterTab === 'in_field' && styles.tabSegmentActive]}
              onPress={() => setFilterTab('in_field')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabSegmentText, filterTab === 'in_field' && styles.tabSegmentTextActive]}>
                IN FIELD ({activeJobs.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabSegment, filterTab === 'queued' && styles.tabSegmentActive]}
              onPress={() => setFilterTab('queued')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabSegmentText, filterTab === 'queued' && styles.tabSegmentTextActive]}>
                QUEUED ({waitingCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Service Cards Stack */}
          <View style={styles.serviceCardsStack}>
            {isLoading ? (
              <ActivityIndicator size="large" color={Colors.secondaryCobalt} style={{ marginVertical: 32 }} />
            ) : displayJobs.length === 0 ? (
              <View style={[styles.serviceItemCard, { alignItems: 'center', paddingVertical: 28 }]}>
                <AppIcon name="Activity" size={28} color={Colors.outline} />
                <Text style={[styles.serviceTitleText, { marginTop: 8, fontSize: 15 }]}>
                  {filterTab === 'queued'
                    ? 'Dispatch Queue Clear'
                    : filterTab === 'in_field'
                    ? 'No Technicians Currently En Route'
                    : 'All Corridors Clear'}
                </Text>
                <Text style={[styles.customerLocText, { textAlign: 'center', marginTop: 4 }]}>
                  {filterTab === 'queued'
                    ? 'All incoming customer bookings have assigned technicians.'
                    : 'Field specialists are standing by in Gurugram and Delhi NCR corridors.'}
                </Text>
              </View>
            ) : (
              displayJobs.map((item) => {
                const isEnRoute = item.status === 'in_route';
                const isArrived = item.status === 'arrived';
                const isInProgress = item.status === 'in_progress';
                const isAssigned = item.status === 'assigned';
                const isQueued = item.status === 'finding_technician';

                const statusLabel = isEnRoute
                  ? 'Technician On The Way'
                  : isArrived
                  ? 'Arrived on Site'
                  : isInProgress
                  ? 'In Progress'
                  : isAssigned
                  ? 'Assigned'
                  : 'Queued • Awaiting Tech';

                const hasAssignedTech = Boolean(
                  item.technicianName &&
                  !item.technicianName.toLowerCase().includes('unassigned') &&
                  !item.technicianName.toLowerCase().includes('awaiting')
                );

                return (
                  <View key={item.id} style={styles.serviceItemCard}>
                    <View style={styles.serviceCardTopRow}>
                      <View style={styles.serviceCardLeft}>
                        <View style={styles.ticketBadgeRow}>
                          <View style={styles.ticketCodeBadge}>
                            <Text style={styles.ticketCodeText}>
                              {item.trackingCode || `#CC-${item.id?.slice(0, 5)}`}
                            </Text>
                          </View>
                          <Text style={styles.serviceTitleText}>
                            {item.serviceTitle || item.chairModel || 'Office Chair Service'}
                          </Text>
                        </View>
                        <Text style={styles.customerLocText} numberOfLines={2}>
                          {item.customerName || 'Customer'} • 📍 {item.address || 'NCR Region'}
                        </Text>
                      </View>

                      <View style={[
                        styles.inProgressBadge,
                        isQueued && { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
                        isAssigned && { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' },
                      ]}>
                        <View style={[
                          styles.blueDot,
                          isQueued && { backgroundColor: '#D97706' },
                          isAssigned && { backgroundColor: '#16A34A' },
                        ]} />
                        <Text style={[
                          styles.inProgressText,
                          isQueued && { color: '#B45309' },
                          isAssigned && { color: '#15803D' },
                        ]}>
                          {statusLabel}
                        </Text>
                      </View>
                    </View>

                    {/* Technician Box / Assignment Action */}
                    {hasAssignedTech ? (
                      <View style={styles.techMicroBox}>
                        <View style={styles.techProfileLeft}>
                          <View style={[styles.techAvatar, { backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }]}>
                            <AppIcon name="User" size={20} color={Colors.secondaryCobalt} />
                          </View>
                          <View style={styles.techMetaCol}>
                            <View style={styles.techNameRow}>
                              <Text style={styles.techName}>{item.technicianName}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                <Text style={styles.techRating}>{item.technicianRating || '5.0'}</Text>
                                <AppIcon name="Star" size={12} color="#f59e0b" fill="#f59e0b" />
                              </View>
                            </View>
                            <Text style={styles.techDesignation}>
                              {item.vehicleInfo || item.currentZone || 'Field Specialist'}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.callTechBtn}
                          onPress={() => {
                            if (item.technicianPhone) {
                              phoneCallService.callNumber(item.technicianPhone, item.technicianName);
                            } else {
                              Alert.alert('Technician Contact', `Specialist: ${item.technicianName}`);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <AppIcon name="Phone" size={18} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.unassignedPromptBox}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.unassignedPromptTitle}>Awaiting Specialist Match</Text>
                          <Text style={styles.unassignedPromptSub}>
                            {onlineTechs.length} certified technician{onlineTechs.length !== 1 ? 's' : ''} currently online
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.assignDirectBtn}
                          onPress={() => handleOpenAssignModal(item)}
                          activeOpacity={0.8}
                        >
                          <AppIcon name="UserPlus" size={13} color="#FFFFFF" />
                          <Text style={styles.assignDirectBtnText}>Assign Tech</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Diagnostics & Inspection Line */}
                    <View style={styles.diagnosticsRow}>
                      <View style={styles.diagnosticsLeft}>
                        <AppIcon name="Clock" size={16} />
                        <Text style={styles.diagnosticsText} numberOfLines={1}>
                          {item.chairModel || 'Ergonomic Task Chair'} • {item.timeSlot || 'Scheduled Dispatch'}
                          {item.createdAt ? ` • Booked ${new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.inspectBtn}
                        onPress={() => handleInspectJob(item.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.inspectBtnText}>Inspect Job</Text>
                        <Text style={styles.chevronMini}>›</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Operational Health Micro Card */}
        <TouchableOpacity
          style={styles.healthMicroCard}
          onPress={() => Alert.alert('Spare Hub', 'Central Gurugram Warehouse: 42 Gas Cylinders, 88 Castors available.')}
          activeOpacity={0.75}
        >
          <View style={styles.healthLeft}>
            <View style={styles.healthIconBox}>
              <AppIcon name="Wrench" size={18} />
            </View>
            <View>
              <Text style={styles.healthTitle}>Spare Inventory Hub</Text>
              <Text style={styles.healthSub}>42 Gas Cylinders, 88 Castors available</Text>
            </View>
          </View>
          <Text style={styles.chevronGray}>›</Text>
        </TouchableOpacity>

        {/* Emergency Operations Bridge Bottom Card */}
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyTopRow}>
            <View style={styles.emergencyTitleGroup}>
              <View style={styles.blueDot} />
              <Text style={styles.emergencyTitle}>EMERGENCY OPS HOTLINE</Text>
            </View>
            <View style={styles.bridgeLivePill}>
              <Text style={styles.bridgeLiveText}>BRIDGE LIVE</Text>
            </View>
          </View>

          <Text style={styles.emergencyDesc}>
            Direct broadcast channel open to 24 field supervisors across Sector 29, Cyber City & Golf Course Extension.
          </Text>

          <View style={styles.emergencyActionsRow}>
            <TouchableOpacity
              style={styles.voiceBridgeBtn}
              onPress={handleVoiceBridge}
              activeOpacity={0.85}
            >
              <AppIcon name="Headphones" size={16} color={Colors.secondary} />
              <Text style={styles.voiceBridgeBtnText}>Voice Bridge</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fleetAlertBtn}
              onPress={handleFleetAlert}
              activeOpacity={0.85}
            >
              <AppIcon name="Megaphone" size={16} color={Colors.secondary} />
              <Text style={styles.fleetAlertBtnText}>Fleet Alert</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Manual Technician Assignment Modal */}
      <Modal
        visible={assignModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setAssignModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.assignModalCard}>
            <View style={styles.assignModalHeader}>
              <View>
                <Text style={styles.assignModalTitle}>Assign Certified Technician</Text>
                <Text style={styles.assignModalSub}>
                  Select field unit for {selectedJobToAssign?.trackingCode || selectedJobToAssign?.chairModel || 'Request'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setAssignModalVisible(false)}
              >
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380, marginVertical: 12 }} showsVerticalScrollIndicator={false}>
              {onlineTechs.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <AppIcon name="Users" size={24} color={Colors.outline} />
                  <Text style={{ ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: 8 }}>
                    No technicians are online right now.
                  </Text>
                </View>
              ) : (
                onlineTechs.map((tech) => (
                  <TouchableOpacity
                    key={tech.id}
                    style={styles.techChoiceRow}
                    onPress={() => handleAssignSpecificTech(tech.id, tech.name)}
                    activeOpacity={0.7}
                    disabled={isAssigning}
                  >
                    <View style={styles.techAvatarBox}>
                      <AppIcon name="User" size={18} color={Colors.secondaryCobalt} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.techChoiceName}>{tech.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Text style={{ ...Typography.labelMono, fontSize: 11, fontWeight: '700', color: '#D97706' }}>
                            {tech.rating ? Number(tech.rating).toFixed(1) : '5.0'}
                          </Text>
                          <AppIcon name="Star" size={11} color="#D97706" fill="#D97706" />
                        </View>
                      </View>
                      <Text style={styles.techChoiceMeta} numberOfLines={1}>
                        {tech.current_zone || tech.currentZone || 'Gurugram & Delhi NCR'} • {tech.vehicle_info || 'Mobile Unit'}
                      </Text>
                    </View>
                    <AppIcon name="ChevronRight" size={16} color={Colors.outline} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelModalBtn}
              onPress={() => setAssignModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelModalBtnText}>Cancel</Text>
            </TouchableOpacity>
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
    gap: 8,
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
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    fontSize: 18,
  },
  refreshingAnim: {
    opacity: 0.5,
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
  telemetryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...Shadows.level1,
  },
  telemetryNodeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  beaconPingWrapper: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaconPingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondaryCobalt,
  },
  telemetryNodeText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  latencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  sensorsIcon: {
    fontSize: 11,
  },
  latencyText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 88,
    justifyContent: 'space-between',
    ...Shadows.level1,
  },
  kpiAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiLabel: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  kpiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  kpiNumber: {
    ...Typography.headlineMd,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  kpiUnit: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  kpiSub: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  mapCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 10,
    gap: 10,
    ...Shadows.level1,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  mapTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapPinIcon: {
    fontSize: 16,
  },
  mapTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  hubBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hubBadgeText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  mapLayerBox: {
    height: 200,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  mapBaseImage: {
    width: '100%',
    height: '100%',
  },
  svgOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  mapNodePin: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -14 }, { translateY: -14 }],
  },
  pinCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  pinIconText: {
    fontSize: 12,
  },
  pinLabelBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2,
  },
  pinLabelText: {
    ...Typography.labelMono,
    fontSize: 8.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  floatingTelemetryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(247, 249, 251, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    ...Shadows.level1,
  },
  floatingTelemetryText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  zoomControlsBox: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(247, 249, 251, 0.9)',
    borderRadius: BorderRadius.sm,
    padding: 2,
    gap: 2,
    ...Shadows.level1,
  },
  zoomBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  mapActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
  },
  mapActionBtnText: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  northEastArrow: {
    fontSize: 13,
    color: Colors.onPrimary,
  },
  activeServicesSection: {
    gap: 10,
    paddingTop: 2,
  },
  servicesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  servicesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  servicesTitle: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  activeCountPill: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  activeCountPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  filterBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
  filterBtnIcon: {
    fontSize: 12,
  },
  serviceCardsStack: {
    gap: 10,
  },
  serviceItemCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 12,
    gap: 10,
    ...Shadows.level1,
  },
  serviceCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  serviceCardLeft: {
    flex: 1,
  },
  ticketBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketCodeBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ticketCodeText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  serviceTitleText: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
    flex: 1,
  },
  customerLocText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  inProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  inProgressText: {
    ...Typography.labelMd,
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  waitingBadgeText: {
    ...Typography.labelMd,
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  techMicroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 8,
  },
  techProfileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  techAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },
  techMetaCol: {
    flex: 1,
  },
  techNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  techName: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  techRating: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  techDesignation: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  callTechBtn: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callTechIcon: {
    fontSize: 14,
  },
  packageIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  packageIcon: {
    fontSize: 16,
  },
  packageName: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  packageSub: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  diagnosticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  diagnosticsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  timelapseIcon: {
    fontSize: 12,
  },
  diagnosticsText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  inspectBtnText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  chevronMini: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  autoDispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.secondaryCobalt,
    paddingVertical: 9,
    borderRadius: BorderRadius.lg,
    marginTop: 2,
  },
  boltIcon: {
    fontSize: 13,
  },
  autoDispatchBtnText: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  healthMicroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    padding: 12,
    ...Shadows.level1,
  },
  healthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  healthIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  healthIcon: {
    fontSize: 18,
  },
  healthTitle: {
    ...Typography.titleLg,
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  healthSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  chevronGray: {
    fontSize: 18,
    color: Colors.outline,
    fontWeight: '700',
  },
  emergencyCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 8,
    ...Shadows.level1,
  },
  emergencyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emergencyTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emergencyTitle: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: 0.6,
  },
  bridgeLivePill: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bridgeLiveText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
  },
  emergencyDesc: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  emergencyActionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  voiceBridgeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
  },
  voiceBridgeIcon: {
    fontSize: 14,
  },
  voiceBridgeBtnText: {
    ...Typography.bodyMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  fleetAlertBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
  },
  fleetAlertIcon: {
    fontSize: 14,
  },
  fleetAlertBtnText: {
    ...Typography.bodyMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  slateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#565e74',
  },
  tabSegmentsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    marginBottom: 6,
  },
  tabSegment: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabSegmentActive: {
    backgroundColor: '#EEF2FF',
    borderColor: Colors.secondaryCobalt,
  },
  tabSegmentText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  tabSegmentTextActive: {
    color: Colors.secondaryCobalt,
    fontWeight: '800',
  },
  unassignedPromptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: BorderRadius.md,
    padding: 10,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  unassignedPromptTitle: {
    ...Typography.titleSm,
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  unassignedPromptSub: {
    ...Typography.bodySm,
    fontSize: 10,
    color: '#B45309',
    marginTop: 1,
  },
  assignDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondaryCobalt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  assignDirectBtnText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  assignModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: 18,
    maxHeight: '80%',
    ...Shadows.level3,
  },
  assignModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  assignModalTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  assignModalSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  techChoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  techAvatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  techChoiceName: {
    ...Typography.titleSm,
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  techChoiceMeta: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  cancelModalBtn: {
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    marginTop: 8,
  },
  cancelModalBtnText: {
    ...Typography.titleSm,
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});
