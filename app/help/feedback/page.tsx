import { AppShell } from "@/components/shell";

export default function FeedbackPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
          <p className="text-sm font-black uppercase text-berry">Help</p>
          <h1 className="mt-1 text-3xl font-black">Feedback</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-ink/60">
            Feedback capture is a placeholder for now. This page keeps the account menu route ready without adding a full support system yet.
          </p>
        </section>
      </main>
    </AppShell>
  );
}
