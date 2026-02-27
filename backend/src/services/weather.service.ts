// Weather service layer for Trao Weather App backend.
// Fetches current weather data for a city using OpenWeatherMap API.
// Code written by Arpit Singh.
import axios from "axios";
import { ICity } from "../models/city.model";

export interface WeatherData {
  cityName: string;
  country?: string;
  temperature: number; // Celsius
  description: string;
  icon: string; // openweather icon code
}

const getApiConfig = () => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const baseUrl = process.env.OPENWEATHER_API_BASE_URL || "https://api.openweathermap.org/data/2.5";

  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is not defined in environment variables");
  }

  return { apiKey, baseUrl };
};

// Fetch current weather for a given city document and return a simplified WeatherData object.
export const fetchWeatherForCity = async (city: ICity): Promise<WeatherData> => {
  const { apiKey, baseUrl } = getApiConfig();

  const q = city.country ? `${city.name},${city.country}` : city.name;

  const url = `${baseUrl}/weather`;

  const response = await axios.get(url, {
    params: {
      q,
      units: "metric",
      appid: apiKey,
    },
  });

  const data = response.data as any;

  return {
    cityName: data.name,
    country: data.sys?.country,
    temperature: data.main?.temp,
    description: data.weather?.[0]?.description ?? "",
    icon: data.weather?.[0]?.icon ?? "",
  };
};
