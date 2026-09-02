// V8 runtime — internal mutations for plaid actions
import { internalMutation } from "./_generated/server.js";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const savePlaidItem = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    accessToken: v.string(),
    itemId: v.string(),
    institutionId: v.optional(v.string()),
    institutionName: v.optional(v.string()),
    accounts: v.array(v.object({
      plaidAccountId: v.string(),
      name: v.string(),
      officialName: v.optional(v.string()),
      type: v.string(),
      subtype: v.optional(v.string()),
      balance: v.number(),
      currency: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    const existingItem = await ctx.db
      .query("plaidItems")
      .withIndex("by_item_id", (q) => q.eq("itemId", args.itemId))
      .unique();

    let plaidItemDbId: string;
    if (existingItem) {
      await ctx.db.patch(existingItem._id, {
        accessToken: args.accessToken,
        institutionName: args.institutionName,
      });
      plaidItemDbId = existingItem._id;
    } else {
      plaidItemDbId = await ctx.db.insert("plaidItems", {
        userId: user._id,
        accessToken: args.accessToken,
        itemId: args.itemId,
        institutionId: args.institutionId,
        institutionName: args.institutionName,
        transactionCursor: undefined,
      });
    }

    for (const acct of args.accounts) {
      const existing = await ctx.db
        .query("accounts")
        .withIndex("by_plaid_account", (q) => q.eq("plaidAccountId", acct.plaidAccountId))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { balance: acct.balance });
      } else {
        const accountType = mapAccountType(acct.type, acct.subtype ?? "");
        await ctx.db.insert("accounts", {
          userId: user._id,
          name: acct.officialName ?? acct.name,
          type: accountType,
          balance: acct.balance,
          institution: args.institutionName,
          plaidAccountId: acct.plaidAccountId,
          plaidItemId: plaidItemDbId,
          currency: acct.currency,
          isManual: false,
        });
      }
    }
  },
});

export const saveTransactions = internalMutation({
  args: {
    itemId: v.string(),
    newCursor: v.union(v.string(), v.null()),
    transactions: v.array(v.object({
      plaidTransactionId: v.string(),
      name: v.string(),
      amount: v.number(),
      category: v.optional(v.string()),
      date: v.string(),
      plaidAccountId: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const plaidItem = await ctx.db
      .query("plaidItems")
      .withIndex("by_item_id", (q) => q.eq("itemId", args.itemId))
      .unique();
    if (!plaidItem) return;

    if (args.newCursor) {
      await ctx.db.patch(plaidItem._id, { transactionCursor: args.newCursor });
    }

    for (const txn of args.transactions) {
      const account = await ctx.db
        .query("accounts")
        .withIndex("by_plaid_account", (q) => q.eq("plaidAccountId", txn.plaidAccountId))
        .unique();

      const existing = await ctx.db
        .query("transactions")
        .withIndex("by_plaid_txn", (q) => q.eq("plaidTransactionId", txn.plaidTransactionId))
        .unique();
      if (existing) continue;

      await ctx.db.insert("transactions", {
        userId: plaidItem.userId,
        name: txn.name,
        amount: txn.amount,
        category: txn.category,
        date: txn.date,
        accountId: account?._id,
        plaidTransactionId: txn.plaidTransactionId,
      });
    }
  },
});

export const updateAccountBalances = internalMutation({
  args: {
    itemId: v.string(),
    balances: v.array(v.object({
      plaidAccountId: v.string(),
      balance: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    for (const b of args.balances) {
      const account = await ctx.db
        .query("accounts")
        .withIndex("by_plaid_account", (q) => q.eq("plaidAccountId", b.plaidAccountId))
        .unique();
      if (account) {
        await ctx.db.patch(account._id, { balance: b.balance });
      }
    }
  },
});

function mapAccountType(plaidType: string, subtype: string): string {
  if (plaidType === "depository") {
    if (subtype === "savings") return "savings";
    return "checking";
  }
  if (plaidType === "credit") return "credit";
  if (plaidType === "loan" || plaidType === "mortgage") return "loan";
  if (plaidType === "investment" || plaidType === "brokerage") return "investment";
  return "checking";
}
