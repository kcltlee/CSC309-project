'use client';
import { PrimaryButton } from "@/app/components/Button";
import { useState } from "react";
import styles from "../page.module.css";
import { useAuth } from "@/context/AuthContext";
import FeedBackMessage from "@/app/components/FeedbackMessage";

export default function CreatePromotion() {
    const { token } = useAuth();
    
    const [promotionName, setPromotionName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("automatic");
    const [minimumSpend, setMinimumSpend] = useState('');
    const [rate, setRate] = useState('');
    const [points, setPoints] = useState('');
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    // error handling
    const [message, setMessage] = useState("");
    const [error, setError] = useState(false);

    const backend = process.env.NEXT_PUBLIC_BACKEND_URL;

    async function handleSend() {
        setMessage("");
        try {
            if (!backend) throw new Error('Missing backend URL');
            if (!promotionName || !type || !startTime || !endTime) {
                throw new Error('Please fill Promotion Name, Type, Start Time, and End Time');
            }
            const url = `${backend}/promotions`;
            const normalizedType = type === 'one-time' ? 'onetime' : type;
            const toISO = (dt) => {
              // datetime local to ISO
              const d = new Date(dt);
              if (isNaN(d)) throw new Error('Invalid date/time');
              return d.toISOString();
            };
            const payload = {
                name: promotionName,
                description,
                type: normalizedType,
                startTime: toISO(startTime),
                endTime: toISO(endTime),
                minSpending: minimumSpend === '' ? 0 : Number(minimumSpend),
                rate: rate === '' ? 0 : Number(rate),
                points: points === '' ? 0 : Number(points)
            };
            const createPromotion = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            const contentType = createPromotion.headers.get('content-type') || '';
            const response = contentType.includes('application/json')
              ? await createPromotion.json()
              : { error: await createPromotion.text() };

            if (!createPromotion.ok) {
                throw new Error(response.error || `HTTP ${createPromotion.status}`);
            }
            setError(false);
            setMessage('Create Promotion Successful!');
            setPromotionName('');
            setDescription('');
            setType('automatic');
            setMinimumSpend('');
            setRate('');
            setPoints('');
            setStartTime('');
            setEndTime('');
        } catch (err) {
            setError(true);
            setMessage(err.message || String(err));
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
                    />
                </div>

                {/* Description */}
                <div className={styles.fullWidthInput}>
                    <h5>Description</h5>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
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
                                className={`${styles.toggleButton} ${type === "automatic" ? styles.active : ""}`}
                                onClick={() => setType("automatic")}
                            >
                                Automatic
                            </button>

                            <button
                                className={`${styles.toggleButton} ${type === "one-time" ? styles.active : ""}`}
                                onClick={() => setType("one-time")}
                            >
                                One-time
                            </button>
                        </div>

                        <h5>Start Time</h5>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        />

                        <h5>Rate</h5>
                        <input
                            type="number"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            inputMode="decimal"
                        />
                    </div>

                    {/* Right column */}
                    <div className={styles.column}>
                        <h5>Minimum Spend</h5>
                        <input
                            type="number"
                            value={minimumSpend}
                            onChange={(e) => setMinimumSpend(e.target.value)}
                            inputMode="decimal"
                        />

                        <h5>End Time</h5>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                        />

                        <h5>Points</h5>
                        <input
                            type="number"
                            value={points}
                            onChange={(e) => setPoints(e.target.value)}
                            inputMode="numeric"
                        />
                    </div>
                </div>

            </div>

            <div className={styles.footer}>
                <PrimaryButton
                    className="submit"
                    text="Create"
                    type="button"
                    onClick={() => {
                        handleSend();
                    }}
                />
                <FeedBackMessage error={error} message={message}/>
            </div>
        </div>
    );
}
