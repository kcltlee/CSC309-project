'use client';

import { useState, useEffect } from 'react';
import TextField from './TextField';
import Symbol from './Symbol';
import UserSearchCard from './UserSearchCard';
import { useFetchAuthenticated } from '../utility/useFetch';
import colors from '../constants/colors';
import styles from './UserSearchBar.module.css';

/**
 * UserSearchBar Component
 *
 * Search bar for finding users by username.
 * Features:
 * - Debounced search (500ms delay)
 * - Minimum 2 characters to search
 * - Displays results in a list
 * - Shows loading, empty, and error states
 *
 * @param {Function} onRefresh - Callback to refresh parent data after actions
 */
export default function UserSearchBar({ onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Build search endpoint with query parameter
  const searchEndpoint = debouncedQuery.trim().length >= 2
    ? `/api/friends/search?q=${encodeURIComponent(debouncedQuery)}`
    : null;

  // Use useFetchAuthenticated hook for search
  const { data: searchResponse, loading: isSearching, error: searchError, refetch } = useFetchAuthenticated(
    searchEndpoint,
    { immediate: false }
  );

  // Extract search results
  const searchResults = searchResponse?.success ? searchResponse.data : [];

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      setHasSearched(true);
      refetch();
    } else if (debouncedQuery.trim().length === 0) {
      setHasSearched(false);
    }
  }, [debouncedQuery, refetch]);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
  };

  const handleRefreshSearch = () => {
    // Refresh parent data
    if (onRefresh) {
      onRefresh();
    }
    // Re-run search if query exists
    if (debouncedQuery.trim().length >= 2) {
      refetch();
    }
  };

  // Format error message
  const errorMessage = searchError ? searchError.message || 'Failed to search users' : '';

  return (
    <div className={styles.container}>
      {/* Search Input */}
      <div className={styles.searchInputContainer}>
        <div className={styles.searchIcon}>
          <Symbol name="Search" size={24} colour={colors.mediumGray} />
        </div>
        <div style={{ width: '100%' }}>
          <TextField
            placeholder="Search users by username (min 2 characters)"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Search Results */}
      <div className={styles.resultsContainer}>
        {isSearching ? (
          <div className={styles.loading}>
            <Symbol name="Pending" size={32} colour={colors.mediumGray} />
            <p>Searching...</p>
          </div>
        ) : errorMessage ? (
          <div className={styles.error}>
            <Symbol name="Warning" size={32} colour={colors.primaryRed} />
            <p>{errorMessage}</p>
          </div>
        ) : !hasSearched ? (
          <div className={styles.emptyState}>
            <Symbol name="Search" size={64} colour={colors.mediumGray} />
            <p className={styles.emptyStateTitle}>Search for friends</p>
            <p className={styles.emptyStateText}>Enter a username to find and add friends</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className={styles.emptyState}>
            <Symbol name="Ex" size={64} colour={colors.mediumGray} />
            <p className={styles.emptyStateTitle}>No users found</p>
            <p className={styles.emptyStateText}>Try a different username</p>
          </div>
        ) : (
          <div className={styles.resultsList}>
            {searchResults.map((result) => (
              <UserSearchCard
                key={result.user.id}
                result={result}
                onRefresh={handleRefreshSearch}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
