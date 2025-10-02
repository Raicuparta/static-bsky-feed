import { AtpAgent } from '@atproto/api';
import { config } from '../config.ts';

export async function getAtpAgent() {
	const identifier = process.env.BLUESKY_IDENTIFIER;
	const password = process.env.BLUESKY_PASSWORD;

	if (!identifier || !password) {
		throw new Error('Missing BLUESKY_IDENTIFIER or BLUESKY_PASSWORD. Set it in secrets somewhere (shhh) or .env for local dev.');
	}

	const agent = new AtpAgent({
		service: config.atpService ? config.atpService : 'https://bsky.social',
	});

	const authResponse = await agent.login({
		identifier,
		password,
	});

	if (!authResponse.success) {
		throw new Error(`Failed to authenticate for some reason.`);
	}

	console.log(`Authenticated as ${authResponse.data.handle}`);

	return agent;
}
