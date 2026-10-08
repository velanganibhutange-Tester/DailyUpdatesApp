import { useState } from 'react';
import { ArrowLeft, Check, ClipboardList, Clock3, Eye, Home, Pencil, Plus, RotateCcw, Ticket, TriangleAlert, Trash2, User, Users } from 'lucide-react';
import { STATUSES, today } from './storage.js';

export const dateLabel = date => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
export const etaLabel = update => `${update.estimatedHours} hours ${update.estimatedMinutes} mins ${update.estimatedSeconds} secs`;
const STATUS_CLASS = { 'In Progress': 'progress', 'Ready for Production': 'ready', Blocked: 'blocked', 'In UAT': 'uat', Done: 'done' };
export function Status({ status }) { return <span className={`status-badge status-${STATUS_CLASS[status]}`}>{status}</span>; }

export function PageLink({ to, navigate, children, icon: Icon, kind = 'primary' }) {
  return <a className={`page-button ${kind}-button`} href={`#${to}`} onClick={event => { event.preventDefault(); navigate(to); }}>{Icon && <Icon size={18} />}{children}</a>;
}

export function UpdateEditor({ update, profile, onSave, navigate }) {
  const [changed, setChanged] = useState(update?.hasETAChange ?? false);
  const [error, setError] = useState('');
  const fields = update || { employeeName: profile.name, department: profile.department, status: '' };
  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    for (const key of ['employeeName', 'department', 'feature', 'ticketNumber', 'ticketDescription', 'blockers', 'etaChangeDescription']) values[key] = String(values[key] || '').trim();
    if (['employeeName', 'feature', 'ticketNumber', 'ticketDescription'].some(key => !values[key])) return setError('Enter a name, feature, ticket number, and description.');
    if (changed && !values.etaChangeDescription) return setError('ETA change description is required when ETA is marked as changed.');
    for (const key of ['estimatedHours', 'estimatedMinutes', 'estimatedSeconds']) values[key] = Number(values[key]);
    values.hasETAChange = changed;
    if (!changed) values.etaChangeDescription = '';
    try { onSave({ ...values, date: update?.date || today(), id: update?.id || crypto.randomUUID(), createdAt: update?.createdAt || new Date().toISOString() }); }
    catch (err) { setError(err.message); }
  }
  return <section className="application-page">
    <h1 className="application-title">{update ? <Pencil /> : <Plus />}{update ? 'Edit Daily Update' : 'Add Daily Update with Project Details'}</h1>
    <form className="application-form" onSubmit={submit} onReset={() => { setChanged(update?.hasETAChange ?? false); setError(''); }}>
      <div className="employee-fields form-grid"><label>Employee name<input name="employeeName" required maxLength={80} defaultValue={fields.employeeName} autoComplete="name" /></label><label>Department (optional)<input name="department" maxLength={80} defaultValue={fields.department} /></label></div>
      <section className="project-fields" aria-labelledby="project-heading">
        <h2 id="project-heading"><Ticket />Project Management Details</h2>
        <label>Feature/Module<input name="feature" required maxLength={160} placeholder="e.g., Authentication, Dashboard, API Integration..." defaultValue={fields.feature} /></label>
        <label>Ticket Number<input name="ticketNumber" required maxLength={100} placeholder="e.g., PHOENIX-11516" defaultValue={fields.ticketNumber} /></label>
        <label>Ticket Description<textarea name="ticketDescription" required maxLength={5000} rows={3} placeholder="Detailed ticket description..." defaultValue={fields.ticketDescription} /></label>
        <label>Status<select name="status" aria-label="Status" required defaultValue={fields.status}><option value="">-- Select Status --</option>{STATUSES.map(status => <option key={status}>{status}</option>)}</select></label>
        <label>Blockers (if any)<textarea name="blockers" maxLength={2000} rows={3} placeholder="Describe any blockers preventing progress..." defaultValue={fields.blockers} /></label>
      </section>
      <section className="eta-form-section" aria-labelledby="eta-heading">
        <h2 id="eta-heading"><Clock3 />Estimated Time &amp; ETA Changes</h2>
        <div className="eta-inputs">{['Hours', 'Minutes', 'Seconds'].map((label, index) => <label key={label}>{label}<input name={`estimated${label}`} type="number" required min={0} max={index ? 59 : 23} step={1} defaultValue={fields[`estimated${label}`] || 0} /></label>)}</div>
        <label className="checkbox-label"><input type="checkbox" checked={changed} onChange={event => setChanged(event.target.checked)} />Has ETA Changed?</label>
        {changed && <label>ETA Change Description<textarea name="etaChangeDescription" required maxLength={2000} rows={3} placeholder="Describe the ETA change and reason..." defaultValue={fields.etaChangeDescription} /></label>}
      </section>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="application-actions"><button className="primary-button" type="submit"><Check />{update ? 'Save Changes' : 'Save Update'}</button><button className="secondary-button" type="reset"><RotateCcw />Clear Form</button><PageLink to="mine" navigate={navigate} icon={ClipboardList} kind="success">View My Updates</PageLink><PageLink to="home" navigate={navigate} icon={Home} kind="secondary">Home</PageLink></div>
    </form>
  </section>;
}

export function UpdateCards({ updates, mode = 'home', navigate, onDelete }) {
  return <div className="update-records">{updates.map(update => <article className="update-record" key={update.id} data-ticket={update.ticketNumber}>
    <header className="update-record-heading"><div><h3>{update.feature}</h3><p>{mode !== 'mine' && <><User size={14} />{update.employeeName}<span className="meta-divider">|</span></>}{dateLabel(update.date)}</p></div><div className="record-status">{mode !== 'mine' && <Status status={update.status} />}{update.hasETAChange && <span className="eta-changed-label"><TriangleAlert size={14} />ETA Changed</span>}</div></header>
    {mode === 'home' ? <dl className="record-facts">{[['Feature/Module', update.feature], ['Ticket No(s)', update.ticketNumber], ['Description', update.ticketDescription], ['Status', update.status], ['ETA', etaLabel(update)], ['Blockers', update.blockers || 'None'], ['ETA Change', update.hasETAChange ? update.etaChangeDescription : 'N/A']].map(([label, value]) => <div key={label}><dt>{label}:</dt><dd>{value}</dd></div>)}</dl> : <>
      <div className={`record-ticket ${mode === 'mine' ? 'record-ticket-with-status' : ''}`}><div><span>Ticket Number</span><strong>{update.ticketNumber}</strong></div>{mode === 'mine' && <div><span>Status</span><Status status={update.status} /></div>}</div><div className="record-description"><strong>Ticket Description</strong><p>{update.ticketDescription}</p></div>
      <div className="record-eta"><strong><Clock3 size={17} />{mode === 'mine' ? 'Estimated Time' : 'ETA'}: {etaLabel(update)}</strong>{update.hasETAChange && <div className="record-eta-change"><strong>ETA Changed</strong><p>{update.etaChangeDescription}</p></div>}</div>
      {update.blockers && <div className="record-blockers"><strong><TriangleAlert size={17} />Blockers</strong><p>{update.blockers}</p></div>}
    </>}
    <div className="record-created">Added on: {new Date(update.createdAt).toLocaleString()}</div>
    <div className="application-actions record-actions"><PageLink to={`details/${encodeURIComponent(update.id)}/${mode}`} navigate={navigate} icon={Eye} kind="info">View Details</PageLink>{mode === 'mine' && <PageLink to={`edit/${encodeURIComponent(update.id)}`} navigate={navigate} icon={Pencil}>Edit</PageLink>}<button type="button" className="danger-button" aria-label={`Delete ${update.ticketNumber}`} onClick={() => onDelete(update)}><Trash2 />Delete</button></div>
  </article>)}</div>;
}

export function UpdateDetails({ update, from = 'mine', navigate }) {
  return <section className="application-page details-page"><div className="application-heading"><h1 className="application-title"><ClipboardList />Update Details</h1><PageLink to={from === 'home' ? 'home' : from === 'team' || from === 'member' ? 'team' : 'mine'} navigate={navigate} kind="secondary" icon={ArrowLeft}>{from === 'home' ? 'Back to Home' : from === 'team' || from === 'member' ? 'Back to Dashboard' : 'Back to My Updates'}</PageLink></div>
    <div className="details-summary"><h2>{update.feature}</h2><p>{update.employeeName} | {dateLabel(update.date)}</p><Status status={update.status} /></div>
    <dl className="record-facts details-facts">{[['Feature/Module', update.feature], ['Ticket No(s)', update.ticketNumber], ['Description', update.ticketDescription], ['Status', update.status], ['ETA', etaLabel(update)], ['Blockers', update.blockers || 'None'], ['ETA Change', update.hasETAChange ? update.etaChangeDescription : 'N/A']].map(([label, value]) => <div key={label}><dt>{label}:</dt><dd>{value}</dd></div>)}</dl>
    <div className="application-actions"><PageLink to={`edit/${encodeURIComponent(update.id)}`} navigate={navigate} icon={Pencil}>Edit</PageLink><PageLink to="mine" navigate={navigate} kind="secondary" icon={ArrowLeft}>Back to My Updates</PageLink></div>
  </section>;
}

export function TeamMembers({ names, navigate }) {
  if (!names.length) return null;
  return <section className="team-members"><h2><Users />Team Members</h2><div className="member-links">{names.map(name => <PageLink key={name} to={`member/${encodeURIComponent(name)}`} navigate={navigate} kind="light" icon={User}>{name}</PageLink>)}</div></section>;
}
