import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './LoginForm.module.css';

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login, register } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <span className={styles.formLabel}>AUTHENTICATION</span>
        <h1 className={styles.title}>{isSignup ? 'REGISTER' : 'SIGN IN'}</h1>

        <form onSubmit={handleSubmit} className={styles.fields}>
          {isSignup && (
            <div className={styles.field}>
              <label htmlFor="name" className={styles.label}>NAME</label>
              <input
                id="name"
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>EMAIL</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>PASSWORD</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isSignup ? 8 : undefined}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <div className={styles.error} role="alert">
              ERROR: {error.toUpperCase()}
            </div>
          )}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'PLEASE WAIT\u2026' : isSignup ? 'REGISTER \u2192' : 'AUTHENTICATE \u2192'}
          </button>
        </form>

        <button
          type="button"
          className={styles.toggle}
          onClick={() => { setIsSignup(!isSignup); setError(''); }}
        >
          {isSignup ? (
            <>HAVE AN ACCOUNT? <span className={styles.toggleAction}>SIGN IN</span></>
          ) : (
            <>NO ACCOUNT? <span className={styles.toggleAction}>REGISTER</span></>
          )}
        </button>
      </div>
    </div>
  );
}
