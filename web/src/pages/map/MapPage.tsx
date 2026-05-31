import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import booleanIntersects from '@turf/boolean-intersects';
import { polygon as turfPolygon } from '@turf/helpers';
import api from '../../api/axios';
import { useUser } from '../../contexts/useUser';

interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

interface Neighbourhood {
  id: string;
  name: string;
  geometry?: GeoJsonPolygon;
}

// GeoJSON [lng, lat] → Leaflet [lat, lng]
function toLeaflet(coords: number[][][]): [number, number][] {
  return coords[0].map(([lng, lat]) => [lat, lng]);
}

function centroid(coords: number[][][]): [number, number] {
  const ring = coords[0];
  const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
  const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
  return [lat, lng];
}

function findOverlaps(newGeom: GeoJsonPolygon, others: Neighbourhood[], ownId: string): Neighbourhood[] {
  try {
    const newPoly = turfPolygon(newGeom.coordinates);
    return others.filter((n) => {
      if (n.id === ownId || !n.geometry) return false;
      try {
        return booleanIntersects(newPoly, turfPolygon(n.geometry.coordinates));
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522];

const PALETTE = [
  '#2D6A4F', '#52B788', '#E07B39', '#7C3AED',
  '#2563EB', '#D97706', '#0891B2', '#BE185D',
];

function neighbourhoodColor(id: string, ownId?: string) {
  if (id === ownId) return '#1E4D35';
  return PALETTE[id.charCodeAt(id.length - 1) % PALETTE.length];
}

interface DrawControlProps {
  ownNeighbourhood: Neighbourhood;
  allNeighbourhoods: Neighbourhood[];
  onSave: (geometry: GeoJsonPolygon, overlaps: Neighbourhood[]) => void;
}

function DrawControl({ ownNeighbourhood, allNeighbourhoods, onSave }: DrawControlProps) {
  const map = useMap();
  const drawnRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    drawnRef.current = drawnItems;
    map.addLayer(drawnItems);

    if (ownNeighbourhood.geometry) {
      const latlngs = toLeaflet(ownNeighbourhood.geometry.coordinates);
      L.polygon(latlngs, { color: '#1E4D35', fillOpacity: 0.2 }).addTo(drawnItems);
    }

    const drawControl = new (L.Control as any).Draw({
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color: '#1E4D35', fillOpacity: 0.15, weight: 2 },
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: { featureGroup: drawnItems },
    });
    map.addControl(drawControl);

    function handleGeometry(geom: GeoJsonPolygon) {
      const overlaps = findOverlaps(geom, allNeighbourhoods, ownNeighbourhood.id);
      onSave(geom, overlaps);
    }

    function onCreate(e: any) {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
      handleGeometry(e.layer.toGeoJSON().geometry as GeoJsonPolygon);
    }

    function onEdit(e: any) {
      e.layers.eachLayer((layer: any) => {
        handleGeometry(layer.toGeoJSON().geometry as GeoJsonPolygon);
      });
    }

    map.on((L as any).Draw.Event.CREATED, onCreate);
    map.on((L as any).Draw.Event.EDITED, onEdit);

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
      map.off((L as any).Draw.Event.CREATED, onCreate);
      map.off((L as any).Draw.Event.EDITED, onEdit);
    };
  }, [map, ownNeighbourhood.id]);

  return null;
}

export default function MapPage() {
  const { user } = useUser();
  const [neighbourhoods, setNeighbourhoods] = useState<Neighbourhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [overlapWarning, setOverlapWarning] = useState<Neighbourhood[]>([]);
  const [drawResetKey, setDrawResetKey] = useState(0);

  const canEdit = user?.role === 'moderateur' || user?.role === 'admin';
  const ownNeighbourhood = neighbourhoods.find((n) => n.id === user?.neighbourhoodId) ?? null;

  useEffect(() => {
    api.get<Neighbourhood[]>('/neighbourhoods')
      .then(({ data }) => setNeighbourhoods(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveGeometry(geometry: GeoJsonPolygon) {
    if (!ownNeighbourhood) return;
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await api.patch<Neighbourhood>(`/neighbourhoods/${ownNeighbourhood.id}`, { geometry });
      setNeighbourhoods((prev) => prev.map((n) => (n.id === data.id ? data : n)));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Erreur lors de la sauvegarde du quartier');
    } finally {
      setSaving(false);
      setOverlapWarning([]);
    }
  }

  function handleDrawn(geometry: GeoJsonPolygon, overlaps: Neighbourhood[]) {
    if (overlaps.length > 0) {
      setOverlapWarning(overlaps);
      setDrawResetKey((k) => k + 1);
    } else {
      setOverlapWarning([]);
      saveGeometry(geometry);
    }
  }

  const mapCenter: [number, number] = ownNeighbourhood?.geometry
    ? centroid(ownNeighbourhood.geometry.coordinates)
    : neighbourhoods.find((n) => n.geometry)
    ? centroid(neighbourhoods.find((n) => n.geometry)!.geometry!.coordinates)
    : DEFAULT_CENTER;

  const mapZoom = ownNeighbourhood?.geometry ? 14 : 12;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 lg:px-8 pt-5 pb-4 bg-white border-b border-sable/20 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-heading text-2xl font-bold text-charbon">Carte des quartiers</h1>
          <p className="text-xs text-charbon/40 mt-0.5">
            {neighbourhoods.filter((n) => n.geometry).length} quartier{neighbourhoods.filter((n) => n.geometry).length !== 1 ? 's' : ''} avec contour
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-charbon/40">Sauvegarde...</span>}
          {saved && <span className="text-xs text-vert-foret font-medium">✓ Quartier mis à jour</span>}
          {canEdit && ownNeighbourhood && (
            <span className="text-xs bg-ambre/10 text-ambre px-3 py-1.5 rounded-full font-medium">
              Mode édition — {ownNeighbourhood.name}
            </span>
          )}
        </div>
      </div>

      {/* Edit instructions */}
      {canEdit && ownNeighbourhood && (
        <div className="px-5 py-2.5 bg-vert-foret/5 border-b border-vert-foret/10 flex-shrink-0">
          <p className="text-xs text-vert-foret/80">
            Utilise l'outil <strong>polygone</strong> dans la barre à gauche pour dessiner ou modifier les limites de <strong>{ownNeighbourhood.name}</strong>. Sauvegarde automatique après chaque modification.
          </p>
        </div>
      )}

      {/* Overlap warning */}
      {overlapWarning.length > 0 && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-200 flex items-center justify-between gap-4 flex-shrink-0">
          <div>
            <p className="text-sm font-medium text-red-700">Chevauchement interdit</p>
            <p className="text-xs text-red-600 mt-0.5">
              Ce tracé empiète sur <strong>{overlapWarning.map((n) => n.name).join(', ')}</strong>. Redessine le contour sans dépasser les limites existantes.
            </p>
          </div>
          <button
            onClick={() => setOverlapWarning([])}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-100 transition-colors flex-shrink-0"
          >
            OK
          </button>
        </div>
      )}

      {/* Legend */}
      {!loading && neighbourhoods.length > 0 && (
        <div className="px-5 py-2 bg-white border-b border-sable/10 flex gap-4 flex-wrap flex-shrink-0">
          {neighbourhoods.map((n) => (
            <div key={n.id} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm opacity-70"
                style={{ backgroundColor: neighbourhoodColor(n.id, user?.neighbourhoodId) }}
              />
              <span className="text-xs text-charbon/60">
                {n.name}
                {!n.geometry && <span className="text-charbon/30 ml-1">(sans contour)</span>}
                {n.id === user?.neighbourhoodId && <span className="text-vert-foret ml-1 font-medium">• toi</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full text-charbon/40 text-sm">
            Chargement de la carte...
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="h-full w-full"
            style={{ zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* All neighbourhoods read-only polygons */}
            {neighbourhoods
              .filter((n) => n.geometry && (!canEdit || n.id !== user?.neighbourhoodId))
              .map((n) => (
                <Polygon
                  key={n.id}
                  positions={toLeaflet(n.geometry!.coordinates)}
                  pathOptions={{
                    color: neighbourhoodColor(n.id, user?.neighbourhoodId),
                    fillOpacity: 0.15,
                    weight: 2,
                    opacity: 0.7,
                  }}
                >
                  <Tooltip sticky>{n.name}</Tooltip>
                </Polygon>
              ))}

            {/* Own neighbourhood draw control */}
            {canEdit && ownNeighbourhood && (
              <DrawControl
                key={drawResetKey}
                ownNeighbourhood={ownNeighbourhood}
                allNeighbourhoods={neighbourhoods}
                onSave={handleDrawn}
              />
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
