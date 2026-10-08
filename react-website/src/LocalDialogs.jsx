import { useEffect, useRef, useState } from 'react';
import { Check, Trash2, Upload, X } from 'lucide-react';

function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} className="small-dialog" aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }}><div className="dialog-heading"><h2>{title}</h2><button type="button" className="icon-button" aria-label="Close" title="Close" onClick={onClose}><X /></button></div>{children}</dialog>;
}

export function Profile({ profile, onSave, onClose }) {
  const [error, setError] = useState('');
  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const next = { name: values.name.trim(), department: values.department.trim() };
    if (!next.name) return setError('Enter your name.');
    try { onSave(next); } catch (err) { setError(err.message); }
  }
  return <Modal title="Your profile" onClose={onClose}><form onSubmit={submit}><div className="dialog-body"><label>Your name<input name="name" required maxLength={80} defaultValue={profile.name} autoComplete="name" autoFocus /></label><label>Department (optional)<input name="department" maxLength={80} defaultValue={profile.department} /></label>{error && <p className="form-error" role="alert">{error}</p>}</div><div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button"><Check />Save profile</button></div></form></Modal>;
}

export function Confirmation({ modal, onConfirm, onClose }) {
  const [error, setError] = useState('');
  const importing = modal.type === 'import';
  return <Modal title={importing ? 'Restore backup?' : 'Delete update?'} onClose={onClose}><div className="dialog-body"><p>{importing ? `Replace this browser's profile and updates with ${modal.data.updates.length} records from the backup?` : `Delete ${modal.update.ticketNumber}: ${modal.update.feature}? This cannot be undone.`}</p>{error && <p className="form-error" role="alert">{error}</p>}</div><div className="dialog-actions"><button className="secondary-button" onClick={onClose}>Cancel</button><button className={importing ? 'primary-button' : 'danger-button'} onClick={() => { try { onConfirm(); } catch (err) { setError(err.message); } }}>{importing ? <><Upload />Restore backup</> : <><Trash2 />Delete update</>}</button></div></Modal>;
}
