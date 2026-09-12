"use client";

import { useCallback, useEffect, useState } from "react";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { LoadingScreen } from "./LoadingScreen";
import { LandingNavbar } from "./Navbar";
import { Hero } from "./Hero";
import { About } from "./About";
import { ProblemSolution } from "./ProblemSolution";
import { Technology } from "./Technology";
import { Demo } from "./Demo";
import { RestorationXRayPreview } from "./RestorationXRayPreview";
import { Footer } from "./Footer";
import { BackgroundParticles } from "@/components/ui/background-particles";

export function LandingPage() {
  const [loadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("visionx-loaded") === "1") {
        setLoadingComplete(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleLoadingComplete = useCallback(() => {
    try {
      sessionStorage.setItem("visionx-loaded", "1");
    } catch {
      /* ignore */
    }
    setLoadingComplete(true);
  }, []);

  if (!loadingComplete) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  return (
    <div className="min-h-screen bg-black relative">
      <BackgroundParticles
        particleCount={16}
        speed={0.08}
        enableConnections={false}
        className="fixed inset-0 z-0"
      />
      <CustomCursor />
      <LandingNavbar />
      <main id="main-content" className="relative z-10">
        <Hero />
        <About />
        <ProblemSolution />
        <Technology />
        <Demo />
        <RestorationXRayPreview />
        <Footer />
      </main>
    </div>
  );
}
