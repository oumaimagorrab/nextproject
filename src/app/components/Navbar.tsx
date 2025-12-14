"use client";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const menuLinks = [
    { name: "Jobs", href: "/index" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "About", href: "/about" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">

        {/* Logo à gauche */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="SmartDash Logo"
            width={150}
            height={150}
            className="object-contain"
            unoptimized
          />
        </Link>

        {/* Liens centrés */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex space-x-8 text-gray-700 font-medium">

          {menuLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              className="relative py-2
                         after:content-[''] after:absolute after:left-0 after:bottom-0 
                         after:w-0 after:h-[2px] after:bg-blue-600 
                         after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Bouton Connexion (plus petit) */}
        <Link
        href="/login"
        className="px-4 py-2 text-sm font-semibold rounded-xl
                    bg-gradient-to-r from-indigo-600 to-indigo-700
                    text-white shadow-md
                    hover:shadow-indigo-300/40 hover:scale-105 transition-all duration-300"
        >
        Se connecter
        </Link>


      </div>
    </nav>
  );
}
