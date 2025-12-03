import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { error: "Email manquant" },
        { status: 400 }
      );
    }

    // Vérifier si user existe déjà
    let user = await User.findOne({ email });

    // Si pas trouvé → créer
    if (!user) {
      user = await User.create({
        email,
        provider: "google", // important !
      });
    }

    // Générer JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ token }, { status: 200 });

  } catch (err: any) {
    console.error("GOOGLE REGISTER ERROR:", err);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
