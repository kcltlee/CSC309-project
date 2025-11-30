'use client';
import React, { useEffect, useState, useRef } from 'react';
import styles from './page.module.css';
import PromotionSearchBar from '../components/PromotionSearchBar'
import PrimaryActionDropDownButton from '../components/PrimaryActionDropDownButton';
import { useAuth } from '../../context/AuthContext'; 
import PromotionCard from '../components/PromotionCard'
import { useRouter, useSearchParams } from 'next/navigation';

export default function PromotionsPage() {
  const PAGELIMIT = 10;
  const {user, token, initializing, currentInterface} = useAuth();
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  const scrollRef = useRef();

  // search params
  const searchParams = useSearchParams();
  const router = useRouter();
  const filter = Object.fromEntries(searchParams.entries());

  // state
  const [promotions, setPromotions] = useState([]);
  const [page, setPage] = useState(1);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');

  // search bar
  const [searchName, setSearchName] = useState(filter.searchName || ''); 
  const [typeFilter, setTypeFilter] = useState(filter.typeFilter || '');
  const [startAfter, setStartAfter] = useState(filter.startAfter || '');       
  const [endBefore, setEndBefore] = useState(filter.endBefore || '');        
  const [rateMin, setRateMin] = useState(filter.rateMin || '');             
  const [minSpendMin, setMinSpendMin] = useState(filter.minSpendMin || '');    
  const [pointsMin, setPointsMin] = useState(filter.pointsMin || '');       
  const [sortField, setSortField] = useState(filter.sortField || ''); // start, end, ''
  const [sortDir, setSortDir] = useState(filter.sortDir || 'asc'); // asc or desc

  // redirect unsigned user
  useEffect(() => {
    if (!initializing && !user) {
      router.replace('/login');
    }
  }, [initializing, user, router]);

  // Load promotions from backend with filters and pagination
  const loadPromotions = async (targetPage = 1, replace = false) => {
    setLoading(true);
    setError(false);

    // Build query params
    const params = new URLSearchParams();
    if (searchName) params.set('name', searchName);
    if (typeFilter) params.set('type', typeFilter);
    if (startAfter) params.set('startAfter', startAfter);
    if (endBefore) params.set('endBefore', endBefore);
    if (rateMin) params.set('rateMin', rateMin);
    if (minSpendMin) params.set('minSpendingMin', minSpendMin);
    if (pointsMin) params.set('pointsMin', pointsMin);
    if (sortField) params.set('sortField', sortField);
    if (sortDir) params.set('sortDir', sortDir);
    params.set('page', targetPage);
    params.set('limit', PAGELIMIT);

    try {
      const res = await fetch(`${backendURL}/promotions?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const batch = data.results || [];
      if (replace) {
        setPromotions(batch);
      } else {
        setPromotions(prev => [...prev, ...batch]);
      }
      if (batch.length < PAGELIMIT) setReachedEnd(true);
      setPage(targetPage + 1);
    } catch (e) {
      setError(true);
      setMessage(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // Trigger search/filter
  const triggerSearch = () => {
    const params = new URLSearchParams();
    if (searchName) params.set('searchName', searchName);
    if (typeFilter) params.set('typeFilter', typeFilter);
    if (startAfter) params.set('startAfter', startAfter);
    if (endBefore) params.set('endBefore', endBefore);
    if (rateMin) params.set('rateMin', rateMin);
    if (minSpendMin) params.set('minSpendMin', minSpendMin);
    if (pointsMin) params.set('pointsMin', pointsMin);
    if (sortField) params.set('sortField', sortField);
    if (sortDir) params.set('sortDir', sortDir);
    router.replace(`?${params.toString()}`);
    setPromotions([]);
    setPage(1);
    setReachedEnd(false);
    loadPromotions(1, true);
  };

  // Clear filters
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
    router.replace('/promotion');
    loadPromotions(1, true);
  };

  // Load on filter change
  useEffect(() => {
    setPromotions([]);
    setPage(1);
    setReachedEnd(false);
    loadPromotions(1, true);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [searchParams, user]);

  // Infinite scroll handler
  const handleScroll = (e) => {
    const bottomReached = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight < 50;
    if (bottomReached && !loading && !reachedEnd) {
      loadPromotions(page, false);
    }
  };

  // Sorting logic (client-side for display only)
  const sortedPromotions = React.useMemo(() => {
    const hasFilters =
      searchName || typeFilter || startAfter || endBefore || rateMin || minSpendMin || pointsMin;
    if (!sortField && !hasFilters) {
      return [...promotions].sort((a, b) => b.id - a.id);
    }
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
  }, [promotions, sortField, sortDir, searchName, typeFilter, startAfter, endBefore, rateMin, minSpendMin, pointsMin]);

  // Delete handler
  const handleDelete = async (id) => {
    if (!token) return;
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
                { text: currentText, action: () => {} },
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
          {/* filter inputs */}
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
                <div style={{ padding: 8, opacity: 0.6 }}>End</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
