import { BlobRef, AppBskyFeedDefs } from '@atproto/api';
import fs from 'fs/promises';
import { config } from '../config.ts';
import { ids } from '@atproto/api/dist/client/lexicons.js';
import { getAtpAgent } from './atp.ts';
import { getRecordNameArg } from './record-name-arg.ts';

const run = async () => {
	const recordName = getRecordNameArg('publish');
	const agent = await getAtpAgent();

	let avatarRef: BlobRef | undefined;
	if (config.avatarPath) {
		let encoding: string;
		if (config.avatarPath.endsWith('png')) {
			encoding = 'image/png';
		} else if (config.avatarPath.endsWith('jpg') || config.avatarPath.endsWith('jpeg')) {
			encoding = 'image/jpeg';
		} else {
			throw new Error('expected png or jpeg');
		}
		const img = await fs.readFile(config.avatarPath);
		const blobRes = await agent.com.atproto.repo.uploadBlob(img, {
			encoding,
		});
		avatarRef = blobRes.data.blob;
	}

	await agent.com.atproto.repo.putRecord({
		repo: agent.session?.did ?? '',
		collection: ids.AppBskyFeedGenerator,
		rkey: recordName,
		record: {
			did: `did:web:${config.staticHostName}`,
			displayName: config.displayName,
			description: config.description,
			avatar: avatarRef,
			createdAt: new Date().toISOString(),
			contentMode: config.videoOnly ? AppBskyFeedDefs.CONTENTMODEVIDEO : AppBskyFeedDefs.CONTENTMODEUNSPECIFIED,
		},
	});

	console.log('All done 🦊');
};

run();
