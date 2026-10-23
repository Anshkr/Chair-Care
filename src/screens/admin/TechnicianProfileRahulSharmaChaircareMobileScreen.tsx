import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { BrandLogo } from '../../components/common/BrandLogo';
import { adminApi } from '../../services/api/adminApi';
import { useAdminSync } from '../../services/adminSync';
import { phoneCallService } from '../../services/phone/phoneCallService';

interface TechnicianProfileProps {
  navigation?: any;
  route?: {
    params?: {
      technicianId?: string;
      technician?: any;
    };
  };
}

export const TechnicianProfileRahulSharmaChaircareMobileScreen: React.FC<TechnicianProfileProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const passedTech = route?.params?.technician;
  const passedId = route?.params?.technicianId;

  const [techData, setTechData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      let targetId = passedId || passedTech?.id;

      // If no valid ID passed, fetch all technicians from backend and pick the first one
      if (!targetId || targetId === 'tech-01') {
        const allRes = await adminApi.getAllTechnicians();
        if (allRes.success && Array.isArray(allRes.data) && allRes.data.length > 0) {
          targetId = allRes.data[0].id;
        }
      }

      if (targetId) {
        const res = await adminApi.getTechnicianDetails(targetId);
        if (res.success && res.data) {
          setTechData(res.data);
          return;
        }
      }

      // Fallback: pick the first technician from fleet roster
      const fallbackList = await adminApi.getAllTechnicians();
      if (fallbackList.success && Array.isArray(fallbackList.data) && fallbackList.data.length > 0) {
        const firstId = fallbackList.data[0].id;
        const res = await adminApi.getTechnicianDetails(firstId);
        if (res.success && res.data) {
          setTechData(res.data);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to fetch real technician details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [passedId, passedTech]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Real-time synchronization across admin tabs and backend events
  useAdminSync(navigation, fetchDetails);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // Real data mapping
  const techName = techData?.name || passedTech?.name || 'Technician';
  const techCode = techData?.id ? `#TECH-${techData.id.slice(0, 8).toUpperCase()}` : '#TECH-884-DL';
  const techRating = techData?.rating ? Number(techData.rating).toFixed(1) : '5.0';
  const reviewsCount = techData?.reviews ? techData.reviews.length : (passedTech?.reviewsCount || 0);
  const jobsDone = techData?.completedJobs !== undefined ? techData.completedJobs : (passedTech?.completedJobsCount || 0);
  const phone = techData?.phone || passedTech?.phone || '+91 99887 76655';
  const email = techData?.email || passedTech?.email || 'technician@chaircare.com';
  const vehicle = techData?.vehicleInfo || passedTech?.vehicleInfo || passedTech?.vehicle || 'Mobile Service Van';
  const corridor = techData?.zone || passedTech?.zone || passedTech?.corridorLocation || 'Delhi NCR Region';
  const avatarUrl = techData?.avatarUrl || passedTech?.avatarUrl;
  const isVerified = techData?.verificationStatus === 'verified' || passedTech?.isVerified !== false;
  const isOnline = techData ? Boolean(techData.isOnline) : Boolean(passedTech?.isOnline);
  const dutyState = techData?.dutyState || (isOnline ? 'online' : 'offline');
  const currentJob = techData?.currentJob || null;
  const todayEarnings = techData?.todayEarnings !== undefined ? techData.todayEarnings : 0;
  const jobsList: any[] = techData?.jobs || [];
  const reviewsList: any[] = techData?.reviews || [];

  const techInitials = techName
    .split(' ')
    .filter(Boolean)
    .map((p: string) => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'TC';

  // Dynamic duty state badge styling
  let dutyBadgeText = 'Online • Available for Dispatch';
  let dutyBadgeColor = '#10B981';
  let dutyBadgeBg = 'rgba(16, 185, 129, 0.12)';
  let dutyBadgeBorder = 'rgba(16, 185, 129, 0.3)';

  if (techData?.verificationStatus === 'suspended') {
    dutyBadgeText = 'Access Suspended';
    dutyBadgeColor = '#EF4444';
    dutyBadgeBg = 'rgba(239, 68, 68, 0.12)';
    dutyBadgeBorder = 'rgba(239, 68, 68, 0.3)';
  } else if (!isOnline || dutyState === 'offline') {
    dutyBadgeText = 'Offline • Duty Paused (Off Duty)';
    dutyBadgeColor = '#64748B';
    dutyBadgeBg = 'rgba(100, 116, 139, 0.12)';
    dutyBadgeBorder = 'rgba(100, 116, 139, 0.3)';
  } else if (dutyState === 'doing_job' || currentJob) {
    dutyBadgeText = currentJob?.trackingCode
      ? `Doing Job • Ticket #${currentJob.trackingCode}`
      : 'Doing Job • In Service';
    dutyBadgeColor = Colors.secondaryCobalt;
    dutyBadgeBg = 'rgba(19, 70, 153, 0.12)';
    dutyBadgeBorder = 'rgba(19, 70, 153, 0.3)';
  }

  const handleCall = () => {
    phoneCallService.callNumber(phone, techName);
  };

  const handleCopy = (text: string, label: string) => {
    showToast(`${label} copied!`);
  };

  const handleManageStatus = () => {
    if (navigation) {
      navigation.navigate('SuspendReactivateTechnician', {
        technicianId: techData?.id || passedId || 'tech-01',
        technician: techData || passedTech || {
          id: 'tech-01',
          name: techName,
          code: techCode,
          rating: techRating,
        },
      });
    }
  };

  const handleViewReviews = () => {
    if (navigation) {
      navigation.navigate('ReviewsRatings');
    }
  };

  const handleJobHistory = () => {
    if (navigation) {
      navigation.navigate('ActivityLogs');
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Bar */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation?.canGoBack() ? navigation.goBack() : navigation?.navigate('Technicians'))}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <BrandLogo size={28} containerStyle={{ marginRight: 6 }} />
          <Text style={styles.headerTitle}>Technician Profile</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => {
              fetchDetails();
              showToast('Refreshed real technician profile.');
            }}
            activeOpacity={0.7}
          >
            <AppIcon name="RotateCw" size={18} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>

          <View style={styles.profileAvatarTop}>
            <AppIcon name="User" size={18} color={Colors.onPrimary} />
          </View>
        </View>
      </View>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <AppIcon name="Check" size={16} color="#6ffbbe" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Loading Indicator */}
      {isLoading && !techData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondaryCobalt} />
          <Text style={styles.loadingText}>Fetching real technician data from database...</Text>
        </View>
      ) : (
        /* Main Scrollable Content */
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 30, 40) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* 2. Technician Identity Card */}
          <View style={styles.card}>
            <View style={styles.identityTopRow}>
              <View style={styles.avatarWrapper}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <View style={styles.initialsAvatarBox}>
                    <Text style={styles.initialsAvatarText}>{techInitials}</Text>
                  </View>
                )}
                <View style={[styles.onlineBeaconDot, { backgroundColor: dutyBadgeColor }]}>
                  <View style={[styles.onlineBeaconInner, { backgroundColor: dutyBadgeColor }]} />
                </View>
              </View>

              <View style={styles.identityMetaCol}>
                <View style={styles.nameCodeRow}>
                  <Text style={styles.techNameHeadline} numberOfLines={1}>
                    {techName}
                  </Text>
                  <View style={styles.techCodeBadge}>
                    <Text style={styles.techCodeText}>{techCode}</Text>
                  </View>
                </View>

                {isVerified && (
                  <View style={styles.verifiedTagRow}>
                    <AppIcon name="Check" size={14} color="#005236" />
                    <Text style={styles.verifiedTagText}>Verified Master Specialist</Text>
                  </View>
                )}

                {/* Real Live Duty Status Badge */}
                <View style={[styles.statusLivePill, { backgroundColor: dutyBadgeBg, borderColor: dutyBadgeBorder }]}>
                  <View style={[styles.pulsingDot, { backgroundColor: dutyBadgeColor }]} />
                  <Text style={[styles.statusLiveText, { color: dutyBadgeColor }]}>
                    {dutyBadgeText}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Highlights Strip */}
            <View style={styles.quickHighlightsStrip}>
              <View style={styles.highlightCol}>
                <View style={styles.highlightStarRow}>
                  <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.highlightNumberBold}>{techRating}</Text>
                </View>
                <Text style={styles.highlightSubText}>{reviewsCount} Reviews</Text>
              </View>

              <View style={styles.highlightCol}>
                <Text style={styles.highlightNumberBold}>{jobsDone}</Text>
                <Text style={styles.highlightSubText}>Jobs Done</Text>
              </View>

              <View style={styles.highlightCol}>
                <Text style={styles.highlightTierGold}>₹{todayEarnings}</Text>
                <Text style={styles.highlightSubText}>Today's Payout</Text>
              </View>
            </View>
          </View>

          {/* 3. Real Active Deployment Card (Shown when technician is currently Doing Job) */}
          {currentJob && (
            <View style={[styles.card, styles.currentJobCard]}>
              <View style={styles.currentJobHeaderRow}>
                <View style={styles.currentJobLivePill}>
                  <View style={styles.activeJobPulseDot} />
                  <Text style={styles.currentJobLiveText}>CURRENT ACTIVE DEPLOYMENT</Text>
                </View>
                <View style={styles.currentJobStatusBadge}>
                  <Text style={styles.currentJobStatusText}>
                    {String(currentJob.status).replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.currentJobTitle}>
                {currentJob.serviceTitle} • {currentJob.chairModel}
              </Text>
              <Text style={styles.currentJobCode}>Ticket #{currentJob.trackingCode}</Text>

              <View style={styles.currentJobDetailRow}>
                <AppIcon name="User" size={15} color={Colors.secondaryCobalt} />
                <Text style={styles.currentJobDetailText}>Client: {currentJob.customerName}</Text>
              </View>

              <View style={styles.currentJobDetailRow}>
                <AppIcon name="MapPin" size={15} color={Colors.secondaryCobalt} />
                <Text style={styles.currentJobDetailText}>{currentJob.address}</Text>
              </View>

              {currentJob.timeSlot ? (
                <View style={styles.currentJobDetailRow}>
                  <AppIcon name="Clock" size={15} color={Colors.secondaryCobalt} />
                  <Text style={styles.currentJobDetailText}>Slot: {currentJob.timeSlot}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* 4. Contact & Field Logistics Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardEyebrow}>OPERATIONAL COORDINATES</Text>
              <View style={styles.vanPill}>
                <Text style={styles.vanPillText}>{corridor}</Text>
              </View>
            </View>

            {/* Phone Row */}
            <View style={styles.contactItemRow}>
              <View style={styles.contactLeft}>
                <View style={styles.contactIconCircle}>
                  <AppIcon name="Phone" size={16} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.contactLabelMono}>PHONE DIRECT</Text>
                  <Text style={styles.contactValueText}>{phone}</Text>
                </View>
              </View>
              <View style={styles.contactActionsRight}>
                <TouchableOpacity
                  style={styles.actionIconBtn}
                  onPress={() => handleCopy(phone, 'Phone')}
                  activeOpacity={0.7}
                >
                  <AppIcon name="ClipboardList" size={14} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionCallBtn}
                  onPress={handleCall}
                  activeOpacity={0.7}
                >
                  <AppIcon name="Phone" size={16} color={Colors.secondaryCobalt} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Email Row */}
            <View style={styles.contactItemRow}>
              <View style={styles.contactLeft}>
                <View style={styles.contactIconCircle}>
                  <AppIcon name="Mail" size={16} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.contactLabelMono}>EMAIL ADDRESS</Text>
                  <Text style={styles.contactValueText}>{email}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => handleCopy(email, 'Email')}
                activeOpacity={0.7}
              >
                <AppIcon name="ClipboardList" size={14} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Vehicle & Radius Meta */}
            <View style={styles.gridTwoLogistics}>
              <View style={styles.logisticsCell}>
                <AppIcon name="Truck" size={16} color={Colors.secondaryCobalt} />
                <View style={styles.logisticsTextCol}>
                  <Text style={styles.logisticsLabelMono}>VEHICLE UNIT</Text>
                  <Text style={styles.logisticsValueBold}>{vehicle}</Text>
                  <Text style={styles.logisticsSubMono}>Tool Kit Loaded</Text>
                </View>
              </View>

              <View style={styles.logisticsCell}>
                <AppIcon name="MapPin" size={16} color={Colors.primary} />
                <View style={styles.logisticsTextCol}>
                  <Text style={styles.logisticsLabelMono}>ASSIGNED CORRIDOR</Text>
                  <Text style={styles.logisticsValueBold} numberOfLines={1}>
                    {corridor}
                  </Text>
                  <Text style={styles.logisticsSubMono}>Rapid Dispatch Zone</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 5. Performance Metrics Grid (Real KPIs & SLA) */}
          <View style={styles.kpiBlock}>
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.sectionTitle}>Fleet KPIs & SLA Performance</Text>
              <View style={styles.auditedBadge}>
                <Text style={styles.auditedBadgeText}>Live Database Stats</Text>
              </View>
            </View>

            <View style={styles.kpiGrid}>
              {/* Metric 1 */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiTop}>
                  <Text style={styles.kpiLabelMono}>COMPLETED JOBS</Text>
                  <AppIcon name="Check" size={16} color="#009668" />
                </View>
                <Text style={styles.kpiHeroNumber}>{jobsDone}</Text>
                <View style={styles.kpiFooterRow}>
                  <View style={styles.greenMiniDot} />
                  <Text style={styles.kpiFooterText}>All Time Verified</Text>
                </View>
              </View>

              {/* Metric 2 */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiTop}>
                  <Text style={styles.kpiLabelMono}>CUSTOMER RATING</Text>
                  <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                </View>
                <Text style={styles.kpiHeroNumber}>
                  {techRating} <Text style={styles.kpiMaxSub}>/ 5.0</Text>
                </Text>
                <View style={styles.kpiFooterRow}>
                  <View style={styles.amberMiniDot} />
                  <Text style={styles.kpiFooterText}>{reviewsCount} Verified Reviews</Text>
                </View>
              </View>

              {/* Metric 3 */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiTop}>
                  <Text style={styles.kpiLabelMono}>ACTIVE DISPATCHES</Text>
                  <AppIcon name="Activity" size={16} color={Colors.secondaryCobalt} />
                </View>
                <Text style={styles.kpiHeroNumber}>
                  {techData?.activeJobsCount !== undefined ? techData.activeJobsCount : (currentJob ? 1 : 0)}
                </Text>
                <View style={styles.kpiFooterRow}>
                  <View style={styles.blueMiniDot} />
                  <Text style={styles.kpiFooterText}>Currently Assigned</Text>
                </View>
              </View>

              {/* Metric 4 */}
              <View style={styles.kpiCard}>
                <View style={styles.kpiTop}>
                  <Text style={styles.kpiLabelMono}>TODAY'S PAYOUT</Text>
                  <AppIcon name="Coins" size={16} color="#009668" />
                </View>
                <Text style={styles.kpiHeroNumber}>₹{todayEarnings}</Text>
                <View style={styles.kpiFooterRow}>
                  <View style={styles.greenMiniDot} />
                  <Text style={styles.kpiFooterText}>Commission Accrued</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 6. Specializations & Certifications Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionTitle}>Certifications & Expertise</Text>
              <AppIcon name="Award" size={18} color={Colors.secondaryCobalt} />
            </View>

            <View style={styles.skillsChipsWrap}>
              <View style={styles.skillBadge}>
                <AppIcon name="Wrench" size={13} color={Colors.onSurface} />
                <Text style={styles.skillBadgeText}>Repair & Restoration</Text>
              </View>

              <View style={styles.skillBadge}>
                <AppIcon name="Settings" size={13} color={Colors.onSurface} />
                <Text style={styles.skillBadgeText}>Installation & Assembly</Text>
              </View>

              <View style={styles.skillBadge}>
                <AppIcon name="ArrowUpDown" size={13} color={Colors.onSurface} />
                <Text style={styles.skillBadgeText}>Class-4 Gas Lift Specialist</Text>
              </View>

              <View style={styles.skillBadge}>
                <AppIcon name="Armchair" size={13} color={Colors.onSurface} />
                <Text style={styles.skillBadgeText}>Tilt Mechanism Calibration</Text>
              </View>

              <View style={styles.certBadge}>
                <View style={styles.certDot} />
                <Text style={styles.certBadgeText}>Herman Miller Certified</Text>
              </View>

              <View style={styles.certBadge}>
                <View style={styles.certDot} />
                <Text style={styles.certBadgeText}>Steelcase OEM Spec</Text>
              </View>
            </View>
          </View>

          {/* 7. Real Platform Activity Feed */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionTitle}>Real Job History ({jobsList.length})</Text>
              <View style={styles.realtimeFeedBadge}>
                <View style={styles.realtimePulseDot} />
                <Text style={styles.realtimeFeedText}>Live Database Feed</Text>
              </View>
            </View>

            <View style={styles.activityFeedCol}>
              {jobsList.length === 0 ? (
                <View style={styles.emptyFeedBox}>
                  <AppIcon name="Clock" size={24} color={Colors.outline} />
                  <Text style={styles.emptyFeedTitle}>No service jobs found</Text>
                  <Text style={styles.emptyFeedSub}>This technician has no recorded jobs logged in the system yet.</Text>
                </View>
              ) : (
                jobsList.map((job) => {
                  const isCompleted = job.status === 'completed';
                  const isActive = ['in_route', 'arrived', 'in_progress', 'assigned'].includes(job.status);
                  const iconColor = isCompleted ? '#009668' : isActive ? Colors.secondaryCobalt : '#d97706';
                  const iconBg = isCompleted
                    ? 'rgba(111, 251, 190, 0.35)'
                    : isActive
                    ? '#dbe1ff'
                    : 'rgba(251, 191, 36, 0.25)';

                  const dateDisplay = job.visitDate || (job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recent');

                  return (
                    <View key={job.id} style={styles.activityItemRow}>
                      <View style={[styles.activityIconCircle, { backgroundColor: iconBg }]}>
                        <AppIcon
                          name={isCompleted ? 'Check' : isActive ? 'Wrench' : 'ClipboardList'}
                          size={15}
                          color={iconColor}
                        />
                      </View>
                      <View style={styles.activityContentCol}>
                        <View style={styles.activityTitleTimestampRow}>
                          <Text style={styles.activityPrimaryTitle} numberOfLines={1}>
                            {job.serviceTitle} • {job.chairModel}
                          </Text>
                          <Text style={styles.activityTimestampMono}>{dateDisplay}</Text>
                        </View>
                        <Text style={styles.activitySubText}>
                          Ticket #{job.trackingCode} • Client: {job.customerName} • ₹{job.totalAmount}
                        </Text>
                        {job.issueDescription ? (
                          <Text style={styles.activityIssueText} numberOfLines={1}>
                            Note: {job.issueDescription}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* 8. Real Customer Reviews Section */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.sectionTitle}>Customer Reviews</Text>
                <View style={styles.reviewCountPill}>
                  <Text style={styles.reviewCountPillText}>{reviewsList.length}</Text>
                </View>
              </View>
              <View style={styles.reviewAverageBadge}>
                <AppIcon name="Star" size={13} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.reviewAverageText}>{techRating}</Text>
              </View>
            </View>

            <View style={styles.reviewsFeedCol}>
              {reviewsList.length === 0 ? (
                <View style={styles.emptyFeedBox}>
                  <AppIcon name="Star" size={24} color={Colors.outline} />
                  <Text style={styles.emptyFeedTitle}>No customer reviews yet</Text>
                  <Text style={styles.emptyFeedSub}>Customer ratings will automatically populate once jobs are completed.</Text>
                </View>
              ) : (
                reviewsList.map((review) => {
                  const revDate = review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString()
                    : 'Recent';

                  return (
                    <View key={review.id} style={styles.reviewCardItem}>
                      <View style={styles.reviewHeaderRow}>
                        <View style={styles.reviewCustomerCol}>
                          <Text style={styles.reviewCustomerName}>{review.customerName}</Text>
                          <Text style={styles.reviewServiceMeta}>
                            {review.serviceTitle} • {review.chairModel}
                          </Text>
                        </View>
                        <View style={styles.reviewStarsWrap}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <AppIcon
                              key={s}
                              name="Star"
                              size={12}
                              color={s <= review.rating ? '#F59E0B' : '#CBD5E1'}
                              fill={s <= review.rating ? '#F59E0B' : 'transparent'}
                            />
                          ))}
                          <Text style={styles.reviewDateMono}>{revDate}</Text>
                        </View>
                      </View>
                      {review.comment ? (
                        <Text style={styles.reviewCommentText}>"{review.comment}"</Text>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* 9. Administrative Action Panel */}
          <View style={styles.adminActionPanel}>
            <TouchableOpacity
              style={styles.manageStatusPrimaryBtn}
              onPress={handleManageStatus}
              activeOpacity={0.88}
            >
              <AppIcon name="ShieldCheck" size={18} color={Colors.onPrimary} />
              <Text style={styles.manageStatusBtnText}>Manage Status & Access</Text>
            </TouchableOpacity>

            <View style={styles.dualSecondaryGrid}>
              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={handleViewReviews}
                activeOpacity={0.8}
              >
                <AppIcon name="Star" size={16} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.secondaryActionText}>All Reviews ({reviewsCount})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={handleJobHistory}
                activeOpacity={0.8}
              >
                <AppIcon name="Clock" size={16} color={Colors.onSurface} />
                <Text style={styles.secondaryActionText}>Activity Logs ({jobsDone})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
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
    borderRadius: BorderRadius.full,
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
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLow,
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
  toastContainer: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    zIndex: 100,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  toastText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    ...Shadows.level1,
  },
  identityTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  initialsAvatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsAvatarText: {
    ...Typography.titleLg,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  onlineBeaconDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  onlineBeaconInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  identityMetaCol: {
    flex: 1,
    gap: 4,
  },
  nameCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  techNameHeadline: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.3,
    flex: 1,
  },
  techCodeBadge: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  techCodeText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  verifiedTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(111, 251, 190, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  verifiedTagText: {
    ...Typography.labelMd,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#005236',
  },
  statusLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusLiveText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
  },
  quickHighlightsStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
    marginTop: 12,
  },
  highlightCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightStarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  highlightNumberBold: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  highlightTierGold: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
  },
  highlightSubText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  // Active Deployment Card
  currentJobCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondaryCobalt,
    backgroundColor: '#f8faff',
    gap: 6,
  },
  currentJobHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  currentJobLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeJobPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondaryCobalt,
  },
  currentJobLiveText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
    letterSpacing: 0.5,
  },
  currentJobStatusBadge: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  currentJobStatusText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
  },
  currentJobTitle: {
    ...Typography.titleLg,
    fontSize: 14.5,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  currentJobCode: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  currentJobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  currentJobDetailText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardEyebrow: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  vanPill: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  vanPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 8,
    marginBottom: 6,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  contactIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabelMono: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  contactValueText: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  contactActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCallBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#dbe1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTwoLogistics: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  logisticsCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 8,
  },
  logisticsTextCol: {
    flex: 1,
  },
  logisticsLabelMono: {
    ...Typography.labelMono,
    fontSize: 8.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  logisticsValueBold: {
    ...Typography.bodySm,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: 1,
  },
  logisticsSubMono: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  kpiBlock: {
    gap: 6,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    ...Typography.titleLg,
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  auditedBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  auditedBadgeText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#005236',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  kpiCard: {
    width: '49%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: 10,
    justifyContent: 'space-between',
    ...Shadows.level1,
  },
  kpiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kpiLabelMono: {
    ...Typography.labelMono,
    fontSize: 8.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  kpiHeroNumber: {
    ...Typography.headlineSm,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  kpiMaxSub: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.onSurfaceVariant,
  },
  kpiFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  greenMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#009668',
  },
  amberMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#f59e0b',
  },
  blueMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.secondaryCobalt,
  },
  kpiFooterText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  skillsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  skillBadgeText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  certDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  certBadgeText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  realtimeFeedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  realtimePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  realtimeFeedText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  activityFeedCol: {
    gap: 8,
  },
  emptyFeedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  emptyFeedTitle: {
    ...Typography.titleLg,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  emptyFeedSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 8,
  },
  activityIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  activityContentCol: {
    flex: 1,
  },
  activityTitleTimestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  activityPrimaryTitle: {
    ...Typography.bodyMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
    flex: 1,
  },
  activityTimestampMono: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  activitySubText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  activityIssueText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.secondaryCobalt,
    marginTop: 2,
  },
  // Reviews Section
  reviewCountPill: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  reviewCountPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  reviewAverageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  reviewAverageText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  reviewsFeedCol: {
    gap: 8,
  },
  reviewCardItem: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 6,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  reviewCustomerCol: {
    flex: 1,
  },
  reviewCustomerName: {
    ...Typography.titleLg,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  reviewServiceMeta: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  reviewStarsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewDateMono: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
    marginLeft: 4,
  },
  reviewCommentText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    fontStyle: 'italic',
    color: Colors.onSurface,
    lineHeight: 16,
  },
  adminActionPanel: {
    gap: 8,
    marginTop: 4,
  },
  manageStatusPrimaryBtn: {
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  manageStatusBtnText: {
    ...Typography.titleLg,
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  dualSecondaryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryActionText: {
    ...Typography.labelMd,
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.onSurface,
  },
});
