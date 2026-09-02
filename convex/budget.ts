import { mutation, query } from "./_generated/server.js";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server.js";

async function getUserFromCtx(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

// ── Scenarios ──────────────────────────────────────────────────

export const listScenarios = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserFromCtx(ctx);
    if (!user) return [];
    return ctx.db
      .query("budgetScenarios")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const createScenario = mutation({
  args: {
    name: v.string(),
    monthlyIncome: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    // Deactivate existing active scenario if making a new one
    const existing = await ctx.db
      .query("budgetScenarios")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const isFirst = existing.length === 0;

    const id = await ctx.db.insert("budgetScenarios", {
      userId: user._id,
      name: args.name,
      monthlyIncome: args.monthlyIncome,
      isActive: isFirst,
      notes: args.notes,
    });

    // Seed default expense categories for new scenario
    const defaults = [
      { category: "housing", label: "Rent / Mortgage", amount: 0, type: "expense" as const, frequency: "monthly" },
      { category: "transport", label: "Transport", amount: 0, type: "expense" as const, frequency: "monthly" },
      { category: "food", label: "Groceries & Dining", amount: 0, type: "expense" as const, frequency: "monthly" },
      { category: "health", label: "Health & Medical", amount: 0, type: "expense" as const, frequency: "monthly" },
      { category: "entertainment", label: "Entertainment", amount: 0, type: "expense" as const, frequency: "monthly" },
      { category: "savings", label: "Savings", amount: 0, type: "expense" as const, frequency: "monthly" },
      { category: "other", label: "Other", amount: 0, type: "expense" as const, frequency: "monthly" },
    ];
    for (const d of defaults) {
      await ctx.db.insert("budgetItems", { userId: user._id, scenarioId: id, ...d });
    }

    return id;
  },
});

export const updateScenario = mutation({
  args: {
    id: v.id("budgetScenarios"),
    name: v.optional(v.string()),
    monthlyIncome: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const scenario = await ctx.db.get(id);
    if (!scenario) throw new ConvexError({ message: "Not found", code: "NOT_FOUND" });
    await ctx.db.patch(id, fields);
  },
});

export const setActiveScenario = mutation({
  args: { id: v.id("budgetScenarios") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    const all = await ctx.db
      .query("budgetScenarios")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const s of all) {
      await ctx.db.patch(s._id, { isActive: s._id === args.id });
    }
  },
});

export const deleteScenario = mutation({
  args: { id: v.id("budgetScenarios") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    // Delete all items first
    const items = await ctx.db
      .query("budgetItems")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.id))
      .collect();
    for (const item of items) await ctx.db.delete(item._id);
    await ctx.db.delete(args.id);
  },
});

// ── Budget Items ────────────────────────────────────────────────

export const listItems = query({
  args: { scenarioId: v.id("budgetScenarios") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("budgetItems")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .collect();
  },
});

export const upsertItem = mutation({
  args: {
    id: v.optional(v.id("budgetItems")),
    scenarioId: v.id("budgetScenarios"),
    category: v.string(),
    label: v.string(),
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense")),
    frequency: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    const { id, ...fields } = args;
    if (id) {
      await ctx.db.patch(id, fields);
      return id;
    }
    return ctx.db.insert("budgetItems", { ...fields, userId: user._id });
  },
});

export const deleteItem = mutation({
  args: { id: v.id("budgetItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
