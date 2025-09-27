import { AtpAgent, BlobRef, AppBskyFeedDefs } from "@atproto/api";
import fs from "fs/promises";
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

  let avatarRef: BlobRef | undefined;
  if (config.avatarPath) {
    let encoding: string;
    if (config.avatarPath.endsWith("png")) {
      encoding = "image/png";
    } else if (
      config.avatarPath.endsWith("jpg") ||
      config.avatarPath.endsWith("jpeg")
    ) {
      encoding = "image/jpeg";
    } else {
      throw new Error("expected png or jpeg");
    }
    const img = await fs.readFile(config.avatarPath);
    const blobRes = await agent.com.atproto.repo.uploadBlob(img, {
      encoding,
    });
    avatarRef = blobRes.data.blob;
  }

  await agent.com.atproto.repo.putRecord({
    repo: agent.session?.did ?? "",
    collection: ids.AppBskyFeedGenerator,
    rkey: config.recordName,
    record: {
      did: config.feedGenDid,
      displayName: config.displayName,
      description: config.description,
      avatar: avatarRef,
      createdAt: new Date().toISOString(),
      contentMode: config.videoOnly
        ? AppBskyFeedDefs.CONTENTMODEVIDEO
        : AppBskyFeedDefs.CONTENTMODEUNSPECIFIED,
    },
  });

  console.log("All done 🦊");
};

run();
