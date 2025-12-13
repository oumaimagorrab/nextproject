"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function JobOffersPage() {
  const [jobData, setJobData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    title: "Frontend Developer",
    location: "Paris",
    contract: "All",
    salary: "30-50",
  });

  const handleSearch = async () => {


    if (!filters.title.trim()) return;

    setLoading(true);
    setError(null);

    // 🔥 LIRE userId
    const userId =
      typeof window !== "undefined"
        ? localStorage.getItem("userId")
        : null;

    console.log("USER ID:", userId);

    try {
      const res = await fetch("http://127.0.0.1:8000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: filters.title,
          location: filters.location,
          contract: filters.contract,
          salary: filters.salary,
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

  return (
    <div className="p-6 w-full min-h-screen bg-gray-50">
      <div className="grid grid-cols-12 gap-6">

        {/* Filters */}
        <Card className="col-span-3 p-4">
          <h2 className="text-xl font-semibold mb-4">Filter</h2>
          <div className="space-y-4">
            {/* Title */}
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

            {/* Location */}
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

            {/* Contract Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Contract Type</label>
              <Select value={filters.contract} onValueChange={(val) => setFilters({ ...filters, contract: val })}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="CDI">CDI</SelectItem>
                  <SelectItem value="CDD">CDD</SelectItem>
                  <SelectItem value="Freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-medium mb-1">Salary Range</label>
              <Select value={filters.salary} onValueChange={(val) => setFilters({ ...filters, salary: val })}>
                <SelectTrigger><SelectValue placeholder="30-50k" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30-50">€30,000 - €50,000</SelectItem>
                  <SelectItem value="50-70">€50,000 - €70,000</SelectItem>
                  <SelectItem value="70-100">€70,000 - €100,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full bg-blue-600 text-white hover:bg-blue-700" onClick={handleSearch}>
              Search
            </Button>
          </div>
        </Card>

        {/* Job Table */}
        <Card className="col-span-9 p-4">
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Title</th>
                  <th className="text-left py-2">Company</th>
                  <th className="text-left py-2">Location</th>
                  <th className="text-left py-2">Contract</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={4}>Loading...</td></tr>}
                {error && <tr><td colSpan={4}>{error}</td></tr>}
                {jobData.map((job, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{job.title}</td>
                    <td>{job.company}</td>
                    <td>{job.location}</td>
                    <td>{job.contract}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
