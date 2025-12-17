"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

export default function JobNotificationBell() {
  const [count, setCount] = useState(0);
  const [jobs, setJobs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/notifications");
      const data = await res.json();
      setCount(data.new_jobs_count || 0);
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Notification error", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleDropdown = () => setOpen(!open);

  return (
    <div className="relative">
      <button onClick={toggleDropdown} className="relative">
        <Bell className="w-6 h-6 text-gray-700" />
        {count > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </button>

      {open && jobs.length > 0 && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-50 max-h-96 overflow-y-auto">
          <h4 className="p-2 font-semibold border-b">New Jobs</h4>
          <ul>
            {jobs.map((job, i) => (
              <li key={i} className="p-2 border-b hover:bg-gray-100">
                <a
                  href={job.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <p className="font-semibold text-gray-800">{job.title}</p>
                  <p className="text-sm text-gray-600">
                    {job.company} - {job.location}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}