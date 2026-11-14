import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import bookingService from "../services/bookingService";
import {
  ArrowLeft,
  Store,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
  LogOut,
  X,
  CreditCard,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  Receipt,
  User,
} from "lucide-react";

const VENDOR_CATEGORIES = [
  "Wedding Venue",
  "Catering",
  "Photography",
  "Videography",
  "Decoration",
  "Wedding Dress",
  "Makeup Artist",
  "Music and Entertainment",
  "Transportation",
  "Other",
];

const BOOKING_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];
const PAYMENT_METHODS = ["Bank Transfer", "Cash", "Card", "Other"];
const PAYMENT_TYPES = ["Partial", "Advance", "Final"];

export default function Bookings() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalVendorCosts: 0,
    totalPaid: 0,
    outstandingPayments: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Modal State for Add / Edit Booking
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    vendorName: "",
    vendorCategory: "Photography",
    contactPerson: "",
    phoneNumber: "",
    email: "",
    serviceDescription: "",
    bookingDate: new Date().toISOString().split("T")[0],
    eventDate: "",
    totalAmount: "",
    advanceAmount: "",
    bookingStatus: "Pending",
    notes: "",
  });

  // Modal State for Payment Management
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const [bookingPayments, setBookingPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer",
    paymentType: "Partial",
    notes: "",
  });
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");

  // Fetch bookings with filters
  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter !== "All") params.vendorCategory = categoryFilter;
      if (statusFilter !== "All") params.bookingStatus = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await bookingService.getBookings(params);
      if (data) {
        setBookings(data.bookings || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Load Bookings Error:", err);
      setErrorMessage(bookingService.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, statusFilter]);

  // Handle Search on Submit or Enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadBookings();
  };

  // Open modal for creating a new booking
  const handleOpenAddModal = () => {
    setEditingBookingId(null);
    setBookingForm({
      vendorName: "",
      vendorCategory: "Photography",
      contactPerson: "",
      phoneNumber: "",
      email: "",
      serviceDescription: "",
      bookingDate: new Date().toISOString().split("T")[0],
      eventDate: "",
      totalAmount: "",
      advanceAmount: "",
      bookingStatus: "Pending",
      notes: "",
    });
    setErrorMessage("");
    setIsBookingModalOpen(true);
  };

  // Open modal for editing an existing booking
  const handleOpenEditModal = (booking) => {
    setEditingBookingId(booking._id);
    setBookingForm({
      vendorName: booking.vendorName || "",
      vendorCategory: booking.vendorCategory || "Other",
      contactPerson: booking.contactPerson || "",
      phoneNumber: booking.phoneNumber || "",
      email: booking.email || "",
      serviceDescription: booking.serviceDescription || "",
      bookingDate: booking.bookingDate ? booking.bookingDate.split("T")[0] : "",
      eventDate: booking.eventDate ? booking.eventDate.split("T")[0] : "",
      totalAmount: booking.totalAmount !== undefined ? String(booking.totalAmount) : "",
      advanceAmount: booking.advanceAmount !== undefined ? String(booking.advanceAmount) : "",
      bookingStatus: booking.bookingStatus || "Pending",
      notes: booking.notes || "",
    });
    setErrorMessage("");
    setIsBookingModalOpen(true);
  };

  // Handle Save Booking (Create or Update)
  const handleSaveBooking = async (e) => {
    e.preventDefault();
    setSubmittingBooking(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (!bookingForm.vendorName.trim()) {
      setErrorMessage("Vendor name is required.");
      setSubmittingBooking(false);
      return;
    }

    const total = Number(bookingForm.totalAmount);
    if (isNaN(total) || total < 0) {
      setErrorMessage("Total booking amount must be a non-negative number.");
      setSubmittingBooking(false);
      return;
    }

    if (!editingBookingId) {
      const adv = bookingForm.advanceAmount ? Number(bookingForm.advanceAmount) : 0;
      if (adv < 0) {
        setErrorMessage("Advance amount cannot be negative.");
        setSubmittingBooking(false);
        return;
      }
      if (adv > total) {
        setErrorMessage(`Advance amount ($${adv}) cannot exceed the total booking amount ($${total}).`);
        setSubmittingBooking(false);
        return;
      }
    }

    try {
      const payload = {
        vendorName: bookingForm.vendorName.trim(),
        vendorCategory: bookingForm.vendorCategory,
        contactPerson: bookingForm.contactPerson.trim(),
        phoneNumber: bookingForm.phoneNumber.trim(),
        email: bookingForm.email.trim(),
        serviceDescription: bookingForm.serviceDescription.trim(),
        bookingDate: bookingForm.bookingDate || new Date().toISOString(),
        eventDate: bookingForm.eventDate || null,
        totalAmount: total,
        bookingStatus: bookingForm.bookingStatus,
        notes: bookingForm.notes.trim(),
      };

      if (!editingBookingId && bookingForm.advanceAmount) {
        payload.advanceAmount = Number(bookingForm.advanceAmount);
      }

      if (editingBookingId) {
        await bookingService.updateBooking(editingBookingId, payload);
        setSuccessMessage("Vendor booking updated successfully!");
      } else {
        await bookingService.createBooking(payload);
        setSuccessMessage("Vendor booking created successfully!");
      }

      setIsBookingModalOpen(false);
      await loadBookings();
    } catch (err) {
      setErrorMessage(bookingService.getErrorMessage(err));
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Handle Delete Booking
  const handleDeleteBooking = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the booking for "${name}"? All associated payment history records will also be permanently removed.`
      )
    ) {
      return;
    }

    try {
      await bookingService.deleteBooking(id);
      setSuccessMessage(`Booking for "${name}" deleted successfully.`);
      await loadBookings();
    } catch (err) {
      setErrorMessage(bookingService.getErrorMessage(err));
    }
  };

  // Open Payment Management Modal
  const handleOpenPaymentsModal = async (booking) => {
    setActiveBooking(booking);
    setBookingPayments([]);
    setPaymentError("");
    setPaymentSuccess("");
    setPaymentForm({
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "Bank Transfer",
      paymentType: booking.remainingAmount <= 0 ? "Final" : "Partial",
      notes: "",
    });
    setIsPaymentModalOpen(true);
    setLoadingPayments(true);

    try {
      const data = await bookingService.getPaymentsByBooking(booking._id);
      if (data) {
        setBookingPayments(data.payments || []);
        if (data.booking) {
          setActiveBooking(data.booking);
        }
      }
    } catch (err) {
      setPaymentError(bookingService.getErrorMessage(err));
    } finally {
      setLoadingPayments(false);
    }
  };

  // Record a payment against the active booking
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setPaymentError("");
    setPaymentSuccess("");

    if (!activeBooking) return;

    const amount = Number(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setPaymentError("Payment amount must be greater than $0.");
      return;
    }

    if (amount > activeBooking.remainingAmount) {
      setPaymentError(
        `Payment amount ($${amount.toLocaleString()}) cannot exceed remaining balance of $${activeBooking.remainingAmount.toLocaleString()}.`
      );
      return;
    }

    setSubmittingPayment(true);
    try {
      const response = await bookingService.recordPayment({
        bookingId: activeBooking._id,
        amount,
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        paymentType: paymentForm.paymentType,
        notes: paymentForm.notes.trim(),
      });

      setPaymentSuccess("Payment recorded successfully!");
      if (response?.updatedBooking) {
        setActiveBooking(response.updatedBooking);
      }

      // Reset payment form
      setPaymentForm({
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "Bank Transfer",
        paymentType: "Partial",
        notes: "",
      });

      // Reload payments for active booking
      const pData = await bookingService.getPaymentsByBooking(activeBooking._id);
      if (pData?.payments) {
        setBookingPayments(pData.payments);
      }

      // Refresh master bookings and stats in background
      await loadBookings();
    } catch (err) {
      setPaymentError(bookingService.getErrorMessage(err));
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Delete a payment record
  const handleDeletePayment = async (paymentId, amount) => {
    if (!window.confirm(`Delete this payment of $${amount.toLocaleString()} and restore the balance on this booking?`)) {
      return;
    }

    try {
      const res = await bookingService.deletePayment(paymentId);
      setPaymentSuccess("Payment deleted and booking balance restored!");
      if (res?.updatedBooking) {
        setActiveBooking(res.updatedBooking);
      }

      // Refresh payments list
      if (activeBooking) {
        const pData = await bookingService.getPaymentsByBooking(activeBooking._id);
        if (pData?.payments) {
          setBookingPayments(pData.payments);
        }
      }

      await loadBookings();
    } catch (err) {
      setPaymentError(bookingService.getErrorMessage(err));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Helper formatting
  const formatCurrency = (val) => `$${(Number(val) || 0).toLocaleString()}`;
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-serif font-bold text-slate-900 leading-tight">
                  Vendor Bookings & Payments
                </h1>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Suppliers &middot; Contracts &middot; Installments
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
              <span>Add Vendor Booking</span>
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

      {/* Main Body */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Bookings */}
          <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                {stats.confirmedBookings} Confirmed
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Total Vendor Bookings
              </p>
              <div className="text-3xl font-serif font-bold text-slate-900">
                {stats.totalBookings}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
                <span>{stats.pendingBookings} Pending</span>
                <span>&bull;</span>
                <span>{stats.completedBookings} Completed</span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Vendor Contracts */}
          <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Committed Contracts
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Total Vendor Cost
              </p>
              <div className="text-3xl font-serif font-bold text-slate-900">
                {formatCurrency(stats.totalVendorCosts)}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Sum of active vendor service agreements
              </p>
            </div>
          </div>

          {/* Card 3: Total Paid to Date */}
          <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {stats.totalVendorCosts > 0
                  ? `${Math.round((stats.totalPaid / stats.totalVendorCosts) * 100)}% Paid`
                  : "0% Paid"}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Total Paid Amount
              </p>
              <div className="text-3xl font-serif font-bold text-emerald-600">
                {formatCurrency(stats.totalPaid)}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      stats.totalVendorCosts > 0
                        ? Math.min(100, Math.round((stats.totalPaid / stats.totalVendorCosts) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Outstanding Payments */}
          <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  stats.outstandingPayments > 0
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {stats.outstandingPayments > 0 ? "Pending Balance" : "Fully Settled"}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Outstanding Balance
              </p>
              <div
                className={`text-3xl font-serif font-bold ${
                  stats.outstandingPayments > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {formatCurrency(stats.outstandingPayments)}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Remaining to settle before event day
              </p>
            </div>
          </div>
        </div>

        {/* 2. Filter & Search Controls */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vendor name, contact person, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-20 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all"
              >
                Search
              </button>
            </form>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500 shrink-0 hidden sm:inline">
                Category:
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-2 px-3 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
              >
                <option value="All">All Categories</option>
                {VENDOR_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500 shrink-0 hidden sm:inline">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
              >
                <option value="All">All Statuses</option>
                {BOOKING_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 3. Bookings Table & Cards */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-rose-600" />
              <h2 className="font-semibold text-slate-900 text-sm sm:text-base">
                Vendor Bookings Directory
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {bookings.length} {bookings.length === 1 ? "Vendor" : "Vendors"}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Loading vendor bookings...
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-slate-900 text-base">
                No Vendor Bookings Found
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {searchTerm || categoryFilter !== "All" || statusFilter !== "All"
                  ? "No bookings match your filter criteria. Try resetting your search or filter."
                  : "Begin booking your wedding venue, caterer, photographer, and decorators to keep contracts and payments organized."}
              </p>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Vendor</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">Vendor & Service</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Financials</th>
                    <th className="py-3 px-4">Payment Progress</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {bookings.map((b) => {
                    const paidPercent =
                      b.totalAmount > 0
                        ? Math.min(100, Math.round((b.paidAmount / b.totalAmount) * 100))
                        : 100;
                    const isFullyPaid = b.remainingAmount === 0;

                    return (
                      <tr key={b._id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Vendor Name & Service */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="font-semibold text-slate-900">{b.vendorName}</div>
                          <div className="inline-block text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60 mt-1">
                            {b.vendorCategory}
                          </div>
                          {b.serviceDescription && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                              {b.serviceDescription}
                            </p>
                          )}
                        </td>

                        {/* Contact Information */}
                        <td className="py-4 px-4 text-xs">
                          {b.contactPerson && (
                            <div className="font-medium text-slate-800 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{b.contactPerson}</span>
                            </div>
                          )}
                          {b.phoneNumber && (
                            <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{b.phoneNumber}</span>
                            </div>
                          )}
                          {b.email && (
                            <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[130px]">{b.email}</span>
                            </div>
                          )}
                          {!b.contactPerson && !b.phoneNumber && !b.email && (
                            <span className="text-slate-400 italic">No contact info</span>
                          )}
                        </td>

                        {/* Dates */}
                        <td className="py-4 px-4 text-xs">
                          <div className="text-slate-700 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Event: {formatDate(b.eventDate)}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Booked: {formatDate(b.bookingDate)}
                          </div>
                        </td>

                        {/* Financial Amounts */}
                        <td className="py-4 px-4 text-xs font-mono">
                          <div className="font-semibold text-slate-900">
                            {formatCurrency(b.totalAmount)}
                          </div>
                          <div className="text-[11px] text-emerald-600">
                            Paid: {formatCurrency(b.paidAmount)}
                          </div>
                          <div
                            className={`text-[11px] font-semibold ${
                              isFullyPaid ? "text-emerald-700" : "text-rose-600"
                            }`}
                          >
                            Due: {formatCurrency(b.remainingAmount)}
                          </div>
                        </td>

                        {/* Payment Progress Bar */}
                        <td className="py-4 px-4 w-36">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span>{paidPercent}%</span>
                            <span className={isFullyPaid ? "text-emerald-600 font-semibold" : ""}>
                              {isFullyPaid ? "Settled" : "Partial"}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                isFullyPaid ? "bg-emerald-500" : "bg-gradient-to-r from-amber-500 to-rose-500"
                              }`}
                              style={{ width: `${paidPercent}%` }}
                            />
                          </div>
                        </td>

                        {/* Booking Status Badge */}
                        <td className="py-4 px-4">
                          <span
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border inline-block ${
                              b.bookingStatus === "Confirmed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : b.bookingStatus === "Completed"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : b.bookingStatus === "Cancelled"
                                ? "bg-slate-100 text-slate-500 border-slate-200 line-through"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {b.bookingStatus}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 sm:px-6 text-right space-x-1">
                          <button
                            onClick={() => handleOpenPaymentsModal(b)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                            title="Manage Installment Payments"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Payments</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(b)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Edit Booking"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBooking(b._id, b.vendorName)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Delete Booking"
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

      {/* MODAL 1: ADD / EDIT VENDOR BOOKING */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-rose-100 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  {editingBookingId ? "Edit Vendor Booking" : "Add Vendor Booking"}
                </h3>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBooking} className="space-y-4">
              {/* Row 1: Vendor Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vendor Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Blooms Floral Studio"
                    value={bookingForm.vendorName}
                    onChange={(e) => setBookingForm({ ...bookingForm, vendorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={bookingForm.vendorCategory}
                    onChange={(e) => setBookingForm({ ...bookingForm, vendorCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  >
                    {VENDOR_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Contact Person & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Samantha Fernando"
                    value={bookingForm.contactPerson}
                    onChange={(e) => setBookingForm({ ...bookingForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +94 77 123 4567"
                    value={bookingForm.phoneNumber}
                    onChange={(e) => setBookingForm({ ...bookingForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Row 3: Email & Event Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="vendor@example.com"
                    value={bookingForm.email}
                    onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={bookingForm.eventDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, eventDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Row 4: Total Amount & Advance Amount (if creating) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Contract Amount ($) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="2500"
                    value={bookingForm.totalAmount}
                    onChange={(e) => setBookingForm({ ...bookingForm, totalAmount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 font-mono"
                  />
                </div>
                {!editingBookingId ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Initial Advance Deposit ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="500 (optional)"
                      value={bookingForm.advanceAmount}
                      onChange={(e) => setBookingForm({ ...bookingForm, advanceAmount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 font-mono"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Booking Status
                    </label>
                    <select
                      value={bookingForm.bookingStatus}
                      onChange={(e) => setBookingForm({ ...bookingForm, bookingStatus: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                    >
                      {BOOKING_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Service Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Description / Package Scope
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10 hours coverage, full-day photo session + edited album"
                  value={bookingForm.serviceDescription}
                  onChange={(e) => setBookingForm({ ...bookingForm, serviceDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contract Notes / Terms
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Balance due 2 weeks before the wedding day."
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBooking}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submittingBooking ? "Saving..." : editingBookingId ? "Update Booking" : "Create Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PAYMENT MANAGEMENT & HISTORY */}
      {isPaymentModalOpen && activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-rose-100 shadow-2xl space-y-6 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-rose-600" />
                  <h3 className="font-serif font-bold text-slate-900 text-lg">
                    Payment Tracker: {activeBooking.vendorName}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Category: {activeBooking.vendorCategory} &middot; Total Contract:{" "}
                  <strong className="text-slate-800">{formatCurrency(activeBooking.totalAmount)}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Alerts */}
            {paymentSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                <span>{paymentSuccess}</span>
                <button onClick={() => setPaymentSuccess("")}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {paymentError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                <span>{paymentError}</span>
                <button onClick={() => setPaymentError("")}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Financial Overview Tiles */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-center">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Contract
                </span>
                <span className="text-lg font-serif font-bold text-slate-900">
                  {formatCurrency(activeBooking.totalAmount)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Paid
                </span>
                <span className="text-lg font-serif font-bold text-emerald-600">
                  {formatCurrency(activeBooking.paidAmount)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Remaining Due
                </span>
                <span
                  className={`text-lg font-serif font-bold ${
                    activeBooking.remainingAmount > 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {formatCurrency(activeBooking.remainingAmount)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Settlement Progress</span>
                <span className="font-semibold text-slate-800">
                  {activeBooking.totalAmount > 0
                    ? `${Math.round((activeBooking.paidAmount / activeBooking.totalAmount) * 100)}% Settled`
                    : "100% Settled"}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      activeBooking.totalAmount > 0
                        ? Math.min(
                            100,
                            Math.round((activeBooking.paidAmount / activeBooking.totalAmount) * 100)
                          )
                        : 100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Record New Payment Form (Only if balance remains) */}
            {activeBooking.remainingAmount > 0 ? (
              <form onSubmit={handleRecordPayment} className="p-4 bg-rose-50/40 rounded-2xl border border-rose-100 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record An Installment Payment</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Payment Amount ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      max={activeBooking.remainingAmount}
                      step="0.01"
                      placeholder={`Max: ${activeBooking.remainingAmount}`}
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-white border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-white border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-white border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Payment Type
                    </label>
                    <select
                      value={paymentForm.paymentType}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-white border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                    >
                      {PAYMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Notes / Reference (Optional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Receipt #1042 via Commercial Bank"
                        value={paymentForm.notes}
                        onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                      />
                      <button
                        type="submit"
                        disabled={submittingPayment}
                        className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-xs"
                      >
                        {submittingPayment ? "Recording..." : "Record Payment"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                <h4 className="font-semibold text-emerald-800 text-xs">Contract Fully Paid!</h4>
                <p className="text-[11px] text-emerald-600">
                  All contracted payments for this vendor have been settled.
                </p>
              </div>
            )}

            {/* Payment History List */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 text-xs flex items-center justify-between">
                <span>Installment Payment History</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {bookingPayments.length} {bookingPayments.length === 1 ? "record" : "records"}
                </span>
              </h4>

              {loadingPayments ? (
                <div className="py-6 text-center text-slate-400 text-xs">Loading payments...</div>
              ) : bookingPayments.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                  No payment records registered yet for this vendor.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {bookingPayments.map((p) => (
                    <div
                      key={p._id}
                      className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs hover:bg-slate-50"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono">
                            {formatCurrency(p.amount)}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            {p.paymentType}
                          </span>
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {p.paymentMethod}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>{formatDate(p.paymentDate)}</span>
                          {p.notes && (
                            <>
                              <span>&bull;</span>
                              <span className="italic">{p.notes}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeletePayment(p._id, p.amount)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete payment and restore balance"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Close */}
            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

