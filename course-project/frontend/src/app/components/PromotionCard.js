'use client';

import styles from './PromotionCard.module.css';

export default function PromotionCard({
  id,
  name,
  startTime,
  endTime,
  description,
  minSpending,
  rate,
  points,
  type,
  canDelete,
  onDelete, // callback from parent
}) {
  return (
    <div className={styles.resultItem}>
      <div style={{ marginBottom: 8 }}>
        <span className={styles.promotionName}>{name}</span>
        <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>ID: {id}</div>
        <div><strong>Start:</strong> {startTime ? new Date(startTime).toLocaleString() : '—'}</div>
        <div><strong>End:</strong> {endTime ? new Date(endTime).toLocaleString() : '—'}</div>
        {description && <div><strong>Description:</strong> {description}</div>}
        {minSpending != null && <div><strong>Min Spend:</strong> {minSpending}</div>}
        {rate != null && <div><strong>Rate:</strong> {rate}</div>}
        {points != null && <div><strong>Points:</strong> {points}</div>}
        {type != null && <div><strong>Type:</strong> {type}</div>}
      </div>
      {canDelete && (
        <div className={styles.cardActions}>
          <button
            type="button"
            className={`${styles.deleteBtn} ${styles.deleteDanger}`}
            onClick={() => onDelete(id)}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
