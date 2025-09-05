// src/components/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Card, Alert, Spin } from 'antd';
import { fetchWeather } from '../services/weatherService';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title);

// Helper: find nearest index in hourly.times to current time
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

  useEffect(() => {
    const getWeather = async () => {
      try {
        // Lagos
        const data = await fetchWeather(6.5244, 3.3792);
        setWeatherData(data);
      } catch {
        setError('Failed to fetch weather data');
      }
    };
    getWeather();
  }, []);

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!weatherData) return <div className="p-6"><Spin size="large" tip="Loading weather data..." /></div>;

  // Support both shapes:
  // - Newer: data.current.{temperature_2m, wind_speed_10m, weather_code, time}
  // - Older: data.current_weather.{temperature, windspeed, weathercode, time}
  const current = weatherData.current ?? weatherData.current_weather ?? {};
  const hourly = weatherData.hourly ?? {};
  const daily = weatherData.daily ?? {};

  // Resolve common fields safely
  const currentTime: string | undefined = current.time;
  const temperature =
    current.temperature_2m ?? current.temperature ?? '—';
  const windspeed =
    current.wind_speed_10m ?? current.windspeed ?? '—';
  const weathercode =
    current.weather_code ?? current.weathercode ?? 0;

  // Soil from HOURLY (Open-Meteo does not include soil in current_weather)
  // Find the hourly record nearest to current.time (e.g., 09:15 -> 09:00)
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

  // Daily series (safe reads)
  const labels: string[] = daily.time ?? [];
  const maxTemps: number[] = daily.temperature_2m_max ?? [];
  const minTemps: number[] = daily.temperature_2m_min ?? [];
  const precip: number[] = daily.precipitation_sum ?? [];
  const todayPrecip = precip[0] ?? 0;

  // Simple flood risk heuristic
  const isFloodRisk = todayPrecip >= 50 && (soilMoisture ?? 0) > 0.5;

  // Chart config (compact)
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
              // Open-Meteo icon (fallback hidden if 404)
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
          <div className="h-56 w-full">
            <Line data={tempData} options={tempOptions} />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-semibold">Today’s precipitation:</span> {todayPrecip} mm
          </div>
        </Card>

        {/* Farm details (placeholder) */}
        <Card className="shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800">Your Farm</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-gray-800">
            <div><span className="font-semibold">Location:</span> Ilora</div>
            <div><span className="font-semibold">Land Size:</span> 10 Hectares</div>
            <div><span className="font-semibold">Status:</span> Purchased</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;



