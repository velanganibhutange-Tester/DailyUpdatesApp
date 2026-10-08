import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ClipboardList, Download, FileDown, Home, LogOut, Plus, Search, Settings2, Upload, Users, X } from 'lucide-react';
import { STATUSES, STORAGE_KEY, today, loadData, saveData, validateData, download, toCsv } from './storage.js';
import { PageLink, TeamMembers, UpdateCards, UpdateDetails, UpdateEditor } from './ApplicationPages.jsx';
import { Confirmation, Profile } from './LocalDialogs.jsx';
import { AccountPage } from './AccountPage.jsx';
import { getSession, clearSession, setSession } from './localAccounts.js';

function parseRoute(value = location.hash.slice(1)) {
  let [view = 'home', arg = '', from = 'mine'] = value.split('/');
  view = ({ overview: 'home', all: 'team' })[view] || view;
  if (!['home', 'add', 'mine', 'team', 'member', 'edit', 'details', 'login', 'register'].includes(view)) view = 'home';
  try { return { view, arg: decodeURIComponent(arg), from }; } catch { return { view: 'home', arg: '', from: 'mine' }; }
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
  const [route, setRoute] = useState(parseRoute);
  const [account, setAccount] = useState(() => {
    const user = getSession();
    if (user && user.name === initial.data.profile.name && user.department === initial.data.profile.department) return user;
    clearSession(); return null;
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState(parseRoute().view === 'team' ? today() : '');
  const [currentDay, setCurrentDay] = useState(today);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const fileRef = useRef(null);
  const rawRef = useRef(undefined);
  const priorDay = useRef(currentDay);

  function navigate(to) {
    if (location.hash !== `#${to}`) history.pushState(null, '', `#${to}`);
    const next = parseRoute(to);
    setRoute(next); setDate(next.view === 'team' ? today() : ''); setSearch(''); setStatus('');
    window.scrollTo(0, 0);
  }
  useEffect(() => {
    try { rawRef.current = localStorage.getItem(STORAGE_KEY); } catch { /* loadData already reports storage errors. */ }
    const sync = event => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      const loaded = loadData(); setData(loaded.data); setError(loaded.error); setModal(null);
      try { rawRef.current = localStorage.getItem(STORAGE_KEY); } catch { rawRef.current = undefined; }
      clearSession(); setAccount(null);
      if (['add', 'edit'].includes(parseRoute().view)) {
        navigate('home'); setToast('Data changed in another tab. Reopen the form to use the latest records.');
      }
    };
    const hash = () => { const next = parseRoute(); setRoute(next); setDate(next.view === 'team' ? today() : ''); setSearch(''); setStatus(''); window.scrollTo(0, 0); };
    const day = () => setCurrentDay(today());
    const interval = setInterval(day, 30000);
    addEventListener('storage', sync); addEventListener('hashchange', hash); addEventListener('focus', day);
    return () => { clearInterval(interval); removeEventListener('storage', sync); removeEventListener('hashchange', hash); removeEventListener('focus', day); };
  }, []);
  useEffect(() => { if (date === priorDay.current) setDate(currentDay); priorDay.current = currentDay; }, [currentDay]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4000); return () => clearTimeout(timer); }, [toast]);

  function commit(next, restore = false) {
    if (initial.error && rawRef.current === undefined && !restore) throw new Error('Browser storage is unavailable. Export a backup before closing.');
    if (error && !restore) throw new Error('Resolve the storage error or restore a valid backup before saving.');
    try {
      if (localStorage.getItem(STORAGE_KEY) !== rawRef.current) throw new Error('Data changed in another tab. Reload this page before saving.');
      const saved = saveData(next); rawRef.current = JSON.stringify(saved); setData(saved); setError(''); return saved;
    } catch (err) { setError(err.message); throw err; }
  }
  async function importBackup(event) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Choose a JSON backup smaller than 10 MB.');
      setModal({ type: 'import', data: validateData(JSON.parse(await file.text())) });
    } catch (err) { setToast(err instanceof SyntaxError ? 'The selected file is not valid JSON.' : err.message); }
  }
  function addSamples() {
    try { if (!data.updates.length) commit({ ...data, updates: samples() }); setToast('Sample updates added'); }
    catch (err) { setToast(err.message); }
  }
  const names = [...new Set([data.profile.name, ...data.updates.map(update => update.employeeName)].filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const rows = data.updates.filter(update => {
    if (route.view === 'home') return update.date === currentDay;
    if (route.view === 'mine' && (!data.profile.name || update.employeeName.toLocaleLowerCase() !== data.profile.name.toLocaleLowerCase())) return false;
    if (route.view === 'member' && update.employeeName !== route.arg) return false;
    return (!date || update.date === date) && (!status || update.status === status) && (!search.trim() || [update.employeeName, update.department, update.feature, update.ticketNumber, update.ticketDescription].join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  }).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const selected = data.updates.find(update => update.id === route.arg);
  const closeModal = () => setModal(null);
  const empty = <div className="application-empty"><p>{data.updates.length ? 'No updates found for this selection.' : 'No updates submitted yet.'}</p><div className="application-actions"><PageLink to="add" navigate={navigate} icon={Plus}>Add New Update</PageLink>{!data.updates.length && <button className="secondary-button" onClick={addSamples}>Load sample updates</button>}{route.view === 'mine' && !data.profile.name && <button className="secondary-button" onClick={() => setModal({ type: 'profile' })}>Set your profile</button>}</div></div>;
  const toolbar = <div className="application-toolbar"><label className="search-field"><Search /><span className="sr-only">Search updates</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, feature, or ticket" maxLength={200} /></label><label className="filter-field"><span className="sr-only">Filter by status</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option>{STATUSES.map(value => <option key={value}>{value}</option>)}</select></label><label className="filter-field date-filter"><span className="sr-only">Filter by date</span><input type="date" value={date} onChange={event => setDate(event.target.value)} min="1900-01-01" max="9999-12-31" /><button type="button" className="icon-button" title="Show all dates" aria-label="Show all dates" onClick={() => setDate('')}><X /></button></label><button className="icon-button" title="Export visible updates as CSV" aria-label="Export visible updates as CSV" disabled={!rows.length} onClick={() => download(`daily-updates-${today()}.csv`, toCsv(rows), 'text/csv;charset=utf-8')}><FileDown /></button></div>;
  const cards = <UpdateCards updates={rows} mode={route.view} navigate={navigate} onDelete={update => setModal({ type: 'delete', update })} />;
  return <div className="application-shell">
    <header className="application-nav"><div className="application-nav-inner"><a className="application-brand" href="#home" onClick={event => { event.preventDefault(); navigate('home'); }}><img src={`${import.meta.env.BASE_URL}brand.svg`} alt="" />Daily Updates</a><nav className="application-nav-links" aria-label="Main navigation">{[['home', 'Home', Home], ['add', 'Add Update', Plus], ['mine', 'My Updates', ClipboardList], ['team', 'Team Dashboard', Users]].map(([to, label, Icon]) => <a key={to} href={`#${to}`} aria-current={route.view === to ? 'page' : undefined} onClick={event => { event.preventDefault(); navigate(to); }}><Icon />{label}</a>)}</nav><div className="application-account-links"><button className="application-profile" aria-label="Your profile" title="Your profile" onClick={() => setModal({ type: 'profile' })}><Settings2 /><span>{data.profile.name ? `Hello, ${data.profile.name}!` : 'Your profile'}</span></button>{account ? <button className="nav-account-button" onClick={() => { clearSession(); setAccount(null); try { commit({ ...data, profile: { name: '', department: '' } }); navigate('login'); } catch (err) { setToast(err.message); } }}><LogOut size={16} />Logout</button> : <><PageLink to="login" navigate={navigate} kind="nav-account">Login</PageLink><PageLink to="register" navigate={navigate} kind="nav-account">Register</PageLink></>}</div></div></header>
    {error && <div className="storage-alert" role="alert">{error}</div>}
    <main className="application-content">
      {route.view === 'home' && <><section className="welcome-section"><h1><ClipboardList />Welcome to Daily Updates App</h1><p>Track and manage daily updates efficiently</p><div className="application-actions"><PageLink to="add" navigate={navigate} icon={Plus}>Add New Update</PageLink><PageLink to="mine" navigate={navigate} icon={ClipboardList} kind="secondary">View My Updates</PageLink><PageLink to="team" navigate={navigate} icon={Users} kind="success">Team Dashboard</PageLink></div></section><TeamMembers names={names} navigate={navigate} /><section className="home-updates"><div className="application-heading"><h2>Today's Updates</h2><span className="application-count">{rows.length} updates</span></div>{rows.length ? cards : empty}</section></>}
      {(route.view === 'add' || route.view === 'edit') && (route.view === 'add' || selected ? <UpdateEditor key={`${route.view}/${route.arg}`} update={route.view === 'edit' ? selected : undefined} profile={data.profile} navigate={navigate} onSave={update => { commit({ ...data, profile: data.profile.name ? data.profile : { name: update.employeeName, department: update.department }, updates: route.view === 'edit' ? data.updates.map(item => item.id === update.id ? update : item) : [...data.updates, update] }); navigate('mine'); setToast('Update saved'); }} /> : <section className="application-page"><h1>Update not found</h1><PageLink to="mine" navigate={navigate}>Back to My Updates</PageLink></section>)}
      {['mine', 'team', 'member'].includes(route.view) && <section className="application-page"><div className="application-heading"><h1 className="application-title"><ClipboardList />{route.view === 'mine' ? 'My Daily Updates' : route.view === 'team' ? 'Team Project Management Dashboard' : `Updates for ${route.arg}`}</h1>{route.view === 'mine' ? <PageLink to="add" navigate={navigate} icon={Plus}>Add New Update</PageLink> : route.view === 'member' ? <PageLink to="team" navigate={navigate} icon={ArrowLeft} kind="secondary">Back to Dashboard</PageLink> : <span className="application-count">{rows.length} updates</span>}</div>{toolbar}{route.view === 'team' && <section className="application-summary" aria-label="Team summary">{[['Total Updates', rows.length], ['In Progress', rows.filter(update => update.status === 'In Progress').length], ['Blocked', rows.filter(update => update.status === 'Blocked').length], ['Done', rows.filter(update => update.status === 'Done').length]].map(([label, count]) => <div className="application-stat" key={label}><strong>{count}</strong><span>{label}</span></div>)}</section>}{rows.length ? cards : empty}<div className="application-actions application-bottom-actions"><PageLink to="add" navigate={navigate} icon={Plus} kind="success">Add New Update</PageLink><PageLink to="home" navigate={navigate} icon={Home} kind="secondary">Home</PageLink></div></section>}
      {route.view === 'details' && (selected ? <UpdateDetails update={selected} from={route.from} navigate={navigate} /> : <section className="application-page"><h1>Update not found</h1><PageLink to="mine" navigate={navigate}>Back to My Updates</PageLink></section>)}
      {['login', 'register'].includes(route.view) && <AccountPage key={route.view} registering={route.view === 'register'} navigate={navigate} onSuccess={user => { commit({ ...data, profile: { name: user.name, department: user.department } }); setSession(user); setAccount(user); navigate('home'); setToast('Logged in on this browser'); }} />}
    </main>
    <footer className="application-footer"><p>Copyright {new Date().getFullYear()} Daily Updates App | All rights reserved</p><div className="application-backups"><span>Browser-only data</span><button onClick={() => fileRef.current.click()}><Upload size={15} />Import</button><button onClick={() => { download(`daily-updates-${today()}.json`, JSON.stringify(data, null, 2), 'application/json'); setToast('Backup downloaded'); }}><Download size={15} />Backup</button></div></footer>
    <input type="file" ref={fileRef} accept="application/json,.json" onChange={importBackup} hidden aria-label="Import backup file" />
    {modal?.type === 'profile' && <Profile profile={data.profile} onClose={closeModal} onSave={profile => { commit({ ...data, profile }); clearSession(); setAccount(null); closeModal(); setToast('Profile saved'); }} />}
    {(modal?.type === 'delete' || modal?.type === 'import') && <Confirmation modal={modal} onClose={closeModal} onConfirm={() => { commit(modal.type === 'import' ? modal.data : { ...data, updates: data.updates.filter(update => update.id !== modal.update.id) }, modal.type === 'import'); if (modal.type === 'import') { clearSession(); setAccount(null); } closeModal(); setToast(modal.type === 'import' ? 'Backup restored' : 'Update deleted'); }} />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
