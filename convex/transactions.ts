import { mutation, query } from "./_generated/server.js";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];

    return ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 10);
  },
});

export const getAll = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { page: [], isDone: true, continueCursor: "" };

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return { page: [], isDone: true, continueCursor: "" };

    return ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    date: v.string(),
    accountId: v.optional(v.id("accounts")),
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

    return ctx.db.insert("transactions", {
      userId: user._id,
      name: args.name,
      amount: args.amount,
      category: args.category,
      date: args.date,
      accountId: args.accountId,
      notes: args.notes,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const txn = await ctx.db.get(args.id);
    if (!txn) throw new ConvexError({ message: "Transaction not found", code: "NOT_FOUND" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || txn.userId !== user._id) throw new ConvexError({ message: "Forbidden", code: "FORBIDDEN" });

    await ctx.db.delete(args.id);
  },
});
