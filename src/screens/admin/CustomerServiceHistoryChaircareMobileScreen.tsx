import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface CustomerServiceHistoryProps {
  navigation?: any;
  route?: {
    params?: {
      customerId?: string;
      customer?: any;
    };
  };
}

type HistoryFilterType = 'all' | 'completed' | 'active' | 'cancelled';

interface HistoryTicketItem {
  id: string;
  ticketCode: string;
  title: string;
  status: 'completed' | 'active' | 'cancelled';
  statusLabel: string;
  priceFormatted: string;
  settlementMethod: string;
  chairModel?: string;
  chairSpec?: string;
  specTag?: string;
  imageUrl?: string;
  timestamp: string;
  technicianName?: string;
  technicianRating?: number;
  etaMinutes?: number;
  auditNotes?: string;
  telemetryData?: {
    torqueNm: number;
    torqueStatus: string;
    pressurePsi: number;
    pressureStatus: string;
    frictionMu: number;
    frictionStatus: string;
    techSignatureHash: string;
  };
}

const SAMPLE_SERVICE_HISTORY: HistoryTicketItem[] = [
  {
    id: 'req-01',
    ticketCode: 'CC-10482',
    title: 'Office Chair Repair',
    status: 'completed',
    statusLabel: 'Completed',
    priceFormatted: '₹749',
    settlementMethod: 'UPI Settled',
    chairModel: 'Herman Miller Aeron (Size B)',
    chairSpec: 'Synchron-Tilt & Gas Strut Calibrated',
    specTag: 'VERIFIED SPEC ASSET',
    imageUrl:
      'https://images.unsplash.com/photo-1580481077197-0f85f34fb25c?q=80&w=400&auto=format&fit=crop',
    timestamp: 'Today, 12 Oct • 03:14 PM',
    technicianName: 'Rahul Sharma',
    technicianRating: 4.9,
    telemetryData: {
      torqueNm: 42.4,
      torqueStatus: '42.4 Nm (Optimal)',
      pressurePsi: 310,
      pressureStatus: '310 PSI (Calibrated)',
      frictionMu: 0.08,
      frictionStatus: '0.08 μ (Lubricated)',
      techSignatureHash: 'e7f8...901a',
    },
  },
  {
    id: 'req-02',
    ticketCode: 'CC-10421',
    title: 'Hydraulic Replacement',
    status: 'completed',
    statusLabel: 'Completed',
    priceFormatted: '₹1,249',
    settlementMethod: 'Card Settled',
    chairModel: 'Steelcase Gesture',
    chairSpec: 'Heavy Duty Gas Cylinder Swapped',
    specTag: 'CLASS-4 HYDRO CORE',
    imageUrl:
      'https://images.unsplash.com/photo-1505797149-43b0069ec26b?q=80&w=400&auto=format&fit=crop',
    timestamp: '08 Oct • 11:30 AM',
    technicianName: 'Amit Kumar',
    technicianRating: 4.8,
    telemetryData: {
      torqueNm: 38.2,
      torqueStatus: '38.2 Nm (Tight)',
      pressurePsi: 320,
      pressureStatus: '320 PSI (Heavy-Duty)',
      frictionMu: 0.07,
      frictionStatus: '0.07 μ (Lubricated)',
      techSignatureHash: 'b4a1...772d',
    },
  },
  {
    id: 'req-03',
    ticketCode: 'CC-10499',
    title: 'Ergonomic Calibration',
    status: 'active',
    statusLabel: 'In Progress',
    priceFormatted: '₹599',
    settlementMethod: 'Estimated Bill',
    chairModel: 'Haworth Fern Chair',
    chairSpec: 'Forward Lumbar Alignment & Seat Depth Tuning',
    timestamp: 'Today • 05:00 PM',
    technicianName: 'Deepak Kumar (En Route)',
    etaMinutes: 14,
  },
  {
    id: 'req-04',
    ticketCode: 'CC-10388',
    title: 'Chair Cleaning & Sanitize',
    status: 'cancelled',
    statusLabel: 'Cancelled',
    priceFormatted: '₹0',
    settlementMethod: 'Escrow Auto-Refunded',
    auditNotes:
      'Customer rescheduled due to sudden client meeting. Re-booked via enterprise slot.',
    timestamp: '05 Oct • 09:15 AM',
  },
];

export const CustomerServiceHistoryChaircareMobileScreen: React.FC<
  CustomerServiceHistoryProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const passedCust = route?.params?.customer;

  // Selected customer details
  const custName = passedCust?.name || 'Ansh Kumar';
  const custInitials = passedCust?.initials || 'AK';
  const custCode = passedCust?.code || '#CUST-7741';
  const location =
    passedCust?.location || 'Sector 54, Gurugram • DLF Phase 5';

  const [activeFilter, setActiveFilter] = useState<HistoryFilterType>('all');
  const [selectedTelemetryTicket, setSelectedTelemetryTicket] =
    useState<HistoryTicketItem | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  const filteredTickets = useMemo(() => {
    if (activeFilter === 'all') return SAMPLE_SERVICE_HISTORY;
    return SAMPLE_SERVICE_HISTORY.filter((item) => item.status === activeFilter);
  }, [activeFilter]);

  const handleOpenTicketDetails = (item: HistoryTicketItem) => {
    if (navigation) {
      navigation.navigate('ServiceRequestDetails', {
        requestId: item.ticketCode,
        request: {
          id: item.ticketCode,
          trackingCode: item.ticketCode,
          customerId: passedCust?.id || 'cust-01',
          customerName: custName,
          chairModel: item.chairModel || item.title,
          status: item.status,
          totalAmount: parseInt(item.priceFormatted.replace(/[^\d]/g, ''), 10) || 0,
        },
      });
    }
  };

  const handleExportCsv = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      showToast('Audit Log CSV Exported');
    }, 1200);
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Bar */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation && navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="ArrowLeft" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Service History
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => showToast('Super Admin history filter')}
            activeOpacity={0.7}
            accessibilityLabel="More options"
          >
            <AppIcon name="MoreVertical" size={20} />
          </TouchableOpacity>
          <View style={styles.adminAvatarCircle}>
            <AppIcon name="User" size={18} />
          </View>
        </View>
      </View>

      {/* 2. Floating Toast Notification */}
      {toastMessage && (
        <View style={[styles.toastContainer, { top: Math.max(insets.top, 12) + 56 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><AppIcon name="Check" size={14} /><Text style={styles.toastText}>{toastMessage}</Text></View>
        </View>
      )}

      {/* 3. Main Scrollable Feed */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Summary Header Bar */}
        <View style={styles.customerHeaderCard}>
          <View style={styles.custHeaderTopRow}>
            <View style={styles.custHeaderLeft}>
              <View style={styles.custAvatarCircle}>
                <Text style={styles.custAvatarInitials}>{custInitials}</Text>
              </View>
              <View style={styles.custHeaderInfo}>
                <View style={styles.custNameTagRow}>
                  <Text style={styles.custNameText} numberOfLines={1}>
                    {custName}
                  </Text>
                  <View style={styles.codeBadge}>
                    <Text style={styles.codeBadgeText}>{custCode}</Text>
                  </View>
                </View>
                <View style={styles.locationRow}>
                  <AppIcon name="MapPin" size={18} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {location}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.enterpriseBadge}>
              <View style={styles.enterpriseDot} />
              <Text style={styles.enterpriseBadgeText}>Enterprise</Text>
            </View>
          </View>
        </View>

        {/* Summary Overview Strip (4 Columns) */}
        <View style={styles.overviewStrip}>
          <View style={styles.overviewCol}>
            <Text style={styles.overviewLabel}>TOTAL</Text>
            <Text style={styles.overviewValue}>24</Text>
            <Text style={styles.overviewSubtext}>Requests</Text>
          </View>

          <View style={[styles.overviewCol, styles.overviewColHighlight]}>
            <Text style={[styles.overviewLabel, { color: '#009668' }]}>DONE</Text>
            <Text style={[styles.overviewValue, { color: '#009668' }]}>21</Text>
            <Text style={[styles.overviewSubtext, { color: '#009668' }]}>Verified</Text>
          </View>

          <View style={styles.overviewCol}>
            <Text style={[styles.overviewLabel, { color: Colors.secondaryCobalt }]}>ACTIVE</Text>
            <Text style={[styles.overviewValue, { color: Colors.secondaryCobalt }]}>1</Text>
            <Text style={[styles.overviewSubtext, { color: Colors.secondaryCobalt }]}>En Route</Text>
          </View>

          <View style={styles.overviewCol}>
            <Text style={[styles.overviewLabel, { color: '#ba1a1a' }]}>VOID</Text>
            <Text style={[styles.overviewValue, { color: '#ba1a1a' }]}>2</Text>
            <Text style={[styles.overviewSubtext, { color: '#ba1a1a' }]}>Cancelled</Text>
          </View>
        </View>

        {/* Filter & Sort Bar */}
        <View style={styles.filterSortRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipGroup}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === 'all' ? styles.filterChipActive : styles.filterChipInactive,
              ]}
              onPress={() => setActiveFilter('all')}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'all' ? styles.filterTextActive : styles.filterTextInactive,
                ]}
              >
                All
              </Text>
              <View
                style={[
                  styles.countBadge,
                  activeFilter === 'all'
                    ? styles.countBadgeActive
                    : styles.countBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    activeFilter === 'all'
                      ? styles.countTextActive
                      : styles.countTextInactive,
                  ]}
                >
                  24
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === 'completed'
                  ? styles.filterChipActive
                  : styles.filterChipInactive,
              ]}
              onPress={() => setActiveFilter('completed')}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'completed'
                    ? styles.filterTextActive
                    : styles.filterTextInactive,
                ]}
              >
                Completed
              </Text>
              <View
                style={[
                  styles.countBadge,
                  activeFilter === 'completed'
                    ? styles.countBadgeActive
                    : styles.countBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    activeFilter === 'completed'
                      ? styles.countTextActive
                      : styles.countTextInactive,
                  ]}
                >
                  21
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === 'active'
                  ? styles.filterChipActive
                  : styles.filterChipInactive,
              ]}
              onPress={() => setActiveFilter('active')}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'active'
                    ? styles.filterTextActive
                    : styles.filterTextInactive,
                ]}
              >
                Active
              </Text>
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: '#dbe1ff' },
                ]}
              >
                <Text style={[styles.countBadgeText, { color: '#00174b' }]}>1</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === 'cancelled'
                  ? styles.filterChipActive
                  : styles.filterChipInactive,
              ]}
              onPress={() => setActiveFilter('cancelled')}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'cancelled'
                    ? styles.filterTextActive
                    : styles.filterTextInactive,
                ]}
              >
                Cancelled
              </Text>
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: '#ffdad6' },
                ]}
              >
                <Text style={[styles.countBadgeText, { color: '#ba1a1a' }]}>2</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.sortPill}>
            <Text style={styles.sortPillText}>Newest</Text>
            <Text style={styles.sortPillArrow}>▾</Text>
          </View>
        </View>

        {/* History Cards Feed */}
        <View style={styles.cardsFeedList}>
          {filteredTickets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AppIcon name="ClipboardList" size={18} />
              <Text style={styles.emptyTitle}>No service records found</Text>
              <Text style={styles.emptySubtitle}>
                No requests match the selected filter category.
              </Text>
            </View>
          ) : (
            filteredTickets.map((item) => {
              const isCompleted = item.status === 'completed';
              const isActive = item.status === 'active';
              const isCancelled = item.status === 'cancelled';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.historyCard,
                    isCompleted && styles.cardBorderCompleted,
                    isActive && styles.cardBorderActive,
                    isCancelled && styles.cardBorderCancelled,
                  ]}
                  onPress={() => {
                    if (item.telemetryData) {
                      setSelectedTelemetryTicket(item);
                    } else {
                      handleOpenTicketDetails(item);
                    }
                  }}
                  activeOpacity={0.9}
                >
                  {/* Card Header Row */}
                  <View style={styles.historyCardTopRow}>
                    <View style={styles.historyCardTitleCol}>
                      <View style={styles.titleWithBeaconRow}>
                        {isActive && <View style={styles.activeBeaconDot} />}
                        <Text style={styles.ticketServiceTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                      </View>
                      <Text style={styles.ticketCodeMono}>
                        Ticket #{item.ticketCode}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.ticketStatusBadge,
                        isCompleted
                          ? styles.statusBadgeCompleted
                          : isActive
                          ? styles.statusBadgeActive
                          : styles.statusBadgeCancelled,
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {isCompleted && (
                          <AppIcon name="Check" size={12} color="#009668" />
                        )}
                        <Text
                          style={[
                            styles.ticketStatusBadgeText,
                            isCompleted
                              ? styles.statusTextCompleted
                              : isActive
                              ? styles.statusTextActive
                              : styles.statusTextCancelled,
                          ]}
                        >
                          {isCompleted ? 'Completed' : item.statusLabel}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Asset Banner / Live Dispatch Banner / Audit Notes */}
                  {isCompleted && item.chairModel && (
                    <View style={styles.assetBannerBox}>
                      <View style={styles.assetThumbnailWrapper}>
                        {item.imageUrl ? (
                          <Image source={{ uri: item.imageUrl }} style={styles.assetImage} />
                        ) : (
                          <AppIcon name="Armchair" size={18} />
                        )}
                      </View>
                      <View style={styles.assetInfoCol}>
                        {item.specTag && (
                          <Text style={styles.specTagText}>{item.specTag}</Text>
                        )}
                        <Text style={styles.assetModelTitle} numberOfLines={1}>
                          {item.chairModel}
                        </Text>
                        <Text style={styles.assetSpecSubtitle} numberOfLines={1}>
                          {item.chairSpec}
                        </Text>
                      </View>
                    </View>
                  )}

                  {isActive && (
                    <View style={styles.liveDispatchCard}>
                      <View style={styles.liveDispatchHeader}>
                        <View style={styles.liveDispatchTitleRow}>
                          <AppIcon name="Compass" size={16} color={Colors.secondary} />
                          <Text style={styles.liveDispatchLabel}>DISPATCH TRACKER</Text>
                        </View>
                        <View style={styles.etaPill}>
                          <Text style={styles.etaText}>ETA {item.etaMinutes || 14} min</Text>
                        </View>
                      </View>

                      <View style={styles.techEnRouteRow}>
                        <View style={styles.techAvatarInitial}>
                          <Text style={styles.techInitialText}>DK</Text>
                        </View>
                        <View style={styles.techEnRouteMeta}>
                          <Text style={styles.techEnRouteName}>
                            {item.technicianName}
                          </Text>
                          <Text style={styles.techEnRouteChair}>
                            Assigned to: {item.chairModel}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {isCancelled && item.auditNotes && (
                    <View style={styles.auditNotesBox}>
                      <Text style={styles.auditNotesLabel}>LOGGED AUDIT NOTES</Text>
                      <Text style={styles.auditNotesText}>"{item.auditNotes}"</Text>
                    </View>
                  )}

                  {/* Telemetry Key-Value Meta Block */}
                  <View style={styles.telemetryGrid}>
                    <View style={styles.telemetryCol}>
                      <Text style={styles.telemetryKey}>
                        {isCompleted
                          ? 'EXECUTION TIME'
                          : isActive
                          ? 'WINDOW SLOT'
                          : 'TIMELOG'}
                      </Text>
                      <Text style={styles.telemetryVal} numberOfLines={1}>
                        {item.timestamp}
                      </Text>
                    </View>

                    <View style={styles.telemetryCol}>
                      <Text style={styles.telemetryKey}>
                        {isCompleted
                          ? 'LEAD TECHNICIAN'
                          : isActive
                          ? 'ESTIMATED BILL'
                          : 'CANCELLATION PENALTY'}
                      </Text>
                      <Text
                        style={[
                          styles.telemetryVal,
                          isCancelled && { color: '#009668', fontWeight: '700' },
                        ]}
                        numberOfLines={1}
                      >
                        {isCompleted
                          ? `${item.technicianName} • ${item.technicianRating} ★`
                          : isActive
                          ? item.priceFormatted
                          : '₹0 (Waived Grace)'}
                      </Text>
                    </View>
                  </View>

                  {/* Financial & Action Footer */}
                  <View style={styles.cardFooterStrip}>
                    <View style={styles.footerLeftFinancial}>
                      <Text style={styles.priceNumber}>{item.priceFormatted}</Text>
                      <View style={styles.settlementTag}>
                        <Text style={styles.settlementTagText}>
                          {item.settlementMethod}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.footerRightAction}>
                      <Text style={styles.telemetryActionText}>
                        {isCompleted ? 'Telemetry' : isActive ? 'Inspect' : 'REF-88129'}
                      </Text>
                      <Text style={styles.telemetryArrow}>→</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Export Audit Action */}
        <View style={styles.exportSection}>
          <TouchableOpacity
            style={styles.exportCsvBtn}
            onPress={handleExportCsv}
            disabled={isExporting}
            activeOpacity={0.8}
          >
            <AppIcon name="BarChart3" size={18} />
            <Text style={styles.exportBtnText}>
              {isExporting
                ? 'Generating Telemetry Archive...'
                : 'Download Complete CSV Audit Log'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.exportFooterNote}>
            Export includes cryptographic timestamps & signed mechanic worksheets
          </Text>
        </View>
      </ScrollView>

      {/* 4. Interactive Telemetry Diagnostic Modal / Sheet */}
      <Modal
        visible={!!selectedTelemetryTicket}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedTelemetryTicket(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHandleBar} />

            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalEyebrow}>TELEMETRY DIAGNOSTIC</Text>
                <Text style={styles.modalTitle}>
                  Ticket #{selectedTelemetryTicket?.ticketCode}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedTelemetryTicket(null)}
              >
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            </View>

            {/* Diagnostic Metrics Card */}
            <View style={styles.diagnosticCard}>
              <View style={styles.metricGaugeRow}>
                <View style={styles.gaugeHeader}>
                  <Text style={styles.gaugeTitle}>Tilt-Lock Tension Torque</Text>
                  <Text style={styles.gaugeValue}>
                    {selectedTelemetryTicket?.telemetryData?.torqueStatus ||
                      '42.4 Nm (Optimal)'}
                  </Text>
                </View>
                <View style={styles.gaugeTrack}>
                  <View style={[styles.gaugeFill, { width: '84%', backgroundColor: '#009668' }]} />
                </View>
              </View>

              <View style={styles.metricGaugeRow}>
                <View style={styles.gaugeHeader}>
                  <Text style={styles.gaugeTitle}>Class-4 Nitrogen Pressure</Text>
                  <Text style={[styles.gaugeValue, { color: Colors.secondaryCobalt }]}>
                    {selectedTelemetryTicket?.telemetryData?.pressureStatus ||
                      '310 PSI (Calibrated)'}
                  </Text>
                </View>
                <View style={styles.gaugeTrack}>
                  <View
                    style={[
                      styles.gaugeFill,
                      { width: '92%', backgroundColor: Colors.secondaryCobalt },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.metricGaugeRow}>
                <View style={styles.gaugeHeader}>
                  <Text style={styles.gaugeTitle}>65mm Caster Roll Friction</Text>
                  <Text style={styles.gaugeValue}>
                    {selectedTelemetryTicket?.telemetryData?.frictionStatus ||
                      '0.08 μ (Lubricated)'}
                  </Text>
                </View>
                <View style={styles.gaugeTrack}>
                  <View style={[styles.gaugeFill, { width: '95%', backgroundColor: '#009668' }]} />
                </View>
              </View>
            </View>

            {/* Tech Signature Row */}
            <View style={styles.signatureRow}>
              <View style={styles.signatureLeft}>
                <AppIcon name="ShieldCheck" size={18} />
                <View>
                  <Text style={styles.signatureTitle}>Technician Signature</Text>
                  <Text style={styles.signatureMeta}>
                    Hash: {selectedTelemetryTicket?.telemetryData?.techSignatureHash || 'e7f8...901a'} • Verified Onsite
                  </Text>
                </View>
              </View>
              <AppIcon name="CheckCircle" size={18} />
            </View>

            {/* Dismiss CTA */}
            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={() => setSelectedTelemetryTicket(null)}
              activeOpacity={0.88}
            >
              <Text style={styles.dismissBtnText}>Dismiss Telemetry</Text>
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
    backgroundColor: '#f7f9fb',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    zIndex: 50,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: '#191c1e',
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '800',
    color: '#191c1e',
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMoreIcon: {
    fontSize: 20,
    color: '#45464d',
    fontWeight: '700',
  },
  adminAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#191c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatarIcon: {
    fontSize: 14,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#191c1e',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 999,
    ...Shadows.level2,
  },
  toastText: {
    ...Typography.bodySm,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  customerHeaderCard: {
    backgroundColor: '#eceef0',
    borderRadius: 14,
    padding: 14,
    ...Shadows.level1,
  },
  custHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  custHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  custAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#131b2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  custAvatarInitials: {
    color: '#dae2fd',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  custHeaderInfo: {
    flex: 1,
    minWidth: 0,
  },
  custNameTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  custNameText: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  codeBadge: {
    backgroundColor: '#e0e3e5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#45464d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationIcon: {
    fontSize: 12,
  },
  locationText: {
    fontSize: 11,
    color: '#45464d',
    flexShrink: 1,
  },
  enterpriseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  enterpriseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#002113',
  },
  enterpriseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#002113',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  overviewStrip: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    ...Shadows.level1,
  },
  overviewCol: {
    alignItems: 'center',
    paddingVertical: 4,
    flex: 1,
  },
  overviewColHighlight: {
    backgroundColor: 'rgba(242, 244, 246, 0.7)',
    borderRadius: 8,
  },
  overviewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#76777d',
    letterSpacing: 0.4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  overviewValue: {
    ...Typography.headlineSm,
    fontSize: 20,
    fontWeight: '800',
    color: '#191c1e',
    marginTop: 2,
  },
  overviewSubtext: {
    fontSize: 10,
    color: '#76777d',
    marginTop: 1,
  },
  filterSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterChipGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: '#191c1e',
  },
  filterChipInactive: {
    backgroundColor: '#e6e8ea',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  filterTextInactive: {
    color: '#45464d',
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countBadgeInactive: {
    backgroundColor: '#e0e3e5',
  },
  countBadgeText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  countTextActive: {
    color: '#ffffff',
  },
  countTextInactive: {
    color: '#45464d',
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eceef0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#45464d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sortPillArrow: {
    fontSize: 11,
    color: '#45464d',
  },
  cardsFeedList: {
    gap: 12,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    ...Shadows.level1,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  emptySubtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#76777d',
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    ...Shadows.level1,
    gap: 10,
    borderLeftWidth: 5,
  },
  cardBorderCompleted: {
    borderLeftColor: '#009668',
  },
  cardBorderActive: {
    borderLeftColor: Colors.secondaryCobalt,
  },
  cardBorderCancelled: {
    borderLeftColor: '#ba1a1a',
  },
  historyCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  historyCardTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  titleWithBeaconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeBeaconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondaryCobalt,
  },
  ticketServiceTitle: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '800',
    color: '#191c1e',
    flexShrink: 1,
  },
  ticketCodeMono: {
    fontSize: 11,
    color: '#76777d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  ticketStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(78, 222, 163, 0.25)',
  },
  statusBadgeActive: {
    backgroundColor: '#dbe1ff',
  },
  statusBadgeCancelled: {
    backgroundColor: '#ffdad6',
  },
  ticketStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextCompleted: {
    color: '#005236',
  },
  statusTextActive: {
    color: '#00174b',
  },
  statusTextCancelled: {
    color: '#93000a',
  },
  assetBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 8,
  },
  assetThumbnailWrapper: {
    width: 52,
    height: 52,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e0e3e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetImage: {
    width: '100%',
    height: '100%',
  },
  chairPlaceholderIcon: {
    fontSize: 24,
  },
  assetInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  specTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  assetModelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191c1e',
    marginTop: 1,
  },
  assetSpecSubtitle: {
    fontSize: 11,
    color: '#45464d',
    marginTop: 1,
  },
  liveDispatchCard: {
    backgroundColor: 'rgba(0, 81, 213, 0.05)',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  liveDispatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveDispatchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  navIcon: {
    fontSize: 13,
  },
  liveDispatchLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  etaPill: {
    backgroundColor: Colors.secondaryCobalt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  etaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  techEnRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  techAvatarInitial: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbe1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  techInitialText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00174b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  techEnRouteMeta: {
    flex: 1,
  },
  techEnRouteName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#191c1e',
  },
  techEnRouteChair: {
    fontSize: 11,
    color: '#45464d',
  },
  auditNotesBox: {
    backgroundColor: 'rgba(230, 232, 234, 0.6)',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  auditNotesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#76777d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  auditNotesText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#45464d',
    lineHeight: 16,
  },
  telemetryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    gap: 8,
  },
  telemetryCol: {
    flex: 1,
  },
  telemetryKey: {
    fontSize: 10,
    fontWeight: '700',
    color: '#76777d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  telemetryVal: {
    fontSize: 12,
    color: '#191c1e',
    fontWeight: '600',
    marginTop: 2,
  },
  cardFooterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(236, 238, 240, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  footerLeftFinancial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#191c1e',
  },
  settlementTag: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  settlementTagText: {
    fontSize: 10,
    color: '#45464d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  footerRightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  telemetryActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  telemetryArrow: {
    fontSize: 13,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  exportSection: {
    gap: 6,
    marginTop: 6,
  },
  exportCsvBtn: {
    backgroundColor: '#e6e8ea',
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportIcon: {
    fontSize: 16,
  },
  exportBtnText: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: '#191c1e',
  },
  exportFooterNote: {
    fontSize: 10,
    color: '#76777d',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(25, 28, 30, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
    ...Shadows.level2,
    maxHeight: '85%',
  },
  modalHandleBar: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#e0e3e5',
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  modalTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '800',
    color: '#191c1e',
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
    fontSize: 13,
    fontWeight: '700',
    color: '#45464d',
  },
  diagnosticCard: {
    backgroundColor: '#f2f4f6',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  metricGaugeRow: {
    gap: 4,
  },
  gaugeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gaugeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191c1e',
  },
  gaugeValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#009668',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  gaugeTrack: {
    height: 7,
    backgroundColor: '#e0e3e5',
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eceef0',
    padding: 10,
    borderRadius: 10,
  },
  signatureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signatureShield: {
    fontSize: 18,
  },
  signatureTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191c1e',
  },
  signatureMeta: {
    fontSize: 10,
    color: '#45464d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  signatureCheck: {
    fontSize: 14,
  },
  dismissBtn: {
    backgroundColor: '#191c1e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
