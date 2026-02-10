<p align="center">
  <a href="https://github.com/tinarskii/manao">
    <img src="https://raw.githubusercontent.com/tinarskii/manao/main/docs/manao.svg" height="64px" width="auto" />
    <h2 align="center">KickIt</h2>
  </a>
  <p align="center">
    Lightweight command framework for building Kick.com bots on top of <code>@manaobot/kick</code>.
    Designed for Bun. Built for simplicity.
  </p>
  <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
    <img src="https://img.shields.io/npm/v/@manaobot/kickit?color=00e701" alt="npm version">
    <img src="https://img.shields.io/github/license/tinarskii/manao" />
    <img src="https://img.shields.io/badge/Bun-%E2%9C%93-black?logo=bun" alt="Bun Compatible">
    <a href="https://discord.gg/vkW7YMyYaf"><img src="https://img.shields.io/discord/964718161624715304" /></a>
  </div>
</p>

---

## ⚡ About

**KickIt** is a minimal command framework built on top of `@manaobot/kick`.

It provides a clean abstraction for:

- Command handling
- Context-based message responses
- Webhook-driven bots
- Optional ngrok integration

KickIt does **not** replace the SDK — it extends it with a simple developer experience.

---

## 📦 Installation

```bash
bun add @manaobot/kickit
```

KickIt optionally supports ngrok for local development. To enable ngrok support, also install the ngrok package:

```bash
bun add @ngrok/ngrok
```

---

## 🚀 Quick Start

```ts
import {KickIt} from "../src";

const bot = new KickIt({
  prefix: "!",
  auth: {
    clientId: Bun.env.KICK_CLIENT_ID!,
    clientSecret: Bun.env.KICK_CLIENT_SECRET!,
    accessTokens: Bun.env.KICK_ACCESS_TOKEN!,
    refreshTokens: Bun.env.KICK_REFRESH_TOKEN!,
    scopes: ["chat:write", "events:subscribe", "moderation:ban", "channel:read"],
  },
  ngrok: {
    authtoken: Bun.env.NGROK_AUTHTOKEN,
    domain: "topical-goshawk-leading.ngrok-free.app",
    port: 5000,
    path: "/kick/webhook",
  },
});

bot.command("ping", async (ctx) => {
  await ctx.reply("pong 🏓");
});

bot.command("love", async (ctx) => {
  const target = ctx.args.join(" ") || ctx.event.sender.username;
  const percent = Math.floor(Math.random() * 101);

  await ctx.reply(
    `${ctx.event.sender.username} ❤️ ${target}: ${percent}%`
  );
});

await bot.start();
```

---

## ✨ Features

### ⚡ Command Framework

```ts
bot.command("hello", async (ctx) => {
  await ctx.reply("Hello chat!");
});
```

- Prefix-based commands
- Context-driven handlers
- Async support

---

### 🧠 Context API

Every command receives a structured context:

```ts
ctx.client   // KickClient instance
ctx.event    // Raw webhook event
ctx.args     // Command arguments
ctx.reply()  // Send chat message
```

This keeps KickIt lightweight while still giving full access to the SDK.

---

### 🔗 Built on @manaobot/kick

KickIt uses the official SDK internally:

- OAuth authentication
- Webhook subscriptions
- REST API access
- Chat messaging

You can still access the SDK directly:

```ts
ctx.client.api.users.get()
```

---

### 🌐 ngrok Support

Local development is easy:

```ts
ngrok: {
  authtoken: "...",
  domain: "your-domain.ngrok-free.app"
}
```

KickIt automatically:

- starts webhook server
- opens ngrok tunnel
- subscribes to events

---

## 📚 Example

```ts
bot.command("love", async (ctx) => {
  const target = ctx.args.join(" ") || ctx.event.sender.username;
  const percent = Math.floor(Math.random() * 101);

  await ctx.reply(`${ctx.event.sender.username} ❤️ ${target}: ${percent}%`);
});
```

---

## 🧱 Philosophy

KickIt is intentionally minimal.

It focuses only on:

- Command handling
- Context abstraction
- Developer ergonomics

It does **not** attempt to replace the underlying SDK.

If you need low-level control, use:

```ts
ctx.client
```

---

## 🤝 Contributing

Pull requests are welcome.

You can help by:

- improving typings
- adding examples
- suggesting framework features

Join the Discord server:

https://discord.gg/vkW7YMyYaf

---

## 📜 License

GPL-3.0 License  
See LICENSE file for details.

---

## ❤️ Part of the Manao Ecosystem

KickIt works alongside:

- `@manaobot/kick` — Core SDK
- KickIt — Command framework
