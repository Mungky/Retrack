"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Client-side redirect to avoid React #310 "Rendered more hooks" when
 * server redirect() conflicts with layout client components calling server actions.
 * Use this instead of redirect() from next/navigation in pages that share
 * a layout with components like SubscriptionSync that call server actions.
 */
export function ClientRedirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [to, router]);
  return null;
}
