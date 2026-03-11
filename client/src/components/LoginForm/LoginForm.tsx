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
      <div className={styles.card}>
        <h1 className={styles.title}>{isSignup ? 'Create account' : 'Welcome back'}</h1>
        <p className={styles.subtitle}>
          {isSignup ? 'Start tracking your weather' : 'Sign in to your dashboard'}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {isSignup && (
            <div className={styles.field}>
              <label htmlFor="name" className={styles.label}>Name</label>
              <input
                id="name"
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? 'Min 8 characters' : 'Your password'}
              required
              minLength={isSignup ? 8 : undefined}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
          </div>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Please wait\u2026' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          className={styles.toggle}
          onClick={() => { setIsSignup(!isSignup); setError(''); }}
        >
          {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
