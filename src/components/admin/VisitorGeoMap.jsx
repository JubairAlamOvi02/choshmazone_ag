import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    MapPin, Globe, Wifi, Compass, Layers, Maximize2, RotateCcw,
    Users, Activity, ChevronRight, Eye
} from 'lucide-react';

// Coordinates for major districts and divisions in Bangladesh
const BD_COORDINATES = {
    'dhaka': [23.8103, 90.4125],
    'chittagong': [22.3569, 91.7832],
    'chattogram': [22.3569, 91.7832],
    'sylhet': [24.8949, 91.8687],
    'rajshahi': [24.3745, 88.6042],
    'khulna': [22.8456, 89.5403],
    'barisal': [22.7010, 90.3535],
    'barishal': [22.7010, 90.3535],
    'rangpur': [25.7439, 89.2752],
    'mymensingh': [24.7471, 90.4203],
    'patuakhali': [22.3683, 90.3458],
    'comilla': [23.4682, 91.1788],
    'cumilla': [23.4682, 91.1788],
    'gazipur': [23.9999, 90.4203],
    'narayanganj': [23.6238, 90.5000],
    'bogra': [24.8465, 89.3777],
    'bogura': [24.8465, 89.3777],
    'jessore': [23.1664, 89.2081],
    'jashore': [23.1664, 89.2081],
    'cox\'s bazar': [21.4272, 92.0058],
    'dinajpur': [25.6217, 88.6354],
    'feni': [23.0159, 91.3976],
    'tangail': [24.2513, 89.9167],
    'faridpur': [23.6071, 89.8429],
    'kushtia': [23.9013, 89.1205],
    'pabna': [24.0064, 89.2372],
    'sirajganj': [24.4534, 89.7008],
    'noakhali': [22.8696, 91.0994],
    'brahmanbaria': [23.9571, 91.1119]
};

const BANGLADESH_CENTER = [23.6850, 90.3563];

const VisitorGeoMap = ({ events = [], onSelectCity }) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [mapStyle, setMapStyle] = useState('light'); // 'light' | 'streets'
    const [viewMode, setViewMode] = useState('map'); // 'map' | 'divisions'

    // Group events by location
    const locationData = useMemo(() => {
        const map = {};
        let totalCount = 0;

        events.forEach((evt) => {
            const geo = evt.metadata?.geo;
            let city = geo?.city;
            const region = geo?.region || '';
            const country = geo?.country || 'Bangladesh';
            const countryCode = geo?.countryCode || 'BD';
            const flag = geo?.flag || '🇧🇩';
            const isp = geo?.isp || 'Standard Broadband';

            let lat = geo?.latitude;
            let lng = geo?.longitude;

            // If coordinates not in payload, check fallback coordinates
            if ((!lat || !lng) && city) {
                const normCity = city.toLowerCase().trim();
                if (BD_COORDINATES[normCity]) {
                    [lat, lng] = BD_COORDINATES[normCity];
                }
            }

            // If still no coords but in Bangladesh, default to Dhaka with tiny jitter for visualization
            if ((!lat || !lng) && country.toLowerCase().includes('bangladesh')) {
                lat = 23.8103 + (Math.random() - 0.5) * 0.05;
                lng = 90.4125 + (Math.random() - 0.5) * 0.05;
                if (!city) city = 'Dhaka';
            }

            if (lat && lng) {
                const key = `${city || 'Unknown'}-${countryCode}`;
                if (!map[key]) {
                    map[key] = {
                        key,
                        city: city || 'Local Visitor',
                        region,
                        country,
                        countryCode,
                        flag,
                        lat: Number(lat),
                        lng: Number(lng),
                        count: 0,
                        isps: {},
                        lastActive: evt.created_at,
                        eventTypes: {}
                    };
                }

                map[key].count += 1;
                map[key].isps[isp] = (map[key].isps[isp] || 0) + 1;
                map[key].eventTypes[evt.event_type] = (map[key].eventTypes[evt.event_type] || 0) + 1;
                if (new Date(evt.created_at) > new Date(map[key].lastActive)) {
                    map[key].lastActive = evt.created_at;
                }
                totalCount += 1;
            }
        });

        const locations = Object.values(map).sort((a, b) => b.count - a.count);

        return {
            locations,
            totalCount,
            topLocation: locations[0] || null
        };
    }, [events]);

    // Initialize Leaflet Map
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: BANGLADESH_CENTER,
            zoom: 7,
            zoomControl: false,
            scrollWheelZoom: true,
            attributionControl: false
        });

        // Use fast, globally accessible Esri tile services (zero DNS issues or blocks)
        const tileUrl =
            mapStyle === 'streets'
                ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
                : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';

        L.tileLayer(tileUrl, {
            maxZoom: 18,
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
        }).addTo(map);

        // Invalidate size to ensure clean rendering on initial paint
        setTimeout(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        }, 200);

        // Zoom control in top right
        L.control.zoom({ position: 'topright' }).addTo(map);

        // Markers layer group
        const markersGroup = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;
        markersLayerRef.current = markersGroup;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            markersLayerRef.current = null;
        };
    }, []);

    // Update tile style when toggled
    useEffect(() => {
        if (!mapInstanceRef.current) return;
        const map = mapInstanceRef.current;

        // Remove old tile layers
        map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });

        const tileUrl =
            mapStyle === 'streets'
                ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
                : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';

        L.tileLayer(tileUrl, {
            maxZoom: 18,
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
        }).addTo(map);
    }, [mapStyle]);

    // Plot markers whenever locationData changes
    useEffect(() => {
        if (!mapInstanceRef.current || !markersLayerRef.current) return;

        const markersGroup = markersLayerRef.current;
        markersGroup.clearLayers();

        locationData.locations.forEach((loc) => {
            const topIsp = Object.entries(loc.isps).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Broadband';

            // Custom animated radar HTML marker
            const markerHtml = `
                <div class="relative flex items-center justify-center cursor-pointer group">
                    <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-primary/30"></span>
                    <span class="absolute inline-flex h-6 w-6 rounded-full bg-primary/20"></span>
                    <div class="relative inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-primary text-white text-[11px] font-black shadow-lg border-2 border-white font-outfit transform group-hover:scale-110 transition-transform">
                        ${loc.count}
                    </div>
                </div>
            `;

            const icon = L.divIcon({
                className: 'custom-map-pin',
                html: markerHtml,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
                popupAnchor: [0, -14]
            });

            const marker = L.marker([loc.lat, loc.lng], { icon });

            // Popup HTML
            const popupContent = `
                <div style="font-family: Outfit, sans-serif; min-width: 180px; padding: 4px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 6px;">
                        <span style="font-weight: 900; font-size: 13px; color: #0f172a; display: flex; align-items: center; gap: 4px;">
                            <span>${loc.flag}</span>
                            <span>${loc.city}</span>
                        </span>
                        <span style="background: #eff6ff; color: #2563eb; font-weight: 800; font-size: 11px; padding: 2px 6px; border-radius: 9999px;">
                            ${loc.count} actions
                        </span>
                    </div>
                    <div style="font-size: 11px; color: #64748b; line-height: 1.4;">
                        <div><strong>Region:</strong> ${loc.region || loc.country}</div>
                        <div><strong>Top Network:</strong> ${topIsp}</div>
                    </div>
                    <button id="btn-filter-${loc.key}" style="margin-top: 8px; width: 100%; padding: 4px 8px; background: #0f172a; color: white; border: none; border-radius: 6px; font-weight: 700; font-size: 11px; cursor: pointer;">
                        Filter this Area
                    </button>
                </div>
            `;

            marker.bindPopup(popupContent, {
                closeButton: true,
                className: 'custom-map-popup'
            });

            marker.on('popupopen', () => {
                const btn = document.getElementById(`btn-filter-${loc.key}`);
                if (btn && onSelectCity) {
                    btn.onclick = () => {
                        onSelectCity(loc.city);
                    };
                }
            });

            marker.on('click', () => {
                setSelectedCity(loc);
            });

            markersGroup.addLayer(marker);
        });
    }, [locationData, onSelectCity]);

    const resetBangladeshView = () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(BANGLADESH_CENTER, 7, { duration: 1 });
        }
    };

    const fitAllMarkers = () => {
        if (mapInstanceRef.current && locationData.locations.length > 0) {
            const bounds = L.latLngBounds(locationData.locations.map((l) => [l.lat, l.lng]));
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:px-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-primary rounded-xl">
                        <Compass size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-text-main font-outfit">
                                Live Regional Visitor Map
                            </h3>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-black rounded-full font-outfit flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                {locationData.locations.length} Areas
                            </span>
                        </div>
                        <p className="text-xs text-text-muted font-outfit mt-0.5">
                            Visual geographic concentration of visitors navigating your store
                        </p>
                    </div>
                </div>

                {/* Map Toolbar */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-outfit">
                    <button
                        onClick={resetBangladeshView}
                        className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-border text-text-main font-bold rounded-lg transition-colors flex items-center gap-1.5"
                        title="Center map on Bangladesh"
                    >
                        <RotateCcw size={13} className="text-text-muted" />
                        <span>Center BD</span>
                    </button>

                    <button
                        onClick={fitAllMarkers}
                        className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-border text-text-main font-bold rounded-lg transition-colors flex items-center gap-1.5"
                        title="Fit all visitor locations"
                    >
                        <Maximize2 size={13} className="text-text-muted" />
                        <span>Fit View</span>
                    </button>

                    <button
                        onClick={() => setMapStyle(mapStyle === 'light' ? 'streets' : 'light')}
                        className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-border text-text-main font-bold rounded-lg transition-colors flex items-center gap-1.5"
                        title="Switch map theme"
                    >
                        <Layers size={13} className="text-text-muted" />
                        <span>{mapStyle === 'light' ? 'Clean Map' : 'Detailed Map'}</span>
                    </button>
                </div>
            </div>

            {/* Map Container + Live Location Drawer */}
            <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[420px]">
                {/* The Interactive Map */}
                <div className="lg:col-span-3 relative h-[420px] bg-slate-100">
                    <div ref={mapContainerRef} className="w-full h-full z-0" />

                    {/* Quick overlay helper */}
                    <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-border text-[11px] font-outfit font-bold shadow-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span>Radar pings show active user activity</span>
                    </div>
                </div>

                {/* Regional Activity Sidebar */}
                <div className="p-4 bg-gray-50/70 border-t lg:border-t-0 lg:border-l border-border flex flex-col justify-between overflow-y-auto max-h-[420px]">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-black text-text-main font-outfit uppercase tracking-wider flex items-center gap-1.5">
                                <MapPin size={13} className="text-primary" /> Active Areas
                            </h4>
                            <span className="text-[11px] text-text-muted font-bold">
                                {locationData.totalCount} visits
                            </span>
                        </div>

                        {locationData.locations.length > 0 ? (
                            <div className="space-y-2">
                                {locationData.locations.slice(0, 7).map((loc, idx) => {
                                    const pct = Math.round((loc.count / (locationData.totalCount || 1)) * 100);
                                    const topIsp = Object.entries(loc.isps).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Broadband';

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                if (mapInstanceRef.current) {
                                                    mapInstanceRef.current.flyTo([loc.lat, loc.lng], 10, { duration: 1 });
                                                }
                                                if (onSelectCity) onSelectCity(loc.city);
                                            }}
                                            className="p-2.5 bg-white hover:bg-blue-50/60 rounded-xl border border-border/80 hover:border-primary/40 cursor-pointer transition-all duration-200 group"
                                        >
                                            <div className="flex items-center justify-between text-xs font-outfit mb-1">
                                                <div className="font-bold text-text-main group-hover:text-primary flex items-center gap-1.5 truncate">
                                                    <span>{loc.flag}</span>
                                                    <span className="truncate">{loc.city}</span>
                                                </div>
                                                <span className="font-mono text-primary font-black shrink-0">
                                                    {loc.count} <span className="text-text-muted font-normal text-[10px]">({pct}%)</span>
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-[10px] text-text-muted font-outfit">
                                                <span className="truncate max-w-[120px] flex items-center gap-1">
                                                    <Wifi size={10} className="text-emerald-500 shrink-0" />
                                                    <span className="truncate">{topIsp}</span>
                                                </span>
                                                <span className="text-text-muted/80">Click to focus</span>
                                            </div>

                                            {/* Mini bar */}
                                            <div className="w-full bg-gray-100 h-1 rounded-full mt-2 overflow-hidden">
                                                <div
                                                    className="bg-primary h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-text-muted font-outfit text-xs">
                                <Globe size={28} className="mx-auto mb-2 text-text-muted/50" />
                                <p className="font-bold">No geo coordinates recorded yet.</p>
                                <p className="text-[11px] mt-1">Location pins will appear on the map as customers visit your site.</p>
                            </div>
                        )}
                    </div>

                    {locationData.topLocation && (
                        <div className="mt-4 pt-3 border-t border-border text-xs font-outfit">
                            <span className="text-text-muted block text-[10px] uppercase font-bold tracking-wider">
                                Primary Hotspot:
                            </span>
                            <span className="font-black text-text-main flex items-center gap-1 mt-0.5">
                                <span>{locationData.topLocation.flag}</span>
                                <span>{locationData.topLocation.city}</span>
                                <span className="text-emerald-600 font-bold ml-auto font-mono">
                                    {Math.round((locationData.topLocation.count / (locationData.totalCount || 1)) * 100)}% traffic
                                </span>
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VisitorGeoMap;
