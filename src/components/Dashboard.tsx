// src/pages/EnviroTraceResults.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card, Tabs, Alert, Spin, Table, Input, Button, Modal, InputNumber,
} from "antd";
import type { TabsProps } from "antd";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { fetchOpenMeteo, MeteoResponse } from "../services/openMeteo";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title);
const { Search } = Input;

// --- helpers ---
function dateOnly(iso: string) { return iso.slice(0, 10); }
function circularMeanDeg(values: number[]) {
  if (!values.length) return NaN;
  const toRad = (d: number) => (d * Math.PI) / 180;
  let sx = 0, sy = 0;
  for (const d of values) { sx += Math.cos(toRad(d)); sy += Math.sin(toRad(d)); }
  const ang = Math.atan2(sy, sx);
  let deg = (ang * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return Math.round(deg);
}

// --- co-ownership config ---
const FARM_ID = "supre";
const FARM_NAME = "Supre Farm";
const CURRENCY = "NGN";
const CURRENCY_SYMBOL = "₦";
const PRICE_PER_UNIT = 50000;

export default function EnviroTraceResults() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const start = params.get("start") || "";
  const end = params.get("end") || "";

  const [data, setData] = useState<MeteoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // table state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // co-own modal state (kept if you switch back to modal flow)
  const [buyOpen, setBuyOpen] = useState(false);
  const [units, setUnits] = useState<number>(1);
  const totalAmount = Math.max(1, units || 1) * PRICE_PER_UNIT;

  const valid = Number.isFinite(lat) && Number.isFinite(lon) && !!start && !!end;

  // fetch effect (top-level; guard inside)
  useEffect(() => {
    if (!valid) return;
    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const res = await fetchOpenMeteo(lat, lon, start, end);
        setData(res);
        setPage(1);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    })();
  }, [lat, lon, start, end, valid]);

  // derive safely at top-level
  const hourly = data?.hourly;
  const daily = data?.daily;

  // ✅ stabilize hourlyTime for hook deps
  const hourlyTimeRef = hourly?.time;
  const hourlyTime = useMemo(() => hourlyTimeRef ?? [], [hourlyTimeRef]);

  // DAILY rows for table
  type Row = {
    key: string; date: string; temp_c: number | null; precip_mm: number | null;
    humidity_percent: number | null; wind_speed_kmh: number | null; wind_direction_deg: number | null;
  };

  const dailyRows = useMemo<Row[]>(() => {
    if (!daily) return [];
    const rows: Row[] = [];
    const days = daily.time ?? [];
    const hourlyByDay: Record<string, { hum: number[]; wdir: number[] }> = {};

    (hourly?.relative_humidity_2m ?? []).forEach((v, i) => {
      const d = dateOnly(hourlyTime[i]);
      (hourlyByDay[d] ||= { hum: [], wdir: [] }).hum.push(v as number);
    });
    (hourly?.wind_direction_10m ?? []).forEach((v, i) => {
      const d = dateOnly(hourlyTime[i]);
      (hourlyByDay[d] ||= { hum: [], wdir: [] }).wdir.push(v as number);
    });

    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      const tMax = daily.temperature_2m_max?.[i];
      const tMin = daily.temperature_2m_min?.[i];
      const pSum = daily.precipitation_sum?.[i];
      const wMax = daily.wind_speed_10m_max?.[i];

      const hums = hourlyByDay[d]?.hum ?? [];
      const wdirs = hourlyByDay[d]?.wdir ?? [];

      rows.push({
        key: d,
        date: d,
        temp_c: tMax != null && tMin != null ? Number(((tMax + tMin) / 2).toFixed(1)) : null,
        precip_mm: pSum != null ? Number(pSum.toFixed(1)) : null,
        humidity_percent: hums.length ? Math.round(hums.reduce((a,b)=>a+b,0)/hums.length) : null,
        wind_speed_kmh: wMax != null ? Math.round(wMax * 3.6) : null,
        wind_direction_deg: wdirs.length ? circularMeanDeg(wdirs) : null,
      });
    }
    return rows;
  }, [daily, hourly, hourlyTime]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return dailyRows;
    const s = search.trim().toLowerCase();
    return dailyRows.filter(r =>
      r.date.toLowerCase().includes(s) ||
      String(r.temp_c ?? "").includes(s) ||
      String(r.precip_mm ?? "").includes(s) ||
      String(r.humidity_percent ?? "").includes(s) ||
      String(r.wind_speed_kmh ?? "").includes(s) ||
      String(r.wind_direction_deg ?? "").includes(s)
    );
  }, [search, dailyRows]);

  const columns = [
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Temperature_°C", dataIndex: "temp_c", key: "temp_c", render: (v: number | null) => v ?? "—" },
    { title: "Precipitation_mm", dataIndex: "precip_mm", key: "precip_mm", render: (v: number | null) => v ?? "—" },
    { title: "Humidity_percent", dataIndex: "humidity_percent", key: "humidity_percent", render: (v: number | null) => v ?? "—" },
    { title: "Wind_Speed_kmh", dataIndex: "wind_speed_kmh", key: "wind_speed_kmh", render: (v: number | null) => v ?? "—" },
    { title: "Wind_Direction_deg", dataIndex: "wind_direction_deg", key: "wind_direction_deg", render: (v: number | null) => v ?? "—" },
  ];

  // Temperature tab uses daily average temp
  const labels = daily?.time ?? [];
  const avgTemps = daily?.temperature_2m_max?.map((mx, i) => {
    const mn = daily?.temperature_2m_min?.[i] ?? mx;
    return Number((( (mx ?? 0) + (mn ?? 0)) / 2).toFixed(1));
  }) ?? [];

  const tempDailySeries = {
    labels,
    datasets: [{
      label: "Daily Average Temperature (°C)",
      data: avgTemps,
      borderWidth: 2,
      fill: false,
      tension: 0.3,
      borderColor: "rgb(53, 162, 235)",
      pointRadius: 3,
    }],
  };
  const tempDailyOptions = {
    responsive: true,
    maintainAspectRatio: false as const,
    plugins: { legend: { position: "top" as const }, title: { display: true, text: "Daily Average Temperature" } },
    scales: { x: { title: { display: true, text: "Date" } }, y: { title: { display: true, text: "°C" } } },
  };

  function hourlySeries(key: keyof NonNullable<MeteoResponse["hourly"]>, label: string, unit: string) {
    const series = (hourly?.[key] ?? []) as number[];
    return {
      data: {
        labels: hourlyTime,
        datasets: [{
          label: `${label} (${unit})`,
          data: series,
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          backgroundColor: "rgba(99,132,255,0.15)",
          borderColor: "rgb(99,132,255)",
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false as const,
        interaction: { mode: "index" as const, intersect: false },
        plugins: { legend: { position: "top" as const } },
        scales: { x: { title: { display: true, text: "Time (local)" }, ticks: { maxTicksLimit: 12 } }, y: { title: { display: true, text: unit } } },
      },
    };
  }

  const tabs: TabsProps["items"] = [
    { key: "temp", label: "Temperature", children: <div className="h-[380px]"><Line data={tempDailySeries} options={tempDailyOptions} /></div> },
    { key: "precip", label: "Precipitation", children: <div className="h-[380px]"><Line {...hourlySeries("precipitation", "Precipitation", "mm")} /></div> },
    { key: "humidity", label: "Humidity", children: <div className="h-[380px]"><Line {...hourlySeries("relative_humidity_2m", "Humidity", "%")} /></div> },
    { key: "windSpeed", label: "Wind Speed", children: <div className="h-[380px]"><Line {...hourlySeries("wind_speed_10m", "Wind Speed", "m/s")} /></div> },
    { key: "windDir", label: "Wind Direction", children: <div className="h-[380px]"><Line {...hourlySeries("wind_direction_10m", "Wind Direction", "°")} /></div> },
  ];

  // Proceed to payment handler (kept for modal flow)
  function handleProceedToPayment() {
    const payload = {
      farmId: FARM_ID,
      farmName: FARM_NAME,
      units: Math.max(1, units || 1),
      pricePerUnit: PRICE_PER_UNIT,
      amount: totalAmount,
      currency: CURRENCY,
      currencySymbol: CURRENCY_SYMBOL,
    };
    localStorage.setItem("checkout:intent", JSON.stringify(payload));
    navigate(`/checkout?farmId=${FARM_ID}&units=${payload.units}&amount=${payload.amount}`);
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] p-5 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold text-gray-800">EnviroTrace — Results</div>
            <div className="text-gray-600 text-sm">Lat {lat}, Lon {lon} | {start} → {end}</div>
          </div>
          <Link
            to="/envirotrace"
            className="inline-flex items-center rounded-md px-3 py-2 text-sm border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
          >
            ← Back to Filters
          </Link>
        </div>

        {/* ✅ No early return — show alert inline if invalid */}
        {!valid ? (
          <Alert
            type="warning"
            message="Missing parameters"
            description={
              <span>
                Latitude, longitude or date range is missing. Go to{" "}
                <Link className="underline" to="/envirotrace">Filters page</Link>.
              </span>
            }
            showIcon
          />
        ) : (
          <Card className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5 md:p-6">
            {err && <Alert className="mb-4" type="error" message="Error" description={err} showIcon />}

            {loading && (
              <div className="h-[300px] grid place-items-center">
                <Spin size="large" tip="Loading..." />
              </div>
            )}

            {!loading && data && (
              <>
                {/* Header row: Results + Search + CTA */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
                  <div className="text-base md:text-lg font-semibold">Results</div>

                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                      <span className="text-sm text-gray-600">Search:</span>
                      <Search
                        allowClear
                        placeholder="Filter results"
                        onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                        style={{ width: 220 }}
                      />
                    </div>

                    {/* CTA: go to Land Purchase */}
                    <Button
                      type="primary"
                      className="!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700"
                      onClick={() => {
                        const qs = new URLSearchParams({
                          farmId: FARM_ID,
                          lat: String(lat),
                          lon: String(lon),
                          start,
                          end,
                        }).toString();
                        navigate(`/land-purchase?${qs}`);
                      }}
                    >
                      Become Co-Owner
                    </Button>
                  </div>
                </div>

                {/* Search for small screens */}
                <div className="sm:hidden mb-3">
                  <Search
                    allowClear
                    placeholder="Filter results"
                    onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                  />
                </div>

                {/* Table */}
                <Table
                  size="small"
                  columns={columns}
                  dataSource={filteredRows}
                  pagination={{
                    current: page,
                    pageSize: 10,
                    onChange: (p) => setPage(p),
                    showSizeChanger: false,
                    showTotal: (total, [startIdx, endIdx]) =>
                      `Showing ${startIdx} to ${endIdx} of ${total} entries`,
                  }}
                  bordered
                />

                {/* Tabs & charts */}
                <div className="mt-6">
                  <Tabs defaultActiveKey="temp" items={tabs} animated destroyInactiveTabPane={false} />
                </div>
              </>
            )}
          </Card>
        )}
      </div>

      {/* (Optional) Modal flow kept ready if you switch back */}
      <Modal
        open={buyOpen}
        onCancel={() => setBuyOpen(false)}
        title={`Become a Co-Owner — ${FARM_NAME}`}
        okText="Proceed to Payment"
        onOk={handleProceedToPayment}
        okButtonProps={{ className: "!bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700" }}
      >
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            Price per unit: <strong>{CURRENCY_SYMBOL}{PRICE_PER_UNIT.toLocaleString()}</strong>
          </div>
          <div>
            <div className="text-sm text-gray-700 mb-1">Units</div>
            <InputNumber min={1} value={units} onChange={(v) => setUnits(Number(v))} />
          </div>
          <div className="text-base">
            Total: <strong>{CURRENCY_SYMBOL}{totalAmount.toLocaleString()}</strong> {CURRENCY}
          </div>
          <div className="text-xs text-gray-500">
            You’ll be redirected to checkout to complete payment securely.
          </div>
        </div>
      </Modal>
    </div>
  );
}
