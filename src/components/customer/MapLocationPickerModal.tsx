import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { AppIcon } from '../common/AppIcon';
import { PrecisionButton } from '../common/PrecisionButton';
import { geocodingService, GeocodedPlace } from '../../services/location/geocodingService';

export interface SelectedLocationData {
  latitude: number;
  longitude: number;
  localityName?: string;
  formattedAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface MapLocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (data: SelectedLocationData) => void;
  initialLocation?: {
    latitude?: number;
    longitude?: number;
  };
}

// Default center: Gurgaon Cyber City
const DEFAULT_LAT = 28.4595;
const DEFAULT_LNG = 77.0266;

export const MapLocationPickerModal: React.FC<MapLocationPickerModalProps> = ({
  visible,
  onClose,
  onSelectLocation,
  initialLocation,
}) => {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: initialLocation?.latitude || DEFAULT_LAT,
    longitude: initialLocation?.longitude || DEFAULT_LNG,
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodedPlace[]>([]);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);

  // Loading reverse geocode
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [detectedAddressSummary, setDetectedAddressSummary] = useState('');
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  const searchTimerRef = useRef<any>(null);

  // Sync initial coordinates when modal opens
  useEffect(() => {
    if (visible) {
      const lat = initialLocation?.latitude || DEFAULT_LAT;
      const lng = initialLocation?.longitude || DEFAULT_LNG;
      setCoords({ latitude: lat, longitude: lng });
      reverseGeocodeCoords(lat, lng);
    }
  }, [visible]);

  // Handle place search with debounce
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (text.trim().length < 2) {
      setSearchResults([]);
      setShowResultsDropdown(false);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await geocodingService.searchPlaces(text);
      setSearchResults(results);
      setShowResultsDropdown(results.length > 0);
      setIsSearching(false);
    }, 350);
  };

  const handleSelectSearchResult = (place: GeocodedPlace) => {
    setCoords({ latitude: place.latitude, longitude: place.longitude });
    setSearchQuery(place.title);
    setShowResultsDropdown(false);
    setDetectedAddressSummary(place.subtitle || place.fullAddress);
  };

  // Reverse geocode whenever pin coordinates change (only for display summary, never fills text fields)
  const reverseGeocodeCoords = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await geocodingService.reverseGeocode(lat, lng);
      setDetectedAddressSummary(res.formattedAddress);
    } catch {
      setDetectedAddressSummary(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // GPS Current Location Button
  const handleUseCurrentLocation = () => {
    setIsLocatingGps(true);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ latitude, longitude });
          reverseGeocodeCoords(latitude, longitude);
          setIsLocatingGps(false);
        },
        () => {
          setIsLocatingGps(false);
          Alert.alert(
            'GPS Signal',
            'Could not retrieve live GPS coordinates. Please ensure location services are enabled or search for your location.'
          );
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsLocatingGps(false);
      Alert.alert('GPS Notice', 'Location services are not available on this device.');
    }
  };

  // Adjust coordinates slightly with pan arrows
  const handleNudgeCoords = (deltaLat: number, deltaLng: number) => {
    const newLat = coords.latitude + deltaLat;
    const newLng = coords.longitude + deltaLng;
    setCoords({ latitude: newLat, longitude: newLng });
    reverseGeocodeCoords(newLat, newLng);
  };

  const handleConfirm = () => {
    onSelectLocation({
      latitude: coords.latitude,
      longitude: coords.longitude,
      localityName: detectedAddressSummary || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
      formattedAddress: detectedAddressSummary,
    });
    onClose();
  };

  // Universal HTML for Leaflet OpenStreetMap with live interactivity
  const leafletMapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #0f172a; }
          .center-marker {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            z-index: 1000;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .pin-badge {
            background: #0f172a;
            color: #38bdf8;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11px;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid #38bdf8;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            margin-bottom: 4px;
            white-space: nowrap;
          }
          .pin-icon {
            width: 36px;
            height: 36px;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="center-marker">
          <div class="pin-badge">Technician Destination</div>
          <svg class="pin-icon" viewBox="0 0 24 24" fill="#0284c7" stroke="#ffffff" stroke-width="2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="3" fill="#ffffff" />
          </svg>
        </div>
        <script>
          var lat = ${coords.latitude};
          var lng = ${coords.longitude};
          var map = L.map('map', { zoomControl: false }).setView([lat, lng], 16);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          map.on('moveend', function() {
            var c = map.getCenter();
            var payload = JSON.stringify({ type: 'dragged', lat: c.lat, lng: c.lng });
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(payload);
            } else if (window.parent) {
              window.parent.postMessage(payload, '*');
            }
          });

          window.addEventListener('message', function(e) {
            try {
              var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
              if (data && data.type === 'panTo') {
                map.setView([data.lat, data.lng], 16);
              }
            } catch (err) {}
          });
        </script>
      </body>
    </html>
  `;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <AppIcon name="X" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Pin Service Location</Text>
            <Text style={styles.headerSubtitle}>Exact coordinates will be shared with the technician</Text>
          </View>
        </View>

        {/* Location Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <AppIcon name="Search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search village, society, landmark, area, or street..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {isSearching ? (
              <ActivityIndicator size="small" color="#0284C7" />
            ) : searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => handleSearchChange('')}>
                <AppIcon name="X" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Autocomplete Dropdown */}
          {showResultsDropdown && searchResults.length > 0 && (
            <View style={styles.dropdownResults}>
              <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled">
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.placeId}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectSearchResult(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownIcon}>
                      <AppIcon name="MapPin" size={16} color="#0284C7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dropdownItemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.dropdownItemSubtitle} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Interactive Map Area */}
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              srcDoc={leafletMapHtml}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title="Interactive Service Map"
            />
          ) : (
            (() => {
              try {
                const { WebView } = require('react-native-webview');
                return (
                  <WebView
                    source={{ html: leafletMapHtml }}
                    style={{ flex: 1 }}
                    originWhitelist={['*']}
                    onMessage={(event: any) => {
                      try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === 'dragged') {
                          setCoords({ latitude: data.lat, longitude: data.lng });
                          reverseGeocodeCoords(data.lat, data.lng);
                        }
                      } catch {}
                    }}
                  />
                );
              } catch {
                return (
                  <View style={styles.nativeFallbackMap}>
                    <AppIcon name="MapPin" size={40} color="#0284C7" />
                    <Text style={styles.fallbackTitle}>Location Position</Text>
                    <Text style={styles.fallbackCoords}>
                      {coords.latitude.toFixed(5)}° N, {coords.longitude.toFixed(5)}° E
                    </Text>
                  </View>
                );
              }
            })()
          )}

          {/* Floating 'Use Current Location' Button */}
          <TouchableOpacity
            style={styles.floatingGpsBtn}
            onPress={handleUseCurrentLocation}
            activeOpacity={0.8}
            disabled={isLocatingGps}
          >
            {isLocatingGps ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <AppIcon name="Crosshair" size={18} color="#ffffff" />
                <Text style={styles.floatingGpsText}>Use My Current Location</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Map Pan / Nudge Controls */}
          <View style={styles.mapNudgeControls}>
            <TouchableOpacity
              style={styles.nudgeBtn}
              onPress={() => handleNudgeCoords(0.001, 0)}
              activeOpacity={0.7}
            >
              <Text style={styles.nudgeText}>▲</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={styles.nudgeBtn}
                onPress={() => handleNudgeCoords(0, -0.001)}
                activeOpacity={0.7}
              >
                <Text style={styles.nudgeText}>◀</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nudgeBtn}
                onPress={() => handleNudgeCoords(0, 0.001)}
                activeOpacity={0.7}
              >
                <Text style={styles.nudgeText}>▶</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.nudgeBtn}
              onPress={() => handleNudgeCoords(-0.001, 0)}
              activeOpacity={0.7}
            >
              <Text style={styles.nudgeText}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Pin Summary & Confirmation Card */}
        <View style={styles.bottomCard}>
          <View style={styles.detectedCard}>
            <View style={styles.detectedBadge}>
              <AppIcon name="Navigation" size={14} color="#0284C7" />
              <Text style={styles.detectedBadgeText}>GPS PINPOINT FOR TECHNICIAN</Text>
            </View>
            <Text style={styles.detectedAddressText}>
              {isReverseGeocoding ? 'Detecting area...' : detectedAddressSummary || 'Selected Location Pin'}
            </Text>
            <Text style={styles.detectedCoordsText}>
              Exact Lat/Long: {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
            </Text>
          </View>

          <View style={styles.infoHintRow}>
            <AppIcon name="Info" size={14} color="#94A3B8" />
            <Text style={styles.infoHintText}>
              The technician will navigate directly to this map pin. You can enter your specific house/flat number on the address form without any auto-filled guesses.
            </Text>
          </View>

          <View style={{ marginTop: Spacing.sm, marginBottom: Platform.OS === 'ios' ? 24 : Spacing.sm }}>
            <PrecisionButton
              title="Confirm This Pin Location"
              variant="primary"
              size="lg"
              onPress={handleConfirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: Spacing.sm,
    backgroundColor: '#0d1527',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#0d1527',
    zIndex: 50,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: '#334155',
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  dropdownResults: {
    position: 'absolute',
    top: 54,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: '#0f172a',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#38bdf8',
    ...Shadows.level3,
    zIndex: 100,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: Spacing.sm,
  },
  dropdownIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownItemSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  nativeFallbackMap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    padding: Spacing.lg,
  },
  fallbackTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  fallbackCoords: {
    color: '#0284C7',
    fontSize: 14,
    marginTop: 4,
  },
  floatingGpsBtn: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 24,
    ...Shadows.level2,
    gap: 6,
    zIndex: 20,
  },
  floatingGpsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  mapNudgeControls: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: BorderRadius.md,
    padding: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
    zIndex: 20,
  },
  nudgeBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudgeText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bottomCard: {
    backgroundColor: '#0d1527',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  detectedCard: {
    backgroundColor: '#0f172a',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: Spacing.sm,
  },
  detectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detectedBadgeText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detectedAddressText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  detectedCoordsText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  infoHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: Spacing.sm,
  },
  infoHintText: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
  },
});

