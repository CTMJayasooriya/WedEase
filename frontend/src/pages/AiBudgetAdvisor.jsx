import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import aiService from "../services/aiService";
import weddingService from "../services/weddingService";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Sparkles,
  RefreshCw,
  LogOut,
  Printer,
  ShieldAlert,
  Lightbulb,
  Layers,
  Percent,
} from "lucide-react";

export default function AiBudgetAdvisor() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [wedding, setWedding] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  // Fetch initial report and wedding context on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setInitialLoading(true);
        const [weddingRes, advisorRes] = await Promise.allSettled([
          weddingService.getMyWedding(),
          aiService.getBudgetAdvisorReport(),
        ]);

        if (weddingRes.status === "fulfilled" && weddingRes.value?.wedding) {
          setWedding(weddingRes.value.wedding);
        }

        if (advisorRes.status === "fulfilled" && advisorRes.value?.success) {
          setReport(advisorRes.value);
        }
      } catch (err) {
        setError(aiService.getErrorMessage(err));
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Handler to refresh / generate new analysis
  const handleAnalyzeBudget = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await aiService.getBudgetAdvisorReport();
      if (data && data.success) {
        setReport(data);
      } else {
        setError(data?.message || "Failed to generate budget analysis.");
      }
    } catch (err) {
      setError(aiService.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handlePrint = () => {
    window.print();
  };

  // Derive metrics
  const summary = report?.summary || {};
  const totalBudget = summary.totalBudget || wedding?.totalBudget || 0;
  const combinedActual = summary.combinedActual || 0;
  const remainingBudget = summary.remainingBudget || 0;
  const usagePercent =
    totalBudget > 0
      ? Math.min(Math.round((combinedActual / totalBudget) * 100), 999)
      : 0;

  // Determine budget health badge
  let healthColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let healthLabel = "Healthy Budget";
  let healthIcon = CheckCircle2;

  if (usagePercent > 100) {
    healthColor = "bg-red-50 text-red-700 border-red-200";
    healthLabel = "Budget Exceeded";
    healthIcon = ShieldAlert;
  } else if (usagePercent >= 85) {
    healthColor = "bg-amber-50 text-amber-700 border-amber-200";
    healthLabel = "Near Limit Warning";
    healthIcon = AlertTriangle;
  }

  const HealthIcon = healthIcon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-rose-100 shadow-sm sticky top-0 z-20 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-rose-600 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Dashboard
            </Link>
            <span className="text-slate-300">|</span>
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <h1 className="font-serif text-lg font-bold text-slate-800 flex items-center gap-2">
                AI Budget Advisor
                <span className="text-xs font-sans font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Financial Intelligence
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/ai-assistant"
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              AI Wedding Assistant
            </Link>
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              title="Print Report"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              Print Report
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-rose-600 transition p-1.5 rounded-md"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="text-xs font-semibold text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Executive Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Budget */}
          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Total Budget
              </span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold font-serif text-slate-800">
                ${totalBudget.toLocaleString()}
              </span>
              <p className="text-xs text-slate-400 mt-1">
                {wedding ? `${wedding.brideName} & ${wedding.groomName}` : "WedEase"}
              </p>
            </div>
          </div>

          {/* Card 2: Actual Spending */}
          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Actual Spending
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold font-serif text-slate-800">
                ${combinedActual.toLocaleString()}
              </span>
              <p className="text-xs text-slate-400 mt-1">
                Expenses & Paid Vendor Deposits
              </p>
            </div>
          </div>

          {/* Card 3: Remaining Balance */}
          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Remaining Balance
              </span>
              <div
                className={`p-2 rounded-xl ${
                  remainingBudget >= 0
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span
                className={`text-2xl font-bold font-serif ${
                  remainingBudget >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                ${remainingBudget.toLocaleString()}
              </span>
              <p className="text-xs text-slate-400 mt-1">
                {remainingBudget >= 0 ? "Available to allocate" : "Over budget limit"}
              </p>
            </div>
          </div>

          {/* Card 4: Health & Utilization */}
          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Budget Status
              </span>
              <div className={`p-2 rounded-xl border ${healthColor}`}>
                <HealthIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-serif text-slate-800">
                  {usagePercent}%
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full border ${healthColor}`}
                >
                  {healthLabel}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    usagePercent > 100
                      ? "bg-red-500"
                      : usagePercent >= 85
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar: Analyze My Budget */}
        <div className="bg-linear-to-r from-rose-500 via-rose-600 to-amber-600 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <Sparkles className="w-5 h-5 text-amber-200" />
              <h2 className="text-lg font-serif font-bold">
                WedEase AI Financial Optimization Engine
              </h2>
            </div>
            <p className="text-rose-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Analyze your current wedding allocations, identify cost-saving
              tactics, flag high-spending categories, and get a custom roadmap for
              spending your remaining budget wisely.
            </p>
          </div>

          <button
            onClick={handleAnalyzeBudget}
            disabled={loading}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-white text-rose-700 font-semibold hover:bg-rose-50 transition shadow-sm flex items-center justify-center space-x-2 shrink-0 disabled:opacity-60"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-rose-600" : ""}`}
            />
            <span>{loading ? "Analyzing Financials..." : "Analyze My Budget"}</span>
          </button>
        </div>

        {/* Two-Column Layout: Category Breakdown & AI Advisory Output */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Category Breakdown (1 col) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-rose-100 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <PieChart className="w-4 h-4 text-rose-600" />
                  <h3 className="font-serif font-bold text-slate-800 text-sm">
                    Category Breakdown
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Actual vs Est.</span>
              </div>

              {summary.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
                <div className="space-y-3.5">
                  {summary.categoryBreakdown.map((cat, idx) => {
                    const catSpent = cat.actual || 0;
                    const catEst = cat.estimated || 0;
                    const catPct =
                      totalBudget > 0
                        ? Math.round((catSpent / totalBudget) * 100)
                        : 0;

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700 truncate max-w-[150px]">
                            {cat.category}
                          </span>
                          <span className="text-slate-600 font-semibold">
                            ${catSpent.toLocaleString()}
                            <span className="text-slate-400 font-normal ml-1">
                              ({catPct}%)
                            </span>
                          </span>
                        </div>

                        {/* Comparative bar */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                          <div
                            className="bg-rose-500 h-full rounded-full"
                            style={{
                              width: `${Math.min(
                                totalBudget > 0
                                  ? (catSpent / totalBudget) * 100
                                  : 0,
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Est: ${catEst.toLocaleString()}</span>
                          <span>
                            {catSpent > catEst && catEst > 0 ? (
                              <span className="text-amber-600 font-medium">
                                +${(catSpent - catEst).toLocaleString()} over est.
                              </span>
                            ) : (
                              `Paid deposits: $${(cat.vendorPaid || 0).toLocaleString()}`
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p>No category expenses recorded yet.</p>
                  <p className="mt-1">
                    Add items in{" "}
                    <Link
                      to="/budget"
                      className="text-rose-600 underline font-medium"
                    >
                      Budget & Expenses
                    </Link>{" "}
                    or Book Vendors.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Links Card */}
            <div className="bg-rose-50/60 rounded-2xl border border-rose-200/70 p-5 space-y-3">
              <h4 className="font-serif font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-rose-600" />
                Budget Action Links
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Need to add expenses or adjust contractor quotes?
              </p>
              <div className="flex flex-col gap-2 pt-1 text-xs">
                <Link
                  to="/budget"
                  className="px-3 py-2 bg-white rounded-lg border border-rose-200 text-rose-700 font-medium hover:bg-rose-50 transition flex items-center justify-between"
                >
                  <span>Manage Expenses & Direct Payments</span>
                  <span className="text-slate-400">&rarr;</span>
                </Link>
                <Link
                  to="/vendors"
                  className="px-3 py-2 bg-white rounded-lg border border-rose-200 text-rose-700 font-medium hover:bg-rose-50 transition flex items-center justify-between"
                >
                  <span>Review Vendor Contracts & Deposits</span>
                  <span className="text-slate-400">&rarr;</span>
                </Link>
                <Link
                  to="/wedding-profile"
                  className="px-3 py-2 bg-white rounded-lg border border-rose-200 text-rose-700 font-medium hover:bg-rose-50 transition flex items-center justify-between"
                >
                  <span>Update Total Wedding Budget</span>
                  <span className="text-slate-400">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Column 2: Detailed AI Recommendations Report (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-rose-100 shadow-xs p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-slate-800 text-base">
                      AI Strategic Budget Report
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tailored to your actual WedEase financial ledger
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                    Advisory Only
                  </span>
                </div>
              </div>

              {/* Body */}
              {initialLoading ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin text-rose-500" />
                  <p className="text-sm">Synthesizing budget analysis...</p>
                </div>
              ) : report ? (
                <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
                  {/* Analysis Content formatted */}
                  <div className="whitespace-pre-line prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-slate-800 prose-p:leading-relaxed prose-li:my-1">
                    {report.report || report.analysis}
                  </div>

                  {/* Safety note */}
                  <div className="pt-4 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-500 bg-slate-50 p-3.5 rounded-xl">
                    <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Notice:</strong> WedEase AI provides financial
                      recommendations and projections based on industry averages and
                      your logged expenses. It does not modify your database records,
                      delete line items, or authorize payments.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
                  <p className="text-sm font-medium text-slate-700">
                    No budget analysis generated yet
                  </p>
                  <p className="text-xs text-slate-500">
                    Click the "Analyze My Budget" button above to run a comprehensive
                    financial assessment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

