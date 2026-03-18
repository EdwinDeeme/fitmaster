import { api } from '@/lib/api';
import { Payment, Expense, FinanceSummary } from '@/types/gym';

export const financesService = {
  // Payments
  getPayments: async (filters?: { startDate?: string; endDate?: string; clientId?: string }): Promise<Payment[]> => {
    const { data } = await api.get('/finances/payments', { params: filters });
    return data;
  },
  getPayment: async (id: string): Promise<Payment> => {
    const { data } = await api.get(`/finances/payments/${id}`);
    return data;
  },
  createPayment: async (dto: any): Promise<Payment> => {
    const { data } = await api.post('/finances/payments', dto);
    return data;
  },
  // Expenses
  getExpenses: async (filters?: { startDate?: string; endDate?: string }): Promise<Expense[]> => {
    const { data } = await api.get('/finances/expenses', { params: filters });
    return data;
  },
  createExpense: async (dto: any): Promise<Expense> => {
    const { data } = await api.post('/finances/expenses', dto);
    return data;
  },
  deleteExpense: async (id: string): Promise<void> => {
    await api.delete(`/finances/expenses/${id}`);
  },
  // Summary
  getSummary: async (month?: number, year?: number): Promise<FinanceSummary> => {
    const { data } = await api.get('/finances/summary', { params: { month, year } });
    return data;
  },
};
