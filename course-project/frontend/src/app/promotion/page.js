'use client';
import React, { useEffect, useState, useCallback } from 'react';
import styles from './page.module.css';
import PromotionSearchBar from '../components/PromotionSearchBar'
import PrimaryActionDropDownButton from '../components/PrimaryActionDropDownButton';


export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [searchName, setSearchName] = useState(''); // input field value
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(''); // term actually used for filtering

  // NEW: pending inputs for filters (commit on Search)
  const [startAfter, setStartAfter] = useState('');       // datetime-local string
  const [endBefore, setEndBefore] = useState('');         // datetime-local string
  const [rateMin, setRateMin] = useState('');             // number string
  const [minSpendMin, setMinSpendMin] = useState('');     // number string
  const [pointsMin, setPointsMin] = useState('');         // number string

  // NEW: applied filters (used by fetch)
  const [appliedStartAfter, setAppliedStartAfter] = useState('');
  const [appliedEndBefore, setAppliedEndBefore] = useState('');
  const [appliedRateMin, setAppliedRateMin] = useState('');
  const [appliedMinSpendMin, setAppliedMinSpendMin] = useState('');
  const [appliedPointsMin, setAppliedPointsMin] = useState('');

  const fetchPromotions = useCallback(async (targetPage = 1, replace = true) => {
    if (!backend) return;
    setLoading(true);
    setErr(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) throw new Error('Not logged in');

      const res = await fetch(`${backend}/promotions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      let list = data.results || [];

      // Apply committed filters
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
        if (!isNaN(s)) {
          list = list.filter(p => p.startTime && new Date(p.startTime) >= s);
        }
      }
      if (appliedEndBefore) {
        const e = new Date(`${appliedEndBefore}T23:59:59.999`);
        if (!isNaN(e)) {
          list = list.filter(p => p.endTime && new Date(p.endTime) <= e);
        }
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

      const startIdx = (targetPage - 1) * 10;
      const batch = list.slice(startIdx, startIdx + 10);
      setPromotions(prev => replace ? batch : [...prev, ...batch]);
      if (batch.length < 10 || startIdx + 10 >= list.length) setReachedEnd(true);
      setPage(targetPage + 1);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [backend, typeFilter, appliedSearchTerm, appliedStartAfter, appliedEndBefore, appliedRateMin, appliedMinSpendMin, appliedPointsMin]);

  const triggerSearch = () => {
    // Commit all current inputs then refetch
    setAppliedSearchTerm(searchName.trim());
    setAppliedStartAfter(startAfter);
    setAppliedEndBefore(endBefore);
    setAppliedRateMin(rateMin);
    setAppliedMinSpendMin(minSpendMin);
    setAppliedPointsMin(pointsMin);

    setPromotions([]);
    setPage(1);
    setReachedEnd(false);
    fetchPromotions(1, true);
  };

  useEffect(() => {
    // Initial load and when committed filters change
    setPromotions([]);
    setPage(1);
    setReachedEnd(false);
    fetchPromotions(1, true);
  }, [fetchPromotions]);

  const handleScroll = (e) => {
    const t = e.target;
    const atBottom = t.scrollTop + t.clientHeight >= t.scrollHeight - 80;
    if (atBottom && !reachedEnd && !loading) {
      fetchPromotions(page, false);
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
          {/* <label style={{ fontSize: 14 }}>
            Type:&nbsp;
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); setReachedEnd(false); }}
              style={{ padding: '6px 8px', borderRadius: 6 }}
            >
              <option value=''>All</option>
              <option value='automatic'>Automatic</option>
              <option value='one-time'>One-time</option>
            </select>
          </label> */}

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
        </div>

        <div className={styles.resultsContainer}>
          <div className={styles.resultsCard}>
            <div className={styles.promotionList} onScroll={handleScroll}>
              {loading && <div>Loading…</div>}
              {err && <div style={{ color: 'red' }}>Error: {err}</div>}
              {!loading && !err && promotions.length === 0 && <div>No promotions found</div>}
              {!loading && !err && promotions.map(p => (
                <div key={p.id} className={styles.resultItem}>
                  <div style={{ marginBottom: 8 }}>
                    <span className={styles.promotionName}>{p.name}</span>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>ID: {p.id}</div>
                    <div><strong>Start:</strong> {p.startTime ? new Date(p.startTime).toLocaleString() : '—'}</div>
                    <div><strong>End:</strong> {p.endTime ? new Date(p.endTime).toLocaleString() : '—'}</div>
                    {p.description && <div><strong>Description:</strong> {p.description}</div>}
                    {p.minSpending != null && <div><strong>Min Spend:</strong> {p.minSpending}</div>}
                    {p.rate != null && <div><strong>Rate:</strong> {p.rate}</div>}
                    {p.points != null && <div><strong>Points:</strong> {p.points}</div>}
                  </div>
                  <span className={styles.roleBadge} style={{ textTransform: 'uppercase' }}>{p.type}</span>
                </div>
              ))}
              {reachedEnd && promotions.length > 0 && <div style={{ padding: 8, opacity: 0.6 }}>End</div>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}