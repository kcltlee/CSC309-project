'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '../../components/Button';
import Notification from '../../components/Notification';
import styles from '../event.module.css';

export default function RsvpIdInputPage() {
    const router = useRouter();
    const [eventId, setEventId] = useState('');
    const backendURL = 'http://localhost:4000';

    const [notification, setNotification] = useState({ isVisible: false, message: '', type: 'success' });
    const showNotification = (message, type) => setNotification({ isVisible: true, message, type });
    const closeNotification = () => setNotification(prev => ({ ...prev, isVisible: false }));

    // view event details
    const handleIdSubmit = async() => {
        if (!eventId) {
            showNotification('Please enter a valid Event ID.', 'error');
            setIsSubmitting(false);
            return;
        }
        try { 
            const res = await fetch(`${backendURL}/events/${eventId}`, { 
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            const data = await res.json();
            if (!res.ok) { 
                showNotification(`Error: ${data.error}`, 'error');
                return;  
            }
            // save the event ID in localStorage 
            localStorage.setItem('eventId', eventId);
            // redirect to EventDetailPage  
            router.push('/event/details');
        } catch (err) {
            showNotification(err.message, 'error'); 
        } 
    };

    return (
        <main className={styles.container}>
            <div className={styles.awardPointsWrapper}>
                <h1>Find Event to RSVP</h1> 

                {/* Event ID */}
                <div className={styles.awardFormSection}>
                    <label htmlFor="eventid">Event ID:</label>
                    <input
                        id="eventid"
                        type="text"
                        value={eventId}
                        onChange={(e) => setEventId(e.target.value)} // Update state as user types
                        className={styles.awardInputField}
                        placeholder="Enter Event ID"
                    />
                </div>

                {/* Submit */}
                <PrimaryButton
                    text="View Event Details"
                    onClick={handleIdSubmit}
                    disabled={!eventId.trim()}
                    className={styles.awardButton}
                />
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
