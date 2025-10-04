#!/usr/bin/env node

import { config } from './config.js';

async function testPinnedPost() {
	console.log('Testing dynamic pinned post detection...');

	try {
		const pinnedPost = await config.getPinnedPost?.();

		if (pinnedPost) {
			console.log('✅ Found pinned post:', pinnedPost);

			// Check if it's the hardcoded fallback
			if (pinnedPost === 'at://did:plc:hatwcvsule6s3ffjijttpasv/app.bsky.feed.post/3m2dvbai6k22s') {
				console.log('ℹ️  This is the hardcoded fallback post');
			} else {
				console.log('🎉 This is a dynamically found post!');
			}
		} else {
			console.log('❌ No pinned post found');
		}
	} catch (error) {
		console.error('❌ Error testing pinned post:', error);
	}
}

testPinnedPost();
