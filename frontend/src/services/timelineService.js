import api from "../api/axios";

export const timelineService = {
  // Fetch timeline events with optional filters (category, status, eventDate, search)
  async getTimelineEvents(params = {}) {
    const response = await api.get("/timelines", { params });
    return response.data;
  },

  // Fetch a single timeline event by ID
  async getTimelineEventById(id) {
    const response = await api.get(`/timelines/${id}`);
    return response.data;
  },

  // Create a new timeline event
  async createTimelineEvent(eventData) {
    const response = await api.post("/timelines", eventData);
    return response.data;
  },

  // Update an existing timeline event
  async updateTimelineEvent(id, eventData) {
    const response = await api.put(`/timelines/${id}`, eventData);
    return response.data;
  },

  // Delete a timeline event
  async deleteTimelineEvent(id) {
    const response = await api.delete(`/timelines/${id}`);
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
    return "An error occurred with timeline management. Please try again.";
  },
};

export default timelineService;
