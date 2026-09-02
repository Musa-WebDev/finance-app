import { useState } from "react";
import { useAccounts, useCreateTransaction } from "@/lib/finance.ts";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { format } from "date-fns";

const CATEGORIES = [
  "income", "food", "transport", "housing", "entertainment",
  "health", "savings", "investment", "other",
];

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number(),
  category: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  accountId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = { open: boolean; onClose: () => void };

export default function AddTransactionDialog({ open, onClose }: Props) {
  const createTransaction = useCreateTransaction();
  const { data: accounts } = useAccounts();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: format(new Date(), "yyyy-MM-dd"), amount: 0 },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createTransaction.mutateAsync({ name: data.name, amount: data.amount, category: data.category ?? null, date: data.date, notes: data.notes ?? null, account_id: data.accountId ?? null });
      toast.success("Transaction added!");
      reset({ date: format(new Date(), "yyyy-MM-dd"), amount: 0 });
      onClose();
    } catch {
      toast.error("Failed to add transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input {...register("name")} placeholder="e.g. Grocery run" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input {...register("amount", { valueAsNumber: true })} type="number" step="0.01" placeholder="0.00" />
              <p className="text-xs text-muted-foreground">Positive = income, negative = expense</p>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input {...register("date")} type="date" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={watch("category") ?? ""} onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Account (optional)</Label>
              <Select value={watch("accountId") ?? "none"} onValueChange={(v) => setValue("accountId", v === "none" ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(accounts ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Input {...register("notes")} placeholder="Any notes..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Transaction"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
