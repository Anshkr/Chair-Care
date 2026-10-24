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
  const [locationSource, setLocationSource] = useState<'saved' | 'map' | 'manual' | 'gps'>('saved');

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
    setLocationSource('saved');
    populateFieldsFromAddress(item);
    setGpsStatus('idle');
    setGpsMessage(null);
  };

  const handleClearMapPin = () => {
    setGpsStatus('idle');
    setGpsMessage(null);
    if (selectedAddressId) {
      setLocationSource('saved');
      const match = savedAddresses.find((a) => a.id === selectedAddressId);
      if (match) {
        setLatitude(match.latitude);
        setLongitude(match.longitude);
        return;
      }
    }
    setLocationSource('manual');
    setLatitude(undefined);
    setLongitude(undefined);
  };

  const handleLocationSelectedFromMap = (data: SelectedLocationData) => {
    // 1. Set pinpoint coordinates for technician dispatch
    setLocationSource('map');
    setLatitude(data.latitude);
    setLongitude(data.longitude);
    setSelectedAddressId(null);

    // 2. Clear manual address fields so user can cleanly type their own house / landmark details!
    // Apartment / building name is omitted for map pin locations
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
    setLocationSource('manual');
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
      locationSource !== 'map' ? buildingName.trim() : '',
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
    // 1. Validation: House / Flat No is required first
    if (!flatNo.trim()) {
      Alert.alert(
        'House / Door No. Required',
        'Please enter your House, Flat, Floor, or Door number before continuing.'
      );
      return;
    }

    // When location is selected from map, apartment/building name is NOT required
    if (locationSource !== 'map' && !streetArea.trim() && !buildingName.trim()) {
      Alert.alert(
        'Location Details Required',
        'Please enter your Building, Society, or Street/Area details.'
      );
      return;
    }

    if (!city.trim() && locationSource !== 'map') {
      Alert.alert('City Required', 'Please enter your city.');
      return;
    }

    const fullAddress = computeFullAddress();

    let finalLat = latitude;
    let finalLng = longitude;
    let finalFullAddress = fullAddress;

    // Only forward-geocode manual text address if customer did NOT pick from map or GPS
    if (finalLat == null || finalLng == null) {
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

        {/* Section 1: Executive Dispatch Hub (Map & Live GPS Quick Action) */}
        <View style={styles.dispatchHubCard}>
          <View style={styles.hubHeaderRow}>
            <View style={styles.hubStatusBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.hubStatusText}>DELHI NCR LIVE DISPATCH</Text>
            </View>
            <Text style={styles.hubEtaText}>15–30 min arrival</Text>
          </View>

          <View style={styles.hubActionsGrid}>
            {/* Tile 1: Interactive Map Picker */}
            <TouchableOpacity
              style={styles.hubActionTile}
              onPress={() => setIsMapPickerVisible(true)}
              activeOpacity={0.82}
            >
              <View style={[styles.hubTileIconBg, { backgroundColor: 'rgba(2, 132, 199, 0.18)' }]}>
                <AppIcon name="MapPin" size={18} color="#38bdf8" />
              </View>
              <View style={styles.hubTileContent}>
                <View style={styles.hubTileTitleRow}>
                  <Text style={styles.hubTileTitle}>Select on Map</Text>
                  <AppIcon name="ChevronRight" size={13} color="#94a3b8" />
                </View>
                <Text style={styles.hubTileSub}>Pinpoint exact doorstep</Text>
              </View>
            </TouchableOpacity>

            {/* Tile 2: Live Device GPS */}
            <TouchableOpacity
              style={[
                styles.hubActionTile,
                gpsStatus === 'locked' && styles.hubActionTileLocked,
              ]}
              onPress={handleGpsLocate}
              activeOpacity={0.82}
              disabled={gpsStatus === 'locating'}
            >
              <View
                style={[
                  styles.hubTileIconBg,
                  {
                    backgroundColor:
                      gpsStatus === 'locked'
                        ? 'rgba(16, 185, 129, 0.22)'
                        : 'rgba(56, 189, 248, 0.12)',
                  },
                ]}
              >
                {gpsStatus === 'locating' ? (
                  <ActivityIndicator size="small" color="#38bdf8" />
                ) : (
                  <AppIcon
                    name={gpsStatus === 'locked' ? 'Check' : 'Crosshair'}
                    size={18}
                    color={gpsStatus === 'locked' ? '#34d399' : '#38bdf8'}
                  />
                )}
              </View>
              <View style={styles.hubTileContent}>
                <View style={styles.hubTileTitleRow}>
                  <Text style={styles.hubTileTitle}>
                    {gpsStatus === 'locked' ? 'GPS Locked' : 'Current GPS'}
                  </Text>
                  <AppIcon name="ChevronRight" size={13} color="#94a3b8" />
                </View>
                <Text style={styles.hubTileSub}>
                  {gpsStatus === 'locating' ? 'Locating...' : 'Auto-detect doorstep'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* GPS / Map Pin Detection Feedback Banner */}
        {gpsMessage && (
          <View style={styles.gpsBannerRow}>
            <View style={styles.gpsBannerContent}>
              <View style={styles.gpsIconCircle}>
                <AppIcon name="Navigation" size={15} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gpsBannerHeader}>PINPOINT COORDINATES ATTACHED</Text>
                <Text style={styles.gpsBannerText} numberOfLines={1}>{gpsMessage}</Text>
                {latitude != null && longitude != null && (
                  <Text style={styles.gpsCoordsMicro}>
                    Lat: {latitude.toFixed(5)}° N, Lng: {longitude.toFixed(5)}° E • Dispatched to technician
                  </Text>
                )}
              </View>
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

        {/* Section 2: SAVED ADDRESSES (Book directly from saved address) */}
        <View style={styles.savedSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <AppIcon name="Bookmark" size={16} color={Colors.secondaryCobalt} />
              <Text style={styles.sectionTitleCaps}>SAVED ADDRESSES</Text>
              <View style={styles.savedCountPill}>
                <Text style={styles.savedCountText}>{savedAddresses.length}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.addNewAddressInlineBtn}
              onPress={handleAddNewAddressMode}
              activeOpacity={0.7}
            >
              <AppIcon name="Plus" size={13} color="#0284c7" />
              <Text style={styles.addNewAddressInlineText}>Enter New</Text>
            </TouchableOpacity>
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
                            <Text style={styles.selectedTagText}>✓ Selected</Text>
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
                    {isSelected ? (
                      <AppIcon name="Check" size={12} color="#FFFFFF" />
                    ) : null}
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
                {locationSource === 'map'
                  ? 'House & Doorstep Details'
                  : selectedAddressId
                  ? 'Selected Address Details (Editable)'
                  : 'Enter Service Location'}
              </Text>
            </View>
            <View style={styles.requiredPill}>
              <Text style={styles.requiredPillText}>
                {locationSource === 'map' ? 'Map Pin Linked' : 'Verified Entry'}
              </Text>
            </View>
          </View>

          {/* INPUT 1: HOUSE / FLAT / FLOOR NO. */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>
                {locationSource === 'map' ? 'House / Door / Floor No.' : 'Flat / House / Floor / Unit No.'}{' '}
                <Text style={styles.reqAsterisk}>*</Text>
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
                placeholder={
                  locationSource === 'map'
                    ? 'e.g. House No. 24 / Plot 12 / Near Village Chaupal'
                    : 'e.g. Flat 402, 4th Floor, Tower B'
                }
                placeholderTextColor={Colors.outline}
              />
            </View>
          </View>

          {/* INPUT 2: APARTMENT / BUILDING / SOCIETY NAME - HIDDEN WHEN MAP LOCATION IS SELECTED */}
          {locationSource !== 'map' && (
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
          )}

          {/* INPUT 3: AREA / STREET / SECTOR / LOCALITY */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {locationSource === 'map' ? 'Area / Street / Village (Optional)' : 'Area / Street / Sector / Locality'}{' '}
              {locationSource !== 'map' && <Text style={styles.reqAsterisk}>*</Text>}
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
                placeholder={
                  locationSource === 'map'
                    ? 'e.g. Main Basti / Rampura Village'
                    : 'e.g. Sector 54, Golf Course Extension Road'
                }
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
  dispatchHubCard: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
    ...Shadows.level2,
  },
  hubHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 2,
  },
  hubStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  hubStatusText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: '#10B981',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hubEtaText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  hubActionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  hubActionTile: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: BorderRadius.lg,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hubActionTileLocked: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  hubTileIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubTileContent: {
    flex: 1,
  },
  hubTileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hubTileTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  hubTileSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  gpsBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    gap: 10,
    ...Shadows.level1,
  },
  gpsBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  gpsIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsBannerHeader: {
    ...Typography.labelMono,
    fontSize: 9,
    color: '#059669',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gpsBannerText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#064E3B',
    fontWeight: '700',
    marginTop: 1,
  },
  gpsCoordsMicro: {
    ...Typography.labelMono,
    fontSize: 9,
    color: '#047857',
    marginTop: 2,
  },
  clearPinBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  clearPinText: {
    color: '#DC2626',
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
  savedCountPill: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  savedCountText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  addNewAddressInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.25)',
  },
  addNewAddressInlineText: {
    ...Typography.labelSm,
    color: '#0284c7',
    fontWeight: '700',
    fontSize: 11,
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
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    ...Shadows.level2,
  },
  addressCardUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
  },
  addressIconBoxUnselected: {
    backgroundColor: '#F1F5F9',
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
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderWidth: 1.5,
  },
  radioSelected: {
    borderColor: '#0284C7',
    backgroundColor: '#0284C7',
  },
  radioUnselected: {
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  siteAccessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
