"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, provider } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* ---------------------- LOGIN EMAIL/PASSWORD ---------------------- */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(""); // reset error

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Login failed");
        return;
      }

      // ✅ Sauvegarder l'userId dans localStorage
      localStorage.setItem("userId", data.userId);

      // Redirection vers dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMsg("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------- GOOGLE LOGIN ------------------------- */
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);

      // Récupérer l'ID unique de Firebase
      const userId = result.user?.uid;
      if (userId) {
        localStorage.setItem("userId", userId);
        router.push("/dashboard");
      } else {
        setErrorMsg("Google login failed.");
      }
    } catch (error) {
      console.error("Google login error:", error);
      setErrorMsg("Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#D8CEF6] p-6">
      <div className="flex w-full max-w-5xl bg-transparent">
        {/* Left section */}
        <div className="flex flex-1 items-center justify-center h-[500px]">
          <img src="/logo2.png" alt="illustration" className="w-full h-full object-contain" />
        </div>

        {/* Right section */}
        <div className="w-1/2 flex items-center justify-center">
          <div className="bg-white w-full max-w-md p-10 rounded-2xl shadow-xl">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to SmartDash!</h1>
            <p className="text-gray-500 mb-8">Login to your account</p>

            {errorMsg && (
              <p className="mb-4 text-red-600 bg-red-100 p-2 rounded-lg text-sm">{errorMsg}</p>
            )}

            <form className="space-y-4" onSubmit={handleLogin}>
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="mt-1 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
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
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? "Loading..." : "Login"}
              </button>
            </form>

            {/* Google login */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-3 border border-slate-200 py-3 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
            >
              <img src="/google-icon.png" alt="Google" className="w-5" />
              <span className="text-sm font-medium text-slate-700">Continue with Google</span>
            </button>

            <p className="mt-6 text-center text-sm text-slate-600">
              Don’t have an account?{" "}
              <Link href="/register" className="text-indigo-600 font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
