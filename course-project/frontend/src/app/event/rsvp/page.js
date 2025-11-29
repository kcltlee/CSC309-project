'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PrimaryButton } from '../../components/Button';
import Notification from '../../components/Notification';
import styles from '../event.module.css';

export default function RsvpPage() {
    const { user, token } = useAuth(); 
    const [eventId, setEventId] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRsvped, setIsRsvped] = useState(false);
    const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

    const [notification, setNotification] = useState({ isVisible: false, message: '', type: 'success' });
    const showNotification = (message, type) => setNotification({ isVisible: true, message, type });
    const closeNotification = () => setNotification(prev => ({ ...prev, isVisible: false }));

    // Check if already RSVP
    const checkRsvpStatus = async (currentEventId) => {
        if (!currentEventId || !token) {
            setIsRsvped(false);
            return;
        } 
        try {
            const res = await fetch(`${backendURL}/events/${currentEventId}/guests/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok && data.hasRSVP) {
                setIsRsvped(true)
            } else {
                setIsRsvped(false); 
            }
        } catch (err) {
            console.error('Error checking RSVP status:', err); 
            setIsRsvped(false); 
        }
    };

    // Reset RSVP when input for eventId changes
    useEffect(() => {
        if (eventId.trim()) {
            checkRsvpStatus(eventId.trim());
        } else {
            setIsRsvped(false)
        }
    }, [eventId]);

    // RSVP Function
    const handleRSVP = async () => {
        if (isRsvped) return; 

        try {
            if (!eventId.trim()) {
                showNotification('Please enter an Event ID.', 'error');
                return;
            }
            setLoading(true);

            const res = await fetch(`${backendURL}/events/${eventId}/guests/me`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();

            if (res.ok) { 
                // localStorage.setItem(rsvpKey, 'true');
                setIsRsvped(true); 
                showNotification(`RSVP successful for event ID: ${eventId}!`, 'success'); 
            } else {
                showNotification(`RSVP failed. Error: ${data.error || 'Event not found or inaccessible.'}`, 'error');
            }
        } catch (err) {
            showNotification('Try again later.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Change button text 
    const rsvpButtonText = isRsvped ? 'RSVPed!' : loading ? 'Processing...' : 'RSVP';
    const rsvpButtonClass = isRsvped ? styles.rsvpedButton : '';

    return (
        <main className={styles.container}>
            <div className={styles.awardPointsWrapper}>
                <h1>RSVP Event</h1> 

                {/* Event ID */}
                <div className={styles.awardFormSection}>
                    <label htmlFor="eventid">Event ID:</label>
                    <input
                        id="eventid"
                        type="text"
                        value={eventId}
                        onChange={(e) => setEventId(e.target.value)}
                        className={styles.awardInputField}
                        placeholder="Enter Event ID"
                    />
                </div>

                {/* RSVP Button */}
                <PrimaryButton
                    text={rsvpButtonText}
                    onClick={handleRSVP}
                    disabled={loading || !eventId.trim() || isRsvped}
                    className={rsvpButtonClass}
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
