'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import styles from './page.module.css';
import PromotionSearchBar from '../components/PromotionSearchBar'
import PrimaryActionDropDownButton from '../components/PrimaryActionDropDownButton';
import { useAuth } from '../../context/AuthContext'; 
import PromotionCard from '../components/PromotionCard'

export default function PromotionsPage() {
  const {token, currentInterface} = useAuth();
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const scrollRef = useRef(null);
  
  const [promotions, setPromotions] = useState([]);

  // loading and error and message
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');

  // pagination
  const [page, setPage] = useState(1);
  const [reachedEnd, setReachedEnd] = useState(false);

  // search bar
  const [searchName, setSearchName] = useState(''); 
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(''); 

  // filtering
  const [typeFilter, setTypeFilter] = useState('');
  const [startAfter, setStartAfter] = useState('');       
  const [endBefore, setEndBefore] = useState('');        
  const [rateMin, setRateMin] = useState('');             
  const [minSpendMin, setMinSpendMin] = useState('');    
  const [pointsMin, setPointsMin] = useState('');       

  //  applied filters
  const [appliedStartAfter, setAppliedStartAfter] = useState('');
  const [appliedEndBefore, setAppliedEndBefore] = useState('');
  const [appliedRateMin, setAppliedRateMin] = useState('');
  const [appliedMinSpendMin, setAppliedMinSpendMin] = useState('');
  const [appliedPointsMin, setAppliedPointsMin] = useState('');


  // useCallback memoizes the function - React keeps the same reference between renders unless dependencies change
  const fetchPromotions = useCallback(async (targetPage = 1, replace = true) => {
    // Allow replace fetch even if a previous fetch is in-flight (avoid empty list on double Apply)
    if (loading && !replace) return;

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
      if (appliedSearchTerm) {
        const term = appliedSearchTerm.toLowerCase();
        list = list.filter(p => p.name && p.name.toLowerCase().includes(term));
      }
      if (typeFilter) {
        const tf = typeFilter === 'one-time' ? 'onetime' : typeFilter;
        list = list.filter(p => p.type === tf);
      }
      if (appliedStartAfter) {
        const s = new Date(`${appliedStartAfter}T00:00`);
        if (!isNaN(s)) list = list.filter(p => p.startTime && new Date(p.startTime) >= s);
      }
      if (appliedEndBefore) {
        const e = new Date(`${appliedEndBefore}T23:59:59.999`);
        if (!isNaN(e)) list = list.filter(p => p.endTime && new Date(p.endTime) <= e);
      }
      if (appliedRateMin !== '') {
        const rMin = Number(appliedRateMin);
        list = list.filter(p => p.rate != null && Number(p.rate) >= rMin);
      }
      if (appliedMinSpendMin !== '') {
        const msMin = Number(appliedMinSpendMin);
        list = list.filter(p => p.minSpending != null && Number(p.minSpending) >= msMin);
      }
      if (appliedPointsMin !== '') {
        const ptMin = Number(appliedPointsMin);
        list = list.filter(p => p.points != null && Number(p.points) >= ptMin);
      }

      // Pagination
      const startIdx = (targetPage - 1) * 10;
      const batch = list.slice(startIdx, startIdx + 10);
      setPromotions(prev => replace ? batch : [...prev, ...batch]);
      if (batch.length < 10 || startIdx + 10 >= list.length) setReachedEnd(true);
      setPage(targetPage + 1);
    } catch (e) {
      setError(true);
      setMessage(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [backendURL, token, typeFilter, appliedSearchTerm, appliedStartAfter, appliedEndBefore, appliedRateMin, appliedMinSpendMin, appliedPointsMin]);

  const triggerSearch = () => {
    setAppliedSearchTerm(searchName.trim());
    setAppliedStartAfter(startAfter);
    setAppliedEndBefore(endBefore);
    setAppliedRateMin(rateMin);
    setAppliedMinSpendMin(minSpendMin);
    setAppliedPointsMin(pointsMin);

    // reset paging state
    setPage(1);
    setReachedEnd(false);

    // don’t clear list until new data arrives; show old results until replaced
    fetchPromotions(1, true);
  };

  const clearFilters = () => {
    // reset live inputs
    setSearchName('');
    setTypeFilter('');
    setStartAfter('');
    setEndBefore('');
    setRateMin('');
    setMinSpendMin('');
    setPointsMin('');

    // reset committed filters
    setAppliedSearchTerm('');
    setAppliedStartAfter('');
    setAppliedEndBefore('');
    setAppliedRateMin('');
    setAppliedMinSpendMin('');
    setAppliedPointsMin('');

    // reset paging and list, then fetch fresh
    setPage(1);
    setReachedEnd(false);
    fetchPromotions(1, true);
  };

  // Initial load
  useEffect(() => {
    setPromotions([]);
    setPage(1);
    setReachedEnd(false);
    fetchPromotions(1, true);
  }, []); 

  // Refetch when committed filters or type change
  useEffect(() => {
    setPromotions([]);
    setPage(1);
    setReachedEnd(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    fetchPromotions(1, true);
  }, [fetchPromotions]);

  const handleScroll = (e) => {
    const t = e.target;
    const atBottom = t.scrollTop + t.clientHeight >= t.scrollHeight - 80;
    if (atBottom && !reachedEnd && !loading) {
      fetchPromotions(page, false);
    }
  };

  const handleDelete = async (id) => {
      if (!token) {return; }
      if (!window.confirm(`Delete promotion #${id}?`)) return;
  
      try {
        const url = `/promotions/${id}`;
        const res = await fetch(url, {
          method: 'DELETE',
          credentials: 'include'
        });
  
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
  
        setPromotions(prev => prev.filter(p => p.id !== id));
        setMessage('Delete Promotion Successful!');
        setError(false);
  
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
            <label className={styles.filterLabel}>Type:</label>
            <PrimaryActionDropDownButton
              options={[
                { text: 'Any', action: () => { setTypeFilter(''); setPage(1); setReachedEnd(false); } },
                { text: 'Automatic', action: () => { setTypeFilter('automatic'); setPage(1); setReachedEnd(false); } },
                { text: 'One-time', action: () => { setTypeFilter('one-time'); setPage(1); setReachedEnd(false); } },
              ]}
              className={styles.filterDropDown}
            />
          </div>

          {/* filter inputs (commit on Search click) */}
          <label style={{ fontSize: 14 }}>
            Start after:&nbsp;
            <input
              type="date"
              value={startAfter}
              onChange={(e) => setStartAfter(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: 6 }}
            />
          </label>
          <label style={{ fontSize: 14 }}>
            End before:&nbsp;
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

          <button type="button" onClick={triggerSearch} style={{ padding: '6px 10px', borderRadius: 6 }}>
            Apply Filters
          </button>
          <button type="button" onClick={clearFilters} style={{ padding: '6px 10px', borderRadius: 6 }}>
            Clear Filters
          </button>
        </div>

        <div className={styles.resultsContainer}>
          <div className={styles.resultsCard}>
            <div ref={scrollRef} className={styles.promotionList} onScroll={handleScroll}>
              {loading && <div>Loading…</div>}
              {error && <div style={{ color: 'red' }}>Error: {message}</div>}
              {!loading && !error && promotions.length === 0 && <div>No promotions found</div>}
              {!loading && !error && promotions.map((p) => (
                <PromotionCard
                  key={p.id}
                  {...p}
                  canDelete={['manager','superuser'].includes(currentInterface)}
                  onDelete={handleDelete}
                />
              ))}
              {reachedEnd && promotions.length > 0 && (
                <div style={{ padding: 8, opacity: 0.6 }} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
