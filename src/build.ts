import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import type { PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs.js";
import { config } from "./config.ts";
import { getAtpAgent } from "./atp.ts";

console.log("Authenticating...");
const agent = await getAtpAgent();

const posts = new Map<string, PostView>();

await Promise.all(
  config.searchQueries.map(async (query) => {
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
          if (posts.has(post.uri)) {
            return;
          }

          if (!config.filterPosts(post, query)) {
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
  })
);

console.log(`Found ${posts.size} total posts`);

const sortedPosts = [...posts.values()].sort(
  (postA, postB) =>
    new Date(postB.indexedAt).getTime() - new Date(postA.indexedAt).getTime()
);

if (existsSync(config.outputFolder)) {
  rmSync(config.outputFolder, { recursive: true });
}

const feedSkeletonFolder = `${config.outputFolder}/xrpc/app.bsky.feed.getFeedSkeleton`;
mkdirSync(feedSkeletonFolder, { recursive: true });

writeFileSync(
  `${feedSkeletonFolder}/index.json`,
  JSON.stringify({
    feed: sortedPosts.map((post) => ({ post: post.uri })),
  })
);

console.log(`Saved ${sortedPosts.length} posts to ${config.outputFolder}`);

console.log("Creating did.json...");

const did = {
  "@context": ["https://www.w3.org/ns/did/v1"],
  id: `did:web:${config.hostName}`,
  service: [
    {
      id: "#bsky_fg",
      type: "BskyFeedGenerator",
      serviceEndpoint: `https://${config.hostName}`,
    },
  ],
};

const didFolder = `${config.outputFolder}/.well-known`;
mkdirSync(didFolder, { recursive: true });

writeFileSync(`${didFolder}/did.json`, JSON.stringify(did));
