import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import aiService from "../services/aiService";
import weddingService from "../services/weddingService";
import {
  ArrowLeft,
  Sparkles,
  Send,
  Trash2,
  AlertCircle,
  Calendar,
  DollarSign,
  Bot,
  User,
  Heart,
  HelpCircle,
  LogOut,
  RefreshCw,
  Lightbulb,
} from "lucide-react";

const SUGGESTED_PROMPTS = [
  "What should I prepare first for my wedding?",
  "What tasks should I complete this month?",
  "How can I organize my wedding day?",
  "What should I consider when selecting a wedding venue?",
  "How can I manage my guest list effectively?",
  "What preparations should I complete one week before the wedding?",
  "How should I split my remaining wedding budget?",
  "Can you review my pending tasks and advise what's urgent?",
];

export default function AiAssistant() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Wedding context state
  const [wedding, setWedding] = useState(null);
  const [daysUntil, setDaysUntil] = useState(null);
  const [loadingContext, setLoadingContext] = useState(true);

  // Chat state
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem("wedease_ai_assistant_chat");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      {
        id: "welcome",
        role: "model",
        text: "Hello! I am your WedEase AI Wedding Planning Assistant. I have live access to your wedding profile, budget, tasks, vendors, and timeline. How can I help you plan your dream wedding today?",
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Save chat to session storage
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "wedease_ai_assistant_chat",
        JSON.stringify(messages)
      );
    } catch {
      // ignore
    }
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Load wedding info on mount
  useEffect(() => {
    const fetchWedding = async () => {
      try {
        setLoadingContext(true);
        const data = await weddingService.getMyWedding();
        if (data.success && data.wedding) {
          setWedding(data.wedding);
          if (data.wedding.weddingDate) {
            const diff =
              new Date(data.wedding.weddingDate).getTime() - Date.now();
            setDaysUntil(Math.ceil(diff / (1000 * 60 * 60 * 24)));
          }
        }
      } catch {
        // user may not have wedding profile yet
      } finally {
        setLoadingContext(false);
      }
    };
    fetchWedding();
  }, []);

  const handleSendMessage = async (textToSend) => {
    const query = typeof textToSend === "string" ? textToSend : inputMessage;
    if (!query || !query.trim() || isLoading) return;

    const trimmedQuery = query.trim();
    setError("");
    setInputMessage("");

    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmedQuery,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build lightweight conversation history for the API
      const historyPayload = messages
        .filter((m) => m.id !== "welcome")
        .slice(-8)
        .map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        }));

      const response = await aiService.askWeddingAssistant({
        message: trimmedQuery,
        history: historyPayload,
      });

      if (response && response.success) {
        const aiMsg = {
          id: `ai-${Date.now()}`,
          role: "model",
          text: response.reply,
          isAiGenerated: response.isAiGenerated,
          modelUsed: response.modelUsed,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setError(response?.message || "Failed to receive a response.");
      }
    } catch (err) {
      const errMsg = aiService.getErrorMessage(err);
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const welcome = [
      {
        id: `welcome-${Date.now()}`,
        role: "model",
        text: "Chat cleared! I am ready for your next wedding planning question.",
        timestamp: new Date().toISOString(),
      },
    ];
    setMessages(welcome);
    sessionStorage.removeItem("wedease_ai_assistant_chat");
    setError("");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-rose-100 shadow-sm sticky top-0 z-20">
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
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-serif text-lg font-bold text-slate-800 flex items-center gap-2">
                  AI Wedding Assistant
                  <span className="text-xs font-sans font-medium px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                    Smart Advice
                  </span>
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/ai-budget-advisor"
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
            >
              <DollarSign className="w-3.5 h-3.5 mr-1" />
              AI Budget Advisor
            </Link>
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

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
        {/* Context Strip / Profile Snapshot */}
        <div className="mb-4 bg-white rounded-xl border border-rose-100 shadow-xs p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <Heart className="w-5 h-5 fill-rose-100" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Planning For
              </p>
              <h2 className="text-sm font-semibold text-slate-800">
                {loadingContext
                  ? "Loading couple info..."
                  : wedding
                  ? `${wedding.brideName} & ${wedding.groomName}`
                  : `${user?.name || "Couples"}'s Wedding`}
              </h2>
            </div>
          </div>

          {wedding ? (
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-600">
                <Calendar className="w-4 h-4 text-rose-500" />
                <span>
                  {wedding.weddingDate
                    ? new Date(wedding.weddingDate).toLocaleDateString()
                    : "Date not set"}
                </span>
                {daysUntil !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium ${
                      daysUntil > 0
                        ? "bg-rose-50 text-rose-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {daysUntil > 0
                      ? `${daysUntil} days to go`
                      : daysUntil === 0
                      ? "Today is the big day!"
                      : "Wedding completed"}
                  </span>
                )}
              </div>

              {wedding.totalBudget > 0 && (
                <div className="hidden md:flex items-center space-x-1.5 text-slate-600">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>
                    Budget: ${wedding.totalBudget.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Tip: Complete your{" "}
                <Link
                  to="/wedding-profile"
                  className="underline font-semibold hover:text-amber-900"
                >
                  Wedding Profile
                </Link>{" "}
                for personalized dates and budget analysis!
              </span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearChat}
              className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-rose-600 transition px-2.5 py-1.5 rounded-lg hover:bg-rose-50 border border-slate-200 hover:border-rose-200"
              title="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear Chat
            </button>
          </div>
        </div>

        {/* Chat Card */}
        <div className="flex-1 bg-white rounded-2xl border border-rose-100 shadow-sm flex flex-col overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isUser
                        ? "bg-rose-500 text-white"
                        : "bg-rose-100 text-rose-600"
                    }`}
                  >
                    {isUser ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                      isUser
                        ? "bg-rose-600 text-white rounded-tr-none shadow-xs"
                        : "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none shadow-xs"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-200/60 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1 text-rose-600 font-semibold">
                          <Bot className="w-3.5 h-3.5" />
                          WedEase AI
                        </span>
                        <span>
                          {msg.timestamp
                            ? new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                    )}

                    <div className="whitespace-pre-line prose prose-sm max-w-none prose-p:leading-relaxed">
                      {msg.text}
                    </div>

                    {isUser && (
                      <div className="text-[10px] text-rose-200 mt-1 text-right">
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Thinking / Loading indicator */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-4 text-sm text-slate-500 flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
                  <span>WedEase AI is thinking and analyzing your wedding details...</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => setError("")}
                  className="text-red-500 hover:text-red-700 font-semibold"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts Shelf */}
          <div className="p-3 bg-rose-50/50 border-t border-rose-100 overflow-x-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 font-medium">
              <HelpCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Suggested Questions</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-white text-slate-700 border border-rose-200 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700 transition disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask WedEase AI anything about your wedding planning..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
