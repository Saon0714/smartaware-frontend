/**
 * Smart AI chat.
 *
 * One endpoint serves both placements, and it is called anonymously from both.
 * Nothing said to Smart AI is recorded, so there is no transcript for an
 * account to be attached to — the conversation is held in the browser and the
 * earlier turns travel back with each question so the model has context.
 * Spec 4.1 keeps it FAQ-only everywhere.
 */

import { apiFetch, type ApiPaths } from "./client";

type Json<T> = T extends { content: { "application/json": infer R } } ? R : never;

export type AskResponse = Json<
  ApiPaths["/api/v1/public/chat"]["post"]["responses"][200]
>;

export type ChatTurn = { role: "user" | "assistant"; content: string };

export function askSmartAi(
  question: string,
  history: readonly ChatTurn[],
): Promise<AskResponse> {
  return apiFetch<AskResponse>("/public/chat", {
    method: "POST",
    body: { question, history },
  });
}
