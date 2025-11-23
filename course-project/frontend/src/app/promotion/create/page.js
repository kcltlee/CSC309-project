'use client';
import { PrimaryButton } from "@/app/components/Button";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import styles from "../page.module.css";

export default function CreatePromotion() {
    const [promotionName, setPromotionName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("Automatic");
    const [minimumSpend, setMinimumSpend] = useState(0);
    const [rate, setRate] = useState(0);
    const [points, setPoints] = useState(0);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL;

    async function handleSend() {
        if (!backend) { setError(true); setMessage('Backend URL not configured'); return; }
        setMessage(""); setError(false);

        // Basic required fields
        if (!promotionName.trim()) { setError(true); setMessage('Name required'); return; }
        if (!description.trim()) { setError(true); setMessage('Description required'); return; }
        if (!startTime || !endTime) { setError(true); setMessage('Start and end time required'); return; }

        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        const now = new Date();

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) { setError(true); setMessage('Invalid date/time'); return; }
        if (startDate <= now) { setError(true); setMessage('Start time must be in the future'); return; }
        if (endDate <= startDate) { setError(true); setMessage('End time must be after start time'); return; }

        // Numeric validations (only when >0)
        if (minimumSpend < 0) { setError(true); setMessage('Min spend must be >= 0'); return; }
        if (rate < 0) { setError(true); setMessage('Rate must be >= 0'); return; }
        if (!Number.isInteger(points) || points < 0) { setError(true); setMessage('Points must be an integer >= 0'); return; }

        const payload = {
            name: promotionName.trim(),
            description: description.trim(),
            type: type === 'Onetime' ? 'one-time' : 'automatic', // correct mapping per API spec
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
        };
        if (minimumSpend > 0) payload.minSpending = Number(minimumSpend);
        if (rate > 0) payload.rate = Number(rate);
        if (points > 0) payload.points = Number(points);

        try {
            setSubmitting(true);
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (!token) throw new Error('Not logged in');

            const res = await fetch(`${backend}/promotions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `HTTP ${res.status}`);
            }
            await res.json();
            setMessage('Create Promotion Successful!');
            setError(false);
            setTimeout(() => router.push('/promotion'), 800);
        } catch (err) {
            setError(true);
            setMessage(err.message || 'Failed to create promotion');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="main-container">
            <h1>Create Promotion</h1>
            <div className={styles.form}>
                {/* Promotion name */}
                <div className={styles.fullWidthInput}>
                    <h5>Promotion Name</h5>
                    <input
                        type="text"
                        value={promotionName}
                        onChange={(e) => setPromotionName(e.target.value)}
                        disabled={submitting}
                    />
                </div>
                {/* Description */}
                <div className={styles.fullWidthInput}>
                    <h5>Description</h5>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={submitting}
                    />
                </div>
                {/* Two-column section */}
                <div className={styles.columns}>
                    {/* Left column */}
                    <div className={styles.column}>
                        {/* Type Toggle */}
                        <h5>Type</h5>
                        <div className={styles.toggleContainer}>
                            <button
                                className={`${styles.toggleButton} ${type === 'Automatic' ? styles.active : ''}`}
                                onClick={() => setType('Automatic')}
                                type="button"
                                disabled={submitting}
                            >Automatic</button>
                            <button
                                className={`${styles.toggleButton} ${type === 'Onetime' ? styles.active : ''}`}
                                onClick={() => setType('Onetime')}
                                type="button"
                                disabled={submitting}
                            >One-time</button>
                        </div>
                        <h5>Start Time</h5>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            disabled={submitting}
                        />
                        <h5>Rate</h5>
                        <input
                            type="number"
                            value={rate}
                            onChange={(e) => setRate(Number(e.target.value))}
                            disabled={submitting}
                            step="0.01"
                            min="0"
                        />
                    </div>
                    {/* Right column */}
                    <div className={styles.column}>
                        <h5>Minimum Spend</h5>
                        <input
                            type="number"
                            value={minimumSpend}
                            onChange={(e) => setMinimumSpend(Number(e.target.value))}
                            disabled={submitting}
                            min="0"
                            step="1"
                        />
                        <h5>End Time</h5>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            disabled={submitting}
                        />
                        <h5>Points</h5>
                        <input
                            type="number"
                            value={points}
                            onChange={(e) => setPoints(Number(e.target.value))}
                            disabled={submitting}
                            min="0"
                            step="1"
                        />
                    </div>
                </div>
            </div>
            <div className={styles.footer}>
                <p className={`${styles.message} ${error ? styles.error : styles.success}`}>{message}</p>
                <PrimaryButton className="submit" text={submitting ? 'Creating...' : 'Create'} onClick={handleSend} disabled={submitting} />
            </div>
        </div>
    );
}
