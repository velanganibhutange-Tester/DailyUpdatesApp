import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY, STORAGE_KEY, loadData, saveData, validateData, validDate, toCsv } from '../src/storage.js';

const record = { id: 'one', employeeName: 'Maya', department: 'Engineering', feature: 'Profile', ticketNumber: 'APP-1', ticketDescription: 'Preferences', status: 'Done', date: '2026-10-08', estimatedHours: 0, estimatedMinutes: 0, estimatedSeconds: 0, hasETAChange: false, etaChangeDescription: '', blockers: '', createdAt: '2026-10-08T08:00:00Z' };
const data = () => ({ ...EMPTY, updates: [{ ...record }] });
function memoryStorage() {
  const values = new Map();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } });
}

test('saved records and profiles survive loading from browser storage', () => {
  memoryStorage();
  const input = { ...data(), profile: { name: 'Maya', department: 'Engineering' } };
  const saved = saveData(input);
  assert.deepEqual(loadData().data, saved);
  assert.equal(loadData().error, '');
  assert.equal(saved.updates[0].ticketNumber, 'APP-1');
});

test('corrupt saved data is reported without overwriting the original', () => {
  memoryStorage(); localStorage.setItem(STORAGE_KEY, '{bad json');
  assert.notEqual(loadData().error, '');
  assert.equal(localStorage.getItem(STORAGE_KEY), '{bad json');
});

test('storage write failures do not claim a successful save', () => {
  memoryStorage(); localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.throws(() => saveData(data()), /Could not save/);
});

test('backup rejects duplicate IDs, unknown statuses and missing required content', () => {
  const duplicate = data(); duplicate.updates.push({ ...record });
  assert.throws(() => validateData(duplicate));
  for (const patch of [{ status: 'Unsupported' }, { employeeName: '   ' }, { estimatedHours: 24 }, { estimatedMinutes: -1 }, { estimatedSeconds: 1.2 }]) {
    const invalid = data(); Object.assign(invalid.updates[0], patch);
    assert.throws(() => validateData(invalid));
  }
});

test('ETA changes require a reason', () => {
  const invalid = data(); invalid.updates[0].hasETAChange = true;
  assert.throws(() => validateData(invalid));
  invalid.updates[0].etaChangeDescription = 'Changed scope';
  assert.equal(validateData(invalid).updates[0].hasETAChange, true);
});

test('calendar validation rejects rollover dates but accepts leap days', () => {
  assert.equal(validDate('2026-02-30'), false);
  assert.equal(validDate('2025-02-29'), false);
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('not-a-date'), false);
});

test('CSV quotes text and prevents spreadsheet formula execution', () => {
  const csv = toCsv([{ ...record, employeeName: '=1+1', ticketDescription: 'First "quoted" line\nSecond line' }]);
  assert.ok(csv.includes('"\'=1+1"'));
  assert.ok(csv.includes('"First ""quoted"" line\nSecond line"'));
});
