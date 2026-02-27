// AI service layer for Trao Weather App backend.
// Interfaces with Gemini API to answer user questions about saved cities' weather.
// Falls back to heuristic summaries when the AI provider is unavailable.
// Code written by Arpit Singh.
import axios from "axios";

export interface AiInsightRequest {
  question: string;
  weatherSummary: string;
}

export interface AiInsightResponse {
  answer: string;
  usedFallback: boolean;
}

function getGeminiConfig() {
  const baseUrl = process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com";
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

  if (!apiKey) {
    console.warn("[AI] GEMINI_API_KEY is not set; falling back to heuristic summaries when needed.");
  } else {
    console.log("[AI] GEMINI_API_KEY is configured.");
  }
  console.log("[AI] GEMINI_API_BASE_URL:", baseUrl);
  console.log("[AI] GEMINI_MODEL:", model);

  return { baseUrl, apiKey, model };
}

export async function getAiInsight(req: AiInsightRequest): Promise<AiInsightResponse> {
  const { question, weatherSummary } = req;
  const { baseUrl, apiKey, model } = getGeminiConfig();

  if (!apiKey) {
    return heuristicFallback(question, weatherSummary);
  }

  try {
    const prompt = buildPrompt(question, weatherSummary);
    const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.5,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const candidates = response.data.candidates;
    const firstCandidate = Array.isArray(candidates) && candidates.length > 0 ? candidates[0] : undefined;
    const parts = firstCandidate?.content?.parts;

    let text: string | undefined;
    if (Array.isArray(parts) && parts.length > 0) {
      text = parts
        .map((p: any) => (typeof p.text === "string" ? p.text : ""))
        .join("\n\n")
        .trim();
    }

    const answer: string = text && text.length > 0 ? text : "I couldn't generate insights right now.";

    return {
      answer,
      usedFallback: false,
    };
  } catch (err) {
    console.error("[AI] Error calling AI provider", err);
    return heuristicFallback(question, weatherSummary);
  }
}

// Build a prompt that constrains the AI to use only the provided weather summary.
function buildPrompt(question: string, weatherSummary: string): string {
  return [
    "Here is the user's saved cities and their current weather readings:",
    weatherSummary,
    "",
    "Using ONLY this information, answer the user's question.",
    "If the question cannot be answered from this data, explain briefly what is missing.",
    "",
    `User question: ${question}`,
  ].join("\n");
}

// Simple heuristic fallback that parses temperatures and provides a quick summary.
function heuristicFallback(question: string, weatherSummary: string): AiInsightResponse {
  const lines = weatherSummary
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      answer:
        "I don't have any weather data yet. Add cities and load their weather, then try asking for insights again.",
      usedFallback: true,
    };
  }

  const temps: { city: string; temp: number }[] = [];

  for (const line of lines) {
    const match = line.match(/City: (.*?)(?: \((.*?)\))? \| (-?\d+(?:\.\d+)?)°C/);
    if (!match) {
      continue;
    }

    const cityMatch = match[1];
    const tempMatch = match[3];

    if (!cityMatch || !tempMatch) {
      continue;
    }

    const city = cityMatch.trim();
    const temp = parseFloat(tempMatch);

    if (!Number.isNaN(temp)) {
      temps.push({ city, temp });
    }
  }

  let summary = "Here is a quick heuristic summary based on your cities:";

  if (temps.length > 0) {
    const sorted = [...temps].sort((a, b) => a.temp - b.temp);
    const coldest = sorted[0];
    const warmest = sorted[sorted.length - 1];

    if (coldest && warmest) {
      summary += `\n- Coldest city: ${coldest.city} at ${coldest.temp.toFixed(1)}°C.`;
      summary += `\n- Warmest city: ${warmest.city} at ${warmest.temp.toFixed(1)}°C.`;

      const avg = sorted.reduce((acc, t) => acc + t.temp, 0) / sorted.length;
      summary += `\n- Average temperature across your cities: ${avg.toFixed(1)}°C.`;
    }
  }

  summary +=
    "\n\nAI provider is not configured or not reachable, so this is a simple heuristic summary instead of a full AI answer.";

  return {
    answer: summary,
    usedFallback: true,
  };
}
