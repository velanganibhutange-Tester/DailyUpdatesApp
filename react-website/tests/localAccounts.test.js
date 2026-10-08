import test from 'node:test';
import assert from 'node:assert/strict';
import { ACCOUNTS_KEY, registerAccount, loginAccount, getSession, setSession, clearSession } from '../src/localAccounts.js';

function memoryStorage() {
  for (const key of ['localStorage', 'sessionStorage']) {
    const values = new Map();
    Object.defineProperty(globalThis, key, { configurable: true, value: { getItem: name => values.get(name) ?? null, setItem: (name, value) => values.set(name, value), removeItem: name => values.delete(name) } });
  }
}

test('local registration hashes passwords, normalizes email and preserves session preference', async () => {
  memoryStorage();
  const user = await registerAccount({ email: ' TEST@example.com ', name: ' Test Person ', department: ' QA ', password: 'Unique-demo-password' });
  assert.deepEqual(user, { email: 'test@example.com', name: 'Test Person', department: 'QA' });
  const stored = localStorage.getItem(ACCOUNTS_KEY);
  assert.ok(!stored.includes('Unique-demo-password'));
  assert.deepEqual(await loginAccount('TEST@example.com', 'Unique-demo-password'), user);
  await assert.rejects(loginAccount('test@example.com', 'Incorrect'), /Invalid email or password/);
  await assert.rejects(registerAccount({ ...user, password: 'Unique-demo-password' }), /already registered/);
  setSession(user); assert.deepEqual(getSession(), user);
  clearSession(); assert.equal(getSession(), null);
});

test('invalid fields and short passwords do not create accounts', async () => {
  memoryStorage();
  for (const fields of [{ email: 'bad', name: 'Test', password: 'password' }, { email: 'test@example.com', name: ' ', password: 'password' }, { email: 'test@example.com', name: 'Test', password: 'short' }]) await assert.rejects(registerAccount(fields));
  assert.equal(localStorage.getItem(ACCOUNTS_KEY), null);
});

test('corrupt account storage is reported without replacement', async () => {
  memoryStorage(); localStorage.setItem(ACCOUNTS_KEY, '{broken');
  await assert.rejects(registerAccount({ email: 'test@example.com', name: 'Test', password: 'password' }), /could not be read/);
  await assert.rejects(loginAccount('test@example.com', 'password'), /could not be read/);
  assert.equal(localStorage.getItem(ACCOUNTS_KEY), '{broken');
});

test('account storage failures do not claim registration succeeded', async () => {
  memoryStorage(); localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  await assert.rejects(registerAccount({ email: 'test@example.com', name: 'Test', password: 'password' }), /Could not save/);
  assert.equal(localStorage.getItem(ACCOUNTS_KEY), null);
});

test('an account changed while hashing cannot be silently overwritten', async () => {
  memoryStorage();
  const pending = registerAccount({ email: 'test@example.com', name: 'Test', password: 'password' });
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([{ email: 'other@example.com', name: 'Other', department: '', salt: 'a'.repeat(32), hash: 'b'.repeat(64) }]));
  await assert.rejects(pending, /Accounts changed/);
  assert.equal(JSON.parse(localStorage.getItem(ACCOUNTS_KEY)).length, 1);
});
