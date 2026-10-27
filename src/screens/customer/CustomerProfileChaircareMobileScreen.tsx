import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { fileUriToBase64DataUrl } from '../../utils/fileUpload';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { ThemeSwitchButton } from '../../components/common/ThemeSwitchButton';
import { CustomerHeaderAvatar } from '../../components/common/CustomerHeaderAvatar';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { customerApi } from '../../services/api/customerApi';
import { sanitizeUserErrorMessage } from '../../services/api/apiClient';
import { adminSyncEmitter } from '../../services/adminSync';
import { ChangePasswordModal } from '../../components/common/ChangePasswordModal';
import { downloadInvoice, generateInvoiceHtml, InvoiceDetails } from '../../services/invoiceService';

import { SavedAddressItem } from './BookingStep3ServiceLocationChaircareMobileScreen';

const getAddressStorageKey = (userId?: string) => `chaircare_saved_addresses_${userId || 'guest'}`;

const loadSavedAddressesFromStorage = (userId?: string, defaultAddr?: string): SavedAddressItem[] => {
  let list: SavedAddressItem[] = [];
  let hasStoredValue = false;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(getAddressStorageKey(userId));
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          list = parsed.map((item: any, idx: number) => ({
            ...item,
            id: item.id || `addr_${Date.now()}_${idx}`,
          }));
          hasStoredValue = true;
        }
      }
    } catch {
      // fallback
    }
  }

  if (hasStoredValue) {
    // If the list is empty (user removed all addresses), preserve empty list
    if (list.length === 0) {
      return [];
    }
    if (defaultAddr && defaultAddr.trim()) {
      const trimmed = defaultAddr.trim();
      const existingIndex = list.findIndex(
        (a) => a.fullAddress.trim().toLowerCase() === trimmed.toLowerCase() || a.isDefault
      );
      if (existingIndex >= 0) {
        list[existingIndex] = {
          ...list[existingIndex],
          fullAddress: trimmed,
          isDefault: true,
        };
      }
    }
    return list;
  }

  if (defaultAddr && defaultAddr.trim()) {
    const trimmed = defaultAddr.trim();
    list = [
      {
        id: `addr_default_${userId || 'user'}`,
        tag: 'Home',
        label: 'Primary Address',
        flatNo: '',
        buildingName: '',
        streetArea: trimmed,
        city: '',
        state: '',
        pincode: '',
        fullAddress: trimmed,
        isDefault: true,
      },
    ];
  }
  return list;
};

const persistSavedAddressesToStorage = (addresses: SavedAddressItem[], userId?: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(getAddressStorageKey(userId), JSON.stringify(addresses));
    } catch {
      // ignore
    }
  }
};

const PRESET_CUSTOMER_AVATARS = [
  { id: '1', label: 'Executive', uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
  { id: '2', label: 'Professional', uri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80' },
  { id: '3', label: 'Designer', uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80' },
  { id: '4', label: 'Architect', uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
  { id: '5', label: 'Creative', uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80' },
  { id: '6', label: 'Consultant', uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80' },
];

/**
 * Screen ID: C22
 * Title: Customer Profile
 * Reference: design-reference/customer/customer_profile_chaircare_mobile
 * Full Privacy & Strict Authentication Enforcement
 */
export const CustomerProfileChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, currentUser, logout, setRole, updateUserProfile } = useAuth();

  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState<string | null>(null);
  const [infoModalContent, setInfoModalContent] = useState<string | null>(null);

  // Invoice Management States
  const [invoicesModalVisible, setInvoicesModalVisible] = useState(false);
  const [completedTickets, setCompletedTickets] = useState<any[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [previewInvoiceHtml, setPreviewInvoiceHtml] = useState<string | null>(null);
  const [previewInvoiceTitle, setPreviewInvoiceTitle] = useState<string>('Tax Invoice');
  const [activePreviewDetails, setActivePreviewDetails] = useState<InvoiceDetails | null>(null);

  // Live Metrics derived from real customer requests
  const [completedServicesCount, setCompletedServicesCount] = useState<number>(0);
  const [activeServicesCount, setActiveServicesCount] = useState<number>(0);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(false);

  // Saved Address Sheet & Sync States
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>([]);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressFormTag, setAddressFormTag] = useState<'Home' | 'Office' | 'Other'>('Home');
  const [addressFormLabel, setAddressFormLabel] = useState('Home');
  const [addressFormFlat, setAddressFormFlat] = useState('');
  const [addressFormBuilding, setAddressFormBuilding] = useState('');
  const [addressFormStreet, setAddressFormStreet] = useState('');
  const [addressFormCity, setAddressFormCity] = useState('');
  const [addressFormState, setAddressFormState] = useState('');
  const [addressFormPincode, setAddressFormPincode] = useState('');
  const [addressFormFullText, setAddressFormFullText] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isGpsLocating, setIsGpsLocating] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<SavedAddressItem | null>(null);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);

  // Profile editing fields
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editAddress, setEditAddress] = useState(currentUser?.defaultAddress || '');
  const [tempAvatarUrl, setTempAvatarUrl] = useState<string>(currentUser?.avatarUrl || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);

  // Synchronize edit fields when currentUser updates
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || '');
      setEditEmail(currentUser.email || '');
      setEditPhone(currentUser.phone || '');
      setEditAddress(currentUser.defaultAddress || '');
      setTempAvatarUrl(currentUser.avatarUrl || '');
    }
  }, [currentUser]);

  // Synchronize saved addresses list with storage and user profile
  useEffect(() => {
    const list = loadSavedAddressesFromStorage(currentUser?.id, currentUser?.defaultAddress);
    setSavedAddresses(list);
  }, [currentUser?.id, currentUser?.defaultAddress]);

  // Fetch live metrics (Services Done, Active Requests) from customerApi
  const fetchMetrics = async () => {
    if (!isAuthenticated || currentUser?.role !== 'customer') {
      setCompletedServicesCount(0);
      setActiveServicesCount(0);
      return;
    }
    try {
      setIsLoadingMetrics(true);
      const res = await customerApi.getMyRequests();
      if (res.success && Array.isArray(res.data)) {
        const completed = res.data.filter((r: any) => r.status === 'completed').length;
        const active = res.data.filter(
          (r: any) => r.status !== 'completed' && r.status !== 'cancelled'
        ).length;
        setCompletedServicesCount(completed);
        setActiveServicesCount(active);
      }
    } catch (err) {
      console.warn('Error fetching customer request metrics:', err);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const unsubscribeFocus = navigation?.addListener?.('focus', () => {
      fetchMetrics();
    });
    const unsubscribeSync = adminSyncEmitter.subscribe(() => {
      fetchMetrics();
    });
    return () => {
      if (typeof unsubscribeFocus === 'function') unsubscribeFocus();
      if (typeof unsubscribeSync === 'function') unsubscribeSync();
    };
  }, [navigation, isAuthenticated, currentUser?.id]);

  const savedAddressCount = savedAddresses.length;

  // Address Modal Handlers
  const handleOpenAddressModal = () => {
    const list = loadSavedAddressesFromStorage(currentUser?.id, currentUser?.defaultAddress);
    setSavedAddresses(list);
    setIsEditingAddress(false);
    setEditingAddressId(null);
    setAddressModalVisible(true);
  };

  const handleStartAddAddress = () => {
    setEditingAddressId(null);
    setAddressFormTag('Home');
    setAddressFormLabel('Home');
    setAddressFormFlat('');
    setAddressFormBuilding('');
    setAddressFormStreet('');
    setAddressFormCity('');
    setAddressFormState('');
    setAddressFormPincode('');
    setAddressFormFullText('');
    setIsEditingAddress(true);
  };

  const handleStartEditAddress = (addr: SavedAddressItem) => {
    setEditingAddressId(addr.id);
    setAddressFormTag(addr.tag || 'Home');
    setAddressFormLabel(addr.label || addr.tag || 'Home');
    setAddressFormFlat(addr.flatNo || '');
    setAddressFormBuilding(addr.buildingName || '');
    setAddressFormStreet(addr.streetArea || '');
    setAddressFormCity(addr.city || '');
    setAddressFormState(addr.state || '');
    setAddressFormPincode(addr.pincode || '');
    setAddressFormFullText(addr.fullAddress || '');
    setIsEditingAddress(true);
  };

  const handleDetectGps = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setIsGpsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            if (data && data.address) {
              const road = data.address.road || data.address.suburb || data.address.neighbourhood || '';
              const city = data.address.city || data.address.town || data.address.county || 'Gurgaon';
              const state = data.address.state || 'Haryana';
              const pincode = data.address.postcode || '122002';
              setAddressFormStreet(road);
              setAddressFormCity(city);
              setAddressFormState(state);
              setAddressFormPincode(pincode);
              setAddressFormFullText(data.display_name || `${road}, ${city}, ${state} - ${pincode}`);
            } else {
              setAddressFormFullText('Sector 62, Golf Course Extension Road, Gurgaon, Haryana - 122002');
            }
          } catch {
            setAddressFormFullText('Sector 62, Golf Course Extension Road, Gurgaon, Haryana - 122002');
          } finally {
            setIsGpsLocating(false);
          }
        },
        () => {
          setAddressFormStreet('Golf Course Extension Road');
          setAddressFormCity('Gurgaon');
          setAddressFormState('Haryana');
          setAddressFormPincode('122002');
          setAddressFormFullText('Sector 62, Golf Course Extension Road, Gurgaon, Haryana - 122002');
          setIsGpsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      Alert.alert('GPS Unavailable', 'Geolocation is not supported on this device or browser.');
    }
  };

  const isAddressFormValid =
    addressFormFullText.trim().length > 0 ||
    (addressFormFlat.trim().length > 0 &&
      (addressFormStreet.trim().length > 0 || addressFormBuilding.trim().length > 0) &&
      addressFormCity.trim().length > 0 &&
      addressFormPincode.trim().length >= 4);

  const handleSaveAddress = async () => {
    let finalAddress = addressFormFullText.trim();
    if (!finalAddress) {
      const parts = [
        addressFormFlat.trim(),
        addressFormBuilding.trim(),
        addressFormStreet.trim(),
        [addressFormCity.trim(), addressFormState.trim()].filter(Boolean).join(', '),
        addressFormPincode.trim() ? `- ${addressFormPincode.trim()}` : '',
      ].filter(Boolean);
      finalAddress = parts.join(', ');
    }

    if (!isAddressFormValid) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Address Required: Please fill all mandatory fields (Flat/House No, Street/Building, City, and Pincode).');
      } else {
        Alert.alert('Address Required', 'Please fill all mandatory fields (Flat/House No, Street/Building, City, and Pincode).');
      }
      return;
    }

    setIsSavingAddress(true);
    try {
      // 1. Sync directly to backend PostgreSQL database
      const res = await updateUserProfile({
        defaultAddress: finalAddress,
      });

      if (res.success) {
        // 2. Update local state and persistent storage
        const newId = editingAddressId || `addr_${Date.now()}`;
        const updatedItem: SavedAddressItem = {
          id: newId,
          tag: addressFormTag,
          label: addressFormLabel.trim() || addressFormTag,
          flatNo: addressFormFlat.trim(),
          buildingName: addressFormBuilding.trim(),
          streetArea: addressFormStreet.trim(),
          city: addressFormCity.trim(),
          state: addressFormState.trim(),
          pincode: addressFormPincode.trim(),
          fullAddress: finalAddress,
          isDefault: true,
        };

        let updatedList = [...savedAddresses];
        const existingIdx = updatedList.findIndex((a) => a.id === editingAddressId);
        if (existingIdx >= 0) {
          updatedList[existingIdx] = updatedItem;
        } else {
          updatedList = updatedList.map((a) => ({ ...a, isDefault: false }));
          updatedList = [updatedItem, ...updatedList];
        }

        setSavedAddresses(updatedList);
        persistSavedAddressesToStorage(updatedList, currentUser?.id);

        setIsEditingAddress(false);
        setEditingAddressId(null);
        Alert.alert(
          'Address Saved',
          'Your address has been saved to your profile successfully.'
        );
      } else {
        Alert.alert('Save Failed', sanitizeUserErrorMessage(res.error) || 'Could not save address to account.');
      }
    } catch (err: any) {
      Alert.alert('Save Failed', sanitizeUserErrorMessage(err) || 'An error occurred while saving address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = (addrOrId: SavedAddressItem | string) => {
    const item =
      typeof addrOrId === 'string'
        ? savedAddresses.find((a) => a.id === addrOrId) || {
            id: addrOrId,
            tag: 'Home',
            label: 'Saved Address',
            fullAddress: '',
            flatNo: '',
            buildingName: '',
            streetArea: '',
            city: '',
            state: '',
            pincode: '',
          }
        : addrOrId;

    setAddressToDelete(item);
  };

  const executeDeleteAddress = async (addrId: string, fullAddr?: string) => {
    setIsDeletingAddress(true);
    try {
      const updatedList = savedAddresses.filter(
        (a) => a.id !== addrId && (fullAddr ? a.fullAddress !== fullAddr : true)
      );
      if (updatedList.length > 0 && !updatedList.some((a) => a.isDefault)) {
        updatedList[0] = { ...updatedList[0], isDefault: true };
      }
      setSavedAddresses(updatedList);
      persistSavedAddressesToStorage(updatedList, currentUser?.id);

      // If primary address was removed, update backend
      const nextDefault =
        updatedList.length > 0
          ? updatedList.find((a) => a.isDefault)?.fullAddress || updatedList[0].fullAddress
          : '';

      if (currentUser) {
        try {
          await updateUserProfile({ defaultAddress: nextDefault });
        } catch (e) {
          console.warn('Could not sync removed address to backend:', e);
        }
      }
    } catch (err) {
      console.error('Error removing address:', err);
    } finally {
      setIsDeletingAddress(false);
      setAddressToDelete(null);
    }
  };

  const handleOpenEditModal = () => {
    if (currentUser) {
      setEditName(currentUser.name || '');
      setEditEmail(currentUser.email || '');
      setEditPhone(currentUser.phone || '');
      setEditAddress(currentUser.defaultAddress || '');
      setTempAvatarUrl(currentUser.avatarUrl || '');
    }
    setEditModalVisible(true);
  };

  const handlePickImage = async () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          if (file.size > 5 * 1024 * 1024) {
            Alert.alert('File Too Large', 'Please select a photo smaller than 5 MB.');
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
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Gallery access is required to select a photo from your device.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mime = asset.mimeType || 'image/jpeg';
        let dataUri = asset.base64 ? `data:${mime};base64,${asset.base64}` : asset.uri;
        if (!dataUri.startsWith('data:') && asset.uri) {
          dataUri = await fileUriToBase64DataUrl(asset.uri, mime);
        }
        setTempAvatarUrl(dataUri);
      }
    } catch (err: any) {
      console.warn('Native photo picker error:', err);
      Alert.alert('Upload Error', 'Could not open device photo gallery. Please try again.');
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required Field', 'Please enter your name.');
      return;
    }
    setIsSavingProfile(true);
    const result = await updateUserProfile({
      name: editName.trim(),
      defaultAddress: editAddress.trim(),
      avatarUrl: tempAvatarUrl !== undefined ? (tempAvatarUrl === '' ? '__REMOVE__' : tempAvatarUrl) : undefined,
    });
    setIsSavingProfile(false);

    if (result.success) {
      setEditModalVisible(false);
      Alert.alert('Profile Updated', 'Your profile details and picture have been saved to your account.');
    } else {
      Alert.alert('Update Failed', result.error || 'Could not update profile. Please try again.');
    }
  };

  const handleStaffChoice = (staffRole: 'technician' | 'admin') => {
    setStaffModalVisible(false);
    setRole(staffRole);
  };

  const handleLogout = () => {
    try {
      if (typeof navigation.jumpTo === 'function') {
        navigation.jumpTo('ServicesAvailableTab');
      } else if (navigation?.navigate) {
        navigation.navigate('ServicesAvailableTab');
      }
    } catch {
      try {
        navigation.navigate('CustomerMain', { screen: 'ServicesAvailableTab' });
      } catch {
        // fallback
      }
    }
    logout();
  };

  const handleDownloadInvoices = async () => {
    setInvoicesModalVisible(true);
    setIsLoadingInvoices(true);
    try {
      const res = await customerApi.getMyRequests();
      if (res.success && Array.isArray(res.data)) {
        const completed = res.data.filter((r: any) => r.status === 'completed');
        setCompletedTickets(completed);
        setCompletedServicesCount(completed.length);
      }
    } catch (e) {
      console.warn('Error fetching completed tickets for invoices:', e);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const handleDownloadSingleInvoice = async (ticket: any) => {
    const rawAmount = ticket.totalAmount ?? ticket.total_amount ?? ticket.amount;
    const amount = Number(rawAmount) > 0 ? Number(rawAmount) : 299;
    const trackingCode = ticket.trackingCode || ticket.tracking_code || ticket.id || 'CC-3350';
    const chairModel = ticket.chairModel || ticket.chair_model || 'Office Chair';
    const serviceTitle = ticket.serviceTitle || ticket.service_title || 'Chair Repair Service';
    const dateInfo = ticket.completedAt || ticket.completed_at || ticket.visitDate || ticket.visit_date || 'Recently Completed';

    const details: InvoiceDetails = {
      ticketNumber: `#${trackingCode}`,
      serviceTitle,
      chairModel,
      amount,
      isPaid: Boolean(ticket.isPaid ?? ticket.is_paid ?? true),
      dateInfo,
      customerName: currentUser?.name || 'Valued Customer',
      customerPhone: currentUser?.phone || '',
      customerEmail: currentUser?.email || '',
      locationInfo: currentUser?.defaultAddress || ticket.address || 'Service Location',
      technicianName: ticket.technicianName || ticket.technician_name || 'ChairCare Specialist',
    };

    const res = await downloadInvoice(details);
    if (res.success) {
      Alert.alert(
        'Invoice Downloaded',
        `Tax Invoice ${res.invoiceNumber} (₹${res.amount}) has been generated and saved.`
      );
    }
  };

  const handlePreviewInvoice = (ticket: any) => {
    const rawAmount = ticket.totalAmount ?? ticket.total_amount ?? ticket.amount;
    const amount = Number(rawAmount) > 0 ? Number(rawAmount) : 299;
    const trackingCode = ticket.trackingCode || ticket.tracking_code || ticket.id || 'CC-3350';
    const chairModel = ticket.chairModel || ticket.chair_model || 'Office Chair';
    const serviceTitle = ticket.serviceTitle || ticket.service_title || 'Chair Repair Service';
    const dateInfo = ticket.completedAt || ticket.completed_at || ticket.visitDate || ticket.visit_date || 'Recently Completed';

    const details: InvoiceDetails = {
      ticketNumber: `#${trackingCode}`,
      serviceTitle,
      chairModel,
      amount,
      isPaid: Boolean(ticket.isPaid ?? ticket.is_paid ?? true),
      dateInfo,
      customerName: currentUser?.name || 'Valued Customer',
      customerPhone: currentUser?.phone || '',
      customerEmail: currentUser?.email || '',
      locationInfo: currentUser?.defaultAddress || ticket.address || 'Service Location',
      technicianName: ticket.technicianName || ticket.technician_name || 'ChairCare Specialist',
    };

    setActivePreviewDetails(details);
    const html = generateInvoiceHtml(details);
    setPreviewInvoiceTitle(`Invoice #${trackingCode.replace('#', '')}`);
    setPreviewInvoiceHtml(html);
  };

  const handleDownloadAllInvoices = async () => {
    if (completedTickets.length === 0) return;
    for (const t of completedTickets) {
      await handleDownloadSingleInvoice(t);
    }
  };

  const openInfoModal = (title: string, content: string) => {
    setInfoModalTitle(title);
    setInfoModalContent(content);
  };

  // ----------------------------------------------------
  // UNTOUCHED PRIVACY GATE: If visitor is NOT authenticated as Customer
  // ----------------------------------------------------
  if (!isAuthenticated || currentUser?.role !== 'customer') {
    return (
      <ScreenContainer hasPadding={false}>
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <BrandLogo size={32} containerStyle={{ marginRight: 10 }} />
            <View style={styles.headerTitleGroup}>
              <Text style={styles.brandSubtitle}>ChairCare Portal</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Account & Profile
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Privacy Locked Account Card */}
          <View style={styles.unauthHeroCard}>
            <View style={styles.unauthIconCircle}>
              <AppIcon name="ShieldCheck" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.unauthTitle}>Sign In Required</Text>
            <Text style={styles.unauthSubtitle}>
              Your account, saved addresses, service tickets, and ErgoShield™ warranty certificates are protected. Please sign in to access your profile.
            </Text>

            <View style={styles.unauthActionsContainer}>
              <TouchableOpacity
                style={styles.primaryAuthBtn}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('AuthenticationGate', {
                    returnTo: 'CustomerProfileTab',
                  })
                }
              >
                <AppIcon name="UserCircle" size={18} color="#FFFFFF" />
                <Text style={styles.primaryAuthBtnText}>Sign In to ChairCare</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryAuthBtn}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('CustomerRegistration', {
                    returnTo: 'CustomerProfileTab',
                  })
                }
              >
                <Text style={styles.secondaryAuthBtnText}>Create New Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.textActionBtn}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ServicesAvailableTab')}
              >
                <Text style={styles.textActionBtnText}>Browse Available Services →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Staff Access Selection Modal */}
        <Modal
          visible={staffModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setStaffModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.modalDismissArea}
              onPress={() => setStaffModalVisible(false)}
              activeOpacity={1}
            />
            <View style={styles.staffModalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalHeaderTitle}>Portal Switching</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setStaffModalVisible(false)}
                >
                  <AppIcon name="X" size={18} />
                </TouchableOpacity>
              </View>
              <Text style={styles.staffModalSubtitle}>
                Select the operational role to test authorized features.
              </Text>
              <TouchableOpacity
                style={styles.staffChoiceBtn}
                onPress={() => handleStaffChoice('technician')}
              >
                <Text style={styles.staffChoiceText}>Technician Field Console</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.staffChoiceBtn}
                onPress={() => handleStaffChoice('admin')}
              >
                <Text style={styles.staffChoiceText}>Super Admin Operations</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScreenContainer>
    );
  }

  // ----------------------------------------------------
  // AUTHENTICATED PROFILE VIEW: Shows real user data only
  // ----------------------------------------------------
  const userInitial = (currentUser?.name || 'U').charAt(0).toUpperCase();

  return (
    <ScreenContainer hasPadding={false}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <BrandLogo size={32} containerStyle={{ marginRight: 10 }} />
          <View style={styles.headerTitleGroup}>
            <Text style={styles.brandSubtitle}>ChairCare Portal</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Customer Profile
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ThemeSwitchButton variant="header" />
          <CustomerHeaderAvatar onPress={handleOpenEditModal} size={38} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Context */}
        <View style={styles.topTelemetryRow}>
          <View style={styles.telemetryTagLeft}>
            <View style={styles.pulseDotEmerald} />
            <Text style={styles.telemetryTagText}>Live Account Telemetry</Text>
          </View>
        </View>

        {/* Customer Identity Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroCardContent}>
            <View style={styles.heroIdentityRow}>
              <TouchableOpacity
                style={styles.avatarWrapper}
                onPress={handleOpenEditModal}
                activeOpacity={0.85}
              >
                {currentUser?.avatarUrl ? (
                  <Image source={{ uri: currentUser.avatarUrl }} style={styles.heroAvatarImage} />
                ) : (
                  <View style={styles.heroAvatarInitials}>
                    <Text style={styles.heroAvatarInitialsText}>{userInitial}</Text>
                  </View>
                )}
                <View style={styles.cameraAvatarBadge}>
                  <AppIcon name="Camera" size={12} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <View style={styles.heroDetailsCol}>
                <Text style={styles.heroNameText} numberOfLines={1}>
                  {currentUser?.name || 'Customer'}
                </Text>
                <Text style={styles.heroEmailText} numberOfLines={1}>
                  {currentUser?.email || ''}
                </Text>
                <Text style={styles.heroPhoneText}>
                  {currentUser?.phone || 'No phone number added'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.editBtn}
                onPress={handleOpenEditModal}
                activeOpacity={0.8}
              >
                <AppIcon name="Edit" size={16} color={Colors.primary} />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Trust Badges */}
            <View style={styles.trustBadgesRow}>
              <View style={styles.verifiedCustomerPill}>
                <AppIcon name="Check" size={14} color="#059669" />
                <Text style={styles.verifiedCustomerText}>Verified Customer</Text>
              </View>
              <View style={styles.ergoFixPill}>
                <AppIcon name="ShieldCheck" size={14} color="#0284C7" />
                <Text style={styles.ergoFixText}>ErgoShield™ Protected</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Real Quick Stats Bar */}
        <View style={styles.quickStatsCard}>
          {isLoadingMetrics ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ padding: 12 }} />
          ) : (
            <View style={styles.quickStatsGrid}>
              <TouchableOpacity
                style={styles.statBox}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('MyRequestsTab')}
              >
                <Text style={styles.statNumberBlack}>{completedServicesCount}</Text>
                <Text style={styles.statLabel}>Services Done</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statBox}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('MyRequestsTab')}
              >
                <Text style={styles.statNumberBlue}>{activeServicesCount}</Text>
                <Text style={styles.statLabel}>Active Requests</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statBox}
                activeOpacity={0.7}
                onPress={handleOpenAddressModal}
              >
                <Text style={styles.statNumberGreen}>{savedAddressCount}</Text>
                <Text style={styles.statLabel}>Saved Address</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Menu Group 1: Account & Addresses */}
        <View style={styles.menuGroup}>
          <Text style={styles.menuGroupHeader}>Account & Addresses</Text>
          <View style={styles.menuGroupCard}>
            {/* Personal Information */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setEditModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconCircle}>
                  <AppIcon name="User" size={18} color={Colors.onSurfaceVariant} />
                </View>
                <Text style={styles.menuItemTitle}>Personal Information</Text>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Saved Addresses */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={handleOpenAddressModal}
              activeOpacity={0.7}
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconCircle}>
                  <AppIcon name="MapPin" size={18} color={Colors.onSurfaceVariant} />
                </View>
                <View style={styles.menuSubCol}>
                  <Text style={styles.menuItemTitle}>Saved Address</Text>
                  <Text style={styles.menuItemSub} numberOfLines={1}>
                    {currentUser?.defaultAddress || savedAddresses[0]?.fullAddress || 'None configured'}
                  </Text>
                </View>
              </View>
              <View style={styles.menuRowRightBadge}>
                <View style={savedAddressCount > 0 ? styles.pillBadgeEmerald : styles.pillBadgeNeutral}>
                  <Text style={savedAddressCount > 0 ? styles.pillBadgeEmeraldText : styles.pillBadgeNeutralText}>
                    {savedAddressCount > 0 ? `${savedAddressCount} Saved` : 'Add'}
                  </Text>
                </View>
                <Text style={styles.chevronIcon}>›</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Payment Methods */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() =>
                openInfoModal(
                  'Payment Security',
                  'ChairCare supports secure direct payments via UPI, Credit/Debit Cards, and Net Banking.\n\nAll payments are processed securely with 256-bit encryption and payment receipts are issued upon service completion.'
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconCircle}>
                  <AppIcon name="CreditCard" size={18} color={Colors.onSurfaceVariant} />
                </View>
                <View style={styles.menuSubCol}>
                  <Text style={styles.menuItemTitle}>Payment Methods</Text>
                  <Text style={styles.menuItemSub}>UPI, Cards & Net Banking</Text>
                </View>
              </View>
              <View style={styles.menuRowRightBadge}>
                <View style={styles.pillBadgeBlue}>
                  <Text style={styles.pillBadgeBlueText}>Secure Gate</Text>
                </View>
                <Text style={styles.chevronIcon}>›</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Change Password */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setChangePasswordModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconCircle}>
                  <AppIcon name="Lock" size={18} color={Colors.onSurfaceVariant} />
                </View>
                <View style={styles.menuSubCol}>
                  <Text style={styles.menuItemTitle}>Change Password</Text>
                  <Text style={styles.menuItemSub}>Update your account login password</Text>
                </View>
              </View>
              <View style={styles.menuRowRightBadge}>
                <View style={styles.pillBadgeNeutral}>
                  <Text style={styles.pillBadgeNeutralText}>Security</Text>
                </View>
                <Text style={styles.chevronIcon}>›</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Group 2: Services & Activity */}
        <View style={styles.menuGroup}>
          <Text style={styles.menuGroupHeader}>Services & Activity</Text>
          <View style={styles.menuGroupCard}>
            {/* My Service Requests */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('MyRequestsTab')}
              activeOpacity={0.7}
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconCircle}>
                  <AppIcon name="ClipboardList" size={18} color={Colors.onSurfaceVariant} />
                </View>
                <Text style={styles.menuItemTitle}>My Service Requests</Text>
              </View>
              <View style={styles.menuRowRightBadge}>
                {activeServicesCount > 0 ? (
                  <View style={styles.pillBadgeSolidBlue}>
                    <Text style={styles.pillBadgeSolidBlueText}>
                      {activeServicesCount} Active
                    </Text>
                  </View>
                ) : (
                  <View style={styles.pillBadgeNeutral}>
                    <Text style={styles.pillBadgeNeutralText}>View</Text>
                  </View>
                )}
                <Text style={styles.chevronIcon}>›</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Notifications */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('NotificationsTab')}
              activeOpacity={0.7}
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconCircle}>
                  <AppIcon name="Bell" size={18} color={Colors.onSurfaceVariant} />
                </View>
                <Text style={styles.menuItemTitle}>Notifications</Text>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Download All Invoices */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={handleDownloadInvoices}
              activeOpacity={0.7}
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconCircle}>
                  <AppIcon name="Receipt" size={18} color={Colors.onSurfaceVariant} />
                </View>
                <View>
                  <Text style={styles.menuItemTitle}>Download Completed Invoices</Text>
                  <Text style={{ fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 }}>
                    {completedServicesCount > 0 ? `${completedServicesCount} invoice${completedServicesCount > 1 ? 's' : ''} available` : 'Official GST tax invoices & warranties'}
                  </Text>
                </View>
              </View>
              <Text style={styles.downloadIcon}>⬇</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Group 3: Governance & Support */}
        <View style={styles.menuGroup}>
          <Text style={styles.menuGroupHeader}>Governance & Support</Text>
          <View style={styles.menuGroupCard}>
            {/* Help & Support */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setHelpModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconCircle}>
                  <AppIcon name="Headphones" size={18} color={Colors.onSurfaceVariant} />
                </View>
                <View>
                  <Text style={styles.menuItemTitle}>Help & Support</Text>
                  <Text style={{ fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 }}>
                    +91 92174 60742 • enquiry@offheman.in
                  </Text>
                </View>
              </View>
              <View style={styles.menuRowRightBadge}>
                <View style={styles.pillBadgeNeutral}>
                  <Text style={styles.pillBadgeNeutralText}>24/7 Desk</Text>
                </View>
                <Text style={styles.chevronIcon}>›</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Terms & Conditions */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() =>
                openInfoModal(
                  'Terms & Conditions',
                  'ChairCare BIFMA Quality Standards:\n\n1. All hydraulic gas-lift cylinders are Class-4 certified.\n2. 90-day comprehensive mechanical guarantee on all parts.\n3. Zero upfront diagnosis payment until repair estimate is approved.\n4. Field specialists carry authenticated biometric ID credentials.'
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconCircle}>
                  <AppIcon name="FileText" size={18} color={Colors.onSurfaceVariant} />
                </View>
                <Text style={styles.menuItemTitle}>Terms & Conditions</Text>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Privacy Policy */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() =>
                openInfoModal(
                  'Privacy & Security Policy',
                  'ChairCare respects your security:\n\n1. Location coordinates are strictly transmitted during active repair windows.\n2. Service addresses are strictly private to your authenticated account.\n3. Zero data sharing with 3rd-party advertising networks.'
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconCircle}>
                  <AppIcon name="Lock" size={18} color={Colors.onSurfaceVariant} />
                </View>
                <Text style={styles.menuItemTitle}>Privacy Policy</Text>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
          accessibilityLabel="Log Out"
        >
          <AppIcon name="LogOut" size={18} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>

        {/* Footnote Metadata */}
        <View style={styles.footnoteContainer}>
          <View style={styles.footnoteRow}>
            <AppIcon name="ShieldCheck" size={16} color={Colors.outline} />
            <Text style={styles.footnoteVersion}>ChairCare Mobile v1.0.0 (Build 412)</Text>
          </View>
          <Text style={styles.footnoteSub}>Certified Ergonomic Calibration Network</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
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
                <Text style={styles.modalHeaderTitle}>Edit Profile & Photo</Text>
                <Text style={styles.modalHeaderSubtitle}>Update your photo and account credentials</Text>
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
                      <Text style={styles.modalAvatarPlaceholderText}>{userInitial}</Text>
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
                <Text style={styles.sectionMiniLabel}>OR CHOOSE A CURATED AVATAR</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
                  {PRESET_CUSTOMER_AVATARS.map((item) => {
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
                    placeholder="Your Full Name"
                    placeholderTextColor={Colors.onSurfaceVariant}
                  />
                </View>

                {/* Permanent Verified Credentials - Read Only */}
                <View style={styles.lockedCredentialsBox}>
                  <View style={styles.lockedHeaderRow}>
                    <View style={styles.lockedBadge}>
                      <AppIcon name="Lock" size={12} color="#64748B" />
                      <Text style={styles.lockedBadgeText}>PERMANENT ACCOUNT CREDENTIALS</Text>
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
                        {currentUser?.email || 'No email attached'}
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
                        {currentUser?.phone || 'No phone attached'}
                      </Text>
                    </View>
                    <View style={styles.verifiedCheckPill}>
                      <AppIcon name="Check" size={10} color="#16A34A" />
                      <Text style={styles.verifiedCheckText}>Verified</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>DEFAULT SERVICE ADDRESS</Text>
                  <TextInput
                    style={[styles.textInput, { height: 68 }]}
                    value={editAddress}
                    onChangeText={setEditAddress}
                    placeholder="Street, Building, Flat / Unit, City"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    multiline={true}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.saveProfileBtn, (!editName.trim() || isSavingProfile) && { opacity: 0.5 }]}
                  onPress={handleSaveProfile}
                  activeOpacity={0.88}
                  disabled={!editName.trim() || isSavingProfile}
                >
                  {isSavingProfile ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveProfileBtnText}>
                      {!editName.trim() ? 'Name Required *' : 'Save Changes'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Dedicated Saved Address & Backend Sync Modal */}
      <Modal
        visible={addressModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setAddressModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.addressModalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderLeftGroup}>
                <View style={styles.addressIconCircleTop}>
                  <AppIcon name="MapPin" size={18} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalHeaderTitle}>
                    {isEditingAddress
                      ? editingAddressId
                        ? 'Edit Saved Address'
                        : 'Add Service Address'
                      : 'Saved Addresses'}
                  </Text>
                  <Text style={styles.modalHeaderSubtitle}>
                    {isEditingAddress
                      ? 'Saved to your profile securely'
                      : 'Delivery & service calibration locations'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  if (isEditingAddress) {
                    setIsEditingAddress(false);
                  } else {
                    setAddressModalVisible(false);
                  }
                }}
              >
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.addressModalScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {isEditingAddress ? (
                /* IN-PLACE ADDRESS EDITOR / ADD FORM */
                <View style={styles.addressFormContainer}>
                  {/* Tag Selector */}
                  <View style={styles.addressTagRow}>
                    {(['Home', 'Office', 'Other'] as const).map((tag) => {
                      const isSelected = addressFormTag === tag;
                      return (
                        <TouchableOpacity
                          key={tag}
                          style={[styles.tagChip, isSelected && styles.tagChipSelected]}
                          onPress={() => {
                            setAddressFormTag(tag);
                            if (!addressFormLabel || ['Home', 'Office', 'Other'].includes(addressFormLabel)) {
                              setAddressFormLabel(tag);
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <AppIcon
                            name={tag === 'Home' ? 'Home' : tag === 'Office' ? 'Briefcase' : 'MapPin'}
                            size={14}
                            color={isSelected ? Colors.primary : Colors.onSurfaceVariant}
                          />
                          <Text
                            style={[styles.tagChipText, isSelected && styles.tagChipTextSelected]}
                          >
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* GPS Auto-Detect Button */}
                  <TouchableOpacity
                    style={styles.gpsDetectBtn}
                    onPress={handleDetectGps}
                    activeOpacity={0.8}
                    disabled={isGpsLocating}
                  >
                    {isGpsLocating ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <AppIcon name="Navigation" size={14} color={Colors.primary} />
                    )}
                    <Text style={styles.gpsDetectBtnText}>
                      {isGpsLocating ? 'Detecting Location Coordinates...' : 'Use Current GPS Location'}
                    </Text>
                  </TouchableOpacity>

                  {/* Address Fields */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>FLAT / UNIT / FLOOR *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={addressFormFlat}
                      onChangeText={setAddressFormFlat}
                      placeholder="e.g. Tower 4, Apt 1102, 11th Floor"
                      placeholderTextColor={Colors.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>BUILDING / SOCIETY / COMPLEX</Text>
                    <TextInput
                      style={styles.textInput}
                      value={addressFormBuilding}
                      onChangeText={setAddressFormBuilding}
                      placeholder="e.g. Cyber Heights Residences"
                      placeholderTextColor={Colors.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>STREET / AREA DETAILS *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={addressFormStreet}
                      onChangeText={setAddressFormStreet}
                      placeholder="e.g. Sector 62, Golf Course Extension Road"
                      placeholderTextColor={Colors.onSurfaceVariant}
                    />
                  </View>

                  <View style={styles.twoColInputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>CITY *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={addressFormCity}
                        onChangeText={setAddressFormCity}
                        placeholder="Gurgaon"
                        placeholderTextColor={Colors.onSurfaceVariant}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>PIN CODE *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={addressFormPincode}
                        onChangeText={setAddressFormPincode}
                        placeholder="122002"
                        keyboardType="numeric"
                        placeholderTextColor={Colors.onSurfaceVariant}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>FULL FORMATTED ADDRESS (OPTIONAL OVERRIDE)</Text>
                    <TextInput
                      style={[styles.textInput, { height: 60 }]}
                      value={addressFormFullText}
                      onChangeText={setAddressFormFullText}
                      placeholder="Or enter complete address string directly..."
                      placeholderTextColor={Colors.onSurfaceVariant}
                      multiline={true}
                    />
                  </View>

                  {/* Form Action Buttons */}
                  <View style={styles.addressFormActionsRow}>
                    <TouchableOpacity
                      style={styles.addressCancelBtn}
                      onPress={() => setIsEditingAddress(false)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addressCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.addressSaveBtn, (!isAddressFormValid || isSavingAddress) && { opacity: 0.5 }]}
                      onPress={handleSaveAddress}
                      activeOpacity={0.88}
                      disabled={!isAddressFormValid || isSavingAddress}
                    >
                      {isSavingAddress ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <AppIcon name="Check" size={15} color="#FFFFFF" />
                          <Text style={styles.addressSaveBtnText}>
                            {!isAddressFormValid ? 'Fill Required Fields *' : 'Save & Sync'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* SAVED ADDRESSES LIST VIEW */
                <View style={styles.addressListContainer}>
                  {savedAddresses.length > 0 ? (
                    <>
                      {savedAddresses.map((addr, idx) => (
                        <View key={addr.id || `addr_${idx}`} style={styles.savedAddressCard}>
                          <View style={styles.savedAddressTopRow}>
                            <View style={styles.addressTagBadge}>
                              <AppIcon
                                name={
                                  addr.tag === 'Office'
                                    ? 'Briefcase'
                                    : addr.tag === 'Other'
                                    ? 'MapPin'
                                    : 'Home'
                                }
                                size={12}
                                color={Colors.primary}
                              />
                              <Text style={styles.addressTagBadgeText}>
                                {addr.label || addr.tag || 'Home'}
                              </Text>
                            </View>

                            {(addr.isDefault || addr.fullAddress === currentUser?.defaultAddress) && (
                              <View style={styles.primaryBadge}>
                                <AppIcon name="Check" size={10} color="#059669" />
                                <Text style={styles.primaryBadgeText}>Default Address</Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.addressBodyRow}>
                            <AppIcon
                              name="MapPin"
                              size={16}
                              color={Colors.primary}
                              style={{ marginTop: 2, marginRight: 8 }}
                            />
                            <Text style={styles.addressFullText}>
                              {addr.fullAddress}
                            </Text>
                          </View>

                          <View style={styles.addressCardActionsRow}>
                            <TouchableOpacity
                              style={styles.cardEditActionBtn}
                              onPress={() => handleStartEditAddress(addr)}
                              activeOpacity={0.8}
                            >
                              <AppIcon name="Edit" size={13} color={Colors.primary} />
                              <Text style={styles.cardEditActionText}>Edit Address</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.cardDeleteActionBtn}
                              onPress={() => handleDeleteAddress(addr)}
                              activeOpacity={0.8}
                            >
                              <AppIcon name="Trash2" size={13} color="#EF4444" />
                              <Text style={styles.cardDeleteActionText}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}

                      <TouchableOpacity
                        style={styles.addNewAddressBtn}
                        onPress={handleStartAddAddress}
                        activeOpacity={0.8}
                      >
                        <AppIcon name="Plus" size={16} color={Colors.primary} />
                        <Text style={styles.addNewAddressBtnText}>Add Another Address</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={styles.emptyAddressBox}>
                      <View style={styles.emptyAddressIconCircle}>
                        <AppIcon name="MapPin" size={32} color={Colors.outline} />
                      </View>
                      <Text style={styles.emptyAddressTitle}>No Address Configured</Text>
                      <Text style={styles.emptyAddressSubtitle}>
                        You don't have a saved address linked to your account yet. Add your home or office address to enable 1-tap booking dispatch.
                      </Text>

                      <TouchableOpacity
                        style={styles.addFirstAddressBtn}
                        onPress={handleStartAddAddress}
                        activeOpacity={0.88}
                      >
                        <AppIcon name="Plus" size={16} color="#FFFFFF" />
                        <Text style={styles.addFirstAddressBtnText}>Add Service Address Now</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>

          {/* In-App Confirmation Dialog for Address Removal */}
          {addressToDelete && (
            <View style={styles.confirmDeleteBackdrop}>
              <View style={styles.confirmDeleteCard}>
                <View style={styles.confirmDeleteIconCircle}>
                  <AppIcon name="Trash2" size={24} color="#EF4444" />
                </View>
                <Text style={styles.confirmDeleteTitle}>Remove Address?</Text>
                <Text style={styles.confirmDeleteSubtitle}>
                  Are you sure you want to remove this saved address from your account?
                </Text>

                <View style={styles.confirmDeletePreviewBox}>
                  <View style={styles.confirmDeleteTagBadge}>
                    <AppIcon
                      name={
                        addressToDelete.tag === 'Office'
                          ? 'Briefcase'
                          : addressToDelete.tag === 'Other'
                          ? 'MapPin'
                          : 'Home'
                      }
                      size={12}
                      color={Colors.primary}
                    />
                    <Text style={styles.confirmDeleteTagText}>
                      {addressToDelete.label || addressToDelete.tag || 'Address'}
                    </Text>
                  </View>
                  <Text style={styles.confirmDeleteAddressText} numberOfLines={2}>
                    {addressToDelete.fullAddress}
                  </Text>
                </View>

                <View style={styles.confirmDeleteActionsRow}>
                  <TouchableOpacity
                    style={styles.confirmDeleteCancelBtn}
                    onPress={() => setAddressToDelete(null)}
                    disabled={isDeletingAddress}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmDeleteCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmDeleteSubmitBtn}
                    onPress={() => executeDeleteAddress(addressToDelete.id, addressToDelete.fullAddress)}
                    disabled={isDeletingAddress}
                    activeOpacity={0.85}
                  >
                    {isDeletingAddress ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <AppIcon name="Trash2" size={14} color="#FFFFFF" />
                        <Text style={styles.confirmDeleteSubmitText}>Remove</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Info / Policy / Details Modal */}
      {infoModalTitle && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setInfoModalTitle(null)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.modalDismissArea}
              onPress={() => setInfoModalTitle(null)}
              activeOpacity={1}
            />
            <View style={styles.infoModalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalHeaderTitle}>{infoModalTitle}</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setInfoModalTitle(null)}
                >
                  <AppIcon name="X" size={18} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.infoScrollView}>
                <Text style={styles.infoModalBodyText}>{infoModalContent}</Text>
              </ScrollView>
              <TouchableOpacity
                style={styles.infoDoneBtn}
                onPress={() => setInfoModalTitle(null)}
              >
                <Text style={styles.infoDoneBtnText}>Understood</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Help & Support Interactive Contact Sheet */}
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
                <Text style={styles.modalHeaderTitle}>Help & Support</Text>
                <Text style={{ ...Typography.caption, color: Colors.onSurfaceVariant, marginTop: 2 }}>
                  Direct assistance for service bookings, repairs & inquiries
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setHelpModalVisible(false)}
              >
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginVertical: 14 }}>
              {/* Phone Channel */}
              <TouchableOpacity
                style={styles.supportChannelBtn}
                onPress={() => {
                  setHelpModalVisible(false);
                  Linking.openURL('tel:+919217460742').catch(() => {
                    Alert.alert('Phone Call', 'Please call +91 92174 60742');
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.supportIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <AppIcon name="PhoneCall" size={20} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supportTitle}>Call Support</Text>
                  <Text style={styles.supportSub}>+91 92174 60742 (Direct Call)</Text>
                </View>
                <AppIcon name="ChevronRight" size={18} color="#94A3B8" />
              </TouchableOpacity>

              {/* Email Channel */}
              <TouchableOpacity
                style={styles.supportChannelBtn}
                onPress={() => {
                  setHelpModalVisible(false);
                  Linking.openURL('mailto:enquiry@offheman.in?subject=ChairCare%20Support%20Enquiry').catch(() => {
                    Alert.alert('Email Support', 'Please email enquiry@offheman.in');
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.supportIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <AppIcon name="Mail" size={20} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supportTitle}>Email Support</Text>
                  <Text style={styles.supportSub}>enquiry@offheman.in</Text>
                </View>
                <AppIcon name="ChevronRight" size={18} color="#94A3B8" />
              </TouchableOpacity>

              {/* WhatsApp Channel */}
              <TouchableOpacity
                style={styles.supportChannelBtn}
                onPress={() => {
                  setHelpModalVisible(false);
                  Linking.openURL('https://wa.me/919217460742?text=Hello%20ChairCare%20Support%2C%20I%20have%20an%20enquiry').catch(() => {
                    Alert.alert('WhatsApp', 'Please message +91 92174 60742');
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.supportIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <AppIcon name="MessageSquare" size={20} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supportTitle}>WhatsApp Chat</Text>
                  <Text style={styles.supportSub}>Instant response on WhatsApp (+91 92174 60742)</Text>
                </View>
                <AppIcon name="ChevronRight" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.infoDoneBtn}
              onPress={() => setHelpModalVisible(false)}
            >
              <Text style={styles.infoDoneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Completed Invoices Modal Sheet */}
      <Modal
        visible={invoicesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setInvoicesModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setInvoicesModalVisible(false)}
            activeOpacity={1}
          />
          <View style={[styles.sheetModalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Completed Invoices</Text>
                <Text style={{ ...Typography.caption, color: Colors.onSurfaceVariant, marginTop: 2 }}>
                  Official GST Tax Invoices & Service Certificates
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setInvoicesModalVisible(false)}
              >
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            </View>

            {isLoadingInvoices ? (
              <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ ...Typography.bodyMedium, color: Colors.onSurfaceVariant, marginTop: 12 }}>
                  Loading your service invoices...
                </Text>
              </View>
            ) : completedTickets.length > 0 ? (
              <ScrollView style={{ marginTop: 8 }} showsVerticalScrollIndicator={false}>
                {completedTickets.length > 1 && (
                  <TouchableOpacity
                    style={[styles.primaryAuthBtn, { marginBottom: 14, height: 44 }]}
                    onPress={handleDownloadAllInvoices}
                    activeOpacity={0.8}
                  >
                    <AppIcon name="Download" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryAuthBtnText}>Download All Invoices ({completedTickets.length})</Text>
                  </TouchableOpacity>
                )}

                {completedTickets.map((t, idx) => {
                  const trackingCode = t.trackingCode || t.tracking_code || t.id || `CC-${idx + 1000}`;
                  const rawAmount = t.totalAmount ?? t.total_amount ?? t.amount;
                  const amount = Number(rawAmount) > 0 ? Number(rawAmount) : 299;
                  const chairModel = t.chairModel || t.chair_model || 'Office Chair';
                  const serviceTitle = t.serviceTitle || t.service_title || 'General Repair & Tune-up';
                  const dateInfo = t.completedAt || t.completed_at || t.visitDate || t.visit_date || 'Recently Completed';

                  return (
                    <View key={t.id || idx} style={styles.invoiceCardItem}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Text style={styles.invoiceItemNumber}>INV-{String(trackingCode).replace('#', '')}</Text>
                            <View style={styles.pillBadgeEmerald}>
                              <Text style={styles.pillBadgeEmeraldText}>Verified</Text>
                            </View>
                          </View>
                          <Text style={styles.invoiceItemTitle} numberOfLines={1}>{serviceTitle}</Text>
                          <Text style={styles.invoiceItemSub}>{chairModel} • {dateInfo}</Text>
                        </View>
                        <Text style={styles.invoiceItemAmount}>₹{amount}</Text>
                      </View>

                      <View style={styles.invoiceCardActions}>
                        <TouchableOpacity
                          style={styles.invoicePreviewBtn}
                          onPress={() => handlePreviewInvoice(t)}
                          activeOpacity={0.7}
                        >
                          <AppIcon name="Eye" size={15} color={Colors.primary} />
                          <Text style={styles.invoicePreviewBtnText}>Preview</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.invoiceDownloadActionBtn}
                          onPress={() => handleDownloadSingleInvoice(t)}
                          activeOpacity={0.7}
                        >
                          <AppIcon name="Download" size={15} color="#FFFFFF" />
                          <Text style={styles.invoiceDownloadActionText}>Download</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={{ paddingVertical: 28, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <AppIcon name="Receipt" size={28} color={Colors.primary} />
                </View>
                <Text style={{ ...Typography.h3, fontSize: 16, textAlign: 'center', color: Colors.onSurface }}>
                  No Completed Invoices Yet
                </Text>
                <Text style={{ ...Typography.bodyMedium, fontSize: 13, textAlign: 'center', color: Colors.onSurfaceVariant, marginTop: 6, paddingHorizontal: 20 }}>
                  Tax invoices and warranty certificates are generated automatically when a technician finishes a chair repair.
                </Text>

                <TouchableOpacity
                  style={[styles.primaryAuthBtn, { marginTop: 18, height: 44, width: '100%' }]}
                  onPress={() => {
                    handlePreviewInvoice({
                      trackingCode: 'CC-SAMPLE',
                      totalAmount: 299,
                      serviceTitle: 'Full Inspection & Hydraulic Repair',
                      chairModel: 'Ergonomic Executive Chair',
                      isPaid: true,
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <AppIcon name="Eye" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryAuthBtnText}>View Sample Tax Invoice</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryAuthBtn, { marginTop: 10, height: 44, width: '100%' }]}
                  onPress={() => {
                    setInvoicesModalVisible(false);
                    navigation.navigate('MyRequestsTab');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryAuthBtnText}>Check Active Requests</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.infoDoneBtn, { marginTop: 12 }]}
              onPress={() => setInvoicesModalVisible(false)}
            >
              <Text style={styles.infoDoneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Invoice Full HTML Preview Modal */}
      <Modal
        visible={!!previewInvoiceHtml}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setPreviewInvoiceHtml(null)}
      >
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: Math.max(insets.top, 16) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#0F172A' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity onPress={() => setPreviewInvoiceHtml(null)} style={{ padding: 4 }}>
                <AppIcon name="ArrowLeft" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={{ ...Typography.h3, fontSize: 16, color: '#FFFFFF' }}>{previewInvoiceTitle}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                onPress={() => {
                  if (activePreviewDetails) {
                    downloadInvoice(activePreviewDetails);
                  }
                }}
              >
                <AppIcon name="Download" size={15} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>Save / Share</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPreviewInvoiceHtml(null)} style={{ padding: 6 }}>
                <AppIcon name="X" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {previewInvoiceHtml ? (
            Platform.OS === 'web' ? (
              <iframe
                srcDoc={previewInvoiceHtml}
                style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
                title="Tax Invoice Preview"
              />
            ) : (
              (() => {
                try {
                  const { WebView } = require('react-native-webview');
                  return (
                    <WebView
                      source={{ html: previewInvoiceHtml }}
                      style={{ flex: 1 }}
                      originWhitelist={['*']}
                    />
                  );
                } catch {
                  return (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                      <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: '700' }}>Invoice Generated</Text>
                      <Text style={{ color: '#64748B', marginTop: 8, textAlign: 'center' }}>
                        Tap Save / Share above to view or print the official tax invoice.
                      </Text>
                    </View>
                  );
                }
              })()
            )
          ) : null}
        </View>
      </Modal>

      {/* Staff Access Selection Modal Sheet */}
      <Modal
        visible={staffModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStaffModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setStaffModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.staffModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Portal Switching</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setStaffModalVisible(false)}
              >
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            </View>
            <Text style={styles.staffModalSubtitle}>
              Select the operational role to test authorized features.
            </Text>
            <TouchableOpacity
              style={styles.staffChoiceBtn}
              onPress={() => handleStaffChoice('technician')}
            >
              <Text style={styles.staffChoiceText}>Technician Field Console</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.staffChoiceBtn}
              onPress={() => handleStaffChoice('admin')}
            >
              <Text style={styles.staffChoiceText}>Super Admin Operations</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={changePasswordModalVisible}
        onClose={() => setChangePasswordModalVisible(false)}
        userRoleLabel="Customer Account"
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleGroup: {
    justifyContent: 'center',
  },
  brandSubtitle: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.onSurface,
  },
  profileAvatarTop: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  avatarInitialsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.primary,
  },
  scrollContent: {
    padding: 16,
  },
  // Unauth Lock Card
  unauthHeroCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.large,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.small,
    marginBottom: 20,
  },
  unauthIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  unauthTitle: {
    ...Typography.h2,
    color: Colors.onSurface,
    marginBottom: 8,
    textAlign: 'center',
  },
  unauthSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  unauthActionsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryAuthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.medium,
    gap: 8,
  },
  primaryAuthBtnText: {
    ...Typography.bodyLarge,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryAuthBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    paddingVertical: 14,
    borderRadius: BorderRadius.medium,
  },
  secondaryAuthBtnText: {
    ...Typography.bodyLarge,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  textActionBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  textActionBtnText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Authenticated Styles
  topTelemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  telemetryTagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  pulseDotEmerald: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  telemetryTagText: {
    ...Typography.caption,
    color: '#065F46',
    fontWeight: '600',
  },
  settingsBtn: {
    padding: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  heroCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.large,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.small,
    marginBottom: 16,
  },
  heroCardContent: {
    gap: 14,
  },
  heroIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  heroAvatarInitials: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarInitialsText: {
    ...Typography.h2,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  verifiedAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#10B981',
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroDetailsCol: {
    flex: 1,
  },
  heroNameText: {
    ...Typography.h3,
    color: Colors.onSurface,
  },
  heroEmailText: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  heroPhoneText: {
    ...Typography.caption,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.small,
    gap: 4,
  },
  editBtnText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedCustomerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  verifiedCustomerText: {
    ...Typography.caption,
    color: '#065F46',
    fontWeight: '600',
  },
  ergoFixPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  ergoFixText: {
    ...Typography.caption,
    color: '#0369A1',
    fontWeight: '600',
  },
  quickStatsCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.medium,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    marginBottom: 20,
    ...Shadows.small,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumberBlack: {
    ...Typography.h2,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  statNumberBlue: {
    ...Typography.h2,
    color: '#0284C7',
    fontWeight: '700',
  },
  statNumberGreen: {
    ...Typography.h2,
    color: '#059669',
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  menuGroup: {
    marginBottom: 20,
  },
  menuGroupHeader: {
    ...Typography.caption,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuGroupCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    overflow: 'hidden',
    ...Shadows.small,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuSubCol: {
    flex: 1,
  },
  menuItemTitle: {
    ...Typography.bodyMedium,
    color: Colors.onSurface,
    fontWeight: '500',
  },
  menuItemSub: {
    ...Typography.caption,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  menuRowRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillBadgeNeutral: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  pillBadgeNeutralText: {
    ...Typography.caption,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  pillBadgeBlue: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  pillBadgeBlueText: {
    ...Typography.caption,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  pillBadgeSolidBlue: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  pillBadgeSolidBlueText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chevronIcon: {
    fontSize: 18,
    color: Colors.outline,
    marginLeft: 6,
  },
  downloadIcon: {
    fontSize: 16,
    color: Colors.primary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.outlineHairline,
    marginLeft: 60,
  },
  staffAccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    marginBottom: 16,
  },
  staffAccessText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '600',
    flex: 1,
    marginLeft: 10,
  },
  staffAccessArrow: {
    fontSize: 16,
    color: Colors.primary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: BorderRadius.medium,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: 24,
  },
  logoutBtnText: {
    ...Typography.bodyLarge,
    color: '#EF4444',
    fontWeight: '600',
  },
  footnoteContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  footnoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  footnoteVersion: {
    ...Typography.caption,
    color: Colors.outline,
  },
  footnoteSub: {
    ...Typography.caption,
    color: Colors.outline,
    fontSize: 11,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  editModalCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    padding: 20,
    ...Shadows.large,
  },
  infoModalCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.large,
    margin: 20,
    padding: 20,
    maxHeight: '80%',
    ...Shadows.large,
  },
  staffModalCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    padding: 20,
    ...Shadows.large,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    ...Typography.h3,
    color: Colors.onSurface,
  },
  modalCloseBtn: {
    padding: 4,
  },
  editForm: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Typography.bodyMedium,
    color: Colors.onSurface,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  saveProfileBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    marginTop: 8,
  },
  saveProfileBtnText: {
    ...Typography.bodyLarge,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoScrollView: {
    marginVertical: 12,
  },
  infoModalBodyText: {
    ...Typography.bodyMedium,
    color: Colors.onSurfaceVariant,
    lineHeight: 22,
  },
  infoDoneBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    marginTop: 12,
  },
  infoDoneBtnText: {
    ...Typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  staffModalSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.onSurfaceVariant,
    marginBottom: 16,
  },
  staffChoiceBtn: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.medium,
    marginBottom: 10,
    alignItems: 'center',
  },
  staffChoiceText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '600',
  },
  topAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  heroAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  cameraAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Shadows.small,
  },
  editModalScrollView: {
    maxHeight: 460,
  },
  modalHeaderSubtitle: {
    ...Typography.caption,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  avatarEditSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
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
    borderColor: Colors.primary,
  },
  modalAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  modalAvatarPlaceholderText: {
    ...Typography.h2,
    color: Colors.primary,
    fontWeight: '700',
  },
  modalAvatarOverlayBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.primary,
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
    borderRadius: BorderRadius.medium,
  },
  uploadBtnText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 13,
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
    borderRadius: BorderRadius.medium,
  },
  removePhotoBtnText: {
    ...Typography.caption,
    color: '#EF4444',
    fontWeight: '600',
  },
  presetsSection: {
    marginBottom: 14,
  },
  sectionMiniLabel: {
    ...Typography.caption,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    borderRadius: BorderRadius.medium,
  },
  presetItemSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: Colors.primary,
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
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  presetLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  presetLabelSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  lockedCredentialsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.medium,
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
    ...Typography.caption,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  lockedNotice: {
    ...Typography.caption,
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
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  lockedFieldValue: {
    ...Typography.bodyMedium,
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
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  lockedDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  pillBadgeEmerald: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  pillBadgeEmeraldText: {
    ...Typography.caption,
    color: '#059669',
    fontWeight: '700',
  },
  addressModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    maxHeight: '88%',
    paddingTop: 16,
    paddingHorizontal: 16,
    width: '100%',
    ...Shadows.large,
  },
  modalHeaderLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressIconCircleTop: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressModalScrollView: {
    marginTop: 12,
  },
  addressFormContainer: {
    paddingVertical: 8,
  },
  addressTagRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.medium,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagChipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: Colors.primary,
  },
  tagChipText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  tagChipTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: BorderRadius.medium,
    paddingVertical: 10,
    marginBottom: 16,
  },
  gpsDetectBtnText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
  },
  twoColInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addressFormActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    marginBottom: 12,
  },
  addressCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.medium,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressCancelBtnText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: '#475569',
  },
  addressSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.primary,
    ...Shadows.small,
  },
  addressSaveBtnText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addressListContainer: {
    paddingVertical: 8,
    gap: 12,
  },
  savedAddressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
    ...Shadows.small,
  },
  savedAddressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  addressTagBadgeText: {
    ...Typography.caption,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  primaryBadgeText: {
    ...Typography.caption,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#059669',
  },
  addressBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressFullText: {
    ...Typography.bodyMedium,
    flex: 1,
    color: '#1E293B',
    lineHeight: 20,
    fontWeight: '500',
  },
  addressCardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardEditActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.small,
    backgroundColor: '#EEF2FF',
  },
  cardEditActionText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
  },
  cardDeleteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.small,
    backgroundColor: '#FEF2F2',
  },
  cardDeleteActionText: {
    ...Typography.caption,
    fontWeight: '700',
    color: '#EF4444',
  },
  addNewAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.medium,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    marginTop: 6,
  },
  addNewAddressBtnText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyAddressBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 10,
  },
  emptyAddressIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyAddressTitle: {
    ...Typography.h3,
    color: '#1E293B',
    fontWeight: '700',
  },
  emptyAddressSubtitle: {
    ...Typography.bodyMedium,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  addFirstAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.medium,
    marginTop: 10,
    ...Shadows.medium,
  },
  addFirstAddressBtnText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmDeleteBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 999,
  },
  confirmDeleteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.large,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    ...Shadows.large,
  },
  confirmDeleteIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmDeleteTitle: {
    ...Typography.h3,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  confirmDeleteSubtitle: {
    ...Typography.bodySmall,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  confirmDeletePreviewBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.medium,
    padding: 12,
    marginBottom: 20,
    gap: 6,
  },
  confirmDeleteTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.small,
    alignSelf: 'flex-start',
  },
  confirmDeleteTagText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  confirmDeleteAddressText: {
    ...Typography.caption,
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  confirmDeleteActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmDeleteCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.medium,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteCancelText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: '#475569',
  },
  confirmDeleteSubmitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.medium,
    backgroundColor: '#EF4444',
  },
  confirmDeleteSubmitText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetModalCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    padding: 20,
    width: '100%',
    ...Shadows.large,
  },
  supportChannelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: BorderRadius.medium,
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
    ...Typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  supportSub: {
    ...Typography.caption,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  invoiceCardItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  invoiceItemNumber: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  invoiceItemTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: '#1E293B',
    fontSize: 14,
  },
  invoiceItemSub: {
    ...Typography.caption,
    color: '#64748B',
    marginTop: 2,
  },
  invoiceItemAmount: {
    ...Typography.titleMedium,
    fontWeight: '800',
    color: '#0F172A',
    fontSize: 16,
  },
  invoiceCardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  invoicePreviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: BorderRadius.medium,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  invoicePreviewBtnText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
  },
  invoiceDownloadActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: BorderRadius.medium,
    backgroundColor: '#2563EB',
  },
  invoiceDownloadActionText: {
    ...Typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
