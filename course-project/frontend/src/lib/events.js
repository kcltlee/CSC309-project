import { api } from './api';

export const listEvents = () => api('/events');
export const getEvent = (id) => api(`/events/${id}`);
export const createEvent = (data) => api('/events', { method: 'POST', body: data });
export const updateEvent = (id, data) => api(`/events/${id}`, { method: 'PUT', body: data });
