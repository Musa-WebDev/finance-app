import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  // Plaid Items (one per bank connection)
  plaidItems: defineTable({
    userId: v.id("users"),
    accessToken: v.string(),
    itemId: v.string(),
    institutionId: v.optional(v.string()),
    institutionName: v.optional(v.string()),
    transactionCursor: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_item_id", ["itemId"]),

  // Manual transactions (for now; Plaid transactions will also land here)
  transactions: defineTable({
    userId: v.id("users"),
    name: v.string(),
    amount: v.number(), // positive = income, negative = expense
    category: v.optional(v.string()),
    date: v.string(), // ISO 8601
    accountId: v.optional(v.id("accounts")),
    plaidTransactionId: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_user_category", ["userId", "category"])
    .index("by_plaid_txn", ["plaidTransactionId"]),

  // Bank accounts (Plaid or manual)
  accounts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.string(), // "checking" | "savings" | "credit" | "investment" | "loan"
    balance: v.number(),
    institution: v.optional(v.string()),
    plaidAccountId: v.optional(v.string()),
    plaidItemId: v.optional(v.string()),
    currency: v.optional(v.string()),
    isManual: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_plaid_account", ["plaidAccountId"]),

  // Net worth snapshots (taken monthly)
  netWorthSnapshots: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-01
    netWorth: v.number(),
    assets: v.number(),
    liabilities: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  // Budget scenarios
  budgetScenarios: defineTable({
    userId: v.id("users"),
    name: v.string(),
    monthlyIncome: v.number(),
    isActive: v.boolean(),
    notes: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // Budget line items per scenario
  budgetItems: defineTable({
    userId: v.id("users"),
    scenarioId: v.id("budgetScenarios"),
    category: v.string(),
    label: v.string(),
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense")),
    frequency: v.string(), // "monthly" | "weekly" | "annual"
  }).index("by_scenario", ["scenarioId"]).index("by_user", ["userId"]),

  // Investment plans
  investments: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.string(), // "stock" | "etf" | "side_hustle" | "savings_goal"
    currentValue: v.number(),
    targetValue: v.optional(v.number()),
    monthlyContribution: v.number(),
    annualReturnRate: v.number(), // e.g. 0.07 = 7%
    startDate: v.string(),
    targetDate: v.optional(v.string()),
    ticker: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_user", ["userId"]),
});
