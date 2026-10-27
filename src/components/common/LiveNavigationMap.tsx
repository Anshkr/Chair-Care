import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform, StyleProp, ViewStyle, Text, DimensionValue } from 'react-native';

interface LiveNavigationMapProps {
  techCoords: { latitude: number; longitude: number };
  customerCoords: { latitude: number; longitude: number };
  customerName?: string;
  customerAddress?: string;
  technicianName?: string;
  etaMinutes?: number;
  distanceKm?: number;
  height?: DimensionValue;
  style?: StyleProp<ViewStyle>;
  role?: 'technician' | 'customer';
  isMoving?: boolean;
}

export const LiveNavigationMap: React.FC<LiveNavigationMapProps> = ({
  techCoords,
  customerCoords,
  customerName = 'Customer',
  customerAddress = 'Destination',
  technicianName = 'Technician',
  etaMinutes = 12,
  distanceKm = 2.4,
  height = 360,
  style,
  role = 'technician',
  isMoving = false,
}) => {
  const iframeRef = useRef<any>(null);
  const webViewRef = useRef<any>(null);

  // Send real-time updates into the Leaflet map without reloading
  useEffect(() => {
    const payload = JSON.stringify({
      type: 'updatePosition',
      techLat: techCoords.latitude,
      techLng: techCoords.longitude,
      custLat: customerCoords.latitude,
      custLng: customerCoords.longitude,
      etaMinutes,
      distanceKm,
      isMoving,
    });

    if (Platform.OS === 'web' && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(payload, '*');
      } catch {}
    } else if (webViewRef.current) {
      try {
        webViewRef.current.postMessage(payload);
      } catch {}
    }
  }, [
    techCoords.latitude,
    techCoords.longitude,
    customerCoords.latitude,
    customerCoords.longitude,
    etaMinutes,
    distanceKm,
    isMoving,
  ]);

  const leafletHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { box-sizing: border-box; }
          html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #0B1527; }
          
          /* Technician Pulsing Marker */
          .tech-marker-wrap {
            position: relative;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .tech-radar-ring {
            position: absolute;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(37, 99, 235, 0.25);
            border: 1.5px solid rgba(59, 130, 246, 0.7);
            animation: radarPulse 1.8s infinite ease-out;
          }
          .tech-core-circle {
            position: relative;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: #2563EB;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
          }
          .tech-badge-pill {
            position: absolute;
            top: -26px;
            left: 50%;
            transform: translateX(-50%);
            background: #0F172A;
            color: #38BDF8;
            border: 1px solid rgba(56, 189, 248, 0.4);
            padding: 2px 7px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 4px 10px rgba(0,0,0,0.4);
            letter-spacing: 0.3px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }

          /* Customer Destination Pin */
          .cust-marker-wrap {
            position: relative;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .cust-core-pin {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #EF4444;
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
          }
          .cust-badge-pill {
            position: absolute;
            top: -26px;
            left: 50%;
            transform: translateX(-50%);
            background: #0F172A;
            color: #FCA5A5;
            border: 1px solid rgba(239, 68, 68, 0.4);
            padding: 2px 7px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 4px 10px rgba(0,0,0,0.4);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }

          @keyframes radarPulse {
            0% { transform: scale(0.6); opacity: 1; }
            100% { transform: scale(1.6); opacity: 0; }
          }

          /* Leaflet Controls Styling */
          .leaflet-control-zoom {
            border: none !important;
            box-shadow: 0 4px 14px rgba(0,0,0,0.3) !important;
          }
          .leaflet-control-zoom a {
            background: #0F172A !important;
            color: #E2E8F0 !important;
            border-color: #334155 !important;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var techLat = ${techCoords.latitude};
          var techLng = ${techCoords.longitude};
          var custLat = ${customerCoords.latitude};
          var custLng = ${customerCoords.longitude};
          var etaMinutes = ${etaMinutes};
          var distanceKm = ${distanceKm};

          // Initialize Map
          var map = L.map('map', { 
            zoomControl: false,
            attributionControl: false 
          }).setView([techLat, techLng], 14);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          // Add Zoom Control top-right
          L.control.zoom({ position: 'topright' }).addTo(map);

          // Custom Technician Icon
          var techIcon = L.divIcon({
            className: 'custom-tech-div',
            html: '<div class="tech-marker-wrap">' +
                    '<div class="tech-radar-ring"></div>' +
                    '<div id="techPill" class="tech-badge-pill">' + (etaMinutes > 0 ? (etaMinutes + 'm • ' + distanceKm.toFixed(1) + 'km') : 'Arrived') + '</div>' +
                    '<div class="tech-core-circle">' +
                      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
                        '<polygon points="3 11 22 2 13 21 11 13 3 11"/>' +
                      '</svg>' +
                    '</div>' +
                  '</div>',
            iconSize: [44, 44],
            iconAnchor: [22, 22]
          });

          // Custom Customer Destination Icon
          var custIcon = L.divIcon({
            className: 'custom-cust-div',
            html: '<div class="cust-marker-wrap">' +
                    '<div class="cust-badge-pill">${customerName.replace(/'/g, "\\'")}</div>' +
                    '<div class="cust-core-pin">' +
                      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>' +
                        '<circle cx="12" cy="10" r="3"/>' +
                      '</svg>' +
                    '</div>' +
                  '</div>',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });

          var techMarker = L.marker([techLat, techLng], { icon: techIcon }).addTo(map);
          var custMarker = L.marker([custLat, custLng], { icon: custIcon }).addTo(map);

          // Cased Road Navigation Polylines (matches Google/Apple Maps turn-by-turn road routes)
          var routeLineGlow = L.polyline([[techLat, techLng], [custLat, custLng]], {
            color: '#38BDF8',
            weight: 8,
            opacity: 0.35,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          var routeLineCasing = L.polyline([[techLat, techLng], [custLat, custLng]], {
            color: '#1D4ED8',
            weight: 6,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          var routeLine = L.polyline([[techLat, techLng], [custLat, custLng]], {
            color: '#3B82F6',
            weight: 3.5,
            opacity: 1.0,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          // Auto-fit both points with padding
          function fitRoute() {
            var bounds = L.latLngBounds([
              [techMarker.getLatLng().lat, techMarker.getLatLng().lng],
              [custMarker.getLatLng().lat, custMarker.getLatLng().lng]
            ]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
          }
          fitRoute();

          var currentRoadCoords = null;
          var lastFetchTime = 0;
          var lastFetchLat = techLat;
          var lastFetchLng = techLng;

          function fetchWithTimeout(url, timeoutMs) {
            return new Promise(function(resolve, reject) {
              var didTimeout = false;
              var timer = setTimeout(function() {
                didTimeout = true;
                reject(new Error('Routing request timeout'));
              }, timeoutMs || 6000);

              fetch(url)
                .then(function(res) {
                  clearTimeout(timer);
                  if (!didTimeout) resolve(res);
                })
                .catch(function(err) {
                  clearTimeout(timer);
                  if (!didTimeout) reject(err);
                });
            });
          }

          function applyRoadRoute(latLngs, roadDistKm, roadEtaMin) {
            currentRoadCoords = latLngs;
            routeLineGlow.setLatLngs(latLngs);
            routeLineCasing.setLatLngs(latLngs);
            routeLine.setLatLngs(latLngs);

            var bounds = L.latLngBounds(latLngs);
            map.fitBounds(bounds, { padding: [55, 55], maxZoom: 16 });

            var pill = document.getElementById('techPill');
            if (pill && roadDistKm !== undefined && roadEtaMin !== undefined) {
              pill.innerText = roadEtaMin > 0 ? (roadEtaMin + 'm • ' + roadDistKm.toFixed(1) + 'km') : 'Arrived';
            }
          }

          function queryRouteService(url) {
            return fetchWithTimeout(url, 5000)
              .then(function(res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
              })
              .then(function(data) {
                if (data && data.routes && data.routes.length > 0 && data.routes[0].geometry) {
                  var rawCoords = data.routes[0].geometry.coordinates;
                  if (Array.isArray(rawCoords) && rawCoords.length > 0) {
                    var latLngs = rawCoords.map(function(c) {
                      return [c[1], c[0]];
                    });
                    var distKm = data.routes[0].distance ? (data.routes[0].distance / 1000) : undefined;
                    var etaMin = data.routes[0].duration ? Math.ceil(data.routes[0].duration / 60) : undefined;
                    return { latLngs: latLngs, distKm: distKm, etaMin: etaMin };
                  }
                }
                throw new Error('No route geometry found');
              });
          }

          function fetchRoadRoute(sLat, sLng, eLat, eLng) {
            var primaryUrl = 'https://router.project-osrm.org/route/v1/driving/' + 
                             sLng + ',' + sLat + ';' + eLng + ',' + eLat + 
                             '?overview=full&geometries=geojson';
            var backupUrl = 'https://routing.openstreetmap.de/routed-car/route/v1/driving/' + 
                            sLng + ',' + sLat + ';' + eLng + ',' + eLat + 
                            '?overview=full&geometries=geojson';

            queryRouteService(primaryUrl)
              .catch(function() {
                return queryRouteService(backupUrl);
              })
              .then(function(res) {
                applyRoadRoute(res.latLngs, res.distKm, res.etaMin);
              })
              .catch(function(err) {
                var fallbackPts = [[sLat, sLng], [eLat, eLng]];
                routeLineGlow.setLatLngs(fallbackPts);
                routeLineCasing.setLatLngs(fallbackPts);
                routeLine.setLatLngs(fallbackPts);
              });
          }

          // Initial road route fetch following real street network
          fetchRoadRoute(techLat, techLng, custLat, custLng);

          // Listen for live updates
          function handleMessage(e) {
            try {
              var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
              if (data && data.type === 'updatePosition') {
                var newTechLat = Number(data.techLat);
                var newTechLng = Number(data.techLng);
                var newEta = Number(data.etaMinutes);
                var newDist = Number(data.distanceKm);

                if (!isNaN(newTechLat) && !isNaN(newTechLng)) {
                  techMarker.setLatLng([newTechLat, newTechLng]);

                  var pill = document.getElementById('techPill');
                  if (pill) {
                    pill.innerText = newEta > 0 ? (newEta + 'm • ' + newDist.toFixed(1) + 'km') : 'Arrived';
                  }

                  var now = Date.now();
                  var moved = Math.hypot(newTechLat - lastFetchLat, newTechLng - lastFetchLng);
                  if (moved > 0.0004 && (now - lastFetchTime > 4000)) {
                    lastFetchTime = now;
                    lastFetchLat = newTechLat;
                    lastFetchLng = newTechLng;
                    fetchRoadRoute(newTechLat, newTechLng, custMarker.getLatLng().lat, custMarker.getLatLng().lng);
                  } else if (currentRoadCoords && currentRoadCoords.length > 0) {
                    currentRoadCoords[0] = [newTechLat, newTechLng];
                    routeLineGlow.setLatLngs(currentRoadCoords);
                    routeLineCasing.setLatLngs(currentRoadCoords);
                    routeLine.setLatLngs(currentRoadCoords);
                  }
                }
              }
            } catch (err) {}
          }

          window.addEventListener('message', handleMessage);
          document.addEventListener('message', handleMessage);
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height }, style]}>
      {Platform.OS === 'web' ? (
        <iframe
          ref={iframeRef}
          srcDoc={leafletHtml}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 16,
          }}
          title="Live Navigation Route Map"
        />
      ) : (
        (() => {
          try {
            const { WebView } = require('react-native-webview');
            return (
              <WebView
                ref={webViewRef}
                source={{ html: leafletHtml }}
                style={styles.webView}
                originWhitelist={['*']}
                scrollEnabled={false}
              />
            );
          } catch {
            return (
              <View style={styles.fallbackContainer}>
                <Text style={styles.fallbackText}>Live Map Active</Text>
                <Text style={styles.fallbackSub}>
                  {distanceKm.toFixed(1)} km away • ETA {etaMinutes} mins
                </Text>
              </View>
            );
          }
        })()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0B1527',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  webView: {
    flex: 1,
    backgroundColor: '#0B1527',
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B1527',
  },
  fallbackText: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '700',
  },
  fallbackSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
});
