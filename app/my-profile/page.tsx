import { AppShell } from "@/components/shell";
import { MyProfileClient } from "@/components/my-profile-client";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MyProfilePage() {
  if (!(await getCurrentUser())) redirect("/login");

  return (
    <AppShell>
      <MyProfileClient />
    </AppShell>
  );
}
