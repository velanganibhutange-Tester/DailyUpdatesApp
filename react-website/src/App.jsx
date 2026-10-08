import { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, ClipboardList, Layers, Users, Settings2, Upload, Download, Plus, Search, X, FileDown, Pencil, Trash2, Eye, Check, Clock3, CircleCheck, CircleAlert, Inbox, ArrowRight, Database } from 'lucide-react';
import { EMPTY, STATUSES, STORAGE_KEY, today, loadData, saveData, validateData, download, toCsv } from './storage.js';

const VIEWS = { overview: 'Overview', mine: 'My updates', all: 'All updates', team: 'People' };
const ICONS = { overview: LayoutDashboard, mine: ClipboardList, all: Layers, team: Users };
const STATUS_CLASS = { 'In Progress': 'progress', 'Ready for Production': 'ready', Blocked: 'blocked', 'In UAT': 'uat', Done: 'done' };
const initials = name => name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'ME';
const dateLabel = date => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const etaLabel = update => `${update.estimatedHours}h ${update.estimatedMinutes}m ${update.estimatedSeconds}s`;
const getView = () => Object.hasOwn(VIEWS, location.hash.slice(1)) ? location.hash.slice(1) : 'overview';

function IconButton({ icon: Icon, label, onClick, className = '', disabled = false }) {
  return <button type="button" className={`icon-button ${className}`} title={label} aria-label={label} onClick={onClick} disabled={disabled}><Icon size={18} /></button>;
}
function Status({ status }) { return <span className={`status-badge status-${STATUS_CLASS[status]}`}>{status}</span>; }

function Modal({ title, children, onClose, className = 'editor-dialog' }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} className={className} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="dialog-heading"><h2>{title}</h2><IconButton icon={X} label="Close" onClick={onClose} /></div>{children}
  </dialog>;
}

function Editor({ update, profile, onSave, onClose }) {
  const [changed, setChanged] = useState(update?.hasETAChange ?? false);
  const [error, setError] = useState('');
  const fields = update || { employeeName: profile.name, department: profile.department, date: today(), status: 'In Progress' };
  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    for (const key of ['employeeName', 'department', 'feature', 'ticketNumber', 'ticketDescription', 'blockers', 'etaChangeDescription']) values[key] = String(values[key] || '').trim();
    if (['employeeName', 'feature', 'ticketNumber', 'ticketDescription'].some(key => !values[key])) return setError('Enter a name, feature, ticket number, and description.');
    if (changed && !values.etaChangeDescription) return setError('Enter a reason for the ETA change.');
    for (const key of ['estimatedHours', 'estimatedMinutes', 'estimatedSeconds']) values[key] = Number(values[key]);
    values.hasETAChange = changed;
    if (!changed) values.etaChangeDescription = '';
    try { onSave({ ...values, id: update?.id || crypto.randomUUID(), createdAt: update?.createdAt || new Date().toISOString() }); }
    catch (err) { setError(err.message); }
  }
  return <Modal title={update ? 'Edit update' : 'Add update'} onClose={onClose}>
    <form onSubmit={submit}>
      <div className="dialog-body">
        <div className="form-grid"><label>Employee name<input name="employeeName" required maxLength={80} autoComplete="name" defaultValue={fields.employeeName} autoFocus /></label><label>Department (optional)<input name="department" maxLength={80} defaultValue={fields.department} /></label></div>
        <div className="form-grid"><label>Feature / module<input name="feature" required maxLength={160} placeholder="e.g. Authentication" defaultValue={fields.feature} /></label><label>Ticket number<input name="ticketNumber" required maxLength={100} placeholder="e.g. PROJECT-102" defaultValue={fields.ticketNumber} /></label></div>
        <label>Description<textarea name="ticketDescription" required maxLength={5000} rows={3} defaultValue={fields.ticketDescription} /></label>
        <div className="form-grid"><label>Status<select name="status" aria-label="Status" defaultValue={fields.status}>{STATUSES.map(status => <option key={status}>{status}</option>)}</select></label><label>Update date<input name="date" type="date" required min="1900-01-01" max="9999-12-31" defaultValue={fields.date} /></label></div>
        <fieldset className="eta-fields"><legend>Estimated time remaining</legend><div className="eta-inputs">{['Hours', 'Minutes', 'Seconds'].map((label, index) => <label key={label}>{label}<input name={`estimated${label}`} type="number" required min={0} max={index ? 59 : 23} step={1} defaultValue={fields[`estimated${label}`] || 0} /></label>)}</div></fieldset>
        <label className="checkbox-label"><input type="checkbox" checked={changed} onChange={event => setChanged(event.target.checked)} />ETA has changed</label>
        {changed && <label>Reason for ETA change<textarea name="etaChangeDescription" required maxLength={2000} rows={2} defaultValue={fields.etaChangeDescription} /></label>}
        <label>Blockers (optional)<textarea name="blockers" maxLength={2000} rows={2} defaultValue={fields.blockers} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      <div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button"><Check />Save update</button></div>
    </form>
  </Modal>;
}

function Profile({ profile, onSave, onClose }) {
  const [error, setError] = useState('');
  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const next = { name: values.name.trim(), department: values.department.trim() };
    if (!next.name) return setError('Enter your name.');
    try { onSave(next); } catch (err) { setError(err.message); }
  }
  return <Modal title="Your profile" onClose={onClose} className="small-dialog"><form onSubmit={submit}>
    <div className="dialog-body"><label>Your name<input name="name" required maxLength={80} defaultValue={profile.name} autoComplete="name" autoFocus /></label><label>Department (optional)<input name="department" maxLength={80} defaultValue={profile.department} /></label>{error && <p className="form-error" role="alert">{error}</p>}</div>
    <div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button"><Check />Save profile</button></div>
  </form></Modal>;
}

function Details({ update, onEdit, onClose }) {
  return <Modal title="Update details" onClose={onClose}><div className="dialog-body">
    <div className="detail-header"><h3>{update.feature}</h3><Status status={update.status} /></div>
    <div className="detail-grid">{[['Employee', update.employeeName], ['Department', update.department || 'Unassigned'], ['Ticket', update.ticketNumber], ['Date', dateLabel(update.date)], ['Estimated time remaining', etaLabel(update)]].map(([label, value]) => <div key={label}><span className="detail-label">{label}</span><p className="detail-text">{value}</p></div>)}</div>
    <div><span className="detail-label">Description</span><p className="detail-text">{update.ticketDescription}</p></div>
    <div><span className="detail-label">Blockers</span><p className="detail-text">{update.blockers || 'None'}</p></div>
    {update.hasETAChange && <div><span className="detail-label">ETA change</span><p className="detail-text">{update.etaChangeDescription}</p></div>}
    <span className="detail-meta">Created {new Date(update.createdAt).toLocaleString()}</span>
  </div><div className="dialog-actions"><button className="secondary-button" onClick={onClose}>Close</button><button className="primary-button" onClick={onEdit}><Pencil />Edit update</button></div></Modal>;
}

function Confirmation({ modal, onConfirm, onClose }) {
  const [error, setError] = useState('');
  const importing = modal.type === 'import';
  return <Modal title={importing ? 'Restore backup?' : 'Delete update?'} className="small-dialog" onClose={onClose}>
    <div className="dialog-body"><p>{importing ? `Replace this browser's profile and updates with ${modal.data.updates.length} records from the backup?` : `Delete ${modal.update.ticketNumber}: ${modal.update.feature}? This cannot be undone.`}</p>{error && <p className="form-error" role="alert">{error}</p>}</div>
    <div className="dialog-actions"><button className="secondary-button" onClick={onClose}>Cancel</button><button className={importing ? 'primary-button' : 'danger-button'} onClick={() => { try { onConfirm(); } catch (err) { setError(err.message); } }}>{importing ? <><Upload />Restore backup</> : <><Trash2 />Delete update</>}</button></div>
  </Modal>;
}

function samples() {
  return [
    ['Maya Patel', 'Engineering', 'Authentication', 'APP-104', 'In Progress', 'Refined validation and session handling.', 2],
    ['Alex Chen', 'Engineering', 'Reporting', 'APP-108', 'Done', 'Completed monthly summary exports.', 0],
    ['Maya Patel', 'Engineering', 'Notifications', 'APP-112', 'Blocked', 'Waiting for email provider configuration.', 1],
    ['Sam Wilson', 'Quality', 'Dashboard testing', 'APP-115', 'In UAT', 'Checking filters and mobile layouts.', 3],
    ['Alex Chen', 'Engineering', 'Profile settings', 'APP-116', 'Ready for Production', 'Finished profile preferences.', 0],
  ].map(([employeeName, department, feature, ticketNumber, status, ticketDescription, estimatedHours]) => ({ id: crypto.randomUUID(), employeeName, department, feature, ticketNumber, status, ticketDescription, estimatedHours, estimatedMinutes: 0, estimatedSeconds: 0, hasETAChange: false, etaChangeDescription: '', blockers: status === 'Blocked' ? 'Email provider configuration' : '', date: today(), createdAt: new Date().toISOString() }));
}

export default function App() {
  const [initial] = useState(loadData);
  const [data, setData] = useState(initial.data);
  const [error, setError] = useState(initial.error);
  const [view, setView] = useState(getView);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState(getView() === 'overview' ? today() : '');
  const [currentDay, setCurrentDay] = useState(today);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const fileRef = useRef(null);
  const rawRef = useRef(undefined);
  useEffect(() => {
    try { rawRef.current = localStorage.getItem(STORAGE_KEY); } catch { /* Storage error is displayed by loadData. */ }
    const sync = event => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      const loaded = loadData(); setData(loaded.data); setError(loaded.error); setModal(null);
      try { rawRef.current = localStorage.getItem(STORAGE_KEY); } catch { rawRef.current = undefined; }
    };
    const hash = () => { const next = getView(); setView(next); setDate(next === 'overview' ? today() : ''); setSearch(''); setStatus(''); };
    const day = () => setCurrentDay(today());
    const interval = setInterval(day, 30000);
    addEventListener('storage', sync); addEventListener('hashchange', hash); addEventListener('focus', day);
    return () => { clearInterval(interval); removeEventListener('storage', sync); removeEventListener('hashchange', hash); removeEventListener('focus', day); };
  }, []);
  useEffect(() => { if (view === 'overview') setDate(currentDay); }, [currentDay]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4000); return () => clearTimeout(timer); }, [toast]);

  function commit(next, restore = false) {
    if (initial.error && rawRef.current === undefined && !restore) throw new Error('Browser storage is unavailable. Export a backup before closing.');
    if (error && !restore) throw new Error('Resolve the storage error or restore a valid backup before saving.');
    try {
      if (localStorage.getItem(STORAGE_KEY) !== rawRef.current) throw new Error('Data changed in another tab. Reload this page before saving.');
      const saved = saveData(next); rawRef.current = JSON.stringify(saved); setData(saved); setError(''); return saved;
    } catch (err) { setError(err.message); throw err; }
  }
  function navigate(next, query = '') {
    if (location.hash !== `#${next}`) history.pushState(null, '', `#${next}`);
    setView(next); setDate(next === 'overview' ? today() : ''); setSearch(query); setStatus('');
  }
  const rows = data.updates.filter(update => (view !== 'mine' || (data.profile.name && update.employeeName.toLocaleLowerCase() === data.profile.name.toLocaleLowerCase())) && (!date || update.date === date) && (!status || update.status === status) && (!search || [update.employeeName, update.department, update.feature, update.ticketNumber, update.ticketDescription].join(' ').toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()))).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const grouped = new Map();
  for (const update of rows) {
    if (!grouped.has(update.employeeName)) grouped.set(update.employeeName, []);
    grouped.get(update.employeeName).push(update);
  }
  const people = [...grouped].sort(([a], [b]) => a.localeCompare(b));
  const metricData = [
    ['Updates', rows.length, ClipboardList, 'Recorded work'],
    ['In progress', rows.filter(update => update.status === 'In Progress' || update.status === 'In UAT').length, Clock3, 'In development or UAT'],
    ['Completed', rows.filter(update => update.status === 'Done' || update.status === 'Ready for Production').length, CircleCheck, 'Done or ready to release'],
    ['Blocked', rows.filter(update => update.status === 'Blocked').length, CircleAlert, 'Needs attention'],
  ];
  async function importBackup(event) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Choose a JSON backup smaller than 10 MB.');
      const imported = validateData(JSON.parse(await file.text())); setModal({ type: 'import', data: imported });
    } catch (err) { setToast(err instanceof SyntaxError ? 'The selected file is not valid JSON.' : err.message); }
  }
  function addSamples() {
    try { commit({ ...data, updates: [...data.updates, ...samples()] }); setToast('Sample updates added'); }
    catch (err) { setToast(err.message); }
  }
  const closeModal = () => setModal(null);
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#overview" onClick={event => { event.preventDefault(); navigate('overview'); }}><img src={`${import.meta.env.BASE_URL}brand.svg`} alt="" width={36} height={36} /><span>Daily Updates<span className="brand-subtitle">WORKSPACE</span></span></a>
      <nav aria-label="Main navigation">{Object.entries(VIEWS).map(([key, label]) => { const Icon = ICONS[key]; return <a key={key} href={`#${key}`} aria-current={view === key ? 'page' : undefined} onClick={event => { event.preventDefault(); navigate(key); }}><Icon /><span>{label}</span></a>; })}</nav>
      <div className="sidebar-bottom"><span className="local-indicator"><Database size={14} />On this browser</span><button className="profile-button" onClick={() => setModal({ type: 'profile' })} aria-label="Your profile"><span className="avatar">{initials(data.profile.name)}</span><span className="profile-copy"><strong>{data.profile.name || 'Your profile'}</strong><span>{data.profile.department || 'Personal workspace'}</span></span><Settings2 /></button></div>
    </aside>
    <main>
      <header className="topbar"><span>Workspace / {VIEWS[view]}</span><div className="backup-actions"><button className="text-button" onClick={() => fileRef.current.click()}><Upload /><span>Import</span></button><button className="text-button" onClick={() => { download(`daily-updates-${today()}.json`, JSON.stringify(data, null, 2), 'application/json'); setToast('Backup downloaded'); }}><Download /><span>Backup</span></button></div></header>
      {error && <div className="storage-alert" role="alert">{error}</div>}
      <div className="page-content">
        <div className="page-heading"><div><p className="eyebrow">{view === 'overview' ? 'YOUR WORK, AT A GLANCE' : 'WORKSPACE'}</p><h1>{view === 'overview' ? 'Daily Updates' : VIEWS[view]}</h1><p id="page-subtitle">{new Date(`${currentDay}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p></div><button className="primary-button" onClick={() => setModal({ type: 'editor' })}><Plus /><span>Add update</span></button></div>
        <section className="metrics" aria-label="Update summary">{metricData.map(([label, value, Icon, caption]) => <div className="metric" key={label}><div className="metric-top"><span>{label}</span><Icon /></div><strong className="metric-value">{value}</strong><span className="metric-caption">{caption}</span></div>)}</section>
        <section className="updates-section" aria-labelledby="section-title">
          <div className="section-heading"><div><h2 id="section-title">{view === 'overview' ? "Today's updates" : view === 'team' ? 'People in this workspace' : VIEWS[view]}</h2><span className="record-count">{view === 'team' ? `${people.length} people` : `${rows.length} records`}</span></div><IconButton icon={FileDown} label="Export visible updates as CSV" onClick={() => download(`daily-updates-${today()}.csv`, toCsv(rows), 'text/csv;charset=utf-8')} disabled={!rows.length} /></div>
          <div className="filters"><label className="search-field"><Search /><span className="sr-only">Search updates</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, feature, or ticket" maxLength={200} /></label><label className="filter-field"><span className="sr-only">Filter by status</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option>{STATUSES.map(value => <option key={value}>{value}</option>)}</select></label><label className="filter-field date-filter"><span className="sr-only">Filter by date</span><input type="date" value={date} onChange={event => setDate(event.target.value)} min="1900-01-01" max="9999-12-31" /><IconButton icon={X} label="Show all dates" onClick={() => setDate('')} /></label></div>
          {!rows.length ? <div className="empty-state"><Inbox /><h3>{view === 'mine' && !data.profile.name ? 'Set up your profile' : data.updates.length ? 'No matching updates' : 'A fresh start for your workday'}</h3><p>{view === 'mine' && !data.profile.name ? 'No profile selected.' : data.updates.length ? 'No records for this selection.' : 'No updates recorded yet.'}</p><div className="empty-actions">{view === 'mine' && !data.profile.name ? <button className="primary-button" onClick={() => setModal({ type: 'profile' })}><Settings2 />Set profile</button> : <button className="primary-button" onClick={() => setModal({ type: 'editor' })}><Plus />Add update</button>}{!data.updates.length && <button className="secondary-button" onClick={addSamples}><Layers />Load sample updates</button>}{data.updates.length > 0 && <button className="secondary-button" onClick={() => { setSearch(''); setStatus(''); setDate(''); }}>Clear filters</button>}</div></div> : view === 'team' ? <div className="person-grid">{people.map(([name, updates]) => <article className="person-item" key={name}><span className="avatar">{initials(name)}</span><h3>{name}</h3><p>{updates[0].department || 'Unassigned'}</p><div className="person-stats"><div><strong>{updates.length}</strong><span>Updates</span></div><div><strong>{updates.filter(update => update.status === 'Blocked').length}</strong><span>Blocked</span></div></div><button className="person-link" onClick={() => navigate('all', name)}>View updates<ArrowRight size={14} /></button></article>)}</div> : <div className="table-wrap"><table><thead><tr><th>Employee</th><th>Feature / ticket</th><th>Status</th><th>ETA</th><th>Date</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{rows.map(update => <tr key={update.id}>
            <td><div className="person-cell"><span className="avatar">{initials(update.employeeName)}</span><span><span className="cell-title">{update.employeeName}</span><span className="cell-subtitle">{update.department || 'Unassigned'}</span></span></div></td>
            <td className="feature-cell"><span className="cell-title">{update.feature}</span><span className="ticket">{update.ticketNumber}</span><span className="cell-subtitle">{update.ticketDescription}</span></td>
            <td className="status-cell"><Status status={update.status} /></td><td className="eta-cell">{etaLabel(update)}{update.hasETAChange && <span className="eta-change">ETA changed</span>}</td><td className="date-cell">{dateLabel(update.date)}</td>
            <td className="actions-cell"><div className="row-actions"><IconButton icon={Eye} label={`View ${update.ticketNumber}`} onClick={() => setModal({ type: 'details', update })} /><IconButton icon={Pencil} label={`Edit ${update.ticketNumber}`} onClick={() => setModal({ type: 'editor', update })} /><IconButton icon={Trash2} label={`Delete ${update.ticketNumber}`} className="delete" onClick={() => setModal({ type: 'delete', update })} /></div></td>
          </tr>)}</tbody></table></div>}
        </section><footer className="page-footer"><span>Daily Updates</span><span>{data.savedAt ? `Saved ${new Date(data.savedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : 'No saved updates yet'}</span></footer>
      </div>
    </main>
    <input type="file" ref={fileRef} accept="application/json,.json" onChange={importBackup} hidden aria-label="Import backup file" />
    {modal?.type === 'editor' && <Editor key={modal.update?.id || 'new'} update={modal.update} profile={data.profile} onClose={closeModal} onSave={update => { commit({ ...data, updates: modal.update ? data.updates.map(item => item.id === update.id ? update : item) : [...data.updates, update] }); closeModal(); setToast('Update saved'); }} />}
    {modal?.type === 'profile' && <Profile profile={data.profile} onClose={closeModal} onSave={profile => { commit({ ...data, profile }); closeModal(); setToast('Profile saved'); }} />}
    {modal?.type === 'details' && <Details update={modal.update} onClose={closeModal} onEdit={() => setModal({ type: 'editor', update: modal.update })} />}
    {(modal?.type === 'delete' || modal?.type === 'import') && <Confirmation modal={modal} onClose={closeModal} onConfirm={() => { commit(modal.type === 'import' ? modal.data : { ...data, updates: data.updates.filter(update => update.id !== modal.update.id) }, modal.type === 'import'); closeModal(); setToast(modal.type === 'import' ? 'Backup restored' : 'Update deleted'); }} />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
