import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const variants = {
    primary: "bg-coral text-white hover:bg-berry",
    secondary: "bg-mint text-spruce hover:bg-spruce hover:text-white",
    ghost: "bg-white text-ink hover:bg-blush border border-ink/10",
    danger: "bg-white text-berry hover:bg-berry hover:text-white border border-berry/20"
  };
  return (
    <button
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold transition ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-ink">
      {label}
      {children}
    </label>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`focus-ring min-h-11 rounded-2xl border border-ink/10 bg-white px-3 text-sm font-medium shadow-sm ${className}`}
      {...props}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="focus-ring min-h-11 rounded-2xl border border-ink/10 bg-white px-3 text-sm font-medium shadow-sm"
      {...props}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="focus-ring min-h-24 rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm font-medium shadow-sm"
      {...props}
    />
  );
}

export function Hearts({ value }: { value: number }) {
  return (
    <span aria-label={`${value} out of 5 want rating`} className="text-sm font-black text-berry">
      {"♥".repeat(value)}
      <span className="text-ink/20">{"♥".repeat(5 - value)}</span>
    </span>
  );
}
