import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}

/**
 * The `sa-press` class supplies the lift, the press and a single light sweep on
 * hover. A spinner replaces the previous "Please wait…" text: it holds the
 * button's width steady, so a row of controls no longer reflows mid-submit.
 */
export function Button({
  variant = "primary",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "sa-press inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none";

  const styles = {
    primary: "bg-primary text-white hover:bg-primary-hover",
    secondary: "border border-border bg-bg hover:border-primary hover:text-primary",
    ghost: "text-muted hover:bg-surface hover:text-text",
  }[variant];

  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${styles} ${className}`}
    >
      {loading && <span className="sa-spinner" aria-hidden />}
      {children}
    </button>
  );
}
