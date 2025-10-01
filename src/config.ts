import type { PostView } from "@atproto/api/dist/client/types/app/bsky/feed/defs.js";

type Config<TQueries extends readonly string[] = readonly string[]> = {
  /** Domain or subdomain where everything will be hosted. Can't be a path within a domain/subdomain,
   * because did.json must be at the root of a domain/subdomain. */
  hostName: string;

  /** Name of the feed, visible to the public. */
  displayName: string;

  /** Optional description shown to the public. */
  description?: string;

  /** Local path to an avatar that will be used for the feed. */
  avatarPath?: string;

  /** Custom PDS service to sign in with. Defaults to "https://bsky.social". */
  atpService?: string;

  /** Setting this to true for video-only feeds will allow for an "immersive" video experience within the app. */
  videoOnly?: boolean;

  /** Each string in this list results in a separate batch of queries sent to the Bluesky API.
   * The API doesn't support OR, AND, etc, and max 100 results per query, so each item in this list means more requests.
   * From what I can tell, if you want both "word" and "#word", just include "word" in the list.
   * Avoid redundancy, since that means more queries. */
  searchQueries: TQueries;

  /** The target number of posts we want per query defined in searchQueries.
   * This takes into account the posts that get filtered out by other criteria in this config.
   * Queries are requested from the API, filtered, and paginated (one request per page),
   * until we reach this number, or we run out of posts. */
  postsPerQuery: number;

  /** Filter posts after querying (return true to keep, false to discard).
   * This happens after posts have been fetched from the API using searchQueries.
   * You can use whatever criteria you want here. Check the type definitions for PostView for data you can use.
   * The query string passed here is one of the query strings you defined in searchQueries above,
   * so you can change your filters based on the current query. */
  filterPosts: (post: PostView, query: TQueries[number]) => boolean;
};

function createConfig<const TQueries extends readonly string[]>(
  config: Config<TQueries>
): Config<TQueries> {
  return config;
}

export const config = createConfig({
  hostName: "bsky.raicuparta.com",

  displayName: "Game Modding",

  description: "Posts related to modding games.",

  avatarPath: "assets/avatar.png",

  searchQueries: ["#modding", "#gamemodding", "lang:en #mod"],

  postsPerQuery: 100,

  filterPosts: (post: PostView, _query) => {
    if (!post.embed) {
      return false;
    }

    const validEmbedTypes = [
      "app.bsky.embed.images#view",
      "app.bsky.embed.video#view",
      "app.bsky.embed.recordWithMedia#view",
      "app.bsky.embed.external#view",
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
      "UGC",
      "#electronics",
      "modchip",
      "#sewing",
      "#DIY",
      "#MinisterOfDefense",
      "#vinyl",
      "#fashion",
      "#model",
      "#modeling",
    ];

    const lowerText = text.toLowerCase();
    if (
      deniedKeywords.some((deniedText) =>
        new RegExp(`(^|\\s)${deniedText.toLowerCase()}($|\\s)`, "i").test(
          lowerText
        )
      )
    ) {
      return false;
    }

    const tagCount = (text.match(/#/g) || []).length;
    if (tagCount > 6) {
      // Somewhat arbitrary cuttoff to avoid tag spam.
      return false;
    }

    if (text.includes("#MoD") || text.includes("#MOD")) {
      // Spelling the tag like this usually means it's an acronym.
      return false;
    }

    return true;
  },
});
