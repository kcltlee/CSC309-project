'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from './Button';
import styles from '../login/login.module.css';
import colors from '../constants/colors';

export default function LoginForm() {
  const [utorid, setUtorid] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(utorid.trim(), password);
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    if (!utorid.trim()) {
      setError('Enter your UTORid first');
      return;
    }

    const res = await fetch('/auth/resets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ utorid: utorid.trim() })
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data?.error || 'Failed to generate reset token');
    } else {
	  sessionStorage.setItem('utorid', utorid.trim());
      router.push('/login/reset');
    }
  };

  return (
    <div className={styles.container} style={{ '--primary': colors.primary }}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign in</h1>

        <form className={styles.form} onSubmit={submit} noValidate>
          <label className={styles.label}>
            UTORid
            <input
              className={styles.input}
              value={utorid}
              onChange={(e) => setUtorid(e.target.value)}
              placeholder="e.g. smithb1"
              autoComplete="username"
              required
            />
          </label>

          <label className={styles.label}>
            Password
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              required
            />
          </label>

          <div>
            <button type="button" className={styles.forgot} onClick={generateToken}>
              Forgot password?
            </button>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <Button disabled={loading} onClick={submit}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}