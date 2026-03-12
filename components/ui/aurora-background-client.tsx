"use client";

import dynamic from "next/dynamic";

const AuroraBackground = dynamic(
  () => import("./aurora-background").then((m) => ({ default: m.AuroraBackground })),
  { ssr: false }
);

export function AuroraBackgroundClient() {
  return <AuroraBackground />;
}
