import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingPage from "./LandingPage";

export type { UserPlan } from "./MarketplaceDashboardClient";

export default async function Page() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }
  return <LandingPage />;
}
