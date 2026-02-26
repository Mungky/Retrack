"use client";

import { LandingHeader } from "./LandingHeader";
import { LandingHero } from "./LandingHero";
import { LandingFeatures } from "./LandingFeatures";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <main className="min-h-screen relative z-10">
      <LandingHeader />
      <LandingHero />
      <LandingFeatures />
      <LandingFooter />
    </main>
  );
}
