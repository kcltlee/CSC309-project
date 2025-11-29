'use client';

import { useRouter } from 'next/navigation';
import { PrimaryButton } from './Button';
import styles from './EventCard.module.css';

export default function EventCard({
  id,
  name,
  location,
  startTime,
  endTime,
  capacity,
  numGuests,
  canDelete = false,
  onDelete
}) {
  const router = useRouter();
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const eventFull = numGuests >= capacity;

  const handleDelete = async () => {
    if (!backendURL) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) { console.warn('[Delete] no token'); return; }
    if (!window.confirm(`Delete event #${id}?`)) return;

    try {
      const url = `${backendURL}/events/${id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 204) {
        onDelete && onDelete(id);
        alert('Successfully deleted event.');
        return;
      }

      let bodyText = '';
      try { bodyText = await res.text(); } catch {}
      console.warn('[Delete] non-204 status:', res.status, 'body:', bodyText);

      if (res.status === 400) {
        alert('Cannot delete: event already published.');
      } else {
        alert(`Delete failed (${res.status}). ${bodyText || ''}`);
      }
    } catch (e) {
      console.error('[Delete] network/error:', e);
      alert(`Delete failed: ${e.message || 'Network error'}`);
    }
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return '';
    const d = new Date(datetime);
    const str = d.toLocaleString();
    return str.replace(/:\d{2}\s/, ' ');
  };

  const toGoogleCalendarDate = (datetime) =>
    new Date(datetime).toISOString().replace(/-|:|\.\d{3}/g, '');

  const calendarUrl = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(
    name
  )}&dates=${toGoogleCalendarDate(startTime)}/${toGoogleCalendarDate(
    endTime
  )}&details=${encodeURIComponent('Remember to RSVP to event!')}&location=${encodeURIComponent(location)}`;

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <div className={styles.left}>
          <p className={styles.id}>ID: {id}</p>
          <p>
            <span className={styles.label}>Location:</span>{' '}
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mapLink}
            >
              {location}
            </a>
          </p>
          <p><span className={styles.label}>Start:</span> {formatDateTime(startTime)}</p>
          <p><span className={styles.label}>End:</span> {formatDateTime(endTime)}</p>
          <p>
            <span className={styles.label}>Spots Filled:</span> {numGuests}/{capacity}{' '}
            {eventFull ? '(Full)' : ''}
          </p>
        </div>

        <div className={styles.right}>
          <div className={styles.titleArea}>
            <p className={styles.name} >{name}</p>
          </div>
          <div className={styles.buttonsCol}>
            <PrimaryButton
              text="Add to Calendar"
              onClick={() => window.open(calendarUrl, '_blank')}
            />
            {canDelete && (
              <button
                type="button"
                className={`${styles.deleteBtn} ${styles.deleteDanger}`}
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
            <PrimaryButton
              text="View →"
              onClick={() => { 
                router.push(`/event/details?eventId=${id}`);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
