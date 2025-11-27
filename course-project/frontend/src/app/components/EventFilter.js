'use client';
import { useState } from 'react';
import TagSelect from './TagSelect';
import styles from './EventFilter.module.css';
import { PrimaryButton } from './Button';

export default function EventFilter({ setFilter }) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [started, setStarted] = useState(undefined);
  const [ended, setEnded] = useState(undefined);
  const [showFull, setShowFull] = useState(false);  
  const [eventId, setEventId] = useState('');

  const statusOptions = [
    { text: 'All', action: () => { setStarted(undefined); setEnded(undefined); } },
    { text: 'Upcoming', action: () => { setStarted(false); setEnded(undefined); } },
    { text: 'Ended', action: () => { setStarted(undefined); setEnded(true); } },
  ];

  const applyFilter = () => {
    const newFilter = {};
    if (name.trim()) newFilter.name = name.trim();
    if (location.trim()) newFilter.location = location.trim();
    if (started !== undefined) newFilter.started = started;
    if (ended !== undefined) newFilter.ended = ended;
    if (showFull) newFilter.showFull = true;  
    if (eventId.trim()) newFilter.id = eventId.trim();

    setFilter(newFilter);
  };

  const clearFilters = () => {
    setName('');
    setLocation('');
    setStarted(undefined);
    setEnded(undefined);
    setShowFull(false);
    setEventId('');
    setFilter({});
  };

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
