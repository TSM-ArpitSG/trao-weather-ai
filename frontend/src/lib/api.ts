// API client helper for Trao Weather AI frontend.
// Wraps fetch with auth headers, error handling, and global 401 redirect.
// Code written by Arpit Singh.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export interface ApiError {
  message: string;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Include JWT Authorization header if token is provided
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Handle auth errors globally on the client: clear storage and redirect to login
    if (typeof window !== "undefined" && res.status === 401) {
      try {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      } catch {
        // ignore storage errors
      }

      // Redirect to login for any unauthorized response
      window.location.href = "/login";
    }

    const message = (data && (data.message || data.error)) || "Request failed";
    throw new Error(message);
  }

  return data as T;
}
