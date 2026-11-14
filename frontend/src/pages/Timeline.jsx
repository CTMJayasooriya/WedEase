import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import timelineService from "../services/timelineService";
import weddingService from "../services/weddingService";
import {
  ArrowLeft,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
  LogOut,
  X,
  MapPin,
  User,
  Printer,
  Sparkles,
  Flame,
  Check,
  Play,
  Ban,
  LayoutList,
  GitCommit,
} from "lucide-react";

const TIMELINE_CATEGORIES = [
  "Preparation",
  "Ceremony",
  "Photography",
  "Reception",
  "Food and Catering",
  "Entertainment",
  "Transportation",
  "Other",
];

const TIMELINE_STATUSES = ["Upcoming", "In Progress", "Completed", "Cancelled"];
const TIMELINE_PRIORITIES = ["Low", "Medium", "High"];

// Helper to format date
const formatEventDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Helper to format time (e.g. 24h "14:30" to "2:30 PM")
const formatDisplayTime = (timeStr) => {
  if (!timeStr) return "";
  const parts = timeStr.trim().split(":");
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].slice(0, 2);
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    return `${hours}:${minutes} ${ampm}`;
  }
  return timeStr;
};

export default function Timeline() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [wedding, setWedding] = useState(null);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    inProgressEvents: 0,
    completedEvents: 0,
    cancelledEvents: 0,
    nextUpcomingEvent: null,
    weddingDate: null,
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // View state: "timeline" or "table"
  const [viewMode, setViewMode] = useState("timeline");
  // Filter only wedding day
  const [weddingDayOnly, setWeddingDayOnly] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    eventDate: new Date().toISOString().split("T")[0],
    startTime: "10:00",
    endTime: "11:30",
    location: "",
    category: "Ceremony",
    responsiblePerson: "",
    priority: "Medium",
    status: "Upcoming",
    notes: "",
  });

  // Load wedding profile once
  useEffect(() => {
    const fetchWedding = async () => {
      try {
        const data = await weddingService.getMyWedding();
        if (data?.wedding) {
          setWedding(data.wedding);
        }
      } catch (err) {
        console.error("Failed to fetch wedding profile:", err);
      }
    };
    fetchWedding();
  }, []);

  // Fetch timeline events
  const loadEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter !== "All") params.category = categoryFilter;
      if (statusFilter !== "All") params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (weddingDayOnly && wedding?.weddingDate) {
        params.eventDate = wedding.weddingDate.split("T")[0];
      }

      const data = await timelineService.getTimelineEvents(params);
      if (data) {
        setEvents(data.events || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Load Timeline Error:", err);
      setErrorMessage(timelineService.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, statusFilter, weddingDayOnly]);

  // Handle Search on Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadEvents();
  };

  // Open modal for creating a new event
  const handleOpenAddModal = () => {
    setEditingEventId(null);
    const defaultDate = wedding?.weddingDate
      ? wedding.weddingDate.split("T")[0]
      : new Date().toISOString().split("T")[0];

    setEventForm({
      title: "",
      description: "",
      eventDate: defaultDate,
      startTime: "09:00",
      endTime: "10:30",
      location: wedding?.venue || "",
      category: "Ceremony",
      responsiblePerson: "",
      priority: "Medium",
      status: "Upcoming",
      notes: "",
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  // Open modal for editing an existing event
  const handleOpenEditModal = (ev) => {
    setEditingEventId(ev._id);
    setEventForm({
      title: ev.title || "",
      description: ev.description || "",
      eventDate: ev.eventDate ? ev.eventDate.split("T")[0] : "",
      startTime: ev.startTime || "",
      endTime: ev.endTime || "",
      location: ev.location || "",
      category: ev.category || "Ceremony",
      responsiblePerson: ev.responsiblePerson || "",
      priority: ev.priority || "Medium",
      status: ev.status || "Upcoming",
      notes: ev.notes || "",
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  // Handle Save Event (Create or Update)
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!eventForm.title.trim()) {
      setErrorMessage("Event title is required.");
      setSubmitting(false);
      return;
    }

    if (!eventForm.startTime.trim()) {
      setErrorMessage("Start time is required.");
      setSubmitting(false);
      return;
    }

    // Validate that End Time is not earlier than Start Time
    if (eventForm.endTime && eventForm.startTime) {
      if (eventForm.endTime < eventForm.startTime) {
        setErrorMessage("End time cannot be earlier than start time.");
        setSubmitting(false);
        return;
      }
    }

    try {
      const payload = {
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        eventDate: eventForm.eventDate,
        startTime: eventForm.startTime.trim(),
        endTime: eventForm.endTime ? eventForm.endTime.trim() : "",
        location: eventForm.location.trim(),
        category: eventForm.category,
        responsiblePerson: eventForm.responsiblePerson.trim(),
        priority: eventForm.priority,
        status: eventForm.status,
        notes: eventForm.notes.trim(),
      };

      if (editingEventId) {
        await timelineService.updateTimelineEvent(editingEventId, payload);
        setSuccessMessage("Timeline event updated successfully!");
      } else {
        await timelineService.createTimelineEvent(payload);
        setSuccessMessage("Timeline event scheduled successfully!");
      }

      setIsModalOpen(false);
      await loadEvents();
    } catch (err) {
      setErrorMessage(timelineService.getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Event
  const handleDeleteEvent = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the event "${title}" from the timeline?`)) {
      return;
    }

    try {
      await timelineService.deleteTimelineEvent(id);
      setSuccessMessage(`Event "${title}" deleted successfully.`);
      await loadEvents();
    } catch (err) {
      setErrorMessage(timelineService.getErrorMessage(err));
    }
  };

  // Quick inline update for status
  const handleQuickStatusChange = async (ev, newStatus) => {
    if (ev.status === newStatus) return;
    try {
      setEvents((prev) =>
        prev.map((item) => (item._id === ev._id ? { ...item, status: newStatus } : item))
      );
      await timelineService.updateTimelineEvent(ev._id, { status: newStatus });
      setSuccessMessage(`Updated status for "${ev.title}" to ${newStatus}.`);
      await loadEvents();
    } catch (err) {
      setErrorMessage(timelineService.getErrorMessage(err));
      await loadEvents();
    }
  };

  // Print schedule
  const handlePrintSchedule = () => {
    window.print();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-rose-100 sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-serif font-bold text-slate-900 leading-tight">
                  Wedding Day Timeline
                </h1>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Chronological Run-Sheet &middot; Ceremony &middot; Reception Schedule
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handlePrintSchedule}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all cursor-pointer"
              title="Print Wedding Schedule or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Printable Document Header (Visible only on print) */}
        <div className="hidden print:block text-center pb-6 border-b border-slate-300">
          <h1 className="text-3xl font-serif font-bold text-slate-900">
            {wedding ? `${wedding.brideName} & ${wedding.groomName}'s Wedding` : "WedEase Wedding Day"}
          </h1>
          <p className="text-sm font-semibold text-slate-700 mt-1">
            Official Day-of Schedule &middot; {wedding ? formatEventDate(wedding.weddingDate) : ""}
          </p>
          {wedding?.venue && (
            <p className="text-xs text-slate-500 mt-0.5">Venue: {wedding.venue}</p>
          )}
        </div>

        {/* Toast Alerts */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between animate-fadeIn print:hidden">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage("")} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between animate-fadeIn print:hidden">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage("")} className="text-rose-600 hover:text-rose-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Statistics Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          {/* Card 1: Total Events */}
          <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                Schedule Milestones
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Total Events
              </p>
              <div className="text-3xl font-serif font-bold text-slate-900">
                {stats.totalEvents}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {stats.completedEvents} completed &bull; {stats.inProgressEvents} in progress
              </p>
            </div>
          </div>

          {/* Card 2: Upcoming Events */}
          <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Upcoming
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Scheduled Ahead
              </p>
              <div className="text-3xl font-serif font-bold text-amber-600">
                {stats.upcomingEvents}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Pending execution on schedule
              </p>
            </div>
          </div>

          {/* Card 3: Next Event Start Time */}
          <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Play className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                Next Up
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Next Milestone
              </p>
              {stats.nextUpcomingEvent ? (
                <>
                  <div className="text-xl font-serif font-bold text-slate-900 truncate">
                    {stats.nextUpcomingEvent.title}
                  </div>
                  <div className="text-xs font-semibold text-blue-600 mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {formatDisplayTime(stats.nextUpcomingEvent.startTime)} &middot;{" "}
                      {formatEventDate(stats.nextUpcomingEvent.eventDate)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-400 py-1">No upcoming events scheduled</div>
              )}
            </div>
          </div>

          {/* Card 4: Completed Progress */}
          <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {stats.totalEvents > 0
                  ? `${Math.round((stats.completedEvents / stats.totalEvents) * 100)}% Complete`
                  : "0%"}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Completed Milestones
              </p>
              <div className="text-3xl font-serif font-bold text-emerald-600">
                {stats.completedEvents}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      stats.totalEvents > 0
                        ? Math.min(100, Math.round((stats.completedEvents / stats.totalEvents) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Filter & Controls Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3 print:hidden">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event title, venue location, coordinator, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-20 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-500 shrink-0 hidden sm:inline">
                Category:
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-2 px-3 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
              >
                <option value="All">All Categories</option>
                {TIMELINE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-500 shrink-0 hidden sm:inline">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
              >
                <option value="All">All Statuses</option>
                {TIMELINE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sub-bar: Schedule Scope Toggle & Layout Switch */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
            {/* Wedding Day Schedule Scope Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeddingDayOnly(false)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  !weddingDayOnly
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Events ({stats.totalEvents})
              </button>
              <button
                onClick={() => setWeddingDayOnly(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  weddingDayOnly
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Wedding Day Schedule Only</span>
              </button>
            </div>

            {/* Layout switch: Vertical Timeline vs Table */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
              <button
                onClick={() => setViewMode("timeline")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === "timeline"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <GitCommit className="w-3.5 h-3.5 text-rose-600" />
                <span>Visual Timeline</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <LayoutList className="w-3.5 h-3.5 text-rose-600" />
                <span>Table View</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Timeline Events Display */}
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200/80">
            Loading wedding timeline...
          </div>
        ) : events.length === 0 ? (
          <div className="p-16 text-center max-w-md mx-auto space-y-3 bg-white rounded-2xl border border-slate-200/80">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-slate-900 text-base">
              No Timeline Events Scheduled
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {weddingDayOnly
                ? "No events found scheduled on your official wedding day. Add your ceremony, photography sessions, and reception schedule."
                : "Schedule each event of your wedding day to give coordinators, photographers, and bridal party members a seamless run sheet."}
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule First Event</span>
            </button>
          </div>
        ) : viewMode === "timeline" ? (
          /* VERTICAL CHRONOLOGICAL TIMELINE VIEW */
          <div className="relative pl-6 sm:pl-10 space-y-8 before:content-[''] before:absolute before:top-3 before:bottom-3 before:left-3 sm:before:left-5 before:w-0.5 before:bg-rose-200">
            {events.map((ev) => {
              const isCompleted = ev.status === "Completed";
              const isInProgress = ev.status === "In Progress";
              const isCancelled = ev.status === "Cancelled";

              return (
                <div key={ev._id} className="relative group">
                  {/* Timeline Node Icon Indicator */}
                  <div
                    className={`absolute -left-6 sm:-left-10 top-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs transition-all ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isInProgress
                        ? "bg-blue-600 text-white animate-pulse"
                        : isCancelled
                        ? "bg-slate-300 text-slate-600"
                        : "bg-rose-600 text-white"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : isInProgress ? (
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
                    ) : isCancelled ? (
                      <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </div>

                  {/* Event Card */}
                  <div
                    className={`bg-white rounded-2xl p-5 border transition-all ${
                      isInProgress
                        ? "border-blue-300 shadow-md ring-2 ring-blue-500/10"
                        : isCompleted
                        ? "border-emerald-200/80 bg-emerald-50/20"
                        : isCancelled
                        ? "border-slate-200 bg-slate-50/60 opacity-60"
                        : "border-slate-200/80 shadow-xs hover:border-rose-200 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        {/* Time & Badges Row */}
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="font-mono font-bold text-xs sm:text-sm text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/80">
                            {formatDisplayTime(ev.startTime)}
                            {ev.endTime ? ` - ${formatDisplayTime(ev.endTime)}` : ""}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {formatEventDate(ev.eventDate)}
                          </span>
                          <span className="text-[11px] font-medium text-slate-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                            {ev.category}
                          </span>
                          {ev.priority === "High" && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                              <Flame className="w-3 h-3 text-rose-600" /> High Priority
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3
                          className={`text-base sm:text-lg font-serif font-bold text-slate-900 ${
                            isCancelled ? "line-through text-slate-400" : ""
                          }`}
                        >
                          {ev.title}
                        </h3>

                        {/* Description */}
                        {ev.description && (
                          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                            {ev.description}
                          </p>
                        )}

                        {/* Location & Responsible Person Details */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-500">
                          {ev.location && (
                            <div className="flex items-center gap-1 text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" />
                              <span className="font-medium">{ev.location}</span>
                            </div>
                          )}
                          {ev.responsiblePerson && (
                            <div className="flex items-center gap-1 text-slate-700">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>Lead: <strong className="font-semibold">{ev.responsiblePerson}</strong></span>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {ev.notes && (
                          <div className="mt-2.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                            Notes: {ev.notes}
                          </div>
                        )}
                      </div>

                      {/* Status Selector & Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 print:hidden">
                        <select
                          value={ev.status}
                          onChange={(e) => handleQuickStatusChange(ev, e.target.value)}
                          className={`text-xs font-semibold py-1 px-2.5 rounded-xl border transition-all cursor-pointer ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isInProgress
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : isCancelled
                              ? "bg-slate-100 text-slate-500 border-slate-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {TIMELINE_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(ev)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Edit Event"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev._id, ev.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* SCHEDULE TABLE VIEW */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">Time</th>
                    <th className="py-3 px-4">Event Details</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Responsible</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 sm:px-6 text-right print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {events.map((ev) => (
                    <tr key={ev._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-mono font-bold text-rose-700 text-xs sm:text-sm whitespace-nowrap">
                        {formatDisplayTime(ev.startTime)}
                        {ev.endTime ? ` - ${formatDisplayTime(ev.endTime)}` : ""}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900">{ev.title}</div>
                        <span className="inline-block text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 mt-1">
                          {ev.category}
                        </span>
                        {ev.description && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {ev.description}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs whitespace-nowrap">
                        {formatEventDate(ev.eventDate)}
                      </td>
                      <td className="py-4 px-4 text-xs">
                        {ev.location || <span className="text-slate-400 italic">-</span>}
                      </td>
                      <td className="py-4 px-4 text-xs">
                        {ev.responsiblePerson || <span className="text-slate-400 italic">-</span>}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            ev.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : ev.status === "In Progress"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : ev.status === "Cancelled"
                              ? "bg-slate-100 text-slate-500 border-slate-200 line-through"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {ev.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right space-x-1 print:hidden">
                        <button
                          onClick={() => handleOpenEditModal(ev)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(ev._id, ev.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ADD / EDIT TIMELINE EVENT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto print:hidden">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-rose-100 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  {editingEventId ? "Edit Timeline Event" : "Schedule Timeline Event"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              {/* Event Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bridal Party Makeup & Hair Styling"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>

              {/* Event Date & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  >
                    {TIMELINE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start Time & End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 font-mono"
                  />
                </div>
              </div>

              {/* Location & Responsible Person */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location / Room
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bridal Suite, Grand Ballroom"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Responsible Person / Lead
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maid of Honor, Wedding Coordinator"
                    value={eventForm.responsiblePerson}
                    onChange={(e) => setEventForm({ ...eventForm, responsiblePerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={eventForm.priority}
                    onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  >
                    {TIMELINE_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p} Priority
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Execution Status
                  </label>
                  <select
                    value={eventForm.status}
                    onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  >
                    {TIMELINE_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Activity Details
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Professional makeup artist arrives; hair and touch-ups for the bride and bridesmaids."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Notes &amp; Coordinator Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ensure bouquets are unwrapped and water stems dried before photography."
                  value={eventForm.notes}
                  onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting ? "Saving..." : editingEventId ? "Update Event" : "Schedule Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
