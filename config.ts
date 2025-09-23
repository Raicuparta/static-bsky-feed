export const config = {
  // Each string in this list results in a separate batch of queries sent to the Bluesky API.
  // The API doesn't support OR, AND, etc, and max 100 resulst per query, so each item in this list means more requests.
  // From what I can tell, if you want both "word" and "#word", just include "word" in the list.
  // Avoid redundancy, since that means more queries.
  searchQueries: ["#procedural", "procgen"],

  // The target number of posts we want per query defined in searchQueries.
  // This takes into account the posts that get filtered out by other criteria in this config.
  // Queries are requested from the API, filtered, and paginated (one request per page),
  // until we reach this number, or we run out of posts.
  postsPerQuery: 500,

  // After querying, only allow posts with these embed types.
  embedTypeAllowList: [
    "app.bsky.embed.images#view",
    "app.bsky.embed.video#view",
    "app.bsky.embed.external#view",
    // "app.bsky.embed.record#view",
    "app.bsky.embed.recordWithMedia#view",
  ],

  // After querying, filter out posts containing any of these strings.
  // Note that having more items here doesn't help with reducing queries,
  // since this only happens after querying.
  textDenyList: ["#ai", "#aiart", "#tv", "#tvseries", "#tvshow", "#abc"],

  // Path of folder to place the static site files.
  outputFolder: "output",
};

const identifier = process.env.BLUESKY_IDENTIFIER;
const password = process.env.BLUESKY_PASSWORD;

if (!identifier || !password) {
  throw new Error(
    "Missing BLUESKY_IDENTIFIER or BLUESKY_PASSWORD. Set it in secrets somewhere (shhh) or .env for local dev."
  );
}

export const bskyEnv = { identifier, password } as const;
