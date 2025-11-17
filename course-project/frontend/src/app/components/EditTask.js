'use client';

import { useState, useEffect } from 'react';
import { PrimaryButton, SecondaryButton } from './Button';
import TextField from './TextField';
import TextBox from './TextBox';
import Select from './Select';
import DateInput from './DateInput';
import Symbol from './Symbol';
import colors from '../constants/colors';
import { patchDataAuthenticated, useFetchAuthenticated } from '../utility/useFetch';
import styles from './CreateTask.module.css'; // Reuse the same styles

export default function EditTask({ task, onSuccess, onCancel, hideHeader = false }) {
  const [taskName, setTaskName] = useState(task?.title || '');
  const [taskDescription, setTaskDescription] = useState(task?.description || '');
  const [taskCategory, setTaskCategory] = useState(task?.category || '');
  const [taskPriority, setTaskPriority] = useState(
    task?.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'
  );
  const [taskDueDate, setTaskDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch categories for the dropdown
  const { data: categoriesResponse } = useFetchAuthenticated('/api/categories');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (categoriesResponse && categoriesResponse.success) {
      setCategories(categoriesResponse.data || []);
    }
  }, [categoriesResponse]);

  // Format the due date for DateInput component
  useEffect(() => {
    if (task?.due_date) {
      // Convert ISO date to DateInput format
      const date = new Date(task.due_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      setTaskDueDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  }, [task]);

  const priorityOptions = ['Low', 'Medium', 'High'];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!taskName.trim()) {
      setError('Task name is required');
      return;
    }
    if (!taskCategory) {
      setError('Task category is required');
      return;
    }

    // Find the category ID
    const selectedCategory = categories.find(cat => cat.name === taskCategory);
    if (!selectedCategory) {
      setError('Invalid category selected');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // Build update data object - PATCH endpoint expects snake_case
      const updateData = {
        title: taskName.trim(),
        category: selectedCategory.id,  // Backend expects 'category' for PATCH
        priority: taskPriority.toLowerCase(),
      };

      // Only add optional fields if they have values
      if (taskDescription !== undefined) {
        updateData.description = taskDescription.trim();
      }
      if (taskDueDate) {
        // Convert to ISO 8601 format
        const isoDate = new Date(taskDueDate).toISOString();
        updateData.due_date = isoDate;  // snake_case for PATCH
      }

      console.log('Updating task:', task.id, 'with data:', updateData);
      const response = await patchDataAuthenticated(`/api/tasks/${task.id}`, updateData);
      console.log('Update response:', response);

      if (response.success) {
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setError(response.error?.message || 'Failed to update task');
      }
    } catch (err) {
      setError(err.message || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { deleteDataAuthenticated } = await import('../utility/useFetch');
      const response = await deleteDataAuthenticated(`/api/tasks/${task.id}`);

      if (response.success) {
        if (onSuccess) {
          onSuccess({ deleted: true });
        }
      } else {
        setError(response.error?.message || 'Failed to delete task');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if there are no categories
  const hasNoCategories = categories.length === 0;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {!hideHeader && (
        <div className={styles.tabs}>
          <PrimaryButton
            text="Edit Task"
            onClick={(e) => e.preventDefault()}
            type="button"
          />
        </div>
      )}

      <div className={styles.formGroup}>
        <label className={styles.label}>Task Name</label>
        <TextField
          value={taskName}
          onChange={setTaskName}
          placeholder="Complete Task..."
          disabled={isSubmitting || hasNoCategories}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Task Description</label>
        <TextBox
          value={taskDescription}
          onChange={setTaskDescription}
          placeholder="Steps..."
          rows={4}
          disabled={isSubmitting || hasNoCategories}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Task Category</label>
        <Select
          value={taskCategory}
          onChange={setTaskCategory}
          options={categories.map(cat => cat.name)}
          placeholder="Select a category"
          disabled={isSubmitting || hasNoCategories}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Task Priority</label>
        <Select
          value={taskPriority}
          onChange={setTaskPriority}
          options={priorityOptions}
          placeholder="Medium"
          disabled={isSubmitting || hasNoCategories}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Task Due Date</label>
        <DateInput
          value={taskDueDate}
          onChange={setTaskDueDate}
          placeholder="23 September 2025, 5:00PM"
          includeTime={true}
          disabled={isSubmitting || hasNoCategories}
        />
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.actions}>
        <SecondaryButton
          text="Delete"
          onClick={handleDelete}
          disabled={isSubmitting}
          type="button"
        />
        <SecondaryButton
          text="Cancel"
          onClick={onCancel}
          disabled={isSubmitting}
          type="button"
        />
        <PrimaryButton
          text={isSubmitting ? 'Saving...' : 'Save Changes'}
          type="submit"
          disabled={isSubmitting || hasNoCategories}
        />
      </div>
    </form>
  );
}
