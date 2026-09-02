import { useState } from "react";
import { format } from "date-fns";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";
import { useDeleteTransaction, useTransactions } from "@/lib/finance.ts";
import AddTransactionDialog from "./AddTransactionDialog.tsx";

export default function TransactionsList() {
  const { data: transactions = [], isLoading } = useTransactions();
  const removeTransaction = useDeleteTransaction();
  const [showAdd, setShowAdd] = useState(false);
  const remove = async (id: string) => { try { await removeTransaction.mutateAsync(id); toast.success("Transaction removed."); } catch { toast.error("Failed to remove transaction."); } };
  return <Card><CardHeader className="flex flex-row items-center justify-between pb-3"><CardTitle className="text-base font-semibold">Transactions</CardTitle><Button size="sm" variant="secondary" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1.5" />Add</Button></CardHeader><CardContent className="pt-0">{isLoading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> : transactions.length === 0 ? <p className="text-center text-muted-foreground text-sm py-10">No transactions yet.</p> : <div className="divide-y">{transactions.map((transaction) => <div key={transaction.id} className="flex items-center gap-3 py-3"><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{transaction.name}</p><div className="flex items-center gap-1.5 mt-0.5"><span className="text-xs text-muted-foreground">{format(new Date(transaction.date), "MMM d, yyyy")}</span>{transaction.category && <Badge variant="outline" className="text-xs capitalize py-0 px-1.5 h-4">{transaction.category}</Badge>}</div></div><span className={cn("text-sm font-semibold tabular-nums shrink-0", transaction.amount >= 0 ? "text-green-500" : "text-destructive")}>{transaction.amount >= 0 ? "+" : ""}{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(transaction.amount)}</span><button onClick={() => remove(transaction.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>}</CardContent><AddTransactionDialog open={showAdd} onClose={() => setShowAdd(false)} /></Card>;
}
