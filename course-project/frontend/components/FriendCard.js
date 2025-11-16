'use client';

import { useState } from 'react';
import Tamagotchi from './Tamagotchi';
import Popover from './Popover';
import { PrimaryButton, SecondaryButton } from './Button';
import Symbol from './Symbol';
import Notification from './Notification';
import { deleteDataAuthenticated } from '../utility/useFetch';
import colors from '../constants/colors';
import styles from './FriendCard.module.css';

/**
 * FriendCard Component
 *
 * Displays a friend with their tamagotchi and stats.
 * Clicking opens a detailed view with option to unfriend.
 *
 * @param {Object} friend - Friend object from API
 * @param {string} friend.user_id - Friend's user ID
 * @param {string} friend.username - Friend's username
 * @param {Object} friend.tamagotchi - Friend's tamagotchi data
 * @param {string} friend.tamagotchi.name - Tamagotchi name
 * @param {string} friend.tamagotchi.color - Tamagotchi color hex
 * @param {number} friend.tamagotchi.age_days - Age in days
 * @param {number} friend.tamagotchi.total_tasks_completed - Total tasks
 * @param {number} friend.tamagotchi.current_streak - Current streak
 * @param {number} friend.tamagotchi.longest_streak - Longest streak
 * @param {Function} onRefresh - Callback to refresh friends list
 */
export default function FriendCard({ friend, onRefresh }) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isUnfriending, setIsUnfriending] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');

  const handleCardClick = () => {
    setIsPopoverOpen(true);
  };

  const handleClosePopover = () => {
    setIsPopoverOpen(false);
  };

  const handleUnfriend = async () => {
    if (!confirm(`Are you sure you want to unfriend ${friend.username}?`)) {
      return;
    }

    setIsUnfriending(true);

    try {
      const response = await deleteDataAuthenticated(`/api/friends/${friend.user_id}`);

      if (response.success) {
        setNotificationMessage(`Unfriended ${friend.username}`);
        setNotificationType('success');
        setShowNotification(true);
        setIsPopoverOpen(false);

        // Refresh the friends list
        setTimeout(() => {
          onRefresh();
        }, 500);
      }
    } catch (error) {
      console.error('Unfriend error:', error);
      setNotificationMessage(error.message || 'Failed to unfriend. Please try again.');
      setNotificationType('error');
      setShowNotification(true);
    } finally {
      setIsUnfriending(false);
    }
  };

  const tamagotchi = friend.tamagotchi || {};

  return (
    <>
      <div className={styles.card} onClick={handleCardClick}>
        {/* Tamagotchi Display */}
        <div className={styles.tamagotchiContainer}>
          <Tamagotchi
            color={tamagotchi.color || colors.primaryPink}
            expression="happy"
            size={150}
            equippedItems={tamagotchi.equipped_items || []}
          />
        </div>

        {/* Friend Info */}
        <div className={styles.info}>
          <h3 className={styles.username}>{friend.username}</h3>
          {tamagotchi.name && (
            <p className={styles.tamagotchiName}>{tamagotchi.name}</p>
          )}

          {/* Stats Preview */}
          <div className={styles.statsPreview}>
            {tamagotchi.current_streak !== undefined && (
              <div className={styles.stat}>
                <Symbol name="Check Mark" size={16} colour={colors.primaryOrange} />
                <span>{tamagotchi.current_streak}</span>
              </div>
            )}
            {tamagotchi.age_days !== undefined && (
              <div className={styles.stat}>
                <Symbol name="Clock" size={16} colour={colors.primaryBlue} />
                <span>{tamagotchi.age_days}d</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed View Popover */}
      <Popover
        isOpen={isPopoverOpen}
        onClose={handleClosePopover}
        maxWidth="500px"
      >
        <div className={styles.popoverContent}>
          {/* Tamagotchi Display */}
          <div className={styles.popoverTamagotchi}>
            <Tamagotchi
              color={tamagotchi.color || colors.primaryPink}
              expression="happy"
              size={200}
              equippedItems={tamagotchi.equipped_items || []}
            />
          </div>

          {/* Friend Details */}
          <div className={styles.popoverBody}>
            <h2 className={styles.popoverTitle}>{friend.username}</h2>
            {tamagotchi.name && (
              <p className={styles.popoverSubtitle}>{tamagotchi.name}</p>
            )}

            {/* Detailed Stats */}
            <div className={styles.statsContainer}>
              <div className={styles.statRow}>
                <div className={styles.statLabel}>
                  <Symbol name="Clock" size={20} colour={colors.primaryBlue} />
                  <span>Age</span>
                </div>
                <span className={styles.statValue}>
                  {tamagotchi.age_days !== undefined ? `${tamagotchi.age_days} days` : 'N/A'}
                </span>
              </div>

              <div className={styles.statRow}>
                <div className={styles.statLabel}>
                  <Symbol name="Check Mark" size={20} colour={colors.primaryGreen} />
                  <span>Tasks Completed</span>
                </div>
                <span className={styles.statValue}>
                  {tamagotchi.total_tasks_completed !== undefined ? tamagotchi.total_tasks_completed : 'N/A'}
                </span>
              </div>

              <div className={styles.statRow}>
                <div className={styles.statLabel}>
                  <Symbol name="Task" size={20} colour={colors.primaryOrange} />
                  <span>Current Streak</span>
                </div>
                <span className={styles.statValue}>
                  {tamagotchi.current_streak !== undefined ? tamagotchi.current_streak : 'N/A'}
                </span>
              </div>

              <div className={styles.statRow}>
                <div className={styles.statLabel}>
                  <Symbol name="Pending" size={20} colour={colors.primaryYellow} />
                  <span>Longest Streak</span>
                </div>
                <span className={styles.statValue}>
                  {tamagotchi.longest_streak !== undefined ? tamagotchi.longest_streak : 'N/A'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.popoverActions}>
              <PrimaryButton
                text={isUnfriending ? 'Unfriending...' : 'Unfriend'}
                symbol={<Symbol name="Ex" size={20} colour={colors.white} />}
                symbolPosition="left"
                onClick={handleUnfriend}
                disabled={isUnfriending}
                backgroundColor={colors.primaryRed}
              />

              <SecondaryButton
                text="Close"
                onClick={handleClosePopover}
              />
            </div>
          </div>
        </div>
      </Popover>

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
