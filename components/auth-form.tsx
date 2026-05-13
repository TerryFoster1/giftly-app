"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import { Button, Field, Input } from "./ui";

const errorMessages: Record<string, string> = {
  invalid: "Invalid email or password.",
  taken: "That email may already be in use.",
  weak: "Use a valid email and a password of at least 8 characters.",
  config: "Signup is temporarily unavailable. Please try again soon.",
  other: "Something went wrong. Please try again."
};

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const searchParams = useSearchParams();
  const initialErrorCode = searchParams?.get("error") ?? "";
  const initialErrorMessage = errorMessages[initialErrorCode] ?? "";

  const [error, setError] = useState(initialErrorMessage);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  const passwordChecks = {
    length: form.password.length >= 8,
    number: /\d/.test(form.password),
    special: /[^A-Za-z0-9]/.test(form.password),
    match: form.confirmPassword.length > 0 && form.password === form.confirmPassword
  };
  const signupPasswordIsValid = Object.values(passwordChecks).every(Boolean);

  function Requirement({ met, children }: { met: boolean; children: React.ReactNode }) {
    return (
      <li className={`flex items-center gap-2 text-xs font-bold ${met ? "text-spruce" : "text-ink/50"}`}>
        <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${met ? "bg-mint text-spruce" : "bg-cloud text-ink/30"}`}>
          {met ? <Check size={12} /> : null}
        </span>
        {children}
      </li>
    );
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    if (mode === "signup") {
      if (!form.password || !form.confirmPassword || !passwordChecks.length) {
        event.preventDefault();
        setError("Password must be at least 8 characters.");
        return;
      }

      if (!passwordChecks.match) {
        event.preventDefault();
        setError("Passwords do not match.");
        return;
      }

      if (!signupPasswordIsValid) {
        event.preventDefault();
        return;
      }
    }

    setError("");
    setLoading(true);
<<<<<<< Updated upstream

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      credentials: "include",
      mode: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password
      })
    });

    if (response.ok) {
      await response.text().catch(() => null);
      window.location.href = mode === "signup" ? "/profiles" : "/dashboard";
      return;
    }

    const body = await response.json().catch(() => ({ message: "Something went wrong." }));
    setError(body.message);
    setLoading(false);
=======
>>>>>>> Stashed changes
  }

  return (
    <form
      onSubmit={submit}
      action={`/api/auth/${mode}`}
      method="POST"
      className="mx-auto grid w-full max-w-md gap-4 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft"
    >
      <div>
        <p className="text-sm font-black uppercase text-berry">{mode === "login" ? "Welcome back" : "Create account"}</p>
        <h1 className="text-3xl font-black">{mode === "login" ? "Log in to Giftly" : "Start Giftly"}</h1>
      </div>
      {mode === "signup" ? (
        <Field label="Name">
          <Input required name="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
      ) : null}
      <Field label="Email">
        <Input required name="email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
      </Field>
      <Field label="Password">
        <div className="grid gap-2">
          <div className="relative">
            <Input
              required
              name="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
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
          {mode === "signup" && form.password.length > 0 && !passwordChecks.length ? (
            <p className="text-sm font-bold text-berry">Password must be at least 8 characters.</p>
          ) : null}
        </div>
      </Field>
      {mode === "signup" ? (
        <Field label="Confirm password">
          <div className="grid gap-2">
            <div className="relative">
              <Input
                required
                name="confirmPassword"
                autoComplete="new-password"
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
            {form.confirmPassword.length > 0 && !passwordChecks.match ? <p className="text-sm font-bold text-berry">Passwords do not match.</p> : null}
            <ul className="grid gap-1 rounded-2xl bg-cloud p-3">
              <Requirement met={passwordChecks.length}>8+ characters</Requirement>
              <Requirement met={passwordChecks.number}>At least 1 number</Requirement>
              <Requirement met={passwordChecks.special}>At least 1 special character</Requirement>
              <Requirement met={passwordChecks.match}>Passwords match</Requirement>
            </ul>
          </div>
        </Field>
      ) : null}
      {error ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{error}</p> : null}
      <Button type="submit" disabled={loading || (mode === "signup" && !signupPasswordIsValid)}>{loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}</Button>
      <p className="text-center text-sm font-bold text-ink/60">
        {mode === "login" ? "Need an account? " : "Already have an account? "}
        <Link className="text-spruce underline" href={mode === "login" ? "/signup" : "/login"}>
          {mode === "login" ? "Sign up" : "Log in"}
        </Link>
      </p>
    </form>
  );
}
