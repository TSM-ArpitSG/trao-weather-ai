// Main dashboard page for Trao Weather AI.
// Shows saved cities, favorites, live weather cards, and the floating AI chat widget.
// Code written by Arpit Singh.
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface City {
  id: string;
  name: string;
  country?: string;
  isFavorite: boolean;
}

interface WeatherData {
  cityName: string;
  country?: string;
  temperature: number;
  description: string;
  icon: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newCityName, setNewCityName] = useState("");
  const [newCityCountry, setNewCityCountry] = useState("");
  const [addingCity, setAddingCity] = useState(false);

  const [weatherByCityId, setWeatherByCityId] = useState<Record<string, WeatherData | null>>({});
  const [weatherErrorByCityId, setWeatherErrorByCityId] = useState<Record<string, string | null>>({});
  const [token, setToken] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ name: string; country: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiUsedFallback, setAiUsedFallback] = useState(false);
  const [cityViewMode, setCityViewMode] = useState<"all" | "favorites">("all");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [cityIdToDelete, setCityIdToDelete] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [showAssistantLabel, setShowAssistantLabel] = useState(true);
  const [assistantLabelDismissed, setAssistantLabelDismissed] = useState(false);

  // Clear auth information from localStorage and redirect to login
  const performLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
    router.push("/login");
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmDeleteCity = (id: string) => {
    setCityIdToDelete(id);
  };

  // Call backend AI endpoint to get insights based on saved cities
  const handleAskAi = async () => {
    if (!token) return;
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    setAiError(null);
    setAiAnswer(null);
    setAiUsedFallback(false);

    try {
      const data = await apiFetch<{ answer: string; usedFallback: boolean }>(
        "/ai/insights",
        {
          method: "POST",
          body: JSON.stringify({ question: aiQuestion.trim() }),
        },
        token
      );

      setAiAnswer(data.answer);
      setAiUsedFallback(data.usedFallback);
    } catch (err) {
      if (err instanceof Error) {
        setAiError(err.message);
      } else {
        setAiError("Failed to get AI insights");
      }
    } finally {
      setAiLoading(false);
    }
  };

  // Initialize token from localStorage and redirect unauthenticated users
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedToken = localStorage.getItem("auth_token");
    if (!storedToken) {
      router.push("/login");
      setLoading(false);
      return;
    }

    setToken(storedToken);
  }, [router]);

  // Load user's saved cities once a valid token is available
  useEffect(() => {
    const load = async () => {
      if (!token) return;

      try {
        const data = await apiFetch<City[]>("/cities", { method: "GET" }, token);
        setCities(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load cities");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  useEffect(() => {
    if (chatOpen) {
      setShowAssistantLabel(false);
    } else if (!assistantLabelDismissed) {
      setShowAssistantLabel(true);
    }
  }, [chatOpen, assistantLabelDismissed]);

  // Fetch city suggestions from backend as user types a city name
  useEffect(() => {
    if (!token) return;
    const query = newCityName.trim();
    if (!query) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();

    const fetchSuggestions = async () => {
      try {
        const params = new URLSearchParams({ name: query });
        const data = await apiFetch<{ name: string; country: string }[]>(
          `/cities/suggest?${params.toString()}`,
          {
            method: "GET",
            signal: controller.signal,
          },
          token
        );
        setSuggestions(data);
      } catch {
        // best-effort only
        setSuggestions([]);
      }
    };

    fetchSuggestions();

    return () => controller.abort();
  }, [newCityName, token]);

  // Load weather for a specific city card
  const loadWeatherForCity = async (cityId: string) => {
    if (!token) return;

    setWeatherErrorByCityId((prev) => ({ ...prev, [cityId]: null }));

    try {
      const data = await apiFetch<WeatherData>(`/cities/${cityId}/weather`, { method: "GET" }, token);
      setWeatherByCityId((prev) => ({ ...prev, [cityId]: data }));
    } catch (err) {
      if (err instanceof Error) {
        setWeatherErrorByCityId((prev) => ({ ...prev, [cityId]: err.message }));
      } else {
        setWeatherErrorByCityId((prev) => ({ ...prev, [cityId]: "Failed to load weather" }));
      }
    }
  };

  const handleAddCity = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!newCityName.trim()) return;

    setAddingCity(true);
    setError(null);

    try {
      const body: { name: string; country?: string } = { name: newCityName.trim() };
      if (newCityCountry.trim()) {
        body.country = newCityCountry.trim();
      }

      const city = await apiFetch<City>("/cities", {
        method: "POST",
        body: JSON.stringify(body),
      }, token);

      setCities((prev) => [city, ...prev]);
      setNewCityName("");
      setNewCityCountry("");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to add city");
      }
    } finally {
      setAddingCity(false);
    }
  };

  const handleDeleteCity = async (cityId: string) => {
    if (!token) return;

    try {
      await apiFetch<void>(`/cities/${cityId}`, { method: "DELETE" }, token);
      setCities((prev) => prev.filter((c) => c.id !== cityId));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete city");
      }
    }
  };

  const handleToggleFavorite = async (city: City) => {
    if (!token) return;

    try {
      const updated = await apiFetch<City>(`/cities/${city.id}/favorite`, {
        method: "PATCH",
        body: JSON.stringify({ isFavorite: !city.isFavorite }),
      }, token);

      setCities((prev) => prev.map((c) => (c.id === city.id ? updated : c)));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update favorite");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50 px-4 py-6">
      <div className="relative max-w-5xl mx-auto space-y-6 pb-10">
        <header className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-4 sm:px-6 sm:py-5 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -top-16 left-10 h-24 w-24 rounded-full bg-cyan-500/25 blur-3xl" />
            <div className="absolute bottom-[-3rem] right-[-2rem] h-28 w-28 rounded-full bg-purple-500/25 blur-3xl" />
          </div>

          <div className="relative flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => router.refresh()}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-[11px] font-medium text-cyan-200 shadow-sm shadow-cyan-500/30 transition-transform hover:-translate-y-0.5 hover:border-cyan-300/70 hover:bg-cyan-500/20"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Trao Weather AI · Personal weather hub
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight leading-snug">
                  <span className="text-slate-50">Weather dashboard for your</span>{" "}
                  <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                    favorite cities
                  </span>
                  .
                </h1>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
                  Track live weather, mark favorites, and ask AI for smart insights on where and when to go.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              {token ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900/80 px-3 py-1.5 text-[11px] font-medium text-slate-50 border border-slate-600/70 shadow-sm shadow-slate-900/60 transition-transform transition-shadow hover:-translate-y-0.5 hover:border-red-400/60 hover:text-red-100 hover:shadow-red-500/30"
                >
                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-red-400" />
                  Logout
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900/80 px-3 py-1.5 text-[11px] font-medium text-slate-50 border border-slate-600/70 shadow-sm shadow-slate-900/60 transition-transform transition-shadow hover:-translate-y-0.5 hover:border-sky-400/60 hover:text-sky-100 hover:shadow-sky-500/30"
                >
                  Login
                </button>
              )}
            </div>
          </div>

          <div className="relative mt-3 h-px w-full overflow-hidden rounded-full bg-slate-800/70">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-cyan-300 to-emerald-400 opacity-70" />
          </div>
        </header>

        <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-4 shadow-[0_10px_40px_rgba(15,23,42,0.8)] transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-medium text-slate-200">Add a city</h2>
            <p className="text-[11px] text-slate-500">Cities are saved to your account only.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <input
                  type="text"
                  placeholder="City name (e.g. London)"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
                <div className="relative w-full sm:w-56 md:w-64">
                  <input
                    type="text"
                    placeholder="Country code (optional, e.g. GB)"
                    value={newCityCountry}
                    onChange={(e) => setNewCityCountry(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-700 bg-slate-900 text-xs shadow-lg">
                      {suggestions.map((s, idx) => (
                        <button
                          key={`${s.name}-${s.country}-${idx}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setNewCityCountry(s.country);
                            setShowSuggestions(false);
                          }}
                          className="flex w-full items-center justify-between px-2 py-1 text-left hover:bg-slate-800"
                        >
                          <span className="font-medium">{s.country}</span>
                          <span className="text-slate-400">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {!showSuggestions && suggestions.length > 0 && !newCityCountry.trim() && (
                    <p className="mt-1 text-[11px] text-slate-500">Suggested country: {suggestions[0].country}</p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={addingCity}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-sky-500 hover:bg-sky-600 disabled:opacity-60 px-4 py-2 text-sm font-medium text-white transition-colors transition-transform shadow-sm shadow-sky-500/30 hover:-translate-y-0.5 hover:shadow-sky-400/40"
            >
              {addingCity ? "Adding..." : "Add city"}
            </button>
          </div>
        </section>

        <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-3 transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-medium text-slate-200">Search your cities</h2>
            <p className="text-[11px] text-slate-500">Filter by city name (case-insensitive).</p>
          </div>

          <div className="mt-1 flex flex-col gap-2">
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Search cities by name..."
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </section>

        <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-medium text-slate-200">Your cities</h2>
            <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/70 p-1 text-xs">
              <button
                type="button"
                onClick={() => setCityViewMode("all")}
                className={`relative flex-1 rounded-full px-3 py-1 transition-colors transition-transform ${
                  cityViewMode === "all"
                    ? "bg-sky-500 text-white shadow-sm shadow-sky-500/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setCityViewMode("favorites")}
                className={`relative flex-1 rounded-full px-3 py-1 transition-colors transition-transform ${
                  cityViewMode === "favorites"
                    ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                Favorites
              </button>
            </div>
          </div>

          {cities.length === 0 ? (
            <p className="text-xs text-slate-500">You have no cities yet. Add one above to get started.</p>
          ) : cityViewMode === "favorites" && cities.filter((c) => c.isFavorite).length === 0 ? (
            <p className="text-xs text-slate-500">You have no favorite cities yet. Mark one as favorite.</p>
          ) : cities
              .filter((c) =>
                cityViewMode === "favorites" ? c.isFavorite : true
              )
              .filter((c) => c.name.toLowerCase().includes(citySearch.trim().toLowerCase())).length === 0 ? (
            <p className="text-xs text-slate-500">
              No cities match your search. Try a different name or clear the search box.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cities
                .filter((c) =>
                  cityViewMode === "favorites" ? c.isFavorite : true
                )
                .filter((c) => c.name.toLowerCase().includes(citySearch.trim().toLowerCase()))
                .map((city) => {
                  const weather = weatherByCityId[city.id];
                  const wError = weatherErrorByCityId[city.id];

                  const isFavorite = city.isFavorite;

                  return (
                    <div
                      key={city.id}
                      className={`relative flex flex-col gap-3 rounded-xl p-4 transition-transform transition-shadow hover:-translate-y-1 ${
                        isFavorite
                          ? "border border-amber-500/40 bg-amber-500/5 hover:shadow-[0_18px_60px_rgba(251,191,36,0.4)]"
                          : "border border-slate-800 bg-slate-900/70 hover:shadow-[0_18px_60px_rgba(15,23,42,0.9)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm">
                              {city.name}
                              {city.country ? <span className="text-slate-400">, {city.country}</span> : null}
                            </h3>
                            {isFavorite && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                Favorite
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Tap refresh to fetch latest weather for this city.
                          </p>
                        </div>

                        {weather && (
                          <div className="text-right text-xs text-slate-200">
                            <div className="text-lg font-semibold">
                              {Math.round(weather.temperature)}
                              <span className="align-top text-[10px]">°C</span>
                            </div>
                            <div className="text-[11px] text-slate-400">{weather.description}</div>
                          </div>
                        )}
                      </div>

                      {wError && (
                        <p className="mt-2 text-xs text-amber-400">{wError}</p>
                      )}

                      <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(city)}
                          className="inline-flex items-center rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-800 transition-colors transition-transform hover:-translate-y-0.5"
                        >
                          {isFavorite ? "Unfavorite" : "Mark favorite"}
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => loadWeatherForCity(city.id)}
                            className="inline-flex items-center rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-800 transition-colors transition-transform hover:-translate-y-0.5"
                          >
                            Refresh
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDeleteCity(city.id)}
                            className="inline-flex items-center rounded-md border border-red-700/70 text-red-300 px-2 py-1 hover:bg-red-900/60 transition-colors transition-transform hover:-translate-y-0.5"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      </div>

      {/* Floating AI chat widget */}
      <div className="fixed bottom-5 right-4 z-30 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        {chatOpen && (
          <div className="w-[90vw] max-w-sm rounded-2xl border border-slate-700/80 bg-slate-950/95 p-3 shadow-[0_22px_70px_rgba(15,23,42,0.95)] backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">AI copilot</p>
                <p className="text-xs font-medium text-slate-100">Ask about your cities, trips, or plans.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setChatOpen(false);
                }}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-600 text-[11px] text-slate-300 hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            <div className="mb-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const preset =
                    "From my saved cities, which ones are currently the warmest and which are the coldest?";
                  setAiQuestion(preset);
                  handleAskAi();
                }}
                className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-sky-500/20 hover:border-sky-400/60"
              >
                ⚡ Warm vs cold
              </button>
              <button
                type="button"
                onClick={() => {
                  const preset =
                    "Looking at my saved cities, which one has the most pleasant weather right now for a walk or coffee outside?";
                  setAiQuestion(preset);
                  handleAskAi();
                }}
                className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-emerald-500/20 hover:border-emerald-400/60"
              >
                🌤 Best city right now
              </button>
              <button
                type="button"
                onClick={() => {
                  const preset =
                    "From my saved cities, which ones currently have rain, storms, or very cloudy weather that I might want to avoid today?";
                  setAiQuestion(preset);
                  handleAskAi();
                }}
                className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-indigo-500/20 hover:border-indigo-400/60"
              >
                ☔ Avoid today
              </button>
            </div>

            <div className="space-y-2">
              <textarea
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder={'Ask questions about your saved cities and their current weather. For example: "Which of my cities is coldest right now?"'}
                className="h-16 w-full resize-none rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={handleAskAi}
                disabled={aiLoading || !aiQuestion.trim()}
                className="w-full inline-flex items-center justify-center rounded-md bg-sky-500 hover:bg-sky-600 disabled:opacity-60 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm shadow-sky-500/40 transition-colors transition-transform hover:-translate-y-0.5"
              >
                {aiLoading ? "Thinking..." : "Ask Trao AI"}
              </button>
            </div>

            {aiError && (
              <p className="mt-1 text-[10px] text-red-400">{aiError}</p>
            )}

            {aiAnswer && (
              <div className="mt-2 max-h-40 overflow-auto rounded-md border border-slate-700 bg-slate-950/70 p-2 text-[11px] text-slate-100 whitespace-pre-line">
                {aiAnswer}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col items-end gap-1">
          {showAssistantLabel && !chatOpen && !assistantLabelDismissed && (
            <button
              type="button"
              onClick={() => {
                setShowAssistantLabel(false);
                setAssistantLabelDismissed(true);
              }}
              className="rounded-full bg-slate-900/90 px-3 py-1 text-[11px] text-sky-200 border border-sky-500/40 shadow-[0_0_25px_rgba(56,189,248,0.7)] hover:bg-slate-900"
            >
              Hey, I&apos;m your weather assistant.
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setChatOpen((prev) => !prev);
            }}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sky-500/70 bg-sky-500/20 text-sky-200 shadow-[0_0_30px_rgba(56,189,248,0.8)] backdrop-blur-md transition-transform transition-shadow hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(56,189,248,1)] sm:h-12 sm:w-12"
          >
            💬
          </button>
        </div>
      </div>

      {/* Developed by Arpit Singh badge */}
      <div className="pointer-events-none fixed bottom-4 left-4 z-20 sm:bottom-6 sm:left-6">
        <div className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/90 px-3 py-1 text-[11px] text-slate-300 shadow-[0_0_18px_rgba(15,23,42,0.9)] backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium tracking-tight">Developed by Arpit Singh</span>
        </div>
      </div>

      {/* Confirm modals */}
      {(showLogoutConfirm || cityIdToDelete) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),transparent_55%),_radial-gradient(circle_at_bottom,_rgba(244,114,182,0.2),transparent_55%)] opacity-60" />
          <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-slate-700/80 bg-slate-950/95 px-5 py-4 shadow-[0_24px_80px_rgba(15,23,42,0.95)] animate-[modalIn_160ms_ease-out]">
            <div className="mb-2.5 flex items-start gap-3">
              <div
                className={
                  showLogoutConfirm
                    ? "mt-1 text-base text-cyan-200 drop-shadow-[0_0_16px_rgba(34,211,238,0.75)] animate-pulse"
                    : "mt-1 text-base text-amber-300 drop-shadow-[0_0_16px_rgba(251,191,36,0.75)] animate-pulse"
                }
              >
                {showLogoutConfirm ? "⏻" : "☁"}
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  {showLogoutConfirm ? "Session escape" : "City cleanup"}
                </p>
                <h3 className="text-sm font-semibold text-slate-50 leading-snug">
                  {showLogoutConfirm
                    ? "Log out from Trao Weather AI?"
                    : "Send this city back to the clouds?"}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {showLogoutConfirm
                    ? "We'll close your current session on this device. Your saved cities stay intact for when you jump back in."
                    : "We'll remove this city from your dashboard views. Weather history here is ephemeral anyway – you can always add it again."}
                </p>
              </div>
            </div>

            <div className="mt-3.5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  setCityIdToDelete(null);
                }}
                className="inline-flex items-center justify-center rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-900/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (showLogoutConfirm) {
                    setShowLogoutConfirm(false);
                    performLogout();
                    return;
                  }
                  if (cityIdToDelete) {
                    const id = cityIdToDelete;
                    setCityIdToDelete(null);
                    await handleDeleteCity(id);
                  }
                }}
                className="inline-flex items-center justify-center rounded-md bg-red-500 hover:bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-red-500/40 transition-colors transition-transform hover:-translate-y-0.5"
              >
                {showLogoutConfirm ? "Logout" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
