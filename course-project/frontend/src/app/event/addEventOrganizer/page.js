'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PrimaryButton } from '../../components/Button';
import Notification from '../../components/Notification';
import styles from '../event.module.css';

export default function AddEventOrganizer() {
    const router = useRouter();
    const { user } = useAuth();
    const [currentEventId, setCurrentEventId] = useState('');
    const [event, setEvent] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [newOrganizerUtorid, setNewOrganizerUtorid] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentOrganizers, setCurrentOrganizers] = useState([]);

    const [notification, setNotification] = useState({ isVisible: false, message: '', type: 'success' });
    const showNotification = (message, type = 'success') => setNotification({ isVisible: true, message, type });
    const closeNotification = () => setNotification(prev => ({ ...prev, isVisible: false }));

    const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;


    // fetch Event + Organizers
    const fetchEventOrganizer = useCallback(async (eventId) => {
        if (!eventId) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${backendURL}/events/${eventId}`, {
                credentials: 'include'
            });
            if (!res.ok) {
                let body = {};
                try { body = await res.json(); } catch {}
                setEvent(null);
                throw new Error(body.error || `Failed (HTTP ${res.status})`);
            }
            const data = await res.json();
            console.log('[AddEventOrganizer] fetched event:', data);
            setCurrentOrganizers(Array.isArray(data.organizers) ? data.organizers : []);  
            setEvent(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load eventId, check if have 
    useEffect(() => {

        setLoading(false);
    }, []);

    // role
    const isManagerOrSuperuser = ['manager', 'superuser'].includes(user?.role);
    const canRemove = isManagerOrSuperuser;

    // add organizers
    const handleAddEventOrganizer = async (e) => {
      e.preventDefault();
      if (!currentEventId) return showNotification('Enter an Event ID first.', 'error');
      if (!newOrganizerUtorid.trim()) return showNotification('UTORID required', 'error');
      setActionLoading(true);
      try {
        const res = await fetch(`${backendURL}/events/${currentEventId}/organizers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          credentials: 'include',
          body: JSON.stringify({ utorid: newOrganizerUtorid.trim() }),
        });
        let data = {};
        try { data = await res.json(); } catch {}
        if (res.ok) {
          showNotification(`${newOrganizerUtorid.trim()} added!`, 'success');
          setNewOrganizerUtorid('');          
          await fetchEventOrganizer(currentEventId);
        } else {
          showNotification(data.error || 'Failed to add organizer.', 'error');
        }
      } finally {
        setActionLoading(false);
      }
    };

    // remove Organizer
    const handleRemoveOrganizer = async () => {
        if (!selectedUserId || !canRemove || !currentEventId) return;
        setActionLoading(true);
        try {
            const res = await fetch(
                `${backendURL}/events/${currentEventId}/organizers/${selectedUserId}`,
                {
                    method: 'DELETE',
                    // headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    credentials: 'include'
                }
            );
            if (res.ok) {
                showNotification('Organizer removed!');
                setSelectedUserId('');
                fetchEventOrganizer(currentEventId);
            } else {
                const data = await res.json();
                showNotification(data.error || 'Failed to remove organizer', 'error');
            }
        } finally {
            setActionLoading(false);
        }
    };

    // Normalize organizers list (handle plural / nested user object)
    const organizerOptions = currentOrganizers.map(o => {
    const userObj = o.user || o;
    const userId = userObj.id ?? o.userId ?? o.id;
    const utorid = userObj.utorid ?? o.utorid;
    return {
      value: String(userId),
      label: utorid ? `${utorid} (ID: ${userId})` : `User ID: ${userId}`,
    };
  });

    return (
        <main className={styles.container}>
            <div className={styles.addGuestsWrapper}>
                <h1>Add or Remove Event Organizers</h1>

                {/* Event ID */} 
                <section className={styles.formSection}>
                    <h3>Event ID</h3>
                    <input
                        type="text"
                        placeholder="Enter Event ID"
                        value={currentEventId}
                        onChange={(e) => {
                            setCurrentEventId(e.target.value.trim());
                            setEvent(null);
                            setCurrentOrganizers([])
                        }}
                        className={styles.input}
                        disabled={actionLoading}
                    />
                    <PrimaryButton
                        text="Load"
                        onClick={() => currentEventId && fetchEventOrganizer(currentEventId)}
                        disabled={!currentEventId || actionLoading || loading}
                    />

                    <div>
                      <h4>Current Organizers</h4>
                      {Array.isArray(currentOrganizers) && currentOrganizers.length > 0 ? (
                        currentOrganizers.map((o, i) => {
                          const userObj = o.user || o;              
                          const id = userObj.id ?? o.userId ?? i;
                          const utorid = userObj.utorid ?? o.utorid ?? '—';
                          return (
                            <p key={String(id)} style={{ margin: '4px 0' }}>
                              <span>UTORID: {utorid}</span>
                              <span style={{ marginLeft: 12 }}>ID: {id}</span>
                            </p>
                          );
                        })
                      ) : (
                        <p style={{ opacity: 0.6, margin: 0 }}>None loaded</p>
                      )}
                    </div>
                </section>

                {/* Add Organizer */}
                <section className={styles.formSection}>
                    <h3>Add Organizer</h3>
                    <form onSubmit={handleAddEventOrganizer} className={styles.form}>
                        <input
                            type="text"
                            placeholder="Enter UTORID"
                            value={newOrganizerUtorid}
                            onChange={(e) => setNewOrganizerUtorid(e.target.value)}
                            disabled={actionLoading || !currentEventId}
                            required
                            className={styles.input}
                        />
                        <PrimaryButton
                            text={actionLoading ? 'Adding...' : 'Add'}
                            type="submit"
                            disabled={!currentEventId || actionLoading || !newOrganizerUtorid.trim()}
                        />
                    </form>
                </section>

                {/* Remove Organizer */}
                {canRemove && (
                    <section className={styles.formSection}>
                        <h3>Remove Organizer</h3>
                        <select
                            className={styles.dropdown}
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            disabled={actionLoading || !currentEventId || organizerOptions.length === 0}
                        >
                            <option value="">Select Organizer</option>
                            {organizerOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        <PrimaryButton
                            text={actionLoading ? 'Removing...' : 'Remove'}
                            onClick={handleRemoveOrganizer}
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
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
        </main>
    );
}
