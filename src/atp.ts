import { AtpAgent } from "@atproto/api";
import { bskyEnv } from "./env.ts";
import { config } from "./config.ts";

export async function getAtpAgent() {
  const agent = new AtpAgent({
    service: config.atpService ? config.atpService : "https://bsky.social",
  });

  const authResponse = await agent.login({
    identifier: bskyEnv.identifier,
    password: bskyEnv.password,
  });

  if (!authResponse.success) {
    throw new Error(`Failed to authenticate for some reason.`);
  }

  console.log(`Authenticated as ${authResponse.data.handle}`);

  return agent;
}
