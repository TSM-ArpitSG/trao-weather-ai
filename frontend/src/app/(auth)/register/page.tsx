// Registration page for Trao Weather AI.
// Lets users create an account and shows success/error messages.
// Code written by Arpit Singh.
"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";

interface RegisterResponse {
  id: string;
  name: string;
  email: string;
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Submit handler to call backend /auth/register and update UI state
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const data = await apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      setSuccess(`Account created for ${data.email}. You can now log in.`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // Main animated register layout with neon/glassmorphism theme
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-cyan-500/30 blur-3xl animate-[float_16s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-purple-500/25 blur-3xl animate-[float_22s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(94,234,212,0.16),_transparent_55%)] opacity-90" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl grid gap-10 md:grid-cols-[1.4fr,1fr] items-center">
          <div className="hidden md:flex flex-col gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-[11px] font-medium text-cyan-200 shadow-sm shadow-cyan-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Join Trao Weather AI · Personal weather hub with insights
            </span>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Create your
              <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent"> weather account</span> in seconds.
            </h1>
            <p className="text-sm text-slate-400 max-w-md">
              Save cities you care about, mark favorites, and let AI help you plan around the weather.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-px rounded-3xl bg-[conic-gradient(at_top_left,_rgba(56,189,248,0.5),_rgba(14,116,144,0.3),_rgba(45,212,191,0.5))] opacity-70 blur-xl" />
            <div className="relative rounded-3xl border border-slate-700/70 bg-slate-900/75 px-6 py-7 sm:px-8 sm:py-8 shadow-[0_24px_90px_rgba(15,23,42,0.9)] backdrop-blur-xl">
              <div className="mb-5 space-y-1 text-center md:text-left">
                <h2 className="text-2xl font-semibold tracking-tight">Sign up</h2>
                <p className="text-xs text-slate-400">Create an account to start using the Trao Weather dashboard.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300" htmlFor="name">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/60"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/60"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/60"
                  />
                </div>

                {error && (
                  <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300 transition-opacity">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 transition-opacity">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-sky-500/30 transition-transform transition-shadow hover:-translate-y-0.5 hover:bg-sky-400 hover:shadow-sky-400/40 disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? "Creating account..." : "Sign up"}
                </button>
              </form>

              <p className="mt-4 text-[11px] text-center text-slate-500">
                Already have an account?{" "}
                <a href="/login" className="text-sky-400 hover:text-sky-300 hover:underline">
                  Log in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-3 left-3 z-20 max-w-[70%] sm:max-w-xs">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/70 px-3 py-1 text-[10px] text-slate-300 shadow-lg shadow-black/40 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Developed by Arpit Singh</span>
        </div>
      </div>
    </div>
  );
}
