
// import React, { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom';

// const farmData = {
//   1: { name: 'Farm 1', location: 'Ilora, Nigeria', crop: 'Palm Trees', progress: '80%', healthStatus: 'Healthy', lastActivity: 'Planted new crops', soilMoisture: '80%', temperature: '25°C' },
//   2: { name: 'Farm 2', location: 'Ghana', crop: 'Cocoa', progress: '60%', healthStatus: 'Needs attention', lastActivity: 'Irrigation adjustment', soilMoisture: '50%', temperature: '28°C' },
// };

// const FarmDetails: React.FC = () => {
//   const { farmId } = useParams(); // Get farmId from the URL
//   const [farm, setFarm] = useState<any>(null);

//   useEffect(() => {
//     // Fetch the farm details using the farmId
//     if (farmId) {
//         // @ts-ignore
//       setFarm(farmData[Number(farmId)]); // Replace with API call
//     }
//   }, [farmId]);

//   if (!farm) return <div>Farm not found.</div>;

//   return (
//     <div className="bg-gray-100 min-h-screen p-8">
//       <h1 className="text-3xl font-semibold text-gray-700 mb-8">{farm.name} Details</h1>

//       {/* Farm Information */}
//       <div className="bg-white shadow-md rounded-lg p-6 mb-8">
//         <h3 className="text-xl font-semibold text-gray-700">Farm Overview</h3>
//         <p className="text-sm text-gray-500">Location: {farm.location}</p>
//         <p className="text-sm text-gray-500">Crop: {farm.crop}</p>
//         <p className="text-sm text-gray-500">Progress: {farm.progress}</p>
//         <p className="text-sm text-gray-500">Health Status: {farm.healthStatus}</p>
//         <p className="text-sm text-gray-500">Last Activity: {farm.lastActivity}</p>
//       </div>

//       {/* Farm Metrics */}
//       <div className="bg-white shadow-md rounded-lg p-6 mb-8">
//         <h3 className="text-xl font-semibold text-gray-700">Farm Metrics</h3>
//         <p className="text-sm text-gray-500">Soil Moisture: {farm.soilMoisture}</p>
//         <p className="text-sm text-gray-500">Temperature: {farm.temperature}</p>
//       </div>

//       {/* Recent Activities */}
//       <div className="bg-white shadow-md rounded-lg p-6 mb-8">
//         <h3 className="text-xl font-semibold text-gray-700">Recent Activities</h3>
//         <ul className="list-disc pl-5">
//           <li className="text-sm text-gray-500">Irrigation systems checked</li>
//           <li className="text-sm text-gray-500">New crop planted</li>
//           <li className="text-sm text-gray-500">Pest control applied</li>
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default FarmDetails;


// src/pages/LandDetails.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, Tag, Spin, Alert, Button, Divider } from "antd";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapPin, Sprout,  ArrowLeft, ArrowRight } from "lucide-react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import { supabase } from "../supabase";

type Currency = "NGN" | "USD";

type Land = {
  id: string;
  slug: string;
  name: string;
  location: string;
  country: string;
  hectares: number;
  price_per_unit: number;
  currency: Currency;
  thumbnail_url: string | null;
  features: string[] | null;
  free_plots?: number;
  total_plots?: number;
  farm_id?: string | null;
};

type Farm = {
  id: string;
  name: string;
  area_ha: number | null;
  centroid_lat: number | null;
  centroid_lon: number | null;
  boundary_geojson: any | null; // GeoJSON
};

type PlotRow = {
  id: string;
  plot_code: string | null;
  area_ha: number | null;
  geom_geojson: any; // GeoJSON
  ownerships?: { id: string }[]; // inferred relationship
};

const currencySymbol = (c: Currency) => (c === "NGN" ? "₦" : "$");
const panel = "rounded-2xl bg-white shadow-sm ring-1 ring-black/5";

const LandDetails: React.FC = () => {
  const { slug } = useParams();
  const nav = useNavigate();

  const [land, setLand] = useState<Land | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [plots, setPlots] = useState<PlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // 1) Get land (including free_plots/total_plots) + farm_id
        const { data: landRow, error: landErr } = await supabase
          .from("lands_view")
          .select(
            "id, slug, name, location, country, hectares, price_per_unit, currency, thumbnail_url, features, free_plots, total_plots, farm_id"
          )
          .eq("slug", slug)
          .maybeSingle();

        if (landErr) throw landErr;
        if (!landRow) throw new Error("Land not found");
        setLand(landRow as Land);

        // 2) Get farm with boundary
        if (!landRow.farm_id) {
          setFarm(null);
          setPlots([]);
          return;
        }

        const { data: farmRow, error: farmErr } = await supabase
          .from("farms")
          .select("id, name, area_ha, centroid_lat, centroid_lon, boundary_geojson")
          .eq("id", landRow.farm_id)
          .maybeSingle();
        if (farmErr) throw farmErr;
        setFarm(farmRow as Farm);

        // 3) Get plots + ownerships to color availability
        //    Requires FK ownerships.plot_id -> plots.id
        const { data: plotRows, error: plotErr } = await supabase
          .from("plots")
          .select("id, plot_code, area_ha, geom_geojson, ownerships ( id )")
          .eq("farm_id", landRow.farm_id);
        if (plotErr) throw plotErr;

        setPlots((plotRows || []) as PlotRow[]);
      } catch (e: any) {
        console.error(e);
        setErr(e?.message || "Failed to load details");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Build FeatureCollections for map
  const boundaryFC = useMemo(() => {
    if (!farm?.boundary_geojson) return null;
    // ensure proper Feature or FeatureCollection
    const g = farm.boundary_geojson;
    if (g.type === "FeatureCollection") return g;
    if (g.type === "Feature") return g;
    return { type: "Feature", geometry: g, properties: {} };
  }, [farm]);

  const plotsFC = useMemo(() => {
    if (!plots.length) return null;
    return {
      type: "FeatureCollection",
      features: plots.map((p) => ({
        type: "Feature",
        geometry: p.geom_geojson,
        properties: {
          id: p.id,
          plot_code: p.plot_code || undefined,
          area_ha: p.area_ha ?? undefined,
          taken: (p.ownerships?.length ?? 0) > 0,
        },
      })),
    } as GeoJSON.FeatureCollection;
  }, [plots]);

  // Fit bounds to boundary once map + boundary are available
  useEffect(() => {
    if (!mapRef.current || !boundaryFC) return;
    const layer = L.geoJSON(boundaryFC as any);
    const b = layer.getBounds();
    if (b.isValid()) {
      mapRef.current.fitBounds(b.pad(0.1));
    }
  }, [boundaryFC]);

  const left = land?.free_plots ?? 0;
  const soldOut = left <= 0;

  return (
    <div className="min-h-screen bg-[#F6F8FB] px-5 md:px-8 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600/10 flex items-center justify-center">
              <Sprout className="text-emerald-700" size={20} />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-semibold text-gray-800">
                {land?.name || "Land Details"}
              </div>
              <div className="text-gray-600 text-sm flex items-center gap-2">
                <MapPin size={14} className="text-emerald-700" />
                {land?.location || "—"}
              </div>
            </div>
          </div>

          <Button onClick={() => nav(-1)} className="border-emerald-200 text-emerald-700 hover:!bg-emerald-50">
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
        </div>

        {err && (
          <Alert className="mb-6" type="error" showIcon message="Error" description={err} />
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-16 shadow-sm ring-1 ring-black/5 text-center">
            <Spin />
          </div>
        ) : !land ? (
          <Alert type="warning" showIcon message="Not found" description="This land was not found." />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
            {/* Left: Map */}
            <Card className={panel}>
              <div className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold text-gray-800">Satellite view</div>
                  <div className="flex gap-2">
                    <Tag color="green" className="rounded-full px-3 py-1 text-[11px]">
                      {land.hectares} ha
                    </Tag>
                    <Tag color={soldOut ? "red" : "blue"} className="rounded-full px-3 py-1 text-[11px]">
                      {left} {left === 1 ? "plot" : "plots"} left
                    </Tag>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden ring-1 ring-black/5">
                  <MapContainer
                    ref={(m) => (mapRef.current = m as any)}
                    center={[7.84, 3.92]}
                    zoom={15}
                    className="h-[420px] w-full"
                  >
                    {/* Esri World Imagery (good satellite base) */}
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      attribution="&copy; Esri"
                    />
                    {/* Optional streets for context */}
                    {/* <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap"
                    /> */}

                    {/* Boundary */}
                    {boundaryFC && (
                      <GeoJSON
                        data={boundaryFC as any}
                        style={{ color: "#059669", weight: 2, fillOpacity: 0.05 }}
                      />
                    )}

                    {/* Plots (green = available, gray = taken) */}
                    {plotsFC && (
                      <GeoJSON
                        data={plotsFC as any}
                        style={(feature) => {
                          const taken = (feature?.properties as any)?.taken;
                          return {
                            color: taken ? "#9CA3AF" : "#059669",
                            weight: 1,
                            fillColor: taken ? "#9CA3AF" : "#10B981",
                            fillOpacity: taken ? 0.25 : 0.45,
                          };
                        }}
                        onEachFeature={(feature, layer) => {
                          const props: any = feature.properties || {};
                          const label = `${props.plot_code || "Plot"} • ${props.area_ha ?? "—"} ha`;
                          const status = props.taken ? "Taken" : "Available";
                          layer.bindPopup(`<div><strong>${label}</strong><br/>Status: ${status}</div>`);
                        }}
                      />
                    )}
                  </MapContainer>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  • Green = available plots • Grey = taken plots
                </div>
              </div>
            </Card>

            {/* Right: Summary & CTA */}
            <Card className={panel}>
              <div className="p-5 md:p-6">
                <div className="text-lg font-semibold text-gray-800">Overview</div>
                <div className="mt-2">
                  <img
                    src={land.thumbnail_url || "/lands/1-ilora.jpg"}
                    alt={land.name}
                    className="w-full h-36 object-cover rounded-lg"
                  />
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  <div>
                    <strong>Location:</strong> {land.location}
                  </div>
                  <div>
                    <strong>Farm size:</strong> {land.hectares} ha
                    {farm?.area_ha ? ` (boundary: ${farm.area_ha} ha)` : ""}
                  </div>
                  <div>
                    <strong>Price per unit:</strong>{" "}
                    {currencySymbol(land.currency)}
                    {land.price_per_unit.toLocaleString()} ({land.currency})
                  </div>
                  <div>
                    <strong>Availability:</strong> {left}/{land.total_plots ?? 0} plots left
                  </div>
                </div>

                {land.features && land.features.length > 0 && (
                  <>
                    <Divider />
                    <div className="text-sm text-gray-700">
                      <strong>Features:</strong>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {land.features.slice(0, 6).map((f) => (
                        <Tag key={f} className="border-gray-200 text-gray-700 bg-gray-50 rounded-md">
                          {f}
                        </Tag>
                      ))}
                    </div>
                  </>
                )}

                <Divider />

                <div className="flex items-center justify-between gap-3">
                  <Link
                    to="/land-purchase"
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                  >
                    <ArrowLeft size={16} /> Browse other lands
                  </Link>

                  <Button
                    type="primary"
                    disabled={soldOut}
                    className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700 disabled:!bg-gray-300"
                    onClick={() => nav(`/checkout?landId=${land.id}&name=${encodeURIComponent(land.name)}&units=1&amount=${land.price_per_unit}&currency=${land.currency}`)}
                  >
                    {soldOut ? "Sold out" : <>Buy / Co-own <ArrowRight size={16} className="ml-1" /></>}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandDetails;
