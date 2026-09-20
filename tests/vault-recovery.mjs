import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecoveryEnvelope, unlockRecoveryEnvelope, normalizeRecoveryCode } from '../apps/lib/vault/crypto.ts';

test('saved recovery envelope restores a non-extractable vault key independently', async () => {
  const user = crypto.randomUUID();
  const created = await createRecoveryEnvelope(user);
  assert.equal(created.key.extractable, false);
  assert.equal(normalizeRecoveryCode(created.code).length, 64);
  const fileKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const fileIv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode('Synthetic document fixture');
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: fileIv }, fileKey, plaintext);
  const wrapped = await crypto.subtle.wrapKey('raw', fileKey, created.key, { name: 'AES-GCM', iv });
  // Only the server-stored encrypted envelope and user's saved code cross this boundary.
  const restored = await unlockRecoveryEnvelope(user, JSON.parse(JSON.stringify(created.envelope)), created.code.toLowerCase());
  assert.equal(restored.extractable, false);
  await assert.rejects(crypto.subtle.exportKey('raw', restored));
  const restoredFileKey = await crypto.subtle.unwrapKey('raw', wrapped, restored, { name: 'AES-GCM', iv }, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  assert.deepEqual(new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fileIv }, restoredFileKey, ciphertext)), plaintext);
});

test('recovery rejects wrong code, another user, swapped key id and corrupted envelope', async () => {
  const user = crypto.randomUUID(), first = await createRecoveryEnvelope(user), other = await createRecoveryEnvelope(user);
  await assert.rejects(unlockRecoveryEnvelope(user, first.envelope, other.code));
  await assert.rejects(unlockRecoveryEnvelope(crypto.randomUUID(), first.envelope, first.code));
  await assert.rejects(unlockRecoveryEnvelope(user, { ...first.envelope, vault_key_id: crypto.randomUUID() }, first.code));
  const changed = (first.envelope.encrypted_vault_key[0] === 'A' ? 'B' : 'A') + first.envelope.encrypted_vault_key.slice(1);
  await assert.rejects(unlockRecoveryEnvelope(user, { ...first.envelope, encrypted_vault_key: changed }, first.code));
  await assert.rejects(unlockRecoveryEnvelope(user, { ...first.envelope, recovery_iv: '' }, first.code));
  await assert.rejects(unlockRecoveryEnvelope(user, first.envelope, 'password123'));
});
