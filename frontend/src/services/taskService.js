import api from "../api/axios";

export const taskService = {
  // Fetch user's tasks with optional filter params (status, priority, category)
  async getTasks(params = {}) {
    const response = await api.get("/tasks", { params });
    return response.data;
  },

  // Fetch a single task by ID
  async getTaskById(id) {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create a new task
  async createTask(taskData) {
    const response = await api.post("/tasks", taskData);
    return response.data;
  },

  // Update a task (e.g., status, priority, title)
  async updateTask(id, taskData) {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  // Delete a task
  async deleteTask(id) {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  // Generate the default 10-milestone wedding checklist
  async generateDefaultChecklist() {
    const response = await api.post("/tasks/default-checklist");
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
    return "An error occurred with task management. Please try again.";
  },
};

export default taskService;

