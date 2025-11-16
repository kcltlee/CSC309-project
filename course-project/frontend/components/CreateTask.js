'use client';

import { useState, useEffect } from 'react';
import { PrimaryButton, SecondaryButton } from './Button';
import TextField from './TextField';
import TextBox from './TextBox';
import Select from './Select';
import DateInput from './DateInput';
import Symbol from './Symbol';
import colors from '../constants/colors';
import { primaryColors } from '../constants/colors';
import { postDataAuthenticated, useFetchAuthenticated } from '../utility/useFetch';
import styles from './CreateTask.module.css';

export default function CreateTask({ onSuccess, onCancel, hideHeader = false, onSwitchToCategory }) {
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
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

  const priorityOptions = ['Low', 'Medium', 'High'];

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('=== TASK SUBMISSION DEBUG ===');
    console.log('taskName:', taskName, 'length:', taskName.length);
    console.log('taskDescription:', taskDescription, 'length:', taskDescription.length);
    console.log('taskCategory:', taskCategory);
    console.log('taskPriority:', taskPriority);
    console.log('taskDueDate:', taskDueDate);
    console.log('categories:', categories);

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
    console.log('selectedCategory:', selectedCategory);

    if (!selectedCategory) {
      setError('Invalid category selected');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // Build task data object, only including defined fields
      // NOTE: Backend expects camelCase, not snake_case!
      const taskData = {
        title: taskName.trim(),
        categoryId: selectedCategory.id,  // camelCase
        priority: taskPriority.toLowerCase(),
      };

      // Only add optional fields if they have values
      if (taskDescription.trim()) {
        taskData.description = taskDescription.trim();
      }
      if (taskDueDate) {
        // taskDueDate is in format "YYYY-MM-DD HH:MM" (local time)
        // We need to preserve the local time, not convert to UTC
        // Replace space with 'T' to create valid ISO format, then append timezone offset
        const localISOString = taskDueDate.replace(' ', 'T');
        taskData.dueDate = localISOString;  // camelCase
      }

      console.log('Final task data before sending:', taskData);
      console.log('Stringified:', JSON.stringify(taskData));
      const response = await postDataAuthenticated('/api/tasks', taskData);
      console.log('Response:', response);

      if (response.success) {
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setError(response.error?.message || 'Failed to create task');
      }
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if there are no categories
  const hasNoCategories = categories.length === 0;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {!hideHeader && (
        <div className={styles.header}>
          <h2 className={styles.title}>Create a Task</h2>
        </div>
      )}

      {hasNoCategories && (
        <div className={styles.noCategoriesPrompt}>
          <div className={styles.warningHeader}>
            <Symbol name="Warning" size={24} colour={colors.primaryYellowDark} />
            <p className={styles.noCategoriesText}>
              You need to create a task category before you can create a task.
            </p>
          </div>
          {onSwitchToCategory && (
            <SecondaryButton
              text="Create a Category"
              onClick={onSwitchToCategory}
            />
          )}
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
        <PrimaryButton
          text={isSubmitting ? 'Creating...' : 'Submit'}
          type="submit"
          disabled={isSubmitting || hasNoCategories}
        />
      </div>
    </form>
  );
}
