"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Field, Input } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (response.ok) {
      window.location.href = mode === "signup" ? "/profiles" : "/dashboard";
      return;
    }

    const body = await response.json().catch(() => ({ message: "Something went wrong." }));
    setError(body.message);
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="mx-auto grid w-full max-w-md gap-4 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
      <div>
        <p className="text-sm font-black uppercase text-berry">{mode === "login" ? "Welcome back" : "Create account"}</p>
        <h1 className="text-3xl font-black">{mode === "login" ? "Log in to Giftly" : "Start Giftly"}</h1>
      </div>
      {mode === "signup" ? (
        <Field label="Name">
          <Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
      ) : null}
      <Field label="Email">
        <Input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
      </Field>
      <Field label="Password">
        <Input required type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
      </Field>
      {error ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{error}</p> : null}
      <Button type="submit" disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}</Button>
      <p className="text-center text-sm font-bold text-ink/60">
        {mode === "login" ? "Need an account? " : "Already have an account? "}
        <Link className="text-spruce underline" href={mode === "login" ? "/signup" : "/login"}>
          {mode === "login" ? "Sign up" : "Log in"}
        </Link>
      </p>
      <p className="rounded-2xl bg-cloud p-3 text-xs font-bold text-ink/60">
        Demo login: demo@giftly.local / giftly-demo-123
      </p>
    </form>
  );
}
