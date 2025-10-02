import { config } from '../config';

type FeedSkeletonResponse = {
	feed: { post: string }[];
	cursor?: string;
};

export default {
	async fetch(req, _env, _ctx) {
		const url = new URL(req.url);

		if (url.pathname.replace(/\/$/, '') === '/xrpc/app.bsky.feed.getFeedSkeleton') {
			const limit = url.searchParams.get('limit');
			const cursor = url.searchParams.get('cursor');

			const response = await fetch(`https://${config.staticHostName}/xrpc/app.bsky.feed.getFeedSkeleton/`);
			const data = (await response.json()) as FeedSkeletonResponse;

			let posts = data.feed.map((item) => item.post);

			if (cursor) {
				const index = posts.findIndex((post) => post === cursor);
				if (index !== -1) posts = posts.slice(index + 1);
			}

			if (limit) posts = posts.slice(0, Number(limit));

			return Response.json(
				{
					feed: posts.map((post) => ({ post })),
					cursor: posts[posts.length - 1],
				},
				{
					headers: { 'Access-Control-Allow-Origin': '*' },
				}
			);
		}

		return new Response("There's absolutely nothing here NOTHING", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
