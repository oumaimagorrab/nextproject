"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/app/components/Navbar";

export default function NavbarController() {
  const pathname = usePathname();

  const hideOn = ["/login", "/register"];

  if (hideOn.includes(pathname)) return null; // 🔥 Cache Navbar ici

  return <Navbar />;
}
