import { api } from './api';

export const login = (email, password) => api('/auth/login', { method: 'POST', body: { email, password } });
export const me = () => api('/users/me');
export const logout = () => api('/auth/logout', { method: 'POST' });
