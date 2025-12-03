import { NextResponse } from "next/server";
import User from "@/models/User";
import { dbConnect } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email } = await req.json();

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        password: "google_oauth_user" // valeur placeholder
      });
    }

    return NextResponse.json({ message: "Google login OK" }, { status: 200 });

  } catch (error) {
    console.error("Google login API error", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
