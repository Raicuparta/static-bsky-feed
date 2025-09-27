import { AtpAgent } from "@atproto/api";
import { config } from "./config.ts";
import { bskyEnv } from "./env.ts";
import { ids } from "@atproto/api/dist/client/lexicons.js";

const run = async () => {
  const agent = new AtpAgent({
    service: config.atpService ? config.atpService : "https://bsky.social",
  });
  await agent.login({
    identifier: bskyEnv.identifier,
    password: bskyEnv.password,
  });

  const repo = agent.session?.did;

  if (!repo) {
    throw new Error("Failed to get atproto session or DID.");
  }

  await agent.com.atproto.repo.deleteRecord({
    repo,
    collection: ids.AppBskyFeedGenerator,
    rkey: config.recordName,
  });

  console.log("All done 🐌");
};

run();
