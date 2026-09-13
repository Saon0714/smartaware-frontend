import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Client sign in" };

export default function ClientLoginPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-muted">Loading…</p>}>
      <LoginForm audience="client" />
    </Suspense>
  );
}
