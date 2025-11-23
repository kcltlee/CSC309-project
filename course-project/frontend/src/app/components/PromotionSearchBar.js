'use client';
import React from 'react';
import styles from './PromotionSearchBar.module.css';

export default function PromotionSearchBar({ searchName, setSearchName, onSearch }) {
  return (
    <div className={styles.searchBar}>
      <input
        type="text"
        placeholder="Search promotion name..."
        value={searchName}
        onChange={(e) => setSearchName(e.target.value)}
        className={styles.searchInput}
      />
      <button type="button" onClick={onSearch} className={styles.searchBtn}>Search</button>
      <button
        type="button"
        onClick={() => { setSearchName(''); onSearch(); }}
        className={styles.searchBtn}
      >
        Clear
      </button>
    </div>
  );
}