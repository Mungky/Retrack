import { getServerUserId } from "@/lib/auth-helpers";
import { LandingPage } from "@/components/landing/LandingPage";
import { ClientRedirect } from "@/components/ClientRedirect";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const userId = await getServerUserId();
  if (userId) {
    return <ClientRedirect to="/dashboard" />;
  }

  return <LandingPage />;
}
