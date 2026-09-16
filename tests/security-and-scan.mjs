// Run the dependency-free Deno-compatible regression tests on Node 22+.
import { test } from 'node:test';
globalThis.Deno = { test };
await import('../supabase/functions/_shared/session_test.ts');
const { prepareScanImageForUpload } = await import('../apps/lib/scan/imageProcessing.ts');
const { strict: assert } = await import('node:assert');
test('default scan preparation preserves original image bytes', async () => {
  const file = new File(['original bytes'], 'scan.jpg', { type: 'image/jpeg' });
  const result = await prepareScanImageForUpload(file, 0);
  assert.equal(result.file, file);
  assert.equal(result.metadata.autoCropApplied, false);
});
test('PDFs are preserved and unsupported rotation fails explicitly', async () => {
  const pdf = new File(['%PDF-1.7'], 'record.pdf', { type: 'application/pdf' });
  assert.equal((await prepareScanImageForUpload(pdf, 0)).file, pdf);
  const heic = new File(['heic'], 'photo.heic', { type: 'image/heic' });
  await assert.rejects(prepareScanImageForUpload(heic, 90), /cannot rotate/);
});

const { getDocumentAccessState } = await import('../apps/lib/documents/access.ts');
test('document expiry and review status do not masquerade as expired login sessions', () => {
  for (const status of ['active', 'expired', 'expiring-soon', 'needs_review', 'archived']) {
    assert.equal(getDocumentAccessState({ status }), 'available');
  }
  assert.equal(getDocumentAccessState({ status: 'missing' }), 'restricted');
});
