import api from "../api/axios";

export const aiService = {
  // Chat with AI Wedding Planning Assistant
  async askWeddingAssistant({ message, history = [] }) {
    const response = await api.post("/ai/wedding-assistant", {
      message,
      history,
    });
    return response.data;
  },

  // Get AI Budget Advisor Report & Financial Analysis
  async getBudgetAdvisorReport() {
    const response = await api.post("/ai/budget-advisor", {});
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
    return "An error occurred with the AI assistant. Please try again.";
  },
};

export default aiService;

