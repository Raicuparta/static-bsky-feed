# Static Bluesky Feed

A Bluesky feed that's hosted statically and updated periodically.

TODO: script for unpublishing the feed.

## Why?

Bluesky doesn't make this super clear, but all you need for a custom feed are two json files:

- [.well-known/did.json](https://bsky.raicuparta.com/.well-known/did.json) at the top level of a domain/subdomain.
- [xrpc/app.bsky.feed.getFeedSkeleton](https://bsky.raicuparta.com/xrpc/app.bsky.feed.getFeedSkeleton/).

This is kind of referenced in [their docs](https://docs.bsky.app/docs/starter-templates/custom-feeds#suggestions-and-examples), but I don't think they do a good job of explaining it (at the time of writing this):

> At the simplest end, a Feed Generator could supply a "feed" that only contains some hardcoded posts.

On that same docs page, they also say:

> For most use cases, we recommend subscribing to the firehose at `com.atproto.sync.subscribeRepos`.

And I disagree! The vast majority of feeds are incredibly simple, and shouldn't require a server that's always running and listening for new posts. Serving a static json that gets updated periodically should suffice, given the feed fits some criteria.

Nowadays most feeds use services like Bluesky Feed Creator or Graze Social. These services are great, and almost definitely easier to set up than what I have here. But they might be overkill for your feed. Some of these services are also paid, and the free tier end up being more limited than what I have set up here.

## Criteria for statically-hosted feeds

- Everyone sees the same posts (feed does't change based on whoever is looking at it).
- Posts with certain keywords or tags are included or blocked from the feed.
- Posts from certain users are pinned, highlighted or blocked from the feed.
- Posts are sorted based on date, text content, author, etc.
- New posts don't need to show up on the feed _immediately_ (5-10 minutes delay is ok).

If your feed follows these restrictions, then it qualifies for static hosting.

## How does it work?

The TypeScript scripts in this repository are executed every so often (every 30 minutes at the time of writing this, but I will probably change that and forget to update this readme). The output of those scripts is a folder with the two files mentioned above.

### `.well-known/did.json`

This one needs to be at the top level of the domain/subdomain. Bluesky looks at this first. It looks like this:

```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:web:bsky.raicuparta.com",
  "service": [
    {
      "id": "#bsky_fg",
      "type": "BskyFeedGenerator",
      "serviceEndpoint": "https://bsky.raicuparta.com"
    }
  ]
}
```

Bluesky will read the `serviceEndpoint` value, in this case `https://bsky.raicuparta.com`, and then attempt to connect to `https://bsky.raicuparta.com/xrpc/app.bsky.feed.getFeedSkeleton` to get the posts from the feed.

### `xrpc/app.bsky.feed.getFeedSkeleton`

If you were to use the [official Bluesky custom feed template](https://github.com/bluesky-social/feed-generator), this endpoint would be dynamic. It receives some parameters, reads posts from a database, and serves potentially different results per request. We don't care about any of that, so we can just ignore all those parameters and serve this as a static file.

The endpoint `xrpc/app.bsky.feed.getFeedSkeleton` doesn't end in `.json`, which can be annoying on some hosts that try to automatically detect content type based on file extension. That's why for this repo I'm actually hosting this file in `xrpc/app.bsky.feed.getFeedSkeleton/index.json`, which works just as well.
