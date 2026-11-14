import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import taskService from "../services/taskService";
import {
  Heart,
  ArrowLeft,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Calendar,
  AlertCircle,
  CheckCircle2,
  LogOut,
  X,
  Filter,
  Tag,
  Flame,
} from "lucide-react";

const CATEGORIES = [
  "General",
  "Venue",
  "Catering",
  "Attire",
  "Photography",
  "Invitations",
  "Music & Entertainment",
  "Flowers & Decor",
  "Ceremony & Reception",
];

const PRIORITIES = ["Low", "Medium", "High"];
const STATUSES = ["Pending", "In Progress", "Completed"];

export default function Checklist() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completionPercentage: 0,
  });

  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All"); // All, Pending, In Progress, Completed, High Priority
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    category: "General",
    dueDate: "",
    priority: "Medium",
    status: "Pending",
  });

  // Fetch tasks
  const loadTasks = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await taskService.getTasks();
      if (data?.tasks) setTasks(data.tasks);
      if (data?.stats) setStats(data.stats);
    } catch (err) {
      setErrorMessage(taskService.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitialTasks = async () => {
      setLoading(true);
      try {
        const data = await taskService.getTasks();
        if (isMounted) {
          if (data?.tasks) setTasks(data.tasks);
          if (data?.stats) setStats(data.stats);
        }
      } catch (err) {
        if (isMounted) setErrorMessage(taskService.getErrorMessage(err));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitialTasks();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter tasks based on activeFilter selection
  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "High Priority") return task.priority === "High";
    return task.status === activeFilter;
  });

  // Open modal for new task
  const handleOpenAddModal = () => {
    setEditingTaskId(null);
    setTaskForm({
      title: "",
      description: "",
      category: "General",
      dueDate: "",
      priority: "Medium",
      status: "Pending",
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  // Open modal for editing existing task
  const handleOpenEditModal = (task) => {
    setEditingTaskId(task._id);
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      category: task.category || "General",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      priority: task.priority || "Medium",
      status: task.status || "Pending",
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  // Handle Save (Add or Update)
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      setErrorMessage("Please enter a task title.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        category: taskForm.category,
        dueDate: taskForm.dueDate || null,
        priority: taskForm.priority,
        status: taskForm.status,
      };

      if (editingTaskId) {
        await taskService.updateTask(editingTaskId, payload);
        setSuccessMessage("Task updated successfully!");
      } else {
        await taskService.createTask(payload);
        setSuccessMessage("New task added to your checklist!");
      }

      setIsModalOpen(false);
      await loadTasks();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setErrorMessage(taskService.getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Quick toggle between Completed and Pending
  const handleToggleComplete = async (task) => {
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t))
      );

      await taskService.updateTask(task._id, { status: newStatus });
      await loadTasks();
    } catch (err) {
      setErrorMessage(taskService.getErrorMessage(err));
      await loadTasks();
    }
  };

  // Delete task
  const handleDeleteTask = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await taskService.deleteTask(id);
      setSuccessMessage("Task deleted successfully.");
      await loadTasks();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setErrorMessage(taskService.getErrorMessage(err));
    }
  };

  // Generate Default Wedding Checklist
  const handleGenerateDefaultChecklist = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await taskService.generateDefaultChecklist();
      setSuccessMessage(res.message || "Default checklist generated successfully!");
      await loadTasks();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setErrorMessage(taskService.getErrorMessage(err));
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col">
      {/* Top Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-rose-100/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center border border-rose-200 shadow-xs">
                <Heart className="w-5 h-5 text-rose-600 fill-rose-500/20" />
              </div>
              <span className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
                Wed<span className="text-rose-600">Ease</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                Checklist Module
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-all"
            >
              <span>Dashboard</span>
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold mb-2">
              <CheckSquare className="w-3.5 h-3.5 text-rose-600" />
              <span>Wedding Task Management</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
              Wedding Checklist & Milestones
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Track your essential wedding preparations from start to finish. Filter tasks,
              assign priorities, and keep your celebration on schedule.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleGenerateDefaultChecklist}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer shadow-2xs"
              title="Add 10 recommended wedding planning milestones"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Generate Default Checklist</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Task</span>
            </button>
          </div>
        </div>

        {/* Global Alerts */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm animate-fade-in shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-800 text-sm animate-fade-in shadow-2xs">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Task Progress & Statistics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Total Tasks
            </span>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              {stats.totalTasks}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">In your master checklist</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
              Completed
            </span>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-600">
              {stats.completedTasks}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Finished milestones</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block mb-1">
              Pending / In Progress
            </span>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-600">
              {stats.pendingTasks + stats.inProgressTasks}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Awaiting completion</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs">
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider block mb-1">
              Completion Rate
            </span>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-600">
              {stats.completionPercentage}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-500 to-purple-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>
          {["All", "Pending", "In Progress", "Completed", "High Priority"].map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {filter}
              </button>
            );
          })}
          <span className="text-xs text-slate-400 ml-auto hidden sm:block">
            Showing {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {/* Task Cards List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 border border-rose-100 text-center shadow-xs">
            <div className="inline-block w-8 h-8 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-600 font-serif">
              Loading wedding checklist...
            </p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-rose-100 text-center shadow-xs max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-serif font-bold text-slate-900 mb-1">
              No tasks match this view
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              {tasks.length === 0
                ? "Your wedding checklist is currently empty. Add your first task or generate the 10 recommended wedding planning milestones."
                : `There are currently no tasks with filter "${activeFilter}".`}
            </p>
            {tasks.length === 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleGenerateDefaultChecklist}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Generate Default Checklist</span>
                </button>
                <button
                  onClick={handleOpenAddModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Custom Task</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveFilter("All")}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Reset filter to view all tasks
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isCompleted = task.status === "Completed";
              const isInProgress = task.status === "In Progress";

              return (
                <div
                  key={task._id}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-xs hover:shadow-md ${
                    isCompleted
                      ? "border-emerald-200/80 bg-emerald-50/20"
                      : "border-slate-200/80 hover:border-rose-200"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Checkbox Complete Toggle */}
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={`mt-0.5 rounded-lg transition-transform hover:scale-110 cursor-pointer ${
                        isCompleted ? "text-emerald-600" : "text-slate-300 hover:text-rose-500"
                      }`}
                      title={isCompleted ? "Mark as Pending" : "Mark as Completed"}
                    >
                      {isCompleted ? (
                        <CheckSquare className="w-6 h-6 fill-emerald-100" />
                      ) : (
                        <Square className="w-6 h-6" />
                      )}
                    </button>

                    {/* Task Title & Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3
                          className={`text-sm sm:text-base font-semibold text-slate-900 ${
                            isCompleted ? "line-through text-slate-400 font-normal" : ""
                          }`}
                        >
                          {task.title}
                        </h3>

                        {/* Priority Badge */}
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            task.priority === "High"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : task.priority === "Medium"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {task.priority === "High" && <Flame className="w-3 h-3 text-rose-600" />}
                          {task.priority} Priority
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isInProgress
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>

                      {/* Description */}
                      {task.description && (
                        <p
                          className={`text-xs text-slate-600 mb-2.5 leading-relaxed ${
                            isCompleted ? "text-slate-400" : ""
                          }`}
                        >
                          {task.description}
                        </p>
                      )}

                      {/* Meta Tags: Category & Due Date */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-100">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{task.category || "General"}</span>
                        </span>

                        {task.dueDate && (
                          <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-100">
                            <Calendar className="w-3 h-3 text-rose-500" />
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons: Edit & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(task)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Task"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id, task.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Task Creation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-rose-100 overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/40">
              <h2 className="text-base font-serif font-bold text-slate-900">
                {editingTaskId ? "Edit Task" : "Add New Wedding Task"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule hair & makeup trial"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-rose-400 focus:ring-3 focus:ring-rose-100 transition-all"
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Add details, notes, or specific requirements..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-rose-400 focus:ring-3 focus:ring-rose-100 transition-all"
                />
              </div>

              {/* Category & Due Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-rose-400"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Priority & Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-rose-400"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p} Priority
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-rose-400"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? "Saving..." : editingTaskId ? "Update Task" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
