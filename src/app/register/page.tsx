"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ---------- REGISTER NORMAL ----------
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        router.push("/dashboard");
      } else {
        setMessage(data.error || data.message);
      }
    } catch (err) {
      console.error(err);
      setMessage("Erreur serveur, veuillez réessayer");
    } finally {
      setLoading(false);
    }
  };

  // ---------- REGISTER WITH GOOGLE ----------
  const handleGoogleRegister = async () => {
  try {
    setLoading(true);

    // Login Google
    const result = await signInWithPopup(auth, provider);
    const email = result.user.email;

    // Appel à ton API
    const res = await fetch("/api/auth/google-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok && data.token) {
      localStorage.setItem("token", data.token);
      
      router.refresh();
      setTimeout(() => router.push("/dashboard"), 100);
    } else {
      setMessage(data.error || "Erreur Google Register");
    }

  } catch (error) {
    console.error(error);
    setMessage("Erreur Google");
  } finally {
    setLoading(false);
  }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#D8CEF6] p-6">
      
      {/* --- GLOBAL GRID (Left + Right) --- */}
      <div className="flex w-full max-w-5xl bg-transparent">
      
      {/* ---------------------- LEFT SECTION (Logo) ---------------------- */}
        <div className="flex flex-1 items-center justify-center h-[500px]"> 
          <img src="/logo2.png" alt="illustration" className="w-full h-full object-contain" /> 
        </div>

      {/* ---------- RIGHT SIDE FORM ---------- */}
        <div className="w-1/2 flex items-center justify-center">
        <div className="bg-white w-full max-w-md p-10 rounded-2xl shadow-xl">

          {/* HEADER */}
          <h1 className="text-2xl font-bold text-gray-800">Create an account</h1>
          <p className="text-gray-500 mb-8">Register to access SmartDash</p>

          {/* FORM */}
          <form onSubmit={handleRegister} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="mt-1 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                placeholder="8+ characters"
                className="mt-1 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
            >
              Register
            </button>
          </form>

          {/* Error message */}
          {message && (
            <p className="mt-4 text-center text-sm text-red-500">{message}</p>
          )}

          {/* GOOGLE BUTTON */}
          <button
            onClick={handleGoogleRegister}
            disabled={loading}
            className="mt-4 w-full flex items-center justify-center gap-3 border border-slate-200 py-3 rounded-lg hover:bg-slate-50 transition disabled:opacity-60"
          >
            {/* Google SVG */}
            <svg width="18" height="18" viewBox="0 0 533.5 544.3" aria-hidden>
              <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.6-34.1-4.7-50.2H272v95.1h147.4c-6.3 34.1-25.4 62.9-54.6 82.2v68h88.2c51.6-47.5 81.5-117.7 81.5-195.1z"/>
              <path fill="#34A853" d="M272 544.3c73.8 0 135.8-24.3 181-66.1l-88.2-68c-24.5 16.4-55.9 26-92.8 26-71.4 0-132-48.1-153.5-112.7H29.5v70.5C74.4 494.3 167.1 544.3 272 544.3z"/>
              <path fill="#FBBC05" d="M118.5 327.9c-10.6-31.4-10.6-65.9 0-97.3V160.1H29.5c-38.8 76.5-38.8 168.4 0 244.9l89-77.1z"/>
              <path fill="#EA4335" d="M272 107.7c39.9 0 75.8 13.7 104 40.5l78-78C407.7 24 345.7 0 272 0 167.1 0 74.4 50 29.5 129.6l89 77.1C140 155.8 200.6 107.7 272 107.7z"/>
            </svg>

            <span className="text-sm font-medium text-slate-700">
              Continuer avec Google
            </span>
          </button>

          {/* FOOTER */}
          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Login
            </Link>
          </p>

        </div>
        </div>
      </div>
    </main>
  );
}
