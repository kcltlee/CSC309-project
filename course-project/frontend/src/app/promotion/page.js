'use client';
import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { PrimaryButton } from '../components/Button';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {

    const fetchPromotions = async () => {
      setLoading(true);
      setErr(null);


      try {
        
        // check token
        // check that the code runs in browser for local storage, and read saved JWT
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) throw new Error('Not logged in');
        
        // fetch promotions
        const res = await fetch(`${backend}/promotions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setPromotions(data.results || []);

      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };
    if (backend) fetchPromotions();
    // rerun if backend changes
  }, [backend]);

  // for infinite scroll
  const handleScroll = (e) => {
      const target = e.target;
      const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 100;
      if (atBottom && !reachedEnd && !loading) {
          filter = false;
          fetchPromotions(page);
      }
  };

  return (
    <div className={styles.pageContainer}>
      <main>
        <h1>Promotions</h1>

        <div className={styles.buttonRow}>
          <PrimaryButton
            text="Create Promotion"
            onClick={() => window.location.href = '/promotion/create'}
          />
          <PrimaryButton
            text="Update Promotion"
            onClick={() => window.location.href = '/promotion/update'}
          />
        </div>

        <div className={styles.resultsContainer}>
          <div className={styles.resultsCard}>
            <div className={styles.promotionList} onScroll={handleScroll}>
              {loading && <div>Loading…</div>}
              {err && <div style={{ color: 'red' }}>Error: {err}</div>}
              {!loading && !err && promotions.length === 0 && <div>No promotions found</div>}

              {!loading && !err && promotions.map(p => (
                <div key={p.id} className={styles.resultItem}>
                    <div style={{  justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className={styles.promotionName}>{p.name}</span>

                      <div><strong>Start:</strong> {p.startTime ? new Date(p.startTime).toLocaleString() : '—'}</div>
                      <div><strong>End:</strong> {p.endTime ? new Date(p.endTime).toLocaleString() : '—'}</div>
                      {p.description && <div><strong>Description:</strong> {p.description}</div>}
                      {p.minSpending != null && <div><strong>Min Spend:</strong> {p.minSpending}</div>}
                      {p.rate != null && <div><strong>Rate:</strong> {p.rate}</div>}
                      {p.points != null && <div><strong>Points:</strong> {p.points}</div>}
                    </div>
                    <div style={{ fontSize: 14, display: 'grid', gap: 4 }}>
                        <span style={{ textTransform: 'uppercase' }} className={styles.roleBadge}>{p.type}</span>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}