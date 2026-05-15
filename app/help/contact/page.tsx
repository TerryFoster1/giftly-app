import { AppShell } from "@/components/shell";

export default function ContactPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
          <p className="text-sm font-black uppercase text-berry">Help</p>
          <h1 className="mt-1 text-3xl font-black">Contact Us</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-ink/60">
            Contact options are a placeholder for the MVP. A support form and email routing can be added later.
          </p>
        </section>
      </main>
    </AppShell>
  );
}
