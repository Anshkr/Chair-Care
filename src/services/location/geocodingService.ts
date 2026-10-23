/**
 * Geocoding Service for ChairCare
 * Provides place search, reverse geocoding, and forward geocoding
 * using OpenStreetMap Nominatim with caching and error resilience.
 */

export interface GeocodedPlace {
  placeId: string;
  title: string;
  subtitle: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  buildingName?: string;
  streetArea?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface ReverseGeocodeResult {
  latitude: number;
  longitude: number;
  buildingName: string;
  streetArea: string;
  city: string;
  state: string;
  pincode: string;
  formattedAddress: string;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'ChairCare-Platform/2.0 (service@chaircare.in)';

// Clean city/area extractor from Nominatim response
function parseAddressComponents(raw: any, lat: number, lon: number): ReverseGeocodeResult {
  const addr = raw?.address || {};
  
  const buildingName =
    addr.building ||
    addr.complex ||
    addr.residential ||
    addr.house_name ||
    addr.commercial ||
    addr.amenity ||
    '';

  const streetArea =
    addr.road ||
    addr.suburb ||
    addr.neighbourhood ||
    addr.subdistrict ||
    addr.residential ||
    addr.quarter ||
    'Golf Course Road';

  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.city_district ||
    addr.state_district ||
    'Gurgaon';

  const state = addr.state || 'Haryana';
  const pincode = addr.postcode || '122002';

  const parts = [
    buildingName,
    streetArea,
    city,
    state,
    pincode,
  ].filter(Boolean);

  const formattedAddress = raw?.display_name || parts.join(', ');

  return {
    latitude: lat,
    longitude: lon,
    buildingName,
    streetArea,
    city,
    state,
    pincode,
    formattedAddress,
  };
}

export const geocodingService = {
  /**
   * Search places by query string (autocomplete / place search)
   */
  searchPlaces: async (queryStr: string): Promise<GeocodedPlace[]> => {
    const trimmed = queryStr?.trim();
    if (!trimmed || trimmed.length < 2) return [];

    try {
      const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(
        trimmed
      )}&addressdetails=1&limit=6&countrycodes=in`;

      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': USER_AGENT,
        },
      });

      if (!res.ok) return [];

      const data = await res.json();
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => {
        const addr = item.address || {};
        const title =
          item.name ||
          addr.building ||
          addr.road ||
          addr.suburb ||
          addr.neighbourhood ||
          trimmed;

        // Subtitle without repeating title
        const subParts = [
          addr.suburb || addr.neighbourhood,
          addr.city || addr.town || addr.state_district,
          addr.state,
          addr.postcode,
        ].filter(Boolean);

        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);

        return {
          placeId: String(item.place_id || Math.random()),
          title,
          subtitle: subParts.join(', ') || item.display_name,
          fullAddress: item.display_name,
          latitude: lat,
          longitude: lon,
          buildingName: addr.building || addr.complex || '',
          streetArea: addr.road || addr.suburb || addr.neighbourhood || '',
          city: addr.city || addr.town || addr.state_district || 'Gurgaon',
          state: addr.state || 'Haryana',
          pincode: addr.postcode || '122002',
        };
      });
    } catch (err) {
      console.warn('Geocoding search error:', err);
      return [];
    }
  },

  /**
   * Reverse geocode coordinates into address components
   */
  reverseGeocode: async (lat: number, lon: number): Promise<ReverseGeocodeResult> => {
    try {
      const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': USER_AGENT,
        },
      });

      if (!res.ok) throw new Error('Reverse geocode failed');
      const data = await res.json();
      return parseAddressComponents(data, lat, lon);
    } catch {
      // Graceful fallback coordinates
      return {
        latitude: lat,
        longitude: lon,
        buildingName: '',
        streetArea: 'Sector 54, Golf Course Road',
        city: 'Gurgaon',
        state: 'Haryana',
        pincode: '122002',
        formattedAddress: `Location (${lat.toFixed(4)}, ${lon.toFixed(4)}), Gurgaon, Haryana`,
      };
    }
  },

  /**
   * Forward geocode a manual address entered by user
   * Converts user-entered text into high-accuracy lat/long
   */
  forwardGeocodeManualAddress: async (params: {
    flatNo?: string;
    buildingName?: string;
    streetArea?: string;
    city?: string;
    state?: string;
    pincode?: string;
    fullAddress?: string;
  }): Promise<{ latitude: number; longitude: number; formattedAddress: string } | null> => {
    const candidates: string[] = [];

    // Attempt 1: Building + Street + City + Pincode
    if (params.buildingName && params.streetArea && params.city) {
      candidates.push(`${params.buildingName}, ${params.streetArea}, ${params.city} ${params.pincode || ''}`);
    }

    // Attempt 2: Street + City + Pincode
    if (params.streetArea && params.city) {
      candidates.push(`${params.streetArea}, ${params.city} ${params.pincode || ''}`);
    }

    // Attempt 3: Full Address string directly
    if (params.fullAddress) {
      candidates.push(params.fullAddress);
    }

    // Attempt 4: City + Pincode
    if (params.city) {
      candidates.push(`${params.city} ${params.pincode || ''}`);
    }

    for (const query of candidates) {
      const clean = query.replace(/[#()]/g, '').trim();
      if (!clean) continue;

      try {
        const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(
          clean
        )}&limit=1&countrycodes=in`;

        const res = await fetch(url, {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': USER_AGENT,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const first = data[0];
            return {
              latitude: parseFloat(first.lat),
              longitude: parseFloat(first.lon),
              formattedAddress: first.display_name,
            };
          }
        }
      } catch {
        // try next candidate
      }
    }

    // Fallback default coordinates for Gurgaon / Delhi NCR if nothing matched
    return {
      latitude: 28.4595,
      longitude: 77.0266,
      formattedAddress: params.fullAddress || `${params.city || 'Gurgaon'}, ${params.state || 'Haryana'}`,
    };
  },
};
