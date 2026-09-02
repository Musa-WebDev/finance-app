import { query } from "./_generated/server.js";
import { requireUser } from "./users.js";
import { subMonths, startOfMonth, format } from "date-fns";

export const getSummary = query({
  args: {},
  handler: async (ctx): Promise<{
    netWorth: number;
    netWorthChange: number;
    monthlyIncome: number;
    incomeChange: number;
    monthlyExpenses: number;
    expensesChange: number;
    investmentValue: number;
    investmentChange: number;
    savingsTotal: number;
    savingsChange: number;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        netWorth: 0, netWorthChange: 0,
        monthlyIncome: 0, incomeChange: 0,
        monthlyExpenses: 0, expensesChange: 0,
        investmentValue: 0, investmentChange: 0,
        savingsTotal: 0, savingsChange: 0,
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return {
        netWorth: 0, netWorthChange: 0,
        monthlyIncome: 0, incomeChange: 0,
        monthlyExpenses: 0, expensesChange: 0,
        investmentValue: 0, investmentChange: 0,
        savingsTotal: 0, savingsChange: 0,
      };
    }

    const now = new Date();
    const thisMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const lastMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
    const lastMonthEnd = format(startOfMonth(now), "yyyy-MM-dd");

    // Accounts
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const assets = accounts.filter(a => !["credit", "loan"].includes(a.type)).reduce((s, a) => s + a.balance, 0);
    const liabilities = accounts.filter(a => ["credit", "loan"].includes(a.type)).reduce((s, a) => s + a.balance, 0);
    const netWorth = assets - liabilities;

    // Transactions this month
    const allTxns = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const thisMo = allTxns.filter(t => t.date >= thisMonthStart);
    const lastMo = allTxns.filter(t => t.date >= lastMonthStart && t.date < lastMonthEnd);

    const sumIncome = (txns: typeof allTxns) => txns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const sumExpenses = (txns: typeof allTxns) => txns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

    const monthlyIncome = sumIncome(thisMo);
    const lastMonthIncome = sumIncome(lastMo);
    const monthlyExpenses = sumExpenses(thisMo);
    const lastMonthExpenses = sumExpenses(lastMo);

    const pctChange = (current: number, prev: number) =>
      prev === 0 ? 0 : ((current - prev) / prev) * 100;

    // Investments
    const investments = await ctx.db
      .query("investments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const investmentValue = investments.filter(i => i.type !== "savings_goal").reduce((s, i) => s + i.currentValue, 0);
    const savingsTotal = investments.filter(i => i.type === "savings_goal").reduce((s, i) => s + i.currentValue, 0);

    // Net worth snapshots for change %
    const snapshots = await ctx.db
      .query("netWorthSnapshots")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(2);

    const netWorthChange = snapshots.length >= 2 ? pctChange(snapshots[0].netWorth, snapshots[1].netWorth) : 0;

    return {
      netWorth,
      netWorthChange,
      monthlyIncome,
      incomeChange: pctChange(monthlyIncome, lastMonthIncome),
      monthlyExpenses,
      expensesChange: pctChange(monthlyExpenses, lastMonthExpenses),
      investmentValue,
      investmentChange: 0,
      savingsTotal,
      savingsChange: 0,
    };
  },
});

export const getNetWorthHistory = query({
  args: {},
  handler: async (ctx): Promise<Array<{ date: string; netWorth: number }>> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];

    const snapshots = await ctx.db
      .query("netWorthSnapshots")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id))
      .order("asc")
      .take(12);

    return snapshots.map(s => ({ date: s.date, netWorth: s.netWorth }));
  },
});
