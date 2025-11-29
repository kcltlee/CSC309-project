'use client';
import { PrimaryButton } from "@/app/components/Button";
import { useState } from "react";
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

    // error handling
    const [message, setMessage] = useState("");
    const [error, setError] = useState(false);

    async function handleSend() {
        setMessage("");
        try {
            url = `${backend}/promotions`
            payload = {
                "name": promotionName,
                "description": description,
                "startTime": startTime,
                "endTime": endTime,
                "minSpending": minimumSpend, 
                "rate": rate, 
                "points": points
            }
            const createPromotion = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: payload
            });

            const response = await createPromotion.json()

            if( !response.ok) {
                throw new Error(response.error)
            }
            
            setError(false);
            setMessage("Create Promotion Successful!");

        } catch (err) {
            setError(true);
            setMessage(err.toString());
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
                                className={`${styles.toggleButton} ${type === "Automatic" ? styles.active : ""}`}
                                onClick={() => setType("Automatic")}
                            >
                                Automatic
                            </button>

                            <button
                                className={`${styles.toggleButton} ${type === "Onetime" ? styles.active : ""}`}
                                onClick={() => setType("Onetime")}
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
                        />
                    </div>

                    {/* Right column */}
                    <div className={styles.column}>
                        <h5>Minimum Spend</h5>
                        <input
                            type="number"
                            value={minimumSpend}
                            onChange={(e) => setMinimumSpend(e.target.value)}
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
                        />
                    </div>
                </div>

            </div>

            <div className={styles.footer}>
                <PrimaryButton className="submit" text="Create" onClick={handleSend}/>
                <p className={`${styles.message} ${error ? styles.error : styles.success}`}>
                    {message}
                </p>
            </div>
        </div>
    );
}
