/**
 * Smart AI chat.
 *
 * One endpoint serves both placements. On portal pages `apiFetch` attaches the
 * access token, which lets the backend attribute the transcript — it does not
 * widen what the bot can see. Spec 4.1 keeps it FAQ-only everywhere.
 */

import { apiFetch, type ApiPaths } from "./client";

type Json<T> = T extends { content: { "application/json": infer R } } ? R : never;

export type AskResponse = Json<
  ApiPaths["/api/v1/public/chat"]["post"]["responses"][200]
>;

export function askSmartAi(
  question: string,
  sessionToken: string | null,
): Promise<AskResponse> {
  return apiFetch<AskResponse>("/public/chat", {
    method: "POST",
    body: { question, session_token: sessionToken },
  });
}
