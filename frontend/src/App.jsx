import { useState } from "react";
import api from "./api/axios";

function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkBackendHealth = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/health");
      setHealth(response.data);
    } catch (err) {
      setHealth(null);
      setError(
        err.response?.data?.message ||
          "Could not reach the backend server. Make sure it is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50/50 text-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-rose-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-serif font-bold text-rose-600">
              WedEase
            </span>
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            Phase 1: Project Setup
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-rose-100 p-8 md:p-10 text-center">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-3">
            Plan Your Wedding, Your Way
          </h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Welcome to <span className="font-semibold text-rose-600">WedEase</span> —
            a self-service wedding planning and management platform built for
            couples. Manage your checklist, budget, guests, manual bookings, and
            wedding day timeline all in one place.
          </p>

          {/* Backend Health Check Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Backend API Connection
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Test the live connection to{" "}
                  <code className="bg-slate-200/70 px-1.5 py-0.5 rounded text-slate-700">
                    GET /api/health
                  </code>
                </p>
              </div>
              <button
                onClick={checkBackendHealth}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-medium transition-colors cursor-pointer"
              >
                {loading ? "Checking..." : "Check API Status"}
              </button>
            </div>

            {health && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                <p className="font-medium">Status: {health.status}</p>
                <p className="text-xs mt-1">{health.message}</p>
                <p className="text-xs text-emerald-600 mt-1">
                  Timestamp: {health.timestamp}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
