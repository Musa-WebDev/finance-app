import { useState } from "react";
import { useDeleteBudgetItem, useUpsertBudgetItem, type BudgetItem } from "@/lib/finance.ts";
import { toast } from "sonner";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Trash2, Check, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils.ts";

type Props = { item: BudgetItem };

const FREQ_LABELS: Record<string, string> = {
  monthly: "/mo",
  weekly: "/wk",
  annual: "/yr",
};

export default function BudgetItemRow({ item }: Props) {
  const upsertItem = useUpsertBudgetItem();
  const deleteItem = useDeleteBudgetItem();

  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(item.amount.toString());
  const [label, setLabel] = useState(item.label);

  const handleSave = async () => {
    const val = parseFloat(amount);
    if (isNaN(val)) return;
    try {
      await upsertItem.mutateAsync({
        id: item.id,
        scenario_id: item.scenario_id,
        category: item.category,
        label,
        amount: val,
        type: item.type,
        frequency: item.frequency,
      });
    } catch {
      toast.error("Failed to update item.");
    }
    setEditing(false);
  };

  const handleDelete = async () => {
    try {
      await deleteItem.mutateAsync(item.id);
    } catch {
      toast.error("Failed to delete item.");
    }
  };

  const isIncome = item.type === "income";

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/50">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="h-7 text-sm flex-1"
          placeholder="Label"
        />
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-7 text-sm w-28 text-right"
          step="0.01"
          autoFocus
        />
        <Button size="icon" variant="ghost" onClick={handleSave} className="h-7 w-7 text-green-500 shrink-0">
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => { setAmount(item.amount.toString()); setLabel(item.label); setEditing(false); }} className="h-7 w-7 shrink-0">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
      onClick={() => setEditing(true)}
    >
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-sm truncate">{item.label}</span>
        <Badge variant="outline" className="text-xs py-0 px-1.5 h-4 capitalize text-muted-foreground">{item.frequency}</Badge>
      </div>
      <span className={cn("text-sm font-semibold tabular-nums", isIncome ? "text-green-500" : "")}>
        {isIncome ? "+" : ""}{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(item.amount)}
        <span className="text-muted-foreground font-normal text-xs ml-0.5">{FREQ_LABELS[item.frequency] ?? ""}</span>
      </span>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
        <button className="cursor-pointer p-1 rounded text-muted-foreground hover:text-primary">
          <Pencil className="h-3 w-3" />
        </button>
        <button
          className="cursor-pointer p-1 rounded text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
