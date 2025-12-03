"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";

export default function HomePage() {
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ================= NAVBAR ================= 
      <nav className="w-full flex items-center justify-between px-12 py-6">
        
        {/* LEFT LINKS 
        <div className="flex gap-8 text-lg font-medium text-[#1e2a4a]">
          <a href="#">Accueil</a>
          <a href="#">Parcourir</a>
        </div>

        {/* LOGO 
        <div className="flex items-center gap-2">
          <Image src="/logo.png" width={170} height={170} alt="logo" />
        </div>

        {/* RIGHT 
        <div className="flex items-center gap-6">
          <a href="/login" className="text-lg text-[#1e2a4a] font-medium">
            Se Connecter
          </a>

          <Button className="bg-[#1e2a4a] text-white px-6 py-2 rounded-lg">
            S’inscrire
          </Button>
        </div>

      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="flex flex-col items-center text-center mt-12 px-6">

        {/* SEARCH BAR (au-dessus du texte) */}
        <div className="flex items-center bg-white rounded-full shadow-lg w-full max-w-3xl px-6 py-3 gap-3 mb-10">
          <span className="text-gray-500 text-xl">🔍</span>
          <input
            type="text"
            placeholder="Rechercher des emplois..."
            className="flex-1 outline-none text-gray-700"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-blue-700">
            Rechercher
          </button>
        </div>

        {/* TITLE */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-[#1e2a4a] max-w-3xl leading-tight">
          Trouvez votre prochain emploi
        </h1>

        {/* SUBTEXT */}
        <p className="text-gray-700 mt-4 max-w-xl text-lg">
          SmartDash analyse les offres et vous présente de nouvelles opportunités d'emploi.
        </p>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="max-w-5xl mx-auto mt-24 px-6 grid md:grid-cols-3 gap-12 text-center">

        <div>
          <h3 className="text-xl font-semibold text-[#1e2a4a] mb-2">Collecte automatisée</h3>
          <p className="text-gray-600">
            Les offres sont collectées automatiquement de plusieurs sites.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-[#1e2a4a] mb-2">Analyse intelligente</h3>
          <p className="text-gray-600">
            SmartDash identifie des opportunités basées sur vos intérêts.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-[#1e2a4a] mb-2">Filtres avancés</h3>
          <p className="text-gray-600">
            Trouvez l'emploi idéal grâce à nos filtres puissants.
          </p>
        </div>

      </section>

      {/* ================= FOOTER ================= */}
      <footer className="mt-24 py-8 text-center text-gray-500">
        © 2025 SmartDash — Tous droits réservés.
      </footer>

    </div>
  );
}
