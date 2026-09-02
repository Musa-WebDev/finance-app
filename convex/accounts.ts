import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    return ctx.db.query("accounts").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
  },
});

export const getPlaidItems = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    return ctx.db.query("plaidItems").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
  },
});

export const createManual = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    balance: v.number(),
    institution: v.optional(v.string()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    return ctx.db.insert("accounts", {
      userId: user._id,
      name: args.name,
      type: args.type,
      balance: args.balance,
      institution: args.institution,
      currency: args.currency ?? "USD",
      isManual: true,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const account = await ctx.db.get(args.id);
    if (!account) throw new ConvexError({ message: "Account not found", code: "NOT_FOUND" });
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || account.userId !== user._id) throw new ConvexError({ message: "Forbidden", code: "FORBIDDEN" });
    await ctx.db.delete(args.id);
  },
});
