"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import dynamic from "next/dynamic";
import Link from "next/link";

// 🔔 ADD THIS IMPORT (notification only)
import JobNotificationBell from "../components/JobNotificationBell";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false }) as any;

export default function JobOffersPage() {
  const [jobData, setJobData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    title: "Frontend Developer",
    location: "Paris",
  });

  const handleSearch = async () => {
    if (!filters.title.trim()) return;

    setLoading(true);
    setError(null);

    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

    try {
      const res = await fetch("http://127.0.0.1:8000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: filters.title,
          location: filters.location,
          jobs_per_search: 5,
          user_id: userId,
        }),
      });

      if (!res.ok) throw new Error("Network response was not ok");

      const data = await res.json();
      setJobData(data.results || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch jobs. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Calcul des statistiques pour les graphiques
  const jobCountByTitle = jobData.reduce((acc, job) => {
    acc[job.title] = (acc[job.title] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const seriesTitle = [{
    name: "Jobs",
    data: Object.values(jobCountByTitle),
  }];

  const optionsTitle = {
    chart: { id: "jobs-by-title", toolbar: { show: false } },
    xaxis: { categories: Object.keys(jobCountByTitle), labels: { style: { colors: '#1E293B', fontSize: '12px' }, rotate: 0 } },
    title: { text: "Jobs by Title", align: "center", style: { fontSize: '18px', fontWeight: 'bold', color: '#1E293B' } },
    colors: ['#6366F1'],
    dataLabels: { enabled: true },
  };

  const jobCountByLocation = jobData.reduce((acc, job) => {
    acc[job.location] = (acc[job.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const seriesLocation = Object.values(jobCountByLocation);

  const optionsLocation = {
    chart: { id: "jobs-by-location", toolbar: { show: false } },
    labels: Object.keys(jobCountByLocation),
    title: { text: "Jobs by Location", align: "center", style: { fontSize: '18px', fontWeight: 'bold', color: '#1E293B' } },
  };

  return (
    <div className="p-6 w-full min-h-screen bg-[#F5F3FF]">

      {/* 🔔 NOTIFICATION BELL (ONLY ADDITION) */}
      <div className="flex justify-end mb-4">
        <JobNotificationBell />
      </div>

      <div className="grid grid-cols-12 gap-6">

        {/* Filters */}
        <Card className="col-span-3 p-6 shadow-lg rounded-xl bg-white">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Filter</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Select value={filters.title} onValueChange={(val) => setFilters({ ...filters, title: val })}>
                <SelectTrigger><SelectValue placeholder="Select title" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                  <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                  <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Select value={filters.location} onValueChange={(val) => setFilters({ ...filters, location: val })}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paris">Paris</SelectItem>
                  <SelectItem value="Lyon">Lyon</SelectItem>
                  <SelectItem value="Marseille">Marseille</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700" onClick={handleSearch}>
              {loading ? "Loading..." : "Search"}
            </Button>
          </div>
        </Card>

        {/* Job Table */}
        <Card className="col-span-9 p-6 shadow-lg rounded-xl bg-white">
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-100">
                  <th className="text-left py-2 w-1/4">Title</th>
                  <th className="text-left py-2">Company</th>
                  <th className="text-left py-2">Location</th>
                  <th className="py-2 text-right"></th> {/* juste pour le header des boutons */}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4}>Loading...</td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td colSpan={4}>{error}</td>
                  </tr>
                )}
                {jobData.map((job, index) => (
                  <tr key={index} className="border-b hover:bg-purple-50">
                    <td className="py-2 w-1/4">{job.title}</td>
                    <td className="py-2">{job.company}</td>
                    <td className="py-2">{job.location}</td>
                    <td className="py-2 text-right flex justify-end gap-2">
                      <button
                        className="bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                        onClick={() => window.open(job.link, "_blank")}
                      >
                        Apply
                      </button>
                      <Link href="/sendcv">
                        <button className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700" 
                        >
                        Send CV
                      </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>


        {/* Graphiques */}
        <Card className="col-span-12 mt-8 p-6 shadow-xl rounded-2xl bg-white">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Job Offers Statistics</h2>
        <div className="grid grid-cols-2 gap-6">
          {/* Jobs by Title */}
          <div>
        <Chart options={{...optionsTitle, colors: ['#4134cfff', '#4134cfff', '#4134cfff']}} series={seriesTitle} type="bar" height={350} />
        </div>

        {/* Jobs by Location */}
        <div>
          <Chart options={{...optionsLocation, colors: ['#7570D7', '#7d7fe0b3', '#4338CA']}} series={seriesLocation} type="donut" height={350} />
        </div>
        </div>
      </Card>

      </div>
    </div>
  );
}