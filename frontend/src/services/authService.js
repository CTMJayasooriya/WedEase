import api from "../api/axios";

export const authService = {
  // Register a new user
  async register(name, email, password) {
    const response = await api.post("/auth/register", {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
    return response.data;
  },

  // Login existing user
  async login(email, password) {
    const response = await api.post("/auth/login", {
      email: email.trim().toLowerCase(),
      password,
    });
    return response.data;
  },

  // Store token and user in localStorage
  saveAuth(token, user) {
    if (token) {
      localStorage.setItem("wedease_token", token);
    }
    if (user) {
      localStorage.setItem("wedease_user", JSON.stringify(user));
    }
  },

  // Retrieve stored token
  getToken() {
    return localStorage.getItem("wedease_token");
  },

  // Retrieve stored user object
  getUser() {
    const raw = localStorage.getItem("wedease_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem("wedease_user");
      return null;
    }
  },

  // Clear stored auth credentials
  clearAuth() {
    localStorage.removeItem("wedease_token");
    localStorage.removeItem("wedease_user");
  },

  // Check if currently authenticated
  isAuthenticated() {
    return Boolean(localStorage.getItem("wedease_token"));
  },

  // Helper to extract clean error message from API response
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
    return "A network or server error occurred. Please try again.";
  },
};

export default authService;

