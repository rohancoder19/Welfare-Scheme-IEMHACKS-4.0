import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issues in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const defaultCenter = [18.5204, 73.8567]; // Pune default coordinates

const Maps = ({ complaints = [], height = '400px' }) => {
  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {complaints.map((cmp, idx) => {
          const lat = cmp.location?.lat || (defaultCenter[0] + (idx * 0.015 - 0.02));
          const lng = cmp.location?.lng || (defaultCenter[1] + (idx * 0.015 - 0.01));

          return (
            <Marker key={cmp._id || idx} position={[lat, lng]}>
              <Popup>
                <div className="p-1 max-w-xs font-sans">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white mb-1 ${
                    cmp.priority === 'High' ? 'bg-red-600' : cmp.priority === 'Medium' ? 'bg-amber-600' : 'bg-blue-600'
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
