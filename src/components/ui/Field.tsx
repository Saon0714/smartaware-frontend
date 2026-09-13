import type { InputHTMLAttributes, ReactNode } from "react";

export function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium">
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`mt-1.5 block w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-[color-mix(in_srgb,var(--sa-color-primary)_40%,var(--sa-color-border))] focus:border-primary focus:ring-4 focus:ring-primary/12 disabled:opacity-60 ${props.className ?? ""}`}
    />
  );
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-sm text-danger">
      {children}
    </p>
  );
}

export function FormBanner({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  const styles =
    tone === "error"
      ? "border-danger/30 bg-danger/5 text-danger"
      : "border-border bg-surface text-muted";
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={`sa-panel-in rounded-md border px-3 py-2.5 text-sm ${styles}`}
    >
      {children}
    </div>
  );
}
