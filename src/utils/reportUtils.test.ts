import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDurationMinutes,
  formatDurationArabic,
  generateReportNumber,
  getChecklistTemplate,
} from './reportUtils';

test('calculateDurationMinutes calculates regular daytime duration accurately', () => {
  const duration = calculateDurationMinutes('09:30', '12:00');
  assert.equal(duration, 150); // 2 hours 30 mins = 150 mins
});

test('calculateDurationMinutes handles overnight visits correctly', () => {
  const duration = calculateDurationMinutes('23:00', '01:30');
  assert.equal(duration, 150); // 2 hours 30 mins
});

test('calculateDurationMinutes handles empty or invalid inputs gracefully', () => {
  assert.equal(calculateDurationMinutes('', '12:00'), 0);
  assert.equal(calculateDurationMinutes('invalid', '12:00'), 0);
});

test('formatDurationArabic outputs readable Arabic duration text', () => {
  assert.equal(formatDurationArabic(45), '45 دقيقة');
  assert.equal(formatDurationArabic(60), 'ساعة واحدة');
  assert.equal(formatDurationArabic(120), 'ساعتان');
  assert.equal(formatDurationArabic(150), 'ساعتان و30 دقيقة');
  assert.equal(formatDurationArabic(240), '4 ساعات');
});

test('generateReportNumber auto-increments sequence for current year', () => {
  const existing = [
    { reportNumber: 'MR-2026-0001' },
    { reportNumber: 'MR-2026-0002' },
    { reportNumber: 'MR-2025-0010' }, // different year
  ];
  const nextNum = generateReportNumber(existing, 2026);
  assert.equal(nextNum, 'MR-2026-0003');
});

test('generateReportNumber starts at 0001 when no existing reports for year', () => {
  const existing = [{ reportNumber: 'MR-2025-0099' }];
  const nextNum = generateReportNumber(existing, 2026);
  assert.equal(nextNum, 'MR-2026-0001');
});

test('getChecklistTemplate returns non-empty checklists for all report types', () => {
  const types = ['صيانة دورية', 'إصلاح عطل', 'تركيب جديد', 'فحص شبكة', 'استلام موقع'] as const;
  for (const t of types) {
    const list = getChecklistTemplate(t);
    assert.ok(list.length >= 5, `Expected at least 5 items for ${t}`);
    assert.ok(list.every((item) => item.text.length > 5));
  }
});
