# Static Bluesky Feed

A Bluesky feed that's hosted statically and updated periodically.

## Choices for a domain

Due to the way Bluesky and the AT Protocol work, you need a domain or subdomain for this to work, and you need access to the root path of that domain/subdomain. Domain verification is done by reading a file at `domain.tld/.well-known/did.json`.

By default, GitHub pages get deployed to `GH_USER.github.io/REPO_NAME`. If you simply add `.well-known/did.json` to any Pages repo, that would lead to `GH_USER.github.io/REPO_NAME/.well-known/did.json`, which won't work.

If you can't use a custom domain, you have some options:

1. Call your fork of this repo `.well-known` (exactly this, including the period). This means your repo would live in `github.com/GH_USER/.well-known`, and by adding `did.json` to the root of the page, you'd get `GH_USER.github.io/.well-known/did.json`, thus verifying the `GH_USER.github.io` subdomain for you. That subdomain would also be what you set for the `hostname` setting in `config.ts`.
2. Create a separate repo called exactly `.well-known`, this time having only a `did.json` file and nothing else. This makes a bit more sense, the repo that creates and updates the feed just does the one thing, and the `.well-known` repo serves only to validate the subdomain. But this repo won't generate the `did.json` for you anymore, you need to make it manually. You'd need to make sure value for `service.serviceEndpoint` points to the page of the feed repo, not the well-known repo. Basically, constructing a URL like `SERVICE_ENDPOINT/xrpc/app.bsky.feed.getFeedSkeleton` needs to point to the generated feed json. So it would look something like `"serviceEndpoint": "https://raicuparta.github.io/static-bsky-feed"`. The `id` value in `did.json` would be `did:web:raicuparta.github.io` in this case.
3. Don't use GitHub pages. [Cloudflare Pages](https://pages.cloudflare.com/) is also free, and can easily support this. I think the only thing you'd need to change in this repo would be the [build workflow](.github/workflows/build.yml), to make it deploy to Cloudflare Pages instead of GitHub Pages. You could also ditch the build workflow completely, and just configure automated builds on the Cloudflare side.

If you already own a domain, you can just create a subdomain and configure your fork of this repo to use that. That's what I did, using `bsky.raicuparta.com`. Everything should work as-is for this case.

## Making your own feed

You should be able to set everything up directly on the GitHub website, but if you want you can also clone the repo locally, make changes, run tests, etc.

1. Fork this repo.
2. Edit [config.ts](config.ts) (the comments there should explain what each thing means).
3. Go to repo Settings -> Secrets and variables -> Actions.
4. Create repository secrets:
   1. `BLUESKY_IDENTIFIER` - your Bluesky handle (without the `@`).
   2. `BLUESKY_PASSWORD` - a Bluesky [app password](https://bsky.app/settings/app-passwords).
5. If you need local development, check [.env.template](.env.template) and use the same secrets.
6. Go to your repo's Actions tab and enable the workflows. The "Build and Deploy" workflow will make the feed update itself periodically.

## Publishing your feed

1. Go to your repo's Actions tab.
2. Select the "Publish Feed" workflow.
3. Click the "Run workflow" dropdown.
4. Type the feed ID in the recordName input. For instance, for my feed ` bsky.app/profile/raicuparta.com/feed/modding`, the ID would be `modding`. If you use the same ID again, your changes to feed name, description, avatar will overwrite the existing ones.

You can also do this on your local environment by running `npm run publish [RECORD_NAME]`.

## Removing your feed from the public

Same as publishing, but use the "Unpublish Feed" workflow instead.

You can also do this on your local environment by running `npm run unpublish [RECORD_NAME]`.

## Why?

Bluesky doesn't make this super clear, but all you need for a custom feed are two json files:

- [.well-known/did.json](https://bsky.raicuparta.com/.well-known/did.json) at the top level of a domain/subdomain.
- [xrpc/app.bsky.feed.getFeedSkeleton](https://bsky.raicuparta.com/xrpc/app.bsky.feed.getFeedSkeleton/).

This is kind of referenced in [their docs](https://docs.bsky.app/docs/starter-templates/custom-feeds#suggestions-and-examples), but I don't think they do a good job of explaining it (at the time of writing this):

> At the simplest end, a Feed Generator could supply a "feed" that only contains some hardcoded posts.

On that same docs page, they also say:

> For most use cases, we recommend subscribing to the firehose at `com.atproto.sync.subscribeRepos`.

Nowadays most feeds use services like Bluesky Feed Creator or Graze Social. These services are great, and almost definitely easier to set up than what I have here. But they might be overkill for your feed, especially if it's ok to have a pretty limitted number of posts in it. Some of these services are also paid, and the free tier end up being more limited than what I have set up here.

## Criteria for statically-hosted feeds

- Everyone sees the same posts (feed does't change based on whoever is looking at it).
- Posts with certain keywords or tags are included or blocked from the feed.
- Posts from certain users are pinned, highlighted or blocked from the feed.
- Posts are sorted based on date, text content, author, etc.
- New posts don't need to show up on the feed _immediately_ (5-10 minutes delay is ok).
- The feed doesn't get that many posts. Currently it seems like Bluesky only gets 25 pots at a time, so for a static feed like this it seems like it will never show more than 25.

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

## Local development

Use [node](https://nodejs.org) and npm. Check `package.json` for engine version and available scripts, should be pretty simple.

Check `.env.template` for setting up secrets for local testing.
