'use client';
import { PrimaryButton } from "@/app/components/Button";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import styles from "../page.module.css";

export default function UpdatePromotion() {
  // Promotion identifier (separate from name)
  const [promotionId, setPromotionId] = useState('');
  // Editable fields (blank means unchanged)
  const [promotionName, setPromotionName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState(''); // 'Automatic' | 'Onetime' or '' for unchanged
  const [minimumSpend, setMinimumSpend] = useState('');
  const [rate, setRate] = useState('');
  const [points, setPoints] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [original, setOriginal] = useState(null);

  async function loadPromotion() {
    console.log('[UpdatePromotion] backend URL:', backend);
    setMessage(''); setError(false);
    if (!backend) { setError(true); setMessage('Backend URL not configured'); return; }
    const idNum = Number(promotionId);
    if (!Number.isInteger(idNum)) { setError(true); setMessage('Enter a valid numeric ID'); return; }
    try {
      setLoadingExisting(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      console.log('[UpdatePromotion] token present:', !!token);
      if (!token) throw new Error('Not logged in');
      const url = `${backend}/promotions/${idNum}`;
      console.log('[UpdatePromotion] GET:', url);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json();
      console.log('[UpdatePromotion] GET status:', res.status, 'body:', body);
      if (!res.ok) { throw new Error(body.error || `HTTP ${res.status}`); }
      setOriginal(body);
      setMessage(`Loaded promotion #${idNum}. Leave fields blank to keep existing values.`);
    } catch (e) {
      console.error('[UpdatePromotion] load error:', e);
      setError(true); setMessage(e.message);
    } finally { setLoadingExisting(false); }
  }

  async function handleSend() {
    console.log('[UpdatePromotion] submit start, raw inputs:', {
      promotionId, promotionName, description, type, minimumSpend, rate, points, startTime, endTime
    });
    setMessage(''); setError(false);
    if (!backend) { setError(true); setMessage('Backend URL not configured'); return; }
    const idNum = Number(promotionId);
    if (!Number.isInteger(idNum)) { setError(true); setMessage('Valid numeric ID required'); return; }

    // Determine original timing for restriction checks
    const now = new Date();
    let started = false;
    let ended = false;
    if (original) {
      const oStart = original.startTime ? new Date(original.startTime) : null;
      const oEnd = original.endTime ? new Date(original.endTime) : null;
      started = oStart && oStart <= now;
      ended = oEnd && oEnd <= now;
      console.log('[UpdatePromotion] original timing:', { started, ended, originalStart: oStart, originalEnd: oEnd });
    } else {
      console.log('[UpdatePromotion] no original loaded (skipping timing restrictions)');
    }

    const payload = {};
    if (promotionName.trim()) payload.name = promotionName.trim();
    if (description.trim()) payload.description = description.trim();
    if (type) {
      const mappedType = type === 'Onetime' ? 'one-time' : 'automatic';
      payload.type = mappedType;
      console.log('[UpdatePromotion] mapped type:', mappedType);
    }
    if (startTime) {
      const s = new Date(startTime);
      console.log('[UpdatePromotion] parsed startTime:', s);
      if (isNaN(s)) { setError(true); setMessage('Invalid start time'); return; }
      payload.startTime = s.toISOString();
    }
    if (endTime) {
      const e = new Date(endTime);
      console.log('[UpdatePromotion] parsed endTime:', e);
      if (isNaN(e)) { setError(true); setMessage('Invalid end time'); return; }
      const refStart = payload.startTime ? new Date(payload.startTime) : (original?.startTime ? new Date(original.startTime) : null);
      if (refStart && e <= refStart) { setError(true); setMessage('End must be after start'); return; }
      payload.endTime = e.toISOString();
    }
    if (minimumSpend !== '') {
      const v = Number(minimumSpend);
      console.log('[UpdatePromotion] minSpending parsed:', v);
      if (isNaN(v) || v < 0) { setError(true); setMessage('Min spend must be >= 0'); return; }
      payload.minSpending = v;
    }
    if (rate !== '') {
      const v = Number(rate);
      console.log('[UpdatePromotion] rate parsed:', v);
      if (isNaN(v) || v < 0) { setError(true); setMessage('Rate must be >= 0'); return; }
      payload.rate = v;
    }
    if (points !== '') {
      const v = Number(points);
      console.log('[UpdatePromotion] points parsed:', v);
      if (!Number.isInteger(v) || v < 0) { setError(true); setMessage('Points must be integer >= 0'); return; }
      payload.points = v;
    }

    if (Object.keys(payload).length === 0) {
      setError(true); setMessage('Provide at least one field to update'); 
      console.log('[UpdatePromotion] abort: empty payload');
      return;
    }

    // Restriction checks after start
    if (started) {
      const forbidden = ['name','description','type','startTime','minSpending','rate','points'];
      const attemptedForbidden = forbidden.filter(k => k in payload);
      console.log('[UpdatePromotion] started restrictions, attemptedForbidden:', attemptedForbidden);
      if (attemptedForbidden.length) {
        setError(true); setMessage(`Cannot update: ${attemptedForbidden.join(', ')} after start`);
        return;
      }
      if ('endTime' in payload && ended) {
        setError(true); setMessage('Cannot change endTime after it has passed');
        return;
      }
    }

    // Validate temporal logic (future constraints)
    if (payload.startTime) {
      const s = new Date(payload.startTime);
      if (s <= now) { setError(true); setMessage('New start must be in the future'); return; }
    }
    if (payload.endTime) {
      const e = new Date(payload.endTime);
      if (e <= now) { setError(true); setMessage('New end must be in the future'); return; }
    }

    console.log('[UpdatePromotion] final payload:', payload);

    try {
      setSubmitting(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      console.log('[UpdatePromotion] token present:', !!token);
      if (!token) throw new Error('Not logged in');
      const url = `${backend}/promotions/${idNum}`;
      console.log('[UpdatePromotion] PATCH url:', url);
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      let body;
      try { body = await res.json(); } catch { body = {}; }
      console.log('[UpdatePromotion] response status:', res.status, 'body:', body);
      if (!res.ok) throw new Error(body.error || body.message || `HTTP ${res.status}`);
      setMessage('Update Promotion Successful!');
      setError(false);
      setTimeout(() => router.push('/promotion'), 800);
    } catch (e) {
      console.error('[UpdatePromotion] PATCH error:', e);
      setError(true); setMessage(e.message || 'Failed to update promotion.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="main-container">
      <h1>Update Promotion</h1>
      <div className={styles.form}>
        {/* Promotion ID (required) */}
        <div className={styles.fullWidthInput}>
          <h5>Promotion ID</h5>
          <input type="text" value={promotionId} onChange={(e) => setPromotionId(e.target.value)} disabled={submitting || loadingExisting} />
          <PrimaryButton text={loadingExisting ? 'Loading...' : 'Load'} onClick={loadPromotion} disabled={submitting || loadingExisting || !promotionId} />
        </div>
        {/* Show existing summary if loaded */}
        {original && (
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            Current: {original.name} | {original.type} | Starts {original.startTime ? new Date(original.startTime).toLocaleString() : '—'} | Ends {original.endTime ? new Date(original.endTime).toLocaleString() : '—'}
          </div>
        )}
        {/* Editable fields */}
        <div className={styles.fullWidthInput}>
          <h5>New Name (optional)</h5>
          <input type="text" value={promotionName} onChange={(e) => setPromotionName(e.target.value)} disabled={submitting} placeholder={original?.name || ''} />
        </div>
        <div className={styles.fullWidthInput}>
          <h5>New Description (optional)</h5>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={submitting} placeholder={original?.description || ''} />
        </div>
        <div className={styles.columns}>
          <div className={styles.column}>
            <h5>Type (optional)</h5>
            <div className={styles.toggleContainer}>
              <button className={`${styles.toggleButton} ${type === 'Automatic' ? styles.active : ''}`} onClick={() => setType('Automatic')} type="button" disabled={submitting}>Automatic</button>
              <button className={`${styles.toggleButton} ${type === 'Onetime' ? styles.active : ''}`} onClick={() => setType('Onetime')} type="button" disabled={submitting}>One-time</button>
              <button className={styles.toggleButton} type="button" disabled={submitting} onClick={() => setType('')}>Clear</button>
            </div>
            <h5>New Start Time (optional)</h5>
            <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={submitting} />
            <h5>New Min Spend (optional)</h5>
            <input type="number" value={minimumSpend} onChange={(e) => setMinimumSpend(e.target.value)} disabled={submitting} min="0" step="1" placeholder={original?.minSpending ?? ''} />
          </div>
          <div className={styles.column}>
            <h5>New End Time (optional)</h5>
            <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={submitting} />
            <h5>New Rate (optional)</h5>
            <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} disabled={submitting} min="0" step="0.01" placeholder={original?.rate ?? ''} />
            <h5>New Points (optional)</h5>
            <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} disabled={submitting} min="0" step="1" placeholder={original?.points ?? ''} />
          </div>
        </div>
      </div>
      <div className={styles.footer}>
        <p className={`${styles.message} ${error ? styles.error : styles.success}`}>{message}</p>
        <PrimaryButton className="submit" text={submitting ? 'Updating...' : 'Update'} onClick={handleSend} disabled={submitting || !promotionId} />
      </div>
    </div>
  );
}
