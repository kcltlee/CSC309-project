'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from '../settings/settings.module.css';
import Button from '../components/Button';
import PrimaryActionDropDownButton from '../components/PrimaryActionDropDownButton';

export default function SwitchInterfaceForm() {
	const { user, currentInterface, setCurrentInterface } = useAuth();
	const [selected, setSelected] = useState(currentInterface);
	const [message, setMessage] = useState(null);

	useEffect(() => {
	setSelected(currentInterface);
	}, [currentInterface]);

	// role hierarchy (high -> low)
	const hierarchy = ['superuser', 'manager', 'cashier', 'regular'];

	const availableInterfaces = useMemo(() => {
		if (!user) {
			return [];
		}

		const role = user.role || 'regular';
		const idx = hierarchy.indexOf(role);
		const base = idx >= 0 ? hierarchy.slice(idx) : [role];
		const isOrganizer = Array.isArray(user.organizedEvents) && user.organizedEvents.length > 0;
		if (isOrganizer && !base.includes('organizer')) {
			base.push('organizer');
		}
		return Array.from(new Set(base));
	}, [user]);

	if (!user) {
		return <div className={styles.placeholder}>Loading...</div>;
	}

	const userRole = user.role || 'regular';
	const hasOther = !(availableInterfaces.length === 1 && availableInterfaces[0] === userRole);

	const dropdownOptions = () => {
		const others = availableInterfaces.filter(i => i !== selected);
		const opts = [
			{ text: selected || userRole, action: () => setSelected(selected || userRole) },
			...availableInterfaces.map(i => ({ text: i, action: () => setSelected(i) }))
		];
		return opts;
	};

	const handleSubmit = () => {
		setCurrentInterface(selected);
		// localStorage.setItem('interface', selected);
		setMessage({ type: 'success', text: `Switched to ${selected} interface` });
	};

	const handleReset = () => {
		setSelected(userRole);
		setMessage(null);
	};

	return (
		<>
			<h3 className={styles.formTitle}>Switch interface</h3>

			<div className={styles.switchFormGrid}>
				<div>
					<div className={styles.metaLabel}>Your role:</div>
					<div className={styles.metaValue}>{userRole}</div>
				</div>

				<div>
					<div className={styles.metaLabel}>Current interface:</div>
					<div className={styles.metaValue}>{currentInterface || userRole}</div>
				</div>

				<div className={styles.interfaceChooser}>
					<div className={styles.chooseLabel}>Choose interface:</div>

					{!hasOther ? (
					<div className={styles.placeholder}>You have no other interfaces available.</div>
					) : (
					<PrimaryActionDropDownButton options={dropdownOptions()} className={styles.interfaceDropdown} />
					)}
				</div>

				{message && (
					<div className={message.type === 'success' ? styles.success : styles.error}>
					{message.text}
					</div>
				)}

				<div className={styles.actionsRow}>
					<Button variant="secondary" onClick={handleReset}>Reset</Button>
					<Button variant="primary" disabled={!selected || selected === (currentInterface || userRole)} onClick={handleSubmit}>Switch Interface</Button>
				</div>
			</div>
		</>
	);
}