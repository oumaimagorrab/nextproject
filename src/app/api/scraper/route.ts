// src/app/api/scraper/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Lire le body envoyé depuis le frontend
    const body = await req.json(); 


    // Envoyer la requête
    const res = await fetch("http://127.0.0.1:8000/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: body.titles || body.title || body.query,
        location: body.locations || body.location || "Paris",
        jobs_per_search: body.jobsPerSearch || body.jobs_per_search || 5,
        user_id: body.user_id || null
      }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("API route error:", err);
    return NextResponse.json(
      { error: "Server error", details: `${err}` },
      { status: 500 }
    );
  }
}
