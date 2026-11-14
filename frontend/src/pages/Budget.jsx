import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import budgetService from "../services/budgetService";
import {
  Heart,
  ArrowLeft,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  LogOut,
  X,
  Sparkles,
  CreditCard,
  PieChart,
  Bot,
} from "lucide-react";

const CATEGORIES = [
  "Venue",
  "Catering",
  "Photography",
  "Videography",
  "Decorations",
  "Wedding Attire",
  "Invitations",
  "Transportation",
  "Entertainment",
  "Other",
];

const PAYMENT_STATUSES = ["Unpaid", "Partially Paid", "Paid"];

export default function Budget() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({
    weddingBudget: 0,
    estimatedTotal: 0,
    actualTotal: 0,
    remainingBudget: 0,
    budgetUsagePercentage: 0,
    isOverBudget: false,
    overBudgetAmount: 0,
    categoryBreakdown: [],
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    category: "Venue",
    estimatedAmount: "",
    actualAmount: "",
    paymentStatus: "Unpaid",
    paymentDate: "",
    notes: "",
  });

  // Fetch expenses with current filters
  const loadExpenses = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const params = {};
      if (categoryFilter !== "All") params.category = categoryFilter;
      if (statusFilter !== "All") params.paymentStatus = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await budgetService.getExpenses(params);
      if (data?.expenses) setExpenses(data.expenses);
      if (data?.summary) setSummary(data.summary);
    } catch (err) {
      setErrorMessage(budgetService.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const params = {};
        if (categoryFilter !== "All") params.category = categoryFilter;
        if (statusFilter !== "All") params.paymentStatus = statusFilter;
        if (searchTerm.trim()) params.search = searchTerm.trim();

        const data = await budgetService.getExpenses(params);
        if (isMounted) {
          if (data?.expenses) setExpenses(data.expenses);
          if (data?.summary) setSummary(data.summary);
        }
      } catch (err) {
        if (isMounted) setErrorMessage(budgetService.getErrorMessage(err));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, [categoryFilter, statusFilter, searchTerm]);

  // Open modal for new expense
  const handleOpenAddModal = () => {
    setEditingExpenseId(null);
    setExpenseForm({
      title: "",
      category: "Venue",
      estimatedAmount: "",
      actualAmount: "",
      paymentStatus: "Unpaid",
      paymentDate: "",
      notes: "",
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  // Open modal for editing existing expense
  const handleOpenEditModal = (expense) => {
    setEditingExpenseId(expense._id);
    setExpenseForm({
      title: expense.title || "",
      category: expense.category || "Other",
      estimatedAmount: expense.estimatedAmount?.toString() || "",
      actualAmount: expense.actualAmount?.toString() || "",
      paymentStatus: expense.paymentStatus || "Unpaid",
      paymentDate: expense.paymentDate
        ? new Date(expense.paymentDate).toISOString().split("T")[0]
        : "",
      notes: expense.notes || "",
    });
    setErrorMessage("");
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.title.trim()) {
      setErrorMessage("Please enter an expense title.");
      return;
    }

    if (expenseForm.estimatedAmount === "" || Number(expenseForm.estimatedAmount) < 0) {
      setErrorMessage("Please enter a valid estimated amount (0 or greater).");
      return;
    }

    if (expenseForm.actualAmount !== "" && Number(expenseForm.actualAmount) < 0) {
      setErrorMessage("Actual amount cannot be negative.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        title: expenseForm.title.trim(),
        category: expenseForm.category,
        estimatedAmount: Number(expenseForm.estimatedAmount),
        actualAmount: expenseForm.actualAmount !== "" ? Number(expenseForm.actualAmount) : 0,
        paymentStatus: expenseForm.paymentStatus,
        paymentDate: expenseForm.paymentDate || null,
        notes: expenseForm.notes.trim(),
      };

      if (editingExpenseId) {
        await budgetService.updateExpense(editingExpenseId, payload);
        setSuccessMessage("Expense updated successfully!");
      } else {
        await budgetService.createExpense(payload);
        setSuccessMessage("Expense added to your budget!");
      }

      setIsModalOpen(false);
      await loadExpenses();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setErrorMessage(budgetService.getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await budgetService.deleteExpense(id);
      setSuccessMessage("Expense deleted successfully.");
      await loadExpenses();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setErrorMessage(budgetService.getErrorMessage(err));
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
              <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                Budget & Expenses
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold mb-2">
              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
              <span>Financial Master Plan</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
              Wedding Budget & Expense Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Track your estimated allowances against real payments across every wedding category.
              Avoid surprise costs and keep your celebrations on budget.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Overspending Warning Banner */}
        {summary.isOverBudget && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 flex items-start gap-3.5 text-rose-900 animate-fade-in shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <strong className="font-bold text-rose-700">Budget Overspending Warning:</strong>{" "}
              Your actual expenses (${summary.actualTotal.toLocaleString()}) have exceeded your target
              wedding budget (${summary.weddingBudget.toLocaleString()}) by{" "}
              <strong className="underline decoration-rose-500 font-bold">
                ${summary.overBudgetAmount.toLocaleString()}
              </strong>
              . Review your upcoming categories below to identify possible cost-saving adjustments.
            </div>
          </div>
        )}

        {/* Global Success / Error Alerts */}
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

        {/* 1. Summary Cards (Total Budget, Estimated, Actual, Remaining, Usage) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Budget */}
          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Target Budget
            </span>
            <div className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
              ${Number(summary.weddingBudget).toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Configured in Profile</span>
          </div>

          {/* Estimated Total */}
          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block mb-1">
              Estimated Total
            </span>
            <div className="text-xl sm:text-2xl font-serif font-bold text-amber-600">
              ${Number(summary.estimatedTotal).toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Sum of planned costs</span>
          </div>

          {/* Actual Total */}
          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block mb-1">
              Actual Spending
            </span>
            <div className="text-xl sm:text-2xl font-serif font-bold text-rose-600">
              ${Number(summary.actualTotal).toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Actual costs recorded</span>
          </div>

          {/* Remaining Budget */}
          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs">
            <span
              className={`text-xs font-semibold uppercase tracking-wider block mb-1 ${
                summary.remainingBudget < 0 ? "text-rose-600" : "text-emerald-700"
              }`}
            >
              Remaining Budget
            </span>
            <div
              className={`text-xl sm:text-2xl font-serif font-bold ${
                summary.remainingBudget < 0 ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {summary.remainingBudget < 0 ? "-" : ""}$
              {Math.abs(summary.remainingBudget).toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {summary.remainingBudget < 0 ? "Deficit amount" : "Available funds"}
            </span>
          </div>

          {/* Budget Usage % */}
          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs col-span-2 lg:col-span-1">
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider block mb-1">
              Budget Usage
            </span>
            <div className="text-xl sm:text-2xl font-serif font-bold text-purple-600">
              {summary.budgetUsagePercentage}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  summary.isOverBudget
                    ? "bg-rose-600"
                    : summary.budgetUsagePercentage > 80
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{
                  width: `${Math.min(summary.budgetUsagePercentage, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* 2. Category Breakdown & Comparison */}
        {summary.categoryBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-rose-600" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Category Spending Breakdown & Variance
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {summary.categoryBreakdown.length} Active Categories
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.categoryBreakdown.map((cat) => {
                const diff = cat.actual - cat.estimated;
                const isOver = diff > 0;
                return (
                  <div
                    key={cat.category}
                    className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-800 text-sm">
                          {cat.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {cat.count} {cat.count === 1 ? "expense" : "expenses"}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs mb-1">
                        <span className="text-slate-500">Actual: ${cat.actual.toLocaleString()}</span>
                        <span className="text-slate-400">Est: ${cat.estimated.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            isOver ? "bg-rose-500" : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${
                              cat.estimated > 0
                                ? Math.min(Math.round((cat.actual / cat.estimated) * 100), 100)
                                : 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Variance:</span>
                      <span
                        className={`font-semibold ${
                          isOver ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        {isOver ? `+$${diff.toLocaleString()} over` : `-$${Math.abs(diff).toLocaleString()} under`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Search & Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3 justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search expenses by title or note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-rose-400"
            />
          </div>

          {/* Category & Status Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-rose-400"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-rose-400"
            >
              <option value="All">All Statuses</option>
              {PAYMENT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Expense Table & Cards */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 border border-rose-100 text-center shadow-xs">
            <div className="inline-block w-8 h-8 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-600 font-serif">
              Loading wedding expenses...
            </p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-rose-100 text-center shadow-xs max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-base font-serif font-bold text-slate-900 mb-1">
              No expenses recorded yet
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Start logging your venue, catering, and vendor payments to keep track of real expenses.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Expense</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">Expense Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Estimated</th>
                    <th className="py-3 px-4 text-right">Actual Paid</th>
                    <th className="py-3 px-4 text-center">Payment Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((item) => {
                    const diff = item.actualAmount - item.estimatedAmount;
                    const isOver = diff > 0 && item.estimatedAmount > 0;
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          {item.notes && (
                            <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs truncate">
                              {item.notes}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                          ${Number(item.estimatedAmount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                          ${Number(item.actualAmount).toLocaleString()}
                          {isOver && (
                            <span className="block text-[10px] text-rose-600 font-normal">
                              (+${diff.toLocaleString()})
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              item.paymentStatus === "Paid"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : item.paymentStatus === "Partially Paid"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {item.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Expense"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(item._id, item.title)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. AI Budget Advisor Preparation Section (Clear architecture standby) */}
        <div className="bg-gradient-to-br from-white via-rose-50/30 to-amber-50/40 rounded-3xl p-6 sm:p-8 border border-rose-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-rose-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  AI Budget Advisor
                </h3>
                <p className="text-xs text-slate-500">
                  Intelligent Wedding Financial Optimization &bull; Framework Standby
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold self-start sm:self-auto">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Ready for AI API Integration</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            The AI Budget Advisor structure has been pre-configured to analyze your live MongoDB
            expenses once connected to an LLM endpoint. When active, it will automatically deliver:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-white/90 rounded-2xl border border-rose-100 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs mb-2">
                1
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">
                Category Allocations
              </h4>
              <p className="text-slate-500 leading-normal">
                Compare allocations against global wedding benchmarks (e.g. 40% venue & food).
              </p>
            </div>

            <div className="p-4 bg-white/90 rounded-2xl border border-rose-100 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs mb-2">
                2
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">
                Variance Analysis
              </h4>
              <p className="text-slate-500 leading-normal">
                Identify discrepancies between early estimates and finalized vendor contracts.
              </p>
            </div>

            <div className="p-4 bg-white/90 rounded-2xl border border-rose-100 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs mb-2">
                3
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">
                Overspending Alerts
              </h4>
              <p className="text-slate-500 leading-normal">
                Proactively flag categories exceeding safe spending thresholds before final booking.
              </p>
            </div>

            <div className="p-4 bg-white/90 rounded-2xl border border-rose-100 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs mb-2">
                4
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">
                Cost-Saving Tips
              </h4>
              <p className="text-slate-500 leading-normal">
                Generate tailored negotiations, off-peak date alternatives, and package recommendations.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Expense Modal (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-rose-100 overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/40">
              <h2 className="text-base font-serif font-bold text-slate-900">
                {editingExpenseId ? "Edit Expense" : "Add Wedding Expense"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Expense Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reception DJ & Sound System"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-rose-400 focus:ring-3 focus:ring-rose-100 transition-all"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-rose-400"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amounts Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Estimated Amount ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    placeholder="e.g. 1500"
                    value={expenseForm.estimatedAmount}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, estimatedAmount: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Actual Amount ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="e.g. 1450"
                    value={expenseForm.actualAmount}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, actualAmount: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Payment Status & Payment Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={expenseForm.paymentStatus}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, paymentStatus: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-rose-400"
                  >
                    {PAYMENT_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={expenseForm.paymentDate}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, paymentDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Notes / Vendor Terms
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. 50% deposit paid on booking, remaining due 2 weeks before..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-rose-400"
                />
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
                  {submitting ? "Saving..." : editingExpenseId ? "Update Expense" : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
