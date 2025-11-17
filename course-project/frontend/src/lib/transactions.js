import { api } from './api';

export const listTransactions = () => api('/transactions');
export const createTransaction = (data) => api('/transactions', { method: 'POST', body: data });
export const redeem = (data) => api('/transactions/redeem', { method: 'POST', body: data });
