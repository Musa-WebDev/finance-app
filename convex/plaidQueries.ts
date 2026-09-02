// V8 runtime — internal queries for plaid actions
import { internalQuery } from "./_generated/server.js";
import { v } from "convex/values";

export const getPlaidItemByItemId = internalQuery({
  args: { itemId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("plaidItems")
      .withIndex("by_item_id", (q) => q.eq("itemId", args.itemId))
      .unique();
  },
});
