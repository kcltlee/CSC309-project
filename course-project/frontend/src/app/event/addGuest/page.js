'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PrimaryButton } from '../../components/Button';
import Notification from '../../components/Notification';
import styles from '../event.module.css';

export default function AddGuestsPage() {
    const searchParams = useSearchParams()
    const { user, token, initializing } = useAuth();
    const router = useRouter();
    const initialEventId = searchParams.get('eventId') || '';
    const [currentEventId, setCurrentEventId] = useState(initialEventId);
    const [event, setEvent] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [newGuestUtorid, setNewGuestUtorid] = useState('');
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

    const [notification, setNotification] = useState({ isVisible: false, message: '', type: 'success' });
    const showNotification = (message, type = 'success') => setNotification({ isVisible: true, message, type });
    const closeNotification = () => setNotification(prev => ({ ...prev, isVisible: false }));

    useEffect(() => {
        if (!initializing && !token) {
            router.replace('/login');
        }
    }, [initializing]);

    useEffect(() => {
        if (!currentEventId) {
            setLoading(false);
            setEvent(null);
            setError('');
            return;
        }
        // Fetch Event
        const fetchEvent = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(`${backendURL}/events/${currentEventId}`, {
                    credentials: 'include',
                });
                if (!res.ok) {
                    const { error } = await res.json();
                    setEvent(null);
                    throw new Error(error || 'Failed to fetch event');
                }
                const data = await res.json();
                setEvent(data);
            } catch (err) {
                setError(err.message); // save err message so it can be rendered later
                showNotification(err.message, 'error');
            } finally {
                setLoading(false);
            };
        };

        fetchEvent();
    }, [currentEventId, token]); // run this when currentEventId changes 

    // role
    const isManagerOrSuperuser = ['manager', 'superuser'].includes(user?.role);

    // add guests
    const handleAddGuest = async (e) => {
        e.preventDefault(); // prevent full page reload of browser (update UI without refreshing)
        if (!currentEventId) return showNotification('Please enter an Event ID first.', 'error');
        setActionLoading(true);
        try {
            const res = await fetch(`${backendURL}/events/${currentEventId}/guests`, {
                method: 'POST',
                // headers: {
                //     'Content-Type': 'application/json',
                //     Authorization: `Bearer ${token}`,
                // },
                credentials: 'include',
                body: JSON.stringify({ utorid: newGuestUtorid.trim() }),
            });

            const data = await res.json();

            if (res.ok) {
                showNotification(`${data.guestAdded.name} added!`);
                setNewGuestUtorid('');
                fetchEvent(currentEventId);
            } else {
                showNotification(data.error || 'Failed to add guest.', 'error');
            }
        } finally {
            setActionLoading(false);
        }
    };

    // remove guest
    const handleRemoveGuest = async () => {
        if (!selectedUserId || !isManagerOrSuperuser || !currentEventId) return;
        setActionLoading(true);

        try {
            const res = await fetch(
                `${backendURL}/events/${currentEventId}/guests/${selectedUserId}`,
                {
                    method: 'DELETE',
                    // headers: { Authorization: `Bearer ${token}` },
                    credentials: 'include'
                }
            );
            if (res.ok) {
                showNotification('Guest removed!');
                setSelectedUserId('');
                fetchEvent(currentEventId);
            } else {
                const data = await res.json();
                showNotification(data.error || 'Failed to remove guest', 'error');
            }
        } finally {
            setActionLoading(false);
        }
    };

    const guestOptions = event?.guests?.map((g) => ({
        label: `User ID: ${g.userId}`,
        value: String(g.userId),
    })) || [];

    return (
        <main className={styles.container}>
            <div className={styles.addGuestsWrapper}>
                <h1>Manage Guests</h1>

                {/* Event id */}
                <section className={styles.formSection}>
                    <h3>Event ID</h3>
                    <input
                        type="text"
                        placeholder="Enter Event ID"
                        value={currentEventId}
                        onChange={(e) => {
                            setCurrentEventId(e.target.value.trim());
                            setEvent(null);
                        }}
                        className={styles.input}
                    />
                </section>

                {/* Status based on eventId */}
                {loading && currentEventId && <p>Loading event details...</p>}
                {currentEventId && !loading && !event && (<p className={styles.error}>{error}</p>)}

                {/* Add guest */}
                <section className={styles.formSection}>
                    <h3>Add Guest</h3>
                    <form onSubmit={handleAddGuest} className={styles.form}>
                        <input
                            type="text"
                            placeholder="Enter UTORID"
                            value={newGuestUtorid}
                            onChange={(e) => setNewGuestUtorid(e.target.value)}
                            disabled={actionLoading || !currentEventId || !event}
                            required
                            className={styles.input}
                        />
                        <PrimaryButton
                            text={actionLoading ? 'Adding...' : 'Add'}
                            type="submit"
                            disabled={!currentEventId || !event || actionLoading || !newGuestUtorid}
                        />
                    </form>
                </section>

                {/* Remove guest */}
                {isManagerOrSuperuser && (
                    <section className={styles.formSection}>
                        <h3>Remove Guest</h3>
                        <select
                            className={styles.dropdown}
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            disabled={actionLoading || !currentEventId || guestOptions.length === 0}
                        >
                            <option value="">Select Guest</option>
                            {guestOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <PrimaryButton
                            text={actionLoading ? 'Removing...' : 'Remove'}
                            onClick={handleRemoveGuest}
                            disabled={actionLoading || !selectedUserId}
                        />
                    </section>
                )}

                {/* Notification */}
                <Notification
                    message={notification.message}
                    isVisible={notification.isVisible}
                    onClose={closeNotification}
                    type={notification.type}
                />
            </div>
        </main>
    );
}
