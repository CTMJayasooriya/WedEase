import api from "../api/axios";

export const bookingService = {
  // Fetch user bookings with statistics & optional query filters (vendorCategory, bookingStatus, search)
  async getBookings(params = {}) {
    const response = await api.get("/bookings", { params });
    return response.data;
  },

  // Fetch a single booking with its payment records
  async getBookingById(id) {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  // Create a new vendor booking (with optional advance payment)
  async createBooking(bookingData) {
    const response = await api.post("/bookings", bookingData);
    return response.data;
  },

  // Update an existing vendor booking
  async updateBooking(id, bookingData) {
    const response = await api.put(`/bookings/${id}`, bookingData);
    return response.data;
  },

  // Delete a vendor booking (cascades linked payments)
  async deleteBooking(id) {
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
  },

  // Record a payment against a booking (with overpayment validation)
  async recordPayment(paymentData) {
    const response = await api.post("/payments", paymentData);
    return response.data;
  },

  // Fetch full user payment history
  async getPaymentHistory() {
    const response = await api.get("/payments");
    return response.data;
  },

  // Fetch payments for a specific booking
  async getPaymentsByBooking(bookingId) {
    const response = await api.get(`/payments/booking/${bookingId}`);
    return response.data;
  },

  // Delete a payment and restore booking balance
  async deletePayment(id) {
    const response = await api.delete(`/payments/${id}`);
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
    return "An error occurred with vendor bookings. Please try again.";
  },
};

export default bookingService;
