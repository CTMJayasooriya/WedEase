import { callGeminiAPI, getUserWeddingContext } from "../services/aiService.js";

// @desc    Chat with AI Wedding Planning Assistant
// @route   POST /api/ai/wedding-assistant
// @access  Private (JWT required)
export const askWeddingAssistant = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question or message is required.",
      });
    }

    // Retrieve user's actual wedding planning context
    const context = await getUserWeddingContext(req.user._id);
    const m = context.metrics;

    const systemInstruction = `You are WedEase AI, an expert, warm, and highly organized wedding planning consultant for the WedEase Wedding Planning Platform.
You are assisting ${m.coupleNames}.

CURRENT USER WEDDING CONTEXT (from WedEase MongoDB database):
- Couple: ${m.coupleNames}
- Wedding Date: ${m.weddingDate} (${m.daysUntilWedding !== null ? `${m.daysUntilWedding} days remaining` : "Date not set yet"})
- Venue: ${m.venue}
- Total Wedding Budget: $${m.weddingBudget.toLocaleString()}
- Combined Actual Spending: $${m.combinedActual.toLocaleString()} ($${m.directActual.toLocaleString()} direct expenses + $${m.vendorPaid.toLocaleString()} paid vendor deposits)
- Remaining Budget: $${m.remainingBudget.toLocaleString()} (${m.budgetUsagePercent}% used)
- Tasks: ${m.totalTasks} total (${m.completedTasks} completed, ${m.inProgressTasks} in progress, ${m.pendingTasks} pending)
- Outstanding High Priority Tasks: ${m.highPriorityTasks.length > 0 ? m.highPriorityTasks.join(", ") : "None"}
- Guests: ${m.totalGuests} listed (${m.acceptedGuests} accepted RSVPs, ${m.expectedAttendees} expected attendees confirmed, target: ${m.targetGuests})
- Invitations Sent: ${m.invitationsSent} of ${m.totalGuests}
- Booked Vendors: ${m.bookedVendorSummaries.length > 0 ? m.bookedVendorSummaries.join("; ") : "No vendors booked yet"}
- Upcoming Day-of Milestones: ${m.upcomingEvents.length > 0 ? m.upcomingEvents.join("; ") : "No day-of events scheduled yet"}

GUIDELINES:
1. Speak warmly, encouragingly, and professionally using wedding industry best practices.
2. Personalize advice using their REAL wedding details above (mention their actual days left, budget figures, venue, and tasks where appropriate).
3. Clearly distinguish actual database values from recommendations or estimates.
4. If a crucial detail is missing (e.g. no venue or wedding date set), gently recommend setting it up in the WedEase Wedding Profile module.
5. Provide concise, actionable bullet points, checklists, or steps.
6. Do not invent fake guest or financial figures. Never claim that you can update their database directly.`;

    const aiResult = await callGeminiAPI(systemInstruction, message.trim(), history || []);

    if (aiResult.success) {
      return res.status(200).json({
        success: true,
        reply: aiResult.text,
        isAiGenerated: true,
        modelUsed: aiResult.modelUsed,
        contextSummary: {
          coupleNames: m.coupleNames,
          weddingDate: m.weddingDate,
          daysUntilWedding: m.daysUntilWedding,
          venue: m.venue,
          budgetRemaining: m.remainingBudget,
          tasksCount: m.totalTasks,
        },
      });
    }

    // Intelligent context-aware fallback if GEMINI_API_KEY is not set or network fails
    const fallbackReply = generateFallbackAssistantReply(message.trim(), m);

    res.status(200).json({
      success: true,
      reply: fallbackReply,
      isAiGenerated: false,
      isApiKeyMissing: aiResult.isApiKeyMissing || false,
      contextSummary: {
        coupleNames: m.coupleNames,
        weddingDate: m.weddingDate,
        daysUntilWedding: m.daysUntilWedding,
        venue: m.venue,
        budgetRemaining: m.remainingBudget,
        tasksCount: m.totalTasks,
      },
    });
  } catch (error) {
    console.error("Wedding Assistant Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to process wedding assistant request.",
      error: error.message,
    });
  }
};

// @desc    Generate personalized budget analysis and recommendations
// @route   POST /api/ai/budget-advisor
// @access  Private (JWT required)
export const getBudgetAdvisorReport = async (req, res) => {
  try {
    const context = await getUserWeddingContext(req.user._id);
    const m = context.metrics;
    const raw = context.raw;

    // Calculate category-wise breakdown combining direct expenses and active vendor bookings
    const categoryMap = {};

    // Standard categories
    const ALL_CATEGORIES = [
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

    ALL_CATEGORIES.forEach((cat) => {
      categoryMap[cat] = {
        category: cat,
        directEstimated: 0,
        directActual: 0,
        vendorCommitted: 0,
        vendorPaid: 0,
        combinedTotal: 0,
        count: 0,
      };
    });

    // Populate direct expenses
    raw.expenses.forEach((e) => {
      const cat = e.category && categoryMap[e.category] ? e.category : "Other";
      categoryMap[cat].directEstimated += Number(e.estimatedAmount) || 0;
      categoryMap[cat].directActual += Number(e.actualAmount) || 0;
      categoryMap[cat].count += 1;
    });

    // Populate vendor bookings
    raw.bookings.forEach((b) => {
      let mappedCat = "Other";
      if (b.vendorCategory === "Wedding Venue") mappedCat = "Venue";
      else if (b.vendorCategory === "Wedding Dress" || b.vendorCategory === "Makeup Artist")
        mappedCat = "Wedding Attire";
      else if (b.vendorCategory === "Decoration") mappedCat = "Decorations";
      else if (b.vendorCategory === "Music and Entertainment") mappedCat = "Entertainment";
      else if (categoryMap[b.vendorCategory]) mappedCat = b.vendorCategory;

      categoryMap[mappedCat].vendorCommitted += Number(b.totalAmount) || 0;
      categoryMap[mappedCat].vendorPaid += Number(b.paidAmount) || 0;
      categoryMap[mappedCat].count += 1;
    });

    // Compute combined category totals
    const categoryBreakdown = Object.values(categoryMap).map((c) => ({
      ...c,
      combinedCommitted: c.directEstimated + c.vendorCommitted,
      combinedActual: c.directActual + c.vendorPaid,
      percentOfBudget:
        m.weddingBudget > 0
          ? Math.round(((c.directActual + c.vendorPaid) / m.weddingBudget) * 100)
          : 0,
    }));

    // Filter categories with activity
    const activeCategories = categoryBreakdown.filter(
      (c) => c.combinedCommitted > 0 || c.combinedActual > 0
    );

    const systemInstruction = `You are the WedEase AI Chief Wedding Budget Advisor.
You provide meticulous, objective, and realistic wedding financial advisory to ${m.coupleNames}.

FINANCIAL AUDIT CONTEXT:
- Master Wedding Budget: $${m.weddingBudget.toLocaleString()}
- Total Direct Expenses: Estimated $${m.directEstimated.toLocaleString()}, Actual Paid $${m.directActual.toLocaleString()}
- Total Vendor Bookings: Contracted $${m.vendorTotal.toLocaleString()}, Paid Deposits $${m.vendorPaid.toLocaleString()}, Remaining Outstanding $${m.vendorPending.toLocaleString()}
- Combined Total Actual Spent to Date: $${m.combinedActual.toLocaleString()}
- Combined Total Committed/Estimated Costs: $${m.combinedCommitted.toLocaleString()}
- Net Remaining Unspent Budget: $${m.remainingBudget.toLocaleString()} (${m.budgetUsagePercent}% utilized)
${m.remainingBudget < 0 ? `⚠️ OVER BUDGET DEFICIT: -$${Math.abs(m.remainingBudget).toLocaleString()}` : ""}

CATEGORY BREAKDOWN (Direct + Vendor):
${activeCategories
  .map(
    (c) =>
      `- ${c.category}: Committed $${c.combinedCommitted.toLocaleString()}, Actual Spent $${c.combinedActual.toLocaleString()} (${c.percentOfBudget}% of budget)`
  )
  .join("\n")}

YOUR MISSION:
Deliver a structured, highly actionable financial report:
1. Executive Budget Health Assessment (Is their spending on track, tight, or in deficit?).
2. High-Spending & Overspending Flags (Highlight categories that exceed healthy wedding ratios, where standard benchmarks are: 40-50% for Venue/Catering, 10-15% Photography/Video, 10% Flowers/Decor, 8-10% Attire/Beauty, 8% Entertainment, 5% buffer).
3. Concrete Cost-Cutting Strategies (Provide 3 to 5 specific, high-impact ways to reduce expenses in their active categories).
4. Remaining Budget Allocation Strategy (How should they divide their remaining $${m.remainingBudget.toLocaleString()} across remaining milestones?).
5. Payment Schedule Advisory (Reviewing their $${m.vendorPending.toLocaleString()} in outstanding vendor balances).

Keep formatting clean with clear markdown headings and bullet points. Never alter financial figures.`;

    const userPrompt = `Please run a comprehensive budget diagnostic for our wedding. Analyze our actual spending of $${m.combinedActual.toLocaleString()} against our $${m.weddingBudget.toLocaleString()} budget, and give us strategic cost-saving recommendations.`;

    const aiResult = await callGeminiAPI(systemInstruction, userPrompt);

    let recommendationsText = "";
    let isAiGenerated = false;

    if (aiResult.success) {
      recommendationsText = aiResult.text;
      isAiGenerated = true;
    } else {
      recommendationsText = generateFallbackBudgetRecommendations(m, activeCategories);
    }

    res.status(200).json({
      success: true,
      isAiGenerated,
      isApiKeyMissing: aiResult.isApiKeyMissing || false,
      metrics: {
        weddingBudget: m.weddingBudget,
        directEstimated: m.directEstimated,
        directActual: m.directActual,
        vendorTotal: m.vendorTotal,
        vendorPaid: m.vendorPaid,
        vendorPending: m.vendorPending,
        combinedActual: m.combinedActual,
        combinedCommitted: m.combinedCommitted,
        remainingBudget: m.remainingBudget,
        budgetUsagePercent: m.budgetUsagePercent,
        isOverBudget: m.remainingBudget < 0,
        overBudgetAmount: m.remainingBudget < 0 ? Math.abs(m.remainingBudget) : 0,
      },
      categoryBreakdown,
      aiRecommendations: recommendationsText,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Budget Advisor Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate budget advisor analysis.",
      error: error.message,
    });
  }
};

// Fallback rule-based responses if GEMINI_API_KEY is not set or network is offline
function generateFallbackAssistantReply(userQuery, m) {
  const q = userQuery.toLowerCase();
  let reply = "";

  if (q.includes("first") || q.includes("start") || q.includes("prepare")) {
    reply = `### Wedding Planning Starting Priorities for ${m.coupleNames}

Based on your current WedEase profile:
- **Wedding Date:** ${m.weddingDate} (${m.daysUntilWedding ? `${m.daysUntilWedding} days left` : "Set in profile"})
- **Venue:** ${m.venue}
- **Budget:** $${m.weddingBudget.toLocaleString()} ($${m.remainingBudget.toLocaleString()} remaining)

**Top Recommended Immediate Steps:**
1. **Lock in Your Ceremony & Reception Venue:** Your venue drives date availability, catering requirements, and maximum guest capacity.
2. **Finalize Master Guest Count:** You currently have **${m.totalGuests} guests listed** (Target: ${m.targetGuests}). Final numbers dictate catering and seating layout.
3. **High-Priority Checklist Tasks:** You have **${m.pendingTasks} pending tasks**. Start with: ${m.highPriorityTasks.slice(0, 3).join(", ") || "Booking lead photographer and catering"}.
4. **Reserve Core Vendors Early:** Popular photographers, videographers, and musical entertainment often book 6–12 months in advance.`;
  } else if (q.includes("month") || q.includes("timeline") || q.includes("week")) {
    reply = `### Time-Based Wedding Planning Milestones

With **${m.daysUntilWedding !== null ? `${m.daysUntilWedding} days remaining` : "your wedding upcoming"}**:

- **This Month's Focus:**
  - Review your **${m.totalTasks} total checklist milestones** (you have completed **${m.completedTasks}** so far).
  - Confirm guest RSVP responses (currently **${m.acceptedGuests} confirmed attendees** out of ${m.totalGuests} invited).
  - Settle upcoming vendor installments (you have **$${m.vendorPending.toLocaleString()}** in pending balances).

- **One Month Before Wedding:**
  - Finalize day-of schedule in your **Timeline module** (currently ${m.totalTimelineEvents} events scheduled).
  - Submit final guest headcount and dietary requirements to catering.
  - Schedule final dress and suit fittings.

- **One Week Before Wedding:**
  - Pack wedding-day emergency kit (bobby pins, safety pins, pain relief, breath mints).
  - Confirm arrival times with all booked vendors (${m.bookedVendorSummaries.length} active contracts).
  - Hand off day-of schedule run-sheets to coordinator and bridal party.`;
  } else if (q.includes("budget") || q.includes("cost") || q.includes("expense") || q.includes("money")) {
    reply = `### Financial Snapshot & Budget Advisory for ${m.coupleNames}

- **Total Budget:** $${m.weddingBudget.toLocaleString()}
- **Actual Spending to Date:** $${m.combinedActual.toLocaleString()} (${m.budgetUsagePercent}% of budget)
- **Net Remaining Funds:** $${m.remainingBudget.toLocaleString()}
- **Outstanding Vendor Contracts:** $${m.vendorPending.toLocaleString()}

**Quick Financial Recommendations:**
1. Maintain a **5% to 8% unexpected contingency buffer** from your remaining $${m.remainingBudget.toLocaleString()}.
2. Head over to our **AI Budget Advisor** tab for a complete category-by-category audit and vendor cost-saving strategies.`;
  } else if (q.includes("guest") || q.includes("rsvp") || q.includes("invite")) {
    reply = `### Guest List & Attendance Status

- **Total Guests Listed:** ${m.totalGuests}
- **Confirmed Attending (Accepted):** ${m.acceptedGuests} (${m.expectedAttendees} expected seats)
- **Invitations Dispatched:** ${m.invitationsSent} of ${m.totalGuests}
- **Target Venue Capacity:** ${m.targetGuests}

**Guest Management Tips:**
1. Follow up with guests whose RSVP is still Pending to lock down final catering counts.
2. Confirm dietary restrictions in your **Guest module** to give your caterer an accurate allergy breakdown.`;
  } else {
    reply = `### WedEase Planning Recommendations for ${m.coupleNames}

Thank you for your question! Here is an overview based on your current WedEase records:
- **Wedding Date:** ${m.weddingDate} (${m.daysUntilWedding !== null ? `${m.daysUntilWedding} days left` : "Set in profile"})
- **Venue:** ${m.venue}
- **Budget Status:** $${m.remainingBudget.toLocaleString()} remaining out of $${m.weddingBudget.toLocaleString()}
- **Checklist Progress:** ${m.completedTasks} completed out of ${m.totalTasks} tasks
- **Guest Attendance:** ${m.expectedAttendees} confirmed attendees

Feel free to ask me anything about your wedding checklist, vendor hiring, budget distribution, day-of timeline, or guest seating!`;
  }

  reply += `\n\n> *Tip: Configure your \`GEMINI_API_KEY\` in \`backend/.env\` to enable live generative AI responses.*`;
  return reply;
}

// Fallback rule-based budget recommendations if GEMINI_API_KEY is not set or network is offline
function generateFallbackBudgetRecommendations(m, activeCategories) {
  let text = `### WedEase Executive Budget Health Audit

#### 1. Overall Financial Standing
- **Master Wedding Budget:** $${m.weddingBudget.toLocaleString()}
- **Actual Expenditure (Spent to Date):** $${m.combinedActual.toLocaleString()} (${m.budgetUsagePercent}% of budget utilized)
- **Committed Pipeline (Estimated + Contracts):** $${m.combinedCommitted.toLocaleString()}
- **Net Remaining Buffer:** $${m.remainingBudget.toLocaleString()}
${
  m.remainingBudget < 0
    ? `> ⚠️ **OVER BUDGET DEFICIT WARNING:** Your spending exceeds your allocated budget by **$${Math.abs(
        m.remainingBudget
      ).toLocaleString()}**. Immediate cost optimization is recommended.`
    : m.budgetUsagePercent > 85
    ? `> ⚡ **BUDGET NOTICE:** You have utilized over 85% of your total budget. Proceed cautiously with remaining vendor commitments.`
    : `> ✅ **BUDGET HEALTHY:** Your spending is well within your master budget allocation.`
}

#### 2. Category Spending Overview
${
  activeCategories.length > 0
    ? activeCategories
        .map(
          (c) =>
            `- **${c.category}:** $${c.combinedActual.toLocaleString()} actual spent ($${c.combinedCommitted.toLocaleString()} committed), representing **${c.percentOfBudget}%** of your total budget.`
        )
        .join("\n")
    : "- No expense or vendor records entered yet. Add items in Budget Planner and Vendor Bookings to see detailed breakdown."
}

#### 3. Strategic Cost-Saving Recommendations
1. **Venue & Catering Optimization:** Catering and venue usually account for 40–50% of total expenses. Consider buffet or family-style service rather than multi-course plated dinners to save 15–20% on staffing fees.
2. **Floral & Decoration Substitutions:** Repurpose ceremony arch flowers as sweetheart table centerpieces for the reception to avoid paying for dual floral arrangements.
3. **Vendor Bundle Negotiations:** Ask your photographer or DJ if bundling engagement sessions, lighting packages, or photobooths yields a package discount.
4. **Beverage Strategy:** If your venue allows BYO alcohol with a modest corkage fee, sourcing wine and champagne directly from local distributors often cuts beverage costs in half.

#### 4. Allocation of Remaining $${m.remainingBudget.toLocaleString()}
- Reserve **$${Math.round(Math.max(0, m.remainingBudget) * 0.25).toLocaleString()} (25%)** for day-of vendor gratuities, transportation, and last-minute emergency alterations.
- Dedicate remaining funds toward settling your **$${m.vendorPending.toLocaleString()}** in outstanding vendor contracts before event day.

> *Tip: Add your \`GEMINI_API_KEY\` in \`backend/.env\` to activate real-time generative financial analysis tailored specifically to your vendors.*`;

  return text;
}
