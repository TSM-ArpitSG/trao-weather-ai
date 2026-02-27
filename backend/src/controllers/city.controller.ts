// Controller for city management in the Trao Weather App backend.
// Handles CRUD operations on a user's saved cities and fetching their weather.
// Code written by Arpit Singh.

import { Request, Response } from "express";
import { Types } from "mongoose";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
  createCityForUser,
  deleteCityForUser,
  findCityByIdForUser,
  listCitiesForUser,
  updateCityFavoriteForUser,
} from "../repositories/city.repository";
import { fetchWeatherForCity } from "../services/weather.service";
import { resolveCity, resolveExactCity } from "../services/geo.service";

// Suggest cities based on the provided name and country.
export const suggestCities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const name = (req.query.name as string | undefined)?.trim();
    const country = (req.query.country as string | undefined)?.trim().toUpperCase() || undefined;

    if (!name) {
      return res.status(400).json({ message: "Query parameter 'name' is required" });
    }

    // Only suggest exact city-name matches, driven by the literal name the user typed.
    const exactMatches = await resolveExactCity(name, country);

    const filtered = country
      ? exactMatches.filter((m) => m.country?.toUpperCase() === country)
      : exactMatches;

    return res.json(
      filtered.map((m) => ({
        name: m.name,
        country: m.country,
      }))
    );
  } catch (err) {
    console.error("Error in suggestCities", err);
    return res.status(500).json({ message: "Failed to fetch city suggestions" });
  }
};

// List all cities saved by the user.
export const listCities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const cities = await listCitiesForUser(req.user.id);

    return res.json(
      cities.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        country: c.country,
        isFavorite: c.isFavorite,
      }))
    );
  } catch (err) {
    console.error("Error in listCities", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new city for the user.
export const createCity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, country } = req.body as { name?: string; country?: string };

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "City name is required" });
    }

    const normalizedName = name.trim();
    const normalizedCountry = country && country.trim() ? country.trim().toUpperCase() : undefined;

    if (normalizedCountry && !/^[A-Za-z]{2}$/.test(normalizedCountry)) {
      return res.status(400).json({ message: "Country code must be a valid 2-letter ISO code" });
    }

    try {
      // Use OpenWeather geo API but only consider exact city-name matches.
      const exactMatches = await resolveExactCity(normalizedName, normalizedCountry);

      if (normalizedCountry) {
        const inCountry = exactMatches.filter((m) => m.country?.toUpperCase() === normalizedCountry);

        if (inCountry.length === 0) {
          return res
            .status(400)
            .json({ message: "We couldn't find that city in the specified country. Please check the name and country code." });
        }

        const best = inCountry[0]!;

        const payload: { userId: string; name: string; nameNormalized: string; country?: string } = {
          userId: req.user.id,
          name: best.name,
          nameNormalized: best.name.toLowerCase(),
          country: best.country?.toUpperCase(),
        };

        // Validate that OpenWeather can actually return weather for this city
        try {
          await fetchWeatherForCity({
            _id: new Types.ObjectId(),
            userId: new Types.ObjectId(payload.userId),
            name: payload.name,
            nameNormalized: payload.nameNormalized,
            country: payload.country,
            apiCityId: undefined,
            isFavorite: false,
          } as any);
        } catch (err: any) {
          const status = err?.response?.status;
          const code = err?.response?.data?.cod;

          if (status === 404 || code === 404 || err?.response?.data?.message === "city not found") {
            return res.status(400).json({ message: "We couldn't load weather for this city. It may not exist or be supported." });
          }
        }

        const city = await createCityForUser(payload);

        return res.status(201).json({
          id: city._id.toString(),
          name: city.name,
          country: city.country,
          isFavorite: city.isFavorite,
        });
      }

      // No country code supplied: ensure the literal city name exists and is unambiguous.
      if (exactMatches.length === 0) {
        return res.status(400).json({ message: "We couldn't find that city. Please check the spelling." });
      }

      const distinctCountries = Array.from(
        new Set(exactMatches.map((m) => m.country?.toUpperCase()).filter(Boolean))
      );

      if (distinctCountries.length > 1) {
        return res
          .status(400)
          .json({ message: "This city exists in multiple countries. Please provide a country code." });
      }

      const best = exactMatches[0]!;

      const payload: { userId: string; name: string; nameNormalized: string; country?: string } = {
        userId: req.user.id,
        name: best.name,
        nameNormalized: best.name.toLowerCase(),
      };

      if (best.country) {
        payload.country = best.country.toUpperCase();
      }

      // Validate that OpenWeather can actually return weather for this city
      try {
        await fetchWeatherForCity({
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(payload.userId),
          name: payload.name,
          nameNormalized: payload.nameNormalized,
          country: payload.country,
          apiCityId: undefined,
          isFavorite: false,
        } as any);
      } catch (err: any) {
        const status = err?.response?.status;
        const code = err?.response?.data?.cod;

        if (status === 404 || code === 404 || err?.response?.data?.message === "city not found") {
          return res.status(400).json({ message: "We couldn't load weather for this city. It may not exist or be supported." });
        }
      }

      const city = await createCityForUser(payload);

      return res.status(201).json({
        id: city._id.toString(),
        name: city.name,
        country: city.country,
        isFavorite: city.isFavorite,
      });
    } catch (err) {
      // Likely duplicate
      console.error("Error creating city", err);
      return res.status(400).json({ message: "City already exists in your list" });
    }
  } catch (err) {
    console.error("Error in createCity", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a city from the user's list.
export const deleteCity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params as { id: string };

    await deleteCityForUser(id, req.user.id);

    return res.status(204).send();
  } catch (err) {
    console.error("Error in deleteCity", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Toggle the favorite status of a city.
export const toggleFavorite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params as { id: string };
    const { isFavorite } = req.body as { isFavorite?: boolean };

    const city = await updateCityFavoriteForUser(id, req.user.id, !!isFavorite);

    if (!city) {
      return res.status(404).json({ message: "City not found" });
    }

    return res.json({
      id: city._id.toString(),
      name: city.name,
      country: city.country,
      isFavorite: city.isFavorite,
    });
  } catch (err) {
    console.error("Error in toggleFavorite", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get the weather for a specific city.
export const getCityWeather = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params as { id: string };

    const city = await findCityByIdForUser(id, req.user.id);

    if (!city) {
      return res.status(404).json({ message: "City not found" });
    }

    try {
      const weather = await fetchWeatherForCity(city);
      return res.json(weather);
    } catch (err: any) {
      console.error("Error fetching weather", err);

      // Provide more specific feedback when OpenWeather can't find the city
      const status = err?.response?.status;
      const code = err?.response?.data?.cod;

      if (status === 404 || code === 404) {
        return res.status(404).json({ message: "Weather data not found for this city. Please check the name and country code." });
      }

      return res.status(502).json({ message: "Failed to fetch weather data from provider" });
    }
  } catch (err) {
    console.error("Error in getCityWeather", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
