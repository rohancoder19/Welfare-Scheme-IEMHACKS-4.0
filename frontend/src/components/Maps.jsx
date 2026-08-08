import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 200);
      if (center && center[0] && center[1]) {
        map.setView(center, map.getZoom(), { animate: true });
      }
      return () => clearTimeout(timer);
    }
  }, [center, map]);
  return null;
}

// Location Picker for clicking on map
function LocationPicker({ onSelectLocation, selectedPos, setSelectedPos }) {
  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setSelectedPos(newPos);
      if (onSelectLocation) {
        onSelectLocation(e.latlng.lat, e.latlng.lng);
      }
    }
  });

  return selectedPos ? (
    <Marker position={selectedPos} icon={selectedPinIcon}>
      <Popup>
        <div className="p-1 font-sans text-xs">
          <span className="font-bold text-indigo-600 block mb-0.5">📍 Pinpoint Location Selected</span>
          <span className="text-[10px] text-gray-500 font-mono">
            Lat: {selectedPos[0].toFixed(4)}, Lng: {selectedPos[1].toFixed(4)}
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
  initialSelectedPos = null
}) => {
  const [selectedPos, setSelectedPos] = useState(initialSelectedPos);

  const mapCenter = (center && center[0] && center[1]) ? center : defaultCenter;

  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative z-0">
      <MapContainer
        center={mapCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapController center={mapCenter} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

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

