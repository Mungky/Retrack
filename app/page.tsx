import { redirect } from "next/navigation";
import { getServerUserId } from "@/lib/auth-helpers";
import { LandingPage } from "@/components/landing/LandingPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const userId = await getServerUserId();
  if (userId) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
