import test from 'node:test';
import assert from 'node:assert/strict';
import { googleAuthorizationUrl, safeNextPath } from './oauthNavigation.js';

test('keeps supported in-app destinations with their query and hash', () => {
  assert.equal(safeNextPath('/markets/market-42?tab=activity#orders', 'https://roup.test'), '/markets/market-42?tab=activity#orders');
  assert.equal(safeNextPath('/watchlist', 'https://roup.test'), '/watchlist');
});

test('rejects absolute, protocol-relative, and unsupported destinations', () => {
  assert.equal(safeNextPath('https://evil.test/markets', 'https://roup.test'), '/explore');
  assert.equal(safeNextPath('//evil.test/markets', 'https://roup.test'), '/explore');
  assert.equal(safeNextPath('/admin', 'https://roup.test'), '/explore');
});

test('builds the Google authorization route from the configured auth origin', () => {
  assert.equal(googleAuthorizationUrl('https://api.roup.test/'), 'https://api.roup.test/oauth2/authorization/google');
  assert.equal(googleAuthorizationUrl(''), '/oauth2/authorization/google');
});
