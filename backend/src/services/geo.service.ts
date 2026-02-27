// Geocoding service layer for Trao Weather App backend.
// Resolves city names to latitude/longitude using OpenWeatherMap Geocoding API.
// Code written by Arpit Singh.
import axios from "axios";

const getApiConfig = () => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const baseUrl = process.env.OPENWEATHER_GEO_BASE_URL || "http://api.openweathermap.org";

  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is not defined in environment variables");
  }

  return { apiKey, baseUrl };
};

export interface ResolvedLocation {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

// Resolve a city name (with optional country code) to a list of possible locations.
export const resolveCity = async (name: string, countryCode?: string): Promise<ResolvedLocation[]> => {
  const { apiKey, baseUrl } = getApiConfig();

  const q = countryCode ? `${name},${countryCode}` : name;

  const url = `${baseUrl}/geo/1.0/direct`;

  const response = await axios.get(url, {
    params: {
      q,
      limit: 5,
      appid: apiKey,
    },
  });

  const data = response.data as any[];

  return data.map((item) => ({
    name: item.name,
    country: item.country,
    lat: item.lat,
    lon: item.lon,
  }));
};

// Returns only locations whose name matches the provided city name exactly (case-insensitive).
export const resolveExactCity = async (name: string, countryCode?: string): Promise<ResolvedLocation[]> => {
  const raw = await resolveCity(name, countryCode);
  const target = name.trim().toLowerCase();

  return raw.filter((item) => item.name && item.name.trim().toLowerCase() === target);
};
