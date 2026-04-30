import { AuthForm } from "@/components/auth-form";
import { AppShell } from "@/components/shell";

export default function LoginPage() {
  return (
    <AppShell>
      <main className="px-4 py-10">
        <AuthForm mode="login" />
      </main>
    </AppShell>
  );
}
