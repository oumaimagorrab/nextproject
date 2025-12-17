"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Job = {
  title: string;
  company: string;
  location: string;
  salary?: string;
  description?: string;
  link?: string;
  score?: number;
  posted_at?: string;
};

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [jobData, setJobData] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          jobs_per_search: 10,
        }),
      });

      if (!res.ok) throw new Error("Network response was not ok");

      const data = await res.json();
      setJobData(data.results || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch jobs. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 w-full min-h-screen bg-[#F5F3FF]">

      {/* ================= HERO ================= */}
      <section className="flex flex-col items-center text-center mt-12 px-6">
        <h1 className="text-5xl md:text-6xl font-extrabold text-[#1e2a4a] max-w-3xl leading-tight">
          Find Your Next Job
        </h1>

        <p className="text-gray-700 mt-4 max-w-xl text-lg">
          SmartDash analyzes job listings and presents you with new career opportunities.
        </p>

        {/* SEARCH BAR */}
        <div className="flex items-center bg-white rounded-full shadow-lg w-full max-w-3xl px-6 py-3 gap-3 mt-10">
          <span className="text-gray-500 text-xl">🔍</span>

          <input
            type="text"
            placeholder="Backend developer London 60k remote…"
            className="flex-1 outline-none text-gray-700"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />

          <Button
            className="bg-indigo-600 text-white px-8 py-4 rounded-full hover:bg-indigo-700"
            onClick={handleSearch}
          >
            Search
          </Button>
        </div>
      </section>
      {/* ================= RESULTS ================= */}
      <section className="max-w-6xl mx-auto mt-12 px-6">
        {loading && (
          <p className="text-center text-gray-500">Loading…</p>
        )}
        {error && (
          <p className="text-center text-red-500">{error}</p>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {jobData.map((job, index) => (
            <Card
              key={index}
              className="hover:shadow-2xl transition-shadow duration-200"
            >
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-[#1e2a4a]">
                  {job.title}
                </h2>

                <p className="text-gray-600 mt-1">
                  {job.company} — {job.location}
                </p>

                <p className="text-gray-500 text-sm mt-1">
                  💰 {job.salary || "Not specified"} • 🤖 Score:{" "}
                  {job.score?.toFixed(3) ?? "—"}
                </p>

                <p className="text-gray-700 mt-3">
                  {job.description?.slice(0, 140)}
                  {job.description && job.description.length > 140 ? "…" : ""}
                </p>

                <Button
                  className="mt-4 bg-indigo-600 text-white hover:bg-indigo-700 w-full"
                  onClick={() => window.open(job.link, "_blank")}
                >
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
