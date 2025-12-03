import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    // 1️⃣ Connexion à la DB
    await dbConnect();

    // 2️⃣ Récupération des données
    const { email, password }: { email: string; password: string } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), { status: 400 });
    }

    // 3️⃣ Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ error: "User already exists" }), { status: 400 });
    }

    // 4️⃣ Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Créer l'utilisateur
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    // 6️⃣ Générer un token JWT (optionnel, comme dans login)
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET as string, { expiresIn: "1d" });

    // 7️⃣ Retour JSON
    return new Response(JSON.stringify({ message: "User registered successfully", token }), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), { status: 500 });
  }
}
