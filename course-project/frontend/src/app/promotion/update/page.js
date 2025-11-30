'use client';
import { PrimaryButton } from "@/app/components/Button";
import { useState } from "react";
import styles from "../page.module.css";
import { useAuth } from "@/context/AuthContext";
import FeedBackMessage from "@/app/components/FeedbackMessage";

export default function UpdatePromotion() {
  // get token
  const { token } = useAuth();

  // Promotion id
  const [promotionId, setPromotionId] = useState('');
  const [promotionName, setPromotionName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState(''); 
  const [minimumSpend, setMinimumSpend] = useState('');
  const [rate, setRate] = useState('');
  const [points, setPoints] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // error handling
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  // loading
  const [loading, setLoading] = useState('');

  // original promotion information
  const [original, setOriginal] = useState(null);

  async function loadPromotion() {
    // check if loading, double click doesn't do anything
    if(loading) return;

    setLoading(true);
    setMessage(''); 
    setError(false);

    // check promotionId is valid
    const idNum = Number(promotionId);

    if (!Number.isInteger(idNum)) { 
      setError(true); 
      setMessage('Enter a valid numeric ID'); 
      return; }

    try {

      // get promotion information to adjust
      const url = `/promotions/${idNum}`;
      const res = await fetch(url, { credentials: 'include' } );
      const body = await res.json();

      if (!res.ok) 
        { throw new Error(body.error); }

      // original promotion info
      setOriginal(body);
      setMessage(`Loaded promotion #${idNum}. Leave fields blank to keep existing values.`);

      // finish loading promotion info
      setLoading(false);

    } catch (e) {
      setError(true); 
      setMessage(e.toString());
    } finally {
      setLoading(false);
    }
  }

  // update promotion information
  async function handleSend() {
    if(loading) return;
    setMessage(''); 
    setError(false);
    const idNum = Number(promotionId);
    if (!Number.isInteger(idNum)) {
      setError(true);
      setMessage('Valid numeric ID required');
      return;
    }
    // normalize type and convert dates
    const normalizedType = type === 'one-time' ? 'onetime' : (type || undefined);
    const toISO = (dt) => dt ? new Date(dt).toISOString() : undefined;
    const options = {
      id: idNum,
      name: promotionName,
      description: description,
      type: normalizedType,
      startTime: toISO(startTime),
      endTime: toISO(endTime),
      minSpending: minimumSpend === '' ? undefined : Number(minimumSpend),
      rate: rate === '' ? undefined : Number(rate),
      points: points === '' ? undefined : Number(points)
    };

    // object to key value pair to filter for only relevant options, back to object
    const relevantOptions = Object.fromEntries(Object.entries(options).filter(([k, v]) => v !== '' && v !== undefined));
    try {
      setLoading(true);
      const url = `/promotions/${idNum}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(relevantOptions)
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setMessage('Update Promotion Successful!');
      setError(false);
      setPromotionName('');
      setDescription('');
      setType('');
      setStartTime('');
      setEndTime('');
      setMinimumSpend('');
      setRate('');
      setPoints('');
    } catch (e) {
      setError(true);
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="main-container">
      <h1>Update Promotion</h1>
      <div className={styles.form}>
        {/* Promotion ID (required) */}
        <div className={styles.fullWidthInput}>
          <h5>Promotion ID</h5>
          <input type="text" value={promotionId} onChange={(e) => setPromotionId(e.target.value)} disabled={loading} />
          <PrimaryButton text={loading ? 'Loading...' : 'Load'} onClick={loadPromotion} disabled={loading || !promotionId} />
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
          <input type="text" value={promotionName} onChange={(e) => setPromotionName(e.target.value)} disabled={loading} placeholder={original?.name || ''} />
        </div>
        <div className={styles.fullWidthInput}>
          <h5>New Description (optional)</h5>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} placeholder={original?.description || ''} />
        </div>
        <div className={styles.columns}>
          <div className={styles.column}>
            <h5>Type (optional)</h5>
            <div className={styles.toggleContainer}>
              <button className={`${styles.toggleButton} ${type === 'automatic' ? styles.active : ''}`} onClick={() => setType('automatic')} type="button" disabled={loading}>Automatic</button>
              <button className={`${styles.toggleButton} ${type === 'one-time' ? styles.active : ''}`} onClick={() => setType('one-time')} type="button" disabled={loading}>One-time</button>
              <button className={styles.toggleButton} type="button" disabled={loading} onClick={() => setType('')}>Clear</button>
            </div>
            <h5>New Start Time (optional)</h5>
            <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={loading} />
            <h5>New Min Spend (optional)</h5>
            <input type="number" value={minimumSpend} onChange={(e) => setMinimumSpend(e.target.value)} disabled={loading} min="0" step="1" placeholder={original?.minSpending ?? ''} />
          </div>
          <div className={styles.column}>
            <h5>New End Time (optional)</h5>
            <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={loading} />
            <h5>New Rate (optional)</h5>
            <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} disabled={loading} min="0" step="0.01" placeholder={original?.rate ?? ''} />
            <h5>New Points (optional)</h5>
            <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} disabled={loading} min="0" step="1" placeholder={original?.points ?? ''} />
          </div>
        </div>
      </div>
      <div className={styles.footer}>
        <PrimaryButton className="submit" text={loading ? 'Updating...' : 'Update'} onClick={handleSend} disabled={loading || !promotionId} />
        <FeedBackMessage error={error} message={message}/>
      </div>
    </div>
  );
}
