import type { PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs";

export const config = {
  // Each string in this list results in a separate batch of queries sent to the Bluesky API.
  // The API doesn't support OR, AND, etc, and max 100 results per query, so each item in this list means more requests.
  // From what I can tell, if you want both "word" and "#word", just include "word" in the list.
  // Avoid redundancy, since that means more queries.
  searchQueries: ["#procedural", "procgen"],

  // The target number of posts we want per query defined in searchQueries.
  // This takes into account the posts that get filtered out by other criteria in this config.
  // Queries are requested from the API, filtered, and paginated (one request per page),
  // until we reach this number, or we run out of posts.
  postsPerQuery: 500,

  // Path of folder to place the static site files.
  outputFolder: "output",

  // Filter posts after querying (return true to keep, false to discard).
  // This happens after posts have been fetched from the API using searchQueries.
  // You can use whatever criteria you want here. Check the type definitions for PostView for data you can use.
  filterPosts: (post: PostView) => {
    if (!post.embed) {
      return false;
    }

    const validEmbedTypes = [
      "app.bsky.embed.images#view",
      "app.bsky.embed.video#view",
      "app.bsky.embed.recordWithMedia#view",
      // "app.bsky.embed.external#view",
      // "app.bsky.embed.record#view",
    ];

    if (!validEmbedTypes.includes(post.embed.$type)) {
      return false;
    }

    const text = post.record.text;
    if (typeof text !== "string") {
      return false;
    }

    const deniedKeywords = [
      "#ai",
      "#aiart",
      "#tv",
      "#tvseries",
      "#tvshow",
      "#abc",
    ];

    const lowerText = text.toLowerCase();
    if (
      deniedKeywords.some((deniedText) =>
        new RegExp(`\\b${deniedText.toLowerCase()}\\b`, "i").test(lowerText)
      )
    ) {
      return false;
    }

    return true;
  },
};
