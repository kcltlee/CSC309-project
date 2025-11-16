'use client';

import { useState } from 'react';
import Tamagotchi from './Tamagotchi';
import { PrimaryButton, SecondaryButton } from './Button';
import Symbol from './Symbol';
import Notification from './Notification';
import { postDataAuthenticated } from '../utility/useFetch';
import colors from '../constants/colors';
import styles from './FriendRequestCard.module.css';

/**
 * FriendRequestCard Component
 *
 * Displays an incoming friend request with accept/decline actions.
 *
 * @param {Object} request - Friend request object from API
 * @param {string} request.user_id - Requesting user's ID
 * @param {string} request.username - Requesting user's username
 * @param {Object} request.tamagotchi - User's tamagotchi data (if available)
 * @param {Function} onRefresh - Callback to refresh requests list
 */
export default function FriendRequestCard({ request, onRefresh }) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');

  const handleAccept = async () => {
    setIsAccepting(true);

    try {
      const response = await postDataAuthenticated(`/api/friends/accept/${request.user_id}`, {});

      if (response.success) {
        setNotificationMessage(`Accepted friend request from ${request.username}`);
        setNotificationType('success');
        setShowNotification(true);

        // Refresh the requests list
        setTimeout(() => {
          onRefresh();
        }, 500);
      }
    } catch (error) {
      console.error('Accept error:', error);
      setNotificationMessage(error.message || 'Failed to accept request. Please try again.');
      setNotificationType('error');
      setShowNotification(true);
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);

    try {
      const response = await postDataAuthenticated(`/api/friends/decline/${request.user_id}`, {});

      if (response.success) {
        setNotificationMessage(`Declined friend request from ${request.username}`);
        setNotificationType('success');
        setShowNotification(true);

        // Refresh the requests list
        setTimeout(() => {
          onRefresh();
        }, 500);
      }
    } catch (error) {
      console.error('Decline error:', error);
      setNotificationMessage(error.message || 'Failed to decline request. Please try again.');
      setNotificationType('error');
      setShowNotification(true);
      setIsDeclining(false);
    }
  };

  const tamagotchi = request.tamagotchi || {};

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
            <h3 className={styles.username}>{request.username}</h3>
            {tamagotchi.name && (
              <p className={styles.tamagotchiName}>{tamagotchi.name}</p>
            )}
            <p className={styles.requestLabel}>wants to be friends</p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className={styles.actions}>
          <PrimaryButton
            text={isAccepting ? 'Accepting...' : 'Accept'}
            symbol={<Symbol name="Check Mark" size={20} colour={colors.white} />}
            symbolPosition="left"
            onClick={handleAccept}
            disabled={isAccepting || isDeclining}
            backgroundColor={colors.primaryGreen}
          />

          <SecondaryButton
            text={isDeclining ? 'Declining...' : 'Decline'}
            onClick={handleDecline}
            disabled={isAccepting || isDeclining}
          />
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
