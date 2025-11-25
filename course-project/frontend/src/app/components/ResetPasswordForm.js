'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../login/login.module.css';
import Button from './Button';
import colors from '../constants/colors';

export default function ResetPasswordForm() {
  const router = useRouter();

  const [step, setStep] = useState(1); // 1 = token input, 2 = set new password 
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const goBack = () => router.push('/login');

  // proceed from token input to password input
  const submitResetToken = async (e) => {
    e.preventDefault();
    setError('');
    if (!token.trim()) {
      setError('Enter reset token');
      return;
    }

	// purposefully fail once to validate token first
	const res = await fetch(`/auth/resets/${encodeURIComponent(token)}`, {
    	method: 'POST',
        headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({utorid: sessionStorage.getItem('utorid'), password: ''}) // will fail on password (400)
	});
	const data = await res.json()

	if (res.status !== 400) { // not password error
		setError(data?.error || 'Invalid reset token');
		return;
	}

    setStep(2);
  };

  const submitNewPassword = async (e) => {
    e?.preventDefault?.();
    setError('');
    setSuccess('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/auth/resets/${encodeURIComponent(token.trim())}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utorid: sessionStorage.getItem('utorid'), password: password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
		throw new Error(data?.error || 'Failed to reset password');
	  }

      setSuccess('Password reset successfully.\nRedirecting to sign in…');
      setTimeout(() => router.push('/login'), 900);
    } catch (err) {
      setError(err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container} style={{ '--primary': colors.primary }}>
      <div className={styles.card}>
        <h1 className={styles.title}>Reset password</h1>

		{/* enter reset token */}
        {step === 1 && (<>
		  <h2 className={styles.note}>A token has been sent to your email. Please use it within 1 hour to reset your password.</h2>
		  
          <form className={styles.form} onSubmit={submitResetToken} noValidate>
            <label className={styles.label}>
              Reset token
              <input
                className={styles.input}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste the reset token"
                required
              />
            </label>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            <div className={styles.actions}>
              <Button kind="ghost" onClick={goBack}>Back</Button>
              <Button type="submit">Continue</Button>
            </div>
          </form>
		  </>
        )}

		{/* set new password */}
        {step === 2 && (
          <form className={styles.form} onSubmit={submitNewPassword} noValidate>
            <label className={styles.label}>
              New password
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </label>

            <label className={styles.label}>
              Confirm new password
              <input
                className={styles.input}
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Enter new password again"
                required
              />
            </label>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            <div className={styles.actions}>
              <Button kind="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={submitNewPassword} disabled={loading}>{loading ? 'Setting…' : 'Set Password'}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}