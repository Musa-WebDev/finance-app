import { useSummary } from "@/lib/finance.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, TrendingUp, CreditCard } from "lucide-react";
import { motion } from "motion/react";
import NetWorthChart from "./NetWorthChart.tsx";
import RecentTransactions from "./RecentTransactions.tsx";

export default function DashboardInner() {
  const { data: summary, isLoading, error } = useSummary();

  const stats = [
    {
      label: "Net Worth",
      value: summary?.netWorth ?? 0,
      change: summary?.netWorthChange ?? 0,
      icon: Wallet,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Monthly Income",
      value: summary?.monthlyIncome ?? 0,
      change: summary?.incomeChange ?? 0,
      icon: ArrowUpRight,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Monthly Expenses",
      value: summary?.monthlyExpenses ?? 0,
      change: summary?.expensesChange ?? 0,
      icon: CreditCard,
      color: "text-destructive",
      bg: "bg-destructive/10",
      invertChange: true,
    },
    {
      label: "Investments",
      value: summary?.investmentValue ?? 0,
      change: summary?.investmentChange ?? 0,
      icon: TrendingUp,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Savings Goals",
      value: summary?.savingsTotal ?? 0,
      change: summary?.savingsChange ?? 0,
      icon: PiggyBank,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm">Your financial snapshot at a glance.</p>
      </div>
      {error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">Could not load your finance data: {error.message}. Confirm the Supabase migration has been applied.</p>}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const positive = stat.invertChange ? stat.change <= 0 : stat.change >= 0;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: "easeOut" }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-7 w-28 mt-1" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {formatCurrency(stat.value)}
                      </div>
                      {stat.change !== 0 && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${positive ? "text-green-500" : "text-destructive"}`}>
                          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(stat.change).toFixed(1)}% from last month
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <NetWorthChart />
        </div>
        <div>
          <RecentTransactions />
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
