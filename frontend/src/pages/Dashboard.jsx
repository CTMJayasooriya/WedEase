import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";
import weddingService from "../services/weddingService";
import taskService from "../services/taskService";
import budgetService from "../services/budgetService";
import bookingService from "../services/bookingService";
import guestService from "../services/guestService";
import timelineService from "../services/timelineService";
import {
  Heart,
  LogOut,
  Sparkles,
  Calendar,
  CheckSquare,
  Square,
  Users,
  DollarSign,
  Clock,
  ShieldCheck,
  User as UserIcon,
  Mail,
  Activity,
  Menu,
  X,
  LayoutDashboard,
  Store,
  Settings,
  Edit3,
  PlusCircle,
  ArrowRight,
  Flame,
  MapPin,
} from "lucide-react";

// Helper to calculate time remaining until wedding
function getTimeRemaining(weddingDate) {
  if (!weddingDate) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, isToday: false, hasDate: false };
  }
  const targetTime = new Date(weddingDate).getTime();
  const now = new Date().getTime();
  const difference = targetTime - now;

  if (difference <= 0) {
    const isSameDay = new Date().toDateString() === new Date(weddingDate).toDateString();
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: !isSameDay,
      isToday: isSameDay,
      hasDate: true,
    };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
    isPast: false,
    isToday: false,
    hasDate: true,
  };
}

// Helper to format time (e.g. "14:30" to "2:30 PM")
const formatDisplayTime = (timeStr) => {
  if (!timeStr) return "";
  const parts = timeStr.trim().split(":");
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].slice(0, 2);
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  return timeStr;
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Sidebar toggle state for mobile viewports
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Wedding details state from MongoDB Atlas
  const [wedding, setWedding] = useState(null);
  const [loadingWedding, setLoadingWedding] = useState(true);

  // Real task statistics state from MongoDB Atlas
  const [taskStats, setTaskStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completionPercentage: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Real budget summary state from MongoDB Atlas
  const [budgetSummary, setBudgetSummary] = useState({
    weddingBudget: 0,
    estimatedTotal: 0,
    actualTotal: 0,
    remainingBudget: 0,
    budgetUsagePercentage: 0,
    isOverBudget: false,
    overBudgetAmount: 0,
  });

  // Real vendor booking statistics state from MongoDB Atlas
  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalVendorCosts: 0,
    totalPaid: 0,
    outstandingPayments: 0,
  });

  // Real guest statistics state from MongoDB Atlas
  const [guestStats, setGuestStats] = useState({
    totalGuests: 0,
    acceptedInvitations: 0,
    declinedInvitations: 0,
    pendingResponses: 0,
    invitationsSent: 0,
    invitationsNotSent: 0,
    totalExpectedAttendees: 0,
    potentialTotalAttendees: 0,
    weddingTargetGuestCount: 0,
  });

  // Real timeline statistics & events state from MongoDB Atlas
  const [timelineStats, setTimelineStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    inProgressEvents: 0,
    completedEvents: 0,
    cancelledEvents: 0,
    nextUpcomingEvent: null,
  });
  const [recentTimelineEvents, setRecentTimelineEvents] = useState([]);

  // Live Backend health verification
  const [backendHealth, setBackendHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  // Fetch wedding profile, task stats, budget summary, vendor bookings, guest stats, and timeline
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoadingWedding(true);
      setLoadingTasks(true);
      try {
        const [weddingData, tasksData, budgetData, bookingsData, guestsData, timelineData] =
          await Promise.allSettled([
            weddingService.getMyWedding(),
            taskService.getTasks(),
            budgetService.getExpenses(),
            bookingService.getBookings(),
            guestService.getGuests(),
            timelineService.getTimelineEvents(),
          ]);

        if (isMounted) {
          if (weddingData.status === "fulfilled" && weddingData.value?.wedding) {
            setWedding(weddingData.value.wedding);
          }
          if (tasksData.status === "fulfilled" && tasksData.value) {
            if (tasksData.value.stats) setTaskStats(tasksData.value.stats);
            if (tasksData.value.tasks) setRecentTasks(tasksData.value.tasks.slice(0, 4));
          }
          if (budgetData.status === "fulfilled" && budgetData.value?.summary) {
            setBudgetSummary(budgetData.value.summary);
          }
          if (bookingsData.status === "fulfilled" && bookingsData.value?.stats) {
            setBookingStats(bookingsData.value.stats);
          }
          if (guestsData.status === "fulfilled" && guestsData.value?.stats) {
            setGuestStats(guestsData.value.stats);
          }
          if (timelineData.status === "fulfilled" && timelineData.value?.stats) {
            setTimelineStats(timelineData.value.stats);
            if (timelineData.value.events) {
              setRecentTimelineEvents(timelineData.value.events.slice(0, 3));
            }
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        if (isMounted) {
          setLoadingWedding(false);
          setLoadingTasks(false);
        }
      }
    };

    const verifyBackend = async () => {
      setCheckingHealth(true);
      try {
        const res = await api.get("/health");
        if (isMounted) setBackendHealth({ online: true, data: res.data });
      } catch (err) {
        try {
          const rootRes = await api.get("/");
          if (isMounted) setBackendHealth({ online: true, data: rootRes.data });
        } catch {
          if (isMounted) setBackendHealth({ online: false, error: err.message });
        }
      } finally {
        if (isMounted) setCheckingHealth(false);
      }
    };

    loadData();
    verifyBackend();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update timer every second when wedding date is set
  const [, setTick] = useState(0);
  const countdown = getTimeRemaining(wedding?.weddingDate);

  useEffect(() => {
    if (!wedding?.weddingDate) return;
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [wedding?.weddingDate]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Quick toggle task completion right from dashboard
  const handleToggleTask = async (task) => {
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";
    try {
      setRecentTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t))
      );
      await taskService.updateTask(task._id, { status: newStatus });
      // Refresh stats
      const freshData = await taskService.getTasks();
      if (freshData?.stats) setTaskStats(freshData.stats);
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const navItems = [
    { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard, path: "/dashboard", isPlaceholder: false },
    { id: "profile", label: "Wedding Profile", icon: Heart, path: "/wedding-profile", isPlaceholder: false },
    { id: "checklist", label: "Checklist & Tasks", icon: CheckSquare, path: "/checklist", isPlaceholder: false },
    { id: "budget", label: "Budget Planner", icon: DollarSign, path: "/budget", isPlaceholder: false },
    { id: "vendors", label: "Vendor Directory", icon: Store, path: "/bookings", isPlaceholder: false },
    { id: "guests", label: "Guest List & RSVPs", icon: Users, path: "/guests", isPlaceholder: false },
    { id: "timeline", label: "Day-of Timeline", icon: Clock, path: "/timeline", isPlaceholder: false },
    { id: "settings", label: "Account Settings", icon: Settings, path: null, isPlaceholder: true },
  ];

  // Format date helper
  const formatWeddingDate = (dateString) => {
    if (!dateString) return "";
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-rose-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-rose-100/70 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center border border-rose-200 shadow-xs">
              <Heart className="w-5 h-5 text-rose-600 fill-rose-500/20" />
            </div>
            <div>
              <span className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
                Wed<span className="text-rose-600">Ease</span>
              </span>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                Wedding Planning Portal
              </p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return item.path ? (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-rose-50/90 text-rose-700 font-semibold border border-rose-200/80 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-rose-600" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
              </Link>
            ) : (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-rose-50/90 text-rose-700 font-semibold border border-rose-200/80 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-rose-600" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.isPlaceholder && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Phase 2
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Profile & Logout Bottom Card */}
        <div className="p-4 border-t border-rose-100 bg-rose-50/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {user?.name || "WedEase Couple"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user?.email || "user@example.com"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 transition-colors shadow-2xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-rose-100 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-serif font-bold text-slate-900 tracking-tight">
                Wedding Dashboard
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Overview &amp; Real-Time Planning Analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Backend Connection Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  checkingHealth
                    ? "bg-amber-400 animate-pulse"
                    : backendHealth?.online
                    ? "bg-emerald-500"
                    : "bg-slate-400"
                }`}
              />
              <span className="text-slate-600">
                {checkingHealth
                  ? "Pinging Backend..."
                  : backendHealth?.online
                  ? "MongoDB Atlas Online"
                  : "API Port 5000"}
              </span>
            </div>

            <Link
              to="/wedding-profile"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{wedding ? "Edit Profile" : "Set Up Profile"}</span>
            </Link>

            <Link
              to="/timeline"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all"
            >
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span>Timeline</span>
            </Link>

            <Link
              to="/guests"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Guests</span>
            </Link>

            <Link
              to="/bookings"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all"
            >
              <Store className="w-3.5 h-3.5 text-purple-600" />
              <span>Vendors</span>
            </Link>

            <Link
              to="/budget"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all"
            >
              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
              <span>Budget</span>
            </Link>

            <Link
              to="/checklist"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-2xs transition-all"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Checklist</span>
            </Link>

            {/* Quick Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8">
          {/* 1. Welcome Hero Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-rose-950/5">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold tracking-wider uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>
                  {wedding
                    ? "Official Wedding Details Configured"
                    : "Welcome to WedEase"}
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight mb-2">
                {wedding ? (
                  <span>
                    {wedding.brideName} &amp; {wedding.groomName}
                  </span>
                ) : (
                  <span>Welcome, {user?.name || "Lovely Couple"}!</span>
                )}
              </h2>
              <p className="text-rose-100 text-sm sm:text-base leading-relaxed">
                {wedding ? (
                  <span>
                    Scheduled for{" "}
                    <strong className="text-white font-semibold underline underline-offset-4 decoration-amber-300">
                      {formatWeddingDate(wedding.weddingDate)}
                    </strong>{" "}
                    at {wedding.venue}.
                  </span>
                ) : (
                  <span>
                    Your wedding planning portal is ready. Complete your Wedding Profile
                    to activate your real countdown, guest management, and budget metrics!
                  </span>
                )}
              </p>

              {!wedding && !loadingWedding && (
                <div className="mt-4">
                  <Link
                    to="/wedding-profile"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white text-rose-700 hover:bg-rose-50 shadow-sm transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Wedding Profile Now</span>
                  </Link>
                </div>
              )}
            </div>
            {/* Soft decorative background glows */}
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute right-20 top-0 -translate-y-12 w-48 h-48 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* 2. Key Values Grid: Countdown, Budget, Real Guests, Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {/* A. Live Real Countdown to Wedding Day */}
            <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                    {countdown.hasDate ? "Live Countdown" : "Setup Required"}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Wedding Countdown
                </h3>

                {countdown.hasDate ? (
                  countdown.isToday ? (
                    <div className="py-2 text-rose-600 font-serif font-bold text-xl animate-pulse">
                      💍 Today is the Big Day! 💍
                    </div>
                  ) : countdown.isPast ? (
                    <div className="py-2 text-slate-600 font-medium text-sm">
                      Happily Married! ✨
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-serif font-bold text-slate-900 mb-2">
                        {countdown.days}{" "}
                        <span className="text-base font-sans font-normal text-slate-500">Days</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
                        <div className="bg-rose-50/60 rounded-lg py-1 border border-rose-100">
                          <span className="block text-xs font-bold text-rose-700 font-mono">
                            {countdown.hours}
                          </span>
                          <span className="text-[9px] text-slate-400 uppercase">Hours</span>
                        </div>
                        <div className="bg-rose-50/60 rounded-lg py-1 border border-rose-100">
                          <span className="block text-xs font-bold text-rose-700 font-mono">
                            {countdown.minutes}
                          </span>
                          <span className="text-[9px] text-slate-400 uppercase">Mins</span>
                        </div>
                        <div className="bg-rose-50/60 rounded-lg py-1 border border-rose-100">
                          <span className="block text-xs font-bold text-rose-700 font-mono">
                            {countdown.seconds}
                          </span>
                          <span className="text-[9px] text-slate-400 uppercase">Secs</span>
                        </div>
                      </div>
                    </>
                  )
                ) : (
                  <div className="py-3 text-slate-500 text-xs">
                    <p className="mb-2">No wedding date set yet.</p>
                    <Link
                      to="/wedding-profile"
                      className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:underline"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Set Wedding Date
                    </Link>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{wedding ? formatWeddingDate(wedding.weddingDate) : "Date pending"}</span>
                <Link to="/wedding-profile" className="text-rose-600 hover:underline">
                  Edit
                </Link>
              </div>
            </div>

            {/* B. Real Wedding Budget Summary Card */}
            <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      budgetSummary.isOverBudget
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {budgetSummary.isOverBudget ? "Over Budget Warning" : "Live Budget"}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Total Wedding Budget
                </h3>
                <div className="text-3xl font-serif font-bold text-slate-900 mb-2">
                  ${(budgetSummary.weddingBudget || wedding?.totalBudget || 0).toLocaleString()}
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Actual Spending</span>
                    <span className="font-semibold text-rose-600">
                      ${budgetSummary.actualTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        budgetSummary.isOverBudget
                          ? "bg-rose-600"
                          : budgetSummary.budgetUsagePercentage > 80
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(budgetSummary.budgetUsagePercentage, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Usage: {budgetSummary.budgetUsagePercentage}%</span>
                    <span
                      className={`font-semibold ${
                        budgetSummary.remainingBudget < 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {budgetSummary.remainingBudget < 0 ? "Deficit: -" : "Left: "}$
                      {Math.abs(budgetSummary.remainingBudget).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Real MongoDB Expenses</span>
                <Link to="/budget" className="text-rose-600 hover:underline font-semibold">
                  Manage Budget &rarr;
                </Link>
              </div>
            </div>

            {/* C. Real Live Guest RSVP & Attendees Statistics */}
            <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    Live RSVPs
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Expected Attendees
                </h3>
                <div className="text-3xl font-serif font-bold text-slate-900 mb-2">
                  {guestStats.totalExpectedAttendees}{" "}
                  <span className="text-base font-sans font-normal text-slate-500">
                    / {wedding?.estimatedGuestCount || 0} Target
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between text-[11px]">
                    <span>Confirmed Attending:</span>
                    <span className="font-semibold text-emerald-600">
                      {guestStats.acceptedInvitations} guests
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          wedding?.estimatedGuestCount > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  (guestStats.totalExpectedAttendees /
                                    wedding.estimatedGuestCount) *
                                    100
                                )
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Pending: {guestStats.pendingResponses}</span>
                    <span>Total Listed: {guestStats.totalGuests}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Real MongoDB Guests</span>
                <Link to="/guests" className="text-blue-600 hover:underline font-semibold">
                  Manage Guests &rarr;
                </Link>
              </div>
            </div>

            {/* D. REAL Task Progress Statistics Card */}
            <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                    Live Progress
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Task Completion
                </h3>
                <div className="text-3xl font-serif font-bold text-slate-900 mb-2">
                  {taskStats.completedTasks}{" "}
                  <span className="text-base font-sans font-normal text-slate-500">
                    / {taskStats.totalTasks} Done
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Overall Progress</span>
                    <span className="font-semibold text-purple-700">
                      {taskStats.completionPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-rose-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${taskStats.completionPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Pending: {taskStats.pendingTasks}</span>
                    <span>In Progress: {taskStats.inProgressTasks}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Live Checklist</span>
                <Link to="/checklist" className="text-rose-600 hover:underline font-semibold">
                  Open Checklist &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* 3. Real Day-of Timeline & Schedule Run-Sheet Overview */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Wedding Day Timeline &amp; Schedule
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Day-of chronological milestones, ceremonies, and execution run-sheet
                  </p>
                </div>
              </div>
              <Link
                to="/timeline"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-2xs transition-all w-fit"
              >
                <span>View Full Timeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Scheduled Events
                </span>
                <div className="text-xl font-serif font-bold text-slate-900 mt-1">
                  {timelineStats.totalEvents}
                </div>
                <span className="text-[10px] text-slate-500">
                  {timelineStats.upcomingEvents} upcoming &bull; {timelineStats.completedEvents} done
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Upcoming Milestones
                </span>
                <div className="text-xl font-serif font-bold text-amber-600 mt-1">
                  {timelineStats.upcomingEvents}
                </div>
                <span className="text-[10px] text-slate-500">
                  Pending execution
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Next Milestone
                </span>
                {timelineStats.nextUpcomingEvent ? (
                  <div className="mt-1">
                    <div className="text-base font-serif font-bold text-slate-900 truncate">
                      {timelineStats.nextUpcomingEvent.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-rose-600 font-semibold mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDisplayTime(timelineStats.nextUpcomingEvent.startTime)}</span>
                      {timelineStats.nextUpcomingEvent.location && (
                        <>
                          <span className="text-slate-300">&bull;</span>
                          <span className="text-slate-600 flex items-center gap-1 font-normal">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {timelineStats.nextUpcomingEvent.location}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 mt-1">No upcoming events scheduled</div>
                )}
              </div>
            </div>

            {/* Quick Timeline Preview List */}
            {recentTimelineEvents.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                {recentTimelineEvents.map((ev) => (
                  <div
                    key={ev._id}
                    className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60 shrink-0 text-[11px]">
                        {formatDisplayTime(ev.startTime)}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 truncate block">
                          {ev.title}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {ev.category} {ev.location ? `&bull; ${ev.location}` : ""}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                        ev.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : ev.status === "In Progress"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Real Vendor Bookings & Payment Status Overview */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Vendor Bookings &amp; Payment Status
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Active supplier agreements, advance deposits, and settlement tracking
                  </p>
                </div>
              </div>
              <Link
                to="/bookings"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-2xs transition-all w-fit"
              >
                <span>Manage Vendors &amp; Payments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Booked Vendors
                </span>
                <div className="text-xl font-serif font-bold text-slate-900 mt-1">
                  {bookingStats.totalBookings}
                </div>
                <span className="text-[10px] text-slate-500">
                  {bookingStats.confirmedBookings} confirmed &bull; {bookingStats.pendingBookings} pending
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Committed Vendor Total
                </span>
                <div className="text-xl font-serif font-bold text-slate-900 mt-1 font-mono">
                  ${(bookingStats.totalVendorCosts || 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500">
                  Agreed contract costs
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Vendor Paid
                </span>
                <div className="text-xl font-serif font-bold text-emerald-600 mt-1 font-mono">
                  ${(bookingStats.totalPaid || 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {bookingStats.totalVendorCosts > 0
                    ? `${Math.round((bookingStats.totalPaid / bookingStats.totalVendorCosts) * 100)}% settled`
                    : "No contracts yet"}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Pending Balance Due
                </span>
                <div
                  className={`text-xl font-serif font-bold mt-1 font-mono ${
                    bookingStats.outstandingPayments > 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  ${(bookingStats.outstandingPayments || 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500">
                  {bookingStats.outstandingPayments > 0 ? "Requires final installment" : "All settled"}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Detailed Planning Section: Wedding Checklist Preview & Session Security */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real Wedding Checklist Preview */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-rose-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Wedding Checklist Tasks
                  </h3>
                  <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    {taskStats.completedTasks} of {taskStats.totalTasks} Completed
                  </span>
                </div>
                <Link
                  to="/checklist"
                  className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
                >
                  <span>View All Tasks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loadingTasks ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Loading wedding checklist...
                </div>
              ) : recentTasks.length === 0 ? (
                <div className="p-6 bg-rose-50/40 rounded-2xl border border-rose-100 text-center">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif font-bold text-slate-900 text-sm mb-1">
                    No Checklist Tasks Added Yet
                  </h4>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto mb-3">
                    Start tracking your wedding preparations with our 10 recommended milestones.
                  </p>
                  <Link
                    to="/checklist"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Open Checklist Module</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentTasks.map((t) => {
                    const isCompleted = t.status === "Completed";
                    return (
                      <div
                        key={t._id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          isCompleted
                            ? "bg-emerald-50/30 border-emerald-200/80"
                            : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => handleToggleTask(t)}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              isCompleted
                                ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckSquare className="w-5 h-5 fill-emerald-100 text-emerald-600" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <p
                              className={`text-xs sm:text-sm font-semibold truncate ${
                                isCompleted ? "line-through text-slate-400 font-normal" : "text-slate-800"
                              }`}
                            >
                              {t.title}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {t.category || "General"} &bull; {t.priority} Priority
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {t.priority === "High" && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5" /> High
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              isCompleted
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-2 text-right">
                    <Link
                      to="/checklist"
                      className="text-xs font-semibold text-rose-600 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Manage All {taskStats.totalTasks} Tasks</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Authenticated Account & Security Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Auth &amp; Session Security
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Account Name
                    </span>
                    <span className="font-semibold text-slate-800 truncate max-w-[130px]">
                      {user?.name}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Email
                    </span>
                    <span className="font-semibold text-slate-800 truncate max-w-[130px]">
                      {user?.email}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-slate-400" /> Session
                    </span>
                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Active (JWT Bearer)
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Database</span>
                    <span className="font-medium text-slate-700">MongoDB Atlas</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout from Session</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
