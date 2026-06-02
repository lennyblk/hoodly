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

interface CreateDrawControlProps {
  allNeighbourhoods: Neighbourhood[];
  onDrawn: (geometry: GeoJsonPolygon, overlaps: Neighbourhood[]) => void;
}

function CreateDrawControl({ allNeighbourhoods, onDrawn }: CreateDrawControlProps) {
  const map = useMap();

  useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new (L.Control as any).Draw({
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color: '#7C3AED', fillOpacity: 0.15, weight: 2 },
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

    function onCreate(e: any) {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
      const geom = e.layer.toGeoJSON().geometry as GeoJsonPolygon;
      const overlaps = findOverlaps(geom, allNeighbourhoods, '');
      onDrawn(geom, overlaps);
    }

    function onEdit(e: any) {
      e.layers.eachLayer((layer: any) => {
        const geom = layer.toGeoJSON().geometry as GeoJsonPolygon;
        const overlaps = findOverlaps(geom, allNeighbourhoods, '');
        onDrawn(geom, overlaps);
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
  }, [map]);

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

  const [creatingMode, setCreatingMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGeometry, setNewGeometry] = useState<GeoJsonPolygon | null>(null);
  const [createOverlap, setCreateOverlap] = useState<Neighbourhood[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createDrawKey, setCreateDrawKey] = useState(0);

  const isAdmin = user?.role === 'admin';
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

  function handleCreateDrawn(geometry: GeoJsonPolygon, overlaps: Neighbourhood[]) {
    if (overlaps.length > 0) {
      setCreateOverlap(overlaps);
      setNewGeometry(null);
      setCreateDrawKey((k) => k + 1);
    } else {
      setCreateOverlap([]);
      setNewGeometry(geometry);
    }
  }

  function cancelCreating() {
    setCreatingMode(false);
    setNewName('');
    setNewGeometry(null);
    setCreateOverlap([]);
    setCreateError(null);
    setCreateDrawKey((k) => k + 1);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newGeometry || !user) return;
    if (createOverlap.length > 0) return;
    setSaving(true);
    setCreateError(null);
    try {
      const { data } = await api.post<Neighbourhood>('/neighbourhoods', {
        name: newName.trim(),
        geometry: newGeometry,
        createdBy: user._id,
      });
      setNeighbourhoods((prev) => [...prev, data]);
      cancelCreating();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message ?? 'Erreur lors de la création');
    } finally {
      setSaving(false);
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
          {saved && <span className="text-xs text-vert-foret font-medium">✓ Quartier créé</span>}
          {canEdit && ownNeighbourhood && !creatingMode && (
            <span className="text-xs bg-ambre/10 text-ambre px-3 py-1.5 rounded-full font-medium">
              Mode édition — {ownNeighbourhood.name}
            </span>
          )}
          {isAdmin && !creatingMode && (
            <button
              onClick={() => setCreatingMode(true)}
              className="bg-vert-foret text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-vert-moyen transition-colors flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Nouveau quartier
            </button>
          )}
        </div>
      </div>

      {/* Creation panel */}
      {creatingMode && (
        <form
          onSubmit={handleCreate}
          className="px-5 lg:px-8 py-3 bg-violet-50 border-b border-violet-200 flex-shrink-0"
        >
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-48">
              <p className="text-xs font-semibold text-violet-700 mb-2">Nouveau quartier</p>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nom du quartier (ex: Montmartre)"
                className="w-full border border-violet-300 rounded-xl px-3 py-2 text-sm text-charbon focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400"
                required
                autoFocus
              />
              {createError && <p className="text-xs text-red-500 mt-1">{createError}</p>}
            </div>
            <div className="flex flex-col gap-1 pt-5">
              <div className="flex items-center gap-2">
                {newGeometry ? (
                  <span className="text-xs text-vert-foret font-medium">✓ Contour dessiné</span>
                ) : (
                  <span className="text-xs text-violet-600">Dessine le contour sur la carte →</span>
                )}
                {createOverlap.length > 0 && (
                  <span className="text-xs text-red-600 font-medium">
                    Chevauchement avec {createOverlap.map((n) => n.name).join(', ')}
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  type="submit"
                  disabled={!newName.trim() || !newGeometry || saving || createOverlap.length > 0}
                  className="px-4 py-1.5 bg-vert-foret text-white rounded-lg text-sm font-medium hover:bg-vert-moyen transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? 'Création...' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={cancelCreating}
                  className="px-4 py-1.5 border border-violet-300 text-violet-600 rounded-lg text-sm hover:bg-violet-100 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Edit instructions (moderateur only, not in creation mode) */}
      {canEdit && ownNeighbourhood && !creatingMode && (
        <div className="px-5 py-2.5 bg-vert-foret/5 border-b border-vert-foret/10 flex-shrink-0">
          <p className="text-xs text-vert-foret/80">
            Utilise l'outil <strong>polygone</strong> dans la barre à gauche pour dessiner ou modifier les limites de <strong>{ownNeighbourhood.name}</strong>. Sauvegarde automatique après chaque modification.
          </p>
        </div>
      )}

      {/* Overlap warning (edit mode) */}
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

            {/* Own neighbourhood draw control (moderateur/admin editing existing) */}
            {canEdit && ownNeighbourhood && !creatingMode && (
              <DrawControl
                key={drawResetKey}
                ownNeighbourhood={ownNeighbourhood}
                allNeighbourhoods={neighbourhoods}
                onSave={handleDrawn}
              />
            )}

            {/* Creation draw control (admin creating new) */}
            {isAdmin && creatingMode && (
              <CreateDrawControl
                key={createDrawKey}
                allNeighbourhoods={neighbourhoods}
                onDrawn={handleCreateDrawn}
              />
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
