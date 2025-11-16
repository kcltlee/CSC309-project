'use client';

import { useState, useEffect } from 'react';
import { PrimaryButton, SecondaryButton } from './Button';
import TextField from './TextField';
import TextBox from './TextBox';
import Select from './Select';
import Symbol from './Symbol';
import colors from '../constants/colors';
import { patchDataAuthenticated, useFetchAuthenticated } from '../utility/useFetch';
import styles from './CreateHabit.module.css'; // Reuse the same styles

export default function EditHabit({ habit, onSuccess, onCancel, hideHeader = false }) {
  const [habitName, setHabitName] = useState(habit?.title || '');
  const [habitDescription, setHabitDescription] = useState(habit?.description || '');
  const [habitCategory, setHabitCategory] = useState(habit?.category?.name || '');
  const [habitPriority, setHabitPriority] = useState(
    habit?.priority ? habit.priority.charAt(0).toUpperCase() + habit.priority.slice(1) : 'Medium'
  );
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

  // Set recurrence data from habit
  useEffect(() => {
    // Set recurrence pattern
    if (habit?.recurrence_pattern) {
      setRepeat(habit.recurrence_pattern.charAt(0).toUpperCase() + habit.recurrence_pattern.slice(1));
    }

    // Set recurrence day for weekly habits (0=Sunday, 6=Saturday)
    if (habit?.recurrence_pattern === 'weekly' && habit?.recurrence_day !== null) {
      const dayName = daysOfWeek.find(d => d.value === habit.recurrence_day)?.name;
      if (dayName) {
        setSelectedDay(dayName);
      }
    }
  }, [habit]);

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
      // Build update data object
      const updateData = {
        title: habitName.trim(),
        category: selectedCategory.id,
        priority: habitPriority.toLowerCase(),
        recurrencePattern: repeat.toLowerCase(),
      };

      // Only add optional fields if they have values
      if (habitDescription !== undefined) {
        updateData.description = habitDescription.trim();
      }

      // For weekly habits, add the selected day (0=Sunday, 6=Saturday)
      if (repeat === 'Weekly') {
        const day = daysOfWeek.find(d => d.name === selectedDay);
        updateData.recurrenceDay = day.value;
      }

      console.log('Updating habit:', habit.id, 'with data:', updateData);
      const response = await patchDataAuthenticated(`/api/habits/${habit.id}`, updateData);
      console.log('Update response:', response);

      if (response.success) {
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setError(response.error?.message || 'Failed to update habit');
      }
    } catch (err) {
      setError(err.message || 'Failed to update habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this habit? All task instances from this habit will be preserved.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { deleteDataAuthenticated } = await import('../utility/useFetch');
      const response = await deleteDataAuthenticated(`/api/habits/${habit.id}`);

      if (response.success) {
        if (onSuccess) {
          onSuccess({ deleted: true });
        }
      } else {
        setError(response.error?.message || 'Failed to delete habit');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete habit');
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
          <div className={styles.tabs}>
            <PrimaryButton
              text="Edit Habit"
              onClick={(e) => e.preventDefault()}
              type="button"
            />
          </div>
          <div className={styles.infoBannerContainer}>
            <div className={styles.infoBanner}>
              <Symbol name="Info" size={16} colour={colors.primaryYellowDark}/>
              <span className={styles.infoText}>
                Changes will apply to future tasks only
              </span>
            </div>
          </div>
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
