'use client';

import { useState } from 'react';
import Tamagotchi from './Tamagotchi';
import { PrimaryButton } from './Button';
import Symbol from './Symbol';
import Notification from './Notification';
import { postDataAuthenticated } from '../utility/useFetch';
import colors from '../constants/colors';
import styles from './UserSearchCard.module.css';

/**
 * UserSearchCard Component
 *
 * Displays a user from search results with their friendship status.
 * Shows appropriate action button based on current relationship.
 *
 * @param {Object} result - Search result object from API
 * @param {Object} result.user - User info {id, username}
 * @param {Object} result.tamagotchi - User's tamagotchi data
 * @param {string} result.friendship_status - 'none', 'pending', or 'accepted'
 * @param {Function} onRefresh - Callback to refresh search results
 */
export default function UserSearchCard({ result, onRefresh }) {
  const [isSending, setIsSending] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  const [localStatus, setLocalStatus] = useState(result.friendship_status);

  // Extract user and tamagotchi from result
  const user = result.user;
  const tamagotchi = result.tamagotchi || {};

  const handleSendRequest = async () => {
    setIsSending(true);

    console.log('=== SENDING FRIEND REQUEST ===');
    console.log('User ID:', user.id);
    console.log('Username:', user.username);

    try {
      const response = await postDataAuthenticated('/api/friends/request', {
        friend_user_id: user.id,
      });

      console.log('Response received:', response);

      if (response.success) {
        setNotificationMessage(`Friend request sent to ${user.username}`);
        setNotificationType('success');
        setShowNotification(true);
        setLocalStatus('pending');

        // Optionally refresh search results
        setTimeout(() => {
          if (onRefresh) {
            onRefresh();
          }
        }, 500);
      } else {
        // Response was not successful
        console.error('Response not successful:', response);
        const errorMsg = response.error?.message || response.message || 'Failed to send request';
        setNotificationMessage(errorMsg);
        setNotificationType('error');
        setShowNotification(true);
      }
    } catch (error) {
      console.error('=== CAUGHT ERROR ===');
      console.error('Send request error:', error);
      console.error('Error message:', error.message);
      console.error('Error type:', typeof error);
      console.error('Error keys:', Object.keys(error));
      const errorMsg = error.message || error.toString() || 'Failed to send request. Please try again.';
      setNotificationMessage(errorMsg);
      setNotificationType('error');
      setShowNotification(true);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusDisplay = () => {
    switch (localStatus) {
      case 'accepted':
        return {
          text: 'Friends',
          icon: 'Check Mark',
          color: colors.primaryGreen,
          disabled: true,
        };
      case 'pending':
        return {
          text: 'Request Sent',
          icon: 'Pending',
          color: colors.primaryOrange,
          disabled: true,
        };
      case 'none':
      default:
        return {
          text: isSending ? 'Sending...' : 'Add Friend',
          icon: 'Plus',
          color: colors.primaryBlue,
          disabled: isSending,
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <>
      <div className={styles.card}>
        {/* Left: User Info with Tamagotchi */}
        <div className={styles.userSection}>
          <div className={styles.tamagotchiContainer}>
            <Tamagotchi
              color={tamagotchi.color || colors.primaryPink}
              expression="happy"
              size={80}
            />
          </div>

          <div className={styles.userInfo}>
            <h3 className={styles.username}>{user.username}</h3>
            {tamagotchi.name && (
              <p className={styles.tamagotchiName}>{tamagotchi.name}</p>
            )}
            {tamagotchi.age_days !== undefined && (
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <Symbol name="Clock" size={14} colour={colors.primaryBlue} />
                  <span>{tamagotchi.age_days}d</span>
                </div>
                {tamagotchi.current_streak !== undefined && (
                  <div className={styles.stat}>
                    <Symbol name="Check Mark" size={14} colour={colors.primaryOrange} />
                    <span>{tamagotchi.current_streak}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Action Button */}
        <div className={styles.actions}>
          {localStatus === 'none' ? (
            <PrimaryButton
              text={statusDisplay.text}
              symbol={<Symbol name={statusDisplay.icon} size={20} colour={colors.white} />}
              symbolPosition="left"
              onClick={handleSendRequest}
              disabled={statusDisplay.disabled}
              backgroundColor={statusDisplay.color}
            />
          ) : (
            <div className={styles.statusBadge} style={{ backgroundColor: `${statusDisplay.color}20`, color: statusDisplay.color }}>
              <Symbol name={statusDisplay.icon} size={20} colour={statusDisplay.color} />
              <span>{statusDisplay.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notification */}
      <Notification
        message={notificationMessage}
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
        type={notificationType}
      />
    </>
  );
}
