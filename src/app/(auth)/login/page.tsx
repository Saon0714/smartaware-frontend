import { redirect } from "next/navigation";

import { LOGIN_PATHS } from "@/lib/auth/destinations";

/**
 * `/login` is kept as a permanent entry point so existing links, bookmarks and
 * documentation continue to work. Clients are the larger audience, so it
 * resolves there; staff reach their tab through the toggle or /login/admin.
 */
export default async function LoginIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const query = next ? `?next=${encodeURIComponent(next)}` : "";
  redirect(`${LOGIN_PATHS.client}${query}`);
}
