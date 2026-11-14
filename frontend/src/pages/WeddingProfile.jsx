import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import weddingService from "../services/weddingService";
import {
  Heart,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  FileText,
  User,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from "lucide-react";

export default function WeddingProfile() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    brideName: "",
    groomName: "",
    weddingDate: "",
    venue: "",
    estimatedGuestCount: "",
    totalBudget: "",
    description: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [hasExistingWedding, setHasExistingWedding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchWeddingDetails = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const data = await weddingService.getMyWedding();
        if (isMounted && data?.wedding) {
          const w = data.wedding;
          setHasExistingWedding(true);
          // Format weddingDate to YYYY-MM-DD for HTML date input
          const formattedDate = w.weddingDate
            ? new Date(w.weddingDate).toISOString().split("T")[0]
            : "";

          setFormData({
            brideName: w.brideName || "",
            groomName: w.groomName || "",
            weddingDate: formattedDate,
            venue: w.venue || "",
            estimatedGuestCount: w.estimatedGuestCount?.toString() || "",
            totalBudget: w.totalBudget?.toString() || "",
            description: w.description || "",
          });
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(weddingService.getErrorMessage(err));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWeddingDetails();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  };

  const validateForm = () => {
    const {
      brideName,
      groomName,
      weddingDate,
      venue,
      estimatedGuestCount,
      totalBudget,
    } = formData;

    if (!brideName.trim()) return "Please enter the Bride's Name.";
    if (!groomName.trim()) return "Please enter the Groom's Name.";
    if (!weddingDate) return "Please choose your Wedding Date.";
    if (!venue.trim()) return "Please enter the Wedding Venue.";

    if (!estimatedGuestCount || isNaN(Number(estimatedGuestCount)) || Number(estimatedGuestCount) <= 0) {
      return "Estimated Guest Count must be a positive number (at least 1).";
    }

    if (totalBudget === "" || isNaN(Number(totalBudget)) || Number(totalBudget) < 0) {
      return "Total Budget must be a non-negative number (0 or higher).";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        brideName: formData.brideName.trim(),
        groomName: formData.groomName.trim(),
        weddingDate: formData.weddingDate,
        venue: formData.venue.trim(),
        estimatedGuestCount: Number(formData.estimatedGuestCount),
        totalBudget: Number(formData.totalBudget),
        description: formData.description.trim(),
      };

      const res = await weddingService.updateMyWedding(payload);

      setHasExistingWedding(true);
      setSuccessMessage(
        res.message || "Wedding profile saved successfully! Your dashboard has been updated."
      );

      // Scroll to top smoothly so the user sees the confirmation banner
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorMessage(weddingService.getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/60 via-slate-50 to-amber-50/40 text-slate-800 flex flex-col">
      {/* Top Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-rose-100/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
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

      {/* Main Content Form */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Page Hero Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Wedding Details & Master Plan</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
            {hasExistingWedding ? "Edit Wedding Profile" : "Set Up Your Wedding Profile"}
          </h1>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed max-w-2xl">
            Enter your key wedding details below. These values will personalize your WedEase
            dashboard, calculate your live countdown, and configure your budget and guest milestones.
          </p>
        </div>

        {/* Loading State Skeleton */}
        {loading ? (
          <div className="bg-white rounded-3xl p-10 border border-rose-100 shadow-sm text-center">
            <div className="inline-block w-9 h-9 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-600 font-serif">
              Loading your wedding profile...
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl shadow-rose-950/5 border border-rose-100/90 overflow-hidden">
            {/* Banner Messages */}
            <div className="p-6 sm:p-8 pb-0">
              {successMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-sm animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{successMessage}</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      You can return to the{" "}
                      <Link
                        to="/dashboard"
                        className="underline font-bold hover:text-emerald-900"
                      >
                        Dashboard
                      </Link>{" "}
                      to view your updated countdown, budget, and guest overview.
                    </p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-snug font-medium">{errorMessage}</div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 pt-2 space-y-6">
              {/* Couple Names Section */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-4 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-rose-600" />
                  <span>Couple Information</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bride's Name */}
                  <div>
                    <label
                      htmlFor="brideName"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                      Bride's Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative rounded-xl">
                      <input
                        id="brideName"
                        name="brideName"
                        type="text"
                        required
                        placeholder="e.g. Elena Gilbert"
                        value={formData.brideName}
                        onChange={handleChange}
                        className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:ring-3 focus:ring-rose-100 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Groom's Name */}
                  <div>
                    <label
                      htmlFor="groomName"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                      Groom's Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative rounded-xl">
                      <input
                        id="groomName"
                        name="groomName"
                        type="text"
                        required
                        placeholder="e.g. Stefan Salvatore"
                        value={formData.groomName}
                        onChange={handleChange}
                        className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:ring-3 focus:ring-rose-100 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Date & Venue Section */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-4 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-rose-600" />
                  <span>Date & Location</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Wedding Date */}
                  <div>
                    <label
                      htmlFor="weddingDate"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                      Wedding Date <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative rounded-xl">
                      <input
                        id="weddingDate"
                        name="weddingDate"
                        type="date"
                        required
                        value={formData.weddingDate}
                        onChange={handleChange}
                        className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-rose-400 focus:ring-3 focus:ring-rose-100 transition-all text-sm"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Used to calculate the live countdown on your dashboard.
                    </span>
                  </div>

                  {/* Wedding Venue */}
                  <div>
                    <label
                      htmlFor="venue"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                      Wedding Venue <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative rounded-xl">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <input
                        id="venue"
                        name="venue"
                        type="text"
                        required
                        placeholder="e.g. Grand Oaks Botanical Gardens, CA"
                        value={formData.venue}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:ring-3 focus:ring-rose-100 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Guests & Budget Section */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-4 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span>Guests & Financial Target</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Estimated Guest Count */}
                  <div>
                    <label
                      htmlFor="estimatedGuestCount"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                      Estimated Guest Count <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative rounded-xl">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Users className="h-4 w-4" />
                      </div>
                      <input
                        id="estimatedGuestCount"
                        name="estimatedGuestCount"
                        type="number"
                        min="1"
                        step="1"
                        required
                        placeholder="e.g. 150"
                        value={formData.estimatedGuestCount}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:ring-3 focus:ring-rose-100 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Total Wedding Budget */}
                  <div>
                    <label
                      htmlFor="totalBudget"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                      Total Wedding Budget ($) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative rounded-xl">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <input
                        id="totalBudget"
                        name="totalBudget"
                        type="number"
                        min="0"
                        step="100"
                        required
                        placeholder="e.g. 30000"
                        value={formData.totalBudget}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:ring-3 focus:ring-rose-100 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Wedding Description (Optional) */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Wedding Vision & Notes
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal lowercase">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  placeholder="Share a few notes about your theme, colors, or general vision for your special day..."
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-rose-400 focus:ring-3 focus:ring-rose-100 transition-all text-sm"
                />
              </div>

              {/* Submit & Navigation Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Dashboard</span>
                </Link>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-7 rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-60 transition-all cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Wedding Details...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Wedding Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
