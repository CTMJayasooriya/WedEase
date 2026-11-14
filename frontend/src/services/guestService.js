import api from "../api/axios";

export const guestService = {
  // Fetch user guests with statistics & optional query filters (guestCategory, rsvpStatus, invitationStatus, search)
  async getGuests(params = {}) {
    const response = await api.get("/guests", { params });
    return response.data;
  },

  // Fetch guest statistics
  async getGuestStatistics() {
    const response = await api.get("/guests/statistics");
    return response.data;
  },

  // Fetch a single guest by ID
  async getGuestById(id) {
    const response = await api.get(`/guests/${id}`);
    return response.data;
  },

  // Create a new guest
  async createGuest(guestData) {
    const response = await api.post("/guests", guestData);
    return response.data;
  },

  // Update an existing guest (including RSVP, invitation status, attendees)
  async updateGuest(id, guestData) {
    const response = await api.put(`/guests/${id}`, guestData);
    return response.data;
  },

  // Delete a guest
  async deleteGuest(id) {
    const response = await api.delete(`/guests/${id}`);
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
    return "An error occurred with guest management. Please try again.";
  },
};

export default guestService;

