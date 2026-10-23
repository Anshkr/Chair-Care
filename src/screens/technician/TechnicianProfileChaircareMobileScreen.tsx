import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeSwitchButton } from '../../components/common/ThemeSwitchButton';
import { TechnicianHeaderAvatar } from '../../components/common/TechnicianHeaderAvatar';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useTechnician } from '../../context/TechnicianContext';
import { technicianApi } from '../../services/api/technicianApi';
import { ChangePasswordModal } from '../../components/common/ChangePasswordModal';
import { phoneCallService } from '../../services/phone/phoneCallService';

const PRESET_TECHNICIAN_AVATARS = [
  { id: '1', label: 'Field Specialist', uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
  { id: '2', label: 'Fleet Supervisor', uri: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80' },
  { id: '3', label: 'Diagnostics Lead', uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80' },
  { id: '4', label: 'Fleet Expert', uri: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80' },
  { id: '5', label: 'Ergonomic Tech', uri: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80' },
  { id: '6', label: 'Master Engineer', uri: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80' },
];

interface TechnicianProfileProps {
  navigation?: any;
}

export const TechnicianProfileChaircareMobileScreen: React.FC<TechnicianProfileProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { currentUser, logout, updateTechnicianProfile } = useAuth();
  const { isOnline } = useTechnician();

  const [profile, setProfile] = useState<any>(null);
  const [experience] = useState<string>('Certified Ergonomic Specialist');
  const [serviceRadius, setServiceRadius] = useState<string>('15 km radius');

  // Edit Profile Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editZone, setEditZone] = useState('');
  const [editVehicle, setEditVehicle] = useState('');
  const [editExpYears, setEditExpYears] = useState('6');
  const [tempAvatarUrl, setTempAvatarUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Specializations Modal State
  const ALL_SPECS = [
    'Repair',
    'Installation',
    'Maintenance',
    'Hydraulic Replacement',
    'Tilt Calibration',
    'Caster Overhaul',
    'Armrest Repair',
    'Gas Lift Tuning',
    'Multi-Angle Tilt Lock',
    'Herman Miller & Steelcase',
    'Full Ergonomic Spa & Wash',
  ];
  const [specializationsModalVisible, setSpecializationsModalVisible] = useState(false);
  const [specsList, setSpecsList] = useState<string[]>([
    'Repair',
    'Installation',
    'Maintenance',
    'Hydraulic Replacement',
    'Tilt Calibration',
    'Caster Overhaul',
  ]);
  const [isSavingSpecs, setIsSavingSpecs] = useState(false);

  // Working Areas & Radius State
  const ALL_ZONES = [
    'South Delhi & Saket',
    'Gurugram Cyber City & Golf Course Rd',
    'Central Delhi & Connaught Place',
    'Noida & Greater Noida Express Corridor',
    'West Delhi & Dwarka',
  ];
  const ALL_RADII = ['5 km radius', '10 km radius', '15 km radius', '25 km radius'];
  const [workingAreasModalVisible, setWorkingAreasModalVisible] = useState(false);
  const [selectedZone, setSelectedZone] = useState('South Delhi & Saket');
  const [selectedRadius, setSelectedRadius] = useState('15 km radius');
  const [isSavingZone, setIsSavingZone] = useState(false);

  // Bank & Payout State
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [bankAccount, setBankAccount] = useState('•••• •••• 4921');
  const [bankIfsc, setBankIfsc] = useState('HDFC0001234');
  const [bankUpi, setBankUpi] = useState('ravi.verma@okhdfcbank');

  // Notifications State
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [pushChimes, setPushChimes] = useState(true);
  const [urgentDispatches, setUrgentDispatches] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);

  // Help & Support State
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // Quick Preferences State (Sliders button)
  const [prefModalVisible, setPrefModalVisible] = useState(false);
  const [autoAcceptPriority, setAutoAcceptPriority] = useState(false);
  const [soundOnAlert, setSoundOnAlert] = useState(true);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const res = await technicianApi.getProfile();
        if (res.success && res.data && isMounted) {
          setProfile(res.data);
          if (res.data.specializations) {
            const parsed = res.data.specializations
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean);
            if (parsed.length > 0) setSpecsList(parsed);
          }
          if (res.data.currentZone) {
            setSelectedZone(res.data.currentZone);
          }
        }
      } catch (err) {
        // silent
      }
    };
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const techName = profile?.name || currentUser?.name || 'Technician';
  const phone = profile?.phone || currentUser?.phone || '+91 98000 00000';
  const email = profile?.email || currentUser?.email || 'tech@chaircare.pro';
  const rating = profile?.rating ? Number(profile.rating).toFixed(1) : '5.0';
  const completedCount = profile?.completedJobsCount ?? 0;
  const currentAvatarUri = currentUser?.avatarUrl || profile?.avatarUrl;
  const techZone = selectedZone || profile?.currentZone || 'South Delhi & Saket';
  const techVehicle = profile?.vehicleInfo || 'ChairCare Express Mobile Unit #4';
  const techExpYears = profile?.experienceYears ? `${profile.experienceYears} Yrs` : '6 Yrs';

  const handleOpenEditModal = () => {
    setEditName(techName);
    setEditEmail(email);
    setEditPhone(phone);
    setEditZone(techZone);
    setEditVehicle(techVehicle);
    setEditExpYears(String(profile?.experienceYears || 6));
    setTempAvatarUrl(currentAvatarUri || '');
    setEditModalVisible(true);
  };

  const handlePickImage = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          if (file.size > 5 * 1024 * 1024) {
            Alert.alert('File Too Large', 'Please select an image smaller than 5 MB.');
            return;
          }
          const reader = new FileReader();
          reader.onload = (uploadEvent: any) => {
            const base64Data = uploadEvent.target.result;
            setTempAvatarUrl(base64Data);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      Alert.alert('Upload Photo', 'Please select one of the curated fleet avatars below.');
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required Field', 'Please enter your technician display name.');
      return;
    }
    setIsSaving(true);
    const expNum = parseInt(editExpYears, 10);
    const res = await updateTechnicianProfile({
      name: editName.trim(),
      currentZone: editZone.trim(),
      vehicleInfo: editVehicle.trim(),
      experienceYears: isNaN(expNum) ? undefined : expNum,
      avatarUrl: tempAvatarUrl !== undefined ? (tempAvatarUrl === '' ? '__REMOVE__' : tempAvatarUrl) : undefined,
    });
    setIsSaving(false);

    if (res.success) {
      setProfile((prev: any) => ({
        ...prev,
        name: editName.trim(),
        currentZone: editZone.trim(),
        vehicleInfo: editVehicle.trim(),
        experienceYears: isNaN(expNum) ? prev?.experienceYears : expNum,
        avatarUrl: tempAvatarUrl === '__REMOVE__' ? undefined : tempAvatarUrl,
      }));
      setEditModalVisible(false);
      Alert.alert('Profile Updated', 'Your technician profile and photo have been updated successfully.');
    } else {
      Alert.alert('Update Failed', res.error || 'Failed to update technician profile.');
    }
  };

  const handleToggleSpec = (spec: string) => {
    setSpecsList((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleSaveSpecs = async () => {
    setIsSavingSpecs(true);
    try {
      const res = await technicianApi.updateProfile({
        specializations: specsList,
      });
      if (res.success) {
        setProfile((prev: any) => ({
          ...prev,
          specializations: specsList,
        }));
        setSpecializationsModalVisible(false);
        Alert.alert('Specializations Updated', 'Your qualified service specializations have been saved.');
      } else {
        Alert.alert('Update Failed', res.error || 'Could not save specializations.');
      }
    } catch {
      Alert.alert('Update Failed', 'Unable to save specializations right now. Please try again.');
    } finally {
      setIsSavingSpecs(false);
    }
  };

  const handleSaveWorkingArea = async () => {
    setIsSavingZone(true);
    try {
      const res = await technicianApi.updateProfile({
        currentZone: selectedZone,
      });
      if (res.success) {
        setProfile((prev: any) => ({
          ...prev,
          currentZone: selectedZone,
        }));
        setServiceRadius(selectedRadius);
        setWorkingAreasModalVisible(false);
        Alert.alert('Working Corridor Updated', `Primary zone set to ${selectedZone} with ${selectedRadius}.`);
      } else {
        Alert.alert('Update Failed', res.error || 'Could not update working zone.');
      }
    } catch {
      Alert.alert('Update Failed', 'Unable to update working zone right now. Please try again.');
    } finally {
      setIsSavingZone(false);
    }
  };

  const handleSaveBankDetails = () => {
    setBankModalVisible(false);
    Alert.alert('Payout Settings Saved', 'Your instant settlement bank and UPI account have been confirmed.');
  };

  const handleOpenAvailability = () => {
    if (navigation?.navigate) {
      try {
        navigation.navigate('TechnicianAvailability');
        return;
      } catch {
        // fallback
      }
    }
    if (navigation?.getParent?.()?.navigate) {
      try {
        navigation.getParent().navigate('TechnicianAvailability');
        return;
      } catch {
        // fallback
      }
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <View style={styles.screenContainer}>
      {/* Top Header with fixed BrandLogo */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <BrandLogo size={34} containerStyle={{ marginRight: 8 }} />
          <View>
            <Text style={styles.brandSubtitle}>CHAIRCARE • FIELD PARTNER</Text>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <ThemeSwitchButton variant="header" style={{ marginRight: 6 }} />
          <TouchableOpacity
            style={styles.tuneButton}
            onPress={() => setPrefModalVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel="Preferences"
          >
            <AppIcon name="Sliders" size={18} />
          </TouchableOpacity>

          <TechnicianHeaderAvatar size={38} onPress={handleOpenEditModal} />
        </View>
      </View>

      {/* Main Scrollable Body */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 80, 100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Profile Header Hero */}
        <View style={styles.profileHeroCard}>
          <View style={styles.ambientGlow} />

          {/* Avatar with Camera Badge */}
          <View style={styles.avatarWrapper}>
            <TouchableOpacity
              style={styles.avatarBorder}
              onPress={handleOpenEditModal}
              activeOpacity={0.85}
            >
              {currentAvatarUri ? (
                <Image
                  source={{ uri: currentAvatarUri }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarInitialsBox}>
                  <Text style={styles.avatarInitialsBoxText}>
                    {(techName || 'T').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cameraBadgeBtn}
              onPress={handleOpenEditModal}
              activeOpacity={0.85}
            >
              <AppIcon name="Camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Technician Name & Verified Badge */}
          <Text style={styles.techNameText}>{techName}</Text>
          <View style={styles.verifiedSpecialistPill}>
            <AppIcon name="Check" size={18} />
            <Text style={styles.verifiedSpecialistText}>Verified Fleet Specialist</Text>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statCol}
              onPress={() => navigation?.navigate?.('ReviewsRatings')}
              activeOpacity={0.7}
            >
              <View style={styles.statValRow}>
                <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.statNum}>{rating}</Text>
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </TouchableOpacity>

            <View style={[styles.statCol, styles.statColMiddle]}>
              <View style={styles.statValRow}>
                <AppIcon name="Check" size={18} />
                <Text style={styles.statNum}>{completedCount}</Text>
              </View>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            <View style={styles.statCol}>
              <View style={styles.statValRow}>
                <AppIcon name="Award" size={18} color="#D97706" />
                <Text style={styles.statNum}>{techExpYears}</Text>
              </View>
              <Text style={styles.statLabel}>Active Exp.</Text>
            </View>
          </View>

          {/* Edit Profile Action */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={handleOpenEditModal}
            activeOpacity={0.8}
          >
            <AppIcon name="Edit" size={18} />
            <Text style={styles.editProfileBtnText}>Edit Public Profile & Photo</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Professional Information Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Professional Credentials</Text>
            <Text style={styles.fieldIdText}>FIELD ID: 884-DL</Text>
          </View>

          <View style={styles.metaListCol}>
            {/* Phone */}
            <View style={styles.metaLine}>
              <View style={styles.metaLineLeft}>
                <AppIcon name="Phone" size={18} />
                <Text style={styles.metaLineLabel}>Phone</Text>
              </View>
              <View style={styles.metaLineRight}>
                <Text style={styles.metaLineValMono}>{phone}</Text>
                <AppIcon name="Check" size={18} />
              </View>
            </View>

            {/* Email */}
            <View style={styles.metaLine}>
              <View style={styles.metaLineLeft}>
                <AppIcon name="Mail" size={18} />
                <Text style={styles.metaLineLabel}>Email</Text>
              </View>
              <Text style={styles.metaLineVal}>{email}</Text>
            </View>

            {/* Experience */}
            <View style={styles.metaLine}>
              <View style={styles.metaLineLeft}>
                <AppIcon name="FileText" size={16} color={Colors.onSurfaceVariant} />
                <Text style={styles.metaLineLabel}>Experience</Text>
              </View>
              <Text style={styles.metaLineVal}>{profile?.experienceYears ? `${profile.experienceYears} Years Specialized Calibration` : experience}</Text>
            </View>

            {/* Fleet Vehicle */}
            <View style={styles.metaLine}>
              <View style={styles.metaLineLeft}>
                <AppIcon name="Truck" size={18} />
                <Text style={styles.metaLineLabel}>Fleet Vehicle</Text>
              </View>
              <Text style={styles.metaLineVal}>{techVehicle}</Text>
            </View>

            {/* Service Corridor */}
            <View style={styles.corridorContainer}>
              <View style={styles.metaLineLeft}>
                <AppIcon name="MapPin" size={18} />
                <Text style={styles.metaLineLabel}>Service Corridor</Text>
              </View>
              <View style={styles.corridorSubRow}>
                <Text style={styles.metaLineVal}>{techZone}</Text>
                <View style={styles.radiusPill}>
                  <Text style={styles.radiusPillText}>{serviceRadius}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Qualified Specializations Tag Cloud */}
          <View style={styles.specializationsContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.specializationsTagLabel}>
                QUALIFIED SPECIALIZATIONS
              </Text>
              <TouchableOpacity
                onPress={() => setSpecializationsModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={{ ...Typography.labelMono, fontSize: 10, color: Colors.secondaryCobalt, fontWeight: '700' }}>
                  CONFIGURE ›
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tagsWrap}>
              {specsList.map((spec) => (
                <TouchableOpacity
                  key={spec}
                  onPress={() => setSpecializationsModalVisible(true)}
                  activeOpacity={0.75}
                  style={[
                    styles.specTag,
                    ['Hydraulic Replacement', 'Tilt Calibration'].includes(spec) && styles.specTagHighlight,
                  ]}
                >
                  <View style={styles.blueDot} />
                  <Text
                    style={[
                      styles.specTagText,
                      ['Hydraulic Replacement', 'Tilt Calibration'].includes(spec) && styles.specTagTextHighlight,
                    ]}
                  >
                    {spec}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 4. Account & Operations Settings Menu */}
        <View style={styles.menuCard}>
          <View style={styles.menuHeader}>
            <Text style={styles.sectionTitle}>Fleet Operations & Account</Text>
          </View>

          <View style={styles.menuItemsList}>
            {/* Personal Info */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={handleOpenEditModal}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconBox}>
                  <Text style={styles.menuIcon}>🪪</Text>
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuItemTitle}>Personal Information</Text>
                  <Text style={styles.menuItemSub}>
                    Name, technician avatar & contact info
                  </Text>
                </View>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            {/* Service Specializations */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => setSpecializationsModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconBox}>
                  <AppIcon name="Wrench" size={18} />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuItemTitle}>Service Specializations</Text>
                  <Text style={styles.menuItemSub}>
                    Qualified mechanical skills & unit rates
                  </Text>
                </View>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            {/* Availability & Working Hours */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={handleOpenAvailability}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconBox}>
                  <AppIcon name="Clock" size={18} />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuItemTitle}>Availability & Working Hours</Text>
                  <Text style={styles.menuItemSub}>
                    Shift schedules & designated time-off
                  </Text>
                </View>
              </View>
              <View style={styles.menuItemRightGroup}>
                <View style={isOnline ? styles.onlinePill : styles.offlinePill}>
                  <Text style={styles.onlinePillText}>
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </Text>
                </View>
                <Text style={styles.chevronIcon}>›</Text>
              </View>
            </TouchableOpacity>

            {/* Working Areas */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => setWorkingAreasModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconBox}>
                  <AppIcon name="MapPin" size={18} />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuItemTitle}>Working Areas & Dispatch Radius</Text>
                  <Text style={styles.menuItemSub}>
                    {selectedZone} • {selectedRadius}
                  </Text>
                </View>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            {/* Bank & Payout Details */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => setBankModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconBox}>
                  <AppIcon name="Landmark" size={18} />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuItemTitle}>Bank & Payout Details</Text>
                  <Text style={styles.menuItemSub}>
                    HDFC Bank • Instant UPI ({bankUpi})
                  </Text>
                </View>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            {/* Notifications */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => setNotifModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconBox}>
                  <AppIcon name="Bell" size={18} />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuItemTitle}>Notifications & Job Alerts</Text>
                  <Text style={styles.menuItemSub}>
                    Push chimes, urgent corporate dispatches
                  </Text>
                </View>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            {/* Help & Support */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => setHelpModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconBox}>
                  <AppIcon name="Headphones" size={18} color={Colors.onSurfaceVariant} />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuItemTitle}>Help & Support</Text>
                  <Text style={styles.menuItemSub}>
                    24/7 Technician Fleet Operations Hotline
                  </Text>
                </View>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            {/* Change Password */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => setChangePasswordModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconBox}>
                  <AppIcon name="Lock" size={18} color={Colors.primary} />
                </View>
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuItemTitle}>Change Password</Text>
                  <Text style={styles.menuItemSub}>
                    Update field technician account login password
                  </Text>
                </View>
              </View>
              <View style={styles.menuItemRightGroup}>
                <View style={styles.offlinePill}>
                  <Text style={styles.onlinePillText}>SECURITY</Text>
                </View>
                <Text style={styles.chevronIcon}>›</Text>
              </View>
            </TouchableOpacity>

          </View>
        </View>

        {/* 5. App Info & Compliance */}
        <View style={styles.appInfoContainer}>
          <View style={styles.appNameRow}>
            <BrandLogo size={22} containerStyle={{ marginRight: 6 }} />
            <Text style={styles.appNameText}>ChairCare Technician</Text>
          </View>
          <Text style={styles.appVersionText}>
            Version 1.0.0 (Build 520) • BIFMA Compliance Protocol v4.2
          </Text>
        </View>

        {/* 6. Non-Destructive Log Out Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <AppIcon name="LogOut" size={18} />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Technician Edit Profile & Photo Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setEditModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.editModalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Edit Technician Profile</Text>
                <Text style={styles.modalHeaderSubtitle}>Update photo, corridor, vehicle & credentials</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalScrollView} showsVerticalScrollIndicator={false}>
              {/* Photo Avatar Editor */}
              <View style={styles.avatarEditSection}>
                <View style={styles.avatarPreviewContainer}>
                  {tempAvatarUrl ? (
                    <Image source={{ uri: tempAvatarUrl }} style={styles.modalAvatarPreview} />
                  ) : (
                    <View style={styles.modalAvatarPlaceholder}>
                      <Text style={styles.modalAvatarPlaceholderText}>
                        {(techName || 'T').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.modalAvatarOverlayBadge}
                    onPress={handlePickImage}
                    activeOpacity={0.8}
                  >
                    <AppIcon name="Camera" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.avatarEditActions}>
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={handlePickImage}
                    activeOpacity={0.8}
                  >
                    <AppIcon name="Upload" size={14} color={Colors.primary} />
                    <Text style={styles.uploadBtnText}>Upload from Device</Text>
                  </TouchableOpacity>

                  {Boolean(tempAvatarUrl) && (
                    <TouchableOpacity
                      style={styles.removePhotoBtn}
                      onPress={() => setTempAvatarUrl('')}
                      activeOpacity={0.7}
                    >
                      <AppIcon name="Trash2" size={13} color="#EF4444" />
                      <Text style={styles.removePhotoBtnText}>Remove Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Curated Preset Avatars */}
              <View style={styles.presetsSection}>
                <Text style={styles.sectionMiniLabel}>OR CHOOSE A FLEET SPECIALIST AVATAR</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
                  {PRESET_TECHNICIAN_AVATARS.map((item) => {
                    const isSelected = tempAvatarUrl === item.uri;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.presetItem, isSelected && styles.presetItemSelected]}
                        onPress={() => setTempAvatarUrl(item.uri)}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: item.uri }} style={styles.presetImage} />
                        {isSelected && (
                          <View style={styles.presetCheckBadge}>
                            <AppIcon name="Check" size={10} color="#FFFFFF" />
                          </View>
                        )}
                        <Text style={[styles.presetLabel, isSelected && styles.presetLabelSelected]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>FULL NAME *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Technician Full Name"
                    placeholderTextColor={Colors.onSurfaceVariant}
                  />
                </View>

                {/* Permanent Verified Fleet Credentials - Read Only */}
                <View style={styles.lockedCredentialsBox}>
                  <View style={styles.lockedHeaderRow}>
                    <View style={styles.lockedBadge}>
                      <AppIcon name="Lock" size={12} color="#64748B" />
                      <Text style={styles.lockedBadgeText}>FLEET ACCOUNT CREDENTIALS</Text>
                    </View>
                    <Text style={styles.lockedNotice}>Cannot be changed</Text>
                  </View>

                  <View style={styles.lockedFieldRow}>
                    <View style={styles.lockedFieldIconBox}>
                      <AppIcon name="Mail" size={14} color="#64748B" />
                    </View>
                    <View style={styles.lockedFieldCol}>
                      <Text style={styles.lockedFieldLabel}>EMAIL ADDRESS</Text>
                      <Text style={styles.lockedFieldValue} numberOfLines={1}>
                        {email || 'tech@chaircare.pro'}
                      </Text>
                    </View>
                    <View style={styles.verifiedCheckPill}>
                      <AppIcon name="Check" size={10} color="#16A34A" />
                      <Text style={styles.verifiedCheckText}>Verified</Text>
                    </View>
                  </View>

                  <View style={styles.lockedDivider} />

                  <View style={styles.lockedFieldRow}>
                    <View style={styles.lockedFieldIconBox}>
                      <AppIcon name="Phone" size={14} color="#64748B" />
                    </View>
                    <View style={styles.lockedFieldCol}>
                      <Text style={styles.lockedFieldLabel}>PHONE NUMBER</Text>
                      <Text style={styles.lockedFieldValue} numberOfLines={1}>
                        {phone || '+91 98000 00000'}
                      </Text>
                    </View>
                    <View style={styles.verifiedCheckPill}>
                      <AppIcon name="Check" size={10} color="#16A34A" />
                      <Text style={styles.verifiedCheckText}>Verified</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>SERVICE ZONE / CORRIDOR</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editZone}
                    onChangeText={setEditZone}
                    placeholder="e.g. Gurugram • Delhi NCR • Noida"
                    placeholderTextColor={Colors.onSurfaceVariant}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>FLEET VEHICLE / UNIT</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editVehicle}
                    onChangeText={setEditVehicle}
                    placeholder="e.g. ChairCare Mobile Lab #4"
                    placeholderTextColor={Colors.onSurfaceVariant}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>EXPERIENCE (YEARS)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editExpYears}
                    onChangeText={setEditExpYears}
                    placeholder="6"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity
                  style={styles.saveProfileBtn}
                  onPress={handleSaveProfile}
                  activeOpacity={0.88}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveProfileBtnText}>Save Technician Profile</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Service Specializations Modal */}
      <Modal
        visible={specializationsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSpecializationsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setSpecializationsModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.sheetModalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Service Specializations</Text>
                <Text style={styles.modalHeaderSubtitle}>Select qualified mechanical skills for dispatch</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSpecializationsModalVisible(false)}
              >
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360, marginVertical: 12 }} showsVerticalScrollIndicator={false}>
              {ALL_SPECS.map((spec) => {
                const isChecked = specsList.includes(spec);
                return (
                  <TouchableOpacity
                    key={spec}
                    style={[styles.specCheckRow, isChecked && styles.specCheckRowSelected]}
                    onPress={() => handleToggleSpec(spec)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.specCheckInfo}>
                      <View style={[styles.specCheckBox, isChecked && styles.specCheckBoxSelected]}>
                        {isChecked && <AppIcon name="Check" size={13} color="#FFFFFF" />}
                      </View>
                      <Text style={[styles.specItemText, isChecked && styles.specItemTextSelected]}>
                        {spec}
                      </Text>
                    </View>
                    <View style={styles.specRatePill}>
                      <Text style={styles.specRateText}>Verified Skill</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.saveProfileBtn}
              onPress={handleSaveSpecs}
              activeOpacity={0.88}
              disabled={isSavingSpecs}
            >
              {isSavingSpecs ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveProfileBtnText}>Save Specializations ({specsList.length})</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Working Areas & Dispatch Radius Modal */}
      <Modal
        visible={workingAreasModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setWorkingAreasModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setWorkingAreasModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.sheetModalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Working Areas & Radius</Text>
                <Text style={styles.modalHeaderSubtitle}>Configure active service corridor & express boundary</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setWorkingAreasModalVisible(false)}
              >
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380, marginVertical: 12 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionMiniLabel}>PRIMARY SERVICE CORRIDOR</Text>
              <View style={{ gap: 8, marginTop: 8, marginBottom: 16 }}>
                {ALL_ZONES.map((zone) => {
                  const isSelected = selectedZone === zone;
                  return (
                    <TouchableOpacity
                      key={zone}
                      style={[styles.radioItemRow, isSelected && styles.radioItemRowSelected]}
                      onPress={() => setSelectedZone(zone)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDotInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.radioLabelText, isSelected && styles.radioLabelTextSelected]}>
                          {zone}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sectionMiniLabel}>DISPATCH RADIUS BOUNDARY</Text>
              <View style={styles.radiusPillsWrap}>
                {ALL_RADII.map((radius) => {
                  const isSelected = selectedRadius === radius;
                  return (
                    <TouchableOpacity
                      key={radius}
                      style={[styles.radiusChoicePill, isSelected && styles.radiusChoicePillSelected]}
                      onPress={() => setSelectedRadius(radius)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.radiusChoicePillText, isSelected && styles.radiusChoicePillTextSelected]}>
                        {radius}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.saveProfileBtn}
              onPress={handleSaveWorkingArea}
              activeOpacity={0.88}
              disabled={isSavingZone}
            >
              {isSavingZone ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveProfileBtnText}>Apply Corridor Settings</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bank & Payout Details Modal */}
      <Modal
        visible={bankModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setBankModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setBankModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.sheetModalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Bank & Payout Details</Text>
                <Text style={styles.modalHeaderSubtitle}>Direct deposit & instant UPI settlement info</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setBankModalVisible(false)}
              >
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380, marginVertical: 12 }} showsVerticalScrollIndicator={false}>
              <View style={styles.bankStatusBanner}>
                <View style={styles.bankStatusIconBox}>
                  <AppIcon name="ShieldCheck" size={18} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bankStatusTitle}>Direct Payout Active</Text>
                  <Text style={styles.bankStatusSub}>Transferred directly to UPI or bank after job completion.</Text>
                </View>
              </View>

              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>INSTANT UPI ID (PRIMARY SETTLEMENT)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={bankUpi}
                    onChangeText={setBankUpi}
                    placeholder="technician@okhdfcbank"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>BANK ACCOUNT NUMBER</Text>
                  <TextInput
                    style={styles.textInput}
                    value={bankAccount}
                    onChangeText={setBankAccount}
                    placeholder="•••• •••• 4921"
                    placeholderTextColor={Colors.onSurfaceVariant}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>IFSC CODE</Text>
                  <TextInput
                    style={styles.textInput}
                    value={bankIfsc}
                    onChangeText={setBankIfsc}
                    placeholder="HDFC0001234"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => {
                  setBankModalVisible(false);
                  if (navigation?.navigate) {
                    navigation.navigate('Earnings');
                  }
                }}
                activeOpacity={0.8}
              >
                <AppIcon name="DollarSign" size={16} color={Colors.primary} />
                <Text style={styles.secondaryActionBtnText}>View Earnings & Ledger</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={styles.saveProfileBtn}
              onPress={handleSaveBankDetails}
              activeOpacity={0.88}
            >
              <Text style={styles.saveProfileBtnText}>Save Payout Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notifications & Job Alerts Modal */}
      <Modal
        visible={notifModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNotifModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setNotifModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.sheetModalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Notification Preferences</Text>
                <Text style={styles.modalHeaderSubtitle}>Configure job chimes & critical fleet dispatches</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setNotifModalVisible(false)}
              >
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 6, marginVertical: 14 }}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.toggleTitle}>Push Job Chimes</Text>
                  <Text style={styles.toggleSub}>Receive immediate loud chimes on new service invitations</Text>
                </View>
                <Switch
                  value={pushChimes}
                  onValueChange={setPushChimes}
                  trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.toggleTitle}>Urgent Corporate Dispatches</Text>
                  <Text style={styles.toggleSub}>Priority alerts for multi-chair corporate dispatches</Text>
                </View>
                <Switch
                  value={urgentDispatches}
                  onValueChange={setUrgentDispatches}
                  trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.toggleTitle}>Sound & Haptic Alerts</Text>
                  <Text style={styles.toggleSub}>Device audio and vibration alert on new assignments</Text>
                </View>
                <Switch
                  value={soundAlerts}
                  onValueChange={setSoundAlerts}
                  trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.toggleTitle}>WhatsApp Dispatch Alerts</Text>
                  <Text style={styles.toggleSub}>Receive job addresses & OTP reminders directly on WhatsApp</Text>
                </View>
                <Switch
                  value={whatsappUpdates}
                  onValueChange={setWhatsappUpdates}
                  trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => {
                  setNotifModalVisible(false);
                  if (navigation?.navigate) {
                    navigation.navigate('TechnicianNotifications');
                  }
                }}
                activeOpacity={0.8}
              >
                <AppIcon name="Bell" size={16} color={Colors.primary} />
                <Text style={styles.secondaryActionBtnText}>Open Notifications Inbox</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.saveProfileBtn}
              onPress={() => {
                setNotifModalVisible(false);
                Alert.alert('Preferences Saved', 'Your dispatch alert settings have been updated.');
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.saveProfileBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        visible={helpModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setHelpModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.sheetModalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Help & Fleet Support</Text>
                <Text style={styles.modalHeaderSubtitle}>24/7 dedicated technician assistance channels</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setHelpModalVisible(false)}
              >
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10, marginVertical: 14 }}>
              <TouchableOpacity
                style={styles.supportChannelBtn}
                onPress={() => {
                  setHelpModalVisible(false);
                  phoneCallService.callNumber('+91 1800 200 4892', 'Fleet Operations Hotline');
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.supportIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <AppIcon name="PhoneCall" size={20} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supportTitle}>Fleet Operations Hotline</Text>
                  <Text style={styles.supportSub}>Toll Free: 1800-200-4892 (Instant Response)</Text>
                </View>
                <AppIcon name="ChevronRight" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.supportChannelBtn}
                onPress={() => {
                  setHelpModalVisible(false);
                  Linking.openURL('https://wa.me/9118002004892?text=ChairCare%20Technician%20Support%20SOS').catch(() => {
                    Alert.alert('WhatsApp Support', 'Message +91 1800 200 4892');
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.supportIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <AppIcon name="MessageSquare" size={20} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supportTitle}>WhatsApp Fleet Desk</Text>
                  <Text style={styles.supportSub}>Live chat with Dispatch Coordinator</Text>
                </View>
                <AppIcon name="ChevronRight" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.supportChannelBtn}
                onPress={() => {
                  Alert.alert(
                    'SOS Breakdown Reported',
                    'A fleet coordinator has been notified of your location. Stay at your vehicle if safe.'
                  );
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.supportIconBox, { backgroundColor: '#FEF2F2' }]}>
                  <AppIcon name="AlertTriangle" size={20} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.supportTitle, { color: '#DC2626' }]}>Vehicle Breakdown / SOS</Text>
                  <Text style={styles.supportSub}>Report route emergency or equipment issue</Text>
                </View>
                <AppIcon name="ChevronRight" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.saveProfileBtn, { backgroundColor: '#475569' }]}
              onPress={() => setHelpModalVisible(false)}
              activeOpacity={0.88}
            >
              <Text style={styles.saveProfileBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Quick Preferences Modal (Top Sliders Button) */}
      <Modal
        visible={prefModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPrefModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setPrefModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.sheetModalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Fleet Preferences</Text>
                <Text style={styles.modalHeaderSubtitle}>Quick dispatch parameters and app settings</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setPrefModalVisible(false)}
              >
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 6, marginVertical: 14 }}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.toggleTitle}>Auto-Accept Priority Dispatches</Text>
                  <Text style={styles.toggleSub}>Instantly confirm high-priority jobs within 3 km corridor</Text>
                </View>
                <Switch
                  value={autoAcceptPriority}
                  onValueChange={setAutoAcceptPriority}
                  trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.toggleTitle}>Audible Job Alerts</Text>
                  <Text style={styles.toggleSub}>Play loud tone even when device is on silent/vibrate</Text>
                </View>
                <Switch
                  value={soundOnAlert}
                  onValueChange={setSoundOnAlert}
                  trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => {
                  setPrefModalVisible(false);
                  handleOpenAvailability();
                }}
                activeOpacity={0.8}
              >
                <AppIcon name="Calendar" size={16} color={Colors.primary} />
                <Text style={styles.secondaryActionBtnText}>Manage Shift Hours & Availability</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.saveProfileBtn}
              onPress={() => {
                setPrefModalVisible(false);
                Alert.alert('Preferences Saved', 'Fleet preferences successfully updated.');
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.saveProfileBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={changePasswordModalVisible}
        onClose={() => setChangePasswordModalVisible(false)}
        userRoleLabel="Technician Account"
      />
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
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: 18,
  },
  brandSubtitle: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...Typography.headlineSm,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tuneButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tuneIcon: {
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
  profileAvatarTopText: {
    fontSize: 14,
    color: Colors.onPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    gap: 14,
  },
  profileHeroCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 18,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  ambientGlow: {
    position: 'absolute',
    top: -20,
    width: 160,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 81, 213, 0.1)',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarBorder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    backgroundColor: Colors.surfaceContainerLow,
    ...Shadows.level1,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  cameraBadgeBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  cameraIcon: {
    fontSize: 14,
  },
  techNameText: {
    ...Typography.headlineSm,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  verifiedSpecialistPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  verifiedCheckIcon: {
    fontSize: 12,
    fontWeight: '900',
    color: '#005236',
  },
  verifiedSpecialistText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: '#005236',
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
    marginTop: 14,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statColMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.surfaceContainer,
  },
  statValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starIcon: {
    fontSize: 13,
  },
  taskIcon: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.secondaryCobalt,
  },
  badgeIcon: {
    fontSize: 13,
  },
  statNum: {
    ...Typography.headlineSm,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  statLabel: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    backgroundColor: Colors.surfaceContainer,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    marginTop: 14,
  },
  editIcon: {
    fontSize: 14,
  },
  editProfileBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  dispatcherTierCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.xl,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  tierGlowCircle: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(49, 107, 243, 0.2)',
  },
  tierTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  medalBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalIcon: {
    fontSize: 18,
  },
  dispatcherTierTag: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#dae2fd',
    letterSpacing: 0.8,
  },
  tierTitle: {
    ...Typography.headlineSm,
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 1,
  },
  topPercentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  topPercentText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '600',
    color: '#ffffff',
  },
  tierBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  shieldIcon: {
    fontSize: 14,
  },
  accreditationText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.surfaceContainerHigh,
    flex: 1,
    lineHeight: 15,
  },
  sectionCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  fieldIdText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  metaListCol: {
    gap: 10,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLineIcon: {
    fontSize: 14,
  },
  metaLineLabel: {
    ...Typography.bodySm,
    fontSize: 12.5,
    color: Colors.onSurfaceVariant,
  },
  metaLineRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaLineValMono: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  metaLineVal: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.onSurface,
  },
  verifiedGreenDot: {
    fontSize: 12,
    fontWeight: '900',
    color: '#00875a',
  },
  corridorContainer: {
    gap: 4,
  },
  corridorSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 22,
  },
  radiusPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  radiusPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  specializationsContainer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainer,
    gap: 8,
  },
  specializationsTagLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  specTagHighlight: {
    backgroundColor: '#dbe1ff',
  },
  blueDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.secondaryCobalt,
  },
  specTagText: {
    ...Typography.bodySm,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.onSurface,
  },
  specTagTextHighlight: {
    color: '#00174b',
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.level1,
  },
  menuHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  menuItemsList: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainer,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.03)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 16,
  },
  menuTextCol: {
    flex: 1,
  },
  menuItemTitle: {
    ...Typography.titleLg,
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  menuItemSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  menuItemRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlinePill: {
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  offlinePill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  onlinePillText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: '#005236',
  },
  chevronIcon: {
    fontSize: 18,
    color: Colors.outline,
    fontWeight: '700',
  },
  appInfoContainer: {
    alignItems: 'center',
    paddingVertical: 6,
    gap: 3,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appChairIcon: {
    fontSize: 15,
  },
  appNameText: {
    ...Typography.headlineSm,
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  appVersionText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
  },
  logoutIcon: {
    fontSize: 16,
  },
  logoutBtnText: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  topAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarInitialsBox: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsBoxText: {
    ...Typography.headlineSm,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 28,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  editModalCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: 20,
    ...Shadows.level3,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    ...Typography.titleLg,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  modalHeaderSubtitle: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainer,
  },
  editModalScrollView: {
    maxHeight: 480,
  },
  avatarEditSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    marginBottom: 12,
  },
  avatarPreviewContainer: {
    position: 'relative',
  },
  modalAvatarPreview: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.secondaryCobalt,
  },
  modalAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.secondaryCobalt,
  },
  modalAvatarPlaceholderText: {
    ...Typography.headlineSm,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  modalAvatarOverlayBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.secondaryCobalt,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarEditActions: {
    flex: 1,
    gap: 8,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
  },
  uploadBtnText: {
    ...Typography.titleLg,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
    fontSize: 12.5,
  },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
  },
  removePhotoBtnText: {
    ...Typography.bodySm,
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 11,
  },
  presetsSection: {
    marginBottom: 14,
  },
  sectionMiniLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  presetsRow: {
    gap: 12,
    paddingVertical: 4,
  },
  presetItem: {
    alignItems: 'center',
    gap: 4,
    position: 'relative',
    padding: 3,
    borderRadius: BorderRadius.md,
  },
  presetItemSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: Colors.secondaryCobalt,
  },
  presetImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  presetCheckBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.secondaryCobalt,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  presetLabel: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  presetLabelSelected: {
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  editForm: {
    gap: 12,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Typography.bodySm,
    fontSize: 13,
    color: Colors.onSurface,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  saveProfileBtn: {
    backgroundColor: Colors.secondaryCobalt,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    ...Shadows.level1,
  },
  saveProfileBtnText: {
    ...Typography.titleLg,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  lockedCredentialsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  lockedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  lockedBadgeText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  lockedNotice: {
    ...Typography.bodySm,
    fontSize: 9.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  lockedFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  lockedFieldIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedFieldCol: {
    flex: 1,
  },
  lockedFieldLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  lockedFieldValue: {
    ...Typography.bodySm,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  verifiedCheckPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
  },
  verifiedCheckText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  lockedDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  sheetModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '85%',
    ...Shadows.level3,
  },
  specCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  specCheckRowSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.secondaryCobalt,
  },
  specCheckInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  specCheckBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  specCheckBoxSelected: {
    backgroundColor: Colors.secondaryCobalt,
    borderColor: Colors.secondaryCobalt,
  },
  specItemText: {
    ...Typography.bodySm,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  specItemTextSelected: {
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  specRatePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  specRateText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '700',
  },
  radioItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radioItemRowSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.secondaryCobalt,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.secondaryCobalt,
  },
  radioDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.secondaryCobalt,
  },
  radioLabelText: {
    ...Typography.bodySm,
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  radioLabelTextSelected: {
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  radiusPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  radiusChoicePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  radiusChoicePillSelected: {
    backgroundColor: Colors.secondaryCobalt,
    borderColor: Colors.secondaryCobalt,
  },
  radiusChoicePillText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  radiusChoicePillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bankStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 12,
  },
  bankStatusIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankStatusTitle: {
    ...Typography.titleSm,
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  bankStatusSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#166534',
    marginTop: 1,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F0F4FF',
    borderWidth: 1,
    borderColor: '#D0E1FD',
    marginTop: 10,
  },
  secondaryActionBtnText: {
    ...Typography.titleSm,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  toggleTitle: {
    ...Typography.titleSm,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  toggleSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  supportChannelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  supportIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTitle: {
    ...Typography.titleSm,
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  supportSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
