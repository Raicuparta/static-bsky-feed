const identifier = process.env.BLUESKY_IDENTIFIER;
const password = process.env.BLUESKY_PASSWORD;

if (!identifier || !password) {
  throw new Error(
    "Missing BLUESKY_IDENTIFIER or BLUESKY_PASSWORD. Set it in secrets somewhere (shhh) or .env for local dev."
  );
}

export const bskyEnv = { identifier, password } as const;
