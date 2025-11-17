'use client';

import Symbol from './Symbol';
import TagSelect from './TagSelect';
import colors from '../constants/colors';
import styles from './TaskCard.module.css';

/**
 * TaskCard Component
 *
 * Displays a task in a horizontal card layout showing:
 * - Task ID (prepended with TASK-)
 * - Task Title
 * - Due Date with Clock symbol
 * - Priority TagSelect (!!! red, !! blue, ! green)
 * - Status TagSelect (Not Started, In Progress, Done, Cancelled)
 *
 * @param {Object} task - Task object from API
 * @param {string} task.id - Task UUID
 * @param {string} task.title - Task title
 * @param {string} [task.due_date] - ISO datetime string
 * @param {string} [task.priority] - Priority: low, medium, high
 * @param {string} [task.status] - Status: not_started, in_progress, completed, cancelled
 * @param {string} [backgroundColor] - Background color (default: white)
 * @param {Function} [onPriorityChange] - Callback when priority changes
 * @param {Function} [onStatusChange] - Callback when status changes
 * @param {Function} [onDelete] - Callback when delete button is clicked
 */
export default function TaskCard({
  task,
  backgroundColor = colors.white,
  onPriorityChange,
  onStatusChange,
  onClick,
  onDelete,
}) {
  // Format the task ID for display
  const displayId = `TASK-${task.id.substring(0, 8).toUpperCase()}`;

  // Format due date
  const formatDueDate = (isoDate) => {
    if (!isoDate) return null;

    const date = new Date(isoDate);
    const now = new Date();

    // Check if time is midnight (12:00 AM)
    const isMidnight = date.getHours() === 0 && date.getMinutes() === 0;

    // Format date
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });

    // Include time if not midnight
    if (!isMidnight) {
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${dateStr}, ${timeStr}`;
    }

    return dateStr;
  };

  // Priority options for TagSelect
  const priorityOptions = [
    {
      text: '!!!',
      backgroundColour: colors.primaryRed,
      action: () => onPriorityChange && onPriorityChange('high'),
    },
    {
      text: '!!',
      backgroundColour: colors.primaryBlue,
      action: () => onPriorityChange && onPriorityChange('medium'),
    },
    {
      text: '!',
      backgroundColour: colors.primaryGreen,
      action: () => onPriorityChange && onPriorityChange('low'),
    },
  ];

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

  // Status options for TagSelect
  // Disable status changes if task is already completed
  const isCompleted = task.status === 'completed';
  const statusOptions = isCompleted ? [] : [
    {
      symbol: <Symbol name="Task" size={16} colour={colors.white} />,
      text: 'Not Started',
      backgroundColour: colors.mediumGray,
      action: () => onStatusChange && onStatusChange('not_started'),
    },
    {
      symbol: <Symbol name="Pending" size={16} colour={colors.white} />,
      text: 'In Progress',
      backgroundColour: colors.primaryBlue,
      action: () => onStatusChange && onStatusChange('in_progress'),
    },
    {
      symbol: <Symbol name="Check Mark" size={16} colour={colors.white} />,
      text: 'Done',
      backgroundColour: colors.primaryGreen,
      action: () => onStatusChange && onStatusChange('completed'),
    },
    {
      symbol: <Symbol name="Cancel" size={16} colour={colors.white} />,
      text: 'Cancelled',
      backgroundColour: colors.primaryRed,
      action: () => onStatusChange && onStatusChange('cancelled'),
    },
  ];

  // Get status display config
  const getStatusConfig = (status) => {
    switch (status) {
      case 'not_started':
        return {
          symbol: <Symbol name="Task" size={16} colour={colors.white} />,
          text: 'Not Started',
          color: colors.mediumGray,
        };
      case 'in_progress':
        return {
          symbol: <Symbol name="Pending" size={16} colour={colors.white} />,
          text: 'In Progress',
          color: colors.primaryBlue,
        };
      case 'completed':
        return {
          symbol: <Symbol name="Check Mark" size={16} colour={colors.white} />,
          text: 'Done',
          color: colors.primaryGreen,
        };
      case 'cancelled':
        return {
          symbol: <Symbol name="Cancel" size={16} colour={colors.white} />,
          text: 'Cancelled',
          color: colors.primaryRed,
        };
      default:
        return {
          symbol: <Symbol name="Task" size={16} colour={colors.white} />,
          text: 'Not Started',
          color: colors.mediumGray,
        };
    }
  };

  const priorityConfig = getPriorityConfig(task.priority);
  const statusConfig = getStatusConfig(task.status);
  const formattedDate = formatDueDate(task.due_date);

  return (
    <div
      className={styles.container}
      style={{ backgroundColor, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {/* Task ID */}
      <div className={styles.taskId}>
        {displayId}
      </div>

      {/* Task Title */}
      <div className={styles.taskTitle}>
        {task.title}
      </div>

      {/* Spacer */}
      <div className={styles.spacer} />

      {/* Due Date */}
      {formattedDate && (
        <div className={styles.dueDate}>
          <Symbol name="Clock" size={16} colour={colors.black} />
          <span>{formattedDate}</span>
        </div>
      )}

      {/* Priority TagSelect */}
      <div className={styles.tagContainer} onClick={(e) => e.stopPropagation()}>
        <TagSelect
          type="rounded"
          backgroundColour={priorityConfig.color}
          defaultText={priorityConfig.text}
          options={priorityOptions}
        />
      </div>

      {/* Category Display */}
      {task.category && (
        <div className={styles.tagContainer}>
          <div
            className={styles.categoryTag}
            style={{
              backgroundColor: colors.lightGray,
              borderColor: colors.mediumGray,
              color: colors.black,
            }}
          >
            {task.category}
          </div>
        </div>
      )}

      {/* Status TagSelect */}
      <div className={styles.tagContainer} onClick={(e) => e.stopPropagation()}>
        <TagSelect
          type="capsule"
          backgroundColour={statusConfig.color}
          defaultText={statusConfig.text}
          defaultSymbol={statusConfig.symbol}
          options={statusOptions}
        />
      </div>

      {/* Delete Button */}
      {onDelete && (
        <button
          className={styles.deleteButton}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          title="Delete task"
        >
          <Symbol name="Trash" size={16} colour={colors.black} />
        </button>
      )}
    </div>
  );
}
