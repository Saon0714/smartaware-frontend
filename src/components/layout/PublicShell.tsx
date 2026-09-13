import type { ReactNode } from "react";

import { ChatWidgetSlot } from "@/components/chat/ChatWidgetSlot";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RegionProvider } from "@/lib/region/RegionProvider";
import { resolveRegion } from "@/lib/region/server";

/**
 * The market is resolved here, on the server, and handed to the provider so the
 * first render already matches the visitor's cookie. Reading it on the client
 * instead would show the wrong country for a frame on every page load.
 */
export async function PublicShell({ children }: { children: ReactNode }) {
  const { regions, active } = await resolveRegion();

  return (
    <RegionProvider regions={regions} initial={active}>
      <div className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <ChatWidgetSlot />
      </div>
    </RegionProvider>
  );
}
