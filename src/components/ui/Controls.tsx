import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const base =
  "mt-1.5 block w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-[color-mix(in_srgb,var(--sa-color-primary)_40%,var(--sa-color-border))] focus:border-primary focus:ring-4 focus:ring-primary/12 disabled:opacity-60";

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${base} min-h-24 ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${base} ${props.className ?? ""}`} />;
}

export function Checkbox({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="mt-1.5 flex items-center gap-2 text-sm">
      <input
        {...props}
        type="checkbox"
        className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
      />
      {label}
    </label>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "border-border bg-surface text-muted",
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/40 bg-warning/10 text-[var(--sa-warning-500)]",
    danger: "border-danger/30 bg-danger/10 text-danger",
  } as const;
  return (
    <span
      className={`sa-fade inline-flex items-center rounded-full border px-2 py-0.5 text-xs transition-colors duration-200 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="sa-fade flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <span aria-hidden className="sa-accent-bar mt-2" />
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="sa-fade rounded-lg border border-dashed border-border bg-surface/50 p-8 text-center text-sm text-muted">
      {children}
    </p>
  );
}
