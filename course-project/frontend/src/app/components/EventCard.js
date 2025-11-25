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
  numGuests
}) {
  const router = useRouter();
  const eventFull = numGuests >= capacity;

  const formatDateTime = (datetime) => {
    if (!datetime) return '';
    const d = new Date(datetime);
    const str = d.toLocaleString();       
    return str.replace(/:\d{2}\s/, ' '); // remove seconds 
  };

  // YYYYMMDDTHHmmssZ
  const toGoogleCalendarDate = (datetime) => {
    return new Date(datetime).toISOString().replace(/-|:|\.\d{3}/g, '');
  };

  // Google calendar event link 
  const calendarUrl = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(
    name
  )}&dates=${toGoogleCalendarDate(startTime)}/${toGoogleCalendarDate(
    endTime
  )}&details=${encodeURIComponent('Remember to RSVP to event!')}&location=${encodeURIComponent(location)}`;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.id}>ID: {id}</p>
        <p className={styles.name}>{name}</p>
      </div>

      <div className={styles.center}>
        <p>
          <span className={styles.label}>Location:</span>{' '}
          {/* Google maps link */}
          <a
            // href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            //   location
            // )}`}
            href={`https://maps.google.com/?q=${encodeURIComponent(
              location
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapLink}
          >
            {location}
          </a>
        </p>
        <p>
          <span className={styles.label}>Start:</span> {formatDateTime(startTime)}
        </p>
        <p>
          <span className={styles.label}>End:</span> {formatDateTime(endTime)}
        </p>
        <p>
          <span className={styles.label}>Spots Filled:</span> {numGuests}/{capacity}{' '}
          {eventFull ? '(Full)' : ''}
        </p>

        <div className={styles.buttons}>
          <PrimaryButton text="Add to Calendar" onClick={() => window.open(calendarUrl, '_blank')}
          />
          {/* Not sure how to push it to the event/[id] page */}
          {/* <PrimaryButton text="View →" onClick={() => router.push(`/event/${id}`)}/> */}
          <PrimaryButton text="View →" onClick={() => { localStorage.setItem("eventId", id); router.push("/event/details"); }}
          />
        </div>
      </div>
    </div>
  );
}
