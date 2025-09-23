// Tiny Open-Meteo client
export type MeteoResponse = {
    timezone?: string;
    hourly?: {
      time: string[];
      temperature_2m?: number[];
      relative_humidity_2m?: number[];
      precipitation?: number[];
      wind_speed_10m?: number[];
      wind_direction_10m?: number[];
    };
    daily?: {
      time: string[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      precipitation_sum?: number[];
      wind_speed_10m_max?: number[];
    };
  };
  
  export async function fetchOpenMeteo(
    lat: number,
    lon: number,
    startISO?: string, // YYYY-MM-DD
    endISO?: string    // YYYY-MM-DD
  ): Promise<MeteoResponse> {
    // If no range is provided, fetch the last 30 days to today
    const today = new Date();
    const end = endISO ?? today.toISOString().slice(0, 10);
    const start = startISO ??
      new Date(today.getTime() - 29 * 86400_000).toISOString().slice(0, 10);
  
    const base = "https://api.open-meteo.com/v1/forecast";
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      timezone: "auto",
      start_date: start,
      end_date: end,
      hourly: [
        "temperature_2m",
        "relative_humidity_2m",
        "precipitation",
        "wind_speed_10m",
        "wind_direction_10m",
      ].join(","),
      daily: [
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "wind_speed_10m_max",
      ].join(","),
    });
  
    const res = await fetch(`${base}?${params.toString()}`);
    if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
    return (await res.json()) as MeteoResponse;
  }
  