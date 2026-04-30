import { AuthForm } from "@/components/auth-form";
import { AppShell } from "@/components/shell";

export default function SignupPage() {
  return (
    <AppShell>
      <main className="px-4 py-10">
        <AuthForm mode="signup" />
      </main>
    </AppShell>
  );
}
