import { AppIcon } from '../../components/common/AppIcon';
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
import { Colors, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface AuditExportProps {
  navigation?: any;
  route?: {
    params?: {
      filterScope?: any;
    };
  };
}

type DateRangeOption = 'Today' | 'Last 7 Days' | 'Last 30 Days' | 'Custom Range';
type ScopeOption = 'all' | 'security' | 'financial' | 'operations' | 'people';
type FormatOption = 'csv' | 'pdf';

interface ScopeItem {
  id: ScopeOption;
  title: string;
  badge?: string;
  description: string;
  size: string;
  records: string;
}

const SCOPE_ITEMS: ScopeItem[] = [
  {
    id: 'all',
    title: 'All Activity',
    badge: 'COMPREHENSIVE',
    description: 'Full platform operational & financial event stream with cryptographic anchor.',
    size: '4.8 MB',
    records: '6,842',
  },
  {
    id: 'security',
    title: 'Security Activity',
    description: 'Hardware role permissions, auth anomalies, diagnostic tool sign-offs.',
    size: '1.2 MB',
    records: '1,120',
  },
  {
    id: 'financial',
    title: 'Financial Activity',
    description: 'Escrow locks, part disbursements, SLA warranty claims & clawbacks.',
    size: '1.9 MB',
    records: '2,480',
  },
  {
    id: 'operations',
    title: 'Operations',
    description: 'Cylinder retrofits, routing updates, mechanic dispatch milestones.',
    size: '2.4 MB',
    records: '2,640',
  },
  {
    id: 'people',
    title: 'People Management',
    description: 'Technician ergonomics certifications, suspensions, badge issuances.',
    size: '0.6 MB',
    records: '602',
  },
];

export const AuditExportChaircareMobileScreen: React.FC<
  AuditExportProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const scrollViewRef = useRef<ScrollView | null>(null);

  // Filter & Form States
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>('Last 30 Days');
  const [selectedScope, setSelectedScope] = useState<ScopeOption>('all');
  const [selectedFormat, setSelectedFormat] = useState<FormatOption>('csv');

  // Compilation & Download Button States
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isCompiled, setIsCompiled] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Toast Notification State
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

  // Date Range Info
  const dateRangeInfo = useMemo(() => {
    switch (selectedRange) {
      case 'Today':
        return {
          span: '05 Oct 2026 (Single day)',
          dateText: '05 Oct 2026',
          records: '312 logged records',
        };
      case 'Last 7 Days':
        return {
          span: '29 Sep 2026 – 5 Oct 2026 (7 calendar days)',
          dateText: '29 Sep 2026 – 5 Oct 2026',
          records: '1,540 logged records',
        };
      case 'Custom Range':
        return {
          span: 'Custom Window Selected',
          dateText: 'Custom Window',
          records: '2,100 logged records',
        };
      case 'Last 30 Days':
      default:
        return {
          span: '6 Sep 2026 – 5 Oct 2026 (30 calendar days)',
          dateText: '6 Sep 2026 – 5 Oct 2026',
          records: '6,842 logged records',
        };
    }
  }, [selectedRange]);

  // Current Scope Info
  const currentScopeItem = useMemo(() => {
    return SCOPE_ITEMS.find((item) => item.id === selectedScope) || SCOPE_ITEMS[0];
  }, [selectedScope]);

  // Handle Trigger Compilation
  const handleTriggerCompilation = () => {
    if (isCompiling) return;
    setIsCompiling(true);

    setTimeout(() => {
      setIsCompiling(false);
      setIsCompiled(true);
      displayToast('Export archive compiled and cryptographically signed');

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);

      setTimeout(() => {
        setIsCompiled(false);
      }, 3500);
    }, 1100);
  };

  // Handle Download File
  const handleDownloadFile = () => {
    if (isDownloading) return;
    setIsDownloading(true);

    setTimeout(() => {
      setIsDownloading(false);
      setDownloadSuccess(true);
      displayToast(`Saved chaircare_activity_logs_oct_2026.${selectedFormat}`);

      setTimeout(() => {
        setDownloadSuccess(false);
      }, 3000);
    }, 1200);
  };

  // Handle Copy Hash
  const handleCopyHash = () => {
    setCopiedHash(true);
    displayToast('SHA256 checksum copied to clipboard');
    setTimeout(() => {
      setCopiedHash(false);
    }, 2000);
  };

  const handleShare = () => {
    displayToast('Export manifest link prepared for secure sharing');
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
            Audit Export
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            onPress={handleShare}
            accessibilityLabel="Share export manifest"
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
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
          { paddingBottom: Math.max(insets.bottom, 20) + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Compliance Archive Context Banner */}
        <View style={styles.contextBanner}>
          <View style={styles.contextBannerLeft}>
            <View style={styles.complianceBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.complianceBadgeText}>
                COMPLIANCE ARCHIVE v4.2
              </Text>
            </View>
            <Text style={styles.contextBannerDesc}>
              Generate immutable compliance records and high-fidelity operational review archives for certified ergonomic assets.
            </Text>
          </View>

          <View style={styles.databaseIconBox}>
            <AppIcon name="database" size={20} />
          </View>
        </View>

        {/* SECTION 1: Temporal Horizon (Date Range Selector) */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTitleGroup}>
              <AppIcon name="date_range" size={20} />
              <Text style={styles.cardTitle}>1. Temporal Horizon</Text>
            </View>
            <Text style={styles.cardHeaderMetaText}>UTC+05:30</Text>
          </View>

          {/* Segmented Range Grid Buttons */}
          <View style={styles.rangeButtonsGrid}>
            {(['Today', 'Last 7 Days', 'Last 30 Days', 'Custom Range'] as DateRangeOption[]).map(
              (range) => {
                const isActive = selectedRange === range;
                return (
                  <TouchableOpacity
                    key={range}
                    style={[
                      styles.rangeButton,
                      isActive && styles.rangeButtonActive,
                    ]}
                    onPress={() => setSelectedRange(range)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.rangeButtonText,
                        isActive && styles.rangeButtonTextActive,
                      ]}
                    >
                      {range}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>

          {/* Date Range Metric Indicator */}
          <View style={styles.dateMetricIndicator}>
            <View style={styles.dateMetricLeft}>
              <AppIcon name="event_available" size={20} />
              <Text style={styles.dateMetricText} numberOfLines={1}>
                {dateRangeInfo.span}
              </Text>
            </View>
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>ACTIVE</Text>
            </View>
          </View>
        </View>

        {/* SECTION 2: Event Scope Telemetry */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTitleGroup}>
              <AppIcon name="tune" size={20} />
              <Text style={styles.cardTitle}>2. Event Scope Telemetry</Text>
            </View>
            <Text style={styles.cardHeaderMetaText}>5 FEEDS</Text>
          </View>

          {/* Scope Cards Stack */}
          <View style={styles.scopeCardsStack}>
            {SCOPE_ITEMS.map((item) => {
              const isSelected = selectedScope === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.scopeCard,
                    isSelected && styles.scopeCardSelected,
                  ]}
                  onPress={() => setSelectedScope(item.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.scopeCardLeftStripe,
                      isSelected && styles.scopeCardLeftStripeActive,
                    ]}
                  />

                  <View style={styles.scopeCardContent}>
                    <View style={styles.scopeCardHeader}>
                      <View style={styles.scopeTitleGroup}>
                        <Text style={styles.scopeCardTitle}>{item.title}</Text>
                        {item.badge && (
                          <View style={styles.scopeCardBadge}>
                            <Text style={styles.scopeCardBadgeText}>
                              {item.badge}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Custom Radio Button */}
                      <View
                        style={[
                          styles.scopeRadioCircle,
                          isSelected && styles.scopeRadioCircleSelected,
                        ]}
                      >
                        <View
                          style={[
                            styles.scopeRadioDot,
                            isSelected && styles.scopeRadioDotSelected,
                          ]}
                        />
                      </View>
                    </View>

                    <Text style={styles.scopeCardDesc}>
                      {item.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 3: Serialization Standard (File Format Selection) */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTitleGroup}>
              <AppIcon name="inventory_2" size={20} />
              <Text style={styles.cardTitle}>3. Serialization Standard</Text>
            </View>
          </View>

          {/* Format Cards Grid */}
          <View style={styles.formatCardsGrid}>
            {/* PDF Option */}
            <TouchableOpacity
              style={[
                styles.formatCard,
                selectedFormat === 'pdf' && styles.formatCardSelected,
              ]}
              onPress={() => setSelectedFormat('pdf')}
              activeOpacity={0.7}
            >
              <View style={styles.formatCardTop}>
                <View
                  style={[
                    styles.formatIconBox,
                    selectedFormat === 'pdf' && styles.formatIconBoxSelected,
                  ]}
                >
                  <AppIcon name="picture_as_pdf" size={20} />
                </View>
                <Text
                  style={[
                    styles.formatIndicatorText,
                    selectedFormat === 'pdf' && styles.formatIndicatorTextSelected,
                  ]}
                >
                  {selectedFormat === 'pdf' ? 'SELECTED' : 'OPTIONAL'}
                </Text>
              </View>

              <View>
                <Text
                  style={[
                    styles.formatTitle,
                    selectedFormat === 'pdf' && styles.formatTitleSelected,
                  ]}
                >
                  PDF Archive
                </Text>
                <Text
                  style={[
                    styles.formatDesc,
                    selectedFormat === 'pdf' && styles.formatDescSelected,
                  ]}
                >
                  Executive audit sheet with vector telemetry charts & SHA256 seals.
                </Text>
              </View>
            </TouchableOpacity>

            {/* CSV Option */}
            <TouchableOpacity
              style={[
                styles.formatCard,
                selectedFormat === 'csv' && styles.formatCardSelected,
              ]}
              onPress={() => setSelectedFormat('csv')}
              activeOpacity={0.7}
            >
              <View style={styles.formatCardTop}>
                <View
                  style={[
                    styles.formatIconBox,
                    selectedFormat === 'csv' && styles.formatIconBoxSelected,
                  ]}
                >
                  <AppIcon name="table_chart" size={20} />
                </View>
                <Text
                  style={[
                    styles.formatIndicatorText,
                    selectedFormat === 'csv' && styles.formatIndicatorTextSelected,
                  ]}
                >
                  {selectedFormat === 'csv' ? 'SELECTED' : 'OPTIONAL'}
                </Text>
              </View>

              <View>
                <Text
                  style={[
                    styles.formatTitle,
                    selectedFormat === 'csv' && styles.formatTitleSelected,
                  ]}
                >
                  CSV Spreadsheet
                </Text>
                <Text
                  style={[
                    styles.formatDesc,
                    selectedFormat === 'csv' && styles.formatDescSelected,
                  ]}
                >
                  Raw structured tabular schema compliant with RFC 4180 audit ingest.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 4: Export Summary Preview Card (Manifest Blueprint) */}
        <View style={styles.manifestBlueprintContainer}>
          {/* Dark Navy Header */}
          <View style={styles.manifestHeader}>
            <View style={styles.manifestHeaderLeft}>
              <AppIcon name="fact_check" size={20} />
              <Text style={styles.manifestHeaderTitle}>Manifest Blueprint</Text>
            </View>
            <View style={styles.manifestStatusBadge}>
              <Text style={styles.manifestStatusBadgeText}>STATUS: STAGED</Text>
            </View>
          </View>

          {/* Specification Rows Matrix */}
          <View style={styles.manifestBody}>
            <View style={styles.manifestRow}>
              <View style={styles.manifestRowLabelGroup}>
                <AppIcon name="calendar_month" size={20} />
                <Text style={styles.manifestRowLabel}>Date Range</Text>
              </View>
              <Text style={styles.manifestRowValue}>{dateRangeInfo.dateText}</Text>
            </View>

            <View style={styles.manifestDivider} />

            <View style={styles.manifestRow}>
              <View style={styles.manifestRowLabelGroup}>
                <AppIcon name="layers" size={20} />
                <Text style={styles.manifestRowLabel}>Total Activities</Text>
              </View>
              <Text style={styles.manifestRowValue}>{dateRangeInfo.records}</Text>
            </View>

            <View style={styles.manifestDivider} />

            <View style={styles.manifestRow}>
              <View style={styles.manifestRowLabelGroup}>
                <AppIcon name="filter_alt" size={20} />
                <Text style={styles.manifestRowLabel}>Selected Scope</Text>
              </View>
              <Text style={styles.manifestRowValue} numberOfLines={1}>
                {currentScopeItem.title}
              </Text>
            </View>

            <View style={styles.manifestDivider} />

            <View style={styles.manifestRow}>
              <View style={styles.manifestRowLabelGroup}>
                <AppIcon name="description" size={20} />
                <Text style={styles.manifestRowLabel}>Output Format</Text>
              </View>
              <Text style={styles.manifestRowValueSecondary}>
                {selectedFormat === 'csv' ? 'CSV (.csv)' : 'PDF (.pdf)'}
              </Text>
            </View>

            <View style={styles.manifestDivider} />

            <View style={styles.manifestRow}>
              <View style={styles.manifestRowLabelGroup}>
                <AppIcon name="hard_drive" size={20} />
                <Text style={styles.manifestRowLabel}>Estimated File Size</Text>
              </View>
              <Text style={styles.manifestRowValue}>{currentScopeItem.size}</Text>
            </View>
          </View>
        </View>

        {/* SECTION 5: Security Compliance Note Card */}
        <View style={styles.securityNoticeCard}>
          <View style={styles.securityNoticeIconBox}>
            <AppIcon name="lock" size={20} />
          </View>
          <View style={styles.securityNoticeContent}>
            <Text style={styles.securityNoticeTitle}>SECURITY NOTICE</Text>
            <Text style={styles.securityNoticeBody}>
              Exported activity logs contain sensitive administrative actions, user IDs, and financial identifiers. Store exported records in an encrypted, compliant enterprise vault.
            </Text>
          </View>
        </View>

        {/* SECTION 6: Primary Action (Generate Export Archive) */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            isCompiled && styles.generateButtonComplete,
          ]}
          onPress={handleTriggerCompilation}
          activeOpacity={0.88}
        >
          {isCompiling ? (
            <AppIcon name="sync" size={20} />
          ) : isCompiled ? (
            <AppIcon name="check" size={20} />
          ) : (
            <AppIcon name="bolt" size={20} />
          )}
          <Text
            style={[
              styles.generateButtonText,
              isCompiled && styles.generateButtonTextComplete,
            ]}
          >
            {isCompiling
              ? 'Sealing & Compiling Logs...'
              : isCompiled
              ? 'Compilation Complete!'
              : 'Generate Export Archive →'}
          </Text>
        </TouchableOpacity>

        {/* Cryptographic Dispatch Divider */}
        <View style={styles.cryptoDividerRow}>
          <View style={styles.cryptoDividerLine} />
          <Text style={styles.cryptoDividerText}>
            CRYPTO-SIGN DISPATCH MANIFEST
          </Text>
        </View>

        {/* SECTION 7: INLINE SUCCESS STATE PREVIEW */}
        <View style={styles.successCard}>
          {/* Header with Emerald Badge */}
          <View style={styles.successCardHeader}>
            <View style={styles.successBadgeBox}>
              <AppIcon name="check_circle" size={20} />
              <View style={styles.verifiedSubBadge}>
                <AppIcon name="verified_user" size={20} />
              </View>
            </View>

            <View style={styles.successTitleCol}>
              <View style={styles.successPillRow}>
                <View style={styles.readyPill}>
                  <Text style={styles.readyPillText}>READY TO DOWNLOAD</Text>
                </View>
                <Text style={styles.shaSignedText}>SHA256 SIGNED</Text>
              </View>

              <Text style={styles.successTitleText}>
                Export Ready for Download
              </Text>
              <Text style={styles.successDescText}>
                Your activity log export has been compiled, cryptographically signed, and prepared for secure retrieval.
              </Text>
            </View>
          </View>

          {/* Visual Artifact Asset Preview */}
          <View style={styles.artifactPreviewBox}>
            <View style={styles.artifactImageFrame}>
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAH9mRsrsCxWnyzppWIRBmT22vMcrUTyX4UKXF_0qH0wF4jFS6M321cwiieOAyhnREOAy0UVWhoqEfxLnB_FIB0RpBBHD1iYYMzNOBoP6dCYW2L2uPn6A3Vn-rZw6azLOAkHW7WWvea31N3mAAE-u4vN8n07NlSUwsVKmni3NVghJfFIS4gVV4Ef2c1D5OhqETi1JLnHZkj0OEDqhwKr3uhMiPj97W2vrX9U5Iu56AzqjxYvlfXCKU',
                }}
                style={styles.artifactImg}
              />
              <View style={styles.artifactOverlay}>
                <AppIcon name="dataset" size={20} />
              </View>
            </View>

            <View style={styles.artifactTextCol}>
              <View style={styles.artifactTagRow}>
                <AppIcon name="encrypted" size={20} />
                <Text style={styles.artifactSealedTag}>
                  SEALED ARTIFACT #E794
                </Text>
              </View>
              <Text style={styles.artifactSubtext} numberOfLines={2}>
                Enclave verified. Cryptographic hash recorded on ChairCare compliance immutable ledger.
              </Text>
            </View>
          </View>

          {/* File Manifest Box */}
          <View style={styles.fileManifestBox}>
            {/* File Name */}
            <View style={styles.manifestItemRow}>
              <View style={styles.manifestItemLabelGroup}>
                <AppIcon name="feed" size={20} />
                <Text style={styles.manifestItemLabel}>File Name:</Text>
              </View>
              <Text style={styles.manifestItemFileName} numberOfLines={1}>
                chaircare_activity_logs_oct_2026.{selectedFormat}
              </Text>
            </View>

            {/* Records Included */}
            <View style={styles.manifestItemRow}>
              <View style={styles.manifestItemLabelGroup}>
                <AppIcon name="done_all" size={20} />
                <Text style={styles.manifestItemLabel}>Records Included:</Text>
              </View>
              <Text style={styles.manifestItemValue}>
                {dateRangeInfo.records.replace('logged records', 'verified ledger events')}
              </Text>
            </View>

            {/* Generated Timestamp */}
            <View style={styles.manifestItemRow}>
              <View style={styles.manifestItemLabelGroup}>
                <AppIcon name="schedule" size={20} />
                <Text style={styles.manifestItemLabel}>Generated:</Text>
              </View>
              <Text style={styles.manifestItemValue}>
                05 Oct 2026 • 11:20 AM IST
              </Text>
            </View>

            {/* Expiration */}
            <View style={styles.manifestItemRow}>
              <View style={styles.manifestItemLabelGroup}>
                <AppIcon name="auto_delete" size={20} />
                <Text style={styles.manifestItemLabel}>Expiration:</Text>
              </View>
              <View style={styles.expirationPill}>
                <Text style={styles.expirationPillText}>
                  12 Oct 2026 (7-day automated purge policy)
                </Text>
              </View>
            </View>

            {/* SHA256 Checksum */}
            <View style={styles.manifestItemRow}>
              <View style={styles.manifestItemLabelGroup}>
                <AppIcon name="tag" size={20} />
                <Text style={styles.manifestItemLabel}>SHA256:</Text>
              </View>
              <TouchableOpacity
                style={styles.copyHashBtn}
                onPress={handleCopyHash}
                activeOpacity={0.7}
              >
                <Text style={styles.copyHashText}>
                  {copiedHash ? 'Copied to Clipboard!' : 'c93f8e028bfa...710b'}
                </Text>
                <AppIcon name={copiedHash ? 'done' : 'content_copy'} size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Inline Success Action Buttons */}
          <View style={styles.successActionsCol}>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleDownloadFile}
              activeOpacity={0.88}
            >
              <AppIcon name={downloadSuccess ? 'task_alt' : isDownloading ? 'downloading' : 'download'} size={20} />
              <Text style={styles.downloadButtonText}>
                {downloadSuccess
                  ? `File Saved (chaircare_logs.${selectedFormat})`
                  : isDownloading
                  ? 'Transferring Enclave Key...'
                  : `Download Export (${currentScopeItem.size}) ⬇`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneReturnButton}
              onPress={() => {
                if (navigation?.canGoBack()) {
                  navigation.goBack();
                }
              }}
              activeOpacity={0.7}
            >
              <AppIcon name="keyboard_return" size={20} />
              <Text style={styles.doneReturnText}>Done (Back to Activity Logs)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Telemetry Footnote */}
        <View style={styles.telemetryFootnote}>
          <Text style={styles.telemetryFootnoteShield}>shield</Text>
          <Text style={styles.telemetryFootnoteText}>
            SOC2 TYPE II AUDIT PROTOCOL VERIFIED • NODE DC-HYD-04
          </Text>
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
    paddingTop: 14,
    gap: 16,
  },
  scrollContentDesktop: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },

  // Context Banner
  contextBanner: {
    backgroundColor: '#F2F4F6',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    ...Shadows.level1,
  },
  contextBannerLeft: {
    flex: 1,
    gap: 6,
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 81, 213, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0051D5',
  },
  complianceBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    color: '#0051D5',
    letterSpacing: 0.5,
  },
  contextBannerDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12.5,
    color: '#45464D',
    lineHeight: 18,
  },
  databaseIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECEEF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  databaseIcon: {
    fontFamily: 'Material Icons',
    fontSize: 22,
    color: '#0051D5',
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
  sectionIcon: {
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
  cardHeaderMetaText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464D',
  },

  // Range Buttons Grid
  rangeButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rangeButton: {
    width: '48.5%',
    backgroundColor: '#ECEEF0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeButtonActive: {
    backgroundColor: '#0F172A',
    ...Shadows.level1,
  },
  rangeButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12.5,
    color: '#191C1E',
  },
  rangeButtonTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  dateMetricIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 12,
  },
  dateMetricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  dateMetricIcon: {
    fontFamily: 'Material Icons',
    fontSize: 17,
    color: '#0051D5',
  },
  dateMetricText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11.5,
    color: '#191C1E',
    flex: 1,
  },
  activeTag: {
    backgroundColor: '#002113',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeTagText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9.5,
    color: '#6FFBBE',
    letterSpacing: 0.5,
  },

  // Scope Cards
  scopeCardsStack: {
    gap: 8,
  },
  scopeCard: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    overflow: 'hidden',
  },
  scopeCardSelected: {
    backgroundColor: '#F2F4F6',
    borderColor: '#BEC6E0',
    ...Shadows.level1,
  },
  scopeCardLeftStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: 'transparent',
  },
  scopeCardLeftStripeActive: {
    backgroundColor: '#0051D5',
  },
  scopeCardContent: {
    paddingLeft: 6,
    gap: 4,
  },
  scopeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scopeTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  scopeCardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#191C1E',
  },
  scopeCardBadge: {
    backgroundColor: '#DBE1FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  scopeCardBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9,
    color: '#00174B',
  },
  scopeRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E0E3E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeRadioCircleSelected: {
    backgroundColor: '#0051D5',
  },
  scopeRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  scopeRadioDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  scopeCardDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    color: '#45464D',
    lineHeight: 16,
  },

  // Format Cards
  formatCardsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  formatCard: {
    flex: 1,
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  formatCardSelected: {
    backgroundColor: '#316BF3',
    ...Shadows.level1,
  },
  formatCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formatIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E6E8EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatIconBoxSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  formatIcon: {
    fontFamily: 'Material Icons',
    fontSize: 20,
    color: '#191C1E',
  },
  formatIconSelected: {
    color: '#FFFFFF',
  },
  formatIndicatorText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9.5,
    color: '#45464D',
  },
  formatIndicatorTextSelected: {
    color: '#0051D5',
    fontFamily: 'JetBrainsMono-Bold',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  formatTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#191C1E',
  },
  formatTitleSelected: {
    color: '#FFFFFF',
  },
  formatDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 10.5,
    color: '#45464D',
    lineHeight: 14,
    marginTop: 2,
  },
  formatDescSelected: {
    color: 'rgba(255, 255, 255, 0.85)',
  },

  // Manifest Blueprint
  manifestBlueprintContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6E8EA',
    backgroundColor: '#FFFFFF',
    ...Shadows.level1,
  },
  manifestHeader: {
    backgroundColor: '#131B2E',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manifestHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manifestHeaderIcon: {
    fontFamily: 'Material Icons',
    fontSize: 18,
    color: '#DBE1FF',
  },
  manifestHeaderTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  manifestStatusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  manifestStatusBadgeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#EFF1F3',
  },
  manifestBody: {
    padding: 14,
    gap: 8,
  },
  manifestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manifestRowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  manifestRowIcon: {
    fontFamily: 'Material Icons',
    fontSize: 16,
    color: '#45464D',
  },
  manifestRowLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12.5,
    color: '#45464D',
  },
  manifestRowValue: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 12,
    color: '#191C1E',
  },
  manifestRowValueSecondary: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 12,
    color: '#0051D5',
  },
  manifestDivider: {
    height: 1,
    backgroundColor: '#ECEEF0',
  },

  // Security Notice
  securityNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F2F4F6',
    borderRadius: 14,
    padding: 14,
  },
  securityNoticeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E6E8EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  securityNoticeIcon: {
    fontFamily: 'Material Icons',
    fontSize: 18,
    color: '#191C1E',
  },
  securityNoticeContent: {
    flex: 1,
    gap: 2,
  },
  securityNoticeTitle: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    color: '#191C1E',
    letterSpacing: 0.5,
  },
  securityNoticeBody: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    color: '#45464D',
    lineHeight: 16,
  },

  // Generate Button
  generateButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  generateButtonComplete: {
    backgroundColor: '#6FFBBE',
  },
  generateButtonIcon: {
    fontFamily: 'Material Icons',
    fontSize: 20,
    color: '#FFFFFF',
  },
  generateButtonText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  generateButtonTextComplete: {
    color: '#002113',
  },

  // Crypto Divider
  cryptoDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  cryptoDividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E6E8EA',
  },
  cryptoDividerText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9.5,
    color: '#76777D',
    backgroundColor: '#F7F9FB',
    paddingHorizontal: 12,
    letterSpacing: 1,
  },

  // Success Card
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    gap: 14,
    ...Shadows.level2,
  },
  successCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  successBadgeBox: {
    position: 'relative',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#6FFBBE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBadgeIcon: {
    fontFamily: 'Material Icons',
    fontSize: 28,
    color: '#002113',
  },
  verifiedSubBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0051D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedSubIcon: {
    fontFamily: 'Material Icons',
    fontSize: 11,
    color: '#FFFFFF',
  },
  successTitleCol: {
    flex: 1,
    gap: 4,
  },
  successPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readyPill: {
    backgroundColor: 'rgba(111, 251, 190, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  readyPillText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9.5,
    color: '#005236',
  },
  shaSignedText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9.5,
    color: '#45464D',
  },
  successTitleText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 16,
    color: '#191C1E',
  },
  successDescText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    color: '#45464D',
    lineHeight: 16,
  },

  // Artifact Preview
  artifactPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECEEF0',
    borderRadius: 12,
    padding: 10,
  },
  artifactImageFrame: {
    position: 'relative',
    width: 54,
    height: 54,
    borderRadius: 8,
    overflow: 'hidden',
  },
  artifactImg: {
    width: '100%',
    height: '100%',
  },
  artifactOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artifactDatasetIcon: {
    fontFamily: 'Material Icons',
    fontSize: 22,
    color: '#FFFFFF',
  },
  artifactTextCol: {
    flex: 1,
    gap: 2,
  },
  artifactTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  artifactEncryptedIcon: {
    fontFamily: 'Material Icons',
    fontSize: 14,
    color: '#0051D5',
  },
  artifactSealedTag: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    color: '#191C1E',
  },
  artifactSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464D',
  },

  // File Manifest Box
  fileManifestBox: {
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  manifestItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manifestItemLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  manifestItemIcon: {
    fontFamily: 'Material Icons',
    fontSize: 15,
    color: '#45464D',
  },
  manifestItemLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464D',
  },
  manifestItemFileName: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    color: '#0051D5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 180,
  },
  manifestItemValue: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11.5,
    color: '#191C1E',
  },
  expirationPill: {
    backgroundColor: '#E6E8EA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expirationPillText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#191C1E',
  },
  copyHashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  copyHashText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#191C1E',
  },
  copyHashIcon: {
    fontFamily: 'Material Icons',
    fontSize: 13,
    color: '#0051D5',
  },

  // Success Actions
  successActionsCol: {
    gap: 8,
    paddingTop: 4,
  },
  downloadButton: {
    backgroundColor: '#0051D5',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  downloadButtonIcon: {
    fontFamily: 'Material Icons',
    fontSize: 20,
    color: '#FFFFFF',
  },
  downloadButtonText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  doneReturnButton: {
    backgroundColor: '#ECEEF0',
    borderRadius: 12,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  doneReturnIcon: {
    fontFamily: 'Material Icons',
    fontSize: 17,
    color: '#191C1E',
  },
  doneReturnText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#191C1E',
  },

  // Telemetry Footnote
  telemetryFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  telemetryFootnoteShield: {
    fontFamily: 'Material Icons',
    fontSize: 14,
    color: '#76777D',
  },
  telemetryFootnoteText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9.5,
    color: '#76777D',
    letterSpacing: 0.5,
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
});
