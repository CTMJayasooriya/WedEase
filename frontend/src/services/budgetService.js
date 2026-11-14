import api from "../api/axios";

export const budgetService = {
  // Fetch user expenses with summary calculations & optional query filters
  async getExpenses(params = {}) {
    const response = await api.get("/expenses", { params });
    return response.data;
  },

  // Fetch a single expense by ID
  async getExpenseById(id) {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  // Create a new expense item
  async createExpense(expenseData) {
    const response = await api.post("/expenses", expenseData);
    return response.data;
  },

  // Update an existing expense item
  async updateExpense(id, expenseData) {
    const response = await api.put(`/expenses/${id}`, expenseData);
    return response.data;
  },

  // Delete an expense
  async deleteExpense(id) {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  // Helper to extract clean error message
  getErrorMessage(error) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return "An error occurred with budget management. Please try again.";
  },
};

export default budgetService;
