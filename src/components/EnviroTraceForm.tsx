import  {  useState } from "react";
import { Button, InputNumber, DatePicker, message, Card, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { MapPin, Navigation, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const { RangePicker } = DatePicker;

// Ilora (only farm for now)
const ILORA = { id: "ilora", name: "Ilora", lat: 7.803889, lon: 3.831944 };

const panelStyle =
  "rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5 md:p-6";

export default function EnviroTraceForm() {
  const navigate = useNavigate();

  // default to Ilora selected and auto-filled
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(ILORA.id);
  const [lat, setLat] = useState<number>(ILORA.lat);
  const [lon, setLon] = useState<number>(ILORA.lon);
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(29, "day"),
    dayjs(),
  ]);

  // if you ever swap farms dynamically, keep this helper
  function onChooseFarm(farmId?: string) {
    if (!farmId) {
      setSelectedFarmId(null);
      return;
    }
    setSelectedFarmId(farmId);
    // only option for now
    setLat(ILORA.lat);
    setLon(ILORA.lon);
    message.success(`Using ${ILORA.name} coordinates`);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      message.error("Geolocation not supported on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelectedFarmId(null); // manual override clears farm selection
        setLat(Number(pos.coords.latitude.toFixed(4)));
        setLon(Number(pos.coords.longitude.toFixed(4)));
        message.success("Location set from device");
      },
      () => message.error("Could not get your location")
    );
  }

  function goToResults() {
    const start = range[0].format("YYYY-MM-DD");
    const end = range[1].format("YYYY-MM-DD");

    const q = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      start,
      end,
      ...(selectedFarmId ? { farmId: ILORA.id, farmName: ILORA.name } : {}),
    }).toString();

    navigate(`/envirotrace/results?${q}`);
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] p-5 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Card className={panelStyle}>
          <div className="text-2xl font-semibold text-gray-800 mb-2">EnviroTrace</div>
          <div className="text-gray-600 mb-4">Choose the farm or enter coordinates & dates.</div>

          {/* Farm selector (single option: Ilora) */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-800 mb-2">Farm</div>
            <Select
              value={selectedFarmId ?? undefined}
              allowClear
              onChange={(v) => onChooseFarm(v)}
              placeholder="Select a farm"
              className="w-full"
              options={[{ value: ILORA.id, label: `${ILORA.name} (7°48'14"N, 3°49'55"E)` }]}
            />
          </div>

          <Button
            type="primary"
            className="mb-4 w-full h-10 !bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700"
            onClick={useCurrentLocation}
            icon={<Navigation size={16} />}
          >
            Use Current Location
          </Button>

          <div className="space-y-3">
            <label className="block text-sm text-gray-700">Latitude (-90 to 90)</label>
            <InputNumber
              className="w-full"
              min={-90}
              max={90}
              step={0.000001}
              value={lat}
              onChange={(v) => { setSelectedFarmId(null); setLat(Number(v)); }}
              prefix={<MapPin size={14} />}
            />

            <label className="block text-sm text-gray-700 mt-2">Longitude (-180 to 180)</label>
            <InputNumber
              className="w-full"
              min={-180}
              max={180}
              step={0.000001}
              value={lon}
              onChange={(v) => { setSelectedFarmId(null); setLon(Number(v)); }}
              prefix={<MapPin size={14} />}
            />

            <div className="mt-4">
              <div className="text-sm font-medium text-gray-800">Date Range</div>
              <RangePicker
                className="w-full mt-2"
                value={range}
                onChange={(vals) => {
                  if (vals && vals[0] && vals[1]) {
                    setRange([vals[0], vals[1]]);
                  }
                }}
                allowClear={false}
              />
            </div>

            <Button
              type="primary"
              className="mt-4 w-full h-10 !bg-emerald-600 !border-emerald-600 hover:!bg-emerald-700"
              onClick={goToResults}
              icon={<RefreshCw size={16} />}
            >
              View Results
            </Button>

            <div className="text-xs text-gray-500 mt-3">
              Farm selection auto-fills coordinates. Data from{" "}
              <a className="underline" href="https://open-meteo.com" target="_blank" rel="noreferrer">
                Open-Meteo
              </a>.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
