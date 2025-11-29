'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PrimaryButton } from '../../components/Button';
import Notification from '../../components/Notification';
import styles from '../event.module.css';

export default function AddGuestsPage() { 
    const searchParams = useSearchParams()
    const { user, token } = useAuth();
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

    // Fetch Event
    const fetchEvent = async (eventId) => {
        if (!eventId) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${backendURL}/events/${eventId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
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
    };

    useEffect(() => {
        if (currentEventId && user) {
            fetchEvent(currentEventId);
        } else {
            setLoading(false); 
            setEvent(null);
            setError('');
        }
    }, [currentEventId, user]);

    // role
    const isManagerOrSuperuser = ['manager', 'superuser'].includes(user?.role);
    const canRemove = isManagerOrSuperuser;

    // add guests
    const handleAddGuest = async (e) => {
        e.preventDefault();
        if (!currentEventId) return showNotification('Please enter an Event ID first.', 'error');
        setActionLoading(true);
        try {
            const res = await fetch(`${backendURL}/events/${currentEventId}/guests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
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
        if (!selectedUserId || !canRemove || !currentEventId) return;
        setActionLoading(true);

        try {
            const res = await fetch(
                `${backendURL}/events/${currentEventId}/guests/${selectedUserId}`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
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
                {currentEventId && !loading && !event && (<p style={{ color: 'red' }}>Event not found.</p>)}

                {/* Add guest */}
                <section className={styles.formSection}>
                    <h3>Add Guest</h3>
                    <form onSubmit={handleAddGuest} className={styles.form}>
                        <input
                            type="text"
                            placeholder="Enter UTORID"
                            value={newGuestUtorid}
                            onChange={(e) => setNewGuestUtorid(e.target.value)}
                            disabled={actionLoading || !currentEventId}
                            required
                            className={styles.input}
                        />
                        <PrimaryButton
                            text={actionLoading ? 'Adding...' : 'Add'}
                            type="submit"
                            disabled={!currentEventId || actionLoading || !newGuestUtorid}
                        />
                    </form>
                </section>

                {/* Remove guest */}
                {canRemove && (
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
