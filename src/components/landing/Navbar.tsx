"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#technology", label: "Technology" },
  { href: "#demo", label: "Demo" },
  { href: "/applications", label: "Applications" },
];

function scrollToHash(hash: string) {
  const id = hash.replace("#", "");
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrolledRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const next = window.scrollY > 16;
      if (next === scrolledRef.current) return;
      scrolledRef.current = next;
      setScrolled(next);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const onHashClick = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      scrollToHash(href);
      setMobileOpen(false);
    } else {
      setMobileOpen(false);
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color] duration-200",
        scrolled || mobileOpen
          ? "bg-black/90 border-b border-white/10"
          : "bg-black/40 border-b border-transparent"
      )}
    >
      <nav className="mx-auto max-w-[1400px] px-4 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-md"
            aria-label="VisionX Home"
          >
            <div className="relative h-8 w-8 rounded-md bg-gradient-to-br from-yellow-500/90 to-yellow-600/60 flex items-center justify-center ring-1 ring-yellow-400/30">
              <svg className="h-4.5 w-4.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 18a5 5 0 0 0-10 0" />
                <path d="M12 2v7" />
                <path d="M9 9h6" />
                <path d="M22 22H2" />
                <path d="M16 14v4" />
                <path d="M8 14v4" />
              </svg>
            </div>
            <span className="text-xl font-semibold tracking-tight text-white hidden sm:block">VISIONX</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onHashClick(link.href)}
                  className="text-sm font-medium text-white/70 hover:text-white transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:w-0 after:bg-yellow-400 hover:after:w-full after:transition-[width] after:duration-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <Button asChild variant="default" className="group relative overflow-hidden" size="sm">
              <Link href="/dashboard">
                Continue to VisionX
                <ArrowRight className="h-3.5 w-3.5 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          <button
            className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div
          id="mobile-menu"
          className={cn(
            "md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out border-t border-white/10",
            mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0 border-transparent"
          )}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="px-1 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-base font-medium text-white/70 hover:text-white transition-colors py-2"
                onClick={onHashClick(link.href)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/10" />
            <Button asChild className="w-full justify-start" variant="default" size="sm">
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                Continue to VisionX
                <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
}
