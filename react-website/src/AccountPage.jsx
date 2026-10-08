import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { PageLink } from './ApplicationPages.jsx';
import { loginAccount, registerAccount } from './localAccounts.js';

function PasswordField({ label, name, registering }) {
  const [visible, setVisible] = useState(false);
  return <div className="account-field"><label htmlFor={name}>{label}</label><div className="password-field"><input id={name} name={name} type={visible ? 'text' : 'password'} required minLength={registering ? 8 : undefined} maxLength={128} autoComplete={registering ? 'new-password' : 'current-password'} /><button type="button" title={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={20} /> : <Eye size={20} />}</button></div></div>;
}

export function AccountPage({ registering, navigate, onSuccess }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    if (registering && fields.password !== fields.confirmPassword) return setError('Passwords do not match.');
    setBusy(true); setError('');
    try {
      const user = registering ? await registerAccount(fields) : await loginAccount(fields.email, fields.password);
      if (active.current) onSuccess(user);
    } catch (err) { if (active.current) setError(err.message); }
    finally { if (active.current) setBusy(false); }
  }
  return <section className="account-page"><div className="account-panel"><div className="account-heading">{registering ? <UserPlus /> : <LogIn />}<h1>{registering ? 'Create Account' : 'Welcome Back'}</h1><p>{registering ? 'Join Daily Updates to track your progress' : 'Log in to your Daily Updates account'}</p></div><p className="account-notice">Local account only. All records remain accessible in this browser. No shared database or email password reset. Use a unique password.</p><form onSubmit={submit}>{registering && <><label>Your name<input name="name" required maxLength={80} autoComplete="name" /></label><label>Department (optional)<input name="department" maxLength={80} /></label></>}<label>Email Address<input name="email" type="email" required maxLength={254} autoComplete="username" placeholder="name@example.com" /></label><PasswordField name="password" label="Password" registering={registering} />{registering && <PasswordField name="confirmPassword" label="Confirm Password" registering />}{registering && <p className="password-requirements">Password: 8 to 128 characters.</p>}{error && <p className="form-error" role="alert">{error}</p>}<button className={registering ? 'account-register-button' : 'primary-button'} disabled={busy} type="submit">{registering ? <UserPlus size={18} /> : <LogIn size={18} />}{busy ? 'Please wait...' : registering ? 'Create Account' : 'Log In'}</button><div className="account-divider">{registering ? 'Already registered?' : "Don't have an account?"}</div><PageLink to={registering ? 'login' : 'register'} navigate={navigate} kind="light">{registering ? 'Log In Instead' : 'Create New Account'}</PageLink></form></div></section>;
}
