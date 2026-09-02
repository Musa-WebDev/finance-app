import { useNetWorthHistory } from "@/lib/finance.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { format } from "date-fns";

export default function NetWorthChart() {
  const { data, isLoading } = useNetWorthHistory();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Net Worth Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : data.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
            Connect accounts or add transactions to see your net worth history.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.5 0.2 260)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.5 0.2 260)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 10%)" />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => format(new Date(v), "MMM")}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  new Intl.NumberFormat("en-US", { notation: "compact", style: "currency", currency: "USD" }).format(v)
                }
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip
                formatter={(v: unknown) =>
                  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v))
                }
                labelFormatter={(l: unknown) => format(new Date(String(l)), "MMMM yyyy")}
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="oklch(0.5 0.2 260)"
                strokeWidth={2}
                fill="url(#netWorthGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
