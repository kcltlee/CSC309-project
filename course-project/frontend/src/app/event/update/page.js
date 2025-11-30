'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/app/components/Button';
import styles from '../event.module.css';

/* Manager only page to update events */

export default function UpdateEvent() {
  const [eventId, setEventId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState(''); 
  const [points, setPoints] = useState('');

  const [original, setOriginal] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  async function loadEvent() {
    setMessage(''); setError(false);
    if (!backend) { setError(true); setMessage('Backend URL not configured'); return; }
    const idNum = Number(eventId);
    if (!Number.isInteger(idNum)) { setError(true); setMessage('Enter a numeric ID'); return; }
    try {
      setLoadingExisting(true);
      const res = await fetch(`${backend}/events/${idNum}`, {
        // headers: { Authorization: `Bearer ${token}` }
        credentials: 'include'
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setOriginal(body);
      setMessage(`Loaded event #${idNum}. Fill only fields you wish to change.`);
    } catch (e) {
      setError(true); setMessage(e.message);
    } finally {
      setLoadingExisting(false);
    }
  }

  async function handleSend() {
    setMessage(''); 
    setError(false);

    const idNum = Number(eventId);
    if (!Number.isInteger(idNum)) { setError(true); setMessage('Valid numeric ID required'); return; }

    const payload = {};

    if (name.trim()) payload.name = name.trim();
    if (description.trim()) payload.description = description.trim();
    if (location.trim()) payload.location = location.trim();

    if (startTime) {
      const s = new Date(startTime);
      if (isNaN(s)) { setError(true); setMessage('Invalid start time'); return; }
      payload.startTime = s.toISOString();
    }
    if (endTime) {
      const e = new Date(endTime);
      if (isNaN(e)) { setError(true); setMessage('Invalid end time'); return; }
      const refStart = payload.startTime
        ? new Date(payload.startTime)
        : (original?.startTime ? new Date(original.startTime) : null);
      if (refStart && e <= refStart) { setError(true); setMessage('End must be after start'); return; }
      payload.endTime = e.toISOString();
    }

    if (capacity !== '') {
      const c = Number(capacity);
      if (isNaN(c) || c <= 0) { setError(true); setMessage('Capacity must be positive'); return; }
      payload.capacity = c;
    }

    if (points !== '') {
      const p = Number(points);
      if (!Number.isInteger(p) || p <= 0) { setError(true); setMessage('Points must be positive integer'); return; }
      payload.points = p;
    }

    if (Object.keys(payload).length === 0) {
      setError(true); setMessage('No changes provided');
      return;
    }

    try {
      setSubmitting(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) throw new Error('Not logged in');
      const res = await fetch(`${backend}/events/${idNum}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        //   Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(true);
        setMessage(body.error || body.message || `Update failed (${res.status})`);
        return;
      }
      setError(false);
      setMessage('Event updated');
      setTimeout(() => router.push('/event'), 800);
    } catch (e) {
      setError(true); 
      setMessage(e.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="main-container">
      <h1>Update Event</h1>
      <div className={styles.createForm}>
        <div className={styles.fullWidthInput}>
          <h5>Event ID</h5>
            <input
              type="text"
              value={eventId}
              onChange={e => setEventId(e.target.value)}
              disabled={submitting || loadingExisting}
            />
            <PrimaryButton
              text={loadingExisting ? 'Loading...' : 'Load'}
              onClick={loadEvent}
              disabled={submitting || loadingExisting || !eventId}
            />
        </div>

        {original && (
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            Current: {original.name} | {original.location} | Starts {original.startTime ? new Date(original.startTime).toLocaleString() : '—'} | Ends {original.endTime ? new Date(original.endTime).toLocaleString() : '—'} | Capacity {original.capacity == null ? 'Unlimited' : original.capacity} | Points {original.points}
          </div>
        )}

        <div className={styles.fullWidthInput}>
          <h5>New Name (optional)</h5>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={submitting}
            placeholder={original?.name || ''}
          />
        </div>

        <div className={styles.fullWidthInput}>
          <h5>New Description (optional)</h5>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={submitting}
            placeholder={original?.description || ''}
          />
        </div>

        <div className={styles.fullWidthInput}>
          <h5>New Location (optional)</h5>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            disabled={submitting}
            placeholder={original?.location || ''}
          />
        </div>

        <div className={styles.columns}>
          <div className={styles.column}>
            <h5>New Start Time (optional)</h5>
            <input
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              disabled={submitting}
            />

            <h5>New Capacity (optional)</h5>
            <input
              type="number"
              min="1"
              step="1"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              disabled={submitting}
              placeholder={original?.capacity == null ? '' : original.capacity}
            />
          </div>

          <div className={styles.column}> 
            <h5>New End Time (optional)</h5>
            <input
              type="datetime-local"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              disabled={submitting}
            />

            <h5>New Points (optional)</h5>
            <input
              type="number"
              min="1"
              step="1"
              value={points}
              onChange={e => setPoints(e.target.value)}
              disabled={submitting}
              placeholder={original?.points ?? ''}
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <p className={`${styles.message} ${error ? styles.error : styles.success}`}>{message}</p>
          <PrimaryButton
            text={submitting ? 'Updating...' : 'Update'}
            onClick={handleSend}
            disabled={submitting || !eventId}
          />
        </div>
      </div>
    </div>
  );
}
