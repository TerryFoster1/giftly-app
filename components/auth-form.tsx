"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button, Field, Input } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  const passwordLengthError = mode === "signup" && form.password.length > 0 && form.password.length < 8;
  const passwordMatchError =
    mode === "signup" &&
    form.password.length >= 8 &&
    form.confirmPassword.length > 0 &&
    form.password !== form.confirmPassword;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (mode === "signup") {
      if (!form.password || !form.confirmPassword || form.password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password
      })
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
        <div className="grid gap-2">
          <div className="relative">
            <Input
              required
              className="w-full pr-12"
              type={showPassword ? "text" : "password"}
              minLength={8}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
            <button
              type="button"
              className="focus-ring absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-ink/60 hover:bg-cloud hover:text-ink"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {passwordLengthError ? <p className="text-sm font-bold text-berry">Password must be at least 8 characters.</p> : null}
        </div>
      </Field>
      {mode === "signup" ? (
        <Field label="Confirm password">
          <div className="grid gap-2">
            <div className="relative">
              <Input
                required
                className="w-full pr-12"
                type={showConfirmPassword ? "text" : "password"}
                minLength={8}
                value={form.confirmPassword}
                onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
              />
              <button
                type="button"
                className="focus-ring absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-ink/60 hover:bg-cloud hover:text-ink"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordMatchError ? <p className="text-sm font-bold text-berry">Passwords do not match.</p> : null}
          </div>
        </Field>
      ) : null}
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
