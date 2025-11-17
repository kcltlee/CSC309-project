'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './DateInput.module.css';

export default function DateInput({
  value,
  onChange,
  placeholder = 'Select date',
  includeTime = false,
  minDate,
  maxDate,
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const [timeValue, setTimeValue] = useState(value && includeTime ? formatTime(new Date(value)) : '12:00');
  const containerRef = useRef(null);

  // Update internal state when value prop changes
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setViewDate(date);
      if (includeTime) {
        setTimeValue(formatTime(date));
      }
    } else {
      setSelectedDate(null);
      setViewDate(new Date());
      setTimeValue('12:00');
    }
  }, [value, includeTime]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const formatDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateTime = (date, time) => {
    if (!date) return '';
    const dateStr = formatDate(date);
    return includeTime ? `${dateStr} ${time}` : dateStr;
  };

  function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const displayValue = selectedDate ? formatDateTime(selectedDate, timeValue) : '';

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateClick = (day) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);

    // Check min/max constraints
    if (minDate && newDate < new Date(minDate)) return;
    if (maxDate && newDate > new Date(maxDate)) return;

    setSelectedDate(newDate);
    onChange(formatDateTime(newDate, timeValue));

    if (!includeTime) {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    if (selectedDate) {
      onChange(formatDateTime(selectedDate, newTime));
    }
  };

  const previousMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Weekday headers
    weekdays.forEach((day) => {
      days.push(
        <div key={`weekday-${day}`} className={styles.weekday}>
          {day}
        </div>
      );
    });

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isSelected = selectedDate &&
        currentDate.getDate() === selectedDate.getDate() &&
        currentDate.getMonth() === selectedDate.getMonth() &&
        currentDate.getFullYear() === selectedDate.getFullYear();

      const isDisabled =
        (minDate && currentDate < new Date(minDate)) ||
        (maxDate && currentDate > new Date(maxDate));

      days.push(
        <button
          key={day}
          type="button"
          className={`${styles.day} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`}
          onClick={() => !isDisabled && handleDateClick(day)}
          disabled={isDisabled}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div ref={containerRef} className={`${styles.container} ${className}`}>
      <input
        type="text"
        value={displayValue}
        placeholder={placeholder}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        readOnly
        disabled={disabled}
        className={styles.input}
      />

      {isOpen && (
        <div className={styles.calendar}>
          <div className={styles.header}>
            <button type="button" className={styles.navButton} onClick={previousMonth}>
              ‹
            </button>
            <span className={styles.monthYear}>
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button type="button" className={styles.navButton} onClick={nextMonth}>
              ›
            </button>
          </div>

          <div className={styles.grid}>
            {renderCalendar()}
          </div>

          {includeTime && (
            <div className={styles.timeSelector}>
              <label className={styles.timeLabel}>Time:</label>
              <input
                type="time"
                value={timeValue}
                onChange={handleTimeChange}
                className={styles.timeInput}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
