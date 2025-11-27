'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PrimaryButton } from '../../components/Button';
import Notification from '../../components/Notification';
import styles from '../event.module.css';

export default function EventDetailPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isUserRsvped, setIsUserRsvped] = useState(false);
    const backendURL = 'http://localhost:4000';
    const id = typeof window !== 'undefined' ? localStorage.getItem('eventId') : null;

    // User can't see the list of guests so we have to store key in local browser, not sure
    const rsvp = `rsvp_${id}_${user?.id}`;

    // Notification  
    const [notification, setNotification] = useState({
        isVisible: false,
        message: '',
        type: 'success',
    });
    const showNotification = (message, type) => {
        setNotification({ isVisible: true, message, type });
    };
    const closeNotification = () => {
        setNotification(prev => ({ ...prev, isVisible: false }));
    };

    // Fetch event  
    const fetchEvent = async () => {
        try {
            const res = await fetch(`${backendURL}/events/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error('Failed to load event');
            setEvent(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!id || !user?.id) {
            if (!id) setError('No EventId found');
            setLoading(false);
            return;
        }

        // Check if status is saved in browser storage
        const savedRsvp = localStorage.getItem(rsvp);
        if (savedRsvp === 'true') {
            setIsUserRsvped(true);
        } else {
            setIsUserRsvped(false);
        }

        fetchEvent();
    }, [id, user?.id]); // Rerun if event or user changes  

    // RSVP  
    const handleRSVP = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${backendURL}/events/${id}/guests/me`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });

            const data = await res.json();

            if (res.ok) {
                setIsUserRsvped(true);
                localStorage.setItem(rsvp, 'true');
                showNotification(`RSVP successful for ${data.guestAdded.name}!`, 'success');
                fetchEvent(); // update number of guests 
            } else {
                const errorMessage = data.error || 'RSVP failed';
                showNotification(errorMessage, 'error');
                if (data.error === 'user is already a guest') {
                    setIsUserRsvped(true);
                    localStorage.setItem(rsvp, 'true');
                }
            }
        } catch (err) {
            showNotification('Server error. Try again later.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !event) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!event) return <p>Event not found.</p>;

    // Role 
    const allowedRoles = ['manager', 'superuser'];
    const isManager = allowedRoles.includes(user?.role);
    const isOrganizer = (event?.organizers || []).some((o) => o.id === user?.id);
    const isManagerOrOrganizer = isManager || isOrganizer;
    const actualNumGuests =
        typeof event.numGuests === 'number'
            ? event.numGuests
            : (event.guests || []).length;

    // Change button text and style based on RSVP status
    const rsvpButtonText = isUserRsvped ? 'RSVPed!' : 'RSVP';
    const rsvpButtonClass = isUserRsvped ? styles.rsvpedButton : '';
    const isCapacityFull = event.numGuests >= event.capacity;

    return (
        <main className={styles.container}>
            <div className={styles.eventContentWrapper}>
                <h1>{event.name}</h1>
                <p><strong>Description:</strong> {event.description || 'RSVP to event!'}</p>
                <p><strong>Location:</strong> {event.location || 'TBC'}</p>
                <p><strong>Start:</strong> {new Date(event.startTime).toLocaleString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true
                })}</p>
                <p><strong>End:</strong> {new Date(event.endTime).toLocaleString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true
                })}</p>
                <p><strong>Spots Filled:</strong> {actualNumGuests}/{event.capacity}</p>

                {!isManagerOrOrganizer && (
                    <div className={styles.rsvpButtonWrapper}>
                        <PrimaryButton
                            text={isCapacityFull ? 'Event Full' : rsvpButtonText}
                            onClick={handleRSVP}
                            disabled={loading || isUserRsvped || isCapacityFull}
                            className={rsvpButtonClass}
                        />
                    </div>
                )}

                {isManagerOrOrganizer && (
                    <>
                        {/* more detilas */}
                        <p><strong>Published:</strong> {event.published ? 'Yes' : 'No'}</p>
                        <p><strong>Points Available:</strong> {event.pointsRemain}</p>
                        <p><strong>Points Awarded:</strong> {event.pointsAwarded}</p>
                        {/* buttons */}
                        <div className={styles.rsvpButtonWrapper}>
                            <PrimaryButton
                                text={isCapacityFull ? 'Event Full' : rsvpButtonText}
                                onClick={handleRSVP}
                                disabled={loading || isUserRsvped || isCapacityFull}
                                className={rsvpButtonClass}
                            />
                        </div>
                        <div className={styles.buttonGroup}>
                            <PrimaryButton
                                text="Add or Remove Guest"
                                onClick={() => { localStorage.setItem("eventId", id); router.push("/event/addGuest"); }}
                            />
                            {isManager && (
                                <PrimaryButton
                                    text="Add or Remove Organizers"
                                    onClick={() => router.push('/event/addEventOrganizer')}
                                />
                            )}
                            <PrimaryButton
                                text="Award Points"
                                onClick={() => { localStorage.setItem("eventId", id); router.push("/event/awardGuest"); }}
                            />
                            <PrimaryButton
                                text="Update Event"
                                onClick={() => router.push('/event/update')}
                            />
                        </div>
                    </>
                )}
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