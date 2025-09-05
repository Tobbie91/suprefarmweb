import axios from 'axios';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// export const fetchWeather = async (latitude: number, longitude: number) => {
//   try {
//     const timezone = encodeURIComponent('Africa/Lagos');
//     const dailyParams = 'precipitation_sum,temperature_2m_max,temperature_2m_min';

//     const url = `${BASE_URL}?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=${dailyParams}&timezone=${timezone}`;

//     console.log('Requesting weather data from:', url); // Log the URL

//     const response = await axios.get(url);
//     console.log('Weather data fetched successfully:', response.data);

//     return response.data;
//   } catch (error) {
//     console.error('Error fetching weather data:', error);
//     throw new Error('Failed to fetch weather data');
//   }
// };
// keep BASE_URL = 'https://api.open-meteo.com/v1/forecast'
export const fetchWeather = async (lat: number, lon: number) => {
    const tz = encodeURIComponent('Africa/Lagos');
  
    const hourly = [
      'temperature_2m',
      'precipitation',
      'wind_speed_10m',
      // soil variables (ICON-style names)
      'soil_moisture_0_to_1cm',
      'soil_temperature_0cm'
    ].join(',');
  
    const daily = [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum'
    ].join(',');
  
    // (Optional) Also request “current” variables so you don’t need to map for temp/wind:
    const current = [
      'temperature_2m','wind_speed_10m','weather_code','is_day'
    ].join(',');
  
    const url = `${BASE_URL}?latitude=${lat}&longitude=${lon}` +
                `&hourly=${hourly}&daily=${daily}&current=${current}&timezone=${tz}`;
  
    const { data } = await axios.get(url);
    return data;
  };





