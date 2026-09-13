"use client";

import dynamic from "next/dynamic";

/**
 * Mount point for the Smart AI chatbot.
 *
 * Spec Section 4 requires the widget on every public page AND every portal
 * page, so the slot sits in the shared shells and this is the only place that
 * decides what fills it.
 *
 * Loaded lazily and client-side only: the widget is interactive, below the
 * fold and not part of the content a crawler needs, so it should not delay
 * first paint or appear in server-rendered HTML.
 */
const ChatWidget = dynamic(
  () => import("@/components/chat/ChatWidget").then((m) => m.ChatWidget),
  { ssr: false },
);

export function ChatWidgetSlot() {
  return <ChatWidget />;
}
