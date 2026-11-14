import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";
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
  Info,
} from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Sidebar toggle state for mobile viewports
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Live Backend health verification
  const [backendHealth, setBackendHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  useEffect(() => {
    let isMounted = true;
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

    verifyBackend();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard, isPlaceholder: false },
    { id: "checklist", label: "Checklist & Tasks", icon: CheckSquare, isPlaceholder: true },
    { id: "budget", label: "Budget Planner", icon: DollarSign, isPlaceholder: true },
    { id: "guests", label: "Guest List & RSVPs", icon: Users, isPlaceholder: true },
    { id: "timeline", label: "Day-of Timeline", icon: Clock, isPlaceholder: true },
    { id: "vendors", label: "Vendor Directory", icon: Store, isPlaceholder: true },
    { id: "settings", label: "Account Settings", icon: Settings, isPlaceholder: true },
  ];

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
          <div className="flex items-center gap-3">
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
          </div>
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
            return (
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
                Wedding Dashboard
              </h1>
              <p className="hidden sm:block text-xs text-slate-500">
                WedEase Full-Stack Planning Suite &bull; Phase 1 Authentication
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
                  ? "Backend Connected"
                  : "API Port 5000"}
              </span>
            </div>

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
          {/* 1. Welcome Message & Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-rose-950/5">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold tracking-wider uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Authentication & Session Active</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight mb-2">
                Welcome, {user?.name || "Lovely Couple"}!
              </h2>
              <p className="text-rose-100 text-sm sm:text-base leading-relaxed">
                Your wedding planning journey with WedEase has begun. Manage your countdown,
                budget estimations, guest counts, and task checklists all from this dashboard.
              </p>
            </div>
            {/* Soft decorative background glows */}
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute right-20 top-0 -translate-y-12 w-48 h-48 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* 2. Key Placeholders Grid: Countdown, Budget, Guests, Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {/* A. Wedding Date Countdown Placeholder */}
            <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Countdown Placeholder
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Wedding Countdown
                </h3>
                <div className="text-3xl font-serif font-bold text-slate-900 mb-2">
                  184 <span className="text-base font-sans font-normal text-slate-500">Days</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">14</span>
                    <p className="text-[10px] text-slate-400 uppercase">Hours</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">32</span>
                    <p className="text-[10px] text-slate-400 uppercase">Mins</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">45</span>
                    <p className="text-[10px] text-slate-400 uppercase">Secs</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Date customization will save in Phase 2</span>
              </div>
            </div>

            {/* B. Wedding Budget Summary Placeholder */}
            <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Budget Placeholder
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Total Budget Goal
                </h3>
                <div className="text-3xl font-serif font-bold text-slate-900 mb-2">
                  $25,000
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Allocated / Spent</span>
                    <span className="font-semibold text-slate-800">$9,800 (39%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-500 to-amber-500 h-2 rounded-full w-[39%]" />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Remaining</span>
                    <span className="font-semibold text-emerald-600">$15,200</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Live expense tracking in Phase 2</span>
              </div>
            </div>

            {/* C. Guest Count Placeholder */}
            <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Guest Placeholder
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Invited Guests
                </h3>
                <div className="text-3xl font-serif font-bold text-slate-900 mb-2">
                  120 <span className="text-base font-sans font-normal text-slate-500">Total</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-emerald-600">78</span>
                    <p className="text-[10px] text-slate-400">Attending</p>
                  </div>
                  <div>
                    <span className="font-bold text-amber-600">34</span>
                    <p className="text-[10px] text-slate-400">Pending</p>
                  </div>
                  <div>
                    <span className="font-bold text-rose-500">8</span>
                    <p className="text-[10px] text-slate-400">Declined</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>RSVP forms & seating charts in Phase 2</span>
              </div>
            </div>

            {/* D. Task Progress Placeholder */}
            <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Tasks Placeholder
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Checklist Progress
                </h3>
                <div className="text-3xl font-serif font-bold text-slate-900 mb-2">
                  14 <span className="text-base font-sans font-normal text-slate-500">/ 42 Tasks</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Progress</span>
                    <span className="font-semibold text-purple-700">33% Completed</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-rose-500 h-2 rounded-full w-[33%]" />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Interactive checklist in Phase 2</span>
              </div>
            </div>
          </div>

          {/* 3. Detailed Planning Section: Tasks List & Security Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sample Planning Milestones (Placeholder Checklist preview) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-rose-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Sample Wedding Milestones (Preview)
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Setup Mode &bull; Unconnected to database
                </span>
              </div>
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 line-through">
                        Create WedEase couple account
                      </p>
                      <p className="text-[11px] text-slate-400">Phase 1 Authentication</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Done
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Finalize wedding date & venue booking
                      </p>
                      <p className="text-[11px] text-slate-400">10-12 months before</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Upcoming
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Compile draft guest list & mailing addresses
                      </p>
                      <p className="text-[11px] text-slate-400">8-10 months before</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    Pending
                  </span>
                </div>
              </div>
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
                      <Activity className="w-3.5 h-3.5 text-slate-400" /> JWT Token
                    </span>
                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Validated (7 Days)
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Security Standard</span>
                    <span className="font-medium text-slate-700">bcrypt + Bearer Auth</span>
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
