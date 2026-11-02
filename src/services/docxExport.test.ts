import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDocxBlob } from './docxExport';
import { DEMO_REPORTS } from './storage';

test('generateDocxBlob generates valid non-empty blob from report', async () => {
  const blob = await generateDocxBlob(DEMO_REPORTS[0], 'دلتا للشبكات');
  assert.ok(blob);
  assert.ok(blob.size > 1000, `Expected docx blob size > 1000 bytes, got ${blob.size}`);
});
