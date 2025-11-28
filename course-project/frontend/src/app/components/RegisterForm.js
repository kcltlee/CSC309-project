'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from './Button.js';
import styles from '../user/user.module.css';
import colors from '../constants/colors.js';

export default function RegisterForm() {
	const router = useRouter();
	const { token } = useAuth();

	const [utorid, setUtorid] = useState('');
	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [loading, setLoading] = useState(false);

	const validate = () => {
		if (!utorid.trim()) return 'UTORid is required';
		if (!fullName.trim()) return 'Name is required';
		if (!email.trim()) return 'Email is required';
		return null;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setSuccess('');
		const v = validate();
		if (v) {
			setError(v);
			return;
		}

		setLoading(true);
		try {
			const res = await fetch('/users', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				},
				body: JSON.stringify({
					utorid: utorid.trim(),
					name: fullName.trim(),
					email: email.trim()
				})
			});

			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data?.error || `Error ${res.status}: ${res.statusText}`);
			}

			setSuccess(`Created user '${data.utorid}' successfully.`);
			setUtorid('');
			setFullName('');
			setEmail('');
		} catch (err) {
			setError(err?.message || 'Failed to create user');
		} finally {
			setLoading(false);
		}
	};

	// enable submit only when all three inputs have a non-empty value
	const canSubmit = Boolean(utorid.trim() && fullName.trim() && email.trim());

	return (
		<div className={styles.container} style={{ '--primary': colors.primary }}>
			<div className={styles.card}>
				<h1 className={styles.title}>Register New User</h1>

				<form className={styles.form} onSubmit={handleSubmit} noValidate>
					<label className={styles.label}>
						UTORid
						<input
							className={styles.input}
							value={utorid}
							onChange={(e) => setUtorid(e.target.value)}
							placeholder="e.g. doej1"
							autoComplete="username"
							required
						/>
					</label>

					<label className={styles.label}>
						Full Name
						<input
							className={styles.input}
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
							placeholder="John Doe"
							required
						/>
					</label>

					<label className={styles.label}>
						Email
						<input
							className={styles.input}
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="name@mail.utoronto.ca"
							required
						/>
					</label>

					{error && <div className={styles.error}>{error}</div>}
					{success && <div className={styles.success}>{success}</div>}

					<div className={styles.actions}>
						<Button type="submit" disabled={loading || !canSubmit}>
							{loading ? 'Creating…' : 'Create User'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}