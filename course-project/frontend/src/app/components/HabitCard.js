'use client';

import Symbol from './Symbol';
import colors from '../constants/colors';
import styles from './TaskCard.module.css'; // Reuse TaskCard styles

/**
 * HabitCard Component
 *
 * Displays a habit in a horizontal card layout matching TaskCard design:
 * - Habit ID (prepended with HABIT-)
 * - Habit Title
 * - Recurrence badge (Daily / Weekly on Day)
 * - Category badge
 * - Priority badge
 *
 * @param {Object} habit - Habit object from API
 * @param {string} habit.id - Habit UUID
 * @param {string} habit.title - Habit title
 * @param {string} habit.recurrence_pattern - 'daily' or 'weekly'
 * @param {number} [habit.recurrence_day] - 0-6 for weekly habits
 * @param {Object} [habit.category] - Category object
 * @param {string} [habit.priority] - Priority: low, medium, high
 * @param {string} [backgroundColor] - Background color (default: white)
 * @param {Function} [onClick] - Callback when card is clicked
 */
export default function HabitCard({
  habit,
  backgroundColor = colors.white,
  onClick,
}) {
  // Format the habit ID for display
  const displayId = `HABIT-${habit.id.substring(0, 4).toUpperCase()}`;

  // Get recurrence display text
  const getRecurrenceText = () => {
    if (habit.recurrence_pattern === 'daily') {
      return 'Daily';
    } else if (habit.recurrence_pattern === 'weekly') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `Weekly on ${days[habit.recurrence_day]}`;
    }
    return 'Daily';
  };

  // Get priority display config
  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'high':
        return { text: '!!!', color: colors.primaryRed };
      case 'medium':
        return { text: '!!', color: colors.primaryBlue };
      case 'low':
        return { text: '!', color: colors.primaryGreen };
      default:
        return { text: '!!', color: colors.primaryBlue };
    }
  };

  const priorityConfig = getPriorityConfig(habit.priority);

  return (
    <div
      className={styles.container}
      style={{ backgroundColor, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {/* Habit ID */}
      <div className={styles.taskId}>
        {displayId}
      </div>

      {/* Habit Title */}
      <div className={styles.taskTitle}>
        {habit.title}
      </div>

      {/* Spacer */}
      <div className={styles.spacer} />

      {/* Recurrence Badge */}
      <div className={styles.tagContainer}>
        <div
          className={styles.categoryTag}
          style={{
            backgroundColor: colors.primaryPurple,
            borderColor: colors.primaryPurpleDark,
            color: colors.white,
          }}
        >
          {getRecurrenceText()}
        </div>
      </div>

      {/* Category Badge */}
      {habit.category && (
        <div className={styles.tagContainer}>
          <div
            className={styles.categoryTag}
            style={{
              backgroundColor: colors.lightGray,
              borderColor: colors.mediumGray,
              color: colors.black,
            }}
          >
            {habit.category.name}
          </div>
        </div>
      )}

      {/* Priority Badge */}
      <div className={styles.tagContainer}>
        <div
          className={styles.categoryTag}
          style={{
            backgroundColor: priorityConfig.color,
            borderColor: priorityConfig.color,
            color: colors.white,
          }}
        >
          {priorityConfig.text}
        </div>
      </div>
    </div>
  );
}
