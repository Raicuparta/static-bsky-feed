import { config } from "./config.ts";
import { ids } from "@atproto/api/dist/client/lexicons.js";
import { getAtpAgent } from "./atp.ts";

const run = async () => {
  const agent = await getAtpAgent();

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
