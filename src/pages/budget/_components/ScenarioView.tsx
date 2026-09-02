import { useBudgetItems, useUpdateScenario, type BudgetScenario } from "@/lib/finance.ts";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Trash2,
  Plus,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { motion } from "motion/react";
import BudgetItemRow from "./BudgetItemRow.tsx";
import AddBudgetItemDialog from "./AddBudgetItemDialog.tsx";

type Props = {
  scenario: BudgetScenario;
  onSetActive: () => void;
  onDelete: () => void;
};

const EXPENSE_COLORS = [
  "oklch(0.5 0.2 260)",
  "oklch(0.55 0.18 170)",
  "oklch(0.7 0.15 85)",
  "oklch(0.6 0.2 30)",
  "oklch(0.65 0.18 310)",
  "oklch(0.58 0.2 200)",
  "oklch(0.72 0.16 50)",
];

export default function ScenarioView({ scenario, onSetActive, onDelete }: Props) {
  const { data: items } = useBudgetItems(scenario.id);
  const updateScenario = useUpdateScenario();

  const [showAdd, setShowAdd] = useState(false);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeValue, setIncomeValue] = useState(scenario.monthly_income.toString());

  // Normalize all amounts to monthly
  const toMonthly = (amount: number, freq: string) => {
    if (freq === "weekly") return amount * 52 / 12;
    if (freq === "annual") return amount / 12;
    return amount;
  };

  const expenses = (items ?? []).filter((i) => i.type === "expense");
  const extraIncome = (items ?? []).filter((i) => i.type === "income");

  const totalExpenses = expenses.reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0);
  const totalExtraIncome = extraIncome.reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0);
  const totalIncome = scenario.monthly_income + totalExtraIncome;
  const cashFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (cashFlow / totalIncome) * 100 : 0;

  const pieData = expenses
    .filter((i) => i.amount > 0)
    .map((i) => ({ name: i.label, value: toMonthly(i.amount, i.frequency) }));

  const barData = [
    { name: "Income", value: totalIncome, fill: "oklch(0.55 0.18 170)" },
    { name: "Expenses", value: totalExpenses, fill: "oklch(0.6 0.2 30)" },
    { name: "Remaining", value: Math.max(cashFlow, 0), fill: "oklch(0.5 0.2 260)" },
  ];

  const handleSaveIncome = async () => {
    const val = parseFloat(incomeValue);
    if (isNaN(val)) return;
    try {
      await updateScenario.mutateAsync({ id: scenario.id, monthly_income: val });
      toast.success("Income updated.");
    } catch {
      toast.error("Failed to update income.");
    }
    setEditingIncome(false);
  };

  return (
    <div className="space-y-6">
      {/* Scenario Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border bg-card">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold truncate">{scenario.name}</h2>
            {scenario.is_active && (
              <Badge className="bg-accent/10 text-accent border-accent/20 text-xs">Active</Badge>
            )}
          </div>
          {scenario.notes && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{scenario.notes}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {!scenario.is_active && (
            <Button size="sm" variant="secondary" onClick={onSetActive}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Set Active
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Monthly Income", value: totalIncome, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Monthly Expenses", value: totalExpenses, icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Cash Flow", value: cashFlow, icon: ArrowRight, color: cashFlow >= 0 ? "text-primary" : "text-destructive", bg: cashFlow >= 0 ? "bg-primary/10" : "bg-destructive/10" },
          { label: "Savings Rate", value: null, icon: ArrowRight, color: savingsRate >= 20 ? "text-green-500" : "text-yellow-500", bg: savingsRate >= 20 ? "bg-green-500/10" : "bg-yellow-500/10" },
        ].map(({ label, value, color, bg }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.3, ease: "easeOut" }}>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-xl font-bold mt-0.5 ${color}`}>
                  {value !== null ? fmt(value) : `${savingsRate.toFixed(1)}%`}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Expense Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Add expense amounts to see breakdown.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => fmt(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {pieData.length > 0 && (
              <div className="space-y-1 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }} />
                      <span className="truncate text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-medium">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 10%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip formatter={(v: unknown) => fmt(Number(v))} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Income editor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Take-Home Income</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              {editingIncome ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={incomeValue}
                    onChange={(e) => setIncomeValue(e.target.value)}
                    className="text-2xl font-bold h-10"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveIncome} className="h-8 w-8 text-green-500">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => { setIncomeValue(scenario.monthly_income.toString()); setEditingIncome(false); }} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setEditingIncome(true)}>
                  <p className="text-3xl font-bold text-green-500">{fmt(scenario.monthly_income)}</p>
                  <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Click to edit</p>
            </div>

            {/* Annual projection */}
            <div className="border-t pt-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Annual income</span>
                <span className="font-medium">{fmt(totalIncome * 12)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Annual expenses</span>
                <span className="font-medium text-destructive">{fmt(totalExpenses * 12)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-1.5">
                <span className="text-muted-foreground font-medium">Annual savings</span>
                <span className={`font-bold ${cashFlow >= 0 ? "text-green-500" : "text-destructive"}`}>{fmt(cashFlow * 12)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Budget Line Items</CardTitle>
          <Button size="sm" variant="secondary" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          {(items ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No items yet.</p>
          ) : (
            <>
              {/* Income items */}
              {extraIncome.length > 0 && (
                <div className="space-y-1 pb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-2 pt-1">Additional Income</p>
                  {extraIncome.map((item) => (
                    <BudgetItemRow key={item.id} item={item} />
                  ))}
                </div>
              )}
              {/* Expense items */}
              <div className="space-y-1">
                {extraIncome.length > 0 && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-2 pt-1">Expenses</p>
                )}
                {expenses.map((item) => (
                  <BudgetItemRow key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AddBudgetItemDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        scenarioId={scenario.id}
      />
    </div>
  );
}

function fmt(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
