import api from "../api/axios";

export const weddingService = {
  // Retrieve the logged-in user's wedding details
  async getMyWedding() {
    try {
      const response = await api.get("/weddings/my-wedding");
      return response.data;
    } catch (error) {
      // 404 indicates user has not created a wedding profile yet
      if (error.response?.status === 404) {
        return { success: false, wedding: null };
      }
      throw error;
    }
  },

  // Create a new wedding profile
  async createWedding(weddingData) {
    const response = await api.post("/weddings", weddingData);
    return response.data;
  },

  // Update or upsert the wedding profile
  async updateMyWedding(weddingData) {
    const response = await api.put("/weddings/my-wedding", weddingData);
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
    return "Failed to save wedding details. Please try again.";
  },
};

export default weddingService;
