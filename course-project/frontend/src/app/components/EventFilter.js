'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TagSelect from './TagSelect';
import styles from './EventFilter.module.css';
import { PrimaryButton } from './Button';

export default function EventFilter() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [started, setStarted] = useState(undefined);
  const [ended, setEnded] = useState(undefined);
  const [showFull, setShowFull] = useState(false);  
  const [eventId, setEventId] = useState('');

  const applyFilter = () => {
    const filters = {};

    if (name.trim()) filters.name = name.trim();
    if (location.trim()) filters.location = location.trim();
    if (eventId.trim()) filters.id = eventId.trim();

    if (started !== undefined) filters.started = started;
    if (ended !== undefined) filters.ended = ended;
    if (showFull) filters.showFull = true;   

    const params = new URLSearchParams();

    // convert filters object to urlsearchparams
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) { 
          if (typeof value === 'boolean') {
              params.set(key, value.toString());
          } else {
              params.set(key, value);
          }
        }
      });
    // update url
    router.replace(`?${params.toString()}`);
  };

  const clearFilters = () => {
    setName('');
    setLocation('');
    setStarted(undefined);
    setEnded(undefined);
    setShowFull(false);
    setEventId('');
    router.replace(`/event`);
  };

  const statusOptions = [
    { text: 'All', action: () => { setStarted(undefined); setEnded(undefined); applyFilter(); } },
    { text: 'Upcoming', action: () => { setStarted(false); setEnded(undefined); applyFilter(); } },
    { text: 'Ended', action: () => { setStarted(undefined); setEnded(true); applyFilter(); } },
  ];

  return (
    <div className={styles.container}>
      <input
        className={styles.input}
        type="text"
        placeholder="Event ID"
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
      />
      <input
        className={styles.input}
        type="text"
        placeholder="Event Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className={styles.input}
        type="text"
        placeholder="Event Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      <TagSelect
        type="rounded"
        backgroundColour="#ccc"
        defaultText="Event Status"
        options={statusOptions}
      />

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={showFull}
          onChange={(e) => setShowFull(e.target.checked)}
        />
        Include Full Events
      </label>

      <PrimaryButton text="Apply" onClick={applyFilter} />
      <PrimaryButton text="Clear" onClick={clearFilters} />
    </div>
  );
}
