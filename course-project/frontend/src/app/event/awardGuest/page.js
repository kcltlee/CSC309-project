'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PrimaryButton } from '../../components/Button';
import Notification from '../../components/Notification';
import TextBox from '../../components/TextBox';
import styles from '../event.module.css';
import { useNotification } from '@/context/NotificationContext';

export default function AwardGuestPage() {
    const { notify } = useNotification();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, token } = useAuth();
    const [currentEventId, setCurrentEventId] = useState(searchParams.get('eventId') || '');

    const [utorid, setUtorid] = useState('');
    const [amount, setAmount] = useState('');
    const [remark, setRemark] = useState('');
    const [event, setEvent] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

    const [notification, setNotification] = useState({ isVisible: false, message: '', type: 'success' });
    const showNotification = (message, type) => setNotification({ isVisible: true, message, type });
    const closeNotification = () => setNotification(prev => ({ ...prev, isVisible: false }));

    // Fetch event 
    const fetchEvent = useCallback(async (eventId) => {
        if (!eventId) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${backendURL}/events/${eventId}`, {
                headers: { Authorization: `Bearer ${token}`, },
            });
            if (!res.ok) {
                const { error } = await res.json();
                setEvent(null);
                throw new Error(error || 'Failed to fetch event');
            }
            const data = await res.json();
            setEvent(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token, backendURL, setEvent, setLoading, setError]); // rerun fetch if these changes

     // fetch event, run when current EventId or fetch eevnt or user changes
    useEffect(() => {
        if (currentEventId && user) {
            fetchEvent(currentEventId);
        } else {
            setLoading(false); 
            setEvent(null);
            setError('');
        }
    }, [currentEventId, user, fetchEvent]);

    // Award points
    const handleAwardPoints = async () => {
        if (isSubmitting || !currentEventId) return;

        const points = parseInt(amount, 10);

        setIsSubmitting(true);
        closeNotification();

        const payload = {
            type: 'event',
            amount: points,
        };

        //utorid is optional 
        if (utorid) {
            payload.utorid = utorid;
        }

        // remark is also optional 
        if (remark) {
            payload.remark = remark;
        }

        try {
            const res = await fetch(`${backendURL}/events/${currentEventId}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                let successMessage;
                if (utorid) {
                    successMessage = `Awarded ${data.awarded} points to UTORid: ${data.recipient}.`;
                    notify(data.recipient, `ID${data.id}: Awarded ${data.awarded} pts from ${data.event.name}.`)
                } else if (Array.isArray(data)) {
                    successMessage = `Awarded ${points} points to ${data.length} guests.`;
                    data.map((award) => notify(award.recipient, `ID${award.id}: Awarded ${award.awarded} pts from ${award.event.name}.`));
                } else {
                    successMessage = `Points awarded!`;
                }

                showNotification(successMessage, 'success');
                setUtorid('');
                setAmount('');
                setRemark('');
                setCurrentEventId(''); 
                setEvent(null); 
            } else {
                showNotification(`Error: ${data.error || 'Failed to award points.'}`, 'error');
            }
        } catch (err) {
            showNotification('Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayPoints = event?.pointsRemain || 0;
    const isFormDisabled = !event || loading || isSubmitting;
    // button
    const buttonText =
        utorid.trim() === ''
            ? `Award ${amount || 0} Points to All Guests`
            : `Award ${amount || 0} to ${utorid.trim()}`;

    return (
        <main className={styles.container}>
            <div className={styles.awardPointsWrapper}>
                <h1>Award Points</h1> 
                <p className={styles.pointsStatus}>
                    Total Points Remaining: {displayPoints}
                </p>

                {/* Event ID */}
                <div className={styles.awardFormSection}>
                    <label>Event ID:</label>
                    <input
                        className={styles.awardInputField}
                        value={currentEventId}
                        disabled={isSubmitting}
                        placeholder="Enter Event ID"
                        onChange={(e) => {
                            setCurrentEventId(e.target.value.trim());
                            setEvent(null); // reset points
                        }}
                    />
                </div>

                {/* Status based on eventId */}
                {loading && currentEventId && <p>Loading event details...</p>}
                {currentEventId && !loading && !event && (<p style={{ color: 'red' }}>Event not found.</p>)}

                {/* Remaining form */}
                <div className={styles.awardFormSection}>
                    <label>Guest UTORID (optional):</label>
                    <input
                        className={styles.awardInputField}
                        value={utorid}
                        disabled={isFormDisabled}
                        onChange={(e) => setUtorid(e.target.value)}
                        placeholder="UTORID"
                    />

                    <label>Points:</label>
                    <input
                        className={styles.awardInputField}
                        value={amount}
                        disabled={isFormDisabled}
                        type="number"
                        min="1"
                        onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Enter amount"
                    />

                    <label>Remark (optional):</label>
                    <TextBox
                        value={remark}
                        disabled={isFormDisabled}
                        onChange={setRemark}
                        rows={2}
                    />
                    <PrimaryButton
                        text={buttonText}
                        onClick={handleAwardPoints}
                        disabled={isFormDisabled || !amount || parseInt(amount) <= 0}
                        className={styles.awardButton}
                    />
                </div>
            </div>

            {/* Notification */}
            <Notification
                message={notification.message}
                isVisible={notification.isVisible}
                onClose={closeNotification}
                type={notification.type}
            />
        </main>
    );
}