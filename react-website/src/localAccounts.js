export const ACCOUNTS_KEY = 'daily-updates-local-accounts-v1';
const SESSION_KEY = 'daily-updates-local-session-v1';
const ITERATIONS = 600000;
const normalize = email => String(email).trim().toLowerCase();
const hex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

function readAccounts() {
  let raw;
  try { raw = localStorage.getItem(ACCOUNTS_KEY); } catch { throw new Error('Local account storage is unavailable.'); }
  if (!raw) return [];
  try {
    const accounts = JSON.parse(raw);
    if (!Array.isArray(accounts) || accounts.length > 1000) throw new Error();
    const emails = new Set();
    for (const account of accounts) {
      if (!account || typeof account.email !== 'string' || account.email !== normalize(account.email) || account.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email) || emails.has(account.email) || typeof account.name !== 'string' || !account.name.trim() || account.name.length > 80 || typeof account.department !== 'string' || account.department.length > 80 || !/^[a-f0-9]{32}$/.test(account.salt) || !/^[a-f0-9]{64}$/.test(account.hash)) throw new Error();
      emails.add(account.email);
    }
    return accounts;
  } catch { throw new Error('Local account data could not be read. Existing accounts have not been overwritten.'); }
}

async function passwordHash(password, salt) {
  if (!globalThis.crypto?.subtle) throw new Error('Local login requires HTTPS or localhost.');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bytes = Uint8Array.from(salt.match(/.{2}/g), byte => parseInt(byte, 16));
  return hex(new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: bytes, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256)));
}

export async function registerAccount({ email, name, department = '', password }) {
  email = normalize(email); name = String(name).trim(); department = String(department).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !name || name.length > 80 || department.length > 80) throw new Error('Enter a valid email and name.');
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw new Error('Use a password with 8 to 128 characters.');
  const accounts = readAccounts();
  if (accounts.some(account => account.email === email)) throw new Error('This email is already registered in this browser. Log in instead.');
  if (accounts.length >= 1000) throw new Error('This browser has reached the local account limit.');
  const snapshot = JSON.stringify(accounts);
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  const account = { email, name, department, salt, hash: await passwordHash(password, salt) };
  if (JSON.stringify(readAccounts()) !== snapshot) throw new Error('Accounts changed in another tab. Please try again.');
  try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account])); }
  catch { throw new Error('Could not save the local account. Browser storage may be full or unavailable.'); }
  return { email, name, department };
}

export async function loginAccount(email, password) {
  const accounts = readAccounts();
  const snapshot = JSON.stringify(accounts);
  const account = accounts.find(item => item.email === normalize(email));
  if (!account || typeof password !== 'string' || password.length > 128 || await passwordHash(password, account.salt) !== account.hash) throw new Error('Invalid email or password for this browser.');
  if (JSON.stringify(readAccounts()) !== snapshot) throw new Error('Accounts changed in another tab. Please try again.');
  return { email: account.email, name: account.name, department: account.department };
}

// This is a local identity preference, not an authorization boundary.
export function getSession() {
  try {
    const email = sessionStorage.getItem(SESSION_KEY);
    const account = readAccounts().find(item => item.email === email);
    if (account) return { email: account.email, name: account.name, department: account.department };
  } catch { /* A missing session does not prevent access to existing browser records. */ }
  return null;
}
export function setSession(account) { try { sessionStorage.setItem(SESSION_KEY, account.email); } catch { /* Keep the current in-memory session when storage is disabled. */ } }
export function clearSession() { try { sessionStorage.removeItem(SESSION_KEY); } catch { /* No persisted session to clear. */ } }
