import { useTransactions } from "@/lib/finance.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { format } from "date-fns";
import { cn } from "@/lib/utils.ts";

const CATEGORY_COLORS: Record<string, string> = {
  income: "text-green-500",
  food: "text-orange-400",
  transport: "text-blue-400",
  housing: "text-purple-400",
  entertainment: "text-pink-400",
  health: "text-red-400",
  savings: "text-yellow-400",
  investment: "text-accent",
  other: "text-muted-foreground",
};

export default function RecentTransactions() {
  const { data: txns = [], isLoading } = useTransactions(8);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pb-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))
        ) : txns.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No transactions yet. Connect a bank or add one manually.
          </p>
        ) : (
          txns.map((txn) => (
            <div key={txn.id} className="flex items-center justify-between gap-2 py-1">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{txn.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(txn.date), "MMM d")} · <span className={cn("capitalize", CATEGORY_COLORS[txn.category ?? "other"])}>{txn.category ?? "other"}</span>
                </p>
              </div>
              <span className={cn("text-sm font-semibold tabular-nums", txn.amount >= 0 ? "text-green-500" : "text-destructive")}>
                {txn.amount >= 0 ? "+" : ""}
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(txn.amount)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
