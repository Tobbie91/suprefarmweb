// src/components/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Card, Alert, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { fetchWeather } from '../services/weatherService';
import { supabase } from '../supabase';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Sprout, MapPin, ArrowRight } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title);

type Farm = {
  id: string;
  name?: string;
  location?: string;
  hectares?: number;
  status?: string;
};

function findNearestIndex(times: string[] = [], currentISO?: string) {
  if (!currentISO || !times.length) return -1;
  const target = new Date(currentISO).getTime();
  let bestIdx = -1;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let i = 0; i < times.length; i++) {
    const t = new Date(times[i]).getTime();
    const diff = Math.abs(t - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
}

const Dashboard: React.FC = () => {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loadingFarms, setLoadingFarms] = useState(true);

  // Weather
  useEffect(() => {
    const getWeather = async () => {
      try {
        const data = await fetchWeather(6.5244, 3.3792); // Lagos
        setWeatherData(data);
      } catch {
        setError('Failed to fetch weather data');
      }
    };
    getWeather();
  }, []);

  // User farms (Supabase). Gracefully no-op if table not present.
  useEffect(() => {
    const loadFarms = async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes?.user?.id;
        if (!userId) return setFarms([]);
        const { data, error } = await supabase
          .from('farms')
          .select('id,name,location,hectares,status')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (!error && data) setFarms(data as Farm[]);
      } catch {
        // ignore; show CTA when we can't read farms
      } finally {
        setLoadingFarms(false);
      }
    };
    loadFarms();
  }, []);

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!weatherData) return <div className="p-6"><Spin size="large" tip="Loading weather data..." /></div>;

  // Support both shapes:
  const current = weatherData.current ?? weatherData.current_weather ?? {};
  const hourly = weatherData.hourly ?? {};
  const daily = weatherData.daily ?? {};

  const currentTime: string | undefined = current.time;
  const temperature = current.temperature_2m ?? current.temperature ?? '—';
  const windspeed = current.wind_speed_10m ?? current.windspeed ?? '—';
  const weathercode = current.weather_code ?? current.weathercode ?? 0;

  // Soil from hourly (nearest hour to current time)
  const idx = findNearestIndex(hourly.time, currentTime);
  const soilMoisture =
    idx >= 0
      ? (hourly.soil_moisture_0_to_1cm?.[idx] ??
         hourly.soil_moisture_0_to_10cm?.[idx] ??
         undefined)
      : undefined;
  const soilTemp =
    idx >= 0
      ? (hourly.soil_temperature_0cm?.[idx] ??
         hourly.soil_temperature_0_to_10cm?.[idx] ??
         undefined)
      : undefined;

  // Daily series
  const labels: string[] = daily.time ?? [];
  const maxTemps: number[] = daily.temperature_2m_max ?? [];
  const minTemps: number[] = daily.temperature_2m_min ?? [];
  const precip: number[] = daily.precipitation_sum ?? [];
  const todayPrecip = precip[0] ?? 0;
  const hasDaily = labels.length > 0 && maxTemps.length > 0 && minTemps.length > 0;

  // Simple flood risk heuristic
  const isFloodRisk = todayPrecip >= 50 && (soilMoisture ?? 0) > 0.5;

  // Chart
  const tempData = {
    labels,
    datasets: [
      {
        label: 'Max Temp (°C)',
        data: maxTemps,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.15)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Min Temp (°C)',
        data: minTemps,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.15)',
        fill: true,
        tension: 0.3,
      },
    ],
  };
  const tempOptions = {
    responsive: true,
    maintainAspectRatio: false as const,
    plugins: {
      legend: { display: true, position: 'top' as const },
      title: { display: false, text: '' },
    },
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: '°C' } },
    },
  };

  const hasFarm = farms.length > 0;

  return (
    <div className="bg-gradient-to-r from-green-100 to-green-300 min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-gray-800">Welcome Back</h1>
          <p className="text-gray-600 mt-1">Quick overview of your farm and local conditions</p>
        </div>

        {/* Current Weather */}
        <Card className="shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800">Current Weather</h3>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mt-4">
            <div className="text-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2">
              <p><span className="font-semibold">Temperature:</span> {typeof temperature === 'number' ? `${temperature}°C` : temperature}</p>
              <p><span className="font-semibold">Wind Speed:</span> {typeof windspeed === 'number' ? `${windspeed} km/h` : windspeed}</p>
              <p>
                <span className="font-semibold">Soil Temperature:</span>{' '}
                {soilTemp != null ? `${soilTemp.toFixed(1)}°C` : 'N/A'}
              </p>
              <p>
                <span className="font-semibold">Soil Moisture:</span>{' '}
                {soilMoisture != null ? `${(soilMoisture * 100).toFixed(0)}%` : 'N/A'}
              </p>
            </div>
            <img
              src={`https://open-meteo.com/images/weather-icons/${weathercode}.png`}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              alt="weather"
              className="h-20 self-start md:self-center"
            />
          </div>
        </Card>

        {/* Flood warning */}
        {isFloodRisk && (
          <Alert
            className="shadow"
            type="warning"
            showIcon
            message="Flood Risk Warning"
            description="High rainfall and saturated topsoil detected. Consider drainage checks and field access planning."
          />
        )}

        {/* Daily forecast chart */}
        <Card className="shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">7-Day Temperature Trend</h3>
          {hasDaily ? (
            <div className="h-56 w-full">
              <Line data={tempData} options={tempOptions} />
            </div>
          ) : (
            <div className="text-gray-600 text-sm">Daily forecast unavailable.</div>
          )}
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-semibold">Today’s precipitation:</span> {todayPrecip} mm
          </div>
        </Card>

        {/* ======== Your Farm Area (CTA if none, list if purchased) ======== */}
        {!loadingFarms && !hasFarm && (
          <Card className="shadow-lg border-emerald-100">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-emerald-600/10 flex items-center justify-center">
                <Sprout className="text-emerald-700" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800">Start your first farm</h3>
                <p className="text-gray-600 mt-1">
                  You don’t own a farm yet. Browse available lands, see location, size, and projected yield, then purchase securely.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    to="/land-purchase"
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-700"
                  >
                    Explore lands <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/onboarding"
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
                  >
                    Complete profile
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700">
                  <div className="flex items-center gap-2"><MapPin size={16} className="text-emerald-700" /> Verified locations</div>
                  <div className="flex items-center gap-2"><Sprout size={16} className="text-emerald-700" /> Agronomy insights</div>
                  <div className="flex items-center gap-2">Secure purchase & ownership</div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {hasFarm && (
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-gray-800">Your Farms</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {farms.map((f) => (
                <Card key={f.id} className="shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg font-semibold text-gray-800">{f.name ?? 'Farm'}</div>
                      <div className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                        <MapPin size={16} className="text-emerald-700" />
                        {f.location ?? '—'}
                      </div>
                      <div className="mt-2 text-sm text-gray-700">
                        <span className="font-medium">Size:</span> {f.hectares ?? '—'} ha
                      </div>
                      <div className="mt-1 text-sm text-gray-700">
                        <span className="font-medium">Status:</span> {f.status ?? 'Purchased'}
                      </div>
                    </div>
                    <Link
                      to={`/farm/${f.id}`}
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      Details <ArrowRight size={16} />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        {/* =============================================================== */}
      </div>
    </div>
  );
};

export default Dashboard;




