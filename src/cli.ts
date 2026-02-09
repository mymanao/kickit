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
    },
    strict: true,
    allowPositionals: true,
  });

  return values;
}

async function resolveConfig() {
  const values = parseCli();

  if (!values.scopes) {
    throw new Error(
      "Scopes are required. Please provide them using the --scopes argument.",
    );
  }

  const clientId = values.clientId
    ? values.clientId.trim()
    : (await password({ message: "Enter your Client ID:" })).trim();

  const clientSecret = values.clientSecret
    ? values.clientSecret.trim()
    : (await password({ message: "Enter your Client Secret:" })).trim();

  const rawScopes = values.scopes.split(",").map((s) => s.trim());

  const scopes: KickScopes[] = [];
  const invalid: string[] = [];

  for (const scope of rawScopes) {
    if (isKickScope(scope)) scopes.push(scope);
    else invalid.push(scope);
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
  if (!saveEnv) {
    console.log("\n[!] Copy these into your .env file:\n");
    console.log(`KICK_ACCESS_TOKEN=${tokens.access_token}`);
    console.log(`KICK_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log(`\n====> Scopes granted: ${tokens.scope}`);
    process.exit(0);
  }

  const file = Bun.file(".env");

  let envContent = (await file.exists()) ? await file.text() : "";

  const accessTokenRegex = /^KICK_ACCESS_TOKEN=.*$/m;
  const refreshTokenRegex = /^KICK_REFRESH_TOKEN=.*$/m;

  if (accessTokenRegex.test(envContent)) {
    envContent = envContent.replace(
      accessTokenRegex,
      `KICK_ACCESS_TOKEN=${tokens.access_token}`,
    );
  } else {
    envContent += `\nKICK_ACCESS_TOKEN=${tokens.access_token}`;
  }

  if (refreshTokenRegex.test(envContent)) {
    envContent = envContent.replace(
      refreshTokenRegex,
      `KICK_REFRESH_TOKEN=${tokens.refresh_token}`,
    );
  } else {
    envContent += `\nKICK_REFRESH_TOKEN=${tokens.refresh_token}`;
  }

  await Bun.write(".env", envContent.trimStart());

  console.log("\n[!] Tokens have been saved to your .env file.");
  console.log(`\n====> Scopes granted: ${tokens.scope}`);

  process.exit(0);
}

async function run() {
  const config = await resolveConfig();

  const kick = new KickClient({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: "http://localhost:3000/callback",
    scopes: config.scopes,
    showLog: false,
    auth: {
      onTokenUpdate: (tokens) => handleTokens(tokens, config.saveEnv),
    },
  });

  kick.auth.createCallbackServer({ port: 3000 });

  await open(kick.getAuthURL());
  await kick.auth.waitForAuthorization();
}

await run();
