import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import type { PostView } from '@atproto/api/dist/client/types/app/bsky/feed/defs.js';
import { config } from '../config.ts';
import { getAtpAgent } from './atp.ts';

console.log('Authenticating...');
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

const pinnedPost = await config.getPinnedPost?.();
if (pinnedPost) {
	posts.delete(pinnedPost);
}

const sortedPosts = [...posts.values()]
	.sort((postA, postB) => new Date(postB.indexedAt).getTime() - new Date(postA.indexedAt).getTime())
	.map((post) => ({ post: post.uri }));

if (pinnedPost) {
	sortedPosts.unshift({ post: pinnedPost });
}

const outputFolder = 'output';

if (existsSync(outputFolder)) {
	rmSync(outputFolder, { recursive: true });
}

const feedSkeletonFolder = `${outputFolder}/xrpc/app.bsky.feed.getFeedSkeleton`;
mkdirSync(feedSkeletonFolder, { recursive: true });

writeFileSync(
	`${feedSkeletonFolder}/index.json`,
	JSON.stringify({
		feed: sortedPosts,
	})
);

console.log(`Saved ${sortedPosts.length} posts to ${outputFolder}`);

console.log('Creating did.json...');

const did = {
	'@context': ['https://www.w3.org/ns/did/v1'],
	id: `did:web:${config.staticHostName}`,
	service: [
		{
			id: '#bsky_fg',
			type: 'BskyFeedGenerator',
			serviceEndpoint: config.serviceEndpoint ?? `https://${config.staticHostName}`,
		},
	],
};

const didFolder = `${outputFolder}/.well-known`;
mkdirSync(didFolder, { recursive: true });

writeFileSync(`${didFolder}/did.json`, JSON.stringify(did));

console.log('Creating HTML file...');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <script async src="https://embed.bsky.app/static/embed.js" charset="utf-8"></script>
		<style>
			main {
				display: flex;
				flex-direction: column;
				gap: 20px;
			}
			.post > iframe {
				border: none;
				height: 500px;
				width: 500px
			}
		</style>
</head>
<body>
	<header>
		<h1>${config.displayName}</h1>
	</header>
	<main>
		<div>Made using <a href="https://github.com/Raicuparta/static-bsky-feed/">static-bsky-feed</a></div>
    ${sortedPosts
			.slice(0, 30)
			.map(
				({ post }) =>
					`<div className="post"><div>${post}</div><iframe loading="lazy" src="https://embed.bsky.app/embed/${post.slice(
						'at://'.length
					)}" frameborder="0" scrolling="no" style="border: none; height: 500px; width: 500px"></iframe></div>`
			)
			.join('\n')}
		</main>
</body>
</html>`;

writeFileSync(`${outputFolder}/index.html`, htmlContent);

console.log(`Saved HTML file to ${outputFolder}/index.html`);

console.log('All done 🐼');
