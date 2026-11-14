import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import guestService from "../services/guestService";
import {
  ArrowLeft,
  Users,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
  LogOut,
  X,
  Phone,
  Mail,
  Send,
  Check,
  UserCheck,
  HelpCircle,
  Utensils,
  StickyNote,
} from "lucide-react";

const GUEST_CATEGORIES = ["Family", "Friends", "Relatives", "Colleagues", "Other"];
const RSVP_STATUSES = ["Pending", "Accepted", "Declined"];
const INVITATION_STATUSES = ["Not Sent", "Sent"];

export default function Guests() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({
    totalGuests: 0,
    acceptedInvitations: 0,
    declinedInvitations: 0,
    pendingResponses: 0,
    invitationsSent: 0,
    invitationsNotSent: 0,
    totalExpectedAttendees: 0,
    potentialTotalAttendees: 0,
    weddingTargetGuestCount: 0,
    categoryBreakdown: {},
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [rsvpFilter, setRsvpFilter] = useState("All");
  const [invitationFilter, setInvitationFilter] = useState("All");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [guestForm, setGuestForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    guestCategory: "Family",
    invitationStatus: "Not Sent",
    rsvpStatus: "Pending",
    numberOfAttendees: 1,
    dietaryRequirements: "",
    specialNotes: "",
  });

  // Fetch guests with applied filters
  const loadGuests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter !== "All") params.guestCategory = categoryFilter;
      if (rsvpFilter !== "All") params.rsvpStatus = rsvpFilter;
      if (invitationFilter !== "All") params.invitationStatus = invitationFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await guestService.getGuests(params);
      if (data) {
        setGuests(data.guests || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Load Guests Error:", err);
      setErrorMessage(guestService.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, rsvpFilter, invitationFilter]);

  // Handle Search on Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadGuests();
  };

  // Open modal for creating a new guest
  const handleOpenAddModal = () => {
    setEditingGuestId(null);
    setGuestForm({
      fullName: "",
      email: "",
      phoneNumber: "",
      guestCategory: "Family",
      invitationStatus: "Not Sent",
      rsvpStatus: "Pending",
      numberOfAttendees: 1,
      dietaryRequirements: "",
      specialNotes: "",
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  // Open modal for editing an existing guest
  const handleOpenEditModal = (guest) => {
    setEditingGuestId(guest._id);
    setGuestForm({
      fullName: guest.fullName || "",
      email: guest.email || "",
      phoneNumber: guest.phoneNumber || "",
      guestCategory: guest.guestCategory || "Other",
      invitationStatus: guest.invitationStatus || "Not Sent",
      rsvpStatus: guest.rsvpStatus || "Pending",
      numberOfAttendees: guest.numberOfAttendees !== undefined ? guest.numberOfAttendees : 1,
      dietaryRequirements: guest.dietaryRequirements || "",
      specialNotes: guest.specialNotes || "",
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  // Handle Save Guest (Create or Update)
  const handleSaveGuest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!guestForm.fullName.trim()) {
      setErrorMessage("Guest full name is required.");
      setSubmitting(false);
      return;
    }

    const attendees = parseInt(guestForm.numberOfAttendees, 10);
    if (isNaN(attendees) || attendees < 1) {
      setErrorMessage("Number of attendees must be at least 1.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        fullName: guestForm.fullName.trim(),
        email: guestForm.email.trim(),
        phoneNumber: guestForm.phoneNumber.trim(),
        guestCategory: guestForm.guestCategory,
        invitationStatus: guestForm.invitationStatus,
        rsvpStatus: guestForm.rsvpStatus,
        numberOfAttendees: attendees,
        dietaryRequirements: guestForm.dietaryRequirements.trim(),
        specialNotes: guestForm.specialNotes.trim(),
      };

      if (editingGuestId) {
        await guestService.updateGuest(editingGuestId, payload);
        setSuccessMessage("Guest details updated successfully!");
      } else {
        await guestService.createGuest(payload);
        setSuccessMessage("Guest added to guest list successfully!");
      }

      setIsModalOpen(false);
      await loadGuests();
    } catch (err) {
      setErrorMessage(guestService.getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Guest
  const handleDeleteGuest = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from your wedding guest list?`)) {
      return;
    }

    try {
      await guestService.deleteGuest(id);
      setSuccessMessage(`Guest "${name}" removed successfully.`);
      await loadGuests();
    } catch (err) {
      setErrorMessage(guestService.getErrorMessage(err));
    }
  };

  // Quick Inline Toggle for RSVP Status
  const handleQuickUpdateRsvp = async (guest, newRsvp) => {
    if (guest.rsvpStatus === newRsvp) return;
    try {
      // Optimistic update
      setGuests((prev) =>
        prev.map((g) => (g._id === guest._id ? { ...g, rsvpStatus: newRsvp } : g))
      );
      await guestService.updateGuest(guest._id, { rsvpStatus: newRsvp });
      setSuccessMessage(`Updated RSVP for "${guest.fullName}" to ${newRsvp}.`);
      await loadGuests();
    } catch (err) {
      setErrorMessage(guestService.getErrorMessage(err));
      await loadGuests();
    }
  };

  // Quick Inline Toggle for Invitation Status
  const handleQuickToggleInvitation = async (guest) => {
    const newStatus = guest.invitationStatus === "Sent" ? "Not Sent" : "Sent";
    try {
      // Optimistic update
      setGuests((prev) =>
        prev.map((g) => (g._id === guest._id ? { ...g, invitationStatus: newStatus } : g))
      );
      await guestService.updateGuest(guest._id, { invitationStatus: newStatus });
      setSuccessMessage(
        `Marked invitation for "${guest.fullName}" as ${newStatus}.`
      );
      await loadGuests();
    } catch (err) {
      setErrorMessage(guestService.getErrorMessage(err));
      await loadGuests();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-rose-100 sticky top-0 z-30">
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
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-serif font-bold text-slate-900 leading-tight">
                  Guest Management &amp; RSVPs
                </h1>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Headcounts &middot; Invitations &middot; Meal Preferences
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Guest</span>
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
        {/* Toast Alerts */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between animate-fadeIn">
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
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between animate-fadeIn">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Guests */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                Total Listed
              </span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                Total Guests
              </p>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
                {stats.totalGuests}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Potential: {stats.potentialTotalAttendees} attendees
              </p>
            </div>
          </div>

          {/* Card 2: Expected Attendees (Calculated ONLY from Accepted Guests) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Confirmed Only
              </span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                Expected Attendees
              </p>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-600">
                {stats.totalExpectedAttendees}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {stats.weddingTargetGuestCount > 0
                  ? `Target: ${stats.weddingTargetGuestCount} (${Math.round(
                      (stats.totalExpectedAttendees / stats.weddingTargetGuestCount) * 100
                    )}% capacity)`
                  : "From accepted RSVPs"}
              </p>
            </div>
          </div>

          {/* Card 3: Accepted RSVPs */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                {stats.totalGuests > 0
                  ? `${Math.round((stats.acceptedInvitations / stats.totalGuests) * 100)}% of List`
                  : "0%"}
              </span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                Accepted RSVPs
              </p>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
                {stats.acceptedInvitations}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Confirmed attending guests
              </p>
            </div>
          </div>

          {/* Card 4: Pending & Declined */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {stats.declinedInvitations} Declined
              </span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                Pending Responses
              </p>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-600">
                {stats.pendingResponses}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Awaiting guest replies
              </p>
            </div>
          </div>

          {/* Card 5: Invitations Sent */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                {stats.invitationsNotSent} Not Sent
              </span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                Invitations Sent
              </p>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-700">
                {stats.invitationsSent}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {stats.totalGuests > 0
                  ? `${Math.round((stats.invitationsSent / stats.totalGuests) * 100)}% sent out`
                  : "Track dispatch status"}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Filter & Search Controls */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search guest by name, email, phone, or meal notes..."
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
                {GUEST_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* RSVP Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-500 shrink-0 hidden sm:inline">
                RSVP:
              </label>
              <select
                value={rsvpFilter}
                onChange={(e) => setRsvpFilter(e.target.value)}
                className="py-2 px-3 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
              >
                <option value="All">All RSVPs</option>
                {RSVP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Invitation Status Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-500 shrink-0 hidden sm:inline">
                Invites:
              </label>
              <select
                value={invitationFilter}
                onChange={(e) => setInvitationFilter(e.target.value)}
                className="py-2 px-3 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
              >
                <option value="All">All Invites</option>
                {INVITATION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 text-[11px] font-medium">Quick Views:</span>
            <button
              onClick={() => {
                setCategoryFilter("All");
                setRsvpFilter("All");
                setInvitationFilter("All");
                setSearchTerm("");
              }}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                categoryFilter === "All" && rsvpFilter === "All" && invitationFilter === "All"
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              All Guests ({stats.totalGuests})
            </button>
            <button
              onClick={() => {
                setInvitationFilter("Not Sent");
                setRsvpFilter("All");
              }}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                invitationFilter === "Not Sent"
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
              }`}
            >
              Needs Invitation ({stats.invitationsNotSent})
            </button>
            <button
              onClick={() => {
                setRsvpFilter("Pending");
                setInvitationFilter("All");
              }}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                rsvpFilter === "Pending"
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
              }`}
            >
              Pending RSVP ({stats.pendingResponses})
            </button>
            <button
              onClick={() => {
                setRsvpFilter("Accepted");
                setInvitationFilter("All");
              }}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                rsvpFilter === "Accepted"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              Attending ({stats.acceptedInvitations})
            </button>
          </div>
        </div>

        {/* 3. Guests Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-600" />
              <h2 className="font-semibold text-slate-900 text-sm sm:text-base">
                Guest List &amp; Attendance Records
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {guests.length} {guests.length === 1 ? "Guest" : "Guests"}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Loading wedding guest list...
            </div>
          ) : guests.length === 0 ? (
            <div className="p-12 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-slate-900 text-base">
                No Guests Found
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {searchTerm || categoryFilter !== "All" || rsvpFilter !== "All" || invitationFilter !== "All"
                  ? "No guests match your current filter criteria. Try resetting your search or filters."
                  : "Start creating your wedding guest list to manage invitations, headcount, and dietary preferences."}
              </p>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Guest</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">Guest Name &amp; Category</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4 text-center">Attendees</th>
                    <th className="py-3 px-4">Dietary &amp; Notes</th>
                    <th className="py-3 px-4 text-center">Invitation</th>
                    <th className="py-3 px-4">RSVP Status</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {guests.map((g) => {
                    const isAccepted = g.rsvpStatus === "Accepted";
                    const isDeclined = g.rsvpStatus === "Declined";
                    const isSent = g.invitationStatus === "Sent";

                    return (
                      <tr key={g._id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Guest Name & Category */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="font-semibold text-slate-900">{g.fullName}</div>
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border mt-1 ${
                              g.guestCategory === "Family"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : g.guestCategory === "Friends"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : g.guestCategory === "Relatives"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : g.guestCategory === "Colleagues"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {g.guestCategory}
                          </span>
                        </td>

                        {/* Contact Information */}
                        <td className="py-4 px-4 text-xs">
                          {g.email && (
                            <div className="text-slate-600 flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[150px]">{g.email}</span>
                            </div>
                          )}
                          {g.phoneNumber && (
                            <div className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{g.phoneNumber}</span>
                            </div>
                          )}
                          {!g.email && !g.phoneNumber && (
                            <span className="text-slate-400 italic">No contact details</span>
                          )}
                        </td>

                        {/* Number of Attendees */}
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center font-mono font-bold text-xs sm:text-sm bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                            {g.numberOfAttendees}{" "}
                            <span className="font-normal font-sans text-[11px] text-slate-500 ml-1">
                              {g.numberOfAttendees === 1 ? "seat" : "seats"}
                            </span>
                          </span>
                        </td>

                        {/* Dietary Requirements & Special Notes */}
                        <td className="py-4 px-4 text-xs">
                          {g.dietaryRequirements && (
                            <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mb-1">
                              <Utensils className="w-2.5 h-2.5" />
                              <span>{g.dietaryRequirements}</span>
                            </div>
                          )}
                          {g.specialNotes && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 line-clamp-1">
                              <StickyNote className="w-2.5 h-2.5 text-slate-400" />
                              <span>{g.specialNotes}</span>
                            </p>
                          )}
                          {!g.dietaryRequirements && !g.specialNotes && (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>

                        {/* Invitation Status (One-Click Toggle) */}
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleQuickToggleInvitation(g)}
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                              isSent
                                ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                            }`}
                            title="Click to toggle invitation status"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>{g.invitationStatus}</span>
                          </button>
                        </td>

                        {/* RSVP Status Dropdown / Quick Select */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isAccepted
                                  ? "bg-emerald-500"
                                  : isDeclined
                                  ? "bg-rose-500"
                                  : "bg-amber-400"
                              }`}
                            />
                            <select
                              value={g.rsvpStatus}
                              onChange={(e) => handleQuickUpdateRsvp(g, e.target.value)}
                              className={`text-xs font-semibold py-1 px-2 rounded-lg border transition-all cursor-pointer ${
                                isAccepted
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isDeclined
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Accepted">Accepted</option>
                              <option value="Declined">Declined</option>
                            </select>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 sm:px-6 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(g)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Edit Guest"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteGuest(g._id, g.fullName)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Delete Guest"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: ADD / EDIT GUEST */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-rose-100 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  {editingGuestId ? "Edit Guest Details" : "Add Wedding Guest"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGuest} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guest Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eleanor & Julian Vance"
                  value={guestForm.fullName}
                  onChange={(e) => setGuestForm({ ...guestForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="guest@example.com"
                    value={guestForm.email}
                    onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 555-0144"
                    value={guestForm.phoneNumber}
                    onChange={(e) => setGuestForm({ ...guestForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Guest Category & Attendees Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guest Category
                  </label>
                  <select
                    value={guestForm.guestCategory}
                    onChange={(e) => setGuestForm({ ...guestForm, guestCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  >
                    {GUEST_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Number of Attendees <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1"
                    value={guestForm.numberOfAttendees}
                    onChange={(e) => setGuestForm({ ...guestForm, numberOfAttendees: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 font-mono"
                  />
                </div>
              </div>

              {/* Invitation Status & RSVP Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Invitation Status
                  </label>
                  <select
                    value={guestForm.invitationStatus}
                    onChange={(e) => setGuestForm({ ...guestForm, invitationStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  >
                    {INVITATION_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RSVP Response
                  </label>
                  <select
                    value={guestForm.rsvpStatus}
                    onChange={(e) => setGuestForm({ ...guestForm, rsvpStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  >
                    {RSVP_STATUSES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dietary Requirements */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dietary Requirements / Allergies
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vegetarian, Gluten-free, Nut allergy"
                  value={guestForm.dietaryRequirements}
                  onChange={(e) => setGuestForm({ ...guestForm, dietaryRequirements: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>

              {/* Special Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Special Notes / Seating Requests
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Close to the stage, high chair required for infant"
                  value={guestForm.specialNotes}
                  onChange={(e) => setGuestForm({ ...guestForm, specialNotes: e.target.value })}
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
                  {submitting ? "Saving..." : editingGuestId ? "Update Guest" : "Add Guest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
