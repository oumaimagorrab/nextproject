"use client";
import { useState } from "react";

export default function SearchBar() {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    alert(`Recherche lancée pour : ${query}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex items-center bg-white border-2 border-gray-300 rounded-full shadow-sm px-6 py-3 gap-4">
      
      <input
        type="text"
        placeholder="Rechercher un emploi, un mot-clé..."
        className="flex-1 text-lg outline-none"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button
        onClick={handleSearch}
        className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition text-lg"
      >
        Rechercher
      </button>
    </div>
  );
}
