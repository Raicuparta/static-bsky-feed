import { ids } from "@atproto/api/dist/client/lexicons.js";
import { getAtpAgent } from "./atp.ts";
import { getRecordNameArg } from "./record-name-arg.ts";

const run = async () => {
  const recordName = getRecordNameArg("unpublish");
  const agent = await getAtpAgent();

  const repo = agent.session?.did;

  if (!repo) {
    throw new Error("Failed to get atproto session or DID.");
  }

  await agent.com.atproto.repo.deleteRecord({
    repo,
    collection: ids.AppBskyFeedGenerator,
    rkey: recordName,
  });

  console.log("All done 🐌");
};

run();
