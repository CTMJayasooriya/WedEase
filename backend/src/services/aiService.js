import Wedding from "../models/Wedding.js";
import Task from "../models/Task.js";
import Expense from "../models/Expense.js";
import Booking from "../models/Booking.js";
import Guest from "../models/Guest.js";
import Timeline from "../models/Timeline.js";

// Helper to call Google Gemini API with fallback models
export const callGeminiAPI = async (systemInstruction, userPrompt, history = []) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim() || apiKey === "your_gemini_api_key_here") {
    return {
      success: false,
      isApiKeyMissing: true,
      error: "GEMINI_API_KEY is not configured in backend/.env",
    };
  }

  // Format history for Gemini API
  const contents = [];

  if (Array.isArray(history) && history.length > 0) {
    history.forEach((msg) => {
      if (msg.role === "user" || msg.role === "model") {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text || msg.content || "" }],
        });
      }
    });
  }

  // Append current user prompt
  contents.push({
    role: "user",
    parts: [{ text: userPrompt }],
  });

  const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const payload = {
        contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn(`Gemini API model ${model} error (${response.status}):`, data.error?.message);
        continue; // Try fallback model
      }

      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I could not generate an answer at this time. Please try asking again.";

      return {
        success: true,
        text,
        modelUsed: model,
      };
    } catch (err) {
      console.warn(`Gemini API connection error with model ${model}:`, err.message);
    }
  }

  return {
    success: false,
    error: "Failed to connect to Gemini API. Please check your network or API key quota.",
  };
};

// Compile full wedding context for a user
export const getUserWeddingContext = async (userId) => {
  const [wedding, tasks, expenses, bookings, guests, timelines] = await Promise.all([
    Wedding.findOne({ user: userId }),
    Task.find({ user: userId }),
    Expense.find({ user: userId }),
    Booking.find({ user: userId }),
    Guest.find({ user: userId }),
    Timeline.find({ user: userId }),
  ]);

  // Tasks metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const highPriorityTasks = tasks
    .filter((t) => t.priority === "High" && t.status !== "Completed")
    .map((t) => t.title);

  // Financials metrics
  const weddingBudget = wedding ? Number(wedding.totalBudget) || 0 : 0;
  const directEstimated = expenses.reduce((s, e) => s + (Number(e.estimatedAmount) || 0), 0);
  const directActual = expenses.reduce((s, e) => s + (Number(e.actualAmount) || 0), 0);

  const activeBookings = bookings.filter((b) => b.bookingStatus !== "Cancelled");
  const vendorTotal = activeBookings.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
  const vendorPaid = activeBookings.reduce((s, b) => s + (Number(b.paidAmount) || 0), 0);
  const vendorPending = activeBookings.reduce((s, b) => s + (Number(b.remainingAmount) || 0), 0);

  const combinedActual = directActual + vendorPaid;
  const combinedCommitted = directEstimated + vendorTotal;
  const remainingBudget = weddingBudget - combinedActual;
  const budgetUsagePercent =
    weddingBudget > 0 ? Math.round((combinedActual / weddingBudget) * 100) : 0;

  // Guest metrics
  const totalGuests = guests.length;
  const acceptedGuests = guests.filter((g) => g.rsvpStatus === "Accepted").length;
  const expectedAttendees = guests
    .filter((g) => g.rsvpStatus === "Accepted")
    .reduce((s, g) => s + (Number(g.numberOfAttendees) || 1), 0);
  const invitationsSent = guests.filter((g) => g.invitationStatus === "Sent").length;
  const targetGuests = wedding ? Number(wedding.estimatedGuestCount) || 0 : 0;

  // Timeline metrics
  const totalTimelineEvents = timelines.length;
  const upcomingEvents = timelines
    .filter((e) => e.status === "Upcoming" || e.status === "In Progress")
    .slice(0, 5)
    .map((e) => `${e.startTime} - ${e.title} (${e.category})`);

  // Vendor list summary
  const bookedVendorSummaries = activeBookings.map(
    (b) => `${b.vendorName} [${b.vendorCategory}] ($${b.totalAmount}, status: ${b.bookingStatus})`
  );

  return {
    wedding,
    metrics: {
      coupleNames:
        wedding && wedding.brideName && wedding.groomName
          ? `${wedding.brideName} & ${wedding.groomName}`
          : "Couple",
      weddingDate: wedding?.weddingDate
        ? new Date(wedding.weddingDate).toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "Not configured yet",
      daysUntilWedding: wedding?.weddingDate
        ? Math.ceil((new Date(wedding.weddingDate) - new Date()) / (1000 * 60 * 60 * 24))
        : null,
      venue: wedding?.venue || "Not selected yet",
      weddingBudget,
      directEstimated,
      directActual,
      vendorTotal,
      vendorPaid,
      vendorPending,
      combinedActual,
      combinedCommitted,
      remainingBudget,
      budgetUsagePercent,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      highPriorityTasks,
      totalGuests,
      acceptedGuests,
      expectedAttendees,
      targetGuests,
      invitationsSent,
      totalTimelineEvents,
      upcomingEvents,
      bookedVendorSummaries,
    },
    raw: {
      tasks,
      expenses,
      bookings: activeBookings,
      guests,
      timelines,
    },
  };
};

