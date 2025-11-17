import { api } from './api';

export const listPromotions = () => api('/promotions');
export const createPromotion = (data) => api('/promotions', { method: 'POST', body: data });
