import { KickClient } from "@manaobot/kick";
import type { ChatMessageEvent } from "@manaobot/kick/types";
import type {
  CommandHandler,
  KickItContext,
  KickItOptions,
  NgrokOptions,
} from "../types";

export class KickIt {
  private commands = new Map<string, CommandHandler>();
  private readonly prefix: string;
  private readonly ngrokOptions?: NgrokOptions;
  private started = false;

  public readonly kickClient: KickClient;

  constructor(options: KickItOptions) {
    this.prefix = options.prefix ?? "!";
    this.ngrokOptions = options.ngrok;

    this.kickClient = new KickClient({
      clientId: options.auth.clientId,
      clientSecret: options.auth.clientSecret,
      auth: {
        initialTokens: {
          access_token: options.auth.accessTokens,
          refresh_token: options.auth.refreshTokens
        }
      },
      scopes: options.auth.scopes,
      redirectUri: "http://localhost:3000/callback",
    });
  }

  /**
   * Register a command handler
   */
  command(name: string, handler: CommandHandler) {
    this.commands.set(name.toLowerCase(), handler);
  }

  /**
   * Ensure webhook server exists
   */
  private async initServer() {
    const port = this.ngrokOptions?.port ?? 5000;
    const path = this.ngrokOptions?.path ?? "/kick/webhook";

    if (this.ngrokOptions) {
      const { url } = await this.kickClient.webhooks.ngrok({
        port,
        path,
        domain: this.ngrokOptions.domain,
        authtoken: this.ngrokOptions.authtoken,
      });

      console.log(`[✔] ngrok tunnel established at: ${url}`);
    }

    this.kickClient.webhooks.createServer({ port, path });
  }

  /**
   * Start KickIt
   */
  async start(): Promise<void> {
    if (this.started) {
      console.warn("[KickIt] start() called more than once.");
      return;
    }
    this.started = true;

    await this.initServer();

    await this.kickClient.webhooks.subscribe({
      events: [{ name: "chat.message.sent" }],
    });

    this.kickClient.webhooks.on(
      "chat.message.sent",
      async (event: ChatMessageEvent) => {
        const message = event.content.trim();

        if (!message.startsWith(this.prefix)) return;

        const parts = message.slice(this.prefix.length).trim().split(/ +/);

        const commandName = parts.shift()?.toLowerCase();
        if (!commandName) return;

        const command = this.commands.get(commandName);
        if (!command) return;

        const ctx: KickItContext = {
          bot: this,
          client: this.kickClient,
          event,
          args: parts,
          reply: (content: string) => this.kickClient.chat.send({ content }),
        };

        try {
          await command(ctx);
        } catch (err) {
          console.error("[KickIt] Command error:", err);
        }
      },
    );

    console.log("[✔] KickIt client initialized.");
  }
}
