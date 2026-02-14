import { password } from "@inquirer/prompts";
import { parseArgs } from "util";
import { KickClient } from "@manaobot/kick";
import type { KickScopes, KickTokenResponse } from "@manaobot/kick/types";
import open from "open";
import { isKickScope } from "./utils";

function parseCli() {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      clientId: { type: "string", short: "i" },
      clientSecret: { type: "string", short: "s" },
      scopes: { type: "string" },
      "save-env": { type: "boolean" },
      port: { type: "string", short: "p" },
    },
    strict: true,
    allowPositionals: true,
  });

  return values;
}

const values = parseCli();

async function resolveConfig() {
  if (!values.scopes) {
    throw new Error(
      "Scopes are required. Provide them using --scopes (comma or space separated).",
    );
  }

  const clientId = values.clientId
    ? values.clientId.trim()
    : (await password({ message: "Enter your Client ID:" })).trim();

  const clientSecret = values.clientSecret
    ? values.clientSecret.trim()
    : (await password({ message: "Enter your Client Secret:" })).trim();

  const rawScopes = values.scopes
    .split(/[,\s]+/)
    .map((s: string) => s.trim())
    .filter(Boolean);

  const scopes: KickScopes[] = [];
  const invalid: string[] = [];

  for (const scope of rawScopes) {
    if (isKickScope(scope)) scopes.push(scope);
    else invalid.push(scope);
  }

  if (!scopes.length) {
    throw new Error("No valid scopes provided.");
  }

  if (invalid.length) {
    console.warn("⚠ Invalid scopes ignored:", invalid.join(", "));
  }

  return {
    clientId,
    clientSecret,
    scopes,
    saveEnv: Boolean(values["save-env"]),
  };
}

async function handleTokens(tokens: KickTokenResponse, saveEnv: boolean) {
  const expiresAt = tokens.expires_at ?? Date.now();

  if (!saveEnv) {
    console.log("\n[!] Copy these into your .env file:\n");
    console.log(`KICK_ACCESS_TOKEN=${tokens.access_token}`);
    console.log(`KICK_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log(`KICK_EXPIRES_AT=${expiresAt}`);
    console.log(`\n====> Scopes granted: ${tokens.scope}`);
    process.exit(0);
  }

  const file = Bun.file(".env");
  let envContent = (await file.exists()) ? await file.text() : "";

  const replaceOrAppend = (key: string, value: string) => {
    const regex = new RegExp(`^${key}=.*$`, "m");
    const line = `${key}=${value}`;

    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, line);
    } else {
      if (envContent.length && !envContent.endsWith("\n")) {
        envContent += "\n";
      }
      envContent += line + "\n";
    }
  };

  replaceOrAppend("KICK_ACCESS_TOKEN", tokens.access_token);
  replaceOrAppend("KICK_REFRESH_TOKEN", tokens.refresh_token);
  replaceOrAppend("KICK_EXPIRES_AT", String(expiresAt));

  await Bun.write(".env", envContent);

  console.log("\n[!] Tokens have been saved to your .env file.");
  console.log(`\n====> Scopes granted: ${tokens.scope}`);
}

async function run(port: number) {
  const config = await resolveConfig();

  const kick = new KickClient({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: `http://localhost:${port}/callback`,
    scopes: config.scopes,
    showLog: false,
    auth: {
      onTokenUpdate: (tokens) => handleTokens(tokens, config.saveEnv),
    },
  });

  kick.auth.createCallbackServer({ port });

  await open(kick.getAuthURL());
  await kick.auth.waitForAuthorization();
}

const port = values.port ? parseInt(String(values.port), 10) : 3000;
await run(Number.isNaN(port) ? 3000 : port);
