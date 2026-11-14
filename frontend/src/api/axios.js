import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request interceptor: Attach JWT token to outgoing requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("wedease_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Uniform error handling and token expiration cleanup
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server responds with 401 Unauthorized for an authenticated route, clear stale token
    if (error.response?.status === 401 && localStorage.getItem("wedease_token")) {
      // Don't auto-clear if this was a login attempt failure
      if (!error.config?.url?.includes("/auth/login")) {
        localStorage.removeItem("wedease_token");
        localStorage.removeItem("wedease_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
