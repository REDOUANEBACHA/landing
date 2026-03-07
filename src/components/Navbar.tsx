"use client";

import { useState } from "react";
import Image from "next/image";
import { FileText, Menu, X } from "lucide-react";

const links = [
  { label: "Solution", href: "#solution" },
  { label: "Modules", href: "#modules" },
  { label: "Fonctionnalites", href: "#fonctionnalites" },
  { label: "Tarifs", href: "#tarifs" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
        <a href="#" className="flex items-center gap-1.5">
          <Image src="/logoGolfCool.png" alt="Cool Golf Method" width={28} height={28} className="rounded-md" />
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Cool <span className="text-accent">Golf</span> Method
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-[13px] text-gray-500 hover:text-white transition-colors duration-300"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#"
            className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-white transition-colors duration-300"
          >
            <FileText className="w-3.5 h-3.5" /> Brochure
          </a>
          <a
            href="#download"
            className="ml-2 px-5 py-[7px] bg-accent text-dark text-[13px] font-semibold rounded-lg hover:bg-accent-dark transition-all duration-300"
          >
            Telecharger
          </a>
        </div>

        <button
          className="lg:hidden text-gray-400"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden px-6 pb-5 pt-2 border-t border-white/[0.04] flex flex-col gap-3 bg-dark/95 backdrop-blur-xl">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-sm text-gray-400 py-1"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#download"
            onClick={() => setOpen(false)}
            className="text-sm text-accent font-semibold py-1"
          >
            Telecharger
          </a>
        </div>
      )}
    </nav>
  );
}
