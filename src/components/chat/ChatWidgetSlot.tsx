/**
 * Mount point for the Smart AI chatbot.
 *
 * The spec requires the widget on every public page AND every portal page, so
 * the slot is placed in the shared shells from the start and the real widget
 * drops into it in Chunk 6 without touching any layout.
 *
 * It renders nothing today. A disabled launcher button would suggest a feature
 * that is not there yet.
 */
export function ChatWidgetSlot() {
  return null;
}
