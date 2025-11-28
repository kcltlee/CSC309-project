'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../components/Button';
import styles from '../settings/settings.module.css';

export default function EditProfileForm() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [utorid, setUtorid] = useState('');
  const [birthday, setBirthday] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchMe() {
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
        setName(data.name || '');
        setEmail(data.email || '');
        setUtorid(data.utorid || '');
        setBirthday(data.birthday || '');
        setAvatarUrl(data.avatarUrl || null);
        setVerified(Boolean(data.verified));
        setInitialData({
          name: data.name || '',
          email: data.email || '',
          birthday: data.birthday || '',
          avatarUrl: data.avatarUrl || null
        });
      } catch (e) {
        // ignore on mount
      }
    }
    fetchMe();
    return () => { mounted = false; };
  }, [token]);

  const onFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setAvatarFile(f || null);
    if (f) {
      const url = URL.createObjectURL(f);
      setAvatarUrl(url);
    } else {
      setAvatarUrl(initialData?.avatarUrl || null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let res;
      // if avatar chosen, send multipart/form-data
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        fd.append('name', name.trim());
        fd.append('email', email.trim());
        if (birthday) fd.append('birthday', birthday);
        res = await fetch('/users/me', {
          method: 'PATCH',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: fd
        });
      } else {
        // send JSON
        res = await fetch('/users/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            birthday: birthday || undefined
          })
        });
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || json?.message || `Error ${res.status}`);
      // update avatar url if backend returned full user
      if (json.avatarUrl) setAvatarUrl(json.avatarUrl);

      // update initialData so form becomes not-dirty after save
      setInitialData({
        name: name || '',
        email: email || '',
        birthday: birthday || '',
        avatarUrl: json.avatarUrl || avatarUrl || null
      });
      // clear chosen file once uploaded
      setAvatarFile(null);

      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const isDirty = Boolean(initialData) && (
    name !== (initialData.name || '') ||
    email !== (initialData.email || '') ||
    birthday !== (initialData.birthday || '') ||
    avatarFile !== null
  );

  return (
    <form className={styles.formRight} onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <h3 className={styles.formTitle}>Edit profile</h3>
        {verified && <span className={styles.verifiedBadge}>Verified</span>}
      </div>

      <div className={styles.avatarRow}>
        <div className={styles.avatarPreview}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className={styles.avatarImage} />
          ) : (
            <div className={styles.avatarPlaceholder}>No avatar</div>
          )}
        </div>

        <div className={styles.avatarControls}>
          <label className={styles.label}>
            Change avatar
            <input type="file" accept="image/*" onChange={onFileChange} />
          </label>
        </div>
      </div>

      <label className={styles.label}>
        UTORid
        <input className={styles.input} value={utorid} title="UTORid cannot be changed" readOnly disabled />
      </label>

      <label className={styles.label}>
        Full name
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          required
        />
      </label>

      <label className={styles.label}>
        Email
        <input
          className={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@utoronto.ca"
        />
      </label>

      <label className={styles.label}>
        Birthday
        <input
          className={styles.input}
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          placeholder="YYYY-MM-DD"
        />
      </label>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.formActions}>
        <Button type="submit" disabled={loading || !isDirty}>
          {loading ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}