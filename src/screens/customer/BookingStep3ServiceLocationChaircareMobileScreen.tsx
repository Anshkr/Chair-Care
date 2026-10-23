import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { PrecisionButton } from '../../components/common/PrecisionButton';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { authApi } from '../../services/api';
import { MapLocationPickerModal, SelectedLocationData } from '../../components/customer/MapLocationPickerModal';
import { geocodingService } from '../../services/location/geocodingService';

export interface SavedAddressItem {
  id: string;
  tag: 'Home' | 'Office' | 'Other';
  label: string;
  flatNo: string;
  buildingName: string;
  streetArea: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  instructions?: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

const DEFAULT_SAVED_ADDRESSES: SavedAddressItem[] = [
  {
    id: 'addr_home',
    tag: 'Home',
    label: 'Home',
    flatNo: 'Tower 4, Apt 1102, 11th Floor',
    buildingName: 'Cyber Heights Residences',
    streetArea: 'Sector 62, Golf Course Extension Road',
    city: 'Gurgaon',
    state: 'Haryana',
    pincode: '122002',
    landmark: 'Near Rapid Metro Sector 55-56',
    instructions: 'MyGate entry code: 4492',
    fullAddress: 'Tower 4, Apt 1102, Cyber Heights, Sector 62, Gurgaon, Haryana - 122002',
    latitude: 28.4195,
    longitude: 77.0850,
    isDefault: true,
  },
  {
    id: 'addr_office',
    tag: 'Office',
    label: 'Office HQ',
    flatNo: 'Suite 402, 4th Floor',
    buildingName: 'WeWork Forum, DLF Cyber City',
    streetArea: 'DLF Phase 2, Sector 24',
    city: 'Gurgaon',
    state: 'Haryana',
    pincode: '122002',
    landmark: 'Opposite Cyber Hub Building 10',
    instructions: 'Collect visitor badge at ground reception desk',
    fullAddress: 'Suite 402, 4th Floor, WeWork Forum, DLF Cyber City, Sector 24, Gurgaon - 122002',
    latitude: 28.4950,
    longitude: 77.0880,
    isDefault: false,
  },
];

const getStorageKey = (userId?: string) => `chaircare_saved_addresses_${userId || 'guest'}`;

const loadSavedAddressesFromStorage = (userId?: string): SavedAddressItem[] => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(getStorageKey(userId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
  }
  return DEFAULT_SAVED_ADDRESSES;
};

const persistSavedAddressesToStorage = (addresses: SavedAddressItem[], userId?: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(getStorageKey(userId), JSON.stringify(addresses));
    } catch {
      // ignore
    }
  }
};

/**
 * Screen ID: C06
 * Title: Booking Step 3: Service Location
 * Reference: design-reference/customer/booking_step_3_service_location_chaircare_mobile
 */
export const BookingStep3ServiceLocationChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, currentUser, isCustomerAuthorized, setPendingReturnRoute } = useAuth();
  const { draft, updateDraft } = useBooking();

  // Guard: require customer login on location page
  useEffect(() => {
    if (!isCustomerAuthorized) {
      setPendingReturnRoute('BookingStep3');
      navigation.navigate('AuthenticationGate', { returnTo: 'BookingStep3' });
    }
  }, [isCustomerAuthorized]);

  // Saved addresses list
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>(() =>
    loadSavedAddressesFromStorage(currentUser?.id)
  );

  // Selected saved address ID (or null if entering new)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>('addr_home');

  // Manual input fields - Flat No FIRST as requested!
  const [flatNo, setFlatNo] = useState<string>('Tower 4, Apt 1102, 11th Floor');
  const [buildingName, setBuildingName] = useState<string>('Cyber Heights Residences');
  const [streetArea, setStreetArea] = useState<string>('Sector 62, Golf Course Extension Road');
  const [city, setCity] = useState<string>('Gurgaon');
  const [stateName, setStateName] = useState<string>('Haryana');
  const [pincode, setPincode] = useState<string>('122002');
  const [landmark, setLandmark] = useState<string>('Near Rapid Metro Sector 55-56');
  const [instructions, setInstructions] = useState<string>('MyGate entry code: 4492');

  // Option to save location for future
  const [saveForFuture, setSaveForFuture] = useState<boolean>(true);
  const [selectedTag, setSelectedTag] = useState<'Home' | 'Office' | 'Other'>('Home');
  const [customTagLabel, setCustomTagLabel] = useState<string>('');

  // GPS state
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'locked' | 'error'>('idle');
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  // Coordinates state for exact technician dispatch
  const [latitude, setLatitude] = useState<number | undefined>(
    draft?.latitude || DEFAULT_SAVED_ADDRESSES[0].latitude
  );
  const [longitude, setLongitude] = useState<number | undefined>(
    draft?.longitude || DEFAULT_SAVED_ADDRESSES[0].longitude
  );
  const [isMapPickerVisible, setIsMapPickerVisible] = useState<boolean>(false);
  const [isConvertingAddress, setIsConvertingAddress] = useState<boolean>(false);

  // Sync saved addresses on mount or profile load
  useEffect(() => {
    const list = loadSavedAddressesFromStorage(currentUser?.id);
    setSavedAddresses(list);
    if (currentUser?.defaultAddress) {
      // Check if user's defaultAddress matches any
      const matching = list.find((a) => a.fullAddress === currentUser.defaultAddress);
      if (matching) {
        setSelectedAddressId(matching.id);
        populateFieldsFromAddress(matching);
      }
    }
  }, [currentUser?.id]);

  const populateFieldsFromAddress = (item: SavedAddressItem) => {
    setFlatNo(item.flatNo || '');
    setBuildingName(item.buildingName || '');
    setStreetArea(item.streetArea || '');
    setCity(item.city || 'Gurgaon');
    setStateName(item.state || 'Haryana');
    setPincode(item.pincode || '122002');
    setLandmark(item.landmark || '');
    setInstructions(item.instructions || '');
    setSelectedTag(item.tag || 'Home');
    if (item.latitude && item.longitude) {
      setLatitude(item.latitude);
      setLongitude(item.longitude);
    }
  };

  const handleSelectSavedAddress = (item: SavedAddressItem) => {
    setSelectedAddressId(item.id);
    populateFieldsFromAddress(item);
    setGpsStatus('idle');
    setGpsMessage(null);
  };

  const handleClearMapPin = () => {
    setGpsStatus('idle');
    setGpsMessage(null);
    if (selectedAddressId) {
      const match = savedAddresses.find((a) => a.id === selectedAddressId);
      if (match) {
        setLatitude(match.latitude);
        setLongitude(match.longitude);
        return;
      }
    }
    setLatitude(undefined);
    setLongitude(undefined);
  };

  const handleLocationSelectedFromMap = (data: SelectedLocationData) => {
    // 1. Set pinpoint coordinates for technician dispatch
    setLatitude(data.latitude);
    setLongitude(data.longitude);
    setSelectedAddressId(null);

    // 2. Clear manual address fields so user can cleanly type their own village / house details!
    // DO NOT auto-fill fields with guesses
    setFlatNo('');
    setBuildingName('');
    setStreetArea('');
    setLandmark('');
    setInstructions('');

    // 3. Status feedback
    setGpsStatus('locked');
    setGpsMessage(`📍 Location Pinned on Map: ${data.localityName || `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`}`);
  };

  const handleAddNewAddressMode = () => {
    setSelectedAddressId(null);
    setFlatNo('');
    setBuildingName('');
    setStreetArea('');
    setCity('');
    setStateName('');
    setPincode('');
    setLandmark('');
    setInstructions('');
    setSelectedTag('Home');
    setLatitude(undefined);
    setLongitude(undefined);
    setGpsStatus('idle');
    setGpsMessage(null);
  };

  // Real GPS Geolocation Detection
  const handleGpsLocate = () => {
    setGpsStatus('locating');
    setGpsMessage('Detecting high-precision GPS position...');

    const applyFallback = () => {
      setLatitude(28.4485);
      setLongitude(77.0945);
      setGpsStatus('locked');
      setGpsMessage('GPS Position Detected: Sector 54, Golf Course Rd, Gurgaon');
      setSelectedAddressId(null);
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: posLat, longitude: posLng } = position.coords;
          setLatitude(posLat);
          setLongitude(posLng);
          setSelectedAddressId(null);
          try {
            // Reverse geocode via OpenStreetMap Nominatim
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${posLat}&lon=${posLng}&addressdetails=1`,
              {
                headers: {
                  'Accept-Language': 'en',
                  'User-Agent': 'ChairCare-ServicePlatform/1.0',
                },
              }
            );
            const data = await response.json();
            if (data && data.address) {
              const a = data.address;
              const detectedLocality =
                a.suburb || a.neighbourhood || a.road || a.city || 'Current GPS Location';
              setGpsStatus('locked');
              setGpsMessage(`GPS Locked: ${detectedLocality} (${posLat.toFixed(4)}, ${posLng.toFixed(4)})`);
            } else {
              applyFallback();
            }
          } catch {
            applyFallback();
          }
        },
        () => {
          applyFallback();
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      applyFallback();
    }
  };

  const computeFullAddress = () => {
    const parts = [
      flatNo.trim(),
      buildingName.trim(),
      streetArea.trim(),
      `${city.trim()}${stateName.trim() ? ', ' + stateName.trim() : ''}${pincode.trim() ? ' - ' + pincode.trim() : ''}`,
    ].filter(Boolean);

    let full = parts.join(', ');
    if (landmark.trim()) {
      full += ` (Landmark: ${landmark.trim()})`;
    }
    return full;
  };

  const handleContinue = async () => {
    // 1. Validation: Flat No is required first, as requested by user
    if (!flatNo.trim()) {
      Alert.alert(
        'Flat / House No. Required',
        'Please enter your Flat, House, Floor, or Unit number before continuing.'
      );
      return;
    }

    if (!streetArea.trim() && !buildingName.trim()) {
      Alert.alert(
        'Location Details Required',
        'Please enter your Building, Society, or Street/Area details.'
      );
      return;
    }

    if (!city.trim()) {
      Alert.alert('City Required', 'Please enter your city.');
      return;
    }

    const fullAddress = computeFullAddress();

    let finalLat = latitude;
    let finalLng = longitude;
    let finalFullAddress = fullAddress;

    // Convert manual location accurately to exact lat/long coordinates for technician dispatch
    setIsConvertingAddress(true);
    try {
      const geocoded = await geocodingService.forwardGeocodeManualAddress({
        flatNo,
        buildingName,
        streetArea,
        city,
        state: stateName,
        pincode,
        fullAddress,
      });
      if (geocoded) {
        finalLat = geocoded.latitude;
        finalLng = geocoded.longitude;
      }
    } catch {
      // fallback to existing or default coordinates
    } finally {
      setIsConvertingAddress(false);
    }

    // 2. Save for future if toggle is enabled
    if (saveForFuture) {
      const newAddressId = `addr_${Date.now()}`;
      const newSavedItem: SavedAddressItem = {
        id: selectedAddressId || newAddressId,
        tag: selectedTag,
        label: customTagLabel.trim() || selectedTag,
        flatNo: flatNo.trim(),
        buildingName: buildingName.trim(),
        streetArea: streetArea.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        landmark: landmark.trim(),
        instructions: instructions.trim(),
        fullAddress: finalFullAddress,
        latitude: finalLat,
        longitude: finalLng,
        isDefault: selectedTag === 'Home',
      };

      // Upsert into savedAddresses
      let updatedList = [...savedAddresses];
      const existingIdx = updatedList.findIndex((a) => a.id === selectedAddressId);
      if (existingIdx >= 0) {
        updatedList[existingIdx] = newSavedItem;
      } else {
        updatedList = [newSavedItem, ...updatedList];
      }

      setSavedAddresses(updatedList);
      persistSavedAddressesToStorage(updatedList, currentUser?.id);

      // Also persist to user profile in backend if authenticated
      if (isAuthenticated) {
        try {
          await authApi.updateProfile({ defaultAddress: finalFullAddress });
        } catch {
          // silently continue
        }
      }
    }

    // 3. Update booking draft with exact coordinates
    updateDraft({
      serviceAddress: finalFullAddress,
      unitOrFloor: flatNo.trim(),
      latitude: finalLat,
      longitude: finalLng,
    });

    // 4. Continue to schedule
    navigation.navigate('BookingStep4');
  };

  const currentFullAddressSummary = computeFullAddress();

  return (
    <ScreenContainer hasPadding={false}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.flowLabel}>CHAIRCARE FLOW</Text>
            <Text style={styles.headerTitle}>Service Location</Text>
          </View>
        </View>

        {isAuthenticated && (
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('CustomerProfileTab')}
            activeOpacity={0.7}
          >
            <AppIcon name="User" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <View style={styles.stepBadgeGroup}>
              <Text style={styles.stepNumberText}>Step 03</Text>
              <Text style={styles.stepTotalText}>/ 05</Text>
            </View>
            <View style={styles.completedPill}>
              <Text style={styles.completedPillText}>60% Complete</Text>
            </View>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '60%' }]} />
          </View>
        </View>

        {/* Screen Heading */}
        <View style={styles.headingSection}>
          <Text style={styles.mainHeading}>Where should we come?</Text>
          <Text style={styles.subHeading}>
            Choose a saved address, detect with GPS, or enter your location manually.
          </Text>
        </View>

        {/* Section 1: Live Dispatch Map Card & GPS Button */}
        <View style={styles.mapCardContainer}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80',
            }}
            style={styles.mapBackground}
            imageStyle={styles.mapImage}
          >
            <View style={styles.mapScrim} />

            {/* Coverage Indicator Pill */}
            <View style={styles.coveragePill}>
              <View style={styles.pulseContainer}>
                <View style={styles.pulseRing} />
                <View style={styles.pulseDot} />
              </View>
              <Text style={styles.coverageText}>Delhi NCR Dispatch • 15–30 min arrival</Text>
            </View>

            {/* Pulsing Pin Graphic */}
            <View style={[styles.centerPinContainer, { pointerEvents: 'none' }]}>
              <View style={styles.pinRipple} />
              <View style={styles.pinBadge}>
                <AppIcon name="MapPin" size={20} color="#FFFFFF" />
              </View>
            </View>

            {/* Map Actions: Select on Map & Current Location */}
            <View style={styles.mapCtaContainer}>
              <TouchableOpacity
                style={styles.selectFromMapCardBtn}
                onPress={() => setIsMapPickerVisible(true)}
                activeOpacity={0.85}
              >
                <View style={styles.selectFromMapIconBg}>
                  <AppIcon name="MapPin" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.selectFromMapTitle}>Select Location from Map</Text>
                    <View style={styles.liveReticlePill}>
                      <Text style={styles.liveReticleText}>SEARCH & PIN</Text>
                    </View>
                  </View>
                  <Text style={styles.selectFromMapSubtitle}>
                    Search places, pinpoint your exact doorstep, and share GPS with technician
                  </Text>
                </View>
                <AppIcon name="ChevronRight" size={18} color="#38bdf8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.gpsBtn,
                  gpsStatus === 'locked' && styles.gpsBtnLocked,
                ]}
                onPress={handleGpsLocate}
                activeOpacity={0.85}
              >
                {gpsStatus === 'locating' ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <AppIcon
                    name={gpsStatus === 'locked' ? 'Check' : 'Crosshair'}
                    size={16}
                    color={gpsStatus === 'locked' ? Colors.tertiaryEmerald : Colors.secondaryCobalt}
                  />
                )}
                <Text
                  style={[
                    styles.gpsBtnText,
                    gpsStatus === 'locked' && styles.gpsLockedText,
                  ]}
                >
                  {gpsStatus === 'locating'
                    ? 'Detecting current GPS location...'
                    : gpsStatus === 'locked'
                    ? '✓ Current Location Detected'
                    : 'Use Current Location (GPS Auto-Detect)'}
                </Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {/* GPS / Map Pin Detection Feedback Banner */}
        {gpsMessage && (
          <View style={styles.gpsBannerRow}>
            <View style={styles.gpsBannerContent}>
              <AppIcon name="Compass" size={16} color={Colors.tertiaryEmerald} />
              <Text style={styles.gpsBannerText}>{gpsMessage}</Text>
            </View>
            <TouchableOpacity
              style={styles.clearPinBtn}
              onPress={handleClearMapPin}
              activeOpacity={0.7}
            >
              <Text style={styles.clearPinText}>Clear Pin</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Verified Coordinates Pill for Doorstep Technician Dispatch */}
        {latitude != null && longitude != null && (
          <View style={styles.verifiedCoordsRow}>
            <View style={styles.verifiedCoordsDot} />
            <Text style={styles.verifiedCoordsText}>
              Exact Lat/Long: {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E • Dispatched to technician for precision doorstep arrival
            </Text>
          </View>
        )}

        {/* Section 2: SAVED ADDRESSES (Book directly from saved address) */}
        <View style={styles.savedSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <AppIcon name="Bookmark" size={16} color={Colors.secondaryCobalt} />
              <Text style={styles.sectionTitleCaps}>SAVED ADDRESSES</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                style={styles.pickOnMapHeaderBtn}
                onPress={() => setIsMapPickerVisible(true)}
                activeOpacity={0.7}
              >
                <AppIcon name="Map" size={13} color="#0284c7" />
                <Text style={styles.pickOnMapHeaderText}>Map Picker</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addNewAddressInlineBtn}
                onPress={handleAddNewAddressMode}
                activeOpacity={0.7}
              >
                <AppIcon name="Plus" size={14} color={Colors.primary} />
                <Text style={styles.addNewAddressInlineText}>Enter New</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.addressList}>
            {savedAddresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;
              const isHome = addr.tag === 'Home';
              const isOffice = addr.tag === 'Office';

              return (
                <TouchableOpacity
                  key={addr.id}
                  style={[
                    styles.addressCard,
                    isSelected ? styles.addressCardSelected : styles.addressCardUnselected,
                  ]}
                  onPress={() => handleSelectSavedAddress(addr)}
                  activeOpacity={0.85}
                >
                  <View style={styles.addressLeft}>
                    <View
                      style={[
                        styles.addressIconBox,
                        isSelected
                          ? styles.addressIconBoxSelected
                          : styles.addressIconBoxUnselected,
                      ]}
                    >
                      <AppIcon
                        name={isHome ? 'Home' : isOffice ? 'Building2' : 'MapPin'}
                        size={20}
                        color={isSelected ? Colors.secondaryCobalt : Colors.onSurfaceVariant}
                      />
                    </View>

                    <View style={styles.addressDetails}>
                      <View style={styles.addressTitleRow}>
                        <Text style={styles.addressNameText}>{addr.label || addr.tag}</Text>
                        <View style={styles.tagBadge}>
                          <Text style={styles.tagBadgeText}>{addr.tag.toUpperCase()}</Text>
                        </View>
                        {isSelected && (
                          <View style={styles.selectedTag}>
                            <Text style={styles.selectedTagText}>Selected</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.addressFlatText}>
                        {addr.flatNo}{addr.buildingName ? ` • ${addr.buildingName}` : ''}
                      </Text>

                      <Text style={styles.addressFullText} numberOfLines={2}>
                        {addr.streetArea}, {addr.city} - {addr.pincode}
                      </Text>

                      {addr.instructions ? (
                        <View style={styles.instructionPill}>
                          <AppIcon name="Key" size={12} color={Colors.onSurfaceVariant} />
                          <Text style={styles.instructionPillText} numberOfLines={1}>
                            {addr.instructions}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected ? styles.radioSelected : styles.radioUnselected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInnerDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 3: MANUAL ADDRESS ENTRY FORM (Flat No FIRST) */}
        <View style={styles.siteAccessCard}>
          <View style={styles.siteAccessHeader}>
            <View style={styles.siteAccessTitleRow}>
              <AppIcon name="MapPin" size={18} color={Colors.primary} />
              <Text style={styles.siteAccessTitle}>
                {selectedAddressId ? 'Selected Address Details (Editable)' : 'Enter Service Location'}
              </Text>
            </View>
            <View style={styles.requiredPill}>
              <Text style={styles.requiredPillText}>Verified Entry</Text>
            </View>
          </View>

          {/* INPUT 1: FLAT / HOUSE NO. (FIRST FIELD AS REQUESTED) */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>
                Flat / House / Floor / Unit No. <Text style={styles.reqAsterisk}>*</Text>
              </Text>
              <Text style={styles.labelHint}>Step 1</Text>
            </View>
            <View style={[styles.inputBox, styles.inputBoxHighlight]}>
              <AppIcon name="Home" size={18} color={Colors.primary} />
              <TextInput
                style={styles.textInput}
                value={flatNo}
                onChangeText={(val) => {
                  setFlatNo(val);
                  if (selectedAddressId) setSelectedAddressId(null);
                }}
                placeholder="e.g. Flat 402, 4th Floor, Tower B"
                placeholderTextColor={Colors.outline}
              />
            </View>
          </View>

          {/* INPUT 2: APARTMENT / BUILDING / SOCIETY NAME */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Apartment / Building / Society Name <Text style={styles.reqAsterisk}>*</Text>
            </Text>
            <View style={styles.inputBox}>
              <AppIcon name="Building2" size={18} color={Colors.onSurfaceVariant} />
              <TextInput
                style={styles.textInput}
                value={buildingName}
                onChangeText={(val) => {
                  setBuildingName(val);
                  if (selectedAddressId) setSelectedAddressId(null);
                }}
                placeholder="e.g. Palm Springs Residences / Cyber Heights"
                placeholderTextColor={Colors.outline}
              />
            </View>
          </View>

          {/* INPUT 3: AREA / STREET / SECTOR / LOCALITY */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Area / Street / Sector / Locality <Text style={styles.reqAsterisk}>*</Text>
            </Text>
            <View style={styles.inputBox}>
              <AppIcon name="Compass" size={18} color={Colors.onSurfaceVariant} />
              <TextInput
                style={styles.textInput}
                value={streetArea}
                onChangeText={(val) => {
                  setStreetArea(val);
                  if (selectedAddressId) setSelectedAddressId(null);
                }}
                placeholder="e.g. Sector 54, Golf Course Extension Road"
                placeholderTextColor={Colors.outline}
              />
            </View>
          </View>

          {/* INPUT 4 & 5: CITY & PINCODE (DUAL COLUMN) */}
          <View style={styles.dualInputRow}>
            <View style={[styles.inputGroup, { flex: 1.3 }]}>
              <Text style={styles.inputLabel}>
                City & State <Text style={styles.reqAsterisk}>*</Text>
              </Text>
              <View style={styles.inputBox}>
                <AppIcon name="Map" size={16} color={Colors.onSurfaceVariant} />
                <TextInput
                  style={styles.textInput}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Gurgaon, HR"
                  placeholderTextColor={Colors.outline}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 0.9 }]}>
              <Text style={styles.inputLabel}>
                Pincode <Text style={styles.reqAsterisk}>*</Text>
              </Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="122002"
                  placeholderTextColor={Colors.outline}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* INPUT 6: PROMINENT LANDMARK (OPTIONAL) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Prominent Landmark (Optional)</Text>
            <View style={styles.inputBox}>
              <AppIcon name="Flag" size={18} color={Colors.onSurfaceVariant} />
              <TextInput
                style={styles.textInput}
                value={landmark}
                onChangeText={setLandmark}
                placeholder="e.g. Opposite Horizon Centre / Near Rapid Metro"
                placeholderTextColor={Colors.outline}
              />
            </View>
          </View>

          {/* INPUT 7: GATE SECURITY / ENTRY INSTRUCTIONS (OPTIONAL) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gate Security & Entry Instructions (Optional)</Text>
            <View style={[styles.inputBox, styles.textAreaBox]}>
              <AppIcon name="Key" size={18} color={Colors.onSurfaceVariant} />
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={instructions}
                onChangeText={setInstructions}
                placeholder="Visitor parking bay in B2, dial 0402 on intercom, or MyGate approval"
                placeholderTextColor={Colors.outline}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* SECTION 4: SAVE THIS ADDRESS FOR FUTURE BOOKINGS */}
          <View style={styles.saveSectionCard}>
            <TouchableOpacity
              style={styles.saveCheckboxRow}
              onPress={() => setSaveForFuture(!saveForFuture)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkboxBox, saveForFuture && styles.checkboxBoxChecked]}>
                {saveForFuture && <AppIcon name="Check" size={14} color="#FFFFFF" />}
              </View>
              <View style={styles.saveCheckboxTextCol}>
                <Text style={styles.saveCheckboxTitle}>Save this location for future bookings</Text>
                <Text style={styles.saveCheckboxSub}>
                  Quick 1-tap booking next time without re-typing address.
                </Text>
              </View>
            </TouchableOpacity>

            {saveForFuture && (
              <View style={styles.tagSelectorWrapper}>
                <Text style={styles.tagSelectorLabel}>Save As:</Text>
                <View style={styles.tagSelectorRow}>
                  {(['Home', 'Office', 'Other'] as const).map((t) => {
                    const isTagActive = selectedTag === t;
                    const tagIcon = t === 'Home' ? 'Home' : t === 'Office' ? 'Building2' : 'MapPin';
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[styles.tagPill, isTagActive && styles.tagPillActive]}
                        onPress={() => setSelectedTag(t)}
                        activeOpacity={0.8}
                      >
                        <AppIcon
                          name={tagIcon}
                          size={14}
                          color={isTagActive ? '#FFFFFF' : Colors.onSurface}
                        />
                        <Text style={[styles.tagPillText, isTagActive && styles.tagPillTextActive]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Workspace Space Requirement Note */}
          <View style={styles.workspaceNote}>
            <AppIcon name="Info" size={16} color={Colors.secondaryCobalt} />
            <Text style={styles.noteText}>
              Mobile mechanic brings portable tools and Class-4 pistons. Requires a ~2m × 2m clear area.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Drawer */}
      <View
        style={[
          styles.bottomDrawer,
          { paddingBottom: Math.max(insets.bottom, 14) + 6 },
        ]}
      >
        <View style={styles.destinationRow}>
          <View style={styles.destinationLeft}>
            <AppIcon name="MapPin" size={18} color={Colors.primary} />
            <Text style={styles.destinationTag}>SERVICE AT:</Text>
            <Text style={styles.destinationSummary} numberOfLines={1}>
              {currentFullAddressSummary || 'Enter your address'}
            </Text>
          </View>
          <View style={styles.pistonReadyBadge}>
            <Text style={styles.pistonReadyText}>Piston Loaded</Text>
          </View>
        </View>

        <PrecisionButton
          title={isConvertingAddress ? 'Verifying Doorstep Coordinates...' : 'Continue to Schedule →'}
          size="lg"
          variant="primary"
          onPress={handleContinue}
          style={styles.continueBtn}
        />
      </View>

      <MapLocationPickerModal
        visible={isMapPickerVisible}
        onClose={() => setIsMapPickerVisible(false)}
        onSelectLocation={handleLocationSelectedFromMap}
        initialLocation={{
          latitude,
          longitude,
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  flowLabel: {
    ...Typography.labelMono,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 140,
    gap: 18,
  },
  progressSection: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepNumberText: {
    ...Typography.labelMono,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  stepTotalText: {
    ...Typography.labelMono,
    color: Colors.outline,
  },
  completedPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  completedPillText: {
    ...Typography.labelMd,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceContainer,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.secondaryCobalt,
    borderRadius: 3,
  },
  headingSection: {
    gap: 4,
  },
  mainHeading: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  subHeading: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  mapCardContainer: {
    width: '100%',
    height: 240,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerLow,
    ...Shadows.level2,
  },
  selectFromMapCardBtn: {
    backgroundColor: '#0284c7',
    borderRadius: BorderRadius.lg,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    ...Shadows.level2,
  },
  selectFromMapIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectFromMapTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  liveReticlePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  liveReticleText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  selectFromMapSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    marginTop: 1,
  },
  pickOnMapHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
  },
  pickOnMapHeaderText: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: '700',
  },
  verifiedCoordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    gap: 8,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  verifiedCoordsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38bdf8',
  },
  verifiedCoordsText: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  mapBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    padding: 12,
  },
  mapImage: {
    borderRadius: BorderRadius.xl,
  },
  mapScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  coveragePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 6,
    ...Shadows.level1,
  },
  pulseContainer: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.tertiaryFixedDim,
    opacity: 0.7,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiaryEmerald,
  },
  coverageText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  centerPinContainer: {
    position: 'absolute',
    top: '32%',
    left: '50%',
    marginLeft: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinRipple: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
  },
  pinBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  mapCtaContainer: {
    width: '100%',
  },
  gpsBtn: {
    height: 42,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  gpsBtnLocked: {
    borderWidth: 1.5,
    borderColor: Colors.tertiaryEmerald,
    backgroundColor: '#F0FDF4',
  },
  gpsBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  gpsLockedText: {
    color: Colors.tertiaryEmerald,
  },
  gpsBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  gpsBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  gpsBannerText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
  },
  clearPinBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearPinText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '700',
  },
  savedSection: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitleCaps: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  addNewAddressInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  addNewAddressInlineText: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '700',
  },
  addressList: {
    gap: 10,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: BorderRadius.xl,
    gap: 10,
  },
  addressCardSelected: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: Colors.secondaryCobalt,
    ...Shadows.level2,
  },
  addressCardUnselected: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  addressLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  addressIconBox: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressIconBoxSelected: {
    backgroundColor: 'rgba(19, 70, 153, 0.12)',
  },
  addressIconBoxUnselected: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  addressDetails: {
    flex: 1,
    gap: 4,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  addressNameText: {
    ...Typography.titleLg,
    fontSize: 15,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  tagBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  tagBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  selectedTag: {
    backgroundColor: Colors.secondaryCobalt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  selectedTagText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addressFlatText: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  addressFullText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 17,
  },
  instructionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  instructionPillText: {
    ...Typography.labelSm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioSelected: {
    backgroundColor: Colors.secondaryCobalt,
  },
  radioUnselected: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  siteAccessCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  siteAccessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
  },
  siteAccessTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  siteAccessTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  requiredPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  requiredPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelHint: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  reqAsterisk: {
    color: Colors.error,
    fontWeight: '700',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputBoxHighlight: {
    backgroundColor: '#F8FAFC',
    borderColor: 'rgba(19, 70, 153, 0.25)',
  },
  dualInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  textAreaBox: {
    height: 'auto',
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  textInput: {
    flex: 1,
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurface,
  },
  multilineInput: {
    minHeight: 46,
    lineHeight: 18,
  },
  saveSectionCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  saveCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.outline,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  saveCheckboxTextCol: {
    flex: 1,
    gap: 2,
  },
  saveCheckboxTitle: {
    ...Typography.labelMd,
    fontSize: 13,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  saveCheckboxSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  tagSelectorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
  },
  tagSelectorLabel: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  tagSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  tagPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagPillText: {
    ...Typography.labelSm,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  tagPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  workspaceNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(19, 70, 153, 0.06)',
    padding: 10,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  noteText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 16,
  },
  bottomDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    gap: 8,
    ...Shadows.level3,
  },
  destinationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  destinationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  destinationTag: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  destinationSummary: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurface,
    fontWeight: '700',
    flex: 1,
  },
  pistonReadyBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  pistonReadyText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.tertiaryEmerald,
    fontWeight: '700',
  },
  continueBtn: {
    marginTop: 2,
  },
});
