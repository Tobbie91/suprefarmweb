// src/pages/FarmDashboard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, Button, Tag, Alert, Skeleton, message } from "antd";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  Sprout,
  Map as MapIcon,
  MapPin,
  Cloud,
  ArrowRight,
  ShieldCheck,
  Download,
  PlusCircle,
} from "lucide-react";
import {
  MapContainer,
  LayersControl,
  Polygon,
  CircleMarker,
  Popup,
} from "react-leaflet";
import type { LatLngExpression, LatLngTuple } from "leaflet";
import L from "leaflet";
import { fetchOpenMeteo, MeteoResponse } from "../services/openMeteo";

import JSZip from "jszip";
import * as toGeoJSON from "@tmcw/togeojson";
import * as turf from "@turf/turf";
import { GoogleMutantLayer } from "../components/GoogleMutantLayer";
import { useGoogleMaps } from "../lib/useGoogleMaps";
import { supabase } from "../supabase";

// ---------- Configure where the KML lives ----------
const STORAGE_BUCKET = "farm-kml"; // <<< change to your bucket name
const CANDIDATE_PATHS = (slug: string) => [
  `${slug}.kmz`,
  `${slug}.kml`,
  `farms/${slug}.kmz`,
  `farms/${slug}.kml`,
];



// ---------- Types ----------
type Farm = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  hectares: number;
  location?: string;
  boundary?: LatLngTuple[]; // single outer ring [lat, lon]
  unitsOwned?: number;
  landId?: string;
};

type Weather = {
  currentTemp?: number;
  currentHumidity?: number;
  currentWind?: number;
  todayPrecip?: number;
};

type GeoCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, any>;

type PlotFeature = {
  id: string;
  plot_code: string | null;
  geom_geojson: GeoJSON.Geometry;
  area_ha: number | null;
  mine: boolean;
  rings: any;
};



function firstRingFromGeoJSON(geom: GeoJSON.Geometry): LatLngTuple[] | null {
  if (geom.type === "Polygon") {
    const ring = (geom as GeoJSON.Polygon).coordinates[0];
    return ring?.map(([lng, lat]) => [lat, lng]) as LatLngTuple[];
  }
  if (geom.type === "MultiPolygon") {
    const ring = (geom as GeoJSON.MultiPolygon).coordinates?.[0]?.[0];
    return ring?.map(([lng, lat]) => [lat, lng]) as LatLngTuple[];
  }
  return null;
}

async function blobToText(blob: Blob) {
  return await blob.text();
}


// ---------- UI ----------
const panel = "rounded-2xl bg-white shadow-sm ring-1 ring-black/5";

export default function FarmDashboard() {
  // const { farmId } = useParams();
  const params = useParams();
const [searchParams] = useSearchParams();

const resolvedSlug = React.useMemo(() => {
  const candidate =
    params.farmId ??    
    params.slug ??      
    params.id ??    
    searchParams.get("farmId") ??
    searchParams.get("slug") ??
    "";

  const fromPath = candidate || window.location.pathname.split("/").filter(Boolean).pop() || "";
  return decodeURIComponent(fromPath).trim();
}, [params, searchParams]);

  const navigate = useNavigate();

  // Google basemaps
  useGoogleMaps(process.env.REACT_APP_GOOGLE_MAPS_API_KEY);

  // State
  const [farm, setFarm] = useState<Farm | null>(null);
  const [weather, setWeather] = useState<Weather>({});
  const [loading, setLoading] = useState(true);
  const [wLoading, setWLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [, setPlots] = useState<PlotFeature[]>([]);
  const [boundarySource, setBoundarySource] = useState<
    "kml" | "kmz" | "geojson" | "none"
  >("none");

  // Keep the exact KML (if we loaded one) for the Download button
  const [kmlDownload, setKmlDownload] = useState<{
    filename: string;
    blob: Blob;
  } | null>(null);

  // Leaflet map ref to fit bounds
  const mapRef = useRef<L.Map | null>(null);


  


  // Load farm + boundary (KML/KMZ from storage) + plots
  useEffect(() => {
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        // --- helpers (local to this effect for clarity) ---
        const extractKmlGeoCollectionFromText = (kmlText: string): GeoCollection => {
          const dom = new DOMParser().parseFromString(kmlText, "text/xml");
          return toGeoJSON.kml(dom) as GeoCollection;
        };
  
        const findBestPolygonRing = (gj: GeoCollection): LatLngTuple[] | null => {
          const polys: GeoJSON.Polygon[] = [];
          for (const ft of gj.features || []) {
            const g = ft.geometry;
            if (!g) continue;
            if (g.type === "Polygon") polys.push(g as GeoJSON.Polygon);
            else if (g.type === "MultiPolygon") {
              const mp = g as GeoJSON.MultiPolygon;
              for (const coords of mp.coordinates) {
                polys.push({ type: "Polygon", coordinates: coords });
              }
            }
          }
          if (!polys.length) return null;
          let best: { ring: LatLngTuple[]; area: number } | null = null;
          for (const p of polys) {
            const outer = p.coordinates?.[0];
            if (!outer || outer.length < 3) continue;
            const ring = outer.map(([lng, lat]) => [lat, lng]) as LatLngTuple[];
            const area = turf.area({ type: "Feature", geometry: p as any } as any);
            if (!best || area > best.area) best = { ring, area };
          }
          return best?.ring || null;
        };
  
        const bufferFirstPointOrLine = (gj: GeoCollection, meters = 25): LatLngTuple[] | null => {
          let candidate: GeoJSON.Geometry | null = null;
          for (const ft of gj.features || []) {
            const g = ft.geometry;
            if (!g) continue;
            if (
              g.type === "Point" || g.type === "MultiPoint" ||
              g.type === "LineString" || g.type === "MultiLineString"
            ) {
              candidate = g;
              break;
            }
          }
          if (!candidate) return null;
          const feat: any = { type: "Feature", geometry: candidate as any };
          const buffered: any = turf.buffer(feat, meters, { units: "meters" });
          const poly =
            buffered?.geometry?.type === "Polygon"
              ? (buffered.geometry as GeoJSON.Polygon)
              : buffered?.geometry?.type === "MultiPolygon"
              ? { type: "Polygon", coordinates: (buffered.geometry as GeoJSON.MultiPolygon).coordinates[0] }
              : null;
          if (!poly?.coordinates?.[0]) return null;
          return (poly.coordinates[0] as [number, number][])
            .map(([lng, lat]) => [lat, lng]) as LatLngTuple[];
        };
  
        // --- 0) Resolve/validate slug from route/query ---
        const slug = resolvedSlug;
        if (!slug) throw new Error("Missing farm id in the URL (e.g. /farms/{slug}).");
  
        // --- 1) Load farm (include boundary_geojson for fallback) ---
        const { data: f, error: fe } = await supabase
          .from("farms")
          .select("id, slug, name, centroid_lat, centroid_lon, area_ha, location, land_id, boundary_geojson")
          .ilike("slug", slug)
          .maybeSingle();
  
        if (fe) throw fe;
        if (!f) throw new Error(`No farm found for slug "${slug}".`);
  
        // --- 2) Try KML/KMZ from Storage (by convention) ---
        let ring: LatLngTuple[] | null = null;
        let source: "kml" | "kmz" | "geojson" | null = null;
  
        for (const path of CANDIDATE_PATHS(slug)) {
          const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .download(path);
          if (error || !data) continue;
  
          const lower = path.toLowerCase();
  
          // KML path
          if (lower.endsWith(".kml")) {
            const kmlText = await blobToText(data);
            const gj = extractKmlGeoCollectionFromText(kmlText);
            ring = findBestPolygonRing(gj) || bufferFirstPointOrLine(gj, 25);
            if (ring) {
              source = "kml";
              setKmlDownload({ filename: path.split("/").pop() || `${slug}.kml`, blob: data });
              break;
            }
          }
          // KMZ path
          else if (lower.endsWith(".kmz")) {
            const ab = await data.arrayBuffer();
            const zip = await JSZip.loadAsync(ab);
            // try each .kml inside the kmz
            for (const zpath of Object.keys(zip.files)) {
              if (!zpath.toLowerCase().endsWith(".kml")) continue;
              const kmlText = await zip.files[zpath].async("text");
              const gj = extractKmlGeoCollectionFromText(kmlText);
              ring = findBestPolygonRing(gj) || bufferFirstPointOrLine(gj, 25);
              if (ring) {
                source = "kmz";
                setKmlDownload({ filename: path.split("/").pop() || `${slug}.kmz`, blob: data });
                break;
              }
            }
            if (ring) break;
          }
          // No extension: sniff as KML then KMZ
          else {
            try {
              const kmlText = await blobToText(data);
              const gj = extractKmlGeoCollectionFromText(kmlText);
              ring = findBestPolygonRing(gj) || bufferFirstPointOrLine(gj, 25);
              if (ring) {
                source = "kml";
                setKmlDownload({ filename: path.split("/").pop() || `${slug}.kml`, blob: data });
                break;
              }
            } catch {}
            try {
              const ab = await data.arrayBuffer();
              const zip = await JSZip.loadAsync(ab);
              for (const zpath of Object.keys(zip.files)) {
                if (!zpath.toLowerCase().endsWith(".kml")) continue;
                const kmlText = await zip.files[zpath].async("text");
                const gj = extractKmlGeoCollectionFromText(kmlText);
                ring = findBestPolygonRing(gj) || bufferFirstPointOrLine(gj, 25);
                if (ring) {
                  source = "kmz";
                  setKmlDownload({ filename: path.split("/").pop() || `${slug}.kmz`, blob: data });
                  break;
                }
              }
              if (ring) break;
            } catch {}
          }
        }
  
        // --- 2b) Fuzzy KMZ match (handles names like "ilora farm boundary coord.kmz") ---
        if (!ring) {
          const folders = ["", "farms", "farm"];
          const slugLC = slug.toLowerCase();
  
          for (const folder of folders) {
            const { data: files, error: listErr } = await supabase.storage
              .from(STORAGE_BUCKET)
              .list(folder, { limit: 1000 });
            if (listErr) continue;
  
            const match = files?.find(
              (fobj) =>
                fobj.name.toLowerCase().includes(slugLC) &&
                fobj.name.toLowerCase().endsWith(".kmz")
            );
            if (!match) continue;
  
            const key = folder ? `${folder}/${match.name}` : match.name;
            const { data: blob, error: dlErr } = await supabase.storage
              .from(STORAGE_BUCKET)
              .download(key);
            if (dlErr || !blob) continue;
  
            try {
              const ab = await blob.arrayBuffer();
              const zip = await JSZip.loadAsync(ab);
              for (const zpath of Object.keys(zip.files)) {
                if (!zpath.toLowerCase().endsWith(".kml")) continue;
                const kmlText = await zip.files[zpath].async("text");
                const gj = extractKmlGeoCollectionFromText(kmlText);
                ring = findBestPolygonRing(gj) || bufferFirstPointOrLine(gj, 25);
                if (ring) {
                  source = "kmz";
                  setKmlDownload({ filename: match.name, blob });
                  break;
                }
              }
              if (ring) break;
            } catch {}
          }
        }
  
        // --- 2c) DB fallback (geojson) ---
        if (!ring && f.boundary_geojson) {
          ring = firstRingFromGeoJSON(f.boundary_geojson as GeoJSON.Geometry);
          if (ring) source = "geojson";
        }
  
        // --- 2d) Last resort: show marker instead of error ---
        if (!ring) {
          setBoundarySource("none");
          const lat = f.centroid_lat ?? 0;
          const lon = f.centroid_lon ?? 0;
          setFarm({
            id: f.id,
            name: f.name,
            lat,
            lon,
            hectares: Number(f.area_ha) || 0,
            location: f.location || undefined,
            landId: f.land_id || undefined,
            boundary: undefined, // CircleMarker path in your JSX
          });
          return; // stop here; no polygon to compute
        }
  
        // --- 3) Compute center/area from ring or use DB values ---
        const gjPoly: any = {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [ring.map(([lat, lng]) => [lng, lat])], // [lng,lat]
          },
        };
        const centroid = turf.centerOfMass(gjPoly).geometry.coordinates as [number, number];
        let centerLat = f.centroid_lat ?? centroid[1];
        let centerLon = f.centroid_lon ?? centroid[0];
  
        const computedHa = Math.round((turf.area(gjPoly) / 10_000) * 100) / 100;
        const areaHa =
          typeof f.area_ha === "number" && f.area_ha > 0 ? Number(f.area_ha) : computedHa;
  
        setBoundarySource(source || "geojson");
  
        // --- 4) Map to UI state ---
        const mapped: Farm = {
          id: f.id,
          name: f.name,
          lat: centerLat!,
          lon: centerLon!,
          hectares: areaHa,
          location: f.location || undefined,
          landId: f.land_id || undefined,
          boundary: ring,
        };
        setFarm(mapped);
  
        // --- 5) Plots + ownerships (optional) ---
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id || null;
  
        const { data: pl, error: pe } = await supabase
          .from("plots")
          .select(
            `
            id,
            plot_code,
            geom_geojson,
            area_ha,
            ownerships ( user_id, units )
          `
          )
          .eq("farm_id", f.id);
        if (pe) throw pe;
  
        if (Array.isArray(pl)) {
          const mappedPlots: PlotFeature[] = (pl as any[]).map((p) => {
            const g = p.geom_geojson as GeoJSON.Geometry;
            const ringP = firstRingFromGeoJSON(g);
            const mine =
              !!uid && Array.isArray(p.ownerships)
                ? p.ownerships.some((o: any) => o.user_id === uid)
                : false;
            return {
              id: p.id,
              plot_code: p.plot_code,
              geom_geojson: g,
              area_ha: p.area_ha,
              mine,
              rings: ringP ? [ringP] : [],
            };
          });
          setPlots(mappedPlots);
          const myUnits = mappedPlots.reduce((sum, p) => sum + (p.mine ? 1 : 0), 0);
          setFarm((prev) => (prev ? { ...prev, unitsOwned: myUnits } : prev));
        }
      } catch (e: any) {
        console.error(e);
        const msg = e?.message || "";
        if (/Missing farm id/i.test(msg)) {
          setErr("Missing farm id in the URL (e.g. /farms/{slug}).");
        } else if (/No farm found/i.test(msg)) {
          setErr(msg);
        } else {
          setErr(msg || "Failed to load farm or boundary.");
        }
        setFarm(null);
        setPlots([]);
        setBoundarySource("none");
      } finally {
        setLoading(false);
      }
    })();
  }, [resolvedSlug]);
  
  
  

  // Fit map to boundary
  useEffect(() => {
    if (!farm?.boundary || !mapRef.current) return;
    const bounds = L.latLngBounds(farm.boundary as any);
    mapRef.current.fitBounds(bounds, { padding: [24, 24] });
  }, [farm?.boundary]);

  // Weather
  useEffect(() => {
    if (!farm) return;
    (async () => {
      try {
        setWLoading(true);
        const end = dayjs().format("YYYY-MM-DD");
        const start = dayjs().subtract(6, "day").format("YYYY-MM-DD");
        const res = await fetchOpenMeteo(farm.lat, farm.lon, start, end);
        const hourly: Partial<NonNullable<MeteoResponse["hourly"]>> =
          res.hourly ?? {};
        const nowT = hourly.temperature_2m?.at(-1);
        const nowH = hourly.relative_humidity_2m?.at(-1);
        const nowW = hourly.wind_speed_10m?.at(-1);
        const todayPrecip = res.daily?.precipitation_sum?.[0];

        setWeather({
          currentTemp: nowT,
          currentHumidity: nowH,
          currentWind: nowW,
          todayPrecip,
        });
      } catch {
        // ignore
      } finally {
        setWLoading(false);
      }
    })();
  }, [farm]);

  const enviroTraceLink = useMemo(() => {
    if (!farm) return "#";
    const start = dayjs().subtract(29, "day").format("YYYY-MM-DD");
    const end = dayjs().format("YYYY-MM-DD");
    const q = new URLSearchParams({
      lat: String(farm.lat),
      lon: String(farm.lon),
      start,
      end,
    }).toString();
    return `/envirotrace/results?${q}`;
  }, [farm]);

  // Download the exact file we used
  function downloadKML() {
    if (!kmlDownload) {
      message.warning("No KML/KMZ loaded.");
      return;
    }
    const url = URL.createObjectURL(kmlDownload.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = kmlDownload.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] px-5 md:px-8 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600/10 flex items-center justify-center">
              <Sprout className="text-emerald-700" size={20} />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-semibold text-gray-800">
                {farm?.name || "Farm"}
              </div>
              <div className="text-gray-600 text-sm flex items-center gap-2">
                <MapPin size={14} className="text-emerald-700" />
                {farm?.location || "—"}
                {farm && (
                  <a
                    href={`https://www.google.com/maps?q=${farm.lat},${farm.lon}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-emerald-700 hover:underline"
                  >
                    Open center in Google Maps
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Tag
              color={
                boundarySource === "kml" || boundarySource === "kmz"
                  ? "green"
                  : "red"
              }
            >
              Boundary: {boundarySource.toUpperCase()}
            </Tag>

            <Button
              className="border-emerald-200 text-emerald-700 hover:!bg-emerald-50"
              onClick={downloadKML}
              icon={<Download size={16} />}
            >
              Download KML/KMZ
            </Button>

            <Link
              to="/land-purchase"
              className="inline-flex items-center rounded-md px-3 py-2 text-sm border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
            >
              <PlusCircle size={16} className="mr-1" /> Buy More Land
            </Link>
          </div>
        </div>

        {err && (
          <Alert
            className="mb-6"
            type="error"
            showIcon
            message="Error"
            description={err}
          />
        )}

        {/* Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
          {/* Map & weather */}
          <Card className={panel}>
            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <MapIcon size={18} /> Aerial View
                </div>
                <div className="flex items-center gap-2">
                  <Tag
                    color="green"
                    className="rounded-full px-3 py-1 text-[11px]"
                  >
                    {farm?.hectares ?? 0} ha
                  </Tag>
                </div>
              </div>

              {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : farm ? (
                <div className="rounded-xl overflow-hidden ring-1 ring-black/5">
                  <MapContainer
                    ref={mapRef}
                    center={[farm.lat, farm.lon] as LatLngExpression}
                    zoom={16}
                    className="h-[420px] md:h-[520px] w-full"
                  >
                    <LayersControl position="topright">
                      <LayersControl.BaseLayer checked name="Google Satellite">
                        <GoogleMutantLayer type="satellite" />
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="Google Hybrid">
                        <GoogleMutantLayer type="hybrid" />
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="Google Terrain">
                        <GoogleMutantLayer type="terrain" />
                      </LayersControl.BaseLayer>
                    </LayersControl>

                    {farm.boundary ? (
                      <Polygon
                        positions={farm.boundary}
                        pathOptions={{ color: "#059669" }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <div className="font-semibold">{farm.name}</div>
                            <div>{farm.location || "—"}</div>
                            <div>{farm.hectares} hectares</div>
                          </div>
                        </Popup>
                      </Polygon>
                    ) : (
                      <CircleMarker
                        center={[farm.lat, farm.lon]}
                        radius={8}
                        pathOptions={{ color: "#059669", fillOpacity: 0.9 }}
                      >
                        <Popup>{farm.name}</Popup>
                      </CircleMarker>
                    )}
                  </MapContainer>
                </div>
              ) : null}

              {/* Weather quick card */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Card className="shadow-sm">
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Cloud size={16} /> Weather Now
                  </div>
                  <div className="mt-1 text-lg">
                    {wLoading ? "—" : `${weather.currentTemp ?? "—"}°C`}&nbsp;
                    <span className="text-sm text-gray-500">
                      Humidity{" "}
                      {wLoading ? "—" : `${weather.currentHumidity ?? "—"}%`} •
                      Wind{" "}
                      {wLoading ? "—" : `${weather.currentWind ?? "—"} m/s`}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Today’s precip:{" "}
                    {wLoading ? "—" : `${weather.todayPrecip ?? 0} mm`}
                  </div>
                  <div className="mt-3">
                    <Link
                      to={enviroTraceLink}
                      className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                    >
                      Open detailed weather <ArrowRight size={14} />
                    </Link>
                  </div>
                </Card>

                <Card className="shadow-sm">
                  <div className="text-sm text-gray-500">Ownership</div>
                  <div className="mt-1 text-lg font-semibold">
                    {farm?.unitsOwned ?? 0} unit
                    {(farm?.unitsOwned ?? 0) > 1 ? "s" : ""}
                  </div>
                  <div className="text-xs text-gray-500">
                    Land size: {farm?.hectares} ha • {farm?.location || "—"}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      className="border-emerald-200 text-emerald-700 hover:!bg-emerald-50"
                      icon={<Download size={16} />}
                    >
                      Certificate
                    </Button>
                    <Button
                      type="primary"
                      className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700"
                      onClick={() =>
                        navigate(
                          `/land-purchase?highlight=${farm?.landId || ""}`
                        )
                      }
                      icon={<PlusCircle size={16} />}
                    >
                      Buy More
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </Card>

          {/* Right column: Farm updates */}
          <Card className={panel}>
            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-800">
                    Farm Updates
                  </div>
                  <div className="text-sm text-gray-500">
                    Latest activity from the field
                  </div>
                </div>
                <Tag
                  color="green"
                  className="rounded-full px-3 py-1 text-[11px]"
                >
                  Verified <ShieldCheck size={12} className="ml-1 inline" />
                </Tag>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  {
                    id: 101,
                    title: "Planting Day — Palm Seedlings",
                    summary:
                      "New rows planted with improved spacing; irrigation checks completed.",
                    date: "2025-09-20",
                    thumb:
                      "https://images.unsplash.com/photo-1524593610308-3a35c729ef2d?q=80&w=1200&auto=format&fit=crop",
                  },
                  {
                    id: 102,
                    title: "Soil Moisture Boost",
                    summary:
                      "Drip lines serviced; moisture levels back in target range.",
                    date: "2025-09-17",
                    thumb:
                      "https://images.unsplash.com/photo-1603899122552-96244c135eff?q=80&w=1200&auto=format&fit=crop",
                  },
                  {
                    id: 103,
                    title: "Weather Watch",
                    summary:
                      "Heavy rain expected in 48h. Field access routes marked.",
                    date: "2025-09-15",
                    thumb:
                      "https://images.unsplash.com/photo-1520781359717-3eb98461c9fe?q=80&w=1200&auto=format&fit=crop",
                  },
                ].map((u) => (
                  <Link
                    key={u.id}
                    to={`/farm-updates/${u.id}`}
                    className="flex gap-3 rounded-lg p-2 hover:bg-gray-50"
                  >
                    <img
                      src={u.thumb}
                      alt=""
                      className="h-16 w-24 rounded-md object-cover"
                    />
                    <div>
                      <div className="font-medium text-gray-800">{u.title}</div>
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {u.summary}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {dayjs(u.date).format("MMM D, YYYY")}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-4">
                <Link
                  to={`/reports?farmId=${encodeURIComponent(farm?.name || "")}`}
                  className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                >
                  View all reports <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer hint */}
        <div className="mt-6 text-center text-xs text-gray-500">
          Payments confirmed • ownership secured • updates posted by operations
          team.
        </div>
      </div>
    </div>
  );
}
