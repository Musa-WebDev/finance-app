import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Plus, TrendingUp, Trash2, Target, CircleDollarSign } from "lucide-react";
import { toast } from "sonner";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Authenticated, Unauthenticated } from "@/components/providers/auth.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { useCreateInvestment, useDeleteInvestment, useInvestments, type Investment } from "@/lib/finance.ts";

const schema = z.object({
  name: z.string().min(1, "Name is required"), type: z.enum(["stock", "etf", "side_hustle", "savings_goal"]),
  currentValue: z.number().min(0), monthlyContribution: z.number().min(0), annualReturn: z.number().min(0).max(100),
  targetValue: z.number().min(0).optional(), targetDate: z.string().optional(), ticker: z.string().optional(), notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function InvestmentsPage() {
  return <><Unauthenticated><div className="flex flex-col items-center justify-center py-24 gap-4"><p className="text-muted-foreground">Sign in to model investment and savings goals.</p><SignInButton /></div></Unauthenticated><Authenticated><InvestmentsInner /></Authenticated></>;
}

function InvestmentsInner() {
  const { data: investments = [], isLoading, error } = useInvestments();
  const remove = useDeleteInvestment();
  const [open, setOpen] = useState(false);
  const total = investments.reduce((sum, investment) => sum + investment.current_value, 0);
  const monthly = investments.reduce((sum, investment) => sum + investment.monthly_contribution, 0);
  const projected = investments.reduce((sum, investment) => sum + projection(investment, 60).at(-1)!.value, 0);
  const chartData = useMemo(() => Array.from({ length: 61 }, (_, month) => ({ month, value: investments.reduce((sum, investment) => sum + projectedValue(investment, month), 0) })), [investments]);
  const deleteInvestment = async (id: string) => { try { await remove.mutateAsync(id); toast.success("Investment removed."); } catch { toast.error("Could not remove this investment."); } };
  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold tracking-tight">Investments & ROI</h1><p className="text-muted-foreground text-sm">Model your portfolio, side hustles, and savings goals over time.</p></div><Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Add plan</Button></div>
    {error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">Could not load investment plans: {error.message}</p>}
    <div className="grid gap-3 sm:grid-cols-3"><Metric label="Current value" value={money(total)} icon={<CircleDollarSign className="h-4 w-4" />} /><Metric label="Monthly contribution" value={money(monthly)} icon={<TrendingUp className="h-4 w-4" />} /><Metric label="Five-year projection" value={money(projected)} icon={<Target className="h-4 w-4" />} /></div>
    <Card><CardHeader><CardTitle className="text-base">Five-year projected value</CardTitle></CardHeader><CardContent>{isLoading ? <div className="h-56 animate-pulse rounded bg-muted" /> : investments.length === 0 ? <Empty onAdd={() => setOpen(true)} /> : <ResponsiveContainer width="100%" height={240}><AreaChart data={chartData}><defs><linearGradient id="investment-value" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="oklch(0.55 0.18 170)" stopOpacity={.35} /><stop offset="95%" stopColor="oklch(0.55 0.18 170)" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 10%)" /><XAxis dataKey="month" tickFormatter={(value) => value === 0 ? "Now" : `${Math.round(value / 12)}y`} tickLine={false} axisLine={false} /><YAxis tickFormatter={(value) => compactCurrency(value)} tickLine={false} axisLine={false} width={60} /><Tooltip formatter={(value: unknown) => money(Number(value))} labelFormatter={(value) => `${value} months`} /><Area type="monotone" dataKey="value" stroke="oklch(0.55 0.18 170)" fill="url(#investment-value)" strokeWidth={2} /></AreaChart></ResponsiveContainer>}</CardContent></Card>
    {!isLoading && investments.length > 0 && <div className="grid gap-4 lg:grid-cols-2">{investments.map((investment) => <InvestmentCard key={investment.id} investment={investment} onDelete={() => deleteInvestment(investment.id)} />)}</div>}
    <InvestmentDialog open={open} onClose={() => setOpen(false)} />
  </div>;
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <Card><CardContent className="flex items-center gap-3 pt-5"><div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></div></CardContent></Card>; }
function Empty({ onAdd }: { onAdd: () => void }) { return <div className="flex h-56 flex-col items-center justify-center gap-3 text-center"><TrendingUp className="h-9 w-9 text-muted-foreground" /><div><p className="font-medium">No investment plans yet</p><p className="text-sm text-muted-foreground">Add a goal to see its projected growth.</p></div><Button size="sm" onClick={onAdd}>Create your first plan</Button></div>; }
function InvestmentCard({ investment, onDelete }: { investment: Investment; onDelete: () => void }) { const fiveYears = projectedValue(investment, 60); const returnPercent = investment.current_value ? ((fiveYears - investment.current_value - investment.monthly_contribution * 60) / investment.current_value) * 100 : 0; return <Card><CardHeader className="flex flex-row items-start justify-between space-y-0"><div><CardTitle className="text-base">{investment.name}</CardTitle><p className="mt-1 text-xs capitalize text-muted-foreground">{investment.type.replace("_", " ")}{investment.ticker ? ` · ${investment.ticker}` : ""}</p></div><button onClick={onDelete} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-muted-foreground">Current value</p><p className="font-semibold">{money(investment.current_value)}</p></div><div><p className="text-xs text-muted-foreground">Monthly contribution</p><p className="font-semibold">{money(investment.monthly_contribution)}</p></div><div><p className="text-xs text-muted-foreground">5-year projection</p><p className="font-semibold text-primary">{money(fiveYears)}</p></div><div><p className="text-xs text-muted-foreground">Estimated ROI</p><p className="font-semibold text-green-500">{returnPercent.toFixed(1)}%</p></div></div>{investment.target_value && <div className="rounded-lg bg-muted px-3 py-2 text-sm"><span className="text-muted-foreground">Goal: </span>{money(investment.target_value)}{investment.target_date ? ` by ${new Date(investment.target_date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}` : ""}</div>}</CardContent></Card>; }

function InvestmentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateInvestment(); const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { type: "etf", currentValue: 0, monthlyContribution: 0, annualReturn: 7 } });
  const submit = async (data: FormData) => { setLoading(true); try { await create.mutateAsync({ name: data.name, type: data.type, current_value: data.currentValue, monthly_contribution: data.monthlyContribution, annual_return_rate: data.annualReturn / 100, target_value: data.targetValue || null, target_date: data.targetDate || null, ticker: data.ticker || null, notes: data.notes || null, start_date: new Date().toISOString().slice(0, 10) }); toast.success("Investment plan created."); reset(); onClose(); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create investment plan."); } finally { setLoading(false); } };
  return <Dialog open={open} onOpenChange={(next) => { if (!next) { reset(); onClose(); } }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Add investment or goal</DialogTitle></DialogHeader><form onSubmit={handleSubmit(submit)} className="space-y-4"><div className="space-y-1.5"><Label>Name</Label><Input {...register("name")} placeholder="e.g. Global ETF or Freelance equipment" />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>Plan type</Label><Select value={watch("type")} onValueChange={(value) => setValue("type", value as FormData["type"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="stock">Stock</SelectItem><SelectItem value="etf">ETF</SelectItem><SelectItem value="side_hustle">Side hustle</SelectItem><SelectItem value="savings_goal">Savings goal</SelectItem></SelectContent></Select></div><div className="space-y-1.5"><Label>Ticker (optional)</Label><Input {...register("ticker")} placeholder="e.g. VOO" /></div></div><div className="grid grid-cols-2 gap-3"><NumberField label="Current value" register={register("currentValue", { valueAsNumber: true })} /><NumberField label="Monthly contribution" register={register("monthlyContribution", { valueAsNumber: true })} /><NumberField label="Expected annual return %" register={register("annualReturn", { valueAsNumber: true })} /><NumberField label="Target value (optional)" register={register("targetValue", { valueAsNumber: true })} /></div><div className="space-y-1.5"><Label>Target date (optional)</Label><Input type="date" {...register("targetDate")} /></div><div className="space-y-1.5"><Label>Notes (optional)</Label><Textarea {...register("notes")} rows={2} placeholder="What does this plan represent?" /></div><DialogFooter><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create plan"}</Button></DialogFooter></form></DialogContent></Dialog>;
}
function NumberField({ label, register }: { label: string; register: UseFormRegisterReturn }) { return <div className="space-y-1.5"><Label>{label}</Label><Input type="number" step="0.01" {...register} /></div>; }
function projectedValue(investment: Investment, months: number) { const monthlyRate = Math.pow(1 + investment.annual_return_rate, 1 / 12) - 1; return investment.current_value * Math.pow(1 + monthlyRate, months) + investment.monthly_contribution * (monthlyRate ? (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate : months); }
function projection(investment: Investment, months: number) { return Array.from({ length: months + 1 }, (_, month) => ({ month, value: projectedValue(investment, month) })); }
function money(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }
function compactCurrency(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact" }).format(value); }
