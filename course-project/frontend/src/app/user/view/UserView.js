'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import styles from '../user.module.css';
import Button from '../../components/Button';
import PrimaryActionDropDownButton from '../../components/PrimaryActionDropDownButton';

export default function UserView() {
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [reachedEnd, setReachedEnd] = useState(false);
    const [roleFilter, setRoleFilter] = useState(null); 
    const [verifiedFilter, setVerifiedFilter] = useState(null);
    const [activatedFilter, setActivatedFilter] = useState(null);
    const { token } = useAuth();
    let loading = false;
    let filter = false;
    const limit = 5;
    const roles = ['regular', 'cashier', 'manager', 'superuser'];
    const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL; // idk why this is needed here

    // new state for expansion and edit form
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [editForm, setEditForm] = useState({
        email: '',
        verified: null,
        suspicious: null,
        role: '',
        message: '',
        messageType: '' // 'success' or 'error'
    });
    const [initialEdit, setInitialEdit] = useState(null); // track original values to know if form is dirty

    const fetchUsers = async (p = 1) => {
        if (loading) { // prevent fetching twice
            return;
        } else {
            loading = true;
        }

        let newUsers = users;
        if (filter) {
            filter = false;
            newUsers = [];
        }

        // creating filters for backend 
        let params = "";
        if (roleFilter && roleFilter !== '') params += "role=" + roleFilter;
        if (verifiedFilter) params += (params ? '&' : '') + "verified=" + verifiedFilter;
        if (activatedFilter) params += (params ? '&' : '') + "activated=" + activatedFilter;
        params += (params ? '&' : '') + "page=" + p;
        params += "&limit=" + limit;
        console.log(params)

        const res = await fetch(`/users?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
        });
        const data = await res.json();

        if (!res.ok) { // should not happen
            console.log(data?.message || `Error: ${res.status}`);
            loading = false;
            return;
        }

        setUsers([...newUsers, ...data.results])
        setReachedEnd(users.length >= data.count);
        setPage(p + 1);
        loading = false;
    };

    // helper to open the editor for a user and prefill form
    const openEditor = (u) => {
        // toggle editor
        if (expandedUserId === u.id) {
            setExpandedUserId(null);
            setInitialEdit(null);
            setEditForm(prev => ({ ...prev, message: '', messageType: '' }));
            return;
        }

        const initial = {
            email: u.email ?? '',
            verified: u.verified === true ? true : false,
            suspicious: u.suspicious === true ? true : false,
            role: u.role ?? 'regular'
        };

        setExpandedUserId(u.id);
        setInitialEdit(initial);
        setEditForm({ ...initial, message: '', messageType: '' });
    };

    const closeEditor = () => {
        setExpandedUserId(null);
        setInitialEdit(null);
        setEditForm(prev => ({ ...prev, message: '', messageType: '' }));
    };

    const handleEditChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (userId) => {
        // build payload of only modified fields compared to initialEdit
        const payload = {};
        if (initialEdit) {
            if (editForm.email !== initialEdit.email) payload.email = editForm.email;
            if (editForm.verified !== initialEdit.verified) payload.verified = editForm.verified;
            if (editForm.suspicious !== initialEdit.suspicious) payload.suspicious = editForm.suspicious;
            if (editForm.role !== initialEdit.role) payload.role = editForm.role;
        } else {
            // fallback: send what we have (shouldn't usually happen because submit is disabled when not dirty)
            if (editForm.email !== undefined) payload.email = editForm.email;
            if (editForm.verified !== undefined) payload.verified = editForm.verified;
            if (editForm.suspicious !== undefined) payload.suspicious = editForm.suspicious;
            if (editForm.role) payload.role = editForm.role;
        }

        // nothing changed -> no request
        if (Object.keys(payload).length === 0) {
            setEditForm(prev => ({ ...prev, message: 'No changes to save', messageType: 'error' }));
            return;
        }

        try {
            const res = await fetch(`/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) {
                const msg = data?.error || data?.message || `Error ${res.status}`;
                setEditForm(prev => ({ ...prev, message: msg, messageType: 'error' }));
                return;
            }

            // success: update local users state to reflect only changed fields
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...payload } : u));

            setEditForm(prev => ({ ...prev, message: 'Updated successfully', messageType: 'success' }));
            // optionally close editor after short delay
            setTimeout(() => closeEditor(), 900);
        } catch (err) {
            setEditForm(prev => ({ ...prev, message: err.message || 'Network error', messageType: 'error' }));
        }
    };

    // fetch users everytime filter changes
    useEffect(() => {
        setUsers([]);
        setPage(1);
        setReachedEnd(false);
        filter = true;
        fetchUsers(1);
    }, [token, roleFilter, verifiedFilter, activatedFilter]);

    // for infinite scroll
    const handleScroll = (e) => {
        const target = e.target;
        const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 100;
        if (atBottom && !reachedEnd && !loading) {
            filter = false;
            fetchUsers(page);
        }
    };

    const toggleRole = (r) => {
        console.log(r, roleFilter)
        setRoleFilter(prev => (prev === r ? null : r));
        console.log(roleFilter)
    };

    // compute whether any editable field changed
    const isDirty = initialEdit
        ? (
            (editForm.email !== initialEdit.email) ||
            (editForm.verified !== initialEdit.verified) ||
            (editForm.suspicious !== initialEdit.suspicious) ||
            (editForm.role !== initialEdit.role)
          )
        : false;

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>Users</h1>

            <div className={styles.filters}>
                <span className={styles.subtitle}>Filters:</span>

                {/* roles filter */}
                <div className={styles.roleFilterGroup} role="tablist" aria-label="Role filters">
                    {roles.map((r) => (
                        <Button
                            key={r}
                            variant="secondary"
                            className={`${styles.roleFilterBtn} ${roleFilter === r ? styles.roleFilterActive : ''}`}
                            onClick={() => toggleRole(r)}>
                            {r}
                        </Button>
                    ))}
                </div>

                {/* verified filter */}
                <div className={styles.filterItem}>
                    <label className={styles.filterLabel}>Verified:</label>
                    <PrimaryActionDropDownButton
                        options={[
                            verifiedFilter == null
                                ? { text: 'Any', action: () => setVerifiedFilter(null) }
                                : verifiedFilter === 'true'
                                ? { text: 'Verified', action: () => setVerifiedFilter('true') }
                                : { text: 'Not verified', action: () => setVerifiedFilter('false') },

                            { text: 'Any', action: () => setVerifiedFilter(null) },
                            { text: 'Verified', action: () => setVerifiedFilter('true') },
                            { text: 'Not verified', action: () => setVerifiedFilter('false') },
                        ]}
                        className={styles.filterDropDown}
                    />
                </div>

                {/* activated filter */}
                <div className={styles.filterItem}>
                    <label className={styles.filterLabel}>Activated:</label>
                    <PrimaryActionDropDownButton
                        options={[
                            activatedFilter == null
                                ? { text: 'Any', action: () => setActivatedFilter(null) }
                                : activatedFilter === 'true'
                                ? { text: 'Activated', action: () => setActivatedFilter('true') }
                                : { text: 'Not activated', action: () => setActivatedFilter('false') },

                            { text: 'Any', action: () => setActivatedFilter(null) },
                            { text: 'Activated', action: () => setActivatedFilter('true') },
                            { text: 'Not activated', action: () => setActivatedFilter('false') },
                        ]}
                        className={styles.filterDropDown}
                    />
                </div>
            </div>
            <div className={styles.resultsContainer}>
                <div className={styles.resultsCard}>
                    <div className={styles.userList} onScroll={handleScroll}>
                        {users.map(u => {
                            let avatarSrc = '/Friend Symbol.svg';
                            if (u?.avatarUrl) {
                                if (/^https?:\/\//i.test(u.avatarUrl)) {
                                    avatarSrc = u.avatarUrl;
                                } else if (u.avatarUrl.startsWith('/')) {
                                    // if backend base is provided, prefix it; otherwise assume same origin
                                    avatarSrc = BACKEND_BASE ? `${BACKEND_BASE}${u.avatarUrl}` : u.avatarUrl;
                                } else {
                                    // a bare filename or relative path
                                    avatarSrc = BACKEND_BASE ? `${BACKEND_BASE}/${u.avatarUrl}` : `/${u.avatarUrl}`;
                                }
                            }

                            return (
                                <div key={u.id} className={styles.userCard}>
                                    <div className={styles.userId}>ID {String(u.id)}</div>

                                    {(() => {
                                        const map = {
                                            regular: styles.roleRegular,
                                            cashier: styles.roleCashier,
                                            manager: styles.roleManager,
                                            superuser: styles.roleSuperuser,
                                        };
                                        const roleKey = u.role;
                                        const roleClass = map[roleKey];
                                        return <div className={`${styles.roleBadge} ${roleClass}`}>{roleKey}</div>;
                                    })()}

                                    <img src={avatarSrc} className={styles.avatar} alt={`${u.name ?? u.email} avatar`} />

                                    <div className={styles.userMain}>
                                        <div className={styles.userHeader}>
                                            <div className={styles.userName}>{u.name ?? '—'}</div>
                                            {u.verified && <span className={styles.verifiedBadge}>Verified</span>}
                                        </div>

                                        <div className={styles.userEmail}>{u.email ?? ''}</div>

                                        <div className={styles.userMeta}>
                                            <div>Birthday: <strong>{u.birthday ? new Date(u.birthday).toLocaleDateString() : '—'}</strong></div>
                                            <div className={styles.points}>
                                                Points:
                                                <span className={u.points > 1000 ? styles.pointsHigh : u.points > 100 ? styles.pointsMed : styles.pointsLow} style={{ marginLeft: 6 }}>
                                                    {u.points ?? 0}
                                                </span>
                                            </div>
                                        </div>

                                        {/* expanded editor */}
                                        {expandedUserId === u.id && (
                                            <div className={styles.expandedEditor}>
                                                <div className={styles.expandedMeta}>
                                                    <div>UTORid: <strong>{u.utorid}</strong></div>
                                                    <div>Created: <strong>{u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}</strong></div>
                                                    <div>Last login: <strong>{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '—'}</strong></div>
                                                </div>

                                                <div className={styles.editorGrid}>
                                                    <label className={styles.editorLabel}>
                                                        <span className={styles.editorLabelTitle}>Email</span>
                                                        <input
                                                            className={styles.input}
                                                            value={editForm.email}
                                                            onChange={(e) => handleEditChange('email', e.target.value)}
                                                        />
                                                    </label>

                                                    <div className={styles.editorLabel}>
                                                        <span className={styles.editorLabelTitle}>Verified</span>
                                                        <div className={styles.smallButtonsRow}>
                                                            <Button
                                                                variant="secondary"
                                                                className={`${styles.roleFilterBtn} ${editForm.verified === true ? styles.roleFilterActive : ''}`}
                                                                onClick={() => handleEditChange('verified', true)}
                                                            >
                                                                Verified
                                                            </Button>
                                                            <Button
                                                                variant="secondary"
                                                                className={`${styles.roleFilterBtn} ${editForm.verified === false ? styles.roleFilterActive : ''}`}
                                                                onClick={() => handleEditChange('verified', false)}
                                                            >
                                                                Not verified
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className={styles.editorLabel}>
                                                        <span className={styles.editorLabelTitle}>Role</span>
                                                        <div className={styles.roleButtonGroup}>
                                                            {roles.map(r => (
                                                                <Button
                                                                    key={r}
                                                                    variant="secondary"
                                                                    className={`${styles.roleFilterBtn} ${editForm.role === r ? styles.roleFilterActive : ''}`}
                                                                    onClick={() => handleEditChange('role', r)}
                                                                >
                                                                    {r}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className={styles.editorLabel}>
                                                        <span className={styles.editorLabelTitle}>Suspicious</span>
                                                        <div className={styles.smallButtonsRow}>
                                                            <Button
                                                                variant="secondary"
                                                                className={`${styles.roleFilterBtn} ${editForm.suspicious === true ? styles.roleFilterActive : ''}`}
                                                                onClick={() => handleEditChange('suspicious', true)}
                                                            >
                                                                Suspicious
                                                            </Button>
                                                            <Button
                                                                variant="secondary"
                                                                className={`${styles.roleFilterBtn} ${editForm.suspicious === false ? styles.roleFilterActive : ''}`}
                                                                onClick={() => handleEditChange('suspicious', false)}
                                                            >
                                                                Not suspicious
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* message */}
                                                {editForm.message && (
                                                    <div className={editForm.messageType === 'success' ? `${styles.success} ${styles.editorMessage}` : `${styles.error} ${styles.editorMessage}`}>
                                                        {editForm.message}
                                                    </div>
                                                )}

                                                <div className={styles.editorActions}>
                                                    <Button variant="secondary" onClick={closeEditor}>Cancel</Button>
                                                    <Button variant="primary" disabled={!isDirty} onClick={() => handleSubmit(u.id)}>Submit</Button>
                                                </div>
                                            </div>
                                         )}
                                    </div>

                                    <div className={styles.userActions}>
                                        <Button type="button" variant="secondary" className={styles.showMoreBtn} onClick={() => openEditor(u)}>
                                            {expandedUserId === u.id ? 'Close' : 'Edit User Info'}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}

                        {users.length === 0 && <div className={styles.empty}>No users found</div>}
                        {reachedEnd && users.length > 0 && <div className={styles.subtitle} style={{ textAlign: "center" }} >No more users</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}