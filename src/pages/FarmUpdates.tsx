// src/pages/FarmDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Card, Button, Tag, Alert, Skeleton } from "antd";
import {
  useParams,
  Link,
  useNavigate,
  // useSearchParams,
} from "react-router-dom";
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
  TileLayer,
  LayersControl,
  Polygon,
  CircleMarker,
  Popup,
} from "react-leaflet";
import type { LatLngExpression, LatLngTuple } from "leaflet";
import { fetchOpenMeteo, MeteoResponse } from "../services/openMeteo";
// import { supabase } from "../supabase"; // uncomment if you have it wired

type Farm = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  hectares: number;
  location?: string;
  boundary?: LatLngTuple[]; // simple polygon ring [lat, lon]
  unitsOwned?: number;
  landId?: string; // link back to land-purchase
};

type Weather = {
  currentTemp?: number;
  currentHumidity?: number;
  currentWind?: number;
  todayPrecip?: number;
};

const panel = "rounded-2xl bg-white shadow-sm ring-1 ring-black/5";
// const CURRENCY = "NGN";
// const NGN = "₦";

const sampleFarm: Farm = {
  id: "supre-001",
  name: "Supre Farm — Ilora Block A",
  lat: 7.8373,
  lon: 3.9191,
  hectares: 15,
  location: "Ilora, Oyo, Nigeria",
  unitsOwned: 3,
  landId: "1",
  // rough demo polygon near Ilora
  boundary: [
    [7.8396, 3.9168],
    [7.8387, 3.922],
    [7.8354, 3.9212],
    [7.8349, 3.9162],
  ],
};

const FARM_UPDATES_SAMPLE = [
  {
    id: 101,
    title: "Planting Day — Palm Seedlings",
    summary:
      "New rows planted with improved spacing; irrigation checks completed.",
    date: "2025-09-20",
    thumb:
      "https://images.unsplash.com/photo-1524593610308-3a35c729ef2d?q=80&w=1200&auto=format&fit=crop",
    videoUrl: "/farm_update_video_1.mp4",
  },
  {
    id: 102,
    title: "Soil Moisture Boost",
    summary: "Drip lines serviced; moisture levels back in target range.",
    date: "2025-09-17",
    thumb:
      "https://images.unsplash.com/photo-1603899122552-96244c135eff?q=80&w=1200&auto=format&fit=crop",
    videoUrl: "/farm_update_video_2.mp4",
  },
  {
    id: 103,
    title: "Weather Watch",
    summary: "Heavy rain expected in 48h. Field access routes marked.",
    date: "2025-09-15",
    thumb:
      "https://images.unsplash.com/photo-1520781359717-3eb98461c9fe?q=80&w=1200&auto=format&fit=crop",
    videoUrl: "/farm_update_video_3.mp4",
  },
];

export default function FarmDashboard() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  // const [params] = useSearchParams(); // optional carry-over context
  const [farm, setFarm] = useState<Farm | null>(null);
  const [weather, setWeather] = useState<Weather>({});
  const [loading, setLoading] = useState(true);
  const [wLoading, setWLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // const fromResults = {
  //   lat: params.get("lat") || "",
  //   lon: params.get("lon") || "",
  //   start: params.get("start") || "",
  //   end: params.get("end") || "",
  // };

  // Load farm (Supabase → fallback)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // If you have Supabase:
        // const { data, error } = await supabase.from("farms").select("*").eq("id", farmId).single();
        // if (error) throw error;
        // const f: Farm = { ...map your fields..., lat: data.lat, lon: data.lon, boundary: data.boundary_coords }
        // setFarm(f);
        // Fallback demo:
        setFarm(sampleFarm);
      } catch (e: any) {
        setErr(e?.message || "Failed to load farm");
      } finally {
        setLoading(false);
      }
    })();
  }, [farmId]);

  // Weather for the farm
  useEffect(() => {
    if (!farm) return;
    (async () => {
      try {
        setWLoading(true);
        const end = dayjs().format("YYYY-MM-DD");
        const start = dayjs().subtract(6, "day").format("YYYY-MM-DD");
        const res = await fetchOpenMeteo(farm.lat, farm.lon, start, end);
        const hourly: Partial<NonNullable<MeteoResponse["hourly"]>> = res.hourly ?? {};
        const nowT = hourly.temperature_2m?.at(-1);
        const nowH = hourly.relative_humidity_2m?.at(-1);
        const nowW = hourly.wind_speed_10m?.at(-1);
        const todayIdx = 0;
        const todayPrecip = res.daily?.precipitation_sum?.[todayIdx];

        setWeather({
          currentTemp: nowT,
          currentHumidity: nowH,
          currentWind: nowW,
          todayPrecip,
        });
      } catch (e) {
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
                {farm?.name || "My Farm"}
              </div>
              <div className="text-gray-600 text-sm flex items-center gap-2">
                <MapPin size={14} className="text-emerald-700" />
                {farm?.location}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
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

        {/* Grid: Map + Right column */}
        <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
          {/* Map & weather */}
          <Card className={panel}>
            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <MapIcon size={18} /> Aerial View
                </div>
                <Tag
                  color="green"
                  className="rounded-full px-3 py-1 text-[11px]"
                >
                  {farm?.hectares} ha
                </Tag>
              </div>

              {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : farm ? (
                <div className="rounded-xl overflow-hidden ring-1 ring-black/5">
                  <MapContainer
                    center={[farm.lat, farm.lon] as LatLngExpression}
                    zoom={16}
                    className="h-[360px] w-full"
                  >
                    <LayersControl position="topright">
                      <LayersControl.BaseLayer checked name="Satellite">
                        <TileLayer
                          // Esri World Imagery
                          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                          attribution="&copy; Esri"
                        />
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="Streets">
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution="&copy; OpenStreetMap contributors"
                        />
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
                            <div>{farm.location}</div>
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
                    Land size: {farm?.hectares} ha • {farm?.location}
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
                {FARM_UPDATES_SAMPLE.slice(0, 3).map((u) => (
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
