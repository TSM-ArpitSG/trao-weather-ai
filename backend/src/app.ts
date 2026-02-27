// Express app setup and route definitions for Trao Weather App backend.
// Configures middleware, CORS, and mounts auth/city/AI endpoints.
// Code written by Arpit Singh.
import express, { Request, Response } from "express";
import cors from "cors";
import { register, login } from "./controllers/auth.controller";
import { authMiddleware, AuthenticatedRequest } from "./middleware/auth.middleware";
import { listCities, createCity, deleteCity, toggleFavorite, getCityWeather, suggestCities } from "./controllers/city.controller";
import { getInsights } from "./controllers/ai.controller";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Auth routes
app.post("/auth/register", register);
app.post("/auth/login", login);

// Protected user info route (example)
app.get("/me", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return res.json({ userId: req.user.id });
});

// City & weather routes (protected)
app.get("/cities", authMiddleware, listCities);
app.post("/cities", authMiddleware, createCity);
app.get("/cities/suggest", authMiddleware, suggestCities);
app.delete("/cities/:id", authMiddleware, deleteCity);
app.patch("/cities/:id/favorite", authMiddleware, toggleFavorite);
app.get("/cities/:id/weather", authMiddleware, getCityWeather);

// AI insights route (protected)
app.post("/ai/insights", authMiddleware, getInsights);

export default app;

