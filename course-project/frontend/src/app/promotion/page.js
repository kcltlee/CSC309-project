'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import styles from './page.module.css';
import PromotionSearchBar from '../components/PromotionSearchBar'
import PrimaryActionDropDownButton from '../components/PrimaryActionDropDownButton';
import { useAuth } from '../../context/AuthContext'; 
import PromotionCard from '../components/PromotionCard'
import { useRouter, useSearchParams } from 'next/navigation';

export default function PromotionsPage() {
  const {user, token, initializing, currentInterface} = useAuth();
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  const scrollRef = useRef(null);
  
  const [promotions, setPromotions] = useState([]);

  // search params
  const searchParams = useSearchParams();
  const router = useRouter();

  // loading and error and message
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');

  // pagination
  const [page, setPage] = useState(1);
  const [reachedEnd, setReachedEnd] = useState(false);

  // search bar
  const [searchName, setSearchName] = useState(''); 

  // filtering
  const [typeFilter, setTypeFilter] = useState('');
  const [startAfter, setStartAfter] = useState('');       
  const [endBefore, setEndBefore] = useState('');        
  const [rateMin, setRateMin] = useState('');             
  const [minSpendMin, setMinSpendMin] = useState('');    
  const [pointsMin, setPointsMin] = useState('');       

  // sorting
  const [sortField, setSortField] = useState(''); // '', 'start', 'end'
  const [sortDir, setSortDir] = useState('asc'); // 'asc' or 'desc'

  // redirect unsigned user
  useEffect(() => {
      if (!initializing && !user) {
        router.replace('/login');
      }
  }, [initializing])

  // useCallback memoizes the function - React keeps the same reference between renders unless dependencies change
  const fetchPromotions = useCallback(async (targetPage = 1, replace = false) => {
    // Allow replace fetch even if a previous fetch is in-flight (avoid empty list on double Apply)
    if (loading && !replace) return;

    const filter = Object.fromEntries(searchParams.entries());
    const { searchName,
            startAfter, 
            endBefore, 
            rateMin,
            minSpendMin,
            pointsMin,
            typeFilter } = filter;
  
    setSortDir(filter?.sortDir);
    setSortField(filter?.sortField);

    setLoading(true);
    setError(false);

    try {
     if (!backendURL) throw new Error('Missing backend URL');
     const res = await fetch(`${backendURL}/promotions`, {
       headers: token ? { Authorization: `Bearer ${token}` } : undefined,
       credentials: 'include'
     });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      let list = data.results || [];
  
      // Filters
      if (searchName) {
        const term = searchName.toLowerCase();
        list = list.filter(p => p.name && p.name.toLowerCase().includes(term));
      }

      if (typeFilter) {
        const tf = typeFilter === 'one-time' ? 'onetime' : typeFilter;
        list = list.filter(p => p.type === tf);
      }

      if (startAfter) {
        const dayEnd = new Date(`${startAfter}T23:59:59.999`).toISOString();
        if (!isNaN(dayEnd)) list = list.filter(p => p.startTime && new Date(p.startTime) > dayEnd);
      }

      if (endBefore) {
        const cutoffStart = new Date(`${endBefore}T00:00:00.000`).toISOString();
        if (!isNaN(cutoffStart)) list = list.filter(p => p.endTime && new Date(p.endTime) < cutoffStart);
      }

      if (rateMin) {
        const rMin = Number(rateMin);
        list = list.filter(p => p.rate != null && Number(p.rate) >= rMin);
      }

      if (minSpendMin) {
        const msMin = Number(minSpendMin);
        list = list.filter(p => p.minSpending != null && Number(p.minSpending) >= msMin);
      }
      if (pointsMin) {
        const ptMin = Number(pointsMin);
        list = list.filter(p => p.points != null && Number(p.points) >= ptMin);
      }

      const startIdx = (targetPage - 1) * 10;
      const batch = list.slice(startIdx, startIdx + 10);
      // De-dup when appending to avoid duplicate keys
      setPromotions(prev => {
        const base = replace ? [] : prev;
        const seen = new Set(base.map(p => p.id));
        const unique = batch.filter(p => !seen.has(p.id));
        return replace ? unique : [...base, ...unique];
      });
      if (batch.length < 10 || startIdx + 10 >= list.length) setReachedEnd(true);
      setPage(targetPage + 1);
    } catch (e) {
      setError(true);
      setMessage(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [backendURL, token, searchParams]);

  const triggerSearch = () => {

    const filters = {
        searchName: searchName.trim(),
        startAfter: startAfter,
        endBefore: endBefore, 
        rateMin: rateMin, 
        minSpendMin: minSpendMin,
        pointsMin: pointsMin,
        typeFilter: typeFilter,
        sortDir: sortDir,
        sortField: sortField
    };

    const params = new URLSearchParams();

    // clean filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        params.set(key, value);
      }
    });

    router.replace(`?${params.toString()}`);
    setPromotions([]);
    setPage(1);
    setReachedEnd(false);
  };

  const clearFilters = () => {
    setSearchName('');
    setTypeFilter('');
    setStartAfter('');
    setEndBefore('');
    setRateMin('');
    setMinSpendMin('');
    setPointsMin('');
    setSortDir('');
    setSortField('');
    setPromotions([]);
    setPage(1);
    setReachedEnd(false);
    fetchPromotions(1, true); // immediate refetch so one click clears
    router.replace('/promotion');
  };

  // refetch whenever any applied filter or type changes OR version increments
  useEffect(() => {
    if (!backendURL) return;
    fetchPromotions(1, true);
  }, [searchParams]);

  // initial load
  useEffect(() => {
    setPromotions([]);
    setPage(1);
    setReachedEnd(false);
    fetchPromotions(1, true);
  }, []); 

  const handleScroll = (e) => {
    const t = e.target;
    const atBottom = t.scrollTop + t.clientHeight >= t.scrollHeight - 80;
    if (atBottom && !reachedEnd && !loading) {
      fetchPromotions(page, false);
    }
  };

  const handleDelete = async (id) => {
      if (!token) {return; }
      if (!backendURL) { setError(true); setMessage('Missing backend URL'); return; }
      if (!window.confirm(`Delete promotion #${id}?`)) return;

      try {
        const url = `${backendURL}/promotions/${id}`;
        const res = await fetch(url, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });

        if (res.status === 204) {
          setPromotions(prev => prev.filter(p => p.id !== id));
          return;
        }
        const ct = res.headers.get('content-type') || '';
        let body = ct.includes('application/json') ? await res.json() : { error: await res.text() };
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
        setPromotions(prev => prev.filter(p => p.id !== id));
      } catch (e) {
        setError(true);
        setMessage(e.message || String(e));
      }
    };

  // Sorting logic
  const sortedPromotions = React.useMemo(() => {
    if (!sortField) return promotions;
    const sorted = [...promotions].sort((a, b) => {
      let av, bv;
      if (sortField === 'start') {
        av = a.startTime ? new Date(a.startTime).getTime() : 0;
        bv = b.startTime ? new Date(b.startTime).getTime() : 0;
      } else {
        av = a.endTime ? new Date(a.endTime).getTime() : 0;
        bv = b.endTime ? new Date(b.endTime).getTime() : 0;
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return sorted;
  }, [promotions, sortField, sortDir]);

  return (
    <div className={styles.pageContainer}>
      <main>
        <h1>Promotions</h1>

        <PromotionSearchBar
          searchName={searchName}
          setSearchName={setSearchName}
          onSearch={triggerSearch}
        />

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {/* Type filter */}
          <div className={styles.filterItem}>
            <label className={styles.filterLabel} style={{ marginRight: 8 }}>Type:</label>
            {(() => {
              const currentText = !typeFilter ? 'Any' : (typeFilter === 'automatic' ? 'Automatic' : 'One-time');
              const opts = [
                { text: currentText, action: () => { /* primary click keeps current */ } },
                { text: 'Any', action: () => { setTypeFilter(''); setPage(1); setReachedEnd(false) } },
                { text: 'Automatic', action: () => { setTypeFilter('automatic'); setPage(1); setReachedEnd(false)} },
                { text: 'One-time', action: () => { setTypeFilter('one-time'); setPage(1); setReachedEnd(false) } },
              ];
              return (
                <PrimaryActionDropDownButton
                  options={opts}
                  className={styles.filterDropDown}
                />
              );
            })()}
          </div>

          {/* filter inputs (commit on Search click) */}
          <label style={{ fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span>Start after:</span>
            <input
              type="date"
              value={startAfter}
              onChange={(e) => setStartAfter(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: 6 }}
            />
          </label>
          <label style={{ fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span>End before:</span>
            <input
              type="date"
              value={endBefore}
              onChange={(e) => setEndBefore(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: 6 }}
            />
          </label>
          <label style={{ fontSize: 14 }}>
            Min rate:&nbsp;
            <input
              type="number"
              step="0.01"
              value={rateMin}
              onChange={(e) => setRateMin(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: 6, width: 100 }}
            />
          </label>
          <label style={{ fontSize: 14 }}>
            Min spend:&nbsp;
            <input
              type="number"
              step="1"
              value={minSpendMin}
              onChange={(e) => setMinSpendMin(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: 6, width: 100 }}
            />
          </label>
          <label style={{ fontSize: 14 }}>
            Min points:&nbsp;
            <input
              type="number"
              step="1"
              value={pointsMin}
              onChange={(e) => setPointsMin(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: 6, width: 100 }}
            />
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={triggerSearch} className={styles.searchBtn}>
              Search & Apply
            </button>
            <button type="button" onClick={clearFilters} className={styles.searchBtn}>
              Clear 
            </button>
          </div>
        </div>

        {/* Sorting button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>Sort by:</span>
          <button
            type="button"
            className={styles.searchBtn}
            style={{ fontWeight: sortField === 'start' ? 'bold' : 'normal' }}
            onClick={() => {setSortField(f => f === 'start' ? '' : 'start')}}
          >
            Start Date {sortField === 'start' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            type="button"
            className={styles.searchBtn}
            style={{ fontWeight: sortField === 'end' ? 'bold' : 'normal' }}
            onClick={() => setSortField(f => f === 'end' ? '' : 'end')}
          >
            End Date {sortField === 'end' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            type="button"
            className={styles.searchBtn}
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            disabled={!sortField}
          >
            {sortField ? (sortDir === 'asc' ? 'Asc' : 'Desc') : 'Asc/Desc'}
          </button>
        </div>

        <div className={styles.resultsContainer}>
          <div className={styles.resultsCard}>
            <div ref={scrollRef} className={styles.promotionList} onScroll={handleScroll}>
              {loading && <div>Loading…</div>}
              {error && <div style={{ color: 'red' }}>Error: {message}</div>}
              {!loading && !error && sortedPromotions.length === 0 && <div>No promotions found</div>}
              {!loading && !error && sortedPromotions.map((p) => (
                <PromotionCard
                  key={p.id}
                  {...p}
                  canDelete={['manager','superuser'].includes(currentInterface)}
                  onDelete={handleDelete}
                />
              ))}
              {reachedEnd && sortedPromotions.length > 0 && (
                <div style={{ padding: 8, opacity: 0.6 }} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
