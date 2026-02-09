import type { KickScopes } from "@manaobot/kick/types";

const VALID_SCOPES: KickScopes[] = [
  "user:read",
  "channel:read",
  "channel:write",
  "channel:rewards:read",
  "channel:rewards:write",
  "chat:write",
  "streamkey:read",
  "events:subscribe",
  "moderation:ban",
  "moderation:chat_message:manage",
  "kicks:read",
];

export function isKickScope(value: string): value is KickScopes {
  return VALID_SCOPES.includes(value as KickScopes);
}
