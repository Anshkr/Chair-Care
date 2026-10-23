import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Platform,
  AccessibilityInfo,
  Modal,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { ThemeSwitchButton } from '../../components/common/ThemeSwitchButton';
import { CustomerHeaderAvatar } from '../../components/common/CustomerHeaderAvatar';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { customerApi, serviceApi, notificationApi } from '../../services/api';
import { sanitizeUserErrorMessage } from '../../services/api/apiClient';
import { useAdminSync } from '../../services/adminSync';
import { phoneCallService } from '../../services/phone/phoneCallService';
import { PressableScale } from '../../animations/PressableScale';
import { FadeIn } from '../../animations/FadeIn';

interface CategoryItem {
  id: string;
  label: string;
  icon: string;
  sub: string;
  accentColor: string;
  iconBg: string;
  code?: string;
  serviceId?: string;
  keywords: string[];
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'repair',
    label: 'Repair',
    sub: 'Fix tilt & frame',
    icon: 'Wrench',
    accentColor: Colors.secondaryCobalt,
    iconBg: '#EEF4FF',
    code: 'REPAIR_TILT_FRAME',
    keywords: ['repair', 'fix', 'broken', 'tilt', 'frame', 'wobble', 'squeak'],
  },
  {
    id: 'installation',
    label: 'Installation',
    sub: 'New chair setup',
    icon: 'Package',
    accentColor: '#0284C7',
    iconBg: '#E0F2FE',
    code: 'INSTALLATION_NEW_SETUP',
    keywords: ['installation', 'install', 'assembly', 'setup', 'new chair', 'unbox'],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    sub: 'Lube & tune-up',
    icon: 'Settings',
    accentColor: '#475569',
    iconBg: '#F1F5F9',
    code: 'MAINTENANCE_TUNEUP',
    keywords: ['maintenance', 'lube', 'lubrication', 'oil', 'tighten', 'screws', 'tuneup'],
  },
  {
    id: 'wheels',
    label: 'Wheel Replace',
    sub: 'Smooth casters',
    icon: 'Disc',
    accentColor: '#7C3AED',
    iconBg: '#F5F3FF',
    code: 'CASTOR_WHEEL_FIX',
    keywords: ['wheel', 'casters', 'rollerblade', 'floor', 'scratches', 'noisy'],
  },
  {
    id: 'hydraulic',
    label: 'Gas Lift',
    sub: 'Sinking height fix',
    icon: 'ArrowUp',
    accentColor: '#059669',
    iconBg: '#ECFDF5',
    code: 'HYDRAULIC_REPLACE',
    keywords: ['hydraulic', 'gas lift', 'cylinder', 'sinking', 'height', 'drop'],
  },
  {
    id: 'armrest',
    label: 'Armrest',
    sub: 'Pads & brackets',
    icon: 'Armchair',
    accentColor: '#EA580C',
    iconBg: '#FFF7ED',
    code: 'ARMREST_CUSHION_REPAIR',
    keywords: ['armrest', 'pads', 'bracket', '3d', '4d', 'peeling', 'cracked'],
  },
  {
    id: 'cleaning',
    label: 'Cleaning',
    sub: 'Deep steam wash',
    icon: 'Sparkles',
    accentColor: '#0D9488',
    iconBg: '#F0FDFA',
    code: 'FULL_ERGONOMIC_SPA',
    keywords: ['cleaning', 'clean', 'steam', 'wash', 'mesh', 'stain', 'sanitize'],
  },
  {
    id: 'inspection',
    label: 'Inspection',
    sub: 'Health audit',
    icon: 'Search',
    accentColor: '#2563EB',
    iconBg: '#EFF6FF',
    code: 'INSPECTION_HEALTH_AUDIT',
    keywords: ['inspection', 'audit', 'checkup', 'diagnosis', 'safety', 'check'],
  },
];

interface PopularService {
  id: string;
  code?: string;
  title: string;
  description: string;
  price: string;
  priceNum: number;
  duration: string;
  badge?: string;
  icon: string;
  iconBg: string;
  serviceId: string;
}

export const ServicesAvailableChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const { isAuthenticated, currentUser, isCustomerAuthorized, setPendingReturnRoute } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [liveServices, setLiveServices] = useState<any[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState<boolean>(true);
  const [isAllServicesModalOpen, setIsAllServicesModalOpen] = useState<boolean>(false);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState<number>(0);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const isCustomer = isCustomerAuthorized;
  const customerName = isCustomer ? currentUser?.name || 'Customer' : '';
  const customerInitials = isCustomer
    ? customerName
        .split(' ')
        .filter(Boolean)
        .map((p: string) => p[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'CC'
    : '';

  // Animated entrance values
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(14)).current;
  const searchOpacity = useRef(new Animated.Value(0)).current;
  const searchTranslateY = useRef(new Animated.Value(12)).current;
  const gridOpacity = useRef(new Animated.Value(0)).current;
  const gridTranslateY = useRef(new Animated.Value(12)).current;
  const popularOpacity = useRef(new Animated.Value(0)).current;
  const popularTranslateY = useRef(new Animated.Value(12)).current;

  // Idle floating animation on hero chair image
  const floatAnim = useRef(new Animated.Value(0)).current;

  const loadLiveServices = useCallback(async () => {
    try {
      setIsLoadingServices(true);
      const res = await serviceApi.getAll();
      if (res.success && Array.isArray(res.data)) {
        setLiveServices(res.data);
      }
    } catch {
      // keep fallback
    } finally {
      setIsLoadingServices(false);
    }
  }, []);

  const loadActiveRequest = useCallback(async () => {
    if (!isAuthenticated || currentUser?.role !== 'customer') {
      setActiveRequest(null);
      return;
    }
    try {
      const res = await customerApi.getMyRequests();
      if (res.success && Array.isArray(res.data)) {
        const active = res.data.find(
          (r: any) =>
            r.status === 'in_route' ||
            r.status === 'arrived' ||
            r.status === 'in_progress' ||
            r.status === 'assigned' ||
            r.status === 'finding_technician' ||
            r.status === 'pending'
        );
        setActiveRequest(active || null);
      }
    } catch {
      // retain state
    }
  }, [isAuthenticated, currentUser?.role]);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || currentUser?.role !== 'customer') {
      setUnreadNotifs(0);
      return;
    }
    try {
      const res = await notificationApi.getUnreadCount({ role: 'customer' });
      if (res.success && res.data) {
        setUnreadNotifs(res.data.count);
      }
    } catch {
      // ignore
    }
  }, [isAuthenticated, currentUser?.role]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadLiveServices(), loadActiveRequest(), loadNotifications()]);
    setRefreshing(false);
  }, [loadLiveServices, loadActiveRequest, loadNotifications]);

  const executeCancelRequest = async () => {
    const targetId = activeRequest?.id || activeRequest?.tracking_code || activeRequest?.trackingCode;
    if (!targetId || isCancelling) return;
    try {
      setIsCancelling(true);
      const res = await customerApi.cancelRequest(targetId, 'Cancelled from Customer Dashboard');
      if (res.success) {
        setActiveRequest(null);
        await loadActiveRequest();
      } else {
        const errorMsg = sanitizeUserErrorMessage(res.error) || 'Could not cancel request. Please try again.';
        if (Platform.OS === 'web') {
          window.alert(errorMsg);
        } else {
          Alert.alert('Unable to Cancel', errorMsg);
        }
      }
    } catch (err: any) {
      const errorMsg = sanitizeUserErrorMessage(err) || 'Could not cancel request. Please try again.';
      if (Platform.OS === 'web') {
        window.alert(errorMsg);
      } else {
        Alert.alert('Unable to Cancel', errorMsg);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelActiveRequest = () => {
    if (!activeRequest) return;
    const reqCode = activeRequest.tracking_code || activeRequest.trackingCode || '';
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to cancel service booking #${reqCode}?`);
      if (confirmed) {
        executeCancelRequest();
      }
    } else {
      Alert.alert(
        'Cancel Service Booking',
        `Are you sure you want to cancel booking #${reqCode}?`,
        [
          { text: 'Keep Booking', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: executeCancelRequest,
          },
        ]
      );
    }
  };

  // Live admin synchronization for prices, requests, and dispatches
  useAdminSync(navigation, () => {
    loadLiveServices();
    loadActiveRequest();
    loadNotifications();
  });

  useEffect(() => {
    let isMounted = true;

    loadLiveServices();
    loadActiveRequest();
    loadNotifications();

    if (!isAuthenticated) return;

    // Periodic live synchronization every 4 seconds to detect when technician accepts
    const pollInterval = setInterval(() => {
      if (isMounted) {
        loadActiveRequest();
        loadNotifications();
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [isAuthenticated, loadLiveServices, loadActiveRequest, loadNotifications]);

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reducedMotion) => {
      if (!isMounted) return;

      if (reducedMotion) {
        heroOpacity.setValue(1);
        heroTranslateY.setValue(0);
        searchOpacity.setValue(1);
        searchTranslateY.setValue(0);
        gridOpacity.setValue(1);
        gridTranslateY.setValue(0);
        popularOpacity.setValue(1);
        popularTranslateY.setValue(0);
        return;
      }

      // Smooth staggered entrance
      Animated.stagger(100, [
        Animated.parallel([
          Animated.timing(heroOpacity, {
            toValue: 1,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(heroTranslateY, {
            toValue: 0,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.parallel([
          Animated.timing(searchOpacity, {
            toValue: 1,
            duration: 340,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(searchTranslateY, {
            toValue: 0,
            duration: 340,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.parallel([
          Animated.timing(gridOpacity, {
            toValue: 1,
            duration: 340,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(gridTranslateY, {
            toValue: 0,
            duration: 340,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.parallel([
          Animated.timing(popularOpacity, {
            toValue: 1,
            duration: 340,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(popularTranslateY, {
            toValue: 0,
            duration: 340,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ]).start();

      // Subtle gentle floating loop on hero chair artwork
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -5,
            duration: 2400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      ).start();
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const getServiceVisuals = (svc: any) => {
    const title = (svc.title || '').toLowerCase();
    const code = (svc.code || '').toLowerCase();
    if (title.includes('hydraulic') || title.includes('gas lift') || code.includes('HYDRAULIC')) {
      return { icon: 'ArrowUp', iconBg: '#ECFDF5' };
    }
    if (title.includes('wheel') || title.includes('castor') || code.includes('CASTOR') || code.includes('WHEEL')) {
      return { icon: 'Disc', iconBg: '#F5F3FF' };
    }
    if (title.includes('recline') || title.includes('tilt') || code.includes('RECLINE') || code.includes('TILT')) {
      return { icon: 'Settings', iconBg: '#FFF7ED' };
    }
    if (title.includes('armrest') || code.includes('ARMREST')) {
      return { icon: 'Armchair', iconBg: '#FEF3C7' };
    }
    if (title.includes('clean') || title.includes('spa') || code.includes('CLEAN') || code.includes('SPA')) {
      return { icon: 'Sparkles', iconBg: '#F0FDFA' };
    }
    return { icon: 'Wrench', iconBg: '#EEF4FF' };
  };

  const dynamicServicesList: PopularService[] = liveServices.map((svc) => {
    const { icon, iconBg } = getServiceVisuals(svc);
    return {
      id: String(svc.id),
      code: svc.code,
      title: svc.title,
      description: svc.description,
      price: `₹${svc.estimatedPrice}`,
      priceNum: Number(svc.estimatedPrice),
      duration: `${svc.durationMinutes || 45} mins`,
      badge: svc.badge,
      icon,
      iconBg,
      serviceId: String(svc.id),
    };
  });

  const handleCategoryPress = (category: CategoryItem) => {
    setSelectedCategory(category.id);
    // Find matching live service added by admin
    const matchingService = liveServices.find((s) => {
      if (category.code && s.code === category.code) return true;
      const titleLower = (s.title || '').toLowerCase();
      const descLower = (s.description || '').toLowerCase();
      return category.keywords.some(
        (kw) => titleLower.includes(kw) || descLower.includes(kw)
      );
    });

    if (matchingService) {
      navigation.navigate('BookingStep1', {
        serviceId: matchingService.id,
        serviceTitle: matchingService.title,
        estimatedPrice: Number(matchingService.estimatedPrice),
        serviceCode: matchingService.code,
      });
    } else {
      navigation.navigate('BookingStep1', {
        serviceId: category.code || category.id,
        serviceTitle: category.label,
        serviceCode: category.code,
      });
    }
  };

  const handleBookService = (svc: PopularService) => {
    navigation.navigate('BookingStep1', {
      serviceId: svc.serviceId || svc.id,
      serviceTitle: svc.title,
      estimatedPrice: svc.priceNum,
      serviceCode: svc.code,
    });
  };

  // Filtered popular services based on search query or selected category
  const filteredPopularServices = dynamicServicesList.filter((svc) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      svc.title.toLowerCase().includes(q) ||
      svc.description.toLowerCase().includes(q)
    );
  });

  // Display limited subset on main screen to prevent page from expanding uncontrollably
  const displayedPopularServices = searchQuery.trim()
    ? filteredPopularServices
    : filteredPopularServices.slice(0, 3);

  // Filter for the full "View All Services" catalogue modal
  const modalFilteredServices = dynamicServicesList.filter((svc) => {
    const q = modalSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      svc.title.toLowerCase().includes(q) ||
      svc.description.toLowerCase().includes(q)
    );
  });

  return (
    <ScreenContainer hasPadding={false}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.brandIconBox}>
            <BrandLogo size={32} />
          </View>
          <View style={styles.brandTitleCol}>
            <Text style={styles.brandMainTitle}>
              Chair<Text style={styles.brandAccent}>Care</Text>
            </Text>
            <Text style={styles.brandTagline}>Doorstep Chair Service</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Dark Mode Switch Button */}
          <ThemeSwitchButton variant="header" style={{ marginRight: 4 }} />

          {/* Notification Button */}
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => {
              if (!isCustomerAuthorized) {
                navigation.navigate('AuthenticationGate', { returnTo: 'NotificationsTab' });
              } else {
                navigation.navigate('NotificationsTab');
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Notifications"
          >
            <AppIcon name="Bell" size={18} color={Colors.onSurface} />
            {unreadNotifs > 0 && <View style={styles.unreadDot} />}
          </TouchableOpacity>

          {/* Profile / Avatar Button - displayed with customer initials if logged in as customer, or Login CTA if guest / not customer */}
          {isCustomer ? (
            <CustomerHeaderAvatar
              onPress={() => navigation.navigate('CustomerProfileTab')}
              size={40}
            />
          ) : (
            <TouchableOpacity
              style={styles.headerLoginBtn}
              onPress={() => navigation.navigate('AuthenticationGate', { returnTo: 'ServicesAvailableTab' })}
              activeOpacity={0.7}
              accessibilityLabel="Customer Sign In"
            >
              <AppIcon name="User" size={15} color={Colors.secondaryCobalt} />
              <Text style={styles.headerLoginBtnText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.secondaryCobalt]}
            tintColor={Colors.secondaryCobalt}
          />
        }
      >
        <View style={styles.centerWrapper}>
          {/* 1. Visually Rich Hero Section */}
          <Animated.View
            style={[
              styles.heroContainer,
              {
                opacity: heroOpacity,
                transform: [{ translateY: heroTranslateY }],
              },
            ]}
          >
            <View style={styles.heroGlowCircle} />

            <View style={styles.heroContentRow}>
              <View style={styles.heroLeftCol}>
                <View style={styles.heroBadge}>
                  <AppIcon name="Sparkles" size={14} color={Colors.secondaryCobalt} />
                  <Text style={styles.heroBadgeText}>DOORSTEP SERVICE</Text>
                </View>

                <Text style={styles.heroHeadline}>
                  Your chair deserves{'\n'}better comfort.
                </Text>

                <Text style={styles.heroSubtext}>
                  Get trusted chair installation, repair and maintenance at your
                  doorstep.
                </Text>
              </View>

              <Animated.View
                style={[
                  styles.heroArtworkCol,
                  { transform: [{ translateY: floatAnim }] },
                ]}
              >
                <View style={styles.heroChairCard}>
                  <Image
                    source={require('../../../assets/hero_chair_ergonomic.jpg')}
                    style={styles.heroChairImage}
                    resizeMode="cover"
                  />
                  <View style={styles.heroTopTag}>
                    <AppIcon name="Sparkles" size={10} color="#38BDF8" />
                    <Text style={styles.heroTopTagText}>CERTIFIED</Text>
                  </View>
                  <View style={styles.heroFloatBadge}>
                    <AppIcon name="Check" size={13} color="#22C55E" />
                    <Text style={styles.heroFloatText}>Tested & Ready</Text>
                  </View>
                </View>
              </Animated.View>
            </View>

            {/* Micro Trust Strip */}
            <View style={styles.heroTrustStrip}>
              <View style={styles.trustItem}>
                <AppIcon name="Star" size={16} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.trustText}>4.9 Rating</Text>
              </View>
              <View style={styles.trustDivider} />
              <View style={styles.trustItem}>
                <AppIcon name="ShieldCheck" size={16} color={Colors.secondaryCobalt} />
                <Text style={styles.trustText}>90-Day Warranty</Text>
              </View>
              <View style={styles.trustDivider} />
              <View style={styles.trustItem}>
                <AppIcon name="CreditCard" size={16} color={Colors.secondaryCobalt} />
                <Text style={styles.trustText}>Pay After Fix</Text>
              </View>
            </View>
          </Animated.View>

          {/* 2. Active Request Banner (Interactive & real-time synced with backend) */}
          {isAuthenticated && activeRequest && (
            <View
              style={[
                styles.activeRequestBox,
                (activeRequest.status === 'finding_technician' || activeRequest.status === 'pending') &&
                  styles.activeRequestBoxPending,
                activeRequest.status === 'assigned' && styles.activeRequestBoxAssigned,
                activeRequest.status === 'arrived' && styles.activeRequestBoxArrived,
              ]}
            >
              {/* Header: Dynamic State Badge + Ticket Tracking Code */}
              <View style={styles.activeReqHeader}>
                <View
                  style={[
                    styles.activeReqBadge,
                    (activeRequest.status === 'finding_technician' || activeRequest.status === 'pending') &&
                      styles.activeReqBadgePending,
                    activeRequest.status === 'assigned' && styles.activeReqBadgeAssigned,
                    activeRequest.status === 'arrived' && styles.activeReqBadgeArrived,
                  ]}
                >
                  <View
                    style={[
                      styles.livePulseDot,
                      (activeRequest.status === 'finding_technician' || activeRequest.status === 'pending') && {
                        backgroundColor: '#D97706',
                      },
                      activeRequest.status === 'assigned' && {
                        backgroundColor: '#16A34A',
                      },
                      activeRequest.status === 'arrived' && {
                        backgroundColor: '#16A34A',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.activeReqBadgeText,
                      (activeRequest.status === 'finding_technician' || activeRequest.status === 'pending') && {
                        color: '#92400E',
                      },
                      activeRequest.status === 'assigned' && {
                        color: '#15803D',
                      },
                      activeRequest.status === 'arrived' && {
                        color: '#15803D',
                      },
                    ]}
                  >
                    {activeRequest.status === 'in_route'
                      ? 'TECHNICIAN ON THE WAY'
                      : activeRequest.status === 'arrived'
                      ? '📍 TECHNICIAN HAS ARRIVED'
                      : activeRequest.status === 'in_progress'
                      ? 'REPAIR IN PROGRESS'
                      : activeRequest.status === 'assigned'
                      ? 'TECHNICIAN ASSIGNED'
                      : 'LOOKING FOR TECHNICIAN'}
                  </Text>
                </View>

                <Text style={styles.activeReqEta}>
                  #{activeRequest.tracking_code || activeRequest.trackingCode || 'ACTIVE'}
                </Text>
              </View>

              {/* Title & Service Details */}
              <View style={{ gap: 2 }}>
                <Text style={styles.activeReqChair}>
                  {activeRequest.chair_model || activeRequest.chairModel || 'Office Ergonomic Chair'}
                </Text>
                <Text style={styles.activeReqServiceTitle}>
                  {activeRequest.service_title || activeRequest.serviceTitle || 'Chair Doorstep Repair'}
                  {activeRequest.visit_date ? ` • Scheduled ${activeRequest.visit_date}` : ''}
                </Text>
              </View>

              {/* State-specific Body & Interactive Controls */}
              {activeRequest.status === 'finding_technician' || activeRequest.status === 'pending' ? (
                // STATE 1: Waiting for technician to accept
                <View style={styles.pendingRadarNoticeBox}>
                  <View style={styles.radarNoticeRow}>
                    <AppIcon name="Clock" size={16} color="#D97706" />
                    <Text style={styles.pendingRadarNoticeText}>
                      We are finding an available technician near you. A certified specialist will be assigned shortly.
                    </Text>
                  </View>

                  <View style={styles.pendingActionsRow}>
                    <TouchableOpacity
                      style={styles.radarStatusBtn}
                      onPress={() =>
                        navigation.navigate('FindingTechnician', {
                          requestId: activeRequest.id || activeRequest.tracking_code,
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <AppIcon name="Compass" size={14} color="#FFFFFF" />
                      <Text style={styles.radarStatusBtnText}>View Status</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.cancelReqBtn, isCancelling && { opacity: 0.6 }]}
                      onPress={handleCancelActiveRequest}
                      activeOpacity={0.7}
                      disabled={isCancelling}
                    >
                      <Text style={styles.cancelReqBtnText}>
                        {isCancelling ? 'Cancelling...' : 'Cancel Request'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : activeRequest.status === 'assigned' ? (
                // STATE 2: Technician assigned & preparing
                <View style={styles.assignedTechInfoBox}>
                  <View style={styles.assignedTechRow}>
                    <View style={styles.techAvatarCircle}>
                      <Text style={styles.techAvatarInitials}>
                        {(activeRequest.technician_name || activeRequest.technicianName || activeRequest.technician?.name || 'Tech')
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.assignedTechName}>
                        {activeRequest.technician_name || activeRequest.technicianName || activeRequest.technician?.name || 'Assigned Partner Specialist'}
                      </Text>
                      <Text style={styles.assignedTechVehicle}>
                        {activeRequest.technician_vehicle || activeRequest.technicianVehicle || activeRequest.technician?.vehicleInfo || 'Mobile Service Van'} • Preparing tools
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.activeReqTrackBtn}
                    onPress={() =>
                      navigation.navigate('TechnicianAssigned', {
                        request: activeRequest,
                        requestId: activeRequest.id || activeRequest.tracking_code,
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.activeReqTrackText}>View Booking →</Text>
                  </TouchableOpacity>
                </View>
              ) : (activeRequest.status === 'arrived' || activeRequest.status === 'in_progress') ? (
                // STATE 3 & 4: TECHNICIAN ARRIVED OR IN PROGRESS (WORK COMPLETION SECURITY PIN DISPLAY)
                <View style={styles.arrivedNoticeBox}>
                  <View style={styles.arrivedTopInfoRow}>
                    <View style={styles.arrivedAvatarCircle}>
                      <AppIcon name={activeRequest.status === 'in_progress' ? 'Wrench' : 'MapPin'} size={18} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.arrivedTechTitle}>
                        {activeRequest.technician?.name || activeRequest.technician_name || 'Technician'} {activeRequest.status === 'in_progress' ? 'is repairing your chair' : 'has arrived!'}
                      </Text>
                      <Text style={styles.arrivedTechSub}>
                        {activeRequest.technician?.rating ? `⭐ ${Number(activeRequest.technician.rating).toFixed(1)}` : '⭐ 4.9'} ({activeRequest.technician?.reviewsCount || '184'} Reviews) • {activeRequest.technician?.completedJobsCount || '184'}+ Repairs • {activeRequest.technician?.experienceYears || 8} Yrs Exp
                      </Text>
                    </View>
                  </View>

                  {/* Work Completion Security PIN Card */}
                  <View style={styles.pinCardContainer}>
                    <View style={styles.pinCardTopRow}>
                      <View style={styles.pinCardLabelRow}>
                        <AppIcon name="ShieldCheck" size={15} color="#15803D" />
                        <Text style={styles.pinCardLabelText}>WORK COMPLETION SECURITY PIN</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.copyPinPillBtn}
                        onPress={() => {
                          const pin = String(activeRequest.securityPin || activeRequest.security_pin || '8492');
                          if (Platform.OS === 'web') {
                            navigator?.clipboard?.writeText(pin);
                            window.alert(`Security PIN ${pin} copied to clipboard!`);
                          } else {
                            Alert.alert('PIN Copied', `Security PIN ${pin} copied.`);
                          }
                        }}
                        activeOpacity={0.75}
                      >
                        <AppIcon name="ClipboardList" size={13} color={Colors.secondaryCobalt} />
                        <Text style={styles.copyPinPillText}>Copy</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.pinDigitsRow}>
                      {String(activeRequest.securityPin || activeRequest.security_pin || '8492')
                        .split('')
                        .map((char: string, idx: number) => (
                          <View key={idx} style={styles.pinDigitTile}>
                            <Text style={styles.pinDigitNumber}>{char}</Text>
                          </View>
                        ))}
                    </View>

                    <Text style={styles.pinNoticeDescription}>
                      🔒 Share this PIN with {(activeRequest.technician?.name || activeRequest.technician_name || 'the technician').split(' ')[0]} ONLY after they complete your repair and your chair is tested.
                    </Text>
                  </View>

                  <View style={styles.arrivedActionButtonsRow}>
                    <TouchableOpacity
                      style={styles.arrivedGatePassPrimaryBtn}
                      onPress={() =>
                        navigation.navigate('TechnicianArrived', {
                          requestId: activeRequest.id || activeRequest.tracking_code || activeRequest.trackingCode,
                          technicianName: activeRequest.technician?.name || activeRequest.technician_name,
                          technicianPhone: activeRequest.technician?.phone || activeRequest.technician_phone,
                        })
                      }
                      activeOpacity={0.85}
                    >
                      <AppIcon name="User" size={16} color="#FFFFFF" />
                      <Text style={styles.arrivedGatePassBtnText}>Technician Profile & Live Status →</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.arrivedAuxBtn}
                      onPress={() =>
                        navigation.navigate('ChatWithTechnician', {
                          requestId: activeRequest.id || activeRequest.tracking_code || activeRequest.trackingCode,
                          recipientName: activeRequest.technician?.name || activeRequest.technician_name || 'Technician',
                          technicianPhone: activeRequest.technician?.phone || activeRequest.technician_phone,
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <AppIcon name="MessageSquare" size={16} color={Colors.secondaryCobalt} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.arrivedAuxBtn}
                      onPress={() => {
                        const phone = activeRequest.technician?.phone || activeRequest.technician_phone || '+91 98765 43210';
                        phoneCallService.callNumber(phone, activeRequest.technician?.name || activeRequest.technician_name);
                      }}
                      activeOpacity={0.8}
                    >
                      <AppIcon name="Phone" size={16} color={Colors.secondaryCobalt} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // STATE 4: Dispatched En Route or In Progress
                <View style={styles.activeReqFooter}>
                  <View style={{ gap: 2 }}>
                    <Text style={styles.activeReqTech}>
                      {activeRequest.technician_name || activeRequest.technicianName || activeRequest.technician?.name || 'Partner Specialist'}
                    </Text>
                    <Text style={styles.activeReqVehicle}>
                      {activeRequest.status === 'in_route'
                        ? `On the way to your address (${activeRequest.time_slot || 'ASAP'})`
                        : 'Repairing your chair now'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.activeReqTrackBtn}
                    onPress={() =>
                      navigation.navigate('LiveTechnicianTracking', {
                        requestId: activeRequest.id || activeRequest.tracking_code,
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.activeReqTrackText}>Track Technician →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* 3. Search & Conversational Customer Question */}
          <Animated.View
            style={[
              styles.sectionWrapper,
              {
                opacity: searchOpacity,
                transform: [{ translateY: searchTranslateY }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>What can we help with?</Text>
              <Text style={styles.sectionSubtitle}>
                Select a service or search by issue
              </Text>
            </View>

            {/* Polished Search Bar */}
            <View style={styles.searchBarContainer}>
              <AppIcon name="Search" size={18} color={Colors.outline} />
              <TextInput
                style={styles.searchInput}
                placeholder='Search "broken wheel", "squeaky chair"...'
                placeholderTextColor={Colors.outline}
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel="Search services"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearchBtn}
                >
                  <AppIcon name="X" size={18} color={Colors.outline} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* 4. Responsive Service Categories Grid */}
          <Animated.View
            style={[
              styles.sectionWrapper,
              {
                opacity: gridOpacity,
                transform: [{ translateY: gridTranslateY }],
              },
            ]}
          >
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category.id;
                return (
                  <PressableScale
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.categoryCardSelected,
                    ]}
                    onPress={() => handleCategoryPress(category)}
                  >
                    <View
                      style={[
                        styles.categoryIconContainer,
                        { backgroundColor: category.iconBg },
                      ]}
                    >
                      <AppIcon
                        name={category.icon}
                        size={24}
                        color={category.accentColor}
                        strokeWidth={1.8}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryLabelText,
                        isSelected && styles.categoryLabelSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {category.label}
                    </Text>
                    <Text style={styles.categorySubText} numberOfLines={1}>
                      {category.sub}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </Animated.View>

          {/* 5. Popular Services Showcase */}
          <Animated.View
            style={[
              styles.sectionWrapper,
              {
                opacity: popularOpacity,
                transform: [{ translateY: popularTranslateY }],
              },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Popular Services</Text>
                <Text style={styles.sectionSubtitle}>
                  Most requested doorstep fixes
                </Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => setIsAllServicesModalOpen(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="View all services"
              >
                <Text style={styles.viewAllBtnText}>View all services</Text>
                <AppIcon name="ArrowRight" size={13} color={Colors.secondaryCobalt} />
              </TouchableOpacity>
            </View>

            <View style={styles.popularList}>
              {isLoadingServices ? (
                <View style={styles.emptyServicesCard}>
                  <Text style={styles.emptyServicesSubtitle}>Loading active services...</Text>
                </View>
              ) : displayedPopularServices.length === 0 ? (
                <View style={styles.emptyServicesCard}>
                  <AppIcon name="Info" size={24} color={Colors.outline} />
                  <Text style={styles.emptyServicesTitle}>No services available</Text>
                  <Text style={styles.emptyServicesSubtitle}>
                    {searchQuery
                      ? `No services matching "${searchQuery}"`
                      : 'No active services are currently listed by the administrator.'}
                  </Text>
                </View>
              ) : (
                <>
                  {displayedPopularServices.map((svc) => (
                    <PressableScale
                      key={svc.id}
                      style={styles.popularCard}
                      onPress={() => handleBookService(svc)}
                    >
                      <View style={styles.popularCardMain}>
                        <View
                          style={[
                            styles.popularIconBox,
                            { backgroundColor: svc.iconBg },
                          ]}
                        >
                          <AppIcon
                            name={svc.icon}
                            size={22}
                            color={Colors.secondaryCobalt}
                            strokeWidth={1.8}
                          />
                        </View>

                        <View style={styles.popularInfoCol}>
                          <View style={styles.popularTitleRow}>
                            <Text style={styles.popularTitle}>{svc.title}</Text>
                            {svc.badge && (
                              <View style={styles.tagBadge}>
                                <Text style={styles.tagBadgeText}>{svc.badge}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.popularDesc} numberOfLines={2}>
                            {svc.description}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.popularCardFooter}>
                        <View style={styles.priceRow}>
                          <Text style={styles.pricePrefix}>Starting</Text>
                          <Text style={styles.priceAmount}>{svc.price}</Text>
                          <Text style={styles.durationText}>• {svc.duration}</Text>
                        </View>

                        <View style={styles.bookCtaBtn}>
                          <Text style={styles.bookCtaText}>Book →</Text>
                        </View>
                      </View>
                    </PressableScale>
                  ))}

                  {!searchQuery && dynamicServicesList.length > 3 && (
                    <TouchableOpacity
                      style={styles.viewAllFooterCard}
                      onPress={() => setIsAllServicesModalOpen(true)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.viewAllFooterLeft}>
                        <View style={styles.viewAllFooterIconBox}>
                          <AppIcon name="Wrench" size={16} color={Colors.secondaryCobalt} />
                        </View>
                        <View style={styles.viewAllFooterTextCol}>
                          <Text style={styles.viewAllFooterTitle}>
                            +{dynamicServicesList.length - 3} more services available
                          </Text>
                          <Text style={styles.viewAllFooterSub}>
                            Tap to explore complete catalogue
                          </Text>
                        </View>
                      </View>
                      <View style={styles.viewAllFooterPill}>
                        <Text style={styles.viewAllFooterPillText}>See All</Text>
                        <AppIcon name="ChevronRight" size={13} color={Colors.secondaryCobalt} />
                      </View>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </Animated.View>

          {/* 6. The ChairCare Promise (Trust & Assurance) */}
          <View style={styles.promiseCard}>
            <View style={styles.promiseHeader}>
              <AppIcon name="ShieldCheck" size={18} />
              <Text style={styles.promiseTitle}>The ChairCare Promise</Text>
            </View>

            <View style={styles.promiseList}>
              <View style={styles.promiseItem}>
                <View style={styles.promiseDot} />
                <Text style={styles.promiseItemText}>
                  <Text style={styles.promiseBold}>90-Day Warranty: </Text>
                  All replacement cylinders, casters and repairs fully covered.
                </Text>
              </View>

              <View style={styles.promiseItem}>
                <View style={styles.promiseDot} />
                <Text style={styles.promiseItemText}>
                  <Text style={styles.promiseBold}>Verified Technicians: </Text>
                  Background-checked chair ergonomic specialists.
                </Text>
              </View>

              <View style={styles.promiseItem}>
                <View style={styles.promiseDot} />
                <Text style={styles.promiseItemText}>
                  <Text style={styles.promiseBold}>Zero Upfront Risk: </Text>
                  Pay only after your chair is repaired and tested.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Full All Services Catalogue Modal */}
      <Modal
        visible={isAllServicesModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsAllServicesModalOpen(false)}
      >
        <View style={styles.allServicesModalContainer}>
          {/* Top Modal Navigation Bar */}
          <View style={styles.allServicesModalHeader}>
            <TouchableOpacity
              style={styles.modalBackBtn}
              onPress={() => setIsAllServicesModalOpen(false)}
              activeOpacity={0.7}
              accessibilityLabel="Close all services"
            >
              <AppIcon name="X" size={20} color={Colors.onSurface} />
            </TouchableOpacity>
            <View style={styles.modalHeaderTitleCol}>
              <Text style={styles.modalHeaderTitle}>All Services</Text>
              <Text style={styles.modalHeaderSubtitle}>
                {dynamicServicesList.length} verified services configured by admin
              </Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Modal Search Bar */}
          <View style={styles.modalSearchSection}>
            <View style={styles.modalSearchBar}>
              <AppIcon name="Search" size={18} color={Colors.outline} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search across all services..."
                placeholderTextColor={Colors.outline}
                value={modalSearchQuery}
                onChangeText={setModalSearchQuery}
              />
              {modalSearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setModalSearchQuery('')}
                  style={styles.clearSearchBtn}
                >
                  <AppIcon name="X" size={16} color={Colors.outline} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Modal Services ScrollView */}
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {modalFilteredServices.length === 0 ? (
              <View style={styles.emptyServicesCard}>
                <AppIcon name="Info" size={24} color={Colors.outline} />
                <Text style={styles.emptyServicesTitle}>No services found</Text>
                <Text style={styles.emptyServicesSubtitle}>
                  {modalSearchQuery
                    ? `No services matching "${modalSearchQuery}"`
                    : 'No active services in the catalog.'}
                </Text>
              </View>
            ) : (
              modalFilteredServices.map((svc) => (
                <PressableScale
                  key={svc.id}
                  style={styles.popularCard}
                  onPress={() => {
                    setIsAllServicesModalOpen(false);
                    handleBookService(svc);
                  }}
                >
                  <View style={styles.popularCardMain}>
                    <View
                      style={[
                        styles.popularIconBox,
                        { backgroundColor: svc.iconBg },
                      ]}
                    >
                      <AppIcon
                        name={svc.icon}
                        size={22}
                        color={Colors.secondaryCobalt}
                        strokeWidth={1.8}
                      />
                    </View>

                    <View style={styles.popularInfoCol}>
                      <View style={styles.popularTitleRow}>
                        <Text style={styles.popularTitle}>{svc.title}</Text>
                        {svc.badge && (
                          <View style={styles.tagBadge}>
                            <Text style={styles.tagBadgeText}>{svc.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.popularDesc} numberOfLines={2}>
                        {svc.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.popularCardFooter}>
                    <View style={styles.priceRow}>
                      <Text style={styles.pricePrefix}>Starting</Text>
                      <Text style={styles.priceAmount}>{svc.price}</Text>
                      <Text style={styles.durationText}>• {svc.duration}</Text>
                    </View>

                    <View style={styles.bookCtaBtn}>
                      <Text style={styles.bookCtaText}>Book →</Text>
                    </View>
                  </View>
                </PressableScale>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  brandIconText: {
    fontSize: 20,
  },
  brandTitleCol: {
    justifyContent: 'center',
  },
  brandMainTitle: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
    lineHeight: 22,
  },
  brandAccent: {
    color: Colors.secondaryCobalt,
  },
  brandTagline: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    position: 'relative',
    ...Shadows.level1,
  },
  headerActionIcon: {
    fontSize: 17,
  },
  unreadDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.secondaryCobalt,
  },
  profileAvatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  profileAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileAvatarInitials: {
    ...Typography.labelMd,
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    ...Shadows.level1,
  },
  headerLoginBtnText: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centerWrapper: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },
  heroContainer: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.xxl,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.level3,
  },
  heroGlowCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroLeftCol: {
    flex: 1,
    gap: 6,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
    marginBottom: 2,
  },
  heroBadgeIcon: {
    fontSize: 10,
  },
  heroBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: '#93C5FD',
    letterSpacing: 0.6,
  },
  heroHeadline: {
    ...Typography.headlineMd,
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  heroSubtext: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
  },
  heroArtworkCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroChairCard: {
    width: 118,
    height: 136,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
    ...Shadows.level2,
  },
  heroChairImage: {
    width: '100%',
    height: '100%',
  },
  heroTopTag: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
    gap: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  heroTopTagText: {
    ...Typography.labelMono,
    fontSize: 8,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.4,
  },
  heroFloatBadge: {
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
    ...Shadows.level1,
  },
  heroFloatCheck: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  heroFloatText: {
    ...Typography.labelMono,
    fontSize: 8.5,
    fontWeight: '800',
    color: '#4ADE80',
    letterSpacing: 0.3,
  },
  heroTrustStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: BorderRadius.lg,
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustIcon: {
    fontSize: 12,
  },
  trustText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  trustDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  activeRequestBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
    ...Shadows.level1,
  },
  activeRequestBoxPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  activeRequestBoxAssigned: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  activeRequestBoxArrived: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#22C55E',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  activeReqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeReqBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  activeReqBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  activeReqBadgeAssigned: {
    backgroundColor: '#DCFCE7',
  },
  activeReqBadgeArrived: {
    backgroundColor: '#DCFCE7',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  activeReqBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  activeReqEta: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
  },
  activeReqChair: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  activeReqServiceTitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  pendingRadarNoticeBox: {
    backgroundColor: 'rgba(254, 243, 199, 0.6)',
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  radarNoticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  pendingRadarNoticeText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    lineHeight: 17,
  },
  pendingActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 2,
  },
  radarStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
  },
  radarStatusBtnText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelReqBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
  },
  cancelReqBtnText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  assignedTechInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 4,
  },
  assignedTechRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  techAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  techAvatarInitials: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  assignedTechName: {
    ...Typography.titleLg,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  assignedTechVehicle: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  arrivedNoticeBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: BorderRadius.lg,
    padding: 12,
    gap: 10,
  },
  arrivedTopInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  arrivedAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivedTechTitle: {
    ...Typography.titleLg,
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  arrivedTechSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 15,
  },
  arrivedActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  arrivedGatePassPrimaryBtn: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    ...Shadows.level1,
  },
  arrivedGatePassBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  arrivedAuxBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCardContainer: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: BorderRadius.md,
    padding: 10,
    gap: 8,
  },
  pinCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pinCardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinCardLabelText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  copyPinPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  copyPinPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  pinDigitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  pinDigitTile: {
    width: 44,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  pinDigitNumber: {
    ...Typography.titleLg,
    fontSize: 22,
    fontWeight: '900',
    color: '#166534',
    letterSpacing: 1,
  },
  pinNoticeDescription: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 15,
  },
  activeReqFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  activeReqTech: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  activeReqVehicle: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.secondaryCobalt,
    fontWeight: '600',
  },
  activeReqTrackBtn: {
    backgroundColor: Colors.secondaryCobalt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  activeReqTrackText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionWrapper: {
    gap: 12,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.titleLg,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  popularBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  popularBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    gap: 10,
    ...Shadows.level1,
  },
  searchIcon: {
    fontSize: 17,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMd,
    fontSize: 14,
    color: Colors.onSurface,
    height: '100%',
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 14,
    color: Colors.outline,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '22.8%',
    minWidth: 74,
    flexGrow: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    gap: 4,
    ...Shadows.level1,
  },
  categoryCardSelected: {
    borderColor: Colors.secondaryCobalt,
    backgroundColor: '#F0F7FF',
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryLabelText: {
    ...Typography.bodySm,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: Colors.secondaryCobalt,
  },
  categorySubText: {
    ...Typography.labelMono,
    fontSize: 8,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  popularList: {
    gap: 12,
  },
  popularCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    gap: 12,
    ...Shadows.level1,
  },
  popularCardMain: {
    flexDirection: 'row',
    gap: 12,
  },
  popularIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularIcon: {
    fontSize: 20,
  },
  popularInfoCol: {
    flex: 1,
    gap: 4,
  },
  popularTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  popularTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
    flex: 1,
  },
  tagBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tagBadgeText: {
    ...Typography.labelMono,
    fontSize: 8,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
  },
  popularDesc: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 17,
  },
  popularCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  pricePrefix: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  priceAmount: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  durationText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  bookCtaBtn: {
    backgroundColor: Colors.secondaryCobalt,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.lg,
    ...Shadows.level1,
  },
  bookCtaText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  promiseCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xxl,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    marginTop: 4,
  },
  promiseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promiseShieldIcon: {
    fontSize: 18,
  },
  promiseTitle: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  promiseList: {
    gap: 8,
  },
  promiseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  promiseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.secondaryCobalt,
    marginTop: 6,
  },
  promiseItemText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
    flex: 1,
  },
  promiseBold: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  emptyServicesCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    marginVertical: 8,
  },
  emptyServicesTitle: {
    ...Typography.titleMedium,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  emptyServicesSubtitle: {
    ...Typography.bodySm,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  viewAllBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  viewAllFooterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    marginTop: 4,
    ...Shadows.level1,
  },
  viewAllFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  viewAllFooterIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllFooterTextCol: {
    flex: 1,
    gap: 2,
  },
  viewAllFooterTitle: {
    ...Typography.titleMedium,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  viewAllFooterSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  viewAllFooterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  viewAllFooterPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  allServicesModalContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  allServicesModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 48,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  modalBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitleCol: {
    alignItems: 'center',
    flex: 1,
  },
  modalHeaderTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  modalHeaderSubtitle: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  modalSearchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurface,
    height: '100%',
  },
  modalScrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
});
