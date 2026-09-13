import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Staff sign in" };

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-muted">Loading…</p>}>
      <LoginForm audience="admin" />
    </Suspense>
  );
}
