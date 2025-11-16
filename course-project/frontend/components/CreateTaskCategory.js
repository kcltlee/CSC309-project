'use client';

import { useState } from 'react';
import { PrimaryButton, SecondaryButton } from './Button';
import TextField from './TextField';
import Select from './Select';
import ColorPicker from './ColorPicker';
import { primaryColors } from '../constants/colors';
import { postDataAuthenticated } from '../utility/useFetch';
import styles from './CreateTaskCategory.module.css';

export default function CreateTaskCategory({ onSuccess, onCancel, hideHeader = false }) {
  const [name, setName] = useState('');
  const [needMapping, setNeedMapping] = useState('');
  const [color, setColor] = useState(primaryColors.green);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Available need types based on API specification
  const needTypes = ['Hunger', 'Bladder', 'Hygiene', 'Energy', 'Social', 'Fun'];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    if (!needMapping) {
      setError('Need mapping is required');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await postDataAuthenticated('/api/categories', {
        name: name.trim(),
        need_mapping: needMapping,
        color: color,
      });

      if (response.success) {
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setError(response.error?.message || 'Failed to create category');
      }
    } catch (err) {
      setError(err.message || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {!hideHeader && (
        <div className={styles.header}>
          <h2 className={styles.title}>Create a Task Category</h2>
        </div>
      )}

      <div className={styles.formGroup}>
        <label className={styles.label}>Category Name</label>
        <TextField
          value={name}
          onChange={setName}
          placeholder="e.g., Work, Exercise, Study"
          disabled={isSubmitting}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Need Mapping</label>
        <p className={styles.helperText}>
          Which Tamagotchi need does this category restore?
        </p>
        <Select
          value={needMapping}
          onChange={setNeedMapping}
          options={needTypes}
          placeholder="Select a need type"
          disabled={isSubmitting}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Category Color</label>
        <ColorPicker
          selectedColor={color}
          onChange={setColor}
        />
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.actions}>
        <SecondaryButton
          text="Cancel"
          onClick={onCancel}
          disabled={isSubmitting}
        />
        <PrimaryButton
          text={isSubmitting ? 'Creating...' : 'Create Category'}
          type="submit"
          disabled={isSubmitting}
        />
      </div>
    </form>
  );
}
