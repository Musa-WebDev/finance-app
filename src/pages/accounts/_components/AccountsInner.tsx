import { useState } from "react";
import { toast } from "sonner";
import { Landmark, Plus, Trash2, CreditCard, PiggyBank, Wallet, TrendingUp, Building2 } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useAccounts, useDeleteAccount } from "@/lib/finance.ts";
import AddManualAccountDialog from "./AddManualAccountDialog.tsx";
import TransactionsList from "./TransactionsList.tsx";

const icons: Record<string, React.ReactNode> = { checking: <Wallet className="h-5 w-5" />, savings: <PiggyBank className="h-5 w-5" />, credit: <CreditCard className="h-5 w-5" />, loan: <Building2 className="h-5 w-5" />, investment: <TrendingUp className="h-5 w-5" /> };
const colors: Record<string, string> = { checking: "bg-blue-500/10 text-blue-500", savings: "bg-yellow-500/10 text-yellow-500", credit: "bg-red-500/10 text-red-500", loan: "bg-orange-500/10 text-orange-500", investment: "bg-accent/10 text-accent" };

export default function AccountsInner() {
  const { data: accounts = [], isLoading } = useAccounts();
  const removeAccount = useDeleteAccount();
  const [showManual, setShowManual] = useState(false);
  const assets = accounts.filter((a) => !["credit", "loan"].includes(a.type)).reduce((sum, a) => sum + a.balance, 0);
  const liabilities = accounts.filter((a) => ["credit", "loan"].includes(a.type)).reduce((sum, a) => sum + a.balance, 0);
  const groups = accounts.reduce<Record<string, typeof accounts>>((all, account) => { const key = account.institution ?? "Manual Accounts"; (all[key] ??= []).push(account); return all; }, {});
  const remove = async (id: string) => { try { await removeAccount.mutateAsync(id); toast.success("Account removed."); } catch { toast.error("Failed to remove account."); } };
  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight">Accounts</h1><p className="text-muted-foreground text-sm">Manage your connected and manual accounts.</p></div><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setShowManual(true)}><Plus className="h-4 w-4 mr-1.5" />Manual</Button><Button size="sm" onClick={() => toast.info("Plaid should be added through a secured Supabase Edge Function.")}><Landmark className="h-4 w-4 mr-1.5" />Connect Bank</Button></div></div>
    {!isLoading && accounts.length > 0 && <div className="grid grid-cols-3 gap-3">{[["Total Assets", assets, "text-green-500"], ["Total Liabilities", liabilities, "text-destructive"], ["Net Worth", assets - liabilities, assets >= liabilities ? "text-primary" : "text-destructive"]].map(([label, value, color]) => <Card key={String(label)}><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-lg font-bold ${color}`}>{fmt(Number(value))}</p></CardContent></Card>)}</div>}
    {isLoading ? <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div> : accounts.length === 0 ? <div className="flex flex-col items-center justify-center py-24 gap-4 text-center"><div className="p-4 rounded-full bg-muted"><Landmark className="h-10 w-10 text-muted-foreground" /></div><h2 className="text-lg font-semibold">No accounts yet</h2><p className="text-muted-foreground max-w-sm text-sm">Add an account manually to start tracking your finances.</p><Button onClick={() => setShowManual(true)}><Plus className="h-4 w-4 mr-1.5" />Add Manually</Button></div> : <div className="space-y-6">{Object.entries(groups).map(([institution, entries]) => <div key={institution} className="space-y-3"><h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{institution}</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{entries.map((account, index) => <motion.div key={account.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }}><Card><CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0"><div className="flex items-center gap-2"><div className={`p-2 rounded-lg ${colors[account.type] ?? "bg-muted"}`}>{icons[account.type] ?? <Wallet className="h-5 w-5" />}</div><div><CardTitle className="text-sm">{account.name}</CardTitle><Badge variant="secondary" className="text-xs mt-0.5 capitalize">{account.type}</Badge></div></div><button onClick={() => remove(account.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-3.5 w-3.5" /></button></CardHeader><CardContent><p className={`text-2xl font-bold ${["credit", "loan"].includes(account.type) ? "text-destructive" : ""}`}>{fmt(account.balance)}</p><p className="text-xs text-muted-foreground mt-0.5">{account.currency} · {account.is_manual ? "Manual" : "Plaid"}</p></CardContent></Card></motion.div>)}</div></div>)}</div>}
    {!isLoading && accounts.length > 0 && <TransactionsList />}
    <AddManualAccountDialog open={showManual} onClose={() => setShowManual(false)} />
  </div>;
}
function fmt(value: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }
