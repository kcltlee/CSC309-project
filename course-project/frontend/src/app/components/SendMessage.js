'use client';
import React, { useState } from "react";
import styles from './SendMessage.module.css';
import { PrimaryButton } from "./Button";
import { useNotification } from "@/context/NotificationContext";
import FeedBackMessage from "./FeedbackMessage";

export default function SendMessage() {
    const { notify, result } = useNotification();
    const [ utorid, setUtorid ] = useState("");
    const [message, setMessage] = useState("");
    const [ error, setError ] = useState("");

    const handleSend = async () => {
        setError("");

        if (!message) {
            setError("Enter a message.");
            return;
        }
        await notify(utorid, message);
    };

    return (
    <div className={styles.container}>
        <h2>Send Message</h2>
        <label >UTORid:</label>
        <input className={styles.textInput} type="text" value={utorid} onChange={(e) => setUtorid(e.target.value)}/>
        <FeedBackMessage error={error || result.error} message={error || result.message}/>
        <textarea
        className={styles.input}
        placeholder="Type message here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        />

        <PrimaryButton className={styles.send} text="Send" onClick={handleSend}/>
    </div>
    );
}