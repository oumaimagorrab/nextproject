import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query, location } = await req.json();

    const pythonRes = await fetch("http://127.0.0.1:8000/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, location }),
    });

    const data = await pythonRes.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
