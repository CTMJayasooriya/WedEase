import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";
import weddingService from "../services/weddingService";
import {
  Heart,
  LogOut,
  Sparkles,
  Calendar,
  CheckSquare,
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
  MapPin,
  Edit3,
  PlusCircle,
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

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Sidebar toggle state for mobile viewports
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Wedding details state from MongoDB Atlas
  const [wedding, setWedding] = useState(null);
  const [loadingWedding, setLoadingWedding] = useState(true);

  // Live Backend health verification
  const [backendHealth, setBackendHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  // Fetch wedding profile and backend health
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoadingWedding(true);
      try {
        const data = await weddingService.getMyWedding();
        if (isMounted && data?.wedding) {
          setWedding(data.wedding);
        }
      } catch (err) {
        console.error("Failed to load wedding details:", err);
      } finally {
        if (isMounted) setLoadingWedding(false);
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

  const navItems = [
    { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard, path: "/dashboard", isPlaceholder: false },
    { id: "profile", label: "Wedding Profile", icon: Heart, path: "/wedding-profile", isPlaceholder: false },
    { id: "checklist", label: "Checklist & Tasks", icon: CheckSquare, path: null, isPlaceholder: true },
    { id: "budget", label: "Budget Planner", icon: DollarSign, path: null, isPlaceholder: true },
    { id: "guests", label: "Guest List & RSVPs", icon: Users, path: null, isPlaceholder: true },
    { id: "timeline", label: "Day-of Timeline", icon: Clock, path: null, isPlaceholder: true },
    { id: "vendors", label: "Vendor Directory", icon: Store, path: null, isPlaceholder: true },
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
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
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
              {user?.name ? user.name.charAt(0).toUpperCase() : "W"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user?.name || "Wedding Planner"}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-700 bg-rose-100/60 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out of WedEase</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white/90 backdrop-blur-md border-b border-rose-100/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
                {wedding ? `${wedding.brideName} & ${wedding.groomName}'s Wedding` : "Wedding Dashboard"}
              </h1>
              <p className="hidden sm:block text-xs text-slate-500">
                WedEase Full-Stack Planning Suite &bull; Master Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Backend Connection Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 border border-slate-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  checkingHealth
                    ? "bg-amber-400 animate-spin"
                    : backendHealth?.online
                    ? "bg-emerald-500 animate-pulse"
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
          {/* 1. Welcome Hero Banner with Couple Names */}
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
                    {wedding.brideName} & {wedding.groomName}
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

          {/* 2. Key Values Grid: Real Countdown, Budget, Guests, Venue */}
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
                    <div className="py-2 text-xl font-serif font-bold text-rose-600">
                      Today is your Wedding Day! 🎉
                    </div>
                  ) : countdown.isPast ? (
                    <div className="py-2 text-lg font-serif font-semibold text-slate-700">
                      Celebrated on {new Date(wedding.weddingDate).toLocaleDateString()}
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-serif font-bold text-slate-900 mb-2">
                        {countdown.days}{" "}
                        <span className="text-base font-sans font-normal text-slate-500">
                          Days
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{countdown.hours}</span>
                          <p className="text-[10px] text-slate-400 uppercase">Hours</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-800">{countdown.minutes}</span>
                          <p className="text-[10px] text-slate-400 uppercase">Mins</p>
                        </div>
                        <div>
                          <span className="font-bold text-slate-800">{countdown.seconds}</span>
                          <p className="text-[10px] text-slate-400 uppercase">Secs</p>
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

            {/* B. Total Wedding Budget */}
            <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Budget Target
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Total Wedding Budget
                </h3>
                <div className="text-3xl font-serif font-bold text-slate-900 mb-2">
                  {wedding ? `$${Number(wedding.totalBudget).toLocaleString()}` : "$0"}
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Target Budget Allocation</span>
                    <span className="font-semibold text-slate-800">
                      {wedding ? `$${Number(wedding.totalBudget).toLocaleString()}` : "Not configured"}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-500 to-amber-500 h-2 rounded-full w-full" />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Saved in MongoDB Atlas</span>
                <Link to="/wedding-profile" className="text-rose-600 hover:underline">
                  Edit
                </Link>
              </div>
            </div>

            {/* C. Estimated Guest Count */}
            <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    Guest Target
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Estimated Guests
                </h3>
                <div className="text-3xl font-serif font-bold text-slate-900 mb-2">
                  {wedding ? wedding.estimatedGuestCount : 0}{" "}
                  <span className="text-base font-sans font-normal text-slate-500">Guests</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {wedding
                    ? `Planning capacity configured for up to ${wedding.estimatedGuestCount} attendees.`
                    : "No estimated guest count entered yet."}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Guest list capacity</span>
                <Link to="/wedding-profile" className="text-rose-600 hover:underline">
                  Edit
                </Link>
              </div>
            </div>

            {/* D. Wedding Venue & Location */}
            <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Celebration Venue
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Location & Venue
                </h3>
                <div className="text-lg font-serif font-bold text-slate-900 line-clamp-2 mb-2">
                  {wedding?.venue || "Venue not specified yet"}
                </div>
                <p className="text-xs text-slate-500">
                  {wedding?.description
                    ? wedding.description
                    : "Add your wedding vision or venue notes in your profile."}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Wedding destination</span>
                <Link to="/wedding-profile" className="text-rose-600 hover:underline">
                  Edit
                </Link>
              </div>
            </div>
          </div>

          {/* 3. Detailed Planning Section: Wedding Profile Overview & Session Security */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Master Wedding Overview Card */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Wedding Profile Summary
                  </h3>
                </div>
                <Link
                  to="/wedding-profile"
                  className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update Details</span>
                </Link>
              </div>

              {loadingWedding ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Loading profile summary...
                </div>
              ) : wedding ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Bride</span>
                    <span className="font-semibold text-slate-900 text-sm">{wedding.brideName}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Groom</span>
                    <span className="font-semibold text-slate-900 text-sm">{wedding.groomName}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Wedding Date</span>
                    <span className="font-semibold text-slate-900 text-sm">
                      {formatWeddingDate(wedding.weddingDate)}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Venue</span>
                    <span className="font-semibold text-slate-900 text-sm">{wedding.venue}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Estimated Guests</span>
                    <span className="font-semibold text-slate-900 text-sm">
                      {wedding.estimatedGuestCount} Guests
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Total Budget</span>
                    <span className="font-semibold text-slate-900 text-sm">
                      ${Number(wedding.totalBudget).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-rose-50/50 rounded-2xl border border-rose-100 text-center">
                  <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-slate-900 text-base mb-1">
                    No Wedding Profile Found
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto mb-4">
                    Create your wedding profile to personalize your dashboard, start your countdown, and set your wedding budget targets.
                  </p>
                  <Link
                    to="/wedding-profile"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Wedding Profile</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Authenticated Account & Security Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Auth & Session Security
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
                  <span>Log Out of Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
