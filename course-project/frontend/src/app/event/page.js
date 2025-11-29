'use client';
import { useState, useEffect, useRef } from 'react';
import EventCard from '../components/EventCard';
import EventFilter from '../components/EventFilter';
import styles from '@/app/event/event.module.css';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';

export default function EventsListPage() {
  const PAGELIMIT = 5;
  const { user, token } = useAuth();
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [end, setEnd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const scrollRef = useRef();
  const searchParams = useSearchParams();
  const filter = Object.fromEntries(searchParams.entries()); 
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const loadData = async (specificPage = 1) => {
    if (!token) return; 

    setLoading(true);
    const url = new URL(backendURL + '/events');

    const allowedKeys = ['id', 'name', 'location', 'started', 'ended', 'showFull', 'page', 'limit'];
    const relevantFilters = Object.fromEntries(
      Object.entries(filter).filter(([k, v]) => allowedKeys.includes(k) && v !== '' && v !== undefined)
    );

    relevantFilters.page = specificPage;
    relevantFilters.limit = PAGELIMIT;

    url.search = new URLSearchParams(relevantFilters).toString();

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load events');

      if (specificPage === 1) setEvents(data.results);
      else setEvents(prev => [...prev, ...data.results]);

      if (data.results.length < PAGELIMIT) setEnd(true);

    } catch (err) {
      setError(true);
      setErrorMessage(err.toString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEvents([]);
    setPage(1);
    setEnd(false);
    setError(false);
    setErrorMessage('');
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    loadData(1);
  }, [searchParams, token]);

  const handleScroll = (e) => {
    const bottomReached = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight < 50;
    if (bottomReached && !loading && !end) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadData(nextPage);
    }
  };

  return (
    <div className='main-container'>
      <h1>Events</h1>
      <EventFilter/>
      <div ref={scrollRef} onScroll={handleScroll} className={styles.infiniteScroll}>
        {events.map((e, index) => (
          <EventCard
            key={e.id}
            {...e}
            canDelete={['manager','superuser'].includes(user?.role)}
            onDelete={(deletedId) => setEvents(prev => prev.filter(ev => ev.id !== deletedId))}
          />
        ))}
        {end && <p>No more events.</p>}
      </div>
    </div>
    
  );
}
