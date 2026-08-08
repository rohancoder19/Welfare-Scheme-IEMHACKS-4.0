import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Navigation } from 'lucide-react';

// Custom SVG Icons for 100% reliable rendering without external CDN PNG dependencies
const createCustomIcon = (colorHex, symbol = '') => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: ${colorHex};
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.45);
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Real-time GPS Pulsing Marker Icon
const gpsPulseIcon = L.divIcon({
  className: 'gps-pulse-marker',
  html: `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 36px; height: 36px; background-color: rgba(14, 165, 233, 0.4); border-radius: 50%; animation: pulse 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 20px; height: 20px; background-color: #0ea5e9; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 12px rgba(14, 165, 233, 0.9);"></div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

const defaultIcon = createCustomIcon('#3b82f6');
const criticalIcon = createCustomIcon('#ef4444');
const highIcon = createCustomIcon('#f43f5e');
const mediumIcon = createCustomIcon('#f59e0b');
const lowIcon = createCustomIcon('#10b981');
const selectedPinIcon = createCustomIcon('#8b5cf6');

const getMarkerIcon = (priority) => {
  const p = (priority || '').toUpperCase();
  if (p === 'CRITICAL') return criticalIcon;
  if (p === 'HIGH') return highIcon;
  if (p === 'MEDIUM') return mediumIcon;
  if (p === 'LOW') return lowIcon;
  return defaultIcon;
};

const defaultCenter = [18.5204, 73.8567]; // Pune default coordinates

// Map Controller for auto-resizing and recentering
function MapController({ center, userGpsPos }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 200);
      const targetCenter = userGpsPos || center;
      if (targetCenter && targetCenter[0] && targetCenter[1]) {
        map.setView(targetCenter, map.getZoom(), { animate: true });
      }
      return () => clearTimeout(timer);
    }
  }, [center, userGpsPos, map]);
  return null;
}

// Location Picker for clicking on map
function LocationPicker({ onSelectLocation, selectedPos, setSelectedPos }) {
  const [streetAddr, setStreetAddr] = useState('');

  useEffect(() => {
    if (selectedPos && selectedPos[0] && selectedPos[1]) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${selectedPos[0]}&lon=${selectedPos[1]}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            setStreetAddr(data.display_name);
          }
        })
        .catch(err => console.warn('Geocoding error:', err));
    }
  }, [selectedPos]);

  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setSelectedPos(newPos);
      setStreetAddr('Fetching address...');
      if (onSelectLocation) {
        onSelectLocation(e.latlng.lat, e.latlng.lng);
      }
    }
  });

  return selectedPos ? (
    <Marker position={selectedPos} icon={selectedPinIcon}>
      <Popup>
        <div className="p-1 font-sans text-xs max-w-xs space-y-1">
          <span className="font-bold text-indigo-600 block">📍 Pinpoint Location Selected</span>
          {streetAddr && (
            <p className="text-[11px] text-gray-700 font-medium leading-snug line-clamp-2">
              {streetAddr}
            </p>
          )}
          <span className="text-[10px] text-gray-500 font-mono block">
            GPS Coordinates: {selectedPos[0].toFixed(5)}°, {selectedPos[1].toFixed(5)}°
          </span>
        </div>
      </Popup>
    </Marker>
  ) : null;
}

const Maps = ({ 
  complaints = [], 
  height = '400px', 
  center = defaultCenter, 
  onSelectLocation = null,
  initialSelectedPos = null,
  showGpsButton = true
}) => {
  const [selectedPos, setSelectedPos] = useState(initialSelectedPos);
  const [userGpsPos, setUserGpsPos] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    if (initialSelectedPos) {
      setSelectedPos(initialSelectedPos);
    }
  }, [initialSelectedPos]);

  const mapCenter = userGpsPos || ((center && center[0] && center[1]) ? center : defaultCenter);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserGpsPos(coords);
        setSelectedPos(coords);
        setGpsLoading(false);
        if (onSelectLocation) {
          onSelectLocation(pos.coords.latitude, pos.coords.longitude, true);
        }
      },
      (err) => {
        console.warn('GPS Locate Error:', err);
        setGpsLoading(false);
        alert('Could not acquire live GPS position. Please ensure location permissions are granted.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative z-0 group">
      
      {/* Floating GPS Button */}
      {showGpsButton && (
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={gpsLoading}
          className="absolute top-3 right-3 z-[400] px-3.5 py-2 rounded-xl bg-gray-900/90 border border-sky-500/40 text-sky-400 hover:text-white hover:bg-sky-500/20 font-bold text-xs shadow-xl flex items-center gap-1.5 transition-all backdrop-blur-md"
          title="Detect Current GPS Location"
        >
          <Crosshair className={`w-4 h-4 ${gpsLoading ? 'animate-spin text-amber-400' : 'text-sky-400'}`} />
          <span>{gpsLoading ? 'Acquiring GPS...' : '🎯 My Live GPS'}</span>
        </button>
      )}

      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapController center={mapCenter} userGpsPos={userGpsPos} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Real-time User GPS Marker */}
        {userGpsPos && (
          <Marker position={userGpsPos} icon={gpsPulseIcon}>
            <Popup>
              <div className="p-1 font-sans text-xs">
                <span className="font-extrabold text-sky-600 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5" />
                  Your Real-Time GPS Position
                </span>
                <span className="text-[10px] text-gray-500 font-mono block mt-0.5">
                  {userGpsPos[0].toFixed(5)}° N, {userGpsPos[1].toFixed(5)}° E
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {onSelectLocation && (
          <LocationPicker 
            onSelectLocation={onSelectLocation} 
            selectedPos={selectedPos} 
            setSelectedPos={setSelectedPos} 
          />
        )}

        {complaints.map((cmp, idx) => {
          const lat = cmp.location?.lat || (defaultCenter[0] + (idx * 0.015 - 0.02));
          const lng = cmp.location?.lng || (defaultCenter[1] + (idx * 0.015 - 0.01));
          const icon = getMarkerIcon(cmp.priority);

          return (
            <Marker key={cmp._id || cmp.id || idx} position={[lat, lng]} icon={icon}>
              <Popup>
                <div className="p-1 max-w-xs font-sans">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white mb-1 ${
                    (cmp.priority || '').toUpperCase() === 'CRITICAL' ? 'bg-red-600' :
                    (cmp.priority || '').toUpperCase() === 'HIGH' ? 'bg-rose-600' :
                    (cmp.priority || '').toUpperCase() === 'MEDIUM' ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}>
                    {cmp.priority} Priority • {cmp.category}
                  </span>
                  <h4 className="font-bold text-sm text-gray-900 mb-1">{cmp.title}</h4>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{cmp.description}</p>
                  <div className="text-[11px] text-gray-500 font-medium">
                    Status: <span className="font-bold text-emerald-700">{cmp.status}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default Maps;


