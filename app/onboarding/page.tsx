import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { OnboardingClient } from "@/components/onboarding-client";
import { getCurrentUser } from "@/lib/auth";

export default async function OnboardingPage() {
  if (!(await getCurrentUser())) redirect("/login");

  return (
    <AppShell>
      <OnboardingClient />
    </AppShell>
  );
}
