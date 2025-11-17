'use client';

import { useState } from 'react';
import { PrimaryButton, SecondaryButton } from './Button';
import CreateTask from './CreateTask';
import CreateHabit from './CreateHabit';
import CreateTaskCategory from './CreateTaskCategory';
import styles from './CreateTaskFlow.module.css';

export default function CreateTaskFlow({
  initialTab = 'task',
  onSuccess,
  onCancel
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'task', 'habit', or 'category'

  const handleSuccess = (data) => {
    if (onSuccess) {
      onSuccess(data);
    }
  };

  return (
    <div className={styles.container}>
      {/* Tab Header */}
      <div className={styles.header}>
        <div className={styles.tabs}>
          {activeTab === 'task' ? (
            <>
              <PrimaryButton
                text="Create a Task"
                onClick={() => setActiveTab('task')}
              />
              <SecondaryButton
                text="Create a Habit"
                onClick={() => setActiveTab('habit')}
              />
              <SecondaryButton
                text="Create a Task Category"
                onClick={() => setActiveTab('category')}
              />
            </>
          ) : activeTab === 'habit' ? (
            <>
              <SecondaryButton
                text="Create a Task"
                onClick={() => setActiveTab('task')}
              />
              <PrimaryButton
                text="Create a Habit"
                onClick={() => setActiveTab('habit')}
              />
              <SecondaryButton
                text="Create a Task Category"
                onClick={() => setActiveTab('category')}
              />
            </>
          ) : (
            <>
              <SecondaryButton
                text="Create a Task"
                onClick={() => setActiveTab('task')}
              />
              <SecondaryButton
                text="Create a Habit"
                onClick={() => setActiveTab('habit')}
              />
              <PrimaryButton
                text="Create a Task Category"
                onClick={() => setActiveTab('category')}
              />
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className={styles.content}>
        {activeTab === 'task' && (
          <CreateTask
            onSuccess={handleSuccess}
            onCancel={onCancel}
            hideHeader={true}
            onSwitchToCategory={() => setActiveTab('category')}
          />
        )}
        {activeTab === 'habit' && (
          <CreateHabit
            onSuccess={handleSuccess}
            onCancel={onCancel}
            hideHeader={true}
            onSwitchToCategory={() => setActiveTab('category')}
          />
        )}
        {activeTab === 'category' && (
          <CreateTaskCategory
            onSuccess={handleSuccess}
            onCancel={onCancel}
            hideHeader={true}
          />
        )}
      </div>
    </div>
  );
}
