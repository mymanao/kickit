import type { ChatMessageEvent, KickScopes } from "@manaobot/kick/types";
import { KickClient } from "@manaobot/kick";
import type { KickIt } from "./src";

export interface NgrokOptions {
  authtoken?: string;
  domain?: string;
  port?: number;
  path?: string;
}

export interface KickItOptions {
  prefix?: string;
  auth: {
    clientId: string;
    clientSecret: string;
    accessToken: string;
    refreshToken: string;
    scopes: KickScopes[];
  };
  ngrok?: NgrokOptions;
}

export interface KickItContext {
  bot: KickIt;
  client: KickClient;
  event: ChatMessageEvent;
  args: string[];
  reply: (content: string) => Promise<any>;
}

export type CommandHandler = (ctx: KickItContext) => Promise<void> | void;
