import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
 try {
    await dbConnect();
    const { email, password }: { email: string; password: string } = await req.json();
    console.log("LOGIN REQUEST:", email, password);


    const user = await User.findOne({ email });
    console.log("FOUND USER:", user);
    
    if (!user) {
        return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    }
    if (!user.password) {
      return new Response(
        JSON.stringify({
          error:
            "Ce compte a été créé avec Google. Utilise Google Login pour te connecter.",
        }),
        { status: 400 }
      );
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    }
    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET as string,
        { expiresIn: "1d" }
    );

    return new Response(
    JSON.stringify({
      token,
      userId: user._id.toString(), // ✅ AJOUT CRUCIAL
    }),
    { status: 200 }
    );

    } catch (error) {

        return new Response(JSON.stringify({ error: "Something went wrong" }), { status: 500 });
    }
}

