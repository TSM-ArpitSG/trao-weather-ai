// Controller for AI-related endpoints in the Trao Weather App backend.
// Exposes a handler that asks the AI service for insights based on the
// current user's saved cities and a natural language question.
// Code written by Arpit Singh.

import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { listCitiesForUser } from "../repositories/city.repository";
import { fetchWeatherForCity } from "../services/weather.service";
import { getAiInsight } from "../services/ai.service";

export const getInsights = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { question } = req.body as { question?: string };

  if (!question || !question.trim()) {
    return res.status(400).json({ message: "Question is required" });
  }

  try {
    const cities = await listCitiesForUser(req.user.id);

    if (!cities || cities.length === 0) {
      return res.status(400).json({ message: "You don't have any cities yet. Add some cities first." });
    }

    const lines: string[] = [];

    for (const city of cities) {
      try {
        const weather = await fetchWeatherForCity(city);
        lines.push(
          `City: ${weather.cityName}${weather.country ? ` (${weather.country})` : ""} | ${weather.temperature.toFixed(
            1
          )}°C, ${weather.description}`
        );
      } catch (_) {
        // Skip cities where weather couldn't be loaded
      }
    }

    const weatherSummary = lines.join("\n");

    // Delegate to the AI service, which talks to the external Gemini API.
    const aiResult = await getAiInsight({ question: question.trim(), weatherSummary });

    return res.json({ answer: aiResult.answer, usedFallback: aiResult.usedFallback });
  } catch (err) {
    console.error("[getInsights] error", err);
    return res.status(500).json({ message: "Failed to generate AI insights" });
  }
};
