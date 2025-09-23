import { cpSync, mkdir, mkdirSync, writeFileSync, rmdirSync } from "fs";
import { AtpAgent } from "@atproto/api";
import type { PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { bskyEnv, config } from "./config.ts";

console.log("Authenticating...");
const agent = new AtpAgent({
  service: "https://bsky.social",
});

const authResponse = await agent.login({
  identifier: bskyEnv.identifier,
  password: bskyEnv.password,
});

if (!authResponse.success) {
  throw new Error(`Failed to authenticate for some reason.`);
}

console.log(`Authenticated as ${authResponse.data.handle}`);

const posts = new Map<string, PostView>();

for (const query of config.searchQueries) {
  await searchPosts(query);
}

console.log(`Found ${posts.size} total posts`);

const sortedPosts = [...posts.values()].sort(
  (postA, postB) =>
    new Date(postB.indexedAt).getTime() - new Date(postA.indexedAt).getTime()
);

rmdirSync(config.outputFolder, { recursive: true });

const xrpcPath = `${config.outputFolder}/xrpc`;
mkdirSync(xrpcPath, { recursive: true });

writeFileSync(
  `${xrpcPath}/app.bsky.feed.getFeedSkeleton`,
  JSON.stringify({
    feed: sortedPosts.map((post) => ({ post: post.uri })),
  })
);

cpSync("public", config.outputFolder, { recursive: true, force: true });

console.log(`Saved ${sortedPosts.length} posts to ${config.outputFolder}`);

async function searchPosts(query: string) {
  console.log(`Searching for: ${query}`);

  let cursor: string | undefined;
  let count = 0;

  while (count < config.postsPerQuery) {
    try {
      const response = await agent.app.bsky.feed.searchPosts({
        q: query,
        limit: 100,
        cursor,
      });

      response.data.posts.forEach((post) => {
        if (!isValidPost(post)) {
          return;
        }

        posts.set(post.uri, post);
        count++;
      });

      if (!response.data.cursor || response.data.posts.length === 0) break;
      cursor = response.data.cursor;
    } catch (error) {
      console.error(`Error searching for "${query}":`, error);
      break;
    }
  }

  console.log(`- Found ${count} posts for "${query}"`);
}

function isValidPost(post: PostView) {
  if (posts.has(post.uri)) {
    return false;
  }

  if (!post.embed) {
    return false;
  }

  if (!config.embedTypeAllowList.includes(post.embed.$type)) {
    return false;
  }

  const text = post.record.text;
  if (typeof text !== "string") {
    return false;
  }

  if (
    config.textDenyList.some((deniedText) =>
      text.toLowerCase().includes(deniedText)
    )
  ) {
    return false;
  }

  return true;
}
