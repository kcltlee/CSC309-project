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
import styles from './CreateHabit.module.css';

export default function CreateHabit({ onSuccess, onCancel, hideHeader = false, onSwitchToCategory }) {
  const [habitName, setHabitName] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [habitCategory, setHabitCategory] = useState('');
  const [habitPriority, setHabitPriority] = useState('Medium');
  const [repeat, setRepeat] = useState('Daily');
  const [selectedDay, setSelectedDay] = useState('');
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
  const repeatOptions = ['Daily', 'Weekly'];
  const daysOfWeek = [
    { name: 'Sunday', value: 0 },
    { name: 'Monday', value: 1 },
    { name: 'Tuesday', value: 2 },
    { name: 'Wednesday', value: 3 },
    { name: 'Thursday', value: 4 },
    { name: 'Friday', value: 5 },
    { name: 'Saturday', value: 6 },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!habitName.trim()) {
      setError('Habit name is required');
      return;
    }
    if (!habitCategory) {
      setError('Habit category is required');
      return;
    }
    if (repeat === 'Weekly' && selectedDay === '') {
      setError('Please select a day for weekly habits');
      return;
    }

    // Find the category ID
    const selectedCategory = categories.find(cat => cat.name === habitCategory);
    if (!selectedCategory) {
      setError('Invalid category selected');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // Build habit data object
      // NOTE: Backend expects camelCase, not snake_case!
      const habitData = {
        title: habitName.trim(),
        categoryId: selectedCategory.id,
        priority: habitPriority.toLowerCase(),
        recurrencePattern: repeat.toLowerCase(), // 'daily' or 'weekly'
      };

      // Only add optional fields if they have values
      if (habitDescription.trim()) {
        habitData.description = habitDescription.trim();
      }

      // For weekly habits, add the selected day (0=Sunday, 6=Saturday)
      if (repeat === 'Weekly') {
        const day = daysOfWeek.find(d => d.name === selectedDay);
        habitData.recurrenceDay = day.value;
      }

      console.log('Sending habit data:', habitData);
      const response = await postDataAuthenticated('/api/habits', habitData);

      if (response.success) {
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setError(response.error?.message || 'Failed to create habit');
      }
    } catch (err) {
      setError(err.message || 'Failed to create habit');
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
          <h2 className={styles.title}>Create a Habit</h2>
        </div>
      )}

      {hasNoCategories && (
        <div className={styles.noCategoriesPrompt}>
          <div className={styles.warningHeader}>
            <Symbol name="Warning" size={24} colour={colors.primaryYellowDark}/>
            <p className={styles.noCategoriesText}>
              You need to create a task category before you can create a habit.
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
        <label className={styles.label}>Habit Name</label>
        <TextField
          value={habitName}
          onChange={setHabitName}
          placeholder="Complete Task..."
          disabled={isSubmitting || hasNoCategories}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Habit Description</label>
        <TextBox
          value={habitDescription}
          onChange={setHabitDescription}
          placeholder="Steps..."
          rows={4}
          disabled={isSubmitting || hasNoCategories}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Habit Category</label>
        <Select
          value={habitCategory}
          onChange={setHabitCategory}
          options={categories.map(cat => cat.name)}
          placeholder="Select a category"
          disabled={isSubmitting || hasNoCategories}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Habit Priority</label>
        <Select
          value={habitPriority}
          onChange={setHabitPriority}
          options={priorityOptions}
          placeholder="Medium"
          disabled={isSubmitting || hasNoCategories}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Repeat</label>
        <Select
          value={repeat}
          onChange={setRepeat}
          options={repeatOptions}
          placeholder="Daily"
          disabled={isSubmitting || hasNoCategories}
        />
      </div>

      {repeat === 'Weekly' && (
        <div className={styles.formGroup}>
          <label className={styles.label}>Select Day</label>
          <Select
            value={selectedDay}
            onChange={setSelectedDay}
            options={daysOfWeek.map(day => day.name)}
            placeholder="Select a day"
            disabled={isSubmitting || hasNoCategories}
          />
        </div>
      )}

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
