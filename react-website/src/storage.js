export const STORAGE_KEY = 'daily-updates-react-v1';
export const STATUSES = ['In Progress', 'Ready for Production', 'Blocked', 'In UAT', 'Done'];
export const EMPTY = { version: 1, profile: { name: '', department: '' }, updates: [], savedAt: null };

export function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01') return false;
  const parsed = new Date(`${value}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.getFullYear() === Number(value.slice(0, 4)) && parsed.getMonth() + 1 === Number(value.slice(5, 7)) && parsed.getDate() === Number(value.slice(8, 10));
}

export function validateData(data) {
  const text = (value, max, required = false) => typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0);
  if (!data || data.version !== 1 || !data.profile || !text(data.profile.name, 80) || !text(data.profile.department, 80) || !Array.isArray(data.updates) || data.updates.length > 10000) throw new Error('This is not a valid Daily Updates backup.');
  const ids = new Set();
  const updates = data.updates.map(update => {
    if (!update || !text(update.id, 100, true) || ids.has(update.id) || !text(update.employeeName, 80, true) || !text(update.department, 80) || !text(update.feature, 160, true) || !text(update.ticketNumber, 100, true) || !text(update.ticketDescription, 5000, true) || !text(update.blockers, 2000) || !text(update.etaChangeDescription, 2000) || !STATUSES.includes(update.status) || !validDate(update.date) || typeof update.hasETAChange !== 'boolean' || (update.hasETAChange && !update.etaChangeDescription.trim()) || ![update.estimatedHours, update.estimatedMinutes, update.estimatedSeconds].every((n, i) => Number.isInteger(n) && n >= 0 && n <= (i === 0 ? 23 : 59)) || !text(update.createdAt, 40, true) || Number.isNaN(Date.parse(update.createdAt))) throw new Error('A backup record has invalid or missing fields.');
    ids.add(update.id);
    return { id: update.id, employeeName: update.employeeName, department: update.department, feature: update.feature, ticketNumber: update.ticketNumber, ticketDescription: update.ticketDescription, status: update.status, date: update.date, estimatedHours: update.estimatedHours, estimatedMinutes: update.estimatedMinutes, estimatedSeconds: update.estimatedSeconds, hasETAChange: update.hasETAChange, etaChangeDescription: update.etaChangeDescription, blockers: update.blockers, createdAt: update.createdAt };
  });
  return { version: 1, profile: { name: data.profile.name, department: data.profile.department }, updates, savedAt: typeof data.savedAt === 'string' && !Number.isNaN(Date.parse(data.savedAt)) ? data.savedAt : null };
}

export function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return { data: saved ? validateData(JSON.parse(saved)) : EMPTY, error: '' };
  } catch {
    return { data: EMPTY, error: 'Saved data could not be read. Existing storage has not been overwritten. Import a backup or resolve browser storage access before saving.' };
  }
}

export function saveData(data) {
  const next = validateData({ ...data, savedAt: new Date().toISOString() });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  catch { throw new Error('Could not save. Browser storage may be full or unavailable. Export a backup before closing this page.'); }
  return next;
}

export function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toCsv(updates) {
  const fields = ['employeeName', 'department', 'date', 'feature', 'ticketNumber', 'ticketDescription', 'status', 'estimatedHours', 'estimatedMinutes', 'estimatedSeconds', 'hasETAChange', 'etaChangeDescription', 'blockers'];
  const cell = value => {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return '\uFEFF' + [fields, ...updates.map(update => fields.map(field => update[field]))].map(row => row.map(cell).join(',')).join('\r\n');
}
