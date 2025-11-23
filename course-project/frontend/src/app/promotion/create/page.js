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

        if (!promotionName.trim()) { setError(true); setMessage('Name required'); return; }
        if (!description.trim()) { setError(true); setMessage('Description required'); return; }
        if (!startTime || !endTime) { setError(true); setMessage('Start & End time required'); return; }

        const start = new Date(startTime);
        const end = new Date(endTime);
        const now = new Date();
        if (isNaN(start) || isNaN(end)) { setError(true); setMessage('Invalid date'); return; }
        if (start <= now) { setError(true); setMessage('Start must be in future'); return; }
        if (end <= start) { setError(true); setMessage('End after start required'); return; }

        const payload = {
            name: promotionName.trim(),
            description: description.trim(),
            type: type.toLowerCase() === 'one-time' ? 'one-time' : 'automatic',
            startTime: start.toISOString(),
            endTime: end.toISOString(),
        };

        if (minSpending !== '' && Number(minSpending) > 0) payload.minSpending = Number(minSpending);
        if (rate !== '' && Number(rate) > 0) payload.rate = Number(rate);
        if (points !== '' && Number(points) >= 0) payload.points = Number(points);

        try {
            setSubmitting(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${backend}/promotions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const body = await res.json().catch(()=>({}));
            if (!res.ok) {
                console.error('Create error body:', body);
                setError(true);
                setMessage(body.error || body.message || `Create failed (${res.status})`);
                return;
            }
            setMessage('Created.');
            router.push('/promotion'); // reload list
        } catch (e) {
            setError(true);
            setMessage(e.message);
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
