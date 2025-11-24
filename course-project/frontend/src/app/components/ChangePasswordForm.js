'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../components/Button';
import styles from '../settings/settings.module.css';

export default function ChangePasswordForm() {
  const { token } = useAuth();
  const [hasPassword, setHasPassword] = useState(true); // assume true until we fetch
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function checkPassword() {
      try {
        const res = await fetch('/users/me', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        // usually users dont have passwords when first created 
        const pw = data?.password;
        setHasPassword(!(pw == '' || pw == null || pw == undefined));
      } catch (e) {
        // keep default if fetch fails
      }
    }
    checkPassword();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirm) {
        setError('Passwords do not match');
        return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/users/me/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          old: hasPassword ? currentPassword : '',
          new: newPassword
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || `Error ${res.status}`);
      setSuccess(hasPassword ? 'Password updated successfully.' : 'Password set successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      // after setting password, update state
      setHasPassword(true);
    } catch (err) {
      setError(err?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const title = hasPassword ? 'Reset password' : 'Set password';
  const submitLabel = hasPassword ? (loading ? 'Changing...' : 'Change Password') : (loading ? 'Setting...' : 'Set Password');

  return (
    <form className={styles.formRight} onSubmit={handleSubmit} noValidate>
      <h3 className={styles.formTitle}>{title}</h3>

      {!hasPassword && <div className={styles.note}>‼️ You do not have a password set yet.</div>}

      {hasPassword && (
        <label className={styles.label}>
          Current password
          <input
            className={styles.input}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            required={hasPassword}
          />
        </label>
      )}

      <label className={styles.label}>
        New password
        <input
          className={styles.input}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
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

      <div className={styles.formActions}>
        <Button type="submit" disabled={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}